# Ownership map of the vocabularies

**Status: PROPOSAL** (owner, 2026-11-19). Vocabulary moves are frozen until the owner approves this map item by item.
This release pass ships every domain where it is (`x-since` fixes only). Nothing below is implemented.

Who owns each vocabulary of the Open-Mixer repositories, in what form, which consumers switch to it, and which release
would carry the switch. It proposes how to settle the 30 conflicts an inventory of every domain document, every
`data/` item and every hand copy found on 2026-11-19, and how to sort every vocabulary of that inventory in a pass
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
   libomx-domain with `openDomainAt`, the ONE reader every consumer reads downward through, merged views included
   (the units of row 30). Nothing product-specific.

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

| # | Conflict | Proposed owner, form | Removed / switched | Proposed line |
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
| 10 | qualification words hand-copied: plugin-hostd bench report, plugin-qualify benchmark tool, the console's catalog types, a plugin-db-qualification provenance template | plugin-hostd, `qualification` domain (moved from plugin-qualify, 1.4.0) | the domain would move to plugin-hostd; plugin-qualify deletes its copy and reads the installed domain; each hand copy reads it or its generated module | SA, S8, S9 (V5) |
| 11 | plugin-qualify and plugin-hostd `describe.c` spell `SCAN_FIELD_SCOPES` | omx-clap-core, `scan` domain | both include the rendered scan header | sorting pass |
| 12 | omx-panel's own tools spell its families, widgets, placements and display words | omx-panel | its tools read its own domain | sorting pass |
| 13 | plugin-qualify generates hosting codes from omx-clap-core; plugin-hostd-protocol reads `HOST_REPLY_CODES` | omx-clap-core, `hosting` domain (this pass, omx-clap-core#136) and a `host` domain for the reply codes | consumers read the installed domains | SA, S7 (hosting); S5 (host replies) |
| 14 | plugin-qualify reads `PLUGIN_HOSTD_HISTORY_KEYS` | plugin-hostd, a `history` domain | plugin-qualify reads the installed domain | sorting pass |
| 15 | plugin-hostd-protocol reads plugin-hostd's probe and grouping words | plugin-hostd, as rows 8 and 9 | generated from the installed domains (data, rule 2 as read above) | as rows 8 and 9 |
| 16 | plugin-db-qualification holds `machine` fixtures and reads `MACHINE_*` | plugin-hostd, `machine` domain | the fixtures stay test data; the store reads the installed domain | none |
| 17 | omx-contract names outer repositories' words (`VERB_HOSTS`, `PLUGIN_FEATURE_*`, `PANEL_*`, `RESOURCE_HINTS`) | each to its producer (rows 1, 19) | omx-contract drops them (rule 5) | sorting pass |
| 18 | plugin-hostd holds `machine` and `probe`, read by layers 4 to 6 | plugin-hostd (the prober writes them) | none | none |
| 19 | the 24 items of `moving-out.txt` with no new owner | `PLUGIN_FEATURE_*` to plugin-db (plugin level); `RESOURCE_*` to plugin-hostd (it places plugins within the budgets); rates and `CURVE_*` to omx-dsp (the kernels' axes and rates); `VERB_HOSTS` to plugin-hostd (host level); `READOUT_RATE_HZ` to omx-panel; `OMX_PARAM_CONTRACT_UNITS` with the units lane (row 30) | omx-contract drops each as its owner publishes it | sorting pass |
| 20 | `QUALIFICATION_MACHINE_CLASSES` and `_HOST_CLASSES` | plugin-hostd, `qualification` domain (row 10) | as row 5 | S8 |
| 21 | omx-panel gesture kinds and `PANEL_STANDARD_WIDGETS` share eight words in two forms | omx-panel, a `gestures` domain (`x-group`, on omx-contract main) | the widget item references the gesture words; `schema/gestures.json` rendered from the domain | SA, S6 |
| 22 | the console's `words.json` built from hand TS; the console spells other owners' words | the console for its three items; the rest to rows 6, 7, 10 | the console generates its three from a domain of its own | sorting pass |
| 23 | `HOSTING_*` in omx-clap-core `data/` | omx-clap-core, `hosting` domain | `data/` becomes the domain, byte-identical (omx-clap-core#136, frozen) | SA, S7 |
| 24 | host and protocol verbs and reply codes in omx-clap-core and plugin-hostd-protocol `data/verbs.json` | omx-clap-core `host` domain (host side), plugin-hostd-protocol `protocol` domain (wire side) | data items become the two domains | sorting pass |
| 25 | `PLUGIN_DB_*` items in `data/` beside the `plugin-db` domain | plugin-db, `plugin-db` domain | the 20 items join the domain | sorting pass |
| 26 | `PLUGIN_HOSTD_GROUPING_*`, `_HISTORY_KEYS` in plugin-hostd `data/` | plugin-hostd, its `grouping` (row 8) and `history` (row 14) domains | the data items become the two domains | sorting pass |
| 27 | `qualify.*` (plugin-qualify's own command refusals, not plugin words) and `panel.*` code sheets beside their domains | each domain, texts in `x-text` | the sheets are rendered from the domains (the render on omx-contract main) | sorting pass |
| 28 | omx-contract's own classic data (`CONTRACT_CODES`, `CURVE_*`, `PARAM_SCALES`, rates, `RESOURCE_*`, `VERB_HOSTS`, `PLUGIN_FEATURE_*`) | `CONTRACT_CODES` and `PARAM_SCALES` stay as omx-contract domains (format and cross-cutting); the rest move per row 19 | migrated to domains | sorting pass |
| 29 | omx-dsp kernels and primitives as `data/` items | omx-dsp, a `dsp` domain | the data items become the domain | sorting pass |
| 30 | units: `PARAM_UNITS` (added on main by omx-contract#141, never released) and the released `OMX_PARAM_CONTRACT_UNITS` (`omx_param_units.h`, `omx_contract_limits.h`; read by omx-clap-core `param_contract.h`, `clap_host.h`, `omx_clap_ext.h`, `lv2_clap.c` and omx-plugins `omx_param_contract.h`, `param-contract.mjs`, per omx-contract#144) | owned per producer: the units a kernel computes in are omx-dsp's; the units a value is DISPLAYED in are omx-panel's; a plugin's custom units are its own declaration; the format spellings with V27. libomx-domain's merged units view gives a consumer every owner's units as one list | `PARAM_UNITS` leaves main (omx-contract#144) before any tag; `OMX_PARAM_CONTRACT_UNITS` stays byte-identical to 3.20.2 and leaves only with the units lane, after the merged reader is in place | the units lane (V23) |

## This release pass

Nothing of this map. Every domain ships where it is, with `x-since` fixes only. Frozen until the owner approves:
the `qualification` move, omx-clap-core#136 (hosting), the units and the panel words. omx-contract 3.21.0 is not cut
in this pass.

## The proposed sorting pass

After this release pass, every vocabulary of the inventory would go to its owner, by the five rules. This is a
PROPOSAL: no line runs before the owner approves it item by item.

**Its lines.** A contract package is leaf data (rule 2 as read above), so owners publish before readers switch, and
the old holders drop last:

- **S0, omx-contract:** libomx-domain and `openDomainAt` read every installed domain, with merged views (the units of
  row 30). Every switch below goes through it, or through a header or module generated from it.
- **SA, every owner:** publishes its domains in its `<repo>-contract` package. These are data only, so in any order.
- **S1 to S11, inside-out by layer:** each repository, in its own release, switches its reads to the installed
  domains, renders its sheets from its own domains, and removes its hand copies and duplicates.
- **SZ, the old holders:** each drops a moved item once every reader of it has switched (omx-contract's moved-out
  items, `data/panel.json` and `OMX_PARAM_CONTRACT_UNITS`; plugin-db's pin verdicts and pools; plugin-qualify's format
  maps).

A setter (plugin-qualify) or a storer (plugin-db-qualification, plugin-db) owns no plugin or host word. It reads
the installed domain like any consumer.

**The vocabularies.** These are the inventory's rows, about 160 domain and data items. Per item: where it is today,
the proposed owner and the rule, and what changes (files, packages, consumers, releases, risk). The "Lines" column
names the releases.

| # | Vocabulary | Today | Level, rule | Proposed owner, form | Consumers | Files that change | Packages | Lines | Risk |
|---|---|---|---|---|---|---|---|---|---|
| V1 | `PANEL_FAMILIES`, `_STANDARD_WIDGETS`, `_WIDGETS`, `_DISPLAY_KINDS`, `_DISPLAY_SOURCES`, `_PLACEMENTS` | omx-panel `panel` domain AND omx-contract `data/panel.json` | display, rule 3 | omx-panel, `panel` domain | omx-panel tools; omx-clap-core `omx_clap_ext.h`; the console | omx-contract's `data/panel.json` copy dropped; ext.h includes the rendered header; the console imports the generated module | omx-panel-contract; omx-contract-contract loses a file | S6, S7, S11; drop SZ | the console reads both today: it switches before the drop |
| V2 | `PANEL_STORE_CODES`, `_DESCRIBE_CODES`, `_GROUP_OUTCOMES`, `_GROUP_REASONS`, `_GROUP_RULES` | omx-panel `panel` domain | display, rule 1 | omx-panel, `panel` domain | omx-panel `store.c`, `describe.mjs`, `group-infer.mjs` | its tools read its own domain | the owner's contract package | S6 | low |
| V3 | `panel.*` refusal codes sheet | omx-panel `schema/codes.json` | display, rule 1 | omx-panel, `panel` domain texts (`x-text`) | omx-panel tools, catalogs | the sheet is rendered from the domain | the owner's contract package | S6 | low |
| V4 | gesture kinds (`schema/gestures.json`) | omx-panel `schema/gestures.json` | display, rule 1 | omx-panel, `gestures` domain | omx-panel `renderer/src/gesture.c` | the schema is rendered from the domain; the widget item references it (row 21) | the owner's contract package | SA, S6 | low |
| V5 | `QUALIFICATION_*` (40 items, plus the 5 of 1.4.0) | plugin-qualify `qualification` domain 1.3.0 | host, rule 1 | plugin-hostd, `qualification` domain | plugin-qualify; plugin-hostd bench report; plugin-qualify `benchmark.py`; the console's catalog types; plugin-db-qualification | the domain moves from plugin-qualify; the hand copies read the domain | plugin-hostd-contract gains, plugin-qualify-contract loses the file | SA, S8; S8, S9, S11 | a file moving between packages: the old one is pruned from the channel and the boxes remove it before upgrading (owner ruling 2026-11-19, no package relation) |
| V6 | `qualify.*` codes sheet | plugin-qualify `schema/codes.json` | the setter's own command refusals, rule 1 | plugin-qualify, a `qualify` domain with `x-text` | plugin-qualify `descriptors.py`, `text-catalog.ts` | the sheet is rendered from the domain | the owner's contract package | SA, S9 | low |
| V7 | `MACHINE_*` (6) | plugin-hostd `machine` domain | host, rule 1 | plugin-hostd, `machine` domain | plugin-hostd `machine.c`; plugin-db-qualification | `domain_words.h` is generated from the domain; the store's fixtures stay test data | the owner's contract package | S4, S8 | low: generated header |
| V8 | `PROBE_*` (4) | plugin-hostd `probe` domain | host, rule 1 | plugin-hostd, `probe` domain | plugin-hostd-protocol `protocol.h`; plugin-hostd probe; plugin-qualify probe-judge | protocol.h's enums are generated from the domain | the owner's contract package | S5, S8, S9 | protocol's numeric enums must keep their values |
| V9 | `SCAN_DOCUMENTS`, `SCAN_FIELD_SCOPES` | omx-clap-core `scan` domain | host, rule 1 | omx-clap-core, `scan` domain | plugin-hostd `describe.c`; plugin-qualify `native/describe.c` (13/14, by hand) | both include the rendered scan header | the owner's contract package | S8, S9 | plugin-qualify's 13/14 copy differs: the rendered header adds the missing scope |
| V10 | `PLUGIN_DB_ADDRESS_FORMATS` | plugin-db `plugin-db` domain | plugin, rule 1 | plugin-db, `plugin-db` domain | plugin-db `address.c`, `cli.c`, `collect.c` | none | the owner's contract package | none | low |
| V11 | `PLUGIN_DB_STATES`, `_REASONS`, `_SOURCES`, `_ISOLATION_HOSTS`, `_RUNS`, `_LATENCY`, `_RECORD*`, `_LAYERS`, `_FILES`, `_LAYOUT`, `_BUNDLE_RULES`, `_BAR` (14) | plugin-db `data/db.json` | plugin, and the store's own layout, rule 1 | plugin-db, `plugin-db` domain | plugin-db headers, `vocabulary.py`, `store.schema.json` | the data items join the domain; `vocabulary.py` and the schema are generated | the owner's contract package | SA, S3 | Python and C read the same names: both generated |
| V12 | `PLUGIN_DB_PIN_VERDICTS`, `_POOLS` | plugin-db `data/pin.json` | host (how a plugin is loaded), rule 1 | plugin-hostd, `qualification` domain (`QUALIFICATION_PIN_VERDICTS`, pools) | plugin-db `pin.h`, fuzz | plugin-db reads the installed domain; its copy is dropped | plugin-db's own | S3; drop SZ | pins written today keep their spelling |
| V13 | `PLUGIN_DB_PIN_KEYS`, `_CHANGES`, `_LAYOUT_FORMATS`, `_PIN_SHA256_HEX_LEN` | plugin-db `data/pin.json`, `constants.json` | the storer's own file format, rule 1 | plugin-db, `plugin-db` domain | plugin-db `pin.h`, fuzz | the data items join the domain | the owner's contract package | SA, S3 | low |
| V14 | `HOSTING_*_CODES` (16 dimensions), `HOSTING_IDLE_CODES`, `_WINDOW_CODES`, `HOSTED_STAGE_LIMITS` | omx-clap-core `data/hosting*.json` | host, rule 1 | omx-clap-core, `hosting` domain | plugin-qualify (generated); plugin-hostd-protocol (generated header); the console | `data/` becomes the domain (omx-clap-core#136, frozen); the generators read the domain | the owner's contract package | SA, S7; S5, S9, S11 | generated files must stay byte-identical |
| V15 | `HOST_REPLY_CODES` (28), `HOST_TRACK_KINDS`, `HOST_EVENTS`, `OMX_CLAP_CORE_SHARED_VERBS`, `OMX_CLAP_HOST_VERBS` | omx-clap-core `data/verbs.json` | host, rule 1 | omx-clap-core, `host` domain | plugin-hostd-protocol `reply-words.h`, its JSON, `vocabulary.mjs` | the data items become the domain; protocol generates from it | the owner's contract package | SA, S5 | the wire's codes keep their values |
| V16 | `PLUGIN_HOSTD_REPLY_CODES`, `_VERBS`, `_PROTOCOL_VERBS`, `_PROTOCOL_EXTENSIONS` | plugin-hostd-protocol `data/verbs.json` | wire, rule 1 | plugin-hostd-protocol, `protocol` domain | plugin-hostd; the clients | the data items become the domain | the owner's contract package | SA, S5, S8 | low |
| V17 | `PLUGIN_HOSTD_GROUPING_REASONS` (16), `_REASON_GROUPS` | plugin-hostd `data/grouping.json` | host, rule 1 | plugin-hostd, `grouping` domain | plugin-hostd-protocol clients (TypeScript, Python, by hand); plugin-hostd clients | the clients' block is generated; plugin-hostd's `clients/` removed (row 3) | the owner's contract package | SA, S5, S8 | two client copies today |
| V18 | `PLUGIN_HOSTD_HISTORY_KEYS` (15) | plugin-hostd `data/history.json` | host, rule 1 | plugin-hostd, `history` domain | plugin-qualify `history-file.ts` | read from the installed domain | the owner's contract package | SA, S9 | low |
| V19 | `PLUGIN_HOSTD_CLAP_MAP`, `_LV2_MAP` | plugin-hostd AND plugin-qualify `data/formats/` | host, rule 3 | plugin-hostd, `formats-map` domain | plugin-hostd; plugin-qualify (its own drifted copy) | plugin-qualify's `data/formats/*` dropped | plugin-qualify loses `data/formats` | SA, S9 | the two copies drifted: the diff decides which spelling survives |
| V20 | `CONTRACT_CODES` (57) | omx-contract `data/codes.json` | contract format, rule 5 | omx-contract, `contract` domain | `omx_contract_codes.h` and every reader | the data item becomes the domain | the owner's contract package | S0 | every reader; byte-identical render |
| V21 | `PARAM_SCALES` | omx-contract `data/primitives.json` | contract format (how a parameter's range is read), rule 5 | omx-contract, `contract` domain | everyone | the data item becomes the domain | the owner's contract package | S0 | low |
| V22 | `READOUT_RATE_HZ` | omx-contract `data/primitives.json` | display, rule 5 | omx-panel, `panel` domain | the panel, the console | omx-contract's copy dropped | the owner's contract package | SA, S6, S11; drop SZ | low |
| V23 | `OMX_PARAM_CONTRACT_UNITS` and the schema's `unit`, `descriptorUnit` and `meaning` enums | omx-contract `data/param-contract.json` + schema enums | split (row 30), rule 5 | per producer: omx-dsp computes-in, omx-panel display, a plugin's custom units in its descriptor, the format spellings with V27; merged by libomx-domain | omx-panel `vocabulary.mjs`; omx-plugins; the console `clap-param-units.ts`; the kernels | readers take the merged view; the schema enums reference it | omx-contract, omx-dsp, omx-panel contract packages; each plugin's descriptor | S0, SA, S2, S6, S10, S11; drop SZ | the widest: released `omx_param_units.h` and `omx_contract_limits.h` readers in kernels, panel, plugins, omx-clap-core; the merged reader lands first |
| V24 | `PLUGIN_FEATURE_AUDIO_EFFECT`, `_INSTRUMENT`, `_NOTE_EFFECT`, `_ANALYZER`, `_OTHER` | omx-contract `data/plugin-features.json` | plugin, rule 5 | plugin-db, `plugin-db` domain | catalogs, the panel | omx-contract's copy dropped | the owner's contract package | SA, S6, S11; drop SZ | catalog and panel readers |
| V25 | `STANDARD_SAMPLE_RATES`, `STANDARD_QUANTA`, `RT_HARD_TARGET`, `ORACLE_FLOOR_RATES`, `ORACLE_FULL_RATES` | omx-contract `data/rates.json` | DSP, rule 5 | omx-dsp, `dsp` domain | omx-dsp oracles; the console | omx-contract's copy dropped | the owner's contract package | SA, S2, S11; drop SZ | low |
| V26 | `CURVE_AXES`, `CURVE_KINDS` | omx-contract `data/curves.json` | DSP, rule 5 | omx-dsp, `dsp` domain | omx-dsp; omx-contract's schema, through libomx-domain | omx-contract's copy dropped | the owner's contract package | SA, S2; drop SZ | low |
| V27 | `CLAP_*_TERMS` (about 50), `LV2_*_TERMS` (about 24) | omx-contract `data/formats/` | plugin (the format spellings), rule 5 | plugin-db, `formats` domain | omx-clap-core, plugin-hostd, plugin-qualify (through `from`) | the `from` references point at plugin-db's domain; omx-contract's copy dropped | the owner's contract package | SA, S7, S8, S9; drop SZ | `from` references in three repositories |
| V28 | `RESOURCE_KINDS`, `_UNITS`, `_BASES`, `_HINTS` | omx-contract `data/resource-profile.json` | host, rule 5 | plugin-hostd, `resource` domain | plugin-db, plugin-qualify, the hosting code | omx-contract's copy dropped | the owner's contract package | SA, S3, S7, S9; drop SZ | plugin-db reads them in a stored schema |
| V29 | `VERB_HOSTS` | omx-contract `data/verbs.json` | host, rule 5 | plugin-hostd, `qualification` domain beside `QUALIFICATION_ADAPTER_HOSTS` | plugin-hostd-protocol | omx-contract's copy dropped | the owner's contract package | SA, S5; drop SZ | low |
| V30 | omx-dsp kernels (43 files) and primitives (15 files: `INSTRUMENT_FAMILIES`, biquad kinds and the rest) | omx-dsp `data/kernels`, `data/primitives` | DSP, rule 1 | omx-dsp, `dsp` domain | omx-dsp include and `ts/`; the console | the data items become the domain | the owner's contract package | SA, S2, S11 | 58 files; byte-identical render |
| V31 | `OMX_PLUGINS_ROLE_MEANINGS`, `OMX_PLUGIN_FACE_IDS` | omx-plugins `contract/` | plugin (the plugins' own declarations), rule 1 | omx-plugins, `plugins` domain | omx-panel (role meanings); omx-plugins faces | the data items become the domain | the owner's contract package | SA, S6, S10 | low |
| V32 | `OPENMIXER_CLOCK_REFERENCE_WHY`, `_DRIVER_RING_DISABLED_WHY`, `_RT_HOST_UNRESOLVED_WHY` | the console `words.json` (from hand TS) | the console's own, rule 1 | the console, a domain of its own | the console's server and web UI | `words.json` generated from the domain, not from hand TS (row 22) | the owner's contract package | S11 | low |

**Rows that are a reading, for the owner to rule on:**

- **V24 and V27:** plugin-db owns the plugin level (the lowest layer that defines a plugin).
- **V12:** the pin verdicts and pools are host level, so plugin-hostd's.
- **V21:** `PARAM_SCALES` is contract format.
- **V29:** `VERB_HOSTS` sits with plugin-hostd's adapter hosts.
