<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com> -->
# The render word: an owner's own renders

A package that owns definitions commits the C headers and the TypeScript module of its own items, held equal to them
by `render --check`. How they are framed and spelled is declared beside the items, in a file's `render` word, and the
tool reads the word. The tool itself names no item: an owner's spelling lives in the owner's files and nowhere else.

A proposed spec, [runtime-data.md](runtime-data.md), has most of the renders on this page stop as each domain moves to
its owner: data is read at run time by functions, and only the codes a compiler needs stay generated. Until it is
ruled and a domain moves, this page describes how that domain is rendered.

```json
{ "$schema": "../schema/omx-contract.schema.json",
  "requires": { "omx-contract-schema": ">= 2.15.0" },
  "render": {
    "c": [
      { "header": "clap_host_limits.h", "guard": "CLAP_HOST_LIMITS_H", "project": "omx-clap-host",
        "banner": ["Rendered from HOSTED_STAGE_LIMITS and HOSTING_CODES of data/hosting.json, ..."],
        "brief": "The limits and refusal codes of the hosting code.", "includes": ["stddef.h"],
        "numbers": { "comment": "the stage and the host: every number the core reads", "prefix": "CLAP_HOST_",
                     "omit": ["worker*"], "levels": "*Dbfs" },
        "codes": { "comment": "the refusals the core returns", "prefix": "CLAP_HOST_CODE_" } },
      { "header": "hosted_stage_limits.h", "guard": "HOSTED_STAGE_LIMITS_H", "project": "omx-clap-host",
        "banner": ["..."], "brief": "The hosted stage's numbers, as the OMX_HOSTED_STAGE_ names a host reads.",
        "scalars": { "comment": "every number of the stage, sorted by name" } } ],
    "ts": { "module": "omx-clap-core-hosting" } },
  "HOSTED_STAGE_LIMITS": { "kind": "sheet", ... },
  "HOSTING_CODES": { "kind": "codes", ... } }
```

## A header

| Word | Meaning |
|---|---|
| `header` | The header's path, under the output directory of `render --package`. |
| `guard` | The include guard. |
| `project` | The project its licence block names ("This file is part of ..."). |
| `banner` | The lines of the GENERATED comment after its first line: what the file is rendered from, in the owner's words. |
| `brief` | The `@brief` of its `@file` block. |
| `includes` | System headers it includes, in order. Optional. |
| `scope` | Which items its sections read: `file` (the default), the items of the file that declares it; `package`, every item of its package. |

and one section or more, in this order:

| Section | What it renders |
|---|---|
| `numbers` `{ comment, prefix, omit?, levels?, table? }` | Every sheet: field `f` as `<prefix><F>`, `F` in upper snake case; a field matching `levels` (a glob) is a level, a float literal, every other a non-negative integer, an unsigned literal; fields matching `omit` are left out. Each define carries the field's `docs` line as a trailing `///<` comment. With `table`, the same fields once more as the X-macro `<table>(X)`, one `X(<value>, "<field>")` per field in the sheet's order: a consumer that names a value at run time (omx-clap-core's unit words) expands it instead of typing the table again. |
| `codes` `{ comment, prefix }` | Every codes item: code `n` as `<prefix><N>`, a string literal, with its `doc`. |
| `scalars` `{ comment }` | Every number spelled `OMX_<macro>` as `omx_contract_limits.h` spells it, sorted by macro. |
| `limits` `{ comment? }` | Every section of `omx_contract_limits.h`, the same defines under the same comments: the tables, scalars, lists, sets and readouts. With `scope: package` this is an owner's whole header (omx-dsp's `omxdsp/omxdsp_definitions.h`). |

A words item's X-macro in `omx_vocabulary.h` is `OMX_<ITEM>(X)`, except for a name a released sheet header defines: the renderer holds that list (`RELEASED_SHEET_TABLES`, today `OMX_PARAM_UNITS`, the code sheet's table in `omx_param_units.h`), and such an item's X-macro is `OMX_<ITEM>_WORDS(X)`, so `PARAM_UNITS` is `OMX_PARAM_UNITS_WORDS(X)`. The list is fixed, not read from the renders present: the sheet and its header move to omx-clap-core, and the name stays the same there (omx-contract#151). A words item has no slot to name its macro; the list is the rule.

A glob is a name, its start (`worker*`), its end (`*Dbfs`) or a part (`*Ring*`). `validate` refuses (rule `render-c`)
a section with nothing to render, a number that is neither a level nor a non-negative integer, a prose of more than one
line and two files that declare one header; the schema refuses an unknown word.

## The module

`ts.module` names the TypeScript module of the file's items: `<module>.js` and `<module>.d.ts`, each item exported
under its name with its literal type, as the whole ts render writes it; two files naming one module are refused.

## Rendering

```sh
omx-contract render --target c|ts --package <owner> --out <dir> [--check] [--data data | --contract-dir <dir>]
```

`--package` renders only that package's headers (c) or modules (ts), at their paths under `--out`; `--check` compares
exactly those files, so the owner's other files beside them are never reported as extra. Read from a contract
directory the package is one installed there; read from `--data` the data directory is the owner's own tree and is the
package named. Every reference resolves over the whole read. The json render is the whole read and takes no
`--package`.

Beside its headers and modules, `--package` renders the package's vocabulary: every codes and words item of its files
that carry no `render` word, spelled by kind exactly as the whole read spells it (docs/data-layout.md), so a file moves
between packages byte for byte and its C names do not change. A code is `OMX_` and the code in upper snake case, never
its key; a word is `OMX_<ITEM>_<NAME>`, each words item with its `_COUNT` and `_INIT`. The c target writes
`<stem>_vocabulary.h` (guard `<STEM>_VOCABULARY_H`), the ts target `<stem>-vocabulary.js` and `.d.ts` (each item
exported under its name, and `<ITEM>_WORDS`), at the top of `--out`. The stem is the package's name, `omx` for
omx-contract: `render --target c --package omx-contract --out include/omxcontract` is `omx_vocabulary.h` byte for byte,
and omx-clap-core's is `omx_clap_core_vocabulary.h`, guard `OMX_CLAP_CORE_VOCABULARY_H`, so the two include together.
A package with no such item renders no vocabulary file.

A domain (docs/contract-dir.md, "Domains") renders ONE file, its codes header, and nothing else (docs/runtime-data.md:
its data is read at run time). `render --target c --package <domain>` writes `<domain>_codes.h`, guard
`OMX_<DOMAIN>_CODES_H`, installed as `<includedir>/omxdomain/<domain>_codes.h`; `<DOMAIN>` is the domain's name in
upper snake case, a `/` an `_` (`dsp/kernels`: `dsp_kernels_codes.h`). It holds the items marked `"x-c-codes": true`
(docs/contract-dir.md), the whole item, and no other. `<ITEM>` is the item's name in upper snake case, and every item
name of a domain starts with the domain's (`DSP_KERNELS_...` in `dsp/kernels`), so the domain is never spelled twice:

- per word, in declared order, `#define OMX_<ITEM>_<WORD> <code>`: `<WORD>` the word's title (its key) in upper snake
  case, `<code>` its `x-code` as an unsigned literal;
- per item, `#define OMX_<ITEM>_COUNT <n>`, its number of words;
- an item ALSO marked `"x-c-xmacro": true` (ruling 5: C uses it as struct fields or enum values) adds the X-macro
  `OMX_<ITEM>(X)`, one `X(OMX_<ITEM>_<WORD>, <WORD>)` per word in declared order.

For example, the domain `panel`, its item `PANEL_FAMILIES` marked `"x-c-codes": true`, and its word `utility` with
`x-code` 12 give `#define OMX_PANEL_FAMILIES_UTILITY 12u` in `omxdomain/panel_codes.h`.

Nothing else: no `_INIT`, no `_TEXT_EN`, no `_ARGS_*`, no word string, no description, no X-macro without
`x-c-xmacro`, and no ts or python target. An item without `x-c-codes` renders nothing; a domain with no marked item
renders no header.

A domain may instead render as its data form does (3.21.0, omx-contract#139): there is no second renderer. The owner
renders its package as it does today, with the domain beside its data: `render --target c|ts --package <pkg> --data
data --with-domain contract.d/<domain>` rebuilds the data files the domain came from, adds the files still in `data/`,
and runs the data reader and the renders unchanged on that set. The files come out byte for byte those of the data form
(omx-clap-core's `clap_host_limits.h`, `hosted_stage_limits.h`, `omx-clap-core-hosting.{js,d.ts}`,
`omx_clap_core_vocabulary.h` and `omx-clap-core-vocabulary.{js,d.ts}`, the last two also rendering `data/verbs.json`).
The rebuild, and nothing else:

- an item carries `x-file`, the data path it came from (`hosting.json`, `hosting/clap.json`); the items of one
  `x-file` make that file, in the document's order. An item with no `x-file` is read at run time only: it is not
  rebuilt and not refused (plugin-db's `PLUGIN_DB_ADDRESS_FORMATS` beside its rebuilt words items), so its words never
  reach a data render;
- the root's `x-render` is the `render` block of the file the root's `x-file` names (`hosting.json`); the other
  rebuilt files carry none, so which items render themselves and which go to the vocabulary is what it is today;
- every item carries `x-source` (its data `source`, when it had one), `x-since`, `description` and `x-why` (its data
  `why`, when it had one) as today; every rebuilt item starts `{ "kind", "since", "source", "doc", "why" }`, in that
  order;
- an item with `"x-kind": "codes"` (or no `x-kind`) is the data item `{ "kind": "codes", ..., "codes" }`: each of
  its `oneOf` words is one code in the written order, `const` the code, `x-name` its key (the macro stem,
  `clapExtensionsNotCovered`), then `description` its doc, `x-text` its English text (`{ "en": <x-text> }`; the other
  languages are the domain's catalogs) and `x-args` its args;
- an item with `"x-kind": "words"` is the data item `{ "kind": "words", ..., "groups", "words" }`: `groups` is its
  `x-groups`, and each of its `oneOf` words is one word in the written order, keyed by its `title`, as
  `{ "word": <const>, "group": <x-group>, "from": [<ITEM>#<x-term>...], "doc", "text", "args" }`, each key only when
  the word has it (plugin-db's `PLUGIN_DB_*` words items, which its own renders then read unchanged). The `x-from`
  of a rebuilt word reaches omx-contract's terms (the schema package), the document's own domain, its `info.x-owner`
  or a package the document declares in `info.x-requires` (docs/contract-dir.md, "Domains"); a `from` into any other
  package is refused by item, word, `x-from` and package (`contract.file.invalid`). An item with no `x-file` is never
  rebuilt, and its `from` is not checked here. A `from` may name a word of a words item as `<ITEM>#<title>`, as well as
  a term (docs/contract-dir.md, "Domains"); either is written into the rebuilt word as it stands, and the read of the
  contract directory resolves it. A from renders nothing in a header: the referencing word renders from its own
  `const`, `title` and `x-text`, as a word with a terms reference does (only the LV2 hints Turtle reads a `from`, and
  only a terms one);
- a word's `x-symbol` and `x-dimension` are its `symbol` and `dimension`, written after `word`, and an item's
  `x-dimensions` its `dimensions`, after `groups` (3.21.0, `PARAM_UNITS`);
- an item with `"x-kind": "set"` is the data item `{ "kind": "set", ..., "ids": [<const>...], "default": <x-default> }`
  (3.21.0, `PARAM_SCALES`);
- an item with `"x-kind": "verbs"` is the data item `{ "kind": "verbs", ..., "verbs" }`, each verb keyed by its
  `title` as `{ "verb": <const>, "format", "reply", "codes", "implementedBy", "since", "doc" }`; a code's `x-resp` and
  `x-transient` are its `resp` and `transient`, written after `code` (3.21.0, plugin-hostd-protocol's verbs);
- an item with `"x-kind": "terms"` is the data item `{ "kind": "terms", ..., "format", "spec", "version",
  "deprecated", "terms" }`, each term keyed by its `const` as its `x-term` (3.21.0, the LV2 and CLAP terms);
- an item with `"x-kind": "scalar"` is the data item `{ "kind": "scalar", ..., "unit": <x-unit>, "value": <x-value> }`
  (plugin-db's `PLUGIN_DB_PIN_SHA256_HEX_LEN`); it has no `oneOf`;
- an item with `"x-kind": "sheet"` is the data item `{ "kind": "sheet", ..., "value": <x-value>,
  "docs": <x-docs> }`, verbatim; it has no `oneOf`, so the loader's word lookups do not see it.

A domain that declares `info.x-requires` gives every file it rebuilds a `requires`, its first key: the schema floor
`"omx-contract-schema": ">= 3.0.0"`, then the declared packages in name order with their floors. A domain that declares
none rebuilds its files with no `requires`, as before.

A file both in `data/` and rebuilt from the domain (one `x-file` path) is refused by name: one source per file.

The same rebuild serves a render of an installed contract directory: `render --target c|ts --package <pkg> --installed
--with-domain <contractdir>/<domain>` (or `--contract-dir <dir>`) rebuilds the domain's data files into the installed
package its `info.x-owner` names, each at the place that package's own file would have (`<package>/<x-file>`, or the
manifest's `tree`), and reads them with the package's installed files; the domain directory of that name is then not
also read as a domain. A consumer that renders another owner's vocabulary from the installed directory (the protocol's
`plugin_db_vocabulary.h`) gets the bytes the owner's data form gave. Refused by name: an `info.x-owner` that is no
installed package (`contract.package.absent`), a file the package both installs and rebuilds
(`contract.manifest.mismatch`), a package `info.x-requires` declares that is not installed or is below its floor
(`contract.package.absent`, `contract.package.too-old`), and a rebuilt word's term that the package or domain its
`x-from` names does not declare (`contract.ref.unresolved`, `contract.ref.undeclared`, naming the word, the item and
both packages). A
domain without these words renders as above (index macros and `_COUNT`): `scan` and every domain today are unchanged.
The data form stays what it is.

Byte identity is held by three checks. omx-contract's own test converts omx-clap-core's `data/hosting*.json` into a
domain and `cmp`s the five outputs of the combined read against the pure data render (a changed `x-text`, `x-value`
or `x-file` is red). test/domain-kinds.test.mjs holds one item of each kind (codes with `x-args`, words with groups,
`from`, args and a catalog in a second language, scalars, codes without args and a sheet) to golden data files byte for
byte, and the c and ts renders of `--with-domain` to those of the golden data. The owner commits the rendered files and runs `render --check` with `--with-domain` at its own
build and in its CI (omx-clap-core: `make check-domain`), so a domain edit that is not re-rendered is red there. The owner commits its codes header and runs `render --check` on it at its own build, so a code
added to a domain needs no omx-contract release.

`--package` renders the package's verbs the same way, by kind (docs/contract-dir.md "A package's verbs"): every verb of
its `verbs` items as `<stem>_host_verbs.h` (guard `<STEM>_HOST_VERBS_H`), omx-clap-core's `omx_clap_core_host_verbs.h`.
A verb is `OMX_VERB_<VERB>` and `OMX_VERB_<VERB>_FMT`, spelled alike in every header, so the whole read's header and a
package's include together; the table is `<stem>_host_verbs()`. A package that declares no verb renders no verbs file.

The render of a whole read (no `--package`) writes `omxcontract/omx_contract_limits.h` and, beside it as
`omxcontract/<header>`, every declared header that spells no `OMX_` name (no `scalars`, no `limits`): the layout
omx-contract 2.14.0 installed. Beside them it writes `omxcontract/omx_vocabulary.h`, and the json render
`omx-vocabulary.schema.json`, from every codes and words item of a file with no render word (docs/data-layout.md), and
`omxcontract/omx_host_verbs.h` when the read declares a verb. An owner's items are items like any other, so their `OMX_` defines are in
omx_contract_limits.h of a whole read once, not a second time. A define of a package header whose value names another
package's (a readout's `OMX_PARAM_SCALES_*` scale) needs that package's header included first.

## Links

`omx-contract links --check` takes a C name a header spells as naming its item, as it takes `OMX_<NAME>`: an `impl`
link to a function that reads `CLAP_HOST_CLAMP_DBFS` names `HOSTED_STAGE_LIMITS`; an omitted field is no name of it
(docs/contract-dir.md).

## Documentation

Every installed header, rendered or hand-written (`omx_json_write.h`), is read by doxygen (`Doxyfile`,
`make doxygen-check`, omx-contract#64). A header opens with a `@file` block whose `@brief` says what it holds: doxygen
reads none of a file's globals without one, so a header with no `@file` block is refused before doxygen runs. Every
public declaration a header spells (a define, an enum and each of its members, a struct and each of its members, a
function and each of its parameters) carries a `/** */` block, spelled from the item that declares it: its `doc`, its
`unit` where it carries one, and the version its `since` names; the comment states the declaration's meaning, its
units and ranges, since when it is declared, and who owns the memory it names. A define's or a function's block
stands above its line, so the line stays as a reader greps it (a function's names each parameter and its return); an
enum's or a struct's member carries its one line as a trailing `///<`, as a word of the vocabulary does.

The declarations doxygen reports undocumented are the lines of `docs/doxygen-baseline.txt`, each `<header>: <text>`
with no line number, sorted: the gate compares doxygen's warnings with that list and refuses a warning the list does
not carry (a new or renamed public declaration must be documented) and a line the warnings no longer carry (a
declaration documented since is struck from the list in the same change). The list only shrinks; a change that
adds a line to it against its base is refused. With the list empty, every public declaration is documented.

`make doxygen-check` (`DOXYGEN_BASE`, `origin/main` unless named: the ref whose baseline this one must not exceed; an
empty one is refused) runs `tools/doxygen-gate.sh`; `--list` prints the current warnings, `--update` writes them as the
baseline only when they lower it. The gate refuses, by name, a header that hides code from doxygen (`@cond`), a `@file`
outside a doc comment, and a `Doxyfile` that suppresses what it counts (`EXCLUDE*`, `HIDE_UNDOC_*`, filters,
`ENABLED_SECTIONS`, `EXTRACT_ALL`, the `WARN_*` keys) or drops a setting it needs, read back through `doxygen -x`. Its
limit: a declaration under a preprocessor condition false with only `CLAP_ABI` predefined is not read, as a compiler
would not read it; the headers carry none. The script exits 0 at the baseline, 1 on a finding, 2 when it cannot run;
`make` exits 2 on either.
