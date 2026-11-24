<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com> -->
# The unit gate: a recipe for every owner

`omx-contract units --check <path>...` refuses every unit in an owner's own JSON that is not a standard id of
`PARAM_UNITS` (the `param` domain, [units.md](units.md)). Each owner runs it over its own data in its own CI, so a unit
with no standard id fails that owner's build and not a wave line. It was written for omx-contract#193, the gate for
decision 2 of plugin-hostd#215 (owner ruling 2026-11-23): lookup values are `PARAM_UNITS` ids, each word's const (the
`x-symbol`, `%` for `percent`, is display only, C2), and each carries the dimension word `PARAM_UNITS` gives it. A unit
with no standard id becomes a dropped row, never a new spelling.

Why it exists: chain 3 stopped at line 53 because omx-dsp's `ROTARY_ACCEL_RANGE` still used the unit `"x"`, which
omx-contract 3.22.0's schema refuses. The same `"x"` was also in omx-plugins, plugin-db, plugin-hostd and the console,
and each was found separately, one wave line at a time. Run at each owner, the gate finds them all before the wave.

## What it holds

- **Unit keys.** Any property whose schema in `schema/omx-contract.schema.json` is `$defs.unit` or
  `$defs.descriptorUnit`, directly or inside an `allOf` or `anyOf`. Today that is `unit`, and `x-unit` in the domain
  spelling. The value must be an id, or `unknown` (a descriptor's "states no unit").
- **Maps of units.** Any property whose `additionalProperties` is a unit, today a descriptor's `choiceUnits`. Each
  value must be an id, and `unknown` is refused.
- **Unit lookups.** A map row's `word` (or `x-word`) whose `word` path, followed through `$defs.descriptor`, ends at a
  unit key, today `controls[].travel.unit`. Each value of its `values` must be an id, and `unknown` is refused.
  `validate` applies the same check to a format map as rule `map-unit`.

The checker contains no list of keys, words or ids. The keys and words come from walking the schema. The ids come
from `$defs.descriptorUnit`, which `tools/unit-enum.mjs` renders from the consts of `PARAM_UNITS`.

Exit codes:

- 0: every unit passes. The last line gives the counts (`N files, M units, 0 refused`).
- 1: at least one unit is refused. Each refusal is printed as `file:line: <JSON pointer>: "<value>" is no PARAM_UNITS
  standard id`.
- 2: no path was given, a path is missing, a file is not valid JSON, or the files contain no unit at all. A run that
  checked nothing never counts as a pass.

## The worked example: omx-dsp

omx-dsp's `make units-check OMX_CONTRACT=<checkout>` runs the gate over `data` and `recipes/answers`. It then puts the
old `"x"` back into a scratch copy of `data/kernels/rotary.json` and requires that copy to be refused by `file:line`,
which proves the gate can still see the defect. The `contract` job in `.github/workflows/ci.yml` runs this target after
`make contract-tests`, using the omx-contract it fetched at `OMX_CONTRACT_REF`.

Measured results:

| omx-dsp data | Result |
|---|---|
| Chain-3 head (804cbc9 data) | rc 0: 100 files, 807 units, 0 refused |
| 1ed8a2d's `rotary.json` and recipe | rc 1: two refusals, `data/kernels/rotary.json:106` and `recipes/answers/rotary.json:84`, both `"x"` |

A pin below the omx-contract release that carries `units` makes the step exit 2 (`unknown command units`). Move the
pin to that release in the same change that adds the step.

## Where each other owner wires it

Each entry gives the place the step goes, at that owner's chain-3 head, and what the gate reports there today, run
with omx-contract lane/chain4-omx-contract-193. Each owner adds the step in its own lane, with its own red-first
proof, as omx-dsp did above. These counts were taken while the gate still held the symbols. Since the ids (C2), a
symbol spelling such as `"%"`, `""` or `"dB/oct"` is refused as well; each owner's chain-4 `-c2` lane moves its
units to the ids.

| Owner (head) | Where | Paths to check | Today |
|---|---|---|---|
| omx-plugins (bcb2d4c8) | `.github/workflows/ci.yml:287`, beside the descriptor step | `plugins/*/*.descriptor.json` | **1 refused**: `plugins/omx-rotary/omx-rotary.descriptor.json:126` `/controls/4/travel/unit` `"x"`, 591 units in 34 files. The `.decl.json` `portHints.*.unit` values are LV2 term spellings (`units:db`), a format-level particular that plugin-db maps, so the gate does not run over them. |
| plugin-hostd (8d044c4) | `Makefile:290`, the `check-contract-dir` target (`.github/workflows/ci.yml:169`) | `contract.d` | **2 refused**: `contract.d/plugin-hostd/clap/clap.json:1795` and `contract.d/plugin-hostd/lv2/lv2.json:2073`, the lookups `coef` and `units:coef` to `"x"` (V23d, omx-contract#170) |
| plugin-db (365b21d) | `.github/workflows/ci.yml:59`, beside the omx-contract install | `contract.d` | 0 refused, 1 unit in 10 files. Its `LV2_UNIT_IDS` consts are a set's ids, not unit keys, so its own F1 test (`tests/lv2_domain_test.py`) still holds them. |
| omx-panel (5ea3d16) | `.github/workflows/ci.yml:44`, after the omx-contract install, or the `check` target at `Makefile:36` | `contract.d examples` | 0 refused, 93 units in 18 files |
| omx-clap-core (96bd5da5) | `.github/workflows/ci.yml:150`, after the omx-contract install | none yet | No unit in `data/` (exit 2 by design). Its unit code table maps codes to ids, and its own test holds that table. |
| the console | its catalog check, in its own repository | its plugin catalog data | **17742 refused** in 80 files: 537 `"x"` (the rows found at chain 3), plus spellings that are not standard ids (`bars`, `beats`, `semi`, `BPM`, `ct`, `note`) and 16016 `"G"`, which need a ruling on whether that key is a unit at all |

## When omx-contract changes the list

A unit removed from `PARAM_UNITS`, or renamed, reaches each owner's gate in the omx-contract release that carries the
change. Before that release, run the gate from the candidate omx-contract over each owner's head (the commands in the
table above). Do this in the same chain, as omx-contract's live-owner proof already does for omx-dsp
(`tools/live-owner-data.sh`).
