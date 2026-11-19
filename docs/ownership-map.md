# Ownership map of the vocabularies

Who owns each vocabulary of the Open-Mixer repositories, in what form, which consumers switch to it, and which release
carries the switch. It settles the 29 conflicts an inventory of every domain document, every `data/` item and every
hand copy found on 2026-11-19. `ownership/owned.txt` and `ownership/moving-out.txt` keep omx-contract's own list. This
page is the map across repositories.

## The five placement rules

1. **The host owns, as a domain.** A word belongs to whoever USES the plugin with it: the host (owner principle,
   2026-11-19). The hosting words are omx-clap-core's (the CLAP host), and the machine, probe and qualification words
   are plugin-hostd's (it places plugins in pools by them). A tool that only SETS a word's value (plugin-qualify) or
   only STORES it (plugin-db-qualification) owns none, and reads the installed domain like any consumer.
2. **Inside-out.** An inner repository never reads an outer one. A word an inner repository needs moves DOWN to the
   lowest layer that needs it.
3. **One source.** A vocabulary is declared once. Every duplicate is removed in favour of the owner's.
4. **No hand copies.** A consumer reads the owner's installed domain, or a header or module generated from it, never a
   spelled copy.
5. **omx-contract holds the contract format and genuinely cross-cutting words**, nothing
   product-specific.

The layers, inner to outer (owner ruling, 2026-11-19: plugin-qualify uses the CLAP host and requires plugin-hostd, so
it sits above both):

1. omx-contract
2. omx-dsp
3. plugin-db
4. plugin-db-qualification (data and its reader)
5. plugin-hostd-protocol
6. omx-panel
7. omx-clap-core
8. plugin-hostd
9. plugin-qualify
10. omx-plugins
11. the console

**How rule 2 is read** (owner ruling, 2026-11-19). A contract package (`<repo>-contract`) is leaf data: it depends on
nothing, and every layer may install it. Reading an installed domain, or a header or module generated from it at build
time, is not "inner reads outer": plugin-db-qualification, at the bottom, checks the words of the `qualification`,
`probe`, `machine` and `hosting` domains against the installed documents, and their owners keep them. Rule 2
governs code and build dependencies on another repository's sources, and hand copies; only those move.

## The map

| # | Conflict | Owner, form | Removed / switched | Line |
|---|---|---|---|---|
| 1 | `PANEL_*` declared in omx-contract `data/panel.json` and omx-panel's `panel` domain | omx-panel, `panel` domain | omx-contract drops `data/panel.json` and its `words.json` and `moving-out.txt` entries; the console imports omx-panel's generated module | after the pass (consumers still read them; owner ruling 2026-11-19) |
| 2 | `PLUGIN_HOSTD_CLAP_MAP` and `_LV2_MAP` in plugin-qualify and plugin-hostd, drifted | plugin-hostd (it maps the formats it hosts), a `formats-map` domain | plugin-qualify's `data/formats/*` copy removed; plugin-qualify reads the installed domain | after the pass |
| 3 | plugin-hostd clients in plugin-hostd-protocol and plugin-hostd | plugin-hostd-protocol (the wire's clients) | plugin-hostd's `clients/` removed | after the pass |
| 4 | `PANEL_DESCRIBE_CODES` as a domain and as `schema/codes.json` in omx-panel | omx-panel, `panel` domain, its texts in `x-text` | the codes sheet is rendered from the domain (3.21.0 render); `tools/describe.mjs` reads the domain | after 1b, omx-panel |
| 5 | `MACHINE_ARCHES` vs `QUALIFICATION_PACKAGE_ARCHES`; `QUALIFICATION_HOST_CLASSES` vs `_MACHINE_CLASSES` | different facts, kept apart, all plugin-hostd's: uname arches (`machine`), package arches and record-set classes (`qualification`) | `QUALIFICATION_MACHINE_CLASSES` removed if no record or code holds its words (none does today) | 7 |
| 6 | omx-clap-core `src/omx_clap_ext.h` spells the panel families, widgets, display kinds, sources and placements | omx-panel, `panel` domain | ext.h includes omx-panel's rendered header (panel 6 < clap-core 7: downward) | after the pass |
| 7 | the console spells panel display kinds, sources, placements and families | omx-panel | the console imports omx-panel's generated module | after the pass |
| 8 | plugin-hostd-protocol clients copy `PLUGIN_HOSTD_GROUPING_REASONS` | plugin-hostd (it groups the plugins), a `grouping` domain | the clients' block is generated from the installed domain, not copied | after the pass |
| 9 | plugin-hostd-protocol `protocol.h` spells `PROBE_OUTCOMES`, `_REASONS`, `_STEPS` | plugin-hostd, `probe` domain | protocol.h's copy generated from the installed `probe` domain | 4 (protocol) if the domain is published, else after |
| 10 | qualification words hand-copied: plugin-hostd bench report, plugin-qualify benchmark tool, the console's catalog types, a plugin-db-qualification provenance template | plugin-hostd, `qualification` domain (moved from plugin-qualify, 1.4.0) | the domain moves to plugin-hostd; plugin-qualify deletes its copy and reads the installed domain; each hand copy reads it or its generated module | 7 (the move; plugin-qualify switches in 3, after 7); hand copies after |
| 11 | plugin-qualify and plugin-hostd `describe.c` spell `SCAN_FIELD_SCOPES` | omx-clap-core, `scan` domain | both include the rendered scan header | after the pass |
| 12 | omx-panel's own tools spell its families, widgets, placements and display words | omx-panel | its tools read its own domain | after the pass |
| 13 | plugin-qualify generates hosting codes from omx-clap-core; plugin-hostd-protocol reads `HOST_REPLY_CODES` | omx-clap-core, `hosting` domain (this pass, omx-clap-core#136) and a `host` domain for the reply codes | consumers read the installed domains | 6 (hosting); host replies after |
| 14 | plugin-qualify reads `PLUGIN_HOSTD_HISTORY_KEYS` | plugin-hostd, a `history` domain | plugin-qualify reads the installed domain | after the pass |
| 15 | plugin-hostd-protocol reads plugin-hostd's probe and grouping words | plugin-hostd, as rows 8 and 9 | generated from the installed domains (data, rule 2 as read above) | as rows 8 and 9 |
| 16 | plugin-db-qualification holds `machine` fixtures and reads `MACHINE_*` | plugin-hostd, `machine` domain | the fixtures stay test data; the store reads the installed domain | none |
| 17 | omx-contract names outer repositories' words (`VERB_HOSTS`, `PLUGIN_FEATURE_*`, `PANEL_*`, `RESOURCE_HINTS`) | each to its producer (rows 1, 19) | omx-contract drops them (rule 5) | after the pass |
| 18 | plugin-hostd holds `machine` and `probe`, read by layers 4 to 6 | plugin-hostd (the prober writes them) | none | none |
| 19 | the 24 items of `moving-out.txt` with no new owner | `PLUGIN_FEATURE_*` to omx-clap-core (the plugin's declared features); `RESOURCE_*` to plugin-hostd (it places plugins within the budgets); rates and `CURVE_*` to omx-dsp (the kernels' axes and rates); `VERB_HOSTS` to plugin-hostd-protocol; `READOUT_RATE_HZ` to omx-panel; `OMX_PARAM_CONTRACT_UNITS` leaves (row 30) | omx-contract drops each as its owner publishes it | after the pass |
| 20 | `QUALIFICATION_MACHINE_CLASSES` and `_HOST_CLASSES` | plugin-hostd, `qualification` domain (row 10) | as row 5 | 7 |
| 21 | omx-panel gesture kinds and `PANEL_STANDARD_WIDGETS` share eight words in two forms | omx-panel, a `gestures` domain (`x-group`, 3.21.0) | the widget item references the gesture words; `schema/gestures.json` rendered from the domain | after 1b, omx-panel |
| 22 | the console's `words.json` built from hand TS; the console spells other owners' words | the console for its three items; the rest to rows 6, 7, 10 | the console generates its three from a domain of its own | after the pass |
| 23 | `HOSTING_*` in omx-clap-core `data/` | omx-clap-core, `hosting` domain | omx-clap-core#136, byte-identical on 3.21.0 | 6 |
| 24 | host and protocol verbs and reply codes in omx-clap-core and plugin-hostd-protocol `data/verbs.json` | omx-clap-core `host` domain (host side), plugin-hostd-protocol `protocol` domain (wire side) | data items become the two domains | after the pass |
| 25 | `PLUGIN_DB_*` items in `data/` beside the `plugin-db` domain | plugin-db, `plugin-db` domain | the 20 items join the domain | after the pass |
| 26 | `PLUGIN_HOSTD_GROUPING_*`, `_HISTORY_KEYS` in plugin-hostd `data/` | plugin-hostd, its `grouping` (row 8) and `history` (row 14) domains | the data items become the two domains | after the pass |
| 27 | `qualify.*` (plugin-qualify's own command refusals, not plugin words) and `panel.*` code sheets beside their domains | each domain, texts in `x-text` | the sheets are rendered from the domains (3.21.0) | after the pass |
| 28 | omx-contract's own classic data (`CONTRACT_CODES`, `CURVE_*`, `PARAM_SCALES`, rates, `RESOURCE_*`, `VERB_HOSTS`, `PLUGIN_FEATURE_*`) | `CONTRACT_CODES` and `PARAM_SCALES` stay as omx-contract domains (format and cross-cutting); the rest move per row 19 | migrated to domains | after the pass |
| 29 | omx-dsp kernels and primitives as `data/` items | omx-dsp, a `dsp` domain | the data items become the domain | after the pass |
| 30 | units: `PARAM_UNITS` / `OMX_PARAM_CONTRACT_UNITS` in omx-contract, read by the kernels, the panel and plugin descriptors | no single owner (owner ruling, 2026-11-19): the DSP units (the kernels' parameter units) to omx-dsp's `dsp` domain; the panel and display units to omx-panel's `panel` domain; a plugin owns its own units, in its descriptor | `PARAM_UNITS` is not widened in 3.21.0; the units move to their owners and omx-contract drops it once every consumer reads the owner's unit item | after the pass |

## What rides this pass

Only what a line already carries:

- 1b: the domain render that rows 4, 21, 23 and 27 need.
- 6: the `hosting` domain (omx-clap-core#136).
- 7: the `qualification` domain moves from plugin-qualify to plugin-hostd (0.20.8); plugin-qualify (3, after 7) and
  plugin-db-qualification read it installed.
- 4: `protocol.h`'s probe words, only if the `probe` domain is published by then.

Everything else waits for the next pass.
