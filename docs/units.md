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

The list is `PARAM_UNITS` of `data/param-contract.json`, a words item. On main it holds the 15 units the items use,
each word with its symbol. It is the start. Each word is `id`, `symbol`, `dimension` and, on a derived unit, its
conversion: a `base` unit and a `scale` (a value in the unit times `scale` is a value in `base`). A base has no base of
its own. A logarithmic unit (`dB`, `dBFS`, `dBu`, `dBTP`, `LUFS`, `LU`) has no conversion: its offset depends on a
reference. The list holds no code, no LV2 term and no token: those are the format levels' (below).

| Id | Symbol | Dimension | Conversion (base, scale) | Today |
|---|---|---|---|---|
| `none` | `""` | none | none (a base unit) | item |
| `s` | `s` | time | none (a base unit) | item |
| `ms` | `ms` | time | `s`, 0.001 | item |
| `min` | `min` | time | `s`, 60 | item |
| `bar` | `bar` | musical-time | none (a base unit) | joins |
| `beat` | `beat` | musical-time | none (a base unit) | joins |
| `frames` | `frames` | count | none (a base unit) | descriptor-only |
| `m` | `m` | length | none (a base unit) | joins |
| `cm` | `cm` | length | `m`, 0.01 | joins |
| `mm` | `mm` | length | `m`, 0.001 | joins |
| `km` | `km` | length | `m`, 1000 | joins |
| `inch` | `inch` | length | `m`, 0.0254 | joins |
| `mile` | `mile` | length | `m`, 1609.344 | joins |
| `dB` | `dB` | gain | none (logarithmic) | item |
| `percent` | `%` | none | none (a base unit) | item |
| `x` | `x` | none | none (a base unit) | item |
| `Hz` | `Hz` | frequency | none (a base unit) | item |
| `kHz` | `kHz` | frequency | `Hz`, 1000 | joins |
| `MHz` | `MHz` | frequency | `Hz`, 1000000 | joins |
| `bpm` | `bpm` | tempo | none (a base unit) | descriptor-only |
| `oct` | `oct` | pitch | none (a base unit) | item |
| `cents` | `cents` | pitch | none (a base unit) | item |
| `st` | `st` | pitch | none (a base unit) | item |
| `deg` | `deg` | angle | none (a base unit) | descriptor-only |
| `midiNote` | `midiNote` | pitch | none (a base unit) | descriptor-only |
| `dBFS` | `dBFS` | level | none (logarithmic) | item |
| `dBu` | `dBu` | level | none (logarithmic) | joins |
| `ratio` | `ratio` | ratio | none (a base unit) | descriptor-only |
| `LUFS` | `LUFS` | loudness | none (logarithmic) | item |
| `dB-oct` | `dB/oct` | slope | none (a base unit) | item |
| `dB-s` | `dB/s` | rate | none (a base unit) | item |
| `dBTP` | `dBTP` | level | none (logarithmic) | descriptor-only |
| `LU` | `LU` | loudness | none (logarithmic) | descriptor-only |

- Item: in the schema's `$defs.unit` today. Descriptor-only: in `$defs.descriptorUnit` today (a plugin-only unit).
  Joins: in neither list today, and in the one list from now on. `unknown` stays the descriptor format's "states no
  unit" word, not a unit.
- `bar` and `beat` are counts of a musical length (a delay's bar fraction and note denominator). Their length depends
  on the meter, so neither is derived from the other. A transport position (a bar number, a beat in a bar) is a
  position, not a unit.
- `dBu` is decibels relative to 0.7746 V RMS, an analogue level. `dBV` is not added: nothing uses it.
- The schema's `$defs.unit` and `$defs.descriptorUnit` are rendered from the list, as `$defs.unit` is today from
  `PARAM_UNITS` (`render --check` holds the committed schema to it). A unit is added in one place.

### The dimensions

`CONTRACT_UNIT_DIMENSIONS`, a words item of omx-contract's `contract` domain, as `PARAM_SCALES` is: `none`, `time`,
`frequency`, `gain`, `level`, `loudness`, `pitch`, `angle`, `length`, `tempo`, `musical-time`, `count`, `slope`,
`rate`, `ratio`. A derived unit and its base have the same dimension.

### The format levels

Each format level holds its own spellings and a mapping to the standard ids above.

- **The code table, omx-clap-core.** Ruled (coordinator, 2026-11-20; the owner's Q1 answer stands): the unit codes of
  `org.openmixer.param-contract/1` are the wire encoding of a CLAP-level extension, so a CLAP-level particular. 29
  tokens, each a wire code (0 is no unit, 1 to 24 are the LV2 units one to one, 0x100 up a vendor block) mapped to a
  standard unit id; codes are append-only. A descriptor names standard unit ids, never codes: only the extension
  encodes them. It is the released `OMX_PARAM_CONTRACT_UNITS` (3.20.2), rendered to `omx_param_units.h` and
  `omx_contract_limits.h`, read by omx-clap-core, omx-plugins, omx-panel and the console. Until it moves (vocabulary
  moves stay frozen in releases) the 3.20.2 sheet stays where it is, unchanged.
- **LV2, plugin-db.** The LV2 unit terms (`units:db`, `units:khz`, ...), `lv2:designation` and the `param:`
  spellings, each mapped to a standard unit id or parameter meaning. `LV2_UNITS_TERMS` is the unit terms.

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
| `dbfs` `dbu` `ratio` `lufs` | 0x100 0x101 0x102 0x103 | `dBFS` `dBu` `ratio` `LUFS` |

`dB/oct`, `dB/s`, `dBTP` and `LU` have no token and no code (Q15).

## Panels

omx-panel's display rules are behaviour over the units above, not units: it declares no unit id. A rule shows a
value in a larger unit of the same dimension: `Hz` as `kHz` from 1000 Hz up; `ms` as `s` and a 0 to 1 `x` as `%`,
with thresholds that are the panel's to state. The rules read the ids, bases and scales of the list; the panel keeps no
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
(the descriptor's `unit` is a closed list, so a custom unit has no place yet). To be added, as a proposal:
`contract.descriptor.unit-duplicate`, naming the descriptor, the custom unit and the standard unit it repeats. It
joins `CONTRACT_CODES` beside `contract.descriptor.control-duplicate`.

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
- The two-source period and the flag day (Q11, Q12): withdrawn. The list stays where it is, so nothing is staged and
  no consumer switches.
- omx-contract#144 (`PARAM_UNITS` leaves main) is superseded by this ruling: its main change, taking `PARAM_UNITS`
  and its schema enum render off main, is ruled out. Whether it is closed is a coordinator or owner decision, citing
  the one-place ruling. What survives it is carried below. The follow-up of the kernels that state `min`, `LUFS` and
  `dB/s` is withdrawn with the split.

## Carried from #144

Carried from #144: the tests of the released code sheet, which it restores in `test/param-units.test.mjs` and which
this design keeps, over the code table (the tests follow the table to its holder). Each has the
sabotage arm it has there:

- the codes are the ones omx-plugins shipped (0.15.0), append-only: `none` 0 to `midiNote` 24, `dbfs` 0x100, `dbu`
  0x101, `ratio` 0x102, `lufs` 0x103; a token added after is above 0x103;
- the rendered `omx_param_units.h` has one `OMX_CLAP_UNIT_` define per token and none other, and the same tokens as
  the `OMX_PARAM_UNITS(X)` table, in order;
- the limits header spells `OMX_PARAM_CONTRACT_UNITS_DB` once, never `OMX_OMX_`;
- a C reader compiles `_Static_assert`s on the codes and expands `OMX_PARAM_UNITS(X)` to find a token's word;
- sabotage: a code changed in the data (`db` set to 99) is not the shipped code, and the committed header goes stale.

Carried from #144: the list of readers of `OMX_PARAM_CONTRACT_UNITS`, which keep reading it unchanged:
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
- Q14: `dBu` is a standard unit, code 257, the 0.7746 V reference, in omx-contract's list.

## Open questions for the owner

15. **Codes for `dB/oct`, `dB/s`, `dBTP` and `LU`.** They have no code, so a plugin that states one reports 0
    (`none`), as today. Do they take the next codes (260 up, append-only), or stay without?

