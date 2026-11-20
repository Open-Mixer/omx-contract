<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com> -->
# Units: owned per producer, read through one merged reader

**Status: DESIGN, nothing implemented.** This is the units lane of the sorting pass: row 30 and V23 of
[ownership-map.md](ownership-map.md), approved by the owner. Vocabulary moves stay frozen in releases, so nothing
here lands before the release pass is over. The questions marked **OPEN QUESTION** wait for the owner; the design
does not guess them.

## The ruling

Units have no single owner (owner ruling, final):

- The units a kernel COMPUTES in belong to omx-dsp, in its `dsp` domain.
- How a value is DISPLAYED is omx-panel's, in its `panel` domain: display rules over the owners' units, no unit ids
  of its own (owner ruling Q6, 2026-11-20).
- A plugin's CUSTOM units are its own declaration, in its descriptor.
- The format spellings (CLAP, LV2) belong to the format owner, plugin-db (V27).
- The units a format has and no kernel computes in (the LV2 lengths, `frames`, `bpm`, `deg`, `midiNote`) are
  plugin-db's too, declared beside its spellings (owner rulings Q3 and Q5, 2026-11-20).
- ONE merged reader in libomx-domain gives a consumer every owner's units as one list.
- omx-contract keeps only the format (the item kinds below, the schema, its refusal codes) and the reader.
- An inner repository that needs an outer word is an error, fixed case by case: the word moves down, or the reader.

## What is read today

These are the lists of omx-contract 3.20.2. They are byte-identical on main once omx-contract#144 has taken
`PARAM_UNITS` off main.

- `OMX_PARAM_CONTRACT_UNITS`, 29 tokens with their codes: `data/param-contract.json`, rendered to
  `omx_param_units.h` and `omx_contract_limits.h`. Read by omx-clap-core, omx-plugins, omx-panel and the console.
- `$defs.unit`, the 15 units the items use: `schema/omx-contract.schema.json`. Read by every item and descriptor check.
- `$defs.descriptorUnit`, 8 plugin-only units and `unknown`: the same schema. Read by every descriptor check.
- `$defs.meaning`, 47 words of what a control does: the same schema. Read by every descriptor check and omx-panel.
- `LV2_UNITS_TERMS`, 24 LV2 unit terms: `data/formats/lv2/units.json`. Read by omx-clap-core, plugin-hostd and
  plugin-qualify, through `from`.

The codes of the first list are the wire codes of the CLAP extension `org.openmixer.param-contract/1`: 0 is no unit,
1 to 24 are the LV2 units one to one, and 0x100 up is a vendor block for units LV2 has none for. The codes are
append-only.

## 1. The unit item

Every owner declares its units the same way: one item of its domain document, `"x-kind": "units"`. It is a words
item (docs/contract-dir.md, "Domains"), so the generic loader still reads it, and it adds four fields per word.

```json
"DSP_UNITS": {
  "description": "The units the kernels compute in.",
  "x-since": "1.1.0",
  "x-kind": "units",
  "x-units-role": "computes-in",
  "oneOf": [
    { "const": "none", "title": "None", "x-code": 0, "x-symbol": "", "x-dimension": "none",
      "description": "No unit: a ratio or a fraction.", "x-text": "no unit" },
    { "const": "dB", "title": "Db", "x-code": 1, "x-symbol": "dB", "x-dimension": "gain",
      "description": "Decibels, a gain or a level relative to unity.", "x-text": "decibels" },
    { "const": "ms", "title": "Ms", "x-code": 2, "x-symbol": "ms", "x-dimension": "time",
      "x-conversion": { "to": "s", "factor": 0.001 },
      "description": "Milliseconds.", "x-text": "milliseconds" }
  ]
}
```

The item:

- Its name is `<DOMAIN>_UNITS` by the prefix rule: `DSP_UNITS`. One units item per domain. omx-panel's `PANEL_UNITS`
  is the exception: it holds display rules, not units (below).
- `x-kind` (required): `units`.
- `x-units-role` (required): `computes-in` (omx-dsp) or `format` (plugin-db: a unit a format
  has and no kernel computes in). A descriptor's units are `custom`. No unit has role `display`: omx-panel declares
  none (Q6).
- `description`, `x-since`, `x-why`: as on every item.

Each word (`oneOf` entry):

- `const` (required): the unit's id. Letters, digits and `-`, starting with a letter: `dB`, `percent`, `none`,
  `dB-oct` (section 2 settles the ids of omx-dsp's 12 units). Unique across the merged view.
- `title` (required): the key, the name of its macro, as in every words item.
- `x-code` (required): its place in the list, from 0, as in every words item. It is not a wire code.
- `x-symbol` (required): the symbol as written in a descriptor and after a value: `dB`, `%`, `""`, `dB/oct`.
  Unique across the merged view. Never translated.
- `x-dimension` (required): what is measured, a word of `CONTRACT_UNIT_DIMENSIONS` (below).
- `x-conversion` (optional): `{ "to": <unit id>, "factor": <number>, "offset": <number> }`. A value in `to` is
  `value * factor + offset`. `offset` defaults to 0.
- `description` (optional): one line for a reader of the document.
- `x-text` (required): the display text, the unit's name a person reads, in English. Catalogs translate it under
  `<ITEM>.<id>`.

Rules the reader checks, beyond the schema:

- A conversion's `to` names a unit of the merged view with the same `x-dimension`, and that unit has no conversion
  of its own: one step, to a base unit.
- A logarithmic unit (`dB`, `dBFS`, `dBu`, `LUFS`) declares no conversion. Its offset depends on a reference (dBu to
  dBFS is a calibration), so no fixed factor is true.
- There is no scale field. A scale belongs to a parameter (`PARAM_SCALES`, V21), not to its unit.

`CONTRACT_UNIT_DIMENSIONS` is a words item of omx-contract's `contract` domain: how a unit is read is contract format,
as `PARAM_SCALES` is (V21). The proposed words are `none`, `time`, `frequency`, `gain`, `level`, `loudness`, `pitch`,
`angle`, `length`, `tempo`, `musical-time`, `count`, `slope`, `rate`, `ratio`. See OPEN QUESTION 10.

Two more item kinds join units to the wire and to the formats. Neither holds a unit; each names units by id.

**The code table**, `"x-kind": "unit-codes"`, one per extension. Its words are the tokens a `get()` reports; it adds
`x-extension` on the item and `x-unit-code` and `x-unit` on each word:

```json
"<DOMAIN>_PARAM_CONTRACT_UNITS": {
  "description": "The units of org.openmixer.param-contract/1, by token.",
  "x-since": "1.0.0",
  "x-kind": "unit-codes",
  "x-extension": "org.openmixer.param-contract/1",
  "oneOf": [
    { "const": "none", "title": "None", "x-code": 0, "x-unit-code": 0, "x-unit": "none" },
    { "const": "s", "title": "S", "x-code": 1, "x-unit-code": 1, "x-unit": "s" },
    { "const": "dbfs", "title": "Dbfs", "x-code": 25, "x-unit-code": 256, "x-unit": "dBFS" }
  ]
}
```

`x-unit-code` is the wire code, sparse and append-only. `x-unit` names the unit's id, and may be absent for a token
no owner declares as a unit (`bar`, `beat`, `dbu` until OPEN QUESTIONS 13 and 14 are ruled). Its owner is
omx-clap-core (ruled, OPEN QUESTION 1).

**The format spellings**, `"x-kind": "unit-spellings"`, the format owner's: the LV2 unit terms carry `x-format`
(`lv2`) on the item and `x-unit` (the unit's id) on each unit term, where `LV2_UNITS_TERMS` writes `word` today.
Its name and the rest of its form are V27's. The units the terms name that no kernel computes in are declared by the
same owner (the next subsection). CLAP has no unit terms, so there is no CLAP spellings item.

**Derived units.** A unit that is another unit times a fixed factor declares it with `x-conversion`: the base keeps
no conversion of its own, the derived unit names the base in `to`. The owner of the derived unit is ruled apart from
the base's owner (the reader merges them). Ruled (owner, 2026-11-20):

| Unit | Base | Scale (`factor`) | Dimension | Owner and role | Derivation |
|---|---|---|---|---|---|
| `kHz` | `Hz` | 1000 | frequency | plugin-db, format (Q5) | kHz to Hz: `value * 1000` |
| `MHz` | `Hz` | 1000000 | frequency | plugin-db, format (Q5) | MHz to Hz: `value * 1000000` |
| `m` | none | base of `length` | length | plugin-db, format (Q5) | the base: declares no conversion |
| `cm` | `m` | 0.01 | length | plugin-db, format (Q5) | cm to m: `value * 0.01` |
| `mm` | `m` | 0.001 | length | plugin-db, format (Q5) | mm to m: `value * 0.001` |
| `km` | `m` | 1000 | length | plugin-db, format (Q5) | km to m: `value * 1000` |
| `inch` | `m` | 0.0254 | length | plugin-db, format (Q5) | inch to m: `value * 0.0254` |
| `mile` | `m` | 1609.344 | length | plugin-db, format (Q5) | mile to m: `value * 1609.344` |

**Display rules.** omx-panel declares NO unit ids (owner ruling Q6, 2026-11-20). `PANEL_UNITS` is omx-panel's
display rules over the owners' units: each rule names an owner's unit id to show, the unit id it is computed in (the
base), a scale and a threshold. The rule adds no unit to the merged view, so it cannot clash with an owner's id or
symbol. The rules the owner named:

| Shown as | Computed in | Scale | Threshold | Owner of both unit ids |
|---|---|---|---|---|
| `kHz` | `Hz` | 0.001 | from 1000 Hz up (Hz is shown below) | `kHz`: plugin-db; `Hz`: omx-dsp |
| `s` | `ms` | 0.001 | not stated by the owner | omx-dsp |
| `percent` | `x` (a 0 to 1 value) | 100 | not stated by the owner | omx-dsp |

The thresholds of `s` and `percent` are the panel's own rule to state when it declares `PANEL_UNITS`; the owner gave
only the `kHz` one. The earlier clash note (the panel's rows against the owners' ids, and the direction of the
conversion) is resolved by this ruling.

A descriptor declares its custom units in the same form, as an optional `units` array of the descriptor
(a new field, a minor of the descriptor schema):

```json
"units": [ { "id": "ratio", "symbol": "ratio", "dimension": "ratio", "text": "ratio, n to 1" } ]
```

The fields are those of a unit word without the words-item wrapping: `id`, `symbol`, `dimension`, `conversion`,
`text`, and an optional `doc`. A custom unit has no wire code: the param-contract extension reports it as `none` (0).

## 2. Who holds which unit today

Built from the lists above, the LV2 unit terms, and the units the omx-dsp 0.33.1 kernel files state (`""` 120
times, `dB` 115, `ms` 68, `Hz` 65, `%` 27, `cents` 6, `s` 5, `dBFS` 5, `dB/oct` 4, `oct` 3, `x` 1, `st` 1).
omx-panel declares no unit today: it prints the unit string a description gives it. By ruling it declares none, only
display rules (below).

Columns: the param-contract token and code; the symbol a descriptor writes (`-` for none); the unit's id (`const`,
settled for the 12 units of omx-dsp; an open unit's id is set when its owner is ruled); which schema list holds it
(`u` the items' `unit`, `d` the plugin-only `descriptorUnit`); computes-in (a kernel of omx-dsp 0.33.1 states it);
display (a panel display rule shows it or starts from it, Q6); the LV2 term (the format spelling, plugin-db's under
V27); and the unit's owner.
Owners and ids marked Q-number were ruled by the owner on 2026-11-20; the id of a ruled unit is its symbol.

| Token | Code | Symbol | Id | List | Computes-in | Display | LV2 term | Owner |
|---|---|---|---|---|---|---|---|---|
| `none` | 0 | `""` | `none` | u | yes | - | - | omx-dsp |
| `s` | 1 | `s` | `s` | u | yes | yes (Q6) | `s` | omx-dsp; see Q6 |
| `ms` | 2 | `ms` | `ms` | u | yes | - | `ms` | omx-dsp |
| `min` | 3 | `min` | `min` | u | no | - | `min` | omx-dsp (Q2; no kernel states it yet) |
| `bar` | 4 | - | - | - | no | - | `bar` | OPEN QUESTION 13 |
| `beat` | 5 | - | - | - | no | - | `beat` | OPEN QUESTION 13 |
| `frame` | 6 | `frames` | `frames` | d | no | - | `frame` | plugin-db (Q3) |
| `m` | 7 | `m` | `m` | - | no | - | `m` | plugin-db (Q5), base of length |
| `cm` | 8 | `cm` | `cm` | - | no | - | `cm` | plugin-db (Q5), derived of `m` |
| `mm` | 9 | `mm` | `mm` | - | no | - | `mm` | plugin-db (Q5), derived of `m` |
| `km` | 10 | `km` | `km` | - | no | - | `km` | plugin-db (Q5), derived of `m` |
| `inch` | 11 | `inch` | `inch` | - | no | - | `inch` | plugin-db (Q5), derived of `m` |
| `mile` | 12 | `mile` | `mile` | - | no | - | `mile` | plugin-db (Q5), derived of `m` |
| `db` | 13 | `dB` | `dB` | u | yes | - | `db` | omx-dsp |
| `pc` | 14 | `%` | `percent` | u | yes | yes (Q6) | `pc` | omx-dsp; see Q6 |
| `coef` | 15 | `x` | `x` | u | yes | - | `coef` | omx-dsp |
| `hz` | 16 | `Hz` | `Hz` | u | yes | - | `hz` | omx-dsp |
| `khz` | 17 | `kHz` | `kHz` | - | no | yes (Q6) | `khz` | plugin-db (Q5), derived of `Hz`; see Q6 |
| `mhz` | 18 | `MHz` | `MHz` | - | no | - | `mhz` | plugin-db (Q5), derived of `Hz` |
| `bpm` | 19 | `bpm` | `bpm` | d | no | - | `bpm` | plugin-db (Q3) |
| `oct` | 20 | `oct` | `oct` | u | yes | - | `oct` | omx-dsp |
| `cent` | 21 | `cents` | `cents` | u | yes | - | `cent` | omx-dsp |
| `semitone12TET` | 22 | `st` | `st` | u | yes | - | `semitone12TET` | omx-dsp |
| `degree` | 23 | `deg` | `deg` | d | no | - | `degree` | plugin-db (Q3) |
| `midiNote` | 24 | `midiNote` | `midiNote` | d | no | - | `midiNote` | plugin-db (Q3) |
| `dbfs` | 256 | `dBFS` | `dBFS` | u | yes | - | - | omx-dsp |
| `dbu` | 257 | - | - | - | no | - | - | OPEN QUESTION 14 |
| `ratio` | 258 | `ratio` | `ratio` | d | no | - | - | omx-dsp (Q4), keeps code 258 |
| `lufs` | 259 | `LUFS` | `LUFS` | u, d | no | - | - | omx-dsp (Q2; no kernel states it yet) |
| - | - | `dB/oct` | `dB-oct` | u | yes | - | - | omx-dsp |
| - | - | `dB/s` | `dB-s` | u | no | - | - | omx-dsp (Q2; no kernel states it yet) |
| - | - | `dBTP` | `dBTP` | d | no | - | - | omx-dsp (Q4) |
| - | - | `LU` | `LU` | d | no | - | - | omx-dsp (Q4) |
| - | - | `unknown` | - | d | - | - | - | omx-contract: the descriptor format's "states none" word, not a unit |

The wire codes themselves (the code table) belong to omx-clap-core (ruled, OPEN QUESTION 1). `$defs.meaning` holds
no unit; its words belong to plugin-db (ruled, OPEN QUESTION 7).

Per owner, what is settled today (owner rulings of 2026-11-20 included):

- omx-dsp, `DSP_UNITS`: 18 units, by id. The 12 computed in today: `none` (`""`), `s`, `ms`, `dB`, `percent` (`%`),
  `x`, `Hz`, `oct`, `cents`, `st`, `dBFS`, `dB-oct` (`dB/oct`). Ruled to it, no kernel states them yet: `min`, `LUFS`,
  `dB-s` (`dB/s`), the follow-up work of section 4. Ruled to it, with code 258 kept for `ratio`: `ratio`, `dBTP`, `LU`.
- omx-panel, `PANEL_UNITS` (display rules): 0 units, 3 rules over the owners' units (`Hz` shown as `kHz`, `ms` as
  `s`, `x` as `percent`; the display rules above).
- plugin-db, the format units (role `format`): 12 units. `frames`, `bpm`, `deg`, `midiNote`; the lengths `m` (the
  base), `cm`, `mm`, `km`, `inch`, `mile`; `kHz` and `MHz`, derived of `Hz`.
- plugin-db, the LV2 spellings (V27): 24 terms, each naming a unit by id when one is declared.
- plugin-db, the CLAP spellings: 0. CLAP has no unit terms.
- plugin-db, the `meaning` words: 47.
- omx-clap-core, the code table of `org.openmixer.param-contract/1`: 29 codes.
- Each descriptor (custom): 0 units settled.
- omx-contract (format): 1 word, `unknown`, and the item `CONTRACT_UNIT_DIMENSIONS`.
- OPEN, tokens with no unit: 3. `bar`, `beat` (OPEN QUESTION 13) and `dbu` (OPEN QUESTION 14).

The 22 symbols are the 15 of `unit` and the 7 of `descriptorUnit` not already in `unit`. The 29 tokens are the 14 of
omx-dsp's units with a token (the 11 computed in, `min`, `ratio`, `lufs`), the 12 of plugin-db's, and the 3 still open.

## 3. The merged reader

### Which domains it reads, in what order

It reads every installed domain document, `<contractdir>/<domain>/<last segment>.json`, and keeps the items whose
`x-kind` is `units`, `unit-codes` or `unit-spellings`. The reader names no repository and no domain: who owns a unit
is data (rule 5). A top-level directory whose name is all digits is a schema major of the classic layout
(docs/contract-dir.md, "The layout"), not a domain, and is not entered.

The domains are taken in bytewise order of their names (`strcmp`, no locale). The merged list is each domain's units
item in that order, each in its declared order. Lookups by id, by symbol and by code do not depend on the order.
The code table's order is its own: code order, the order its words are declared in.

### What it refuses

Each refusal names its code and what its message names.

- `contract.unit.duplicate` (new):
  - two units with one id, in two domains or one: the id and both domains;
  - two units with one symbol: the symbol, both ids and both domains;
  - two code tables for one extension, or one token or one wire code twice: the extension, the token or the code,
    and the domains;
  - two spellings items for one format, or one term naming two units: the format, the term and the domains.
- `contract.unit.unresolved` (new): a conversion's `to`, a code's `x-unit` or a spelling's `x-unit` that names no
  unit. The message names the id, the item and its domain.
- `contract.unit.dimension` (new): a conversion across dimensions; a conversion to a unit with a conversion of its
  own; a dimension that is no word of `CONTRACT_UNIT_DIMENSIONS`. The message names the unit and both dimensions, or
  the word.
- `contract.dir.absent`: a domain a floor names is not installed. The message names the domain and the place looked.
- `contract.package.too-old`: a domain is below its floor. The message names the domain, its version and the floor.
- `contract.file.not-json`, `contract.file.invalid`: a document does not parse, or a units item breaks its shape,
  as `omx_domain_open` refuses them.
- `contract.word.unknown`: a lookup by id, symbol or code finds nothing. The message names what was asked.
- `contract.index.range`: an index outside the list. The message names the index and the count.

The three new codes join `CONTRACT_CODES`, omx-contract's own refusal codes (rule 5). They follow
`contract.verb.duplicate` and `contract.role.duplicate`.

A refusal is never a default. A refused open returns no handle; a program turns it into exit 78, as
`omx_domain_open_or_exit` does.

**An absent owner domain** is not a refusal by itself: its units are simply not in the view. A consumer that needs an
owner's units states that owner's domain as a floor (below), and then its absence is refused by name. A code table
or spellings item that names a unit of the absent domain is refused as `contract.unit.unresolved` when the view is
opened, not when a unit is looked up. So a half-installed set never opens.

### C API

In `include/omxcontract/omx_units.h`, in libomx-domain (the SONAME stays `libomx-domain.so.0`: new symbols only).
Errors use `omx_domain_error` and the `OMX_CONTRACT_CODE_*` values of `omx_contract_codes.h`.

```c
typedef struct omx_units omx_units;     /* opaque; owns every string a lookup returns until omx_units_close() */

typedef struct {
  const char *domain;   /* the domain the consumer needs, e.g. "dsp" */
  const char *version;  /* its floor "x.y.z" */
} omx_units_floor;

typedef struct {
  const char *id;            /* the unit's id ("dB", "percent", "dB-oct", "none") */
  const char *symbol;        /* as written ("dB", "%", ""); never NULL */
  const char *dimension;     /* a word of CONTRACT_UNIT_DIMENSIONS */
  const char *owner;         /* the domain that declares it ("dsp"); "descriptor" for a custom unit */
  const char *role;          /* "computes-in", "format" or "custom" */
  const char *conversion_to; /* the base unit's id; NULL when it declares no conversion */
  double factor, offset;     /* value in conversion_to = value * factor + offset; 1 and 0 when none */
  const char *lv2_term;      /* the LV2 term that spells it; NULL when none */
  const char *token;         /* its param-contract token; NULL when it has no code */
  long code;                 /* its param-contract code; -1 when none */
} omx_unit_info;

int  omx_units_open(const omx_units_floor *floors, size_t nfloors, omx_units **out, omx_domain_error *err);
int  omx_units_open_at(const char *dir, const omx_units_floor *floors, size_t nfloors,
                       omx_units **out, omx_domain_error *err);
omx_units *omx_units_open_or_exit(const omx_units_floor *floors, size_t nfloors);
void omx_units_close(omx_units *u);

int  omx_units_count(const omx_units *u);
int  omx_units_at(const omx_units *u, int index, omx_unit_info *out);
int  omx_units_by_id(const omx_units *u, const char *id, omx_unit_info *out);
int  omx_units_by_symbol(const omx_units *u, const char *symbol, omx_unit_info *out);
int  omx_units_by_code(const omx_units *u, long code, omx_unit_info *out);
const char *omx_units_text(const omx_units *u, const char *id, const char *lang);

int  omx_units_code_count(const omx_units *u);
int  omx_units_code_at(const omx_units *u, int index, const char **token, long *code);

int  omx_units_with_descriptor(const omx_units *base, const char *descriptor_path,
                               omx_units **out, omx_domain_error *err);
```

- `omx_units_open` reads the contract directory the library was built for, and reads no environment variable, as
  `omx_domain_open` does. `omx_units_open_at` reads `<dir>`: tests and the `omx-domain` command only.
- `floors` lists the domains the consumer needs, with a version floor each; a floor is a minimum, never a pin.
  `nfloors` 0 asks for none.
- Every function returns 0 or the `OMX_CONTRACT_CODE_*` value of its refusal. A refused call leaves its outputs as
  they were; a refused open sets `*out` to NULL.
- **Memory.** Open copies everything a lookup returns into the handle's own storage and releases the JSON documents
  before it returns. Every pointer in an `omx_unit_info`, and every `token`, stays valid until `omx_units_close` of
  that handle. `omx_units_with_descriptor` returns a NEW handle with its own copy: the base may be closed first. The
  caller closes both. `omx_units_close(NULL)` does nothing.
- `omx_units_at` and `omx_units_count` walk the merged list in the order above. `omx_units_code_at` walks the code
  table in code order, including tokens with no unit.
- `omx_units_text` gives the display text in `lang` from the owner's catalogs, else the English `x-text`; NULL for an
  unknown id. `lang` is an argument, never read from `LANG` or `LC_MESSAGES`.

### TypeScript API

In `src/lib/units-reader.mts`, exported as `@openmixer/omx-contract/units-reader`, beside `openDomainAt`:

```ts
export interface Unit {
  readonly id: string; readonly symbol: string; readonly dimension: string;
  readonly owner: string; readonly role: 'computes-in' | 'format' | 'custom';
  readonly conversion?: { readonly to: string; readonly factor: number; readonly offset: number };
  readonly lv2Term?: string; readonly token?: string; readonly code?: number;
}
export function openUnitsAt(dirs: string | readonly string[],
                            floors?: Readonly<Record<string, string>>): Units;
export class Units {
  all(): readonly Unit[];
  byId(id: string): Unit;
  bySymbol(symbol: string): Unit;
  byCode(code: number): Unit;
  codes(): readonly { readonly token: string; readonly code: number; readonly unit?: string }[];
  text(id: string, lang?: string): string | undefined;
  withDescriptor(descriptor: unknown, at: string): Units;
}
```

`dirs` is a directory, a `:` list or an array; a domain is read from the first that holds it, as `openDomainAt`
does. `text(id, lang)` takes its arguments in the order of `omx_units_text(u, id, lang)`. Each refusal throws
`ContractRefusal` with the same code, member and message as the C reader. The returned objects are frozen. The C
and TypeScript readers are held to each other by one conformance suite, as the domain readers are
(`test/fixtures/conformance/cases.json`).

### The `omx-domain units` command

```sh
omx-domain units [--at <dir>] [--floor <domain>=<x.y.z>]... \
                 ( --list | --codes | --render-c <file> | --render-ts <file> )
```

- `--list`: one line per unit, tab-separated, in merged order: id, symbol, dimension, owner, role, token, code.
- `--codes`: one line per token, in code order: code, a tab, token.
- `--render-c`: a header for a consumer's BUILD tree, never installed by omx-contract. It defines
  `OMX_UNIT_CODE_<TOKEN> <code>u` per token and the X-macro `OMX_UNIT_CODES(X)`, `X(<code>u, "<token>")` per token,
  laid out as `OMX_PARAM_UNITS(X)` is in 3.20.2 (six per line). A consumer whose C switches on a code needs a
  compile-time table (docs/runtime-data.md, ruling 3), so it renders this at build time from the installed domains.
- `--render-ts`: the same list as a module, for a bundle that has no file system.

### A plugin descriptor's custom units

They do not join the merged view. The merged view is the installed domains only, so it is the same for every
consumer and the 3.20.2 comparison holds. A consumer that reads a descriptor asks for that descriptor's view:
`omx_units_with_descriptor` or `Units.withDescriptor`. It is the base view plus the descriptor's `units`, role
`custom`, owner `descriptor`, with no token and no code. A custom unit with the id or symbol of a unit of the base
is refused as `contract.unit.duplicate`, naming the descriptor and the base unit's domain. Two descriptors may each
declare a unit of the same id: each view holds one. Whether that is allowed for a unit many plugins use is OPEN
QUESTION 9.

A descriptor's `travel.unit` and `meters[].unit` are checked against that descriptor's view, plus `unknown`.

### Thread-safety and locale

- Open, `with_descriptor` and close are START-UP calls: they allocate and parse. Nothing here runs on an audio thread;
  a value an audio thread needs is copied into the program's own struct before that thread starts.
- An open handle is immutable. Lookups on one handle may run from many threads at once with no lock. Close must not
  run while another thread uses the handle.
- The reader keeps no global state: two handles are independent.
- **Numbers are C-locale.** Factors, offsets and codes are parsed by the JSON parser, which does not read
  `LC_NUMERIC`. The `--render-c`, `--render-ts`, `--list` and `--codes` outputs print numbers with a C-locale
  formatter (`uselocale` of a `"C"` locale around the print, never `setlocale` of the process), so a comma-decimal
  locale changes no byte.
- Ids, symbols and tokens compare bytewise (`strcmp`), with no case folding and no collation.

## 4. Migration

Each consumer switches in its own release, in its line of the sorting pass (ownership-map.md, "The sorting pass").
The staging below keeps 3.20.2's `OMX_PARAM_CONTRACT_UNITS`, `omx_param_units.h` and the
`OMX_PARAM_CONTRACT_UNITS_*` lines of `omx_contract_limits.h` live beside the merged view from SA until SZ: two
sources across releases. The owner's no-back-compat rule names that (dual formats, deprecation periods), and no owner
approval covers it, so the staging is OPEN QUESTION 12. The new names are new names: there is no alias of an old
name to a new one.

### S0, omx-contract: the reader

- New: `include/omxcontract/omx_units.h`, `src/c/omx_units.c`, `src/lib/units-reader.mts`.
- `src/c/omx_domain_cli.c`: the `omx-domain units` command.
- `schema/domain.schema.json`: the `units`, `unit-codes` and `unit-spellings` kinds.
- `schema/omx-contract.schema.json`: the enums reference the merged view (below); the descriptor gains `units`.
- `data/codes.json`: the three new codes. The `contract` domain gains `CONTRACT_UNIT_DIMENSIONS`.
- The conformance cases; `Makefile`, `debian/libomx-contract-dev.install`, `packaging/omx-contract.spec` install
  the new header and module.
- Replaces: nothing yet. 3.20.2's units stay, unchanged.

### SA, every owner: the units as data

- omx-dsp: its `dsp` domain gains `DSP_UNITS`, 18 units: the 12 settled, `min`, `LUFS`, `dB-s`, `ratio`, `dBTP`, `LU`.
- omx-panel: its `panel` domain gains `PANEL_UNITS`, 3 display rules over the owners' units, no unit ids (OPEN QUESTION
6).
- plugin-db: its `formats` domain (V27) carries the LV2 unit terms as a `unit-spellings` item and the 12 format
  units (role `format`), and the `meaning` words. It replaces `LV2_UNITS_TERMS`' unit terms and `$defs.meaning`.
- omx-clap-core: the `unit-codes` item. It replaces `OMX_PARAM_CONTRACT_UNITS`.

### S2, omx-dsp

- Its kernel-file check reads a kernel's `unit` through the merged view; its packaging floors name omx-contract.
- Follow-up work (owner ruling Q2): the kernels that must state `min`, `LUFS` and `dB/s`, each now a unit of omx-dsp.
  The kernels in omx-dsp 0.33.1 that state `dB` where the unit is another:
  - loudlevel `targetLufs` and `gateLufs` (`data/kernels/loudlevel.json`): `dB` to `LUFS`;
  - loudlevel `speedDbPerS` and balancer `speedDbPerS` (`data/kernels/loudlevel.json`, `data/kernels/balancer.json`):
    `dB` to `dB/s`;
  - `min`: no kernel parameter is in minutes today, so none is listed; the kernel that first computes in minutes
    states it, or `min` has no kernel to state it and its owner is asked again.
  - `ratio`, `dBTP`, `LU` (Q4): no kernel states them in 0.33.1 either (the curve primitive reads `ratio` only as an
    input word); the loudness meter and the dynamics kernels are the places, to be listed when their lane opens.
- Replaces: the schema's `unit` enum.

### S6, omx-panel

- `tools/vocabulary.mjs`: `paramUnits`, `unitTokenOf`, `servedToken` and `contractUnits` become `openUnitsAt`
  lookups; `PARAM_UNITS_ITEM` and `paramUnitsFile` go. `test/vocabulary.test.mjs` follows.
- `docs/behaviour-core.md`, `docs/panel-layout.md`, `BUILDING.md`; the floors of `packaging/omx-panel.spec` and
  `debian/control`.
- Replaces: `OMX_PARAM_CONTRACT_UNITS` read as a file, and plugin-hostd's LV2 table read backwards for a token.

### S7, omx-clap-core (OPEN QUESTION 11)

- `Makefile`: renders `omx_units.h` into the build tree.
- `src/omx_clap_ext.h`: `OMX_CLAP_PARAM_UNITS(X)` expands `OMX_UNIT_CODES(X)`.
- `src/param_contract.h`, `lv2/clap/lv2_clap.c`: no edit, they expand `OMX_CLAP_PARAM_UNITS`.
- `src/clap_host.h`: its comment. `tests/no_contract_copy.py`; the floors of `packaging/omx-clap-host.spec`.
- Replaces: `omx_param_units.h` and its `OMX_PARAM_UNITS(X)`.

### S10, omx-plugins

- `Makefile`: renders `omx_units.h`; its floors. `include/omx_param_contract.h` includes it.
- `lib/omx_clap_face.c`: `OMX_CLAP_UNIT_NONE` becomes `OMX_UNIT_CODE_NONE`.
- `tools/param-contract.mjs`: `openUnitsAt`, no regex over a header. `tools/test/param-units-check.mjs` and
  `tools/ci-stale-units.sh` follow.
- `docs/declaration-as-descriptor.md`, `docs/catalogue.md`, `packaging/omx-plugins.spec`.
- No descriptor declares `frames`, `bpm`, `deg`, `midiNote`, `ratio`, `dBTP` or `LU` as custom: they are shared
  units (Q3, Q4). A descriptor declares only its own, such as `dBu` until OPEN QUESTION 14 is ruled.
- Replaces: `OMX_CLAP_UNIT_*` and `OMX_PARAM_CONTRACT_UNITS`.

### S11, the console

- Its `clap-param-units.ts` reads `openUnitsAt`, or the `--render-ts` module in its web bundle.
- Replaces: its copy of the unit table.

### SZ, omx-contract: the drop

- `data/param-contract.json` loses `OMX_PARAM_CONTRACT_UNITS` and its `render` block.
- `include/omxcontract/omx_param_units.h` goes, and so do the `OMX_PARAM_CONTRACT_UNITS_*` lines of
  `omx_contract_limits.h`.
- `LV2_UNITS_TERMS` goes with V27.
- Its entries in `ownership/moving-out.txt` and `ownership/words.json`, `share/omx-contract/omx-contract.json`, the
  goldens and `docs/data-layout.md` follow.
- Replaces: nothing. The merged view is the source.

### The schema enums

`$defs.unit`, `$defs.descriptorUnit` and `$defs.meaning` stop carrying a literal list. Each
becomes `{ "type": "string", "x-units-of": <selector> }` (`x-words-of` for `meaning`), which omx-contract's
validator resolves through the merged reader:

- `unit`: the symbols of the units of role `computes-in` (3.20.2's 15, now that omx-dsp holds `min`, `LUFS` and
  `dB/s`, OPEN QUESTION 2 ruled);
- `descriptorUnit`: every symbol of the descriptor's view (base and custom), and `unknown`;
- `meaning`: the words of plugin-db's item (OPEN QUESTION 7, ruled).

So no list is copied by hand, and omx-contract's build reads no other repository (OPEN QUESTION 8, ruled: a reference).

### The grep before the drop

The drop at SZ waits until a grep finds no reader. At each consumer's released tag (omx-clap-core, omx-plugins,
omx-panel, plugin-hostd, plugin-qualify, plugin-db, omx-dsp, the console) and in omx-contract's own tree outside the
dropped files:

```sh
grep -rnE 'OMX_PARAM_CONTRACT_UNITS|omx_param_units|OMX_CLAP_UNIT_|\bOMX_PARAM_UNITS\b|param-contract\.json' .
```

prints nothing. The drop's PR quotes the command and its empty output per repository and tag. One hit stops the drop.

## 5. Tests that prove it

Each test has a sabotage arm: a change that must turn it red, run once and quoted in the PR that adds it.

- `units-codes-3202`: `omx-domain units --codes`, on a fixture contract directory holding the owners' items, prints
  byte for byte the code and token lines made from 3.20.2's `OMX_PARAM_CONTRACT_UNITS` value
  (`git show v3.20.2:data/param-contract.json`). The `OMX_UNIT_CODES(X)` body of `--render-c` equals 3.20.2's
  `OMX_PARAM_UNITS(X)` body. It cannot go green until OPEN QUESTIONS 13 and 14 are ruled.
  Sabotage: `db`'s code set to 14 in the fixture is red, naming `db`; `lufs` dropped is red, naming it.
- `units-enums-3202`: the `computes-in` symbols, and every symbol with `unknown`, equal 3.20.2's `$defs.unit` and
  `$defs.descriptorUnit` as sets, with no duplicate. Sabotage: a unit `kHz` added to a fixture domain is red, naming it.
- `units-conformance`: the C and TypeScript readers give the same list, codes, refusals and messages for every case.
  Sabotage: the TypeScript list sorted with `localeCompare` is red.
- `unit-duplicate-id`: one id in two domains is `contract.unit.duplicate`, naming both.
  Sabotage: a reader that keeps the first silently is red.
- `unit-duplicate-symbol`: one symbol under two ids is `contract.unit.duplicate`.
  Sabotage: the symbol check skipped is red.
- `unit-duplicate-code`: one wire code or token twice, or two code tables for one extension, is
  `contract.unit.duplicate`. Sabotage: the code check skipped is red.
- `unit-unresolved`: a conversion, a code or a spelling naming no unit is `contract.unit.unresolved`.
  Sabotage: a reader that drops the unresolved entry is red.
- `unit-dimension`: a conversion across dimensions, a two-step conversion and an unknown dimension word are
  `contract.unit.dimension`. Sabotage: the dimension check skipped is red.
- `units-floor-absent`: a floor naming an absent domain is `contract.dir.absent`.
  Sabotage: a reader that ignores floors is red.
- `units-floor-old`: a domain below its floor is `contract.package.too-old`.
  Sabotage: versions compared as strings (`1.10.0` below `1.9.0`) is red.
- `units-half-installed`: a code table naming a unit of an absent domain refuses at open, not at lookup.
  Sabotage: a lazy open is red.
- `units-descriptor`: a custom unit joins that descriptor's view only; one clashing with the base is
  `contract.unit.duplicate`, naming the descriptor. Sabotage: custom units merged into the base is red.
- `units-lookup`: an unknown id, symbol or code is `contract.word.unknown`; an index out of range is
  `contract.index.range`. Sabotage: the first unit returned for an unknown id is red.
- `units-locale`: `--list`, `--codes` and the renders are byte-identical under `LC_ALL=C` and a comma-decimal locale.
  Sabotage: printing with `setlocale(LC_ALL, "")` and `%g` is red.
- `units-threads`: lookups from eight threads on one handle under ThreadSanitizer report nothing.
  Sabotage: a lookup that caches into the handle is red.
- `units-memory`: open, `with_descriptor`, close the base first and then the view, under AddressSanitizer and
  Valgrind: no leak, no use after free. Sabotage: a view that borrows the base's strings is red.
- `schema-no-unit-list`: the schema holds no literal list for `unit`, `descriptorUnit` or `meaning`, and a descriptor
  with a unit outside its view is refused. Sabotage: a literal enum put back is red.
- `units-sz-grep`: the SZ gate prints each hit of the grep by repository, file and line, and exits 1 on any.
  Sabotage: one `OMX_CLAP_UNIT_NONE` planted in a fixture tree is red, naming it.

## 6. Risks

- A consumer still including `omx_param_units.h` breaks at SZ: the SZ grep at every released tag finds it first.
- A code changes value on the wire: `units-codes-3202` compares every code with 3.20.2's, byte for byte.
- An owner's domain is not installed and its units vanish: the consumer's floor refuses by name at start-up.
- A broken, unrelated installed domain stops every units open: the refusal names it, and the install-and-sync check
  of the owner's package catches it before a box sees it.
- Two owners claim one unit after a move: `contract.unit.duplicate` names both, at the first open in CI.
- The C and TypeScript readers drift: the shared conformance suite runs both.
- A comma-decimal locale corrupts a rendered factor: `units-locale` compares the bytes.
- A compile-time table goes stale against the installed domains: it is rendered at each consumer build, never
  committed, so a stale copy cannot exist in a tree.
- Dropping the literal enums weakens a generic JSON Schema validator: only omx-contract's validator checks units
  (accepted by the owner, OPEN QUESTION 8), and `schema-no-unit-list` proves that one does.
- A plugin declares a custom unit equal to a later shared one: the next open of its descriptor view refuses it by name.
- An inner repository needs an outer unit: the reader names the owner domain, and the case is fixed by moving the
  word down or the reader (owner ruling).

## Open questions for the owner

1. **The code table.** Who owns the token-to-code table of `org.openmixer.param-contract/1` (0 to 24 the LV2 units,
   0x100 up the vendor block)? The ruling assigns units, not their wire codes. Candidates: omx-clap-core, which
   declares the extension id in `omx_clap_ext.h`; or plugin-db, as a format spelling (V27).
   - **Ruled (owner, 2026-11-20):** the code table belongs to omx-clap-core.
2. **`min`, `LUFS`, `dB/s`.** They are in the items' `unit` list, but no omx-dsp 0.33.1 kernel states them:
   loudlevel's `targetLufs` and `gateLufs` state `dB`, and loudlevel's and balancer's `speedDbPerS` state `dB`.
   Do they go to omx-dsp (once the kernels state them), or to omx-panel as display units?
   - **Ruled (owner, 2026-11-20):** `min`, `LUFS` and `dB/s` (id `dB-s`) belong to omx-dsp. The kernels are fixed
     to state them; the follow-up list is in section 4, S2.
3. **`frames`, `bpm`, `midiNote`, `deg`.** Plugin-only units taken from LV2 (`units:frame`, `units:bpm`,
   `units:midiNote`, `units:degree`). Does plugin-db declare them beside the LV2 terms, or does each descriptor that
   uses one declare it as a custom unit?
   - **Ruled (owner, 2026-11-20):** `frames`, `bpm`, `midiNote` and `deg` belong to plugin-db.
4. **`ratio`, `dBTP`, `LU`.** Plugin-only units LV2 has no term for. `ratio` is written by 16 omx-plugins
   descriptors; `dBTP` and `LU` are loudness-meter units. Each descriptor's custom unit (16 declarations of one
   `ratio`, against rule 3), or one owner's (omx-dsp, which computes them, or omx-panel, which displays them)?
   If `ratio` becomes a descriptor's custom unit, two things follow:
   - the code table's 258 `ratio` token names no base unit: either it is refused as `contract.unit.unresolved` at
     open, or its `x-unit` is absent, as in question 5;
   - a custom unit has no wire code, so the extension reports 0 (`none`) where a plugin reports 258 today.
   - **Ruled (owner, 2026-11-20):** `ratio`, `dBTP` and `LU` belong to omx-dsp. `ratio` keeps its code 258, so its
     token has a unit and the two consequences above do not arise.
5. **Tokens with no unit.** `bar`, `beat`, `m`, `cm`, `mm`, `km`, `inch`, `mile`, `khz`, `mhz` (LV2 units with a code
   and no symbol) and the vendor `dbu`. Does the code table keep them as tokens with no unit (`x-unit` absent), or
   does an owner declare each as a unit?
   - **Ruled (owner, 2026-11-20):** `m`, `cm`, `mm`, `km`, `inch`, `mile`, `kHz` and `MHz` are real units, some
     derived: `kHz` and `MHz` from `Hz`, the lengths from the base `m` with a scale (the derived units table, section
     1). The LV2 lengths belong to plugin-db, `kHz` and `MHz` are derived of `Hz`. `bar` and `beat`: OPEN QUESTION 13.
     `dbu`: OPEN QUESTION 14.
6. **omx-panel's display units.** omx-panel declares no unit today; it prints the string it is given. Which units
   are display-only (for example `kHz` for a value computed in `Hz`)? Until ruled, `PANEL_UNITS` is not published.
   - **Ruled (owner, 2026-11-20):** omx-panel declares only the scaled display units it applies: `kHz` from `Hz`,
     `s` from `ms`, `%` from 0 to 1.
   - **Ruled (owner, 2026-11-20), the clash resolved:** omx-panel declares NO new unit ids. Its display rules are a
     base unit plus a scale over the owner's unit (for example `Hz` shown as `kHz` above 1000). `PANEL_UNITS` is
     omx-panel's display rules over the owners' units (the display rules in section 1).
7. **`meaning`.** The 47 words of `$defs.meaning` are not units. Who owns them: omx-panel (they are seeded from the
   panel roles), omx-plugins (role meanings, V31), or plugin-db (the LV2 `param:` and `lv2:designation` spellings)?
   - **Ruled (owner, 2026-11-20):** the `meaning` words belong to plugin-db.
8. **The schema enums.** With `x-units-of`, a generic JSON Schema validator accepts any string as a unit; only
   omx-contract's validator checks it. Is that accepted? The other way is a literal enum rendered at omx-contract's
   build from the installed owners' packages: that makes omx-contract's build read omx-dsp-contract and
   omx-panel-contract, a build cycle, and the rendered order would differ from 3.20.2's bytes.
   - **Ruled (owner, 2026-11-20):** a reference (`x-units-of`), not a literal list.
9. **Custom unit ids.** May two descriptors declare custom units with one id and different dimensions or texts?
   The design allows it, as each view is per descriptor.
10. **`CONTRACT_UNIT_DIMENSIONS`.** Is the dimension list contract format, held in omx-contract's `contract` domain
    as `PARAM_SCALES` is (V21), and are the proposed words right?
11. **Line S7.** V23's lines are S0, SA, S2, S6, S10, S11 and SZ, but omx-clap-core (layer 7) reads the units and V23
    lists its 0.34.0. This spec adds S7 for omx-clap-core. Should V23 say S7?
12. **The staging.** As written, both sources live from SA until SZ: 3.20.2's `OMX_PARAM_CONTRACT_UNITS`,
    `omx_param_units.h` and the `OMX_PARAM_CONTRACT_UNITS_*` lines of `omx_contract_limits.h`, and the merged view.
    That is a period with two sources across releases, which the no-back-compat rule lists, and no owner approval
    covers it. Is it approved, or does every reader switch in the same release that drops the old header, a flag
    day per consumer line?
    - As written: each consumer switches in its own release and no release breaks a build, but two sources live
      across releases until SZ.
    - Flag day: there is one source at every moment, but omx-clap-core, omx-plugins, omx-panel and the console
      release together with omx-contract's drop, and a reader one release late fails to build.
13. **Q13 (proposal): `bar` and `beat`.** Where they are used, at origin/main of every repository under the audio tree:
    - They are the LV2 unit terms `units:bar` and `units:beat`, with codes 4 and 5 in 3.20.2: `data/param-contract.json`
      lines 31 and 32, `include/omxcontract/omx_param_units.h` lines 37 and 38 (`OMX_CLAP_UNIT_BAR`,
      `OMX_CLAP_UNIT_BEAT`, "bars of the transport"), `data/formats/lv2/units.json` lines 27 to 38 (status
      `supported-later`); copied in plugin-hostd and plugin-qualify (`data/formats/lv2.json` line 2027 and 2031) and in
      omx-formats (`contract.d/formats/lv2/lv2.json` lines 4970 to 4982). The console lists both among its CLAP
      parameter units.
    - No kernel of omx-dsp, no descriptor or declaration of omx-plugins, and nothing of omx-panel states `bar` or
      `beat` as a unit: no hit. The widget word `bar` in omx-panel is a bar group of faders, not a unit.
    - Real LV2 ports use them: the console's scanned LV2 catalog has 172 ports in `bars` and 160 in `beats`, across
      10 of 194 plugins. The `bars` ports are delay and
      chorus times ("Delay 15 bar fraction", symbol `treff`, 0 to 2, not integer; "Time fraction", symbol `frac`,
      0.015625 to 8) and the `beats` ports are denominators ("Delay 15 bar denominator", symbol `trefd`, 1 to 64,
      integer; `fbbd`). A fraction of a bar and a note-length denominator, so a count of a musical length, not a
      duration. plugin-hostd's fixture `tests/fixtures/fields/lv2-compressor.json` line 28 has a compressor's release
      in `units:beat` (port 7), and omx-contract's example `examples/descriptors/scanned-lv2-compressor.json` lines
      36 to 41 carries it as unit `unknown`, "Release (beats)".
    - The transport is not a unit use: omx-clap-core carries a position, not a unit
      (`src/clap_stage.h` lines 1891 to 1894: `song_pos_beats`, `bar_start`, `bar_number`; `lv2/core/lv2_core.h` lines
      565 to 574: `time:bar`, `time:barBeat`; `lv2/core/lv2_instance.c` line 2152: `beat_unit`, `beats_per_bar`); the
      console's transport fields `bar`, `beat`, `positionBeats` and `loopStartBeats` are positions too.
    - **Proposal.** Two units, `bar` and `beat`, owned by plugin-db, role `format`, dimension `musical-time` (one of the
      proposed words of OPEN QUESTION 10), symbols `bars` and `beats`, the LV2 terms' own. They declare no conversion
      to each other: a bar is a meter's number of beats, and the meter is the transport's, so no fixed factor is true.
      Their codes 4 and 5 and their tokens stay, with `x-unit` naming them. A transport position (a bar number, a beat
      in a bar, `song_pos_beats`) is not a unit and is not declared: it is a position, carried by the transport
      extension of omx-clap-core, outside this document. The delay's fraction and denominator are counts of a note
      length: a plugin that wants them as plain counts declares them `none` in its descriptor, and a scanned port
      keeps `bars` and `beats` as the format says.
14. **Q14 (proposal): `dbu`.** Where it is used, at origin/main of every repository under the audio tree:
    - A vendor token, code 257: `data/param-contract.json` lines 53 and 84 ("decibels relative to 0.775 V RMS, an
      analogue level (vendor block)"), `include/omxcontract/omx_param_units.h` line 69; word of `ownership/words.json`
      line 1008. It has no symbol in the descriptor schema, so no descriptor may state it today.
    - omx-dsp states no kernel in it, but accepts it as an input word of the curve primitive:
      `data/primitives/curve.json` line 95, `include/omxdsp/omx_curve.h` line 154 (`OMX_CURVE_UNIT_WORDS`),
      `ts/src/definitions.ts` line 138
      (`CURVE_UNITS`), `shapes/curve-io.schema.json` line 167; used as a threshold unit in `ts/test/agreement.test.mjs`
      line 315.
    - omx-panel accepts it as a level unit and as a unit of the `threshold` and `ceiling` roles: `tools/role-table.mjs`
      line 14 (`LVL`), `tools/panel-description.mjs` line 42 (`LEVEL_UNITS`), `docs/panel-layout.md` lines 30 and 36,
      `docs/skin-package.md` lines 59 to 61, with a test (`test/panel-layout.test.mjs` lines 73 and 74).
    - omx-plugins defines it in its own LV2 text as a custom unit of the declaration, `urn:openmixer:unit#dBu`, with
      the rendering `%f dBu` (`tools/gen.mjs` line 528, `tools/format-tables.mjs` line 105), and no plugin control or
      face states it today (`docs/declaration-as-descriptor.md` lines 92 and 109).
    - The console lists it among its control units, with their token map, and among its CLAP parameter units. Its
      head-amp store used it for a sensitivity, and no longer does. libreac still states the
      stagebox sensitivity curve in hundredths of a dBu (`include/reac/reac_ctrlblk.h` lines 275 to 278,
      `REAC_HEADAMP_SENS_REF_CDB`), a number in the library, not a declared unit.
    - **Proposal.** One unit, `dBu`, owned by omx-dsp (it accepts it as an input unit and the panel's level roles take
      it: the same family as `dBFS`, `LUFS` and `dBTP`), role `computes-in` once a kernel or the curve primitive
      states it, dimension `level`, symbol `dBu`, token `dbu` and code 257 kept. It is a logarithmic unit, so it
      declares no conversion (the existing rule). Its reference is written in its description, `0.7746 V RMS`
      (20 times the log of the voltage over that reference). Not a derivation from dBV: the offset between them
      (about 2.2 dB) is a fixed number, but the design has no `dBV` unit and no use of one, so it is not added.
      omx-plugins' own `urn:openmixer:unit#dBu` unit then goes to the shared one. The other form, a `x-reference`
      field (value and unit) on a level unit, is the owner's choice if a second analogue reference unit (`dBV`) is
      ever needed.
