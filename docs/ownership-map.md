# Ownership map of the vocabularies

**Status: APPROVED** (owner, 2026-11-19), as the plan of the sorting pass that follows this release pass. This release
pass ships every domain where it is (`x-since` fixes only); nothing below is implemented yet.

**A conflict found later.** An inner repository found to need an outer one's word is an error, fixed case by case:
the word moves down, or the reader does. There is no blanket redesign (owner ruling, 2026-11-19).

Who owns each vocabulary of the Open-Mixer repositories, in what form, which consumers switch to it, and which release
carries the switch. It settles the 30 conflicts an inventory of every domain document, every
`data/` item and every hand copy found on 2026-11-19, and sorts every vocabulary of that inventory in a pass
after this release pass. `ownership/owned.txt` and `ownership/moving-out.txt` keep omx-contract's own list. This
page is the map across repositories.

## The five placement rules

1. **The level owns, as a domain.** Plugin-level words DEFINE a plugin: its format, address, ports, parameters,
   custom units and the CLAP and LV2 spellings. Host-level words are how it is LOADED: they belong to whoever USES the
   plugin, the host (owner principle, 2026-11-19). The hosting words are omx-clap-core's (the CLAP host), and the
   machine, probe and qualification words are plugin-hostd's (it places plugins in pools by them). A tool that only SETS
   a word's value (plugin-qualify) or only STORES it (plugin-db-qualification) owns none, and reads the installed domain
   like any consumer.
2. **Inside-out.** An inner repository never reads an outer one. A word an inner repository needs moves DOWN to the
   lowest layer that needs it.
3. **One source.** A vocabulary is declared once. Every duplicate is removed in favour of the owner's.
4. **No hand copies.** A consumer reads the owner's installed domain, or a header or module generated from it, never a
   spelled copy.
5. **omx-contract holds the contract format and the reader machinery only**: the schema, its own refusal codes, and
   libomx-domain with `openDomainAt`, the ONE reader every consumer reads downward through; and, by the amendment
   2026-11-20, the standard words (units, meanings, dimensions). Nothing product-specific.

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
| 1 | `PANEL_*` declared in omx-contract `data/panel.json` and omx-panel's `panel` domain | omx-panel, `panel` domain | omx-contract drops `data/panel.json` and its `words.json` and `moving-out.txt` entries; the console imports omx-panel's generated module | S6, S11; drop SZ |
| 2 | `PLUGIN_HOSTD_CLAP_MAP` and `_LV2_MAP` in plugin-qualify and plugin-hostd, drifted | plugin-hostd (it maps the formats it hosts), a `formats-map` domain | plugin-qualify's `data/formats/*` copy removed; plugin-qualify reads the installed domain | sorting pass |
| 3 | plugin-hostd clients in plugin-hostd-protocol and plugin-hostd | plugin-hostd-protocol (the wire's clients) | plugin-hostd's `clients/` removed | sorting pass |
| 4 | `PANEL_DESCRIBE_CODES` as a domain and as `schema/codes.json` in omx-panel | omx-panel, `panel` domain, its texts in `x-text` | the codes sheet is rendered from the domain (the domain render on omx-contract main); `tools/describe.mjs` reads the domain | SA, S6 |
| 5 | `MACHINE_ARCHES` vs `QUALIFICATION_PACKAGE_ARCHES`; `QUALIFICATION_HOST_CLASSES` vs `_MACHINE_CLASSES` | different facts, kept apart, all plugin-hostd's: uname arches (`machine`), package arches and record-set classes (`qualification`) | `QUALIFICATION_MACHINE_CLASSES` removed if no record or code holds its words (none does today) | S8 |
| 6 | omx-clap-core `src/omx_clap_ext.h` spells the panel families, widgets, display kinds, sources and placements | omx-panel, `panel` domain | ext.h includes omx-panel's rendered header (panel 6 < clap-core 7: downward) | sorting pass |
| 7 | the console spells panel display kinds, sources, placements and families | omx-panel | the console imports omx-panel's generated module | sorting pass |
| 8 | plugin-hostd-protocol clients copy `PLUGIN_HOSTD_GROUPING_REASONS` | plugin-hostd (it groups the plugins), a `grouping` domain | the clients' block is generated from the installed domain, not copied | sorting pass |
| 9 | plugin-hostd-protocol `protocol.h` spells `PROBE_OUTCOMES`, `_REASONS`, `_STEPS` | plugin-hostd, `probe` domain | protocol.h's copy generated from the installed `probe` domain | S5 |
| 10 | qualification words hand-copied: plugin-hostd bench report, plugin-qualify benchmark tool, the console's catalog types, a plugin-db-qualification provenance template | plugin-hostd, `qualification` domain (moved from plugin-qualify, 1.4.0) | the domain moves to plugin-hostd; plugin-qualify deletes its copy and reads the installed domain; each hand copy reads it or its generated module | SA, S8, S9 (V5) |
| 11 | plugin-qualify and plugin-hostd `describe.c` spell `SCAN_FIELD_SCOPES` | omx-clap-core, `scan` domain | both include the rendered scan header | sorting pass |
| 12 | omx-panel's own tools spell its families, widgets, placements and display words | omx-panel | its tools read its own domain | sorting pass |
| 13 | plugin-qualify generates hosting codes from omx-clap-core; plugin-hostd-protocol reads `HOST_REPLY_CODES` | omx-clap-core, `hosting` domain (this pass, omx-clap-core#136) and a `host` domain for the reply codes | consumers read the installed domains | SA, S7 (hosting); S5 (host replies) |
| 14 | plugin-qualify reads `PLUGIN_HOSTD_HISTORY_KEYS` | plugin-hostd, a `history` domain | plugin-qualify reads the installed domain | sorting pass |
| 15 | plugin-hostd-protocol reads plugin-hostd's probe and grouping words | plugin-hostd, as rows 8 and 9 | generated from the installed domains (data, rule 2 as read above) | as rows 8 and 9 |
| 16 | plugin-db-qualification holds `machine` fixtures and reads `MACHINE_*` | plugin-hostd, `machine` domain | the fixtures stay test data; the store reads the installed domain | none |
| 17 | omx-contract names outer repositories' words (the verb hosts, `PLUGIN_FEATURE_*`, `PANEL_*`, `RESOURCE_HINTS`) | each to its producer (rows 1, 19); superseded in part by the amendment 2026-11-20 (standard words stay) | omx-contract drops them (rule 5) | sorting pass |
| 18 | plugin-hostd holds `machine` and `probe`, read by layers 4 to 6 | plugin-hostd (the prober writes them) | none | none |
| 19 | the 24 items of `moving-out.txt` with no new owner | `PLUGIN_FEATURE_*` to plugin-db (plugin level); `RESOURCE_*` to plugin-hostd (it places plugins within the budgets); rates and `CURVE_*` to omx-dsp (the kernels' axes and rates); the verb hosts to omx-clap's hosting data (V29); `READOUT_RATE_HZ` to omx-dsp (V22, its classic `data/primitives/readout.json`); `OMX_PARAM_CONTRACT_UNITS` with the units lane (row 30); superseded in part by the amendment 2026-11-20 (see its table) | omx-contract drops each as its owner publishes it | sorting pass |
| 20 | `QUALIFICATION_MACHINE_CLASSES` and `_HOST_CLASSES` | plugin-hostd, `qualification` domain (row 10) | as row 5 | S8 |
| 21 | omx-panel gesture kinds and `PANEL_STANDARD_WIDGETS` share eight words in two forms | omx-panel, a `gestures` domain (`x-group`, on omx-contract main) | the widget item references the gesture words; `schema/gestures.json` rendered from the domain | SA, S6 |
| 22 | the console's `words.json` built from hand TS; the console spells other owners' words | the console for its three items; the rest to rows 6, 7, 10 | the console generates its three from a domain of its own | sorting pass |
| 23 | `HOSTING_*` in omx-clap-core `data/` | omx-clap-core, `hosting` domain | `data/` becomes the domain, byte-identical (omx-clap-core#136, frozen) | SA, S7 |
| 24 | host and protocol verbs and reply codes in omx-clap-core and plugin-hostd-protocol `data/verbs.json` | omx-clap-core `host` domain (host side), plugin-hostd-protocol `protocol` domain (wire side) | data items become the two domains | sorting pass |
| 25 | `PLUGIN_DB_*` items in `data/` beside the `plugin-db` domain | plugin-db, `plugin-db` domain | the 20 items join the domain | sorting pass |
| 26 | `PLUGIN_HOSTD_GROUPING_*`, `_HISTORY_KEYS` in plugin-hostd `data/` | plugin-hostd, its `grouping` (row 8) and `history` (row 14) domains | the data items become the two domains | sorting pass |
| 27 | `qualify.*` (plugin-qualify's own command refusals, not plugin words) and `panel.*` code sheets beside their domains | each domain, texts in `x-text` | the sheets are rendered from the domains (the render on omx-contract main) | sorting pass |
| 28 | omx-contract's own classic data (`CONTRACT_CODES`, `CURVE_*`, `PARAM_SCALES`, rates, `RESOURCE_*`, the verb hosts, `PLUGIN_FEATURE_*`) | `CONTRACT_CODES` and `PARAM_SCALES` stay as omx-contract domains (format and cross-cutting); the rest move per row 19; superseded in part by the amendment 2026-11-20 (see its table) | migrated to domains | sorting pass |
| 29 | omx-dsp kernels and primitives as `data/` items | omx-dsp, a `dsp` domain | the data items become the domain | sorting pass |
| 30 | units: `PARAM_UNITS` (added on main by omx-contract#141, never released) and the released `OMX_PARAM_CONTRACT_UNITS` (`omx_param_units.h`, `omx_contract_limits.h`; read by omx-clap-core `param_contract.h`, `clap_host.h`, `omx_clap_ext.h`, `lv2_clap.c` and omx-plugins `omx_param_contract.h`, `param-contract.mjs`, per omx-contract#144) | superseded (amendment 2026-11-20): the standard units are ONE list in omx-contract (`PARAM_UNITS`, grown, with dimensions); the param-contract code sheet is a CLAP particular at omx-clap-core, mapped to it; a plugin's custom units stay in its declaration; no merged units view | superseded: omx-contract#144 is not merged; `PARAM_UNITS` stays; `OMX_PARAM_CONTRACT_UNITS` moves to omx-clap-core in three PRs (amendment, row V23d) | the amendment 2026-11-20 |

## This release pass

Nothing of this map. Every domain ships where it is, with `x-since` fixes only. Frozen until the owner approves:
the `qualification` move, omx-clap-core#136 (hosting), the units and the panel words. omx-contract 3.21.0 is not cut
in this pass.

## The sorting pass

After this release pass, every vocabulary of the inventory goes to its owner, by the five rules (approved by the
owner, 2026-11-19).

**Its lines.** A contract package is leaf data (rule 2 as read above), so owners publish before readers switch, and
the old holders drop last:

- **S0, omx-contract:** libomx-domain and `openDomainAt` read every installed domain (no merged views: the amendment
  2026-11-20 keeps the standard units as one list). Every switch below goes through it, or through a header or module
  generated from it.
- **SA, every owner:** publishes its domains in its `<repo>-contract` package. These are data only, so in any order.
- **S1 to S11, inside-out by layer:** each repository, in its own release, switches its reads to the installed
  domains, renders its sheets from its own domains, and removes its hand copies and duplicates.
- **SZ, the old holders:** each drops a moved item once every reader of it has switched (omx-contract's moved-out
  items, `data/panel.json` and `OMX_PARAM_CONTRACT_UNITS`; plugin-db's pin verdicts and pools; plugin-qualify's format
  maps).

A setter (plugin-qualify) or a storer (plugin-db-qualification, plugin-db) owns no plugin or host word. It reads
the installed domain like any consumer.

**The vocabularies.** These are the inventory's rows, about 160 domain and data items. Per item: where it is today,
the owner and the rule, and what changes: files, packages (which gains or loses), consumers, the lines of
the pass and the releases that carry them, and the risk (what breaks if it goes wrong, and how it is caught). The
release numbers are the next minor of each repository after this pass.

| # | Vocabulary | Today | Level, rule | Owner, form | Consumers | Files that change | Packages (gains, loses) | Lines | Releases | Risk (what breaks, how it is caught) |
|---|---|---|---|---|---|---|---|---|---|---|
| V1 | `PANEL_FAMILIES`, `_STANDARD_WIDGETS`, `_WIDGETS`, `_DISPLAY_KINDS`, `_DISPLAY_SOURCES`, `_PLACEMENTS` | omx-panel `panel` domain AND omx-contract `data/panel.json` | display, rule 3 | omx-panel, `panel` domain | omx-panel tools; omx-clap-core `omx_clap_ext.h`; the console | omx-contract's `data/panel.json` copy dropped; ext.h includes the rendered header; the console imports the generated module | omx-panel-contract: none (already holds `panel`); omx-contract-contract loses `data/panel.json` | S6, S7, S11; drop SZ | omx-panel 0.16.0 (its tools), omx-clap-core 0.34.0 (ext.h), the console's next release; the drop in omx-contract 3.21.0's successor | a consumer still reading omx-contract's copy breaks at the drop: the drop waits until a grep of the consumers finds none, and the console's build fails red without it |
| V2 | `PANEL_STORE_CODES`, `_DESCRIBE_CODES`, `_GROUP_OUTCOMES`, `_GROUP_REASONS`, `_GROUP_RULES` | omx-panel `panel` domain | display, rule 1 | omx-panel, `panel` domain | omx-panel `store.c`, `describe.mjs`, `group-infer.mjs` | its tools read its own domain | omx-panel-contract: none | S6 | omx-panel 0.16.0 | a tool reading a misspelled word refuses at run time: omx-panel's tests read the domain, not literals |
| V3 | `panel.*` refusal codes sheet | omx-panel `schema/codes.json` | display, rule 1 | omx-panel, `panel` domain texts (`x-text`) | omx-panel tools, catalogs | the sheet is rendered from the domain | omx-panel-contract: `schema/codes.json` becomes rendered, same file | S6 | omx-panel 0.16.0 | a changed sentence reaches the catalogs: render --check compares the rendered header and module byte for byte in the owner's CI |
| V4 | gesture kinds (`schema/gestures.json`) | omx-panel `schema/gestures.json` | display, rule 1 | omx-panel, `gestures` domain | omx-panel `renderer/src/gesture.c` | the schema is rendered from the domain; the widget item references it (row 21) | omx-panel-contract gains `gestures`; `schema/gestures.json` becomes rendered | SA, S6 | omx-panel 0.16.0 | `gesture.c` loses a kind: render --check compares the rendered header and module byte for byte in the owner's CI, and the renderer's gesture tests |
| V5 | `QUALIFICATION_*` (40 items, plus the 5 of 1.4.0) | plugin-qualify `qualification` domain 1.3.0 | host, rule 1 | plugin-hostd, `qualification` domain | plugin-qualify; plugin-hostd bench report; plugin-qualify `benchmark.py`; the console's catalog types; plugin-db-qualification | the domain moves from plugin-qualify; the hand copies read the domain | plugin-hostd-contract gains `qualification`; plugin-qualify-contract loses it | SA, S8; S8, S9, S11 | plugin-hostd 0.21.0, then plugin-qualify 0.21.0; the console's next release and plugin-db-qualification next minor switch reads | two packages owning one file: the old one is pruned from the channel and the boxes remove it before upgrading (owner ruling 2026-11-19); the install-and-sync check catches a leftover |
| V6 | `qualify.*` codes sheet | plugin-qualify `schema/codes.json` | the setter's own command refusals, rule 1 | plugin-qualify, a `qualify` domain with `x-text` | plugin-qualify `descriptors.py`, `text-catalog.ts` | the sheet is rendered from the domain | plugin-qualify-contract gains a `qualify` domain; `schema/codes.json` becomes rendered | SA, S9 | plugin-qualify 0.21.0 | a changed refusal sentence: render --check compares the rendered header and module byte for byte in the owner's CI |
| V7 | `MACHINE_*` (6) | plugin-hostd `machine` domain | host, rule 1 | plugin-hostd, `machine` domain | plugin-hostd `machine.c`; plugin-db-qualification | `domain_words.h` is generated from the domain; the store's fixtures stay test data | plugin-hostd-contract: none | S4, S8 | plugin-hostd 0.21.0; plugin-db-qualification next minor reads | a wrong arch or band stored silently: `domain_words.h` is generated and the store's word check refuses an unknown word at open |
| V8 | `PROBE_*` (4) | plugin-hostd `probe` domain | host, rule 1 | plugin-hostd-protocol for the wire words (`PROBE_OUTCOMES`, `_REASONS`, `_STEPS`, which `protocol.h` carries), plugin-hostd reads them (no build cycle, no hand table); the rest of `probe` stays plugin-hostd's. Ruled (coordinator, 2026-11-20) | plugin-hostd-protocol `protocol.h`; plugin-hostd probe; plugin-qualify probe-judge | protocol.h's enums are rendered from plugin-hostd-protocol's own domain; plugin-hostd and plugin-qualify read it; plugin-hostd's copy of the wire words is removed last | plugin-hostd-protocol-contract gains the wire words; plugin-hostd-contract loses them last; plugin-hostd, plugin-qualify and plugin-db-qualification floor on plugin-hostd-protocol-contract | S5, S8, S9 | plugin-hostd-protocol next minor, plugin-hostd 0.21.0, plugin-qualify 0.21.0 | a renumbered enum breaks the wire: the generated `protocol.h` keeps the values, checked by protocol's ABI test |
| V9 | `SCAN_DOCUMENTS`, `SCAN_FIELD_SCOPES` | omx-clap-core `scan` domain | host, rule 1 | omx-clap-core, `scan` domain | plugin-hostd `describe.c`; plugin-qualify `native/describe.c` (13/14, by hand) | both include the rendered scan header | omx-clap-contract: none | S8, S9 | plugin-hostd 0.21.0, plugin-qualify 0.21.0 | plugin-qualify's copy lacks one scope today: the rendered header adds it; the describe tests of both read the header |
| V10 | `PLUGIN_DB_ADDRESS_FORMATS` | plugin-db `plugin-db` domain | plugin, rule 1 | plugin-db, `plugin-db` domain | plugin-db `address.c`, `cli.c`, `collect.c` | none | plugin-db-contract: none | none | none: already where proposed | none |
| V11 | `PLUGIN_DB_STATES`, `_REASONS`, `_SOURCES`, `_ISOLATION_HOSTS`, `_RUNS`, `_LATENCY`, `_RECORD*`, `_LAYERS`, `_FILES`, `_LAYOUT`, `_BUNDLE_RULES`, `_BAR` (14) | plugin-db `data/db.json` | plugin, and the store's own layout, rule 1 | plugin-db, `plugin-db` domain | plugin-db headers, `vocabulary.py`, `store.schema.json` | the data items join the domain; `vocabulary.py` and the schema are generated | plugin-db-contract: `data/db.json` items join the `plugin-db` domain | SA, S3, after V12 (Ruled (coordinator, 2026-11-20)) | plugin-db next minor | C and Python read the same names: both are generated, and the store schema test fails on a missing word |
| V12 | `PLUGIN_DB_PIN_VERDICTS`, `_POOLS` | plugin-db `data/pin.json` | host (how a plugin is loaded), rule 1 | plugin-hostd, `qualification` domain (`QUALIFICATION_PIN_VERDICTS`, pools) | plugin-db `pin.h`, fuzz | plugin-db reads the installed domain; its copy is dropped | plugin-db-contract loses `PIN_VERDICTS` and `POOLS`; plugin-hostd-contract holds them | S3, before V11 and V13 (Ruled (coordinator, 2026-11-20)); drop SZ | plugin-hostd 0.21.0 (holds them), then plugin-db next minor | pins written today keep their spelling: plugin-db's pin fuzz reads stored pins against the domain |
| V13 | `PLUGIN_DB_PIN_KEYS`, `_CHANGES`, `_LAYOUT_FORMATS`, `_PIN_SHA256_HEX_LEN` | plugin-db `data/pin.json`, `constants.json` | the storer's own file format, rule 1 | plugin-db, `plugin-db` domain | plugin-db `pin.h`, fuzz | the data items join the domain | plugin-db-contract: `data/pin.json`, `constants.json` items join the domain | SA, S3 | plugin-db next minor | the pin file layout changes if a key is misspelled: the pin round-trip test |
| V14 | `HOSTING_*_CODES` (16 dimensions), `HOSTING_IDLE_CODES`, `_WINDOW_CODES`, `HOSTED_STAGE_LIMITS` | omx-clap-core `data/hosting*.json` | host, rule 1 | omx-clap-core, `hosting` domain | plugin-qualify (generated); plugin-hostd-protocol (generated header); the console | `data/` becomes the domain (omx-clap-core#136, frozen); the generators read the domain | omx-clap-contract: `data/hosting*.json` become the `hosting` domain | SA, S7; S5, S9, S11 | omx-clap-core 0.34.0; plugin-hostd-protocol next minor, plugin-qualify 0.21.0, the console's next release regenerate | the generated codes drift: render --check compares the rendered header and module byte for byte in the owner's CI (omx-clap-core#136's form) |
| V15 | `HOST_REPLY_CODES` (28), `HOST_TRACK_KINDS`, `HOST_EVENTS`, `OMX_CLAP_CORE_SHARED_VERBS`, `OMX_CLAP_HOST_VERBS` | omx-clap-core `data/verbs.json` | host, rule 1 | omx-clap-core, `host` domain | plugin-hostd-protocol `reply-words.h`, its JSON, `vocabulary.mjs` | the data items become the domain; protocol generates from it | omx-clap-contract: `data/verbs.json` becomes a `host` domain | SA, S5 | omx-clap-core 0.34.0, then plugin-hostd-protocol next minor | a reply code changes value on the wire: protocol's reply-word test reads the domain |
| V16 | `PLUGIN_HOSTD_REPLY_CODES`, `_VERBS`, `_PROTOCOL_VERBS`, `_PROTOCOL_EXTENSIONS` | plugin-hostd-protocol `data/verbs.json` | wire, rule 1 | plugin-hostd-protocol, `protocol` domain | plugin-hostd; the clients | the data items become the domain | plugin-hostd-protocol-contract: `data/verbs.json` becomes a `protocol` domain | SA, S5, S8 | plugin-hostd-protocol next minor, then plugin-hostd 0.21.0 | a verb renamed breaks the clients: the clients' codec tests are generated from the domain |
| V17 | `PLUGIN_HOSTD_GROUPING_REASONS` (16), `_REASON_GROUPS` | plugin-hostd `data/grouping.json` | host, rule 1 | plugin-hostd, `grouping` domain | plugin-hostd-protocol clients (TypeScript, Python, by hand); plugin-hostd clients | the clients' block is generated; plugin-hostd's `clients/` removed (row 3) | plugin-hostd-contract gains `grouping`; plugin-hostd loses `clients/` | SA, S5, S8 | plugin-hostd 0.21.0, then plugin-hostd-protocol next minor | the two client copies differ today: the generated block replaces both, the codec tests compare |
| V18 | `PLUGIN_HOSTD_HISTORY_KEYS` (15) | plugin-hostd `data/history.json` | host, rule 1 | plugin-hostd, `history` domain | plugin-qualify `history-file.ts` | read from the installed domain | plugin-hostd-contract gains `history` | SA, S9 | plugin-hostd 0.21.0, then plugin-qualify 0.21.0 | plugin-qualify reads an unknown key: its history-file test reads the installed domain |
| V19 | `PLUGIN_HOSTD_CLAP_MAP`, `_LV2_MAP` | plugin-hostd AND plugin-qualify `data/formats/` | host, rule 3 | plugin-hostd, `formats-map` domain (a host mapping: kept). Amendment 2026-11-20: its unit and meaning lookup values read the format levels' mappings (M5) | plugin-hostd; plugin-qualify (its own drifted copy) | plugin-qualify's `data/formats/*` dropped | plugin-hostd-contract gains `formats-map`; plugin-qualify-contract loses `data/formats/` | SA, S9; M5 after F1, F2 | plugin-hostd 0.21.0, then plugin-qualify 0.21.0 | the two copies drifted: the diff is reviewed item by item before the drop, and plugin-qualify's format tests read the domain |
| V20 | `CONTRACT_CODES` (57) | omx-contract `data/codes.json` | contract format, rule 5 | omx-contract, `contract` domain | `omx_contract_codes.h` and every reader | the data item becomes the domain | omx-contract-contract: `data/codes.json` becomes the `contract` domain | S0 | omx-contract 3.21.0 | every reader of a refusal code: render --check compares the rendered header and module byte for byte in the owner's CI for `omx_contract_codes.h` |
| V21 | `PARAM_SCALES` | omx-contract `data/primitives.json` | contract format (how a parameter's range is read), rule 5 | omx-contract, a `param` domain: standard, stays (Ruled (coordinator, 2026-11-20), Q1). The CLAP scale codes move to omx-clap-core, mapped to it (V21b, Ruled (coordinator, 2026-11-20), Q2) | everyone | the data item becomes the domain | omx-contract-contract: `PARAM_SCALES` joins a `param` domain (amendment); readers floor on omx-contract-contract | S0; M1 (S5); V21b (S7, S10) | omx-contract 3.21.0 | every parameter reader: render --check compares the rendered header and module byte for byte in the owner's CI |
| V22 | `READOUT_RATE_HZ` | omx-contract `data/primitives.json` | DSP: the rate the kernels' readouts are published at (sorting pass V22) | omx-dsp, a classic data item, `data/primitives/readout.json` (V22): the kernels' readouts reference it in omx-dsp's own data. omx-panel and the console read the rate a readout carries, not an omx-contract word | the omx-dsp kernels' readout references; omx-panel and the console through the kernels' renders | omx-dsp gains `data/primitives/readout.json`; omx-contract's copy and `data/primitives.json` removed (this pass) | omx-dsp-contract gains `READOUT_RATE_HZ`; omx-contract-contract loses it | the sorting pass | omx-dsp 0.34.0 and omx-contract 3.21.0, in the one chain | a reader of omx-contract's constant breaks at the drop: the drop waits for a grep finding none |
| V23 | `OMX_PARAM_CONTRACT_UNITS` and the schema's `unit`, `descriptorUnit` and `meaning` enums | omx-contract `data/param-contract.json` + schema enums | standard units and meanings (rule 5 as amended); the code sheet a CLAP particular | superseded (amendment 2026-11-20): `PARAM_UNITS` STAYS as the one standard list, grown, each unit with its dimension; the meanings stay; `OMX_PARAM_CONTRACT_UNITS` and `omx_param_units.h` MOVE OUT to omx-clap-core (a CLAP particular, mapped to the standard ids); no merged reader | `PARAM_UNITS`: every unit reader (the schema, omx-panel, omx-dsp, omx-plugins, the console). The code sheet: omx-clap-core, omx-plugins, omx-panel, plugin-hostd, the console | `PARAM_UNITS` grows in place, each unit with its dimension, and the schema's `unit` enum stays rendered from it; the code sheet moves to omx-clap-core with its mapping and every code reader reads it there (amendment, V23d); the hand copies read the list (M2 to M7) | omx-contract-contract keeps `PARAM_UNITS` (grown); omx-clap-contract gains the code sheet and `omx_param_units.h`; omx-contract-contract loses them last; each switching consumer floors on the package that now holds the word | S0 (the list grows); S7 (the code sheet gains), S6, S8, S10, S11 (readers), the old sheet removed last | omx-contract 3.21.0 (the grown list), omx-clap-core 0.34.0 (the code sheet), then omx-dsp 0.34.0, omx-panel 0.16.0, omx-plugins next minor, plugin-hostd 0.21.0, the console's next release; the old sheet's removal last | the widest: released `omx_param_units.h` readers in omx-clap-core, plugins and panel; the code sheet moves byte-identical with its released tests (append-only codes, one define per token, the spelling check, the `_Static_assert`s, the sabotage), and the mapping test is red when a mapped standard id is removed or two codes share one |
| V24 | `PLUGIN_FEATURE_AUDIO_EFFECT`, `_INSTRUMENT`, `_NOTE_EFFECT`, `_ANALYZER`, `_OTHER` | omx-contract `data/plugin-features.json` | plugin, rule 5 | plugin-db, a `plugin-feature` domain (plugin level, kept by the amendment 2026-11-20; R-P open) | catalogs, the panel | omx-contract's copy dropped | plugin-db-contract gains `PLUGIN_FEATURE_*`; omx-contract-contract loses them | SA, S6, S11; drop SZ | plugin-db next minor, omx-panel 0.16.0, the console's next release; the drop after | catalog and panel readers break at the drop: grep finding none first |
| V25 | `STANDARD_SAMPLE_RATES`, `STANDARD_QUANTA`, `RT_HARD_TARGET`, `ORACLE_FLOOR_RATES`, `ORACLE_FULL_RATES` | omx-contract `data/rates.json` | DSP, rule 5 | split (Ruled (coordinator, 2026-11-20), Q5): `STANDARD_SAMPLE_RATES` and `STANDARD_QUANTA` are standard and STAY in omx-contract; `RT_HARD_TARGET`, `ORACLE_FLOOR_RATES`, `ORACLE_FULL_RATES` go to omx-dsp, `dsp` domain | omx-dsp oracles; the console | omx-dsp gains the RT and oracle items; omx-contract keeps the two standard lists and still derives `OMX_DECLARED_RATES` from its own `STANDARD_SAMPLE_RATES` (no inner-needs-outer); omx-contract's RT and oracle items removed last | omx-dsp-contract gains `RT_HARD_TARGET` and `ORACLE_*`; omx-contract-contract keeps `STANDARD_*` and loses the rest last | SA, S2, S11; the RT and oracle items removed last | omx-dsp 0.34.0, the console's next release; the drop after | the oracles change rates silently: the oracle tests read the domain, values compared to today's |
| V26 | `CURVE_AXES`, `CURVE_KINDS` | omx-contract `data/curves.json` | DSP, rule 5 | omx-dsp, `dsp` domain | omx-dsp; omx-contract's schema, through libomx-domain | omx-contract's copy dropped | omx-dsp-contract gains `CURVE_*`; omx-contract-contract loses them | SA, S2; drop SZ | omx-dsp 0.34.0; the drop after | omx-contract's schema reads them through libomx-domain: its schema test fails if absent |
| V27 | `CLAP_*_TERMS` (about 50), `LV2_*_TERMS` (about 24) | omx-contract `data/formats/` | plugin (the format spellings), rule 5 | superseded in part (amendment 2026-11-20): `LV2_*_TERMS` to plugin-db, an `lv2` domain, and `CLAP_*_TERMS` to omx-clap-core, a `clap` domain; each gains its mapping to omx-contract's standard ids (F1, F2) | LV2: plugin-hostd, plugin-qualify, omx-panel (P1, P3), omx-formats, the console. CLAP: omx-clap-core, plugin-hostd, omx-plugins | the `term` and `from` references point at plugin-db's `lv2` and omx-clap-core's `clap`; omx-contract's copy removed last | plugin-db-contract gains `lv2`; omx-clap-contract gains `clap`; omx-contract-contract loses `data/formats/`; each reader floors on the package that holds its terms | SA (plugin-db, omx-clap-core), S3, S7, S8, S9, S10, S11; the old copy removed last | plugin-db next minor and omx-clap-core 0.34.0, then plugin-hostd 0.21.0, plugin-qualify 0.21.0, omx-plugins next minor, omx-panel 0.16.0, the console's next release; the removal last | the `from` references in three repositories: each repository's render fails on an unresolved `from` |
| V28 | `RESOURCE_KINDS`, `_UNITS`, `_BASES`, `_HINTS` | omx-contract `data/resource-profile.json` | host, rule 5 | plugin-hostd, `resource` domain (the host words stay); its units join the ONE standard list in omx-contract and `RESOURCE_UNITS` names the standard ids (M8, Ruled (coordinator, 2026-11-20), Q6) | plugin-db, plugin-qualify, the hosting code | omx-contract's copy dropped | plugin-hostd-contract gains `resource`; omx-contract-contract loses it | SA, S3, S7, S9; drop SZ | plugin-hostd 0.21.0, plugin-db next minor, omx-clap-core 0.34.0, plugin-qualify 0.21.0; the drop after | plugin-db holds them in a stored schema: its schema test reads the domain |
| V29 | the verb hosts, now `HOSTING_VERB_HOSTS` | omx-contract `data/verbs.json` | host, rule 1 | omx-clap's hosting data, `data/hosting/verb-hosts.json`, installed as `3/omx-clap/hosting/verb-hosts.json` (plugin-hostd#217's design, after Q3); the validator and the verbs render read it from the read, with no fallback | plugin-hostd-protocol; omx-clap; omx-contract's verb validator and verbs render (through the read) | omx-contract's copy removed with the move; a read with verbs and no `HOSTING_VERB_HOSTS` is refused by name | omx-clap-contract gains `HOSTING_VERB_HOSTS`; omx-contract-contract loses its copy; omx-contract tests against a fixture of omx-clap's file, never omx-clap | SA, S8, S5, S7; the removal last (R-P for the item name) | plugin-hostd 0.21.0, then plugin-hostd-protocol next minor and omx-clap-core 0.34.0; the removal last | protocol's verb table: its codec tests |
| V30 | omx-dsp kernels (43 files) and primitives (15 files: `INSTRUMENT_FAMILIES`, biquad kinds and the rest) | omx-dsp `data/kernels`, `data/primitives` | DSP, rule 1 | omx-dsp, `dsp` domain | omx-dsp include and `ts/`; the console | the data items become the domain | omx-dsp-contract: `data/kernels`, `data/primitives` become the `dsp` domain | SA, S2, S11 | omx-dsp 0.34.0, the console's next release | 58 files: render --check compares the rendered header and module byte for byte in the owner's CI |
| V31 | `OMX_PLUGINS_ROLE_MEANINGS`, `OMX_PLUGIN_FACE_IDS` | omx-plugins `contract/` | plugin (the plugins' own declarations), rule 1 | omx-plugins, `plugins` domain (a plugin's particulars mapped to the standard meanings: kept by the amendment 2026-11-20) | omx-panel (role meanings); omx-plugins faces | the data items become the domain | omx-plugins-contract: `contract/` becomes a `plugins` domain | SA, S6, S10 | omx-plugins next minor, omx-panel 0.16.0 | omx-panel reads role meanings: its role test reads the domain |
| V32 | `OPENMIXER_CLOCK_REFERENCE_WHY`, `_DRIVER_RING_DISABLED_WHY`, `_RT_HOST_UNRESOLVED_WHY` | the console `words.json` (from hand TS) | the console's own, rule 1 | the console, a domain of its own | the console's server and web UI | `words.json` generated from the domain, not from hand TS (row 22) | the console's package: `words.json` generated from its domain | S11 | the console's next release | the server's messages: the console's words test |

**Rows the owner ruled on (2026-11-19), as proposed:**

- **V24 and V27:** plugin-db owns the plugin level (the lowest layer that defines a plugin). Superseded in part by the
  amendment 2026-11-20: the CLAP terms go to omx-clap-core.
- **V12:** the pin verdicts and pools are host level, so plugin-hostd's.
- **V21:** `PARAM_SCALES` is contract format.
- **V29:** the verb hosts are omx-clap's hosting words, `HOSTING_VERB_HOSTS` (plugin-hostd#217's design; Q3 of 2026-11-20 had named plugin-hostd).

## Amendment 2026-11-20: standard vocabulary in one place

**The ruling** (owner, 2026-11-20, with its refinements of the same day). It supersedes the per-producer reading of
standard words (row 30, V23) and every row below that moved a standard word out of omx-contract.

- **Standard words live in ONE place, omx-contract**, and omx-contract holds ONLY them: the standard units (one list,
  grown from `PARAM_UNITS`: dB, dBFS, dBTP, dBu, LU, LUFS, Hz, kHz, MHz, ms, s, min, %, ratio, frames, bpm, bar,
  beat, the lengths, ...), the standard parameter meanings, and the unit dimensions.
- **A level's particulars stay at that level, with that level's MAPPING to the standard ids.** The LV2 terms
  (`units:db`, `lv2:designation`, the `param:` spellings) are plugin-db's; the CLAP terms and the CLAP unit codes are
  omx-clap-core's. The param-contract unit code table is the wire encoding of the CLAP-level extension
  `org.openmixer.param-contract`, so a CLAP particular (ruled by the coordinator, 2026-11-20): omx-clap-core keeps it
  and maps each code to a standard unit id. Descriptors name standard unit ids, never codes.
- **Panels.** omx-panel holds the panel words, control kinds and display rules: only the general panel vocabulary and
  scales. A plugin or format with its own scale maps itself onto the general panel scales and laws at its own level;
  omx-panel holds no per-plugin or per-format mapping.
- **A plugin's particulars** (its custom units and words) stay in its own declaration, mapped to the standard ids.
- **Host-level product words stay with the hosts** unless the owner says otherwise: hosting with omx-clap-core;
  machine, probe and qualification with plugin-hostd.
- **Consequences.** No merged units reader, no `x-units-of`, no units flag day. omx-contract#144 (`PARAM_UNITS`
  leaves) is superseded. S0's "merged views (the units of row 30)" is dropped from S0.

**How each word is judged.** Standard (any plugin or host would use it): omx-contract. A level's particular: that level,
with its mapping. A host product word: the host. A panel word: omx-panel. Where the rule does not settle it, the
question went to the owner; every one is ruled (see "Rulings"). The contract format tool's own refusal codes
(`CONTRACT_CODES`, V20) are omx-contract's own level (rule 5), so V20 staying is no exception to "only standard words".

**Packaging follows the read** (the sorting pass's packaging arm). Every consumer that switches floors on the contract
package that now holds the word (Requires/Depends, BuildRequires/Build-Depends) in the same PR, and drops the old
holder's where it no longer reads it. The package per row is in the Package column of the tables below.

### The fates of the rows

STAYS: the old move out of omx-contract is cancelled. MOVES IN: a copy elsewhere is removed and its consumer reads
omx-contract. MOVES OUT: a level's particular leaves omx-contract for its level. KEPT: the row's plan stands.

| Row | Word(s) | Old plan | New fate | PRs |
|---|---|---|---|---|
| V20 | `CONTRACT_CODES` | omx-contract `contract` domain | KEPT, STAYS: the reader's own refusal codes (rule 5). Gains `contract.descriptor.unit-duplicate` (adopted): the descriptor validator refuses a plugin's own unit that duplicates a standard one (N1) | V20's 2, then N1 |
| V21 | `PARAM_SCALES` | `contract` domain (owner, 2026-11-19) | STAYS, standard, as a `param` domain item (prefix fits; Ruled (coordinator, 2026-11-20), Q1). The protocol's hand copy MOVES IN (M1) | 4 (as before) |
| V21b | the param-contract scale codes (`OMX_CLAP_PARAM_SCALES`, the plugins' `OMX_CLAP_SCALE_*`) | omx-contract's `PARAM_SCALES` positions | MOVES OUT to omx-clap-core: a CLAP particular like the unit codes (Ruled (coordinator, 2026-11-20), Q2), mapped to `PARAM_SCALES` (F2). Shaped like V23d, below | 2 |
| V22 | `READOUT_RATE_HZ` | omx-panel | MOVES OUT to omx-dsp, as the classic `data/primitives/readout.json`: the rate the kernels' readouts are published at; omx-panel and the console read it through the kernels' renders | 3 |
| V23a | `PARAM_UNITS` | leaves omx-contract (#144), per producer | STAYS: the one standard list, grown to the ruled set (dBTP, dBu, LU, kHz, MHz, frames, bpm, bar, beat, the lengths, degree, midiNote, ratio, ...) and the resource units (M8). The schema's `unit` enum stays rendered from it | 1 (omx-contract) |
| V23b | unit dimensions | none | MOVES IN, new: each standard unit names its dimension (level, gain, time, frequency, pitch, tempo, length, angle, ratio, ...), in the same PR as V23a | in V23a |
| V23c | the schema's `meaning` enum | per producer | STAYS: the standard parameter meanings | none |
| V23d | `OMX_PARAM_CONTRACT_UNITS`, `omx_param_units.h` (the 3.20.2 code sheet and its render) | stays until a merged reader | MOVES OUT to omx-clap-core (a CLAP particular, ruled), mapped code to standard id; codes 260 to 263 for dB/oct, dB/s, dBTP and LU are added there (ruled, Q15). Three PRs, below | 3 + readers (6 in all) |
| V23e | the merged units reader, `x-units-of`, the units flag day | planned | CANCELLED | none |
| V23f | the schema's `descriptorUnit` | per plugin | KEPT: a plugin's own unit, in its declaration, mapped to the standard ids; refused when it duplicates a standard unit (N1) | none |
| V24 | `PLUGIN_FEATURE_*` | plugin-db | KEPT: plugin level (owner, 2026-11-19), not a standard unit, meaning or dimension. R-P open (`plugin-feature`) | 1 (plugin-db), with V27's readers |
| V27a | `LV2_*_TERMS`, including `data/formats/lv2/units.json` | plugin-db `formats` | MOVES OUT to plugin-db, domain `lv2` (prefix fits), with its mapping to the standard ids (F1). The copies in plugin-hostd and plugin-qualify switch; omx-formats' module is the source and omx-formats folds into plugin-db (O1 to O5) | below |
| V27b | `CLAP_*_TERMS` | plugin-db `formats` | CHANGED: MOVES OUT to omx-clap-core, domain `clap` (prefix fits), with its mapping to the standard ids (F2) | below |
| V25 | `STANDARD_SAMPLE_RATES`, `STANDARD_QUANTA` / `RT_HARD_TARGET`, `ORACLE_*_RATES` | omx-dsp | SPLIT (Ruled (coordinator, 2026-11-20), Q5): the two standard lists STAY in omx-contract; the RT target and oracle rates go to omx-dsp | 3 (as before) |
| V26 | `CURVE_AXES`, `CURVE_KINDS` | omx-dsp | KEPT (DSP level). The axes' units name the standard unit ids (M2) | 3 (as before) |
| V28 | `RESOURCE_*` | plugin-hostd | KEPT: the words stay with plugin-hostd (its MAP ERROR still waits). Its units (`us`, `bytes`, `nsPerSample`, `plainCount`, `flag`, with `ms`, `s`, `frames`, `ratio`) join the ONE standard list and `RESOURCE_UNITS` names the standard ids (M8, Ruled (coordinator, 2026-11-20), Q6) | 5 (as before) |
| V29 | the verb hosts (`HOSTING_VERB_HOSTS`) | omx-clap | MOVES OUT to omx-clap's hosting data: a host product word (plugin-hostd#217's design, after Q3 2026-11-20); keeping it as validator vocabulary is withdrawn | 2 (as before) |
| V31 | `OMX_PLUGINS_ROLE_MEANINGS`, `OMX_PLUGIN_FACE_IDS` | omx-plugins | KEPT: a plugin's particulars, mapped to the standard meanings | 3 (as before) |
| V19 | `PLUGIN_HOSTD_CLAP_MAP`, `_LV2_MAP` | plugin-hostd | KEPT (a host mapping). Its unit and meaning lookup values read F1 and F2 (M5). Its omx-panel PR is replaced by P1 | 4 (as before) |
| V1 to V4 | panel words, codes, sheet, gestures | omx-panel | KEPT: panel words | as before |
| V8 | `PROBE_OUTCOMES`, `_REASONS`, `_STEPS` (the probe wire words) | plugin-hostd `probe` | CHANGED: plugin-hostd-protocol owns the wire words and plugin-hostd reads them: no build cycle, no hand table (Ruled (coordinator, 2026-11-20)) | 4 |
| V12, V11, V13 | pin verdicts and pools; the plugin-db items | plugin-hostd; plugin-db | KEPT; V12 lands BEFORE V11 and V13 (Ruled (coordinator, 2026-11-20)) | as before |
| V5 to V18 (others) | qualification, machine, scan, hosting, host, protocol, grouping, history words | their hosts and storers | KEPT: host and storer words | as before |
| V30, V32, Z1 | omx-dsp kernels; the console's own words; the panel family enum | omx-dsp; the console; omx-panel | KEPT | as before |

**V23d, the code sheet, in three PRs:**

1. omx-clap-core gains the sheet (a domain `omx-param-contract`, prefix fits) and its render `omx_param_units.h`,
   with the mapping of each code to a standard unit id and the Q15 codes. The released code-sheet tests follow it:
   append-only codes, one define per token, the spelling check, the C `_Static_assert`s and the sabotage.
2. Each reader switches its read, floors on omx-clap-contract and drops its omx-contract-contract floor where it
   no longer reads omx-contract (packaging follows the read): omx-clap-core `param_contract.h`,
   `clap_host.h`, `omx_clap_ext.h`, `lv2/clap/lv2_clap.c` and the omx-clap-host twin (in PR 1); omx-plugins
   `include/omx_param_contract.h`, `tools/param-contract.mjs`, its Makefile and docs; omx-panel's code-sheet read (P2),
   docs and floors; the wire's `param_info` unit word (D1); the console.
3. omx-contract removes `data/param-contract.json` and its render LAST, with a test red while any reader still reads it.

The read points (A2): the mapping test is red when a mapped standard id is removed, or when two codes map to one id;
descriptors carry standard unit ids and never a code (D1 to D3); the encoder and decoder in omx-clap-core are the only
code readers, which the PR proves with a grep over every repository.

**V21b, the scale codes, in the same shape:** (1) omx-clap-core gains the scale code sheet in its
`omx-param-contract` domain, with each code mapped to a `PARAM_SCALES` id (F2), and renders `OMX_CLAP_PARAM_SCALES`
from it; its `param_contract_test.c` position checks become the F2 mapping test. (2) omx-plugins' `OMX_CLAP_SCALE_*`
enum and its face's `_Static_assert` read omx-clap-core's render and floor on omx-clap-contract. (3) LAST, no
spelled scale code is left: omx-contract never held a scale code sheet, so the last step removes the hand tables
(`omx_clap_ext.h`'s spelled X-macro, the plugins' enum) with a test red while any is spelled.

**V27a, the LV2 terms, in the same shape:** plugin-db gains `lv2` and its mapping (F1); plugin-hostd's `term`
references, plugin-qualify's unit read and the console switch (the module itself comes from omx-formats, below);
omx-contract removes `data/formats/lv2` last; each V27a reader floors on plugin-db-contract. **V27b** follows it for
`clap` at omx-clap-core; its readers floor on omx-clap-contract.

### Format-level mappings (new rows)

Each mapping row's call-level test, in the three-arm form: (a) golden: the level's lookup, called for every term of
the mapped groups, gives the standard id frozen from today's source; (b) both sources: while omx-contract's copy
exists, the level's terms equal it, and every term either maps to a standard id that exists in omx-contract or is
named as that level's particular; (c) sabotage: a temporary contract directory whose omx-contract lacks one mapped
standard id makes the lookup refuse, and a term neither mapped nor named particular is refused.

| Row | Level, item | Maps | Lands | Package (floor) |
|---|---|---|---|---|
| F1 | plugin-db `lv2` | `units:*` and the `urn:openmixer:unit#` spellings (Ruled (coordinator, 2026-11-20), Q7) to standard units; `param:*` designations to standard meanings; the port properties (logarithmic, integer, toggled) to `PARAM_SCALES` | V27a PR 1 | plugin-db-contract (holds it); its readers floor on it |
| F2 | omx-clap-core `clap` and `omx-param-contract` | each unit code (Q15 included) to a standard unit id; the scale codes to `PARAM_SCALES` (V21b); the parameter flags to scales | V23d PR 1, V21b PR 1, V27b PR 1 | omx-clap-contract (holds it); its readers floor on it |
| F3 | omx-panel display rules | none of its own: its role-table units and level units name standard ids and dimensions only | M4 | omx-contract-contract at the release with the grown list (3.21.0) |
| F4 | a plugin's custom units (omx-plugins' declarations) | each declared unit is a standard id or the plugin's own, mapped; a duplicate is refused (N1) | M3 | omx-contract-contract at the release with the grown list (3.21.0); omx-clap-contract where a face encodes a code |

### Hand copies of standard words outside omx-contract (MOVE-IN rows)

Each test is in the three-arm form: (a) the consumer's real read = golden from today's copy; (b) the copy, while it
exists, equals omx-contract's item; (c) a temporary contract directory whose omx-contract lacks one word makes the
call refuse or differ, so restoring the copy turns (c) red.

| Row | Copy | Consumer reads | Call-level test | Package (floor) |
|---|---|---|---|---|
| M1 | plugin-hostd-protocol `protocol.h` `PHD_PARAM_SCALES` (V21's PR 3) | `PARAM_SCALES`, the X-macro rendered from omx-contract; the protocol-gen cross-check goes | the golden test's `param_info` scale words = golden; (c) no `log` in the temporary item | omx-contract-contract at the release with the grown list (3.21.0) |
| M2 | omx-dsp `CURVE_UNITS`, `METER_UNITS` and `omx_curve.h` `OMX_CURVE_UNIT_WORDS`; the curve axes' units | the standard unit ids (the subsets and their order stay omx-dsp's) | the curve and meter unit words = golden; (c) no `dbu` in `PARAM_UNITS` refuses the render | omx-contract-contract at the release with the grown list (3.21.0) |
| M3 | omx-plugins' own `dBu`, `dB/oct` and `ratio` (its format tables and generator) | the standard ids; the `urn:openmixer:unit#` LV2 spellings move to F1 (Ruled (coordinator, 2026-11-20), Q7) | the declared units of every plugin = golden; (c) no `dbu` refuses the declaration | omx-contract-contract at the release with the grown list (3.21.0); plugin-db-contract for the LV2 spellings |
| M4 | omx-panel's role-table unit groups, its level-unit list, its slope-unit map | the standard ids and dimensions (F3) | the roles' accepted units = golden; (c) no `dbu` makes a dBu threshold refused | omx-contract-contract at the release with the grown list (3.21.0) |
| M5 | plugin-hostd `data/formats/{clap,lv2}.json` unit and meaning lookup values | F1 and F2's mappings | describing the fixtures gives the golden descriptors; (c) no `db` in the standard list refuses | omx-contract-contract at the release with the grown list (3.21.0); plugin-db-contract (F1) and omx-clap-contract (F2); drops the old holders' floors where unread |
| M6 | plugin-qualify's meaning list in its scan tool | the standard meanings | the scan's meanings = golden; (c) a meaning removed is refused | omx-contract-contract at the release with the grown list (3.21.0) |
| M7 | the console's standard unit list, level-unit set, code-name list, standard-to-code map and LV2 symbol table | the standard list; F2 for codes; F1 for LV2 symbols; the generator change lands in the same PR | its unit conformance tests = golden; (c) as above | omx-contract-contract at the release with the grown list (3.21.0); omx-clap-contract (F2); plugin-db-contract (F1) |
| M8 | the resource units of `RESOURCE_UNITS` (`us`, `bytes`, `nsPerSample`, `plainCount`, `flag`; with `ms`, `s`, `frames`, `ratio`) | the standard list, which gains the five (V23a); `RESOURCE_UNITS` at plugin-hostd names their ids | rides V28's plugin-hostd PR: the resource units = golden; (b) each is in `PARAM_UNITS`; (c) no `bytes` in the temporary list refuses | omx-contract-contract at the release with the grown list (3.21.0) |

**Descriptor and wire fields that hold a code** (they move to the standard id, each with its own call-level test): D1,
the `param_info` reply's unit word, written from the code's token; D2, the scan's descriptor unit, derived from the
code's token through plugin-hostd's lookup row (it takes F2's decoder); D3, the console's stored parameter contract,
where it keys a unit by code name. The omx-contract descriptor schema and omx-plugins' descriptors already carry
standard units. Each of D1 to D3 floors on omx-clap-contract (its decoder) and drops its read of omx-contract's
code sheet.

### Per-plugin and per-format mappings inside omx-panel (MOVE-OUT rows)

| Row | Table in omx-panel | Moves to | Package (floor) |
|---|---|---|---|
| P1 | its LV2 unit table, read from plugin-hostd's LV2 map, and the unit tokens derived from it | plugin-db (F1); omx-panel reads standard ids from the descriptor. Replaces V19's omx-panel PR | plugin-db-contract; drops plugin-hostd-contract where no longer read |
| P2 | its read of the param-contract code sheet (which units the extension serves, the vendor block) | omx-clap-core (F2), in V23d PR 2 | omx-clap-contract; drops omx-contract-contract's code-sheet floor |
| P3 | group inference's `lv2:designation` table (`param:*` to a group) | plugin-db (F1) maps the designations to standard meanings; omx-panel groups by meaning | plugin-db-contract |
| P4 | the served-widget table (a standard widget to what the CLAP extension serves) | NOT a move-out: panel vocabulary, it STAYS in omx-panel (Ruled (coordinator, 2026-11-20), Q8) | omx-panel's own; no change |

Checked and found holding none: the role table (keyed by panel family), meaning inference (name heuristics), the
MOD GUI writer and its looks, the LV2 complement writer, the skin packages, the worked examples, the renderer and
the store.

### Other rows

- **N1** `contract.descriptor.unit-duplicate` (adopted): a `CONTRACT_CODES` code and its check in the descriptor
  validator. It lands after V20, which moves `CONTRACT_CODES`.

### R-P, the domain prefix rule

With the standard words in omx-contract, two R-P rows disappear: **V21** (`PARAM_SCALES` in a `param` domain, with
`PARAM_UNITS`, the meanings and the dimensions: the prefix fits) and **V27** (`lv2` at plugin-db and `clap` at
omx-clap-core: the prefixes fit). V23d's sheet takes a domain `omx-param-contract`, which fits. R-P still decides
V15 to V19, V22, V24, V25 (the RT and oracle items), V29 and V31; V8's wire words keep `probe` in
plugin-hostd-protocol.

### omx-formats folds into plugin-db (Ruled (owner, 2026-11-20), Q9)

omx-formats (unreleased) holds the format term modules. Its modules move; omx-formats is archived after the move,
and nothing is dropped. Each module splits between plugin-db and its particular level:

| omx-formats part | Items | Goes to |
|---|---|---|
| `contract.d/formats/common` | `FORMAT_TERM_KINDS`, `FORMAT_TERM_STATUSES` | plugin-db, a `format` domain (the words every format's terms use; omx-clap-core reads them downward) |
| `contract.d/formats/lv2` | the 24 `LV2_*_TERMS`, `LV2_UNITS_TERMS` included | plugin-db `lv2` (V27a), with F1 |
| `contract.d/formats/clap` | the 58 CLAP term items | omx-clap-core `clap` (V27b), with F2 |
| `include/omxcontract/omx_formats.h`, `share/omx-formats/omx_formats.py`, `ts/formats.js`, `ts/formats.d.ts` | the renders | rendered by each new owner for its own items (`render --check` byte for byte per item) |
| `test/golden/terms.digest`, `tools/terms-digest.mjs`, `tools/check.sh` | the term digest and its checks | split per module into each new owner's tests |
| its open PR on the item prefixes | the prefix change | carried into the plugin-db and omx-clap-core move PRs |
| packaging, CI, CHANGELOG, catalogs | the package `omx-formats` and `libomx-formats-dev` | retired; the catalogs move with their modules |

| Row | Step | Test |
|---|---|---|
| O1 | plugin-db gains `format` and `lv2` from omx-formats (V27a PR 1) | every item and term = golden from omx-formats and from omx-contract's `data/formats/lv2`; (c) a term removed refuses |
| O2 | omx-clap-core gains `clap` from omx-formats (V27b PR 1) | the same, against omx-formats' `clap` module |
| O3 | the readers switch (V27a/V27b readers); omx-contract stops rendering its own `omx_formats.h` (V27's removal) | as V27; no reader of omx-formats exists today, which a grep proves |
| O4 | omx-formats' last PR: a README listing every module, item and file above with its new home | the module-by-module list matches the tree item for item ("nothing dropped") |
| O5 | archive omx-formats, LAST | none: a repository action, after O1 to O4 merge |

### Rulings

Every question of this amendment is ruled; none remains open.

- **Q1, `PARAM_SCALES`:** standard; stays in omx-contract. Ruled (coordinator, 2026-11-20).
- **Q2, the param-contract scale codes:** a CLAP particular; they go to omx-clap-core like the unit codes, mapped to the
  standard scales (V21b, F2). Ruled (coordinator, 2026-11-20).
- **Q3, the verb hosts:** plugin-hostd (V29). Ruled (coordinator, 2026-11-20); the item then went to omx-clap's hosting data as `HOSTING_VERB_HOSTS` (plugin-hostd#217's design).
- **Q4, `READOUT_RATE_HZ`:** SUPERSEDED. It was omx-panel, as the display redraw rate, with the DSP ballistics staying
  in omx-dsp (V22), ruled (owner, 2026-11-20). The later ruling (coordinator, V22) puts it in omx-dsp, as its classic
  `data/primitives/readout.json`: the rate the kernels' readouts are published at (the V22 rows above).
- **Q5, the standard sample rates and quanta:** standard; they stay in omx-contract (V25 split). Ruled (coordinator,
  2026-11-20).
- **Q6, the resource units:** units; they join the ONE standard list (V28 keeps the words, M8). Ruled (coordinator,
  2026-11-20).
- **Q7, the `urn:openmixer:unit#` LV2 spellings:** format particulars; plugin-db's mapping (F1, M3). Ruled (coordinator,
  2026-11-20).
- **Q8, the served-widget table:** panel vocabulary; it stays in omx-panel (P4 is not a move-out). Ruled (coordinator,
  2026-11-20).
- **Q9, omx-formats:** folds into plugin-db; archived after the move, nothing dropped (O1 to O5). Ruled (owner,
  2026-11-20).
- **V8:** the probe wire words belong to plugin-hostd-protocol, and plugin-hostd reads them. Ruled (coordinator,
  2026-11-20).
- **V12** lands before V11 and V13. Ruled (coordinator, 2026-11-20).
