<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com> -->
# Functions for data, generated constants only for codes

Status: SPEC, and the C loader below is built (`include/omxcontract/omx_domain.h`, `src/c/`, `make test-c`). The owner has
ruled its questions (see "Rulings" at the end); nothing else is built until the moves of the domains do it. It follows the design direction on omx-contract#81 (the comment "functions
instead of generators in contracts?") and builds on the domain model of docs/contract-dir.md ("Domains").

## The rule

**Data is read at run time by functions. A constant is generated only for a code that code branches on.**

- A DATUM is anything a program reads and does not branch on at compile time: a description, a catalog sentence or
  its translation, a range, a unit, a default, a group, an order, a word list a UI shows, the shape a document must
  have. It lives in the installed domain document, `<contractdir>/<domain>/<domain>.json` and its
  `catalogs/<lang>.json` (docs/contract-dir.md), and a function reads it.
- A CODE is a value the compiler must see: the enum value a C `switch` branches on, a refusal code a caller compares,
  a struct layout. It is generated into a header, because a `case` label, an array bound or a `static_assert` cannot
  be read from a file.
- Nothing in the audio thread reads a file, calls a loader function or parses JSON. A program reads what it needs once,
  at start-up, and keeps its own copy.

Why the rule:

- Most generated files, and the byte-identity checks that hold each to its data, go away. A render that is not
  committed cannot drift.
- A contract minor that changes no code needs no regeneration in a consumer. The case that shows it: a release settle
  refused on three values that a consumer had compiled in from 3.18, against an installed 3.19.1. The values were
  data; had the consumer read them at start-up from the installed domain, the installed document would have been the
  only copy and there would have been nothing to refuse.
- A domain's words stay its owner's. A consumer that reads them at run time holds no copy of them, so a lower layer
  cannot hold a higher layer's words by accident (the first ruling of omx-contract#81).

**Precedents.** The rule is how other plugin and system stacks already work:
- LV2: a host reads each plugin's `.ttl` at run time, and new vocabulary arrives as namespaced extensions.
- PipeWire's SPA: enum ids are compiled constants, and a node's `PropInfo` (names, ranges, defaults) is asked at run time.
- D-Bus: introspection answers an object's interfaces from the running service.
- Kubernetes custom resources: each group/version publishes an OpenAPI schema that clients read rather than compile in.

## Where the data comes from

The installed contract directory, `contract.d/<domain>/`, the one the reader already finds through
`pkg-config --variable=contractdir omx-contract` (docs/contract-dir.md). A domain is read by name, and its
`info.version` is compared to the floor the consumer declares (`needs`). Nothing else is a source: no copy in the
consumer's tree, no default compiled in.

Every domain document carries `info.x-stability`: `experimental` or `stable`. This follows Kubernetes' alpha, beta and
stable API levels and LV2's unstable extensions. While the project is in development every domain is `experimental`.
A domain becomes `stable` only at a release, when the owner rules on its compatibility; until then its shape may change
without a compatibility mechanism.

A missing or invalid installed domain is a LOUD REFUSAL AT START-UP: the program exits with a message that names the
domain, the place looked, and the reason (absent, unreadable, not valid against the schema it declares, below the
floor). It never continues on a built-in default, never reads "what it can", and never retries silently. This is the
refusal the codes of docs/contract-dir.md already name for a reader (`contract.dir.absent`,
`contract.file.invalid`, `contract.manifest.invalid`); the loader returns them and the program turns them into its
exit.

A test points the loader elsewhere through a path argument of a separate, test-only entry point (`omx_domain_open_at`,
below). A production entry point takes no path and reads no environment variable: a stray variable in a service's
environment must not change which vocabulary it runs on. `OMX_CONTRACT_PATH` is read only by test harnesses and by the
command-line tool, which pass it to `omx_domain_open_at`; `omx_domain_open` never reads it. A production program reads
the installed path, and when no domain is found there it refuses (ruling 2).

## The C loader

A small family in one header, `omxcontract/omx_domain.h`, written by hand and documented like every installed header
(docs/render.md "Documentation"). The signatures below are the header's, shortened; the header carries the full documentation.

```c
typedef struct omx_domain omx_domain;            /* an opened, validated domain; opaque */

/* A function returns 0, or the value of a CONTRACT_CODES code, a constant of the generated omx_contract_codes.h:
   OMX_CONTRACT_CODE_DIR_ABSENT, _FILE_NOT_JSON, _FILE_INVALID, _MANIFEST_INVALID, _PACKAGE_TOO_OLD, _ITEM_UNKNOWN,
   _WORD_UNKNOWN, _INDEX_RANGE. A value is the code's place in data/codes.json, from 1, and never moves. */
const char *omx_domain_code(int status);         /* the string of a value, "contract.dir.absent" ...: for a message */

typedef struct { const char *code;               /* a code of CONTRACT_CODES, e.g. "contract.dir.absent" */
                 char message[256]; } omx_domain_error;   /* names the domain, the place and the reason */
typedef struct { const char *word, *title, *description; int code; } omx_domain_word_info;
typedef struct { double min, max, def; int has_default; const char *unit, *scale; } omx_domain_range_info;

/* Open <domain> from the installed contract directory and validate it; needs_version is the floor ("1.2.0") or NULL.
   Returns 0 and *out, or a code value and *err (never both). Start-up only. */
int  omx_domain_open(const char *domain, const char *needs_version, omx_domain **out, omx_domain_error *err);
/* The same from <dir>/<domain>/. TEST ONLY: a production binary does not call it. */
int  omx_domain_open_at(const char *dir, const char *domain, const char *needs_version,
                        omx_domain **out, omx_domain_error *err);
/* Open or exit: prints err->code and err->message to stderr and exits with status 78 (EX_CONFIG). The start-up of a daemon. */
omx_domain *omx_domain_open_or_exit(const char *domain, const char *needs_version);
void omx_domain_close(omx_domain *d);

/* A word of an item: the word as written, its title (the key), its one-line description, its code. */
int  omx_domain_word(const omx_domain *d, const char *item, const char *word, omx_domain_word_info *out);
int  omx_domain_word_count(const omx_domain *d, const char *item);               /* in declared order; -1: no such item */
int  omx_domain_word_at(const omx_domain *d, const char *item, int index, omx_domain_word_info *out);

/* A range, unit and default of a parameter of a range item: min, max, default, unit, scale. */
int  omx_domain_range(const omx_domain *d, const char *item, const char *name, omx_domain_range_info *out);

/* The sentence a person sees for a word ("<ITEM>.<word>") in <lang>, else the English source sentence. */
const char *omx_domain_text(const omx_domain *d, const char *key, const char *lang);
```

- **Return values.** Every function returns 0 on success, and on failure the integer value of a code of
  `CONTRACT_CODES`, a constant of the generated header `omxcontract/omx_contract_codes.h` (`OMX_CONTRACT_CODE_ITEM_UNKNOWN`
  and the rest, rendered from `data/codes.json`; a value is the code's place in that table, and a code is appended,
  never moved). A program compares the constant; `omx_domain_code` gives the code's string for a message.
  `omx_domain_text` alone returns NULL: when the key is no word of the domain, and when the word has no source sentence
  (no `x-text`; the catalog's sentence for it is still returned in a language the catalog holds). `omx_domain_word_count` returns -1
  when there is no such item. Opening refuses with the reader's existing codes (`contract.dir.absent`,
  `contract.file.not-json`, `contract.file.invalid`, `contract.manifest.invalid` for an `$id` that is not the domain's,
  `contract.package.too-old` for an `info.version` below the floor). A lookup fails with one of three codes the loader
  adds to `CONTRACT_CODES`, each with its sentence and its translations: `contract.item.unknown` (no such item in the
  domain), `contract.word.unknown` (no such word or name in the item; an item that has no words has no word) and
  `contract.index.range` (an index below 0 or at the item's count and above). A refused call leaves its output as it
  was: none of them returns a default value.
- **What it reads.** A words item is a `components.schemas` entry with a `oneOf` of words, a range item one with
  `properties` of named parameters (docs/contract-dir.md, "Domains"); a schema with neither is not served. A domain name is a slash-separated path
  (`dsp/kernels`, docs/contract-dir.md): each segment a name of letters, digits, `-` and `_`, never empty, `.` or `..`, no
  leading or trailing `/`; the document is `<contractdir>/dsp/kernels/kernels.json`, named by the last segment, and an invalid
  name is refused with `contract.file.invalid` before any file is read. Open checks
  the structure of what the functions read (the required fields, their types, `info.version` against the floor), so no
  function answers from a document that is not of that shape. The FULL JSON Schema validation of a domain is done at
  package build, by the owner's build (Ajv, `jsonschema`; `omx-contract validate`), never in C: no validator is written
  or vendored in C (ruling 1). A catalog entry is read for its
  `text`; a model's entry whose source sentence has changed is not recognised as stale (the TypeScript and Python readers
  do), so the C loader shows it until the catalog is regenerated.
- **Ownership and lifetime.** At open the handle copies everything it will return into its own immutable storage,
  and releases the JSON library's document before `omx_domain_open` returns; sharing between threads never rests on
  the JSON library's internals. A `const char *` and every pointer inside an `omx_domain_word_info` or
  `omx_domain_range_info` points into that storage, is valid from the call until `omx_domain_close`, is never modified
  and never freed by the caller, and may be shared between threads after `omx_domain_open` returns. A program that needs a value after close, or in a
  thread with a real-time deadline, copies it at start-up into storage of its own.
- **Never in the audio thread.** The family allocates (open parses and validates the document) and looks up by string.
  The header says so in its `@file` block, and a program calls it only from its start-up path. A value the audio
  thread needs is copied into a plain struct of the program's before the thread starts.
- **Validation at open.** `omx_domain_open` checks the document before it returns (see "What it reads"), so a function
  never returns a value from a document that is not of the shape it reads: `$id` is the domain's, `info.version` and
  `info.x-owner` are there, every word and every range is complete, a word is declared once. A `$ref` to another domain,
  resolved by `$id` from the same installed directory, is not read yet: a domain document refuses `$ref` today
  (docs/contract-dir.md, omx-contract#84), and the loader follows when the reader does.
- **One parser, from the distribution.** The loader reads JSON with a library the distributions package (jansson or
  json-c, both on Fedora and Debian); the project writes no JSON parser of its own and vendors none (ruling 1). The
  loader is the only C code that reads a domain; a program holds no parser of its own for contract data.

## TypeScript and Python

No generator for either. The domain document is JSON Schema 2020-12 data, and each language reads it with a standard
tool.

- **TypeScript.** The types come from the schema as a TypeScript type, `FromSchema<typeof schema>`
  (json-schema-to-ts), not from a rendered `.d.ts`. The schema is imported as a typed constant from the owner's package
  at the version floor the consumer declares; the consumer keeps no copy of it, and no file is written. At run time the
  installed JSON is loaded and validated with a standard JSON Schema validator (Ajv, for example), and its
  `info.version` is checked to be at least the consumer's need. A missing, invalid or too-old document throws at
  start-up with the same message the C loader prints.
- **Python.** Load the installed JSON and validate it with `jsonschema` (Draft 2020-12). No `TypedDict` render.
- The catalog readers that already exist (`@openmixer/omx-contract/catalog`, `omx_contract_catalog.py`,
  docs/data-layout.md) read installed JSON at run time and are in the spirit of the rule; they stay.

## What stays generated, and why

| Stays generated | Why |
|---|---|
| The codes headers: the enum values and refusal codes C switches on, `<domain>_codes.h` | A `case` label needs a compile-time constant. This is the one generated artifact of a domain, and it holds codes only: no description, no text, no word list. |
| ABI structs and their layout checks | A struct is a compile-time layout shared by two binaries; a function cannot declare one. The struct stays the ABI and the schema its JSON form, held equal by a conformance test in the owner (docs/data-layout.md "The renders"). |
| The LV2 and MOD GUI files (the Turtle manifests, the GUI bundles) | A build artifact: a host reads them from the installed bundle, not from our loader, and they are made once at package build from the data. |
| Packaging lists (file lists of the rpm and the deb) | A build artifact of the package build, read by the packaging tool before any program of ours runs. |
| The site | A build artifact: static pages made from the data at release, read by a browser, not by our code. |
| WebAssembly: the codes only | The module is built from C, so the codes it switches on are compiled in. Its data is not: the module is HANDED the domain document at start-up by the page that loads it, since a browser has no installed contract directory (ruling 8). |

The test for a new generated file is the rule's: does a compiler, a packager or a host other than ours need it before
a program of ours runs? If not, it is a function.

## Other generated files

The same rule reaches past the contract's own renders: no copy of data is committed where it can be built or answered.

| File | From now |
|---|---|
| The protocol pages (`doc/protocol.md` of plugin-hostd-protocol) | Built by the site from the protocol JSON (`protocol/plugin-hostd-protocol.json`); no committed page. plugin-hostd answers a `help` verb from its own protocol data, so the running host is the reference too. |
| The console's reference docs | Built at site build from the console's sources; no committed copies in the site repository. |
| The console's REST API description | Produced by the console's code from its routes and entities, served at `/api/openapi.json`; no hand-kept or generated OpenAPI file. |

These stay generated, as build inputs or test oracles rather than data a program reads:

| Stays generated | Why |
|---|---|
| The dependency lines of the rpm spec and the debian control, from `packaging/deps.txt` | A packaging artifact, read by the packaging tool; one declared list, rendered into both. |
| Goldens, ABI baselines and recorded fixtures | Test oracles: a recorded answer the test compares against, committed on purpose so a change shows in review. |
| Machine-drafted translations | Data: a draft a person reviews, stored as the catalog the loader reads, not code. |

## The migration

Each domain moves to its owner (omx-contract#81, docs/contract-dir.md "What omx-contract owns"). As it moves, it ships
its JSON and its catalogs, and **a codes header only, with no other render**. omx-contract is left holding the
loader, the validator and the ownership gate, and the codes header generator.

The renders of docs/render.md that stop, and what replaces each:

| Render that stops | Replaced by |
|---|---|
| The words, `_COUNT`, `_INIT`, `_TEXT_EN` and `_ARGS_*` macros of `omx_vocabulary.h` and of each `<stem>_vocabulary.h` / `omxdomain/<domain>_vocabulary.h` | The codes header keeps the values C branches on; the words, counts and sentences are read by `omx_domain_word`, `omx_domain_word_count` and `omx_domain_text`. |
| `omx-vocabulary.schema.json`, the resolved JSON fragment of the words (`x-omx-texts` included) | The domain document itself, which is the installed JSON Schema; a schema that references a word references the domain by `$id`. |
| The TypeScript `<stem>-vocabulary.js` and `.d.ts`, `<ITEM>_WORDS` | The installed JSON, a standard validator, and `FromSchema<typeof schema>`. |
| The Python vocabulary module of `omx_contract.py` and the `omx_contract.clap` submodule's word lists | The installed JSON and `jsonschema`. |
| The `numbers`, `scalars`, `limits` and `table` sections of an owner's headers (`clap_host_limits.h`, `omx_contract_limits.h`, the `<table>(X)` X-macros) | `omx_domain_range` for a range, unit, default or limit read at start-up. A number the compiler needs (an array bound, a `static_assert`) is a code: it stays in the codes header. Only a limit that sizes an array or a buffer in C, the real-time kind, is a code; every other range is read at start-up (ruling 3). |
| The `<stem>_host_verbs.h` verb tables and `<stem>_host_verbs()` | The verb word, as a code, in the codes header; its arguments, format and descriptions are read from the domain: the name and its code are code (the switch), the rest is data (ruling 4). |
| The shapes renders of docs/shapes.md: the TypeScript interface (`json-schema-to-typescript`) and the Python `TypedDict` (`datamodel-code-generator`) | `FromSchema` and `jsonschema`. The two pinned generators, their requirements file and the drift check of `render --shapes` for those targets go. The C key X-macros stay only where C uses them as fields or enum values; elsewhere they go (ruling 5). |
| The `--check` byte-identity gates of all the above, in each consumer and in the owner | Nothing: the file they held no longer exists. A codes header keeps one `render --check`, at its owner's build. |

The doxygen baseline (docs/render.md "Documentation") shrinks with the headers; the loader header is documented in full
and adds no line to it. The data of every domain, its `info.version` and its `x-owner` do not change by this spec.

A domain that has not moved keeps its current renders until it moves; the renders above stop domain by domain, in the
same order as the moves of omx-contract#81, one change each, red first. A consumer switches in the same step as its
domain: it drops the include or the module the render gave and calls the function. This spec proposes no shim, no
dual header and no period in which both paths exist; one would need the owner's approval, and none is proposed.

**The omx-dsp domains.** omx-dsp publishes a family of four domains:
- `dsp/kernels`: every kernel's parameters (names, ranges, defaults, units, groups). This is the parameter table of the generic face's descriptor (omx-dsp#97), so one document feeds the face, omx-panel and the plugins.
- `dsp/curves`: the curve families, their axes and their roles.
- `dsp/rates`: the standard rates, quanta and real-time targets.
- `dsp/meters`: the readout rates and the meter shapes.

The moves of omx-contract#81 bring omx-contract's curve kinds and axes, its rates and its readout rate there. The move also runs the other way: the curve origins and the operator EQ band reserve of omx-dsp's `eq.json` move to the console's domain `console/eq` (`x-owner: openmixer`), since they are the console's words, not the kernel's. Under this rule omx-dsp's C keeps only the codes it switches on (a buffer-sizing limit among them, ruling 3) and reads nothing in the audio thread: a face resolves its parameters at start-up.

## Panels and stored data

- **Panels.** The MOD GUI bundles and the LV2 `.ttl` files are made at package build (a host reads them from the
  installed bundle). A panel's colours reach a web surface as CSS custom properties read at run time (`tokens.css`),
  not as a generated module. A panel's description is answered by a function of the panel package
  (`omx_panel_describe`), not by a committed render.
- **Qualifications** are stored data, not contract data: a SQLite database in two layers, the shipped base and the
  user's own, each row keyed by the plugin binary's SHA-256, so a rebuilt plugin is never read with another binary's
  results.
- **The storage rule.** Small documents a person authors are JSON (a domain, a catalog, a preset). Data measured at
  run time is SQLite. Neither is turned into code.

## Rulings

The owner's answers to the questions this spec left open (2026-11-18):

1. **The C JSON reader** is a distribution library, jansson or json-c (packaged on Fedora and Debian). The project
   never writes or vendors its own.
2. **`OMX_CONTRACT_PATH`** is a test and development override only. Production reads the installed path; when no
   domain is found there, the program refuses.
3. **Codes** are only the limits that size arrays or buffers in C, the real-time kind. Every other range is read at
   start-up.
4. **Verbs.** The name and its code are code (the switch a handler dispatches on); the arguments and the descriptions
   are data.
5. **Shape X-macros** stay only where C uses them as fields or enum values; elsewhere they are dropped.
6. **A refused start-up exits 78** (EX_CONFIG), in every program of the project.
7. **The resolved JSON render** stays a command-line tool for viewing and debugging. Its output is never committed.
8. **WebAssembly** is handed its data at start-up; only the codes are built in.
