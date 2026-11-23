<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- Copyright (C) 2026 Pau Aliagas -->
# Shapes: a document's type, declared once and rendered to every language

A declaration says what a VALUE may be (a travel, a limit, a word list) and the renders carry the values. A **shape**
says what a DOCUMENT looks like (the travel a scale law reads, a gesture event, a curve request) and the renders carry
its TYPE: a TypeScript interface, a Python `TypedDict`, the C keys and words. One JSON Schema file per document, owned
by the package that owns the document, and every language's type of it a render of that file, never written by hand
(the typed-contracts spec, `typed-contracts-shared-behaviour.md`, §3, ruled by the
owner on 2026-11-17).

## Where a shape lives

`shapes/<name>.schema.json` in the owner's tree, a JSON Schema 2020-12 document. omx-contract's own first shape is
`shapes/travel.schema.json`, the travel `@openmixer/omx-contract/scale` and `omx_contract.scale` take
([scale-position.md](scale-position.md)). The schemas are installed under omx-contract's data directory,
`share/omx-contract/shapes/<name>.schema.json` (`pkg-config --variable=datadir omx-contract`), for a reader that
validates a document; a package that owns shapes of its own installs them beside its declarations (the next lane,
omx-panel's gesture shapes, adds that rule to [contract-dir.md](contract-dir.md)).

## The rules a shape is held to

`render --shapes` refuses a shape that breaks one, by file, rule and JSON path, and renders nothing:

| Rule | What it holds |
|---|---|
| `$schema` | `https://json-schema.org/draft/2020-12/schema`, the one dialect every reader and both generators read. |
| `$id` | `https://openmixer.org/schema/<owner>/<path>.schema.json`: the name a reader validates against, and `<owner>` the package that publishes the shape. Every render's banner names `Open-Mixer/<owner>` as the source, never the generator's repository (#78). |
| `title` | One CapitalisedWord: the type's name in every render (`Travel`). |
| `description` | On the root, on every object and on every property: the renders carry it as the doc comment, so a type is documented where it is declared. |
| `additionalProperties` | `false` on every object: a closed shape names every key, and the C X-macro of its keys is complete. |
| `titles` | Every object, nested ones too, has a title, and no two, in one shape or across shapes, spell the same macro stem: each object's macros and type are named by it, and one would render over the other. |
| `identifiers` | Every key is a C identifier (`[A-Za-z_][A-Za-z0-9_]*`): a key is an X-macro argument, one token, so no two collide. |
| `patternProperties` | Absent: a key set named by a pattern has no key for the C macros to name, so it is refused by name, never dropped. |
| `words` | Every `enum` or `const` of a property is strings, each a C identifier: they render as the `_WORDS(X)` macro, and the words of a `oneOf` or `anyOf` branch join it. |

## The renders

```
omx-contract render --target ts --shapes --out test/golden/ts        # shapes/<name>.d.ts
omx-contract render --target py --shapes --out share/omx-contract    # omx_contract_<name>_shape.py
omx-contract render --target c  --shapes --out include               # omxcontract/omx_<name>_shape.h
```

| Target | Tool | What it writes |
|---|---|---|
| `ts` | `json-schema-to-typescript`, pinned exactly in `package.json` (`npm ci`) | an interface per object, a union for a `oneOf`, the descriptions as JSDoc; published in the npm tarball under `dist/ts/shapes/` and exported as `@openmixer/omx-contract/shapes/<name>` |
| `py` | `datamodel-code-generator`, pinned exactly in `tools/shapes-requirements.txt` (`pip install -r tools/shapes-requirements.txt`, or `$OMX_DATAMODEL_CODEGEN` naming the command) | a `TypedDict` per object, `Literal` words, the descriptions as docstrings; installed as `omx_contract.shapes.<name>` by `python3-omx-contract` |
| `c` | this package's own render | the schema's installed path and `$id`, and per object its keys, its required keys and each enum's words as X-macros (`OMX_SHAPE_SCALE_TRAVEL_KEYS(X)`, `..._REQUIRED(X)`, `..._SCALE_WORDS(X)`); no struct |

C gets no generated struct: no standard generator writes one from JSON Schema, and a C reader parses a document by key
with the names these macros give. Where a C struct is the API of a behaviour, the struct is the ABI and the schema is
its JSON form, held equal by a conformance test in the owner (the spec, §3.2).

The two generators run only where the owner renders (its CI, a release build of the renders) and their output is
COMMITTED; a consumer reads the committed file and runs no generator, a distribution build installs it and needs
neither npm nor PyPI. Each generator is held to its pin at run time (the installed `json-schema-to-typescript` against
`package.json`'s exact version, `datamodel-codegen --version` against the requirements file): one that is absent, or
not at its pinned version, is refused by both names, since a version drift changes the bytes and `--check` would then
lie in one direction or the other. The generators' own dependencies are not pinned the same way yet (omx-contract#71).
The C render is held by a compiler in `test/shapes.test.mjs`: a nested object's macros, prose with a quote or a comment
close, under `cc -Werror -fsyntax-only`.

## The drift check

`render --target <t> --shapes --out <dir> --check` holds the committed files to a fresh render byte for byte and
names a file that differs, is missing or is extra; CI runs it for the three targets beside the declarations' own
checks. The plain render's `--check` of the same directory knows the shapes' files and does not call them extra.
`test/shapes.test.mjs` is the gate: the committed renders equal the render, a hand-edited render is named, each rule
above has a sabotage arm, and an absent generator is a refusal, never a pass.
