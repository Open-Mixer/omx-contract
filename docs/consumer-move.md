<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com> -->
# Moving a consumer onto a domain

Recipe: consumer-move
Pattern: a repository stops shipping a rendered vocabulary and owns, or reads, a domain document at run time through the loader
Worked example: https://github.com/Open-Mixer/plugin-hostd/pull/167
Steps: 1 the domain document; 2 the codes header, only for words C switches on; 3 delete the vocabulary render; 4 read through the loader; 5 CLIs and tests: OMX_CONTRACT_PATH; 6 packaging with the installer's domain mode; 7 the red-first tests

This is the recipe for one move: a repository that has its own vocabulary, or that read words out of omx-contract,
ends up owning a domain document (or reading another package's) and reading it at run time. The rules it follows
are in [runtime-data.md](runtime-data.md) (the rule, the C loader, the codes header), in
[contract-dir.md](contract-dir.md) ("Domains") and in [render.md](render.md). This page puts them in the order a
move takes and gives the commands. The worked example is plugin-hostd#167, which reads plugin-qualify's
`qualification` domain; its red and fix commits are listed in that PR.

Every move is red first: the tests of step 7 are one commit that fails, and the steps 1 to 6 are the commits that
turn it green. Nothing old is kept: no alias, no shim, no second header. If a move seems to need one, it stops and
asks the owner.

## 1. The domain document

Only the owner of the words ships the document. A repository that only reads another package's domain skips this
step (plugin-hostd#167 ships none; plugin-qualify owns `qualification`).

The document is `contract.d/<domain>/<last segment>.json` (`contract.d/scan/scan.json`,
`contract.d/dsp/kernels/kernels.json`) and holds:

- `"$schema": "https://json-schema.org/draft/2020-12/schema"`;
- `"$id": "https://openmixer.org/contract/<domain>"`, exactly: it names the directory it sits in;
- `info`: `title`, `version` (the floor a reader asks for), `x-owner` (the package), and
  `"x-stability": "experimental"` (every document of this pass; `stable` only on the owner's word);
- the items in `components.schemas`, each name starting with `<DOMAIN>_`: the domain in upper snake case with its
  underscore (`scan` gives `SCAN_`, `dsp/kernels` gives `DSP_KERNELS_`). An item renamed to get its prefix keeps
  the rest of its name;
- `x-from` where a word is taken from another domain's terms:
  `{ "$ref": "https://openmixer.org/contract/<domain>#/components/schemas/<ITEM>", "x-term": "<key>" }`;
- the translations beside it in `contract.d/<domain>/catalogs/<lang>.json`.

A word's `description` is optional for every reader: the schema, `validate`, the TypeScript reader, and the C
loader from omx-contract#116 on.

The document validates against `schema/domain.schema.json` and passes the reader:

```sh
omx-contract validate --contract-dir contract.d
```

The document is in the one formatting (omx-contract#119: keys in the order of `domain.schema.json`, words, items
and `x-from` entries never reordered):

```sh
omx-contract fmt --contract-dir contract.d          # writes the tree
omx-contract fmt --check --contract-dir contract.d  # the repository's own check holds it
```

## 2. The codes header, only for words C switches on

An item gets `"x-c-codes": true` only when C code switches on its words: a `case` label, an array size, a limit of
the real-time path. `"x-c-xmacro": true` adds the X-macro, only where a table needs it. No other item is marked:
C that only passes words on as strings (writes them into a record, compares them as text) reads them through the
loader (step 4) and needs no mark. A domain with no marked item has no header.

```sh
omx-contract render --target c --package <domain> --contract-dir contract.d --out include/<pkg>
```

writes `<domain>_codes.h` (`/` becomes `_`), guard `OMX_<DOMAIN>_CODES_H`, one `#define OMX_<ITEM>_<WORD> <code>u` per
word and `OMX_<ITEM>_COUNT`. The header is committed and checked with `--check` in the repository's own check.

## 3. Delete the vocabulary render

Remove every `*_vocabulary.h` (and any `.ts`, `.py` or `.js` render) of the domain, every `#include` of it, its
generator, and its lines in the Makefile, `meson.build`, the rpm spec, `debian/*.install` and any `check:generated`
step. `git grep -n '<domain>_vocabulary'` is empty afterwards. A file outside the repository that includes it is a
stop: name it.

## 4. Read through the loader

Words, names, titles, lists and ranges are read once at start-up, never in a real-time path:

```c
#include <omxcontract/omx_domain.h>

omx_domain *d = omx_domain_open_or_exit("<domain>", "<floor>"); /* a daemon: refusal exits 78 */
/* or: omx_domain_open("<domain>", "<floor>", &d, &err), refusing by err.code and err.message */
omx_domain_word_info w;
omx_domain_word(d, "<ITEM>", "<word>", &w);            /* one word */
int n = omx_domain_word_count(d, "<ITEM>");             /* the list: omx_domain_word_at(d, item, i, &w) */
omx_domain_range_info r;
omx_domain_range(d, "<ITEM>", "<name>", &r);           /* a range */
const char *t = omx_domain_text(d, "<key>", "<lang>");  /* a translated text */
omx_domain_close(d);
```

A program that opens its domain refuses (exit 78) on an install without it, so the read (this step) and the install
and requirement (step 6) land in the same release. A program links `libomx-domain` (`pkg-config --cflags --libs
libomx-domain`). `<floor>` is the `info.version` the code needs. TypeScript reads the installed JSON with Ajv 2020 and
`FromSchema<typeof domainSchema>` (`@openmixer/omx-contract/domain-schema`); a browser bundle is handed the document
by the page (`init(doc)`).

## 5. CLIs and tests: `OMX_CONTRACT_PATH`

`OMX_CONTRACT_PATH` is a `:` list of directories, each standing where the contract directory stands; the first that
holds the domain wins. Only a command-line program and a test harness read it, and they pass the directory to
`omx_domain_open_at(dir, ...)`; library code never reads it and always calls `omx_domain_open`. Each CLI says so in
one line of its `--help`. A test points the variable at a fixture directory or at the owner's `contract.d`.

## 6. Packaging

The loader reads `<contractdir>/<domain>/<last segment>.json` and its `catalogs/`, with no schema major and no
package directory in the path. A domain is installed there by ONE implementation, the domain mode of the installer
omx-contract ships (`install-contract-dir.sh --domain`, omx-contract#117): it copies the domain directory as
it is, catalogs included, to `<contractdir>/<domain>/`, and rewrites nothing (no `$schema` rewrite). The domain is
the path after the last `contract.d/`. It refuses (exit 1) any file beside `<last segment>.json` and
`catalogs/<lang>.json`, and a symlink; a nested domain directory (one holding its own `<name>.json`) is skipped, so
each domain is installed with its own call. A package
writes no `install -D` lines of its own for its domain. The package mode of the same script (without `--domain`)
installs a package's classic definition files under `<contractdir>/<package>/` and is not for
domains.

```sh
D=$(pkg-config --variable=datadir omx-contract)   # <datadir>/omx-contract
sh "$D/install-contract-dir.sh" --domain contract.d/<domain> \
  "$DESTDIR$(pkg-config --variable=contractdir omx-contract)"
```

in `make install`; a repository without a Makefile makes the same one-line call from the rpm spec's `%install` (into
`%{buildroot}`) and from `debian/rules` (`DESTDIR=debian/tmp`), and adds no Makefile for it. The domain ships in a
`<pkg>-contract` subpackage, uniformly: noarch data in the rpm, the binary package `<pkg>-contract` in debian, never
in the main package. Its rpm `%files` names the directory with `%{omx_contract_dir}/<domain>/` (the contract
directory, which has no schema-major level since the owner ruling of 2026-11-25; docs/contract-dir.md), and
`debian/<pkg>-contract.install` lists the same path.

A reader requires the owner's `<pkg>-contract` (rpm `Requires`, deb `Depends`) and omx-contract (the loader), with no
typed version (the devel wave 2026-11-24: it builds against the release installed beside it), at build and run time. Requiring the data without the program leaves no cycle (plugin-qualify
requires `plugin-hostd-contract`, not plugin-hostd). The program still refuses by name (exit 78, naming the domain
and the directories) when the domain is absent at the moment it needs it, with a test arm. A CI that installs
omx-contract from a commit pins it by SHA until the 3.20.0 tag replaces it.

## 7. The red-first tests

One commit, tests only, failing before the move:

1. the document conforms and is in the one formatting: `$schema`, `$id`, `info.x-stability`, every item prefixed
   (`omx-contract validate`, `omx-contract fmt --check --contract-dir contract.d`, and
   the schema with Ajv 2020 where the repository is TypeScript) (owner only);
2. no `*_vocabulary.h` of the domain exists or is included;
3. the words come from the domain read at start-up: a fixture directory through the test path with one word
   changed, and the consumer sees the change;
4. the codes header holds only the `x-c-codes` items and is the render (`--check`), or there is none;
5. a CLI reads `OMX_CONTRACT_PATH`, and the library entry ignores it (when only a CLI opens the domain, the arm
   is stated n/a in the PR body, with the reason);
6. a missing, invalid or too-old domain is refused by name at start-up.
7. the installed tree is the one the loader reads (owner only): `make install DESTDIR=<tmp>`, then
   `omx_domain_open_at("<tmp><contractdir>", "<domain>", "<floor>", ...)` opens it and finds a word and a catalog
   text.

Each arm is then sabotaged once (uncommitted, restored) and the failing line goes in the PR body with the red and
the green, and the runs.
