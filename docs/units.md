<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com> -->
# Units: one list, in omx-contract

**Status: DESIGN, nothing implemented.** This is the units lane of the sorting pass: row 30 of
[ownership-map.md](ownership-map.md). Vocabulary moves stay frozen in releases, so nothing here lands before the
release pass is over. It follows the owner's ruling of 2026-11-20, which replaced the per-producer design.

## The rule

- omx-contract holds ONLY the STANDARD words: the standard units, the standard parameter meanings and the unit
  dimensions.
- Anything PARTICULAR to a level stays at that level, with that level's MAPPING to the standard:
  - The format levels keep their own spellings and map them to the standard unit ids and parameters: plugin-db for
    LV2 (the unit terms such as `units:db`, `lv2:designation`, the `param:` spellings), omx-clap-core for CLAP (the
    unit codes of `org.openmixer.param-contract/1`).
  - omx-panel keeps the panel words, the control kinds and the display rules.
  - A plugin keeps its own custom units and words, in its declaration.
- Host-level product words stay with the hosts: hosting with omx-clap-core; machine, probe and qualification with
  plugin-hostd.

## The one list

The list is `PARAM_UNITS` of `data/primitives.json`, a words item (`data/param-contract.json` holds the code sheet). On
main it holds the 15 units the items use,
each word with its symbol. It is the start. Each word is `id`, `symbol`, `dimension`, `scope` and, on a derived unit,
its
conversion: a `base` unit and a `scale` (a value in the unit times `scale` is a value in `base`). A base has no base of
its own. A logarithmic unit (`dB`, `dBFS`, `dBu`, `dBTP`, `LUFS`, `LU`) has no conversion: its offset depends on a
reference. The list holds no code, no LV2 term and no token: those are the format levels' (below).

| Id | Symbol | Dimension | Conversion (base, scale) | Scope |
|---|---|---|---|---|
| `none` | `""` | none | none (a base unit) | param |
| `s` | `s` | time | none (a base unit) | param |
| `ms` | `ms` | time | `s`, 0.001 | param |
| `min` | `min` | time | `s`, 60 | param |
| `bar` | `bar` | musical-time | none (a base unit) | descriptor |
| `beat` | `beat` | musical-time | none (a base unit) | descriptor |
| `frames` | `frames` | count | none (a base unit) | descriptor |
| `m` | `m` | length | none (a base unit) | descriptor |
| `cm` | `cm` | length | `m`, 0.01 | descriptor |
| `mm` | `mm` | length | `m`, 0.001 | descriptor |
| `km` | `km` | length | `m`, 1000 | descriptor |
| `inch` | `inch` | length | `m`, 0.0254 | descriptor |
| `mile` | `mile` | length | `m`, 1609.344 | descriptor |
| `dB` | `dB` | gain | none (logarithmic) | param |
| `percent` | `%` | none | `x`, 0.01 | param |
| `x` | `x` | none | none (a base unit) | param |
| `Hz` | `Hz` | frequency | none (a base unit) | param |
| `kHz` | `kHz` | frequency | `Hz`, 1000 | descriptor |
| `MHz` | `MHz` | frequency | `Hz`, 1000000 | descriptor |
| `bpm` | `bpm` | tempo | none (a base unit) | descriptor |
| `oct` | `oct` | pitch | none (a base unit) | param |
| `cents` | `cents` | pitch | none (a base unit) | param |
| `st` | `st` | pitch | none (a base unit) | param |
| `deg` | `deg` | angle | none (a base unit) | descriptor |
| `midiNote` | `midiNote` | pitch | none (a base unit) | descriptor |
| `dBFS` | `dBFS` | level | none (logarithmic) | param |
| `dBu` | `dBu` | level | none (logarithmic) | descriptor |
| `ratio` | `ratio` | ratio | none (a base unit) | descriptor |
| `LUFS` | `LUFS` | loudness | none (logarithmic) | param |
| `dB-oct` | `dB/oct` | slope | none (a base unit) | param |
| `dB-s` | `dB/s` | rate | none (a base unit) | param |
| `dBTP` | `dBTP` | level | none (logarithmic) | descriptor |
| `LU` | `LU` | loudness | none (logarithmic) | descriptor |
| `us` | `us` | time | `s`, 0.000001 | descriptor |
| `bytes` | `bytes` | information | none (a base unit) | descriptor |
| `nsPerSample` | `ns/sample` | time-per-sample | none (a base unit) | descriptor |
| `plainCount` | `count` | count | none (a base unit) | descriptor |
| `flag` | `flag` | none | none (a base unit) | descriptor |

- `scope` defines the render: `param` is a unit of the items' `$defs.unit` (today's 15, which `PARAM_UNITS` already
  holds); `descriptor` is a unit only a descriptor's control may state, and goes to `$defs.descriptorUnit` (today's
  plugin-only units, and the units that join: `bar`, `beat`, the lengths, `kHz`, `MHz`, `dBu`). A descriptor's
  `travel.unit` takes either scope, or `unknown`, which stays the descriptor format's "states no unit" word, not a
  unit. `LUFS` is in both lists in 3.20.2; here it is `param`, and a descriptor still takes it. The split is kept (Q16,
  ruled).
- `bar` and `beat` are counts of a musical length (a delay's bar fraction and note denominator). Their length depends
  on the meter, so neither is derived from the other. A transport position (a bar number, a beat in a bar) is a
  position, not a unit.
- `dBu` is decibels relative to 0.7746 V RMS, an analogue level. `dBV` is not added: nothing uses it.
- `$defs.unit` is the symbols of the `param` words and `$defs.descriptorUnit` those of the `descriptor` words and
  `unknown`, rendered from the list, as `$defs.unit` is today from `PARAM_UNITS` (`render --check` holds the committed
  schema to it). A unit is added in one place.

- The resource units `us`, `bytes`, `nsPerSample`, `plainCount` and `flag` join the list (coordinator ruling Q6,
  2026-11-20). They are host resource units, not parameter units, so they have `descriptor` scope: they widen no
  released item enum. Their words stay with plugin-hostd, whose `RESOURCE_UNITS` name these standard ids (map row M8).
  Dimensions: `us` is `time`, derived of `s` by 0.000001. `bytes` is `information`, a new dimension, not `count`: a
  size in bytes is a quantity of data, and `count` is a number of things (`frames`, `plainCount`), so a panel would
  never offer a conversion between the two. `nsPerSample` is `time-per-sample`, a new dimension, not `time`: it is a
  cost per sample, and a time dimension would let a reader convert it to `ms` or `s` as a duration. `plainCount` is
  `count`. `flag` is `none`, a boolean (0 or 1). `nsPerSample` has no base, and neither has any of them but `us`.

### The dimensions

`CONTRACT_UNIT_DIMENSIONS`, a words item of omx-contract's `contract` domain, as `PARAM_SCALES` is: `none`, `time`,
`frequency`, `gain`, `level`, `loudness`, `pitch`, `angle`, `length`, `tempo`, `musical-time`, `count`, `slope`,
`rate`, `ratio`, `information`, `time-per-sample`. A derived unit and its base have the same dimension.

### The format levels

Each format level holds its own spellings and a mapping to the standard ids above.

- **The code table, omx-clap-core.** Ruled (coordinator, 2026-11-20; the owner's Q1 answer stands): the unit codes of
  `org.openmixer.param-contract/1` are the wire encoding of a CLAP-level extension, so a CLAP-level particular. 29
  tokens, each a wire code (0 is no unit, 1 to 24 are the LV2 units one to one, 0x100 (256) up a vendor block) mapped to
  a standard unit id; codes are append-only. A descriptor names standard unit ids, never codes: only the extension
  encodes them. It is the released `OMX_PARAM_CONTRACT_UNITS` (3.20.2), rendered to `omx_param_units.h` and
  `omx_contract_limits.h`. It is therefore a move OUT of omx-contract, a row of the sorting pass: the sheet and its
  render go to omx-clap-core; each reader (omx-plugins, omx-panel, the console, omx-clap-core's own code) switches its
  read, and its floors, to omx-clap-core's contract package; the old sheet in omx-contract is removed last. The PRs
  are those of the map amendment (the amendment of omx-contract#142, being written). Until then the 3.20.2 sheet is
  what the readers read.
- **The scale codes, omx-clap-core.** Ruled (coordinator, 2026-11-20): the param-contract SCALE codes are a CLAP
  particular like the unit codes. They go to omx-clap-core, each code mapped to a word of `PARAM_SCALES`, which stays
  standard in omx-contract (owner answer Q1). This is map row V21b, beside the unit codes.
- **LV2, plugin-db.** The LV2 unit terms (`units:db`, `units:khz`, ...), `lv2:designation` and the `param:`
  spellings, each mapped to a standard unit id or parameter meaning. `LV2_UNITS_TERMS`, the unit terms, is NOT in
  plugin-db today (a grep of its main finds none): it lives in omx-contract (`data/formats/lv2/units.json`), with
  copies in plugin-hostd and plugin-qualify (`data/formats/lv2.json`) and omx-formats. It MOVES to plugin-db as new
  data there, and the copies read it from there.

The token-to-id map of the code table, where they differ:

| Token | Code | Unit id |
|---|---|---|
| `none` | 0 | `none` |
| `s` `ms` `min` | 1 2 3 | `s` `ms` `min` |
| `bar` `beat` | 4 5 | `bar` `beat` |
| `frame` | 6 | `frames` |
| `m` `cm` `mm` `km` `inch` `mile` | 7 to 12 | the same ids |
| `db` | 13 | `dB` |
| `pc` | 14 | `percent` |
| `coef` | 15 | `x` |
| `hz` `khz` `mhz` | 16 17 18 | `Hz` `kHz` `MHz` |
| `bpm` | 19 | `bpm` |
| `oct` `cent` `semitone12TET` | 20 21 22 | `oct` `cents` `st` |
| `degree` `midiNote` | 23 24 | `deg` `midiNote` |
| `dbfs` `dbu` `ratio` `lufs` | 0x100 (256) 0x101 (257) 0x102 (258) 0x103 (259) | `dBFS` `dBu` `ratio` `LUFS` |
| `dboct` `dbs` `dbtp` `lu` | 0x104 (260) 0x105 (261) 0x106 (262) 0x107 (263) | `dB-oct` `dB-s` `dBTP` `LU` |

The last row is new (owner ruling Q15, 2026-11-20): `dB/oct`, `dB/s`, `dBTP` and `LU` take the next omx-clap-core
codes, 0x104 (260) up, append-only, because our plugins use them. Its tokens are my proposal, spelled as the vendor
tokens
are (lower case). The 3.20.2 sheet has 29 tokens; the table at its new holder has 33. The five resource units carry no
code.

## Panels

omx-panel's display rules are behaviour over the units above, not units: it declares no unit id. A rule shows a
value in a larger unit of the same dimension: `Hz` as `kHz` from 1000 Hz up; `ms` as `s` and a 0 to 1 `x` as `%`,
with thresholds that are the panel's to state. The rules read the ids, bases and scales of the list (`ms` to `s` is
0.001,
`percent` to `x` is 0.01: the panel holds no scale of its own); the panel keeps no
unit table of its own.

omx-panel defines only the general panel vocabulary, scales and laws, never a per-plugin or per-format mapping. The
mapping from a particular scale or unit to them lives at the particular level: a plugin's custom unit, or a format's
own scale, maps ITSELF onto the general panel scales and laws at its own level: in the plugin's declaration, in
plugin-db for LV2, in omx-clap-core for CLAP. omx-panel holds only the general panel vocabulary and scales.

## Plugin particulars

A descriptor declares its own units in an optional `units` array of the descriptor (a minor of the descriptor schema):
`id`, `symbol`, `dimension`, optional base and scale, `text`. A custom unit has no wire code: the extension reports it
as `none`. It maps itself onto the standard units and the panel's general scales in the same declaration. The same
custom id may be declared by two plugins (owner answer, Q9).

A custom unit that reuses the id or the symbol of a unit of the list is refused. No refusal code exists for it today
(the descriptor's `unit` is a closed list, so a custom unit has no place yet). Adopted
(coordinator, 2026-11-20): `contract.descriptor.unit-duplicate`, naming the descriptor, the custom unit and the standard
unit it repeats. It
joins `CONTRACT_CODES` beside `contract.descriptor.control-duplicate`. It is work in the descriptor validator and a
sorting-pass item in omx-contract.

## The proof for each level

One call-level test per particular level: every LV2 term of plugin-db, every code of the code table, every display
rule of omx-panel and every custom unit of a plugin descriptor maps to an id of omx-contract's list, and every
particular scale of a plugin or format parameter maps to a general panel scale or law of omx-panel, or is named as
that level's particular (listed in that level's own file, with the reason). It runs through the public call that
reads the list, not through a copy. Sabotage: removing a mapped id from the list (`dBu`, say) turns it red, naming
the term, code, rule or descriptor that mapped it.

## What this replaces

- The split of units by producer (a units item per repository): withdrawn by the owner.
- The merged reader and its `omx-domain` command: withdrawn.
- The schema reference to a merged view in place of a list (Q8 is moot): withdrawn. The enums are rendered from the
  list.
- The two-source period and the flag day (Q11, Q12): withdrawn. The list stays where it is (the code
  table's move is its own row), so nothing of the list is staged and no consumer switches.
- omx-contract#144 (`PARAM_UNITS` leaves main) is superseded by this ruling: its main change, taking `PARAM_UNITS`
  and its schema enum render off main, is ruled out. Whether it is closed is a coordinator or owner decision, citing
  the one-place ruling. What survives it is carried below. The follow-up of the kernels that state `min`, `LUFS` and
  `dB/s` is withdrawn with the split.

## Carried from #144

Carried from #144: the tests of the released code sheet, which it restores in `test/param-units.test.mjs` and which
this design keeps, over the code table (the tests follow the table to its holder). Each has the
sabotage arm it has there:

- the codes are the ones omx-plugins shipped (0.15.0), append-only: `none` 0 to `midiNote` 24, `dbfs` 0x100 (256),
  `dbu` 0x101 (257), `ratio` 0x102 (258), `lufs` 0x103 (259); a token added after is above 0x103 (the four of Q15
  are 0x104 (260) to 0x107 (263));
- the rendered `omx_param_units.h` has one `OMX_CLAP_UNIT_` define per token and none other, and the same tokens as
  the `OMX_PARAM_UNITS(X)` table, in order;
- the limits header spells `OMX_PARAM_CONTRACT_UNITS_DB` once, never `OMX_OMX_`;
- a C reader compiles `_Static_assert`s on the codes and expands `OMX_PARAM_UNITS(X)` to find a token's word;
- sabotage: a code changed in the data (`db` set to 99) is not the shipped code, and the committed header goes stale.

Carried from #144: the list of readers of `OMX_PARAM_CONTRACT_UNITS`, which switch to omx-clap-core's contract package
when the sheet moves:
omx-clap-core (`src/param_contract.h`, `src/clap_host.h`, `src/omx_clap_ext.h`, `lv2/clap/lv2_clap.c` and the
omx-clap-host twin); omx-plugins (`include/omx_param_contract.h`, `tools/param-contract.mjs`, `Makefile`,
`docs/declaration-as-descriptor.md`); omx-panel (`docs/behaviour-core.md`, `docs/panel-layout.md`, `BUILDING.md` and its
packaging, docs and build floors only); the console.

Not carried: its new test `units-not-owned` (it expects no `PARAM_UNITS`, the opposite of this design), its removal of
`PARAM_UNITS` from `data/primitives.json`, the schema `symbol` field, `tools/unit-enum.mjs`, the catalogs, the ownership
files and the goldens. `PARAM_UNITS` stays, and its enum render stays with it. #144 has no unit data fix beyond these.

## Owner answers that carry over

- Q9: two descriptors may declare the same custom unit id.
- Q10: the dimensions are contract format, in omx-contract's `contract` domain.
- Q13: `bar` and `beat` are standard units, in omx-contract's list.
- Q14: `dBu` is a standard unit, code 0x101 (257), the 0.7746 V reference, in omx-contract's list.
- Q6 (coordinator): the five resource units join the list, in the units table above, with `descriptor` scope.
- Q2 (coordinator): the param-contract scale codes are omx-clap-core's, mapped to `PARAM_SCALES` (map row V21b).

## The standard unit id, its display spelling and the code-to-id render

**Status: DESIGN (Q-a and Q-b ruled, the render shape chosen; the mapping-table kind open).** It answers the two
questions of the V23d readers (Open-Mixer/omx-clap-core#158): which spelling a reader writes for a standard unit,
and how a C reader gets from a CLAP unit code to that spelling. It describes the list as the sorting pass releases it,
`PARAM_UNITS` of the `param` domain (`contract.d/param/param.json`), whose words carry a `title` (the item's key, a
macro stem) and a `const` (the word).

### Q-a: a standard unit id is the word's `const`

- **Ruling (coordinator, 2026-11-22):** a standard unit id is the `const` of a `PARAM_UNITS` word, as released:
  `dB`, `dBFS`, `Hz`, `kHz`, `deg`, `percent`, `dB-oct`, `dB-s`, `nsPerSample`, `plainCount` and the rest of the list.
  It is ASCII, stable and never re-spelled. **Why:** the `const` is the word the domain format defines as the word
  (the `title` is only the key a macro is spelled from), the table of this page names the ids by it, and the readers
  that name a standard unit read it already: omx-panel's `unitIdOf` returns the `const`, and plugin-db's
  `LV2_UNIT_IDS` maps a term to it. None takes a key as an id.
- **Ruling (coordinator, 2026-11-22):** the display spelling of an id is its word's `x-symbol`: `%` for `percent`,
  `dB/oct` for `dB-oct`, `dB/s` for `dB-s`, `ns/sample` for `nsPerSample`, `count` for `plainCount`, `""` for `none`,
  and the id itself for every other word. **Why:** a symbol carries `/`, `%` and the empty string, which an id must
  not, so the two are kept apart: the id is what is stored and sent, the symbol is what is shown.
- **Ruling (coordinator, 2026-11-22):** a format level's own spellings are that level's, mapped onto the id at that
  level, and never ids: omx-clap's tokens (`db`, `hz`, `degree`, `dbPerOct` in its `OMX_PARAM_CONTRACT_UNIT_IDS`
  keys, Open-Mixer/omx-clap-core#171), plugin-db's LV2 terms (`units:db`). **Why:** this is the one-place rule of
  this page (the standard words here, the particulars at their level). A lowercase key that happens to name a word
  (`db`) is a key: the two spellings agree only where key and word are equal (`ms`, `st`, `cents`, `percent`), so a
  reader that took the key would be right by accident on those and wrong on twelve.

The keys and words that differ, as the sorting pass releases them, so a mapping that holds keys can be checked by
eye:

| Key (`title`) | Id (`const`) |
|---|---|
| `db` `dbfs` `dbu` `dbtp` | `dB` `dBFS` `dBu` `dBTP` |
| `hz` `khz` `mhz` | `Hz` `kHz` `MHz` |
| `lufs` `lu` | `LUFS` `LU` |
| `dbPerOct` `dbPerS` | `dB-oct` `dB-s` |
| `degree` | `deg` |

So the values of omx-clap's `OMX_PARAM_CONTRACT_UNIT_IDS` are ids: `db` maps to `dB`, `degree` to `deg`,
`dbPerOct` to `dB-oct`, and its check holds each value to a `const` of `PARAM_UNITS`, not to a key.

### Q-b: the code-to-id lookup is a rendered X-macro

- **Ruling (coordinator, 2026-11-22):** the lookup from a CLAP unit code to a standard id is RENDERED from the
  domain, by the producer (omx-clap renders it, from the one source, as `host_verbs.h` is rendered), as an X-macro a
  C reader expands. It is never a hand-written decoder. **Why:** a decoder typed in C is a second copy of the
  mapping that nothing holds to the domain; a rendered table is held to it by `render --check`, so a code added to the
  sheet reaches every C reader at the next render.
- **Ruling (coordinator, 2026-11-22):** the protocol's `param_info` text does not change in this pass. **Why:** the
  pass moves words and does not change a wire; if a reader truly needs the id in `param_info`, that is a named
  post-pass issue, not part of this design.

### The render shape

Chosen by the coordinator (2026-11-22) and sent to the reader's owner; the interface is fixed, and
Open-Mixer/omx-clap-core#171 builds against it.

- **The codes keep one owner.** A code is a number of `OMX_PARAM_CONTRACT_UNITS`, the numeric wire sheet, and of
  nothing else: there is no second numeric sheet keyed to code. The new render spells a code by the name of its
  define in `omx_param_units.h`, never by its number.
- **A string section.** The render is a `strings` section of an owner's header (docs/render.md): one row per field
  of a string sheet, `X(<prefix><FIELD>, "<field>", "<value>")`, in the sheet's order, `FIELD` the same upper snake
  case as the `numbers` section's. The value is quoted because an id carries `-` (and a symbol `/`), which no C
  identifier can.
- **The header.** `omx_param_unit_ids.h`, macro `OMX_PARAM_UNIT_IDS(X)`:

  ```c
  #define OMX_PARAM_UNIT_IDS(X) \
      X(OMX_CLAP_UNIT_NONE, "none", "none") X(OMX_CLAP_UNIT_S, "s", "s") ... \
      X(OMX_CLAP_UNIT_DB, "db", "dB") X(OMX_CLAP_UNIT_PC, "pc", "percent") ... \
      X(OMX_CLAP_UNIT_DBPEROCT, "dbPerOct", "dB-oct") X(OMX_CLAP_UNIT_DBPERS, "dbPerS", "dB-s") ...
  ```

- **The prefix is the units header's.** `strings.prefix` equals `numbers.prefix` of the header that renders
  `OMX_PARAM_CONTRACT_UNITS` (`OMX_CLAP_UNIT_`), so the first argument of a row is the code define that header
  already renders. The ids header does not include `omx_param_units.h`; a C reader includes both, and its join is the
  row itself:

  ```c
  #include <omx-clap-host/omx_param_units.h>
  #include <omx-clap-host/omx_param_unit_ids.h>

  static const char *unit_id(uint32_t code)
  {
  #define X(code_define, token, id) if (code == (code_define)) return id;
      OMX_PARAM_UNIT_IDS(X)
  #undef X
      return NULL; /* a code with no row: the reader's own refusal */
  }
  ```

- **The ids item has its own file.** `OMX_PARAM_CONTRACT_UNIT_IDS` gets its own `x-file` (for example
  `data/param-unit-ids.json`) and its own `x-render` entry; the units sheet keeps its file and header. A header reads
  the items of its own file, so the `numbers` section of `omx_param_units.h` needs no item filter and never meets a
  string, and the `strings` section of `omx_param_unit_ids.h` never meets a number.
- **The refusals, by name.** The render refuses, naming the header, the item and the field:
  - a field that the sibling numbers sheet (`OMX_PARAM_CONTRACT_UNITS`, the sheet of the header whose
    `numbers.prefix` is this section's prefix) does not name: a row whose first argument would be no define;
  - a value that is not a `const` of `PARAM_UNITS`: a key (`db`), a symbol (`%`) or a word the list does not hold.

  A read that lacks the sibling sheet or `PARAM_UNITS` is refused by name too, never rendered without the check.

The code is a follow-up of this page (below, "Where the code lands").

### The mapping table of plugin-hostd (V19, M5, D1, D2)

Open-Mixer/plugin-hostd#215 asks for two things: a domain kind for a mapping table, and the unit format of
`$defs.unit`. The string section above is NOT that mapping table. It is the C form of one mapping, omx-clap's code
to id, which #215's rows D1 and D2 read in C (`param_info`'s unit and the scan descriptor's unit), and M5 names as
the source of a lookup. What #215 needs beyond it:

- **The maps are `formatMap` items** (`PLUGIN_HOSTD_CLAP_MAP`, `PLUGIN_HOSTD_LV2_MAP` of plugin-hostd's
  `data/formats/{clap,lv2}.json`): rows keyed by a source field, each with a term link (`term`, or `from`), exactly
  one class (a descriptor `word` with its `transform` and its `values` or `factor`, `extension`, or `dropped` with a
  `ruling`) and a `doc`. A string sheet is one flat lookup; a row of a map holds a lookup, among other words. The
  domain format has no kind that rebuilds a `formatMap` item (docs/contract-dir.md).
- **A row that names a mapping instead of carrying it** (M5): the CLAP unit row today carries its own lookup, token
  to symbol (`pc` to `%`, `coef` to `x`, `degree` to `deg`), a copy of omx-clap's mapping in other spellings. M5 has
  it name `OMX_PARAM_CONTRACT_UNIT_IDS` (and the LV2 rows plugin-db's `LV2_UNIT_IDS`, `LV2_DESIGNATION_MEANINGS`)
  instead. That is a new word of a map row, a reference where `values` stands.

A proposal, not a ruling (the kind is not ruled; its questions are 17 to 21 below):

- **`"x-kind": "formatMap"`**, after the `terms` kind: `x-format` (`clap` or `lv2`) the item's, and a `oneOf` of one
  word per row, `const` and `title` both the source field (which may hold `.`, `:` and `_`), `x-code` its place and
  `x-row` the row as the data form writes it (`term` or `from`, `word`, `extension` or `dropped`, `doc`). `render
  --with-domain` rebuilds the data `formatMap` item from it, the build holds each row to the schema's `formatMapRow`,
  and the runtime readers serve the item as words, the words its source fields.

  ```json
  "PLUGIN_HOSTD_CLAP_MAP": {
    "description": "...", "x-since": "...", "x-kind": "formatMap", "x-file": "formats/clap.json", "x-format": "clap",
    "oneOf": [
      { "const": "omx_clap_param_contract_entry.unit", "title": "omx_clap_param_contract_entry.unit", "x-code": 0,
        "x-row": { "from": "omx_clap_ext.h#omx_clap_param_contract_entry.unit",
                   "word": { "word": "controls[].travel.unit", "transform": "lookup",
                             "valuesFrom": { "ref": "OMX_PARAM_CONTRACT_UNIT_IDS" } } } } ] }
  ```

- **`valuesFrom`**, a word of a row's `word` beside `values` and `factor` (one of the three): `{ "ref": "<ITEM>" }`,
  a sheet of strings of a package the document's `info.x-requires` names. The build refuses, by row, a ref that
  resolves to no item, to an item that is no string sheet, or to a package with no floor.

### S0: the unit format of `$defs.unit`

#215 asks that the lookup values become standard unit ids, with "the ruled id spelling and the dimension word".

- **The spelling is answered by Q-a:** a value is the `const` of a `PARAM_UNITS` word.
- **The dimension word is answered by the list:** a map carries no dimension. A reader that needs one reads the id's
  `x-dimension` in `PARAM_UNITS`; a dimension copied into a map would be a second place for it.
- **Not answered by Q-a: the enum of the descriptor.** `$defs.unit` and `$defs.descriptorUnit` are the SYMBOLS of the
  list (`tools/unit-enum.mjs` renders each word's `x-symbol`), so a descriptor's `travel.unit` states `%`, `dB/oct`,
  `""`. D2 puts the id there. The two differ on six words: `percent` (`%`), `none` (`""`), `dB-oct` (`dB/oct`),
  `dB-s` (`dB/s`), `nsPerSample` (`ns/sample`), `plainCount` (`count`). Proposal: both enums become the `const`s of
  their words (`unknown` stays the descriptor's "states no unit" word), and a reader shows the `x-symbol`. It is a
  change of the descriptor schema: a descriptor that states `%` is refused after it. No alias or dual spelling is
  proposed (question 22).

### Where the code lands

The code is not small, so it is a follow-up PR, after chain 1 tags, on the tagged main: a sheet of strings in the
schema (`sheetValue` holds numbers only today) and in the domain reader (a sheet's `x-value` of strings), the
`strings` section and its refusals in `render/c/owner-headers.mjs`, which need two items outside the header's own
file (the sibling sheet and `PARAM_UNITS`), and their tests, red first: a golden `omx_param_unit_ids.h`, and a
sabotage arm per refusal (a field the units sheet lacks, a value `db`, a read without `PARAM_UNITS`). omx-clap then
moves `OMX_PARAM_CONTRACT_UNIT_IDS` to its own file and renders the header (Open-Mixer/omx-clap-core#171).

## Open questions for the owner

15. **Codes for `dB/oct`, `dB/s`, `dBTP` and `LU`.** They have no code, so a plugin that states one reports 0
    (`none`), as today. Do they take the next codes (0x104 (260) up, append-only), or stay without?
    - **Ruled (coordinator, 2026-11-20):** they take 0x104 (260) `dB-oct`, 0x105 (261) `dB-s`, 0x106 (262) `dBTP`, 0x107
      (263) `LU`, the next omx-clap-core codes, because our plugins use them.
16. **Keep the split of `$defs.unit` and `$defs.descriptorUnit`?** The list's `scope` (`param` or `descriptor`) defines
    it for now. The split is a 3.20.2 fact: a descriptor takes both lists anyway, so one list of units would do. Keep
    the split, or drop it and render one enum?
    - **Ruled (coordinator, 2026-11-20):** keep the split. The joiners (`bar`, `beat`, the lengths, `kHz`, `MHz`, `dBu`)
    have
      `descriptor` scope, so the released item enum does not widen.


Not ruled yet, from the mapping-table kind and S0 above (Open-Mixer/plugin-hostd#215):

17. **The kind's name and shape.** Is it `"x-kind": "formatMap"` with each row verbatim in `x-row`, as the `terms`
    kind keeps a term in `x-term`, or does each word of a row get its own `x-` word (`x-term`, `x-word`,
    `x-transform`, ...)? The first keeps the domain reader small and the row's schema the data form's; the second lets
    the reader refuse a bad row word by word without the data schema.
18. **What the rebuild writes for `valuesFrom`.** Does the rebuilt `data/formats/clap.json` keep the reference (the
    loader resolves it at run time, and the file differs once from today's), or the values expanded from the named
    sheet (today's shape, byte for byte, but a copy in the installed file)? #215's gate says "byte for byte"; against
    which form?
19. **How the run time reads the named sheet.** The runtime readers serve no sheet (docs/contract-dir.md). Does
    plugin-hostd's probe resolve the CLAP lookup through the rendered `OMX_PARAM_UNIT_IDS(X)` in C, or do the C loader
    and `openDomainAt` start serving string sheets?
20. **The LV2 side.** plugin-db's `LV2_UNIT_IDS` keys are terms (`units:db`), which no `<prefix><FIELD>` define
    spells and which have no sibling numbers sheet, so the `strings` section does not render them. Is the LV2 lookup
    data only (no C header), or does it need a section of its own?
21. **A code with no id.** The `strings` section refuses a field the units sheet lacks; should it also refuse a field
    of the units sheet that has no row (every code mapped), or does that stay the map check's (omx-clap's
    `param-units-map-check.py`, which holds it today with "no two codes on one id")?
22. **S0: the descriptor's unit enum.** Do `$defs.unit` and `$defs.descriptorUnit` become the ids (the six words
    above change, a descriptor schema change with no alias), or does the descriptor keep the symbol, so that D2
    writes the symbol and only the wire and the stores carry the id?
