# Changelog

The releases are in `debian/changelog` and `packaging/omx-contract.spec`. `Unreleased` holds what the next release will carry; a release moves its lines under its own heading.

## Unreleased

- CHANGED: the package is 3.23.0 (#252): the changes since 3.22.0 are MINOR (#208), and the semver gate refuses
  3.22.0 -> 3.22.0 as a none bump. x-since stays 3.22.0 on what v3.22.0 shipped.
- ADDED: a descriptor control may state its filter's `response` (#208), a word of `PARAM_FILTER_RESPONSES`, a new
  words item of the `param` domain: `peaking`, `lowShelf`, `highShelf`, `highpass`, `lowpass`, `notch`, `bandpass`,
  `allpass1`, `allpass2`, the section kinds omx-dsp's EQ design builds, which reads their codes from this item (its
  BIQUAD_KINDS copy goes, omx-dsp#170). Optional; the schema's `$defs.filterResponse` is its
  render (tools/unit-enum.mjs). A consumer finds an EQ's edges by `highpass` and `lowpass` in any language, never by a
  name word. `examples/descriptors/authored-omx-eq8.json` states them on omx-eq8's HPF and LPF controls.
- FIXED: the GENERATED line of a ts module that a domain's root `x-render` frames (`render --target ts --package
  <owner> --with-domain`) names the domain's document, `contract.d/<domain>/<leaf>.json`, as the module's `@see` lines
  do; it named `data/<x-file>`, the path the rebuild writes, which exists nowhere (#218). The C target names no path in
  its GENERATED comment (the owner's `banner` words) and is unchanged. omx-clap re-renders its hosting codes module.
- CHANGED: a v<version> tag PROMOTES and never builds (#230). release.yml's tag path calls Open-Mixer/.github
  promote-staged.yml, which copies the signed files the staged build of that commit left under staging/ (rpm and deb)
  to the channel root and creates the GitHub release; the tag's commit must be on main. The build is the dispatch
  with staged on: the quick set by default, matrix: full for a promotion candidate (Open-Mixer/.github#274 lets a
  staged run build full). npm follows the promotion, never the bare tag: publish.yml runs when release completes and
  publishes only when its promote jobs all succeeded, from the tag's commit.
- FIXED: tools/kernel-recipe.mjs is installed 0755: the deb build's lintian refused it as script-not-executable
  (a #! file shipped 0644). Every #! file under tools/ is 100755 in git, and two tests hold both.
- FIXED: `semver <previous tag>` reads the released tree as it was released: an id spelling rule added since (a
  unit id is camelCase) is not held against it, so the bump check classifies a rename the wave makes on purpose
  (v3.21.0's dB-oct, now dBPerOct) instead of refusing the old file. Every other rule holds, and a tree being built
  or installed is still refused a non-camelCase unit id.
- REMOVED: the live-owners leg (#234). omx-contract reads no level above it: tools/live-owner-data.sh,
  tools/live-owner.ref and test/live-owners.test.mjs are gone, and so are their steps in ci.yml, release.yml and
  publish.yml. Each owner proves its own data against the omx-contract it installs (omx-dsp: make contract-dir,
  definitions-check, units-check; the "tool names no owner item" check moves up with omx-dsp#167).
  test/no-upward-read.test.mjs refuses an upward read.
- FIXED: `render --target c --package <owner>` names an owner's unit set by the PARAM_UNITS titles, as the whole read
  does: `dB` is `_DB`, never `_D_B` (#228). The owner's header holds its own items, which carry no PARAM_UNITS; the titles
  now come from the whole read.
- ADDED: the -devel (-dev) package installs the kernel recipe under `<datadir>/omx-contract/recipes/`, named by the
  .pc's `recipesdir`, and the CLI tree ships `tools/kernel-recipe.mjs`, which run from `<clidir>` reads that recipe
  (#227): a consumer's contract tools (omx-dsp's completeness proof) need no source checkout or git tag for it.
- CHANGED (development phase, every owner follows in the devel wave 2026-11-24): no hand-kept
  version floors. A data file's `requires` and a domain's `info.x-requires` are a list of package and domain names in
  ascending order, each once, no version (`["omx-clap"]`); a file that refers to nothing has none (absent, never `[]`).
  The `omx-contract-schema` entry is gone: every file is read by the installed schema. The map of floors is refused by
  name (`contract.file.invalid`, `contract.manifest.invalid` naming `x-requires`) by the build reader, the TypeScript
  runtime reader and the C loader alike, and so is an empty list. `contract.schema.too-old` and
  `contract.schema.floor-absent` are no longer raised (their codes stay so no later code moves); a consumer's own
  `needs` / `--needs` / `needs_version` floor is unchanged (callers pass none).
- CHANGED: an id of a C set that is a PARAM_UNITS const takes its PARAM_UNITS title in ANY set, a mixed one too
  (`dB` `_DB`, `dBFS` `_DBFS`, `dBu` `_DBU`; never `_D_B`), as #206 did for sets of units only.
- ADDED: a domain item carries its per-entry doc (each word's or code's `description`, never its `x-text`) and its
  `source` links (`x-source`, the classic `source` shape, `$defs/source` of the domain schema) into every read, the
  installed one included: `links` lists and `links --check` checks a domain's links (`--package <domain>`), `render
  --target md` prints them, and a malformed `x-source` is refused (#215). omx-clap's hosting codes can move into
  their domain with nothing lost.
- CHANGED (development phase, every installer follows): `install-contract-dir.sh --domain <dir> <contractdir> <package>`
  names the installing package, and a domain whose `info.x-owner` is another is refused (#88). plugin-db,
  plugin-hostd-protocol, omx-clap and omx-dsp name themselves in their install line when they take this release.
- ADDED: `domain check` holds a `stable` domain to an append-only ratchet of its own version: a removal or a shifted
  code needs the MAJOR, an addition at least a MINOR (#89). Experimental domains are checked as before.
- ADDED: a domain words item spells `units`, `bases`, `extension`, `figureUnit` and `basis` as `x-units`, `x-bases`,
  `x-extension`, `x-figure-unit` and `x-basis` (V28, #189), so the resource hints can move to plugin-hostd.
- ADDED: `render --target md`, one reference page per domain and per package, refusing an undocumented item, word or
  code (#202); `make docs-site` publishes them under `domains/`.
- ADDED: a shape may hold a map keyed by data (`additionalProperties` the value's schema, no `properties`), and a key
  that is no C identifier names its identifier in `x-name` (#75).
- CHANGED (MINOR, development phase): a descriptor control's `meaning`, its ROLE, is REQUIRED on every control
  (#61, ruling R1 of 2026-11-24: declare, don't infer). Its words are PARAM_MEANINGS, a words item of the `param`
  domain, and the schema's `$defs.meaning` is their render (`tools/unit-enum.mjs`); `bandwidth` (a band's width in
  octaves) is added beside `q`. A built or scanned control the plugin states no role for writes `unknown`.
- ADDED: nine PARAM_MEANINGS words for roles authored controls play and no word named (#221): `amount`, `number`,
  `balance`, `link`, `solo`, `order`, `acceleration`, `dispersion` and `window`, before `unknown`, which stays last
  (its code moves from 47 to 56; the domain is experimental). The schema's `$defs.meaning` has 57 words.
- FIXED: `translate --source` no longer skips a source key by its shape (omx-contract#48, #186): only a key starting
  with `_` is file metadata; any other key that is not a sentence `{ text, args }` (a bare string) refuses the file by
  name, so `--check` never counts fewer keys than the source holds and calls the catalogs whole.
- ADDED: a reply code may carry `leavesNoMark: true` (#185, ruled 2026-11-15): the refusal leaves no mark on the
  plugin; the package vocabulary header has `<CODE>_LEAVES_NO_MARK 1` for it.
- CHANGED: in a set whose ids are all PARAM_UNITS consts, each C enumerator is named from the id's PARAM_UNITS title
  (`OMX_METER_UNITS_DB`, `_DBFS`, `_DBTP`; was `_D_B`, `_D_BFS`, `_D_BTP`) (#206, ruling 2026-11-23). omx-dsp renames
  its uses in the release that takes this one.
- ADDED: `Law`, one named member per position law, in the Python (`omx_contract.scale.Law`, a `StrEnum`) and JS
  (`@openmixer/omx-contract/scale`) readers, made from `LAWS` / `POSITION_LAWS` (#46).
- CHANGED: the eight RESOURCE_UNITS words and the three RESOURCE_BASES words carry a `doc`, their sentence, so every define of `omx_vocabulary.h` is documented and `docs/doxygen-baseline.txt` is empty (omx-contract#156): every public declaration of the installed headers is documented, and the gate is red on the first that is not.
- CHANGED (Z1, omx-contract#161, ruling 2026-11-23): an override's `family` is an identifier (`^[a-z][A-Za-z0-9]*$`), no longer a copy of omx-panel's 13 PANEL_FAMILIES words; which families exist is checked by omx-panel's `describe`. The enum leaves `ownership/words.json` and `ownership/moving-out.txt`.
- CHANGED: a domain named like a package under `3/` (a directory holding `<name>/<name>.json`; one of nested domains only, as plugin-hostd's, is read as before) is read, never skipped (#125): its `info.x-owner` must be that package (`contract.manifest.mismatch`), and an item both declare is `contract.item.duplicate`. A floor on that name (#190) is held to the domain's `info.version` when the domain is installed alone (`--domain` only, as plugin-db and plugin-hostd-protocol install theirs; ruling %4 2026-11-23), and to the owner manifest's `version` when that manifest is installed beside it.
- ADDED (MINOR): a descriptor's own units, `units: [{ id, symbol, dimension, base, scale, text }]` (docs/units.md "Plugin particulars", docs/descriptors.md), and the code `contract.descriptor.unit-duplicate` (`descriptorUnitDuplicate`, value 59; the `contract` domain is 1.2.0; N1, omx-contract#162): a unit of its own whose id or symbol is that of a PARAM_UNITS unit (`dBu`, `%`), or of another of its own units, is refused by name, by validation and by the reader. A custom unit has no wire code; a control's `travel.unit` still names a standard unit.
- CHANGED (MINOR): `frames` is a `param` unit (omx-contract#164, docs/units.md): `$defs.unit` gains it after `dBPerS`, so a scalar item may be in frames and a descriptor's latency ref (`latency.frames`, `latency.sweep.min`, `.max`) can name a constant count of frames; `$defs.descriptorUnit`'s own list loses it (a descriptor still takes it through `$defs.unit`). Its PARAM_UNITS code does not move.
- CHANGED (MAJOR for a reader of the word): RESOURCE_UNITS spells nanoseconds per sample `nsPerSample`, the PARAM_UNITS id, not `ns-per-sample` (owner order 2026-11-24: a unit word has no `-` and no `/`; omx-contract#219). `OMX_RESOURCE_UNITS_NS_PER_SAMPLE` keeps its name and its value is the new word; the catalogs' key is `RESOURCE_UNITS.nsPerSample`. `test/unit-word-spelling.test.mjs` refuses a `-` or a `/` in any `*_UNITS` word of `data/`.
- CHANGED (MAJOR for a reader of the two words): a unit id is camelCase, `/` reads `Per` (coordinator and owner ruling 2026-11-23, docs/units.md): `dB-oct` is `dBPerOct` and `dB-s` is `dBPerS`, in PARAM_UNITS, PARAM_UNITS_CLAP_ENCODED, the schema, the catalogs and the renders (the C defines keep their names), no alias; `x-symbol` stays `dB/oct` and `dB/s`. The domain reader refuses a unit word (a word carrying `x-symbol`) whose id is not letters and digits from a letter, naming it.
- CHANGED (MAJOR for every reader of a unit word): the schema's `$defs.unit` and `$defs.descriptorUnit` enumerate the PARAM_UNITS ids, each word's const, not its `x-symbol` (C2, coordinator ruling 2026-11-23, plugin-hostd#215 D1/D2): `percent` for `%`, `none` for `""`, `dBPerOct` for `dB/oct`, `dBPerS` for `dB/s`, `nsPerSample` for `ns/sample`, `plainCount` for `count`; the other 32 ids are spelled as their symbols already. The id is the word a descriptor, an item and a reply carry; `x-symbol` is the display rendering only. No alias and no window in which both validate: an owner whose data states a symbol fails `validate` naming it, and moves to the id. `tools/unit-enum.mjs` renders the ids; data/rates.json, the example descriptors, the ownership word lists and the tests' fixtures state ids.
- ADDED: the domain kind for a mapping table, `x-kind` `map` (omx-contract#191, owner ruling 2026-11-23, decision 1 of plugin-hostd#215): `x-format` and a `oneOf` of one row per source field, `const` and `title` the field, `x-code` its place, `description` its doc, exactly one outcome (`x-word` with its transform and its lookup sub-table `values`, `x-extension`, or `x-dropped` with its ruling) and exactly one cover (`x-term`, the term link `<TERMS item>#<term>`, or `x-from`). `render --with-domain` rebuilds it as the data form's `formatMap` item: plugin-hostd 58b7145's `PLUGIN_HOSTD_CLAP_MAP` (373 rows) and `PLUGIN_HOSTD_LV2_MAP` (458 rows), written as map items, rebuild `formats/<f>.json` byte for byte plugin-hostd fac7531's data/formats files less their `$schema` and `requires` lines (test/domain-map.test.mjs). The reader and the domain schema refuse by row a row with no outcome or two, a dropped row without a ruling and a row covering nothing or twice; `validate` refuses a dangling term link (rule `map-term`). The runtime readers serve it as words, the source keys (conformance case valid-map). A unit's lookup value is a PARAM_UNITS id spelled as its standard symbol, and a unit with no standard id is a dropped row with its ruling (decision 2), as the docs and the schema state; validate does not check the lookup values against PARAM_UNITS.
- REMOVED: `data/panel.json` and the six PANEL_* items (PANEL_FAMILIES, PANEL_STANDARD_WIDGETS, PANEL_WIDGETS, PANEL_DISPLAY_KINDS, PANEL_DISPLAY_SOURCES, PANEL_PLACEMENTS) with their `ownership/words.json`, `moving-out.txt` and catalog entries: omx-panel 0.16.0 owns them as its `panel` domain (sorting pass V1, the old-holder step SZ; the stage wave f45l stopped at `contract.item.duplicate` over them).
- REMOVED: VERB_HOSTS and `data/verbs.json` (sorting pass V29). The hosts a verb's `implementedBy` names are omx-clap's hosting words, `HOSTING_VERB_HOSTS` of its `data/hosting/verb-hosts.json`, installed as `3/omx-clap/hosting/verb-hosts.json`, with the words plugin-hostd, omx-clap-host and mod-host unchanged. The verbs validator (`contract.verb.host-unknown`, `validate` rule verb-host) and the verbs render read the host list from the read only: a read that declares verbs and no `HOSTING_VERB_HOSTS` is refused by name, with no fallback to a list of omx-contract's. `omx_host_verbs.h` is byte for byte as before but for its comment naming the item. omx-contract's tests read a fixture of omx-clap's file, never omx-clap. The VERB_HOSTS words leave omx_vocabulary.h, the ts module (VERB_HOSTS, VERB_HOSTS_WORDS), the json render, the catalogs and the ownership lists.
- REMOVED: OMX_PARAM_CONTRACT_UNITS, the unit codes of org.openmixer.param-contract/1 (V23d, coordinator ruling B1 2026-11-22): `data/param-contract.json` and its header `omxcontract/omx_param_units.h` leave in one step, in the chain-3 omx-contract layer, and the sheet is omx-clap's (omx-clap-core#171), whose `omx_param_units.h` carries the same `OMX_CLAP_UNIT_*` defines and `OMX_PARAM_UNITS(X)`. No window in which both serve it, no rename, no alias; the render's `contract.item.duplicate` refusal stays. `omx_contract_limits.h` loses its `OMX_PARAM_CONTRACT_UNITS_*` defines, the json and ts renders the item, the ownership lists their entries, and `ownership/grow-exceptions.txt` its one entry (GROW_RULED is empty). A consumer that includes `omxcontract/omx_param_units.h` fails to build, naming it. MINOR in the development phase. Tree version 3.22.0, the version chain 3 tags this layer.
- ADDED: PARAM_UNITS_CLAP_ENCODED, a words item of the `param` domain (V23d, B2; the shape ruled by the coordinator 2026-11-22: an existing words item, a move changes no format): the standard unit ids the CLAP extension encodes, each word a copy of its PARAM_UNITS word taken by `x-from`, keeping its `x-code`. omx-panel reads it to know whether a unit can be served, omx-clap's map check holds its mapping onto it. `tools/clap-encoded.mjs` derives it from the CLAP sheet's token-to-id map, and refuses by name an id that is no PARAM_UNITS const and a served set that is no prefix of PARAM_UNITS.
- ADDED: a sheet of strings (`$defs.sheetValue`: every field a non-empty string, none nested) in the data form and as a domain sheet with its own `x-file`, and a header's `strings` section `{ comment, prefix, table }` (docs/render.md): the X-macro `<table>(X)`, one `X(<prefix><FIELD>, "<field>", "<value>")` per field, the first argument the define a sibling header's `numbers` section renders (constCase, `dbPerOct` is `DB_PER_OCT`). It refuses by name a field the sibling sheet does not name, a value that is no PARAM_UNITS const, and a read without the sibling or PARAM_UNITS. A golden over a fixture package (test/golden/strings), not an owner's data: omx-clap renders its own `omx_param_unit_ids.h` with it.
- CHANGED (MINOR, development phase): PARAM_UNITS has one plain multiplier, `coef` (omx-contract#167, coordinator ruling 2026-11-21). `x` is removed, with no alias and no fallback, and the words after it shift down by one: a PARAM_UNITS code is the word's position in the list, not a wire number (the wire codes are OMX_PARAM_CONTRACT_UNITS', unchanged), and no reader takes the number. `coef` takes the scope `x` had, `param`: `$defs.unit` is `x` removed and `coef` appended, `$defs.descriptorUnit`'s own list loses `coef` (a descriptor still takes it through `$defs.unit`). `OMX_PARAM_UNITS_X` and `PARAM_UNITS.x` go from omx_vocabulary.h, the json and ts renders and the six catalogs; `OMX_PARAM_UNITS_COUNT` is 38. A reader that stated `x` states `coef`.
- CHANGED: `omx-contract domain check` accepts a code shift in a words item WITHOUT `x-c-codes` (omx-contract#167): a word removed or inserted shifts the codes after it, and the check prints one line per shifted word, naming that the item has no `x-c-codes`, before its PASS line. In an item with `x-c-codes`, in either document, a moved code stays refused and the refusal names `x-c-codes`; a reorder stays refused in every item, and every other refusal (a word or item added or removed at the same version, a version going down) is unchanged. `domainCheckReport` returns the problems and the shifts; `domainCheck` still returns the problems.
- ADDED: a set may carry `standard`, the PARAM_UNITS const (any group) each id stands for, one per id in id order (coordinator ruling 2026-11-21, for omx-dsp's CURVE_UNITS: the curve words stay omx-dsp's, the standard id of each is its data). A wrong count and an unknown const are refused by name (`set-standard`); json carries `standard`, ts `<SET>_STANDARD`, C `OMX_<SET>_STANDARD[OMX_<SET>_COUNT]` by enumerator.
- FIXED: `render --with-domain` names a nested domain by its path after the last `contract.d/`, as `install-contract-dir.sh --domain` does; it took the directory's basename and refused the domain's `$id` (`plugin-hostd/grouping`).
- FIXED: a domain item's provenance in a render (a header's `/* ITEM (<path>) */`, a ts `@see`, a verb's banner) names its domain's document, `contract.d/<domain>/<leaf>.json`; it named `data/<x-file>`, the path a rebuild writes it to, which exists nowhere (`(data/omx-clap.json)`), or `param/param.json`. A data item keeps its `data/<file>`. omx-contract's own renders are re-rendered; omx-clap (clap#163) and plugin-hostd-protocol (protocol#134) re-render theirs in the chain.
- ADDED: a words item's word carries `x-uri` (format ruling 2026-11-20, for plugin-db#66): the absolute URI a format spells the word as, of any scheme (`urn:openmixer:unit#dBoct`, an http LV2 URI), the data word's `uri`; a value that is no absolute URI is refused, naming the word. Conformance cases valid-word-uri and word-uri-not-a-uri.
- ADDED: the domain format carries verbs, reply codes and terms (sorting pass S0, ruled 2026-11-20, for V15/V16 and V27a/b): a words item of `x-kind` `verbs` rebuilds the data form's verbs (`x-format`, `x-reply`, `x-codes`, `x-implemented-by`, `x-since`); a code's `x-resp` and `x-transient` its `resp` and `transient`; an item of `x-kind` `terms` (`x-format`, `x-spec`, `x-version`, one word per term with its `x-term`) the data form's terms item. The runtime readers serve both as words (the verbs, the term keys); the conformance suite holds the C loader and openDomainAt to it.
- ADDED: the domain format reads a set and a unit list (sorting pass S0, for V21 and V23a+b): a words item of `x-kind` `set` names its default with `x-default` (one of its words) and rebuilds the data form's set (`ids`, `default`); a word's `x-symbol` and `x-dimension` (a word of the item its item's `x-dimensions` names) rebuild its `symbol` and `dimension`. The reader refuses each by name when it names no word.
- ADDED: a plugin descriptor's `latency` gains `sweep: { min, max }` (omx-contract#155), the range the lag of a modulated delay (a rotary speaker) lies in, which has no single latency: a host checks a measured lag against it, and the reported latency is the sweep's shortest read. Each end is a non-negative integer of frames or a `{ ref }` to a scalar item in `frames` or `ms`; an ms value is read at the running rate, rounded to the nearest frame, and the unit of a latency ref, for `sweep` and for `frames`, is honoured. A new code, `contract.descriptor.latency` (`descriptorLatency`, value 58; the `contract` domain is 1.1.0), refuses by name a sweep with `min` above `max` (both integers, or both refs to scalars in one unit), a sweep whose ends are in two units (an integer is frames) and a latency ref to an item that is no scalar in frames or ms. An absent sweep is a plugin that declares none.
- ADDED: a word whose `x-from` names a word of a words item is that word (`word-from-differs`, format ruling 2026-11-20): its `const`, `x-code`, `description` and `x-text` are exact copies of the target's, required and never inherited (owner ruling (b)): a copy that differs, or is missing where the target carries the field, is refused by name. `validate` refuses a word that differs by item, word and field (rule `word-from-differs`, on the data form's `word`, place, `doc` and `text.en` too), and so does the read of a contract directory wherever the target is in the read (`contract.file.invalid`, naming `word-from-differs`). A term target is unchanged. The runtime readers serve the word's own copies, so they agree with a render with no reader change.
- ADDED: one owner's several domains and a domain-only owner (sorting pass S0, for V15 and V16): `render --with-domain` repeats, a domain may refer to the items of a domain its `info.x-requires` names, `install-contract-dir.sh --owner <package> <version> <schema major> <contractdir> <domain>...` installs a package of domains only (manifest `"files": {}` and `"domains"`), and the render builds an owner that is not installed from its domains.

- CHANGED: the CLAP core's packages are named omx-clap (omx-clap-contract, omx-clap-devel, libomx-clap-dev, pkg-config `omx-clap`, `share/omx-clap`, `contract.d/3/omx-clap`, `omx_clap_vocabulary.h`, `omx_clap_host_verbs.h`) in the docs, the tools and the tests; no old spelling is kept. The repository keeps its name.
- REMOVED: the CLAP terms (V27b): `data/formats/clap` (the 58 `CLAP_*_TERMS`) is omx-clap's `clap` domain (clap#163), and the CLAP entries of the RESOURCE_KINDS and RESOURCE_UNITS words' `from` go with it: the term-to-resource mapping moves to plugin-db's lv2 domain (plugin-db#66) and omx-clap's clap domain (clap#163). With no format term left, their renders go: `omx_formats.h` (OMX_CLAP_* ids and numbers, OMX_CLAP_IDS(X), OMX_LV2_NS_*/OMX_LV2_SPEC_*), `omx_contract.py` and the `omx_contract.clap` Python submodule, and the ts module's CLAP_IDS, CLAP_NUMBERS, LV2_SPECIFICATIONS and LV2_NAMESPACES; `render --target py` renders the shapes only. The format inventories and coverage checks go to the terms' owners: `inventory/lv2.json` and the LV2 coverage to plugin-db (plugin-db#66), `inventory/clap.json`, `tools/format-inventory.mjs` and the CLAP coverage to omx-clap (clap#163); `tools/data-layout.mjs` refuses a format terms file in data/.
- REMOVED: the LV2 terms (V27a): `data/formats/lv2` (the 24 `LV2_*_TERMS`) is plugin-db's `lv2` domain, and the LV2 entries of the RESOURCE_KINDS and RESOURCE_UNITS words' `from` go with it (the term-to-resource mapping is plugin-db's, at the format level). omx_formats.h, omx_contract.py and the json and ts renders no longer carry the LV2 namespaces; `make layout` holds the CLAP terms to the inventory, and the LV2 inventory only to a tree that maps LV2.
- REMOVED: the items the sorting pass moves out (their new homes hold them): READOUT_RATE_HZ (V22, omx-dsp's `data/primitives/readout.json`) with `data/primitives.json`; RT_HARD_TARGET, ORACLE_FLOOR_RATES and ORACLE_FULL_RATES (V25, omx-dsp; STANDARD_SAMPLE_RATES and STANDARD_QUANTA stay); CURVE_AXES and CURVE_KINDS (V26, omx-dsp) with `data/curves.json` and docs/curves.md; the five PLUGIN_FEATURE_* items (V24, plugin-db's `plugin-feature` domain) with `data/plugin-features.json`. Their renders, catalog entries and ownership lines go with them.
- CHANGED: PARAM_SCALES and PARAM_UNITS are items of the `param` domain (`contract.d/param/param.json`, sorting pass V21, V23a+b); PARAM_UNITS grows to the units of docs/units.md, each with its dimension (PARAM_UNIT_DIMENSIONS) and scope (PARAM_UNIT_SCOPES), and `$defs.descriptorUnit` is rendered from its descriptor units.
- CHANGED: CONTRACT_CODES is an item of the `contract` domain (`contract.d/contract/contract.json`, sorting pass V20); `data/codes.json` is removed. The reader, the C header render and the checks read the domain, the domain is installed in the contract directory and shipped in the npm package and the command's tree. Every code, its value and its string are unchanged; the one changed line of `omx_contract_codes.h` is the comment naming its source.
- ADDED: a domain word's `x-from` may name a word of another domain's words item, not only a term of a terms item (format ruling (a), 2026-11-20): `{ "$ref": "<domain id>#/components/schemas/<ITEM>", "x-term": "<the target word's title>" }`, the classic `from` `<ITEM>#<title>`. The target domain is declared in `info.x-requires` with its floor, as for terms. The read of a contract directory now refuses, for every domain word (installed domains, and the words a `--with-domain` domain rebuilds), an `x-from` naming a package or domain other than omx-contract, the domain, its owner and the declared ones (`contract.ref.undeclared`); when the package or domain named is in the read it resolves the reference there, refusing by domain, item, word and reference an item that package does not declare or that is no words or terms item, and a missing term or title (`contract.ref.unresolved`). A reference into a package outside the read stays `validate`'s (`word-from`, which now accepts a words target), except that an item another package of the read declares is never taken for it (`contract.ref.undeclared`). A from renders nothing: headers are byte for byte as without it. The runtime readers do not read `x-from`; six conformance cases hold them to opening such a word and the build to each refusal.
- ADDED: the domain format stores a word's args and rebuilds words and scalar items (sorting pass S0). A word whose `x-text` names placeholders carries `x-args`, their ordered names, stored and never derived; the reader refuses by item and word an `x-args` that is not exactly those placeholders, a missing one and one with no `x-text`, and the domain read carries them as the word's `args` (`word-text-arg`, `catalog-placeholders`). `render --with-domain` rebuilds `x-kind` `words` items (keyed by `title`, with `groups`, `group`, `from`, `doc`, `text`, `args`) and `scalar` items (`x-unit`, `x-value`) into today's data shapes byte for byte, codes items with `args`, and every item's `x-why` as `why`. The domain schema gains `x-args` and `$defs/scalar`. A domain document whose words name no placeholder needs no `x-args`; one whose `x-text` names one is now refused without it.
- FIXED: `omx_vocabulary.h` spells the `PARAM_UNITS` words item's X-macro `OMX_PARAM_UNITS_WORDS(X)`; it defined `OMX_PARAM_UNITS(X)`, the name of the released `omx_param_units.h` table, and the two headers together did not compile under `-Werror` (omx-contract#151). Tree version 3.21.0.
- ADDED: a domain renders as its data form did (omx-contract#139): `render --target c|ts --package <pkg> --data data --with-domain <dir>` rebuilds the data files the domain came from (each item's `x-file`; `x-kind` codes or sheet, `x-source`, `x-name`, `x-value`, `x-docs`; the root's `x-render` and `x-file`) beside the files still in `data/`, and renders them unchanged, byte for byte. A path in both is refused. The domain schema and the reader accept these words; a domain without them renders as before.
- ADDED: the runtime readers serve a domain's scalar items and check `x-args` (sorting pass S0): libomx-domain gains `omx_domain_scalar(d, item, &info)` (`omx_domain_scalar_info`: `value`, `is_bool`, `unit`; one more exported symbol, the SONAME stays `libomx-domain.so.0`) and the TypeScript `Domain.scalar(item)`; both refuse by name a scalar with no number, true or false `x-value` or no string `x-unit`, and a word whose `x-args` disagree with its `x-text`. A sheet is still not served. Seven conformance cases hold the two readers to each other.
- ADDED: `render --installed --with-domain <dir>` (and `--contract-dir`): the domain's rebuilt data files join the installed package its `info.x-owner` names and render with its files, byte for byte as installed data; an owner not installed and a file both installed and rebuilt are refused by name.
- ADDED: a domain declares the packages its words take terms from in `info.x-requires`, `{ "<package>": ">= x.y.z" }` (sorting pass S0). Every data file `render --with-domain` rebuilds from it carries them in `requires`, after the schema floor, in name order; a domain without the slot rebuilds as before. A rebuilt word whose `x-from` reaches a package beyond those, omx-contract, the domain and its `info.x-owner` is refused by item, word and package. The read of a contract directory holds each declared package to its floor (`contract.package.absent`, `contract.package.too-old`), for an installed domain and a rebuilt one, and resolves a rebuilt word's term in the package its `x-from` names (`contract.ref.undeclared` when another package holds it). The build reader, the TypeScript runtime reader and the C loader refuse a slot that is not a map of package or domain name to a floor `>= x.y.z` (`contract.manifest.invalid`, naming `x-requires`); the domain schema gains it, and six conformance cases hold the readers to each other. A domain's package depends on the declared packages at their floors: the owner's packaging test holds that.
- CHANGED: an item of a domain with no `x-file` is read at run time only: `render --with-domain` no longer refuses it and does not rebuild it. A scalar's `x-file` is optional.
- ADDED: libomx-domain answers a word's group, `omx_domain_word_group(d, item, word)`: the `x-group` of its `oneOf` entry, NULL for a word with none or an unknown item or word. `omx_domain_word_info` is unchanged and the SONAME stays `libomx-domain.so.0`; the ABI gains this one symbol (behaviour-core decision 4).
## 3.20.2

- FIXED: the `omx-contract` command run through a symlink (npx, `npm run`, `node_modules/.bin/omx-contract`) runs the command; it exited 0 and did nothing, so a gate calling it that way passed on a refusal. The CLI and the tools decide "run, not imported" on real paths.
- ADDED: `@openmixer/omx-contract/entry` exports `isMain(import.meta.url)`, that check, for other packages' command-line entry points.
- ADDED: `omx-contract.pc` names the installed command's directory, `pkg-config --variable=clidir omx-contract`; a package with no npm dependency on omx-contract imports `<clidir>/lib/entry.mjs` from there. The `.pc` ships in `omx-contract-devel` (`libomx-contract-dev`), `entry.mjs` in `omx-contract`: such a package build-depends on `omx-contract` itself.

## 3.20.1

- ADDED: `omx-contract domain check <new.json> <committed.json>` refuses by domain, item and word a word or item added or removed while `info.version` is unchanged, a word whose `x-code` moved at any version, and an `info.version` going down; and `omx-contract validate` refuses a domain item with no `x-since`, one that is not MAJOR.MINOR.PATCH, or one above the document's `info.version`, so owners delete their copies of both checks (omx-contract#124, for 3.20.1).
- CHANGED: the C loader and the TS reader (`openDomainAt`) give one verdict per case of one conformance suite, run in CI with the C runner required; the C loader refuses a catalog whose `lang` is not its file's name, and reports a domain with no x.y.z `info.version` or no `info.x-owner` as MANIFEST_INVALID (#121, #126).
- CHANGED: the TypeScript build dependency is a floor only (`>= 4.8.4`), with no ceiling (#122).

## 3.20.0

- FIXED: the C loader (`omx_domain_open`) accepts a word with no `description`, as docs/contract-dir.md, the TS reader and the schema do; `omx_domain_word_info.description` is NULL for it, and `omx-domain` prints an empty description. A present non-string `description` is still refused as FILE_INVALID.
- REMOVED: `MEASUREMENT_*` (data/measurement.json), `RESOURCE_MEMORY_PHASES`, `RESOURCE_UNMEASURED_REASONS`, `RESOURCE_BUDGET_SCOPES`, `RESOURCE_HOST_ISOLATIONS`, `RESOURCE_HOST_LATENCY_HANDLING`, `RESOURCE_THREAD_SCHEDULING` and `MACHINE_CLASSES`, with their translations. They are plugin-qualify's `qualification` domain (`contract.d/qualification/` there, `qualification_vocabulary.h`, the same `OMX_*` macros byte for byte). `RESOURCE_KINDS`, `RESOURCE_UNITS` and `RESOURCE_BASES` stay with `RESOURCE_HINTS` until they move to omx-clap-core (omx-contract#81, move 2 and 6).
- REMOVED: `MACHINE_CLASS_FIELDS`, `MACHINE_PROFILE_FIELDS`, `MACHINE_CORE_BANDS`, `MACHINE_CLOCK_BANDS` and `MACHINE_ARCHES` (data/machine-class.json) with their translations. They are plugin-hostd's `machine` domain (`contract.d/machine/` there, `machine_vocabulary.h`, the same `OMX_MACHINE_*` macros byte for byte); the json schema fragment no longer carries them, a reader reads the domain document (omx-contract#81, move 3).
- REMOVED: `SCAN_DOCUMENTS` and `SCAN_FIELD_SCOPES` (data/scan.json); their translations travel with the domain. They are omx-clap-core's `scan`
  domain (`contract.d/scan/scan.json` there, `scan_vocabulary.h`, the same `OMX_SCAN_*` macros byte for byte); a reader that
  took them from `omxcontract/omx_vocabulary.h` includes omx-clap-core's header instead (omx-contract#81, move 1).
- A domain's words may carry `x-group` (with the item's `x-groups`, a words schema of the same document), `x-from` (`$ref` by a domain `$id` + `x-term`), and a domain directory holds `catalogs/<lang>.json`, read by `validate` with the owner taken from `info.x-owner` (docs/contract-dir.md, omx-contract#81).
- libomx-domain0 carries a version floor: debian/libomx-domain0.symbols gives each export the release that introduced it, so a package linking the library depends on `libomx-domain0 (>= floor)`; the build fails on an export the file does not list. `make check-abi` counts exported global variables as well as functions.
- A descriptor may declare `choiceUnits` (omx-contract#51, omx-panel#68): per choice control, the unit of its values,
  one of the descriptor units and never `unknown`. The producer declares it once; omx-panel's MOD GUI generator and the
  console read it here and drop their local maps. A new optional field: additive, a minor.

## 3.19.1 and earlier

- The contract directory reads a DOMAIN: `<contractdir>/<domain>/<domain>.json`, one JSON Schema 2020-12 document with `$id`,
  `info{title,version,x-owner}` and `components.schemas`, a words item a `oneOf` of `const` words (docs/contract-dir.md,
  "Domains"). The domain's owner is metadata, its version its own; `render --package <domain>` renders `<domain>_vocabulary.h`
  byte for byte as the old layout renders the same words. The panel words (data/panel.json) are MOVING to omx-panel's
  `panel` domain and leave omx-contract in its next release.
- Every words item renders one X-macro in the C vocabulary, `OMX_<ITEM>(X)` with `X(<code>u, "<word>", <NAME>)` per word,
  the code being its place in the declared order: a consumer builds its tables from the item instead of restating it
  (omx-clap-core's panel families, widgets and display kinds, Open-Mixer/omx-clap-core#104). Its name is held unique with
  every other C name.
- `PANEL_DISPLAY_KINDS` (data/panel.json): the displays a panel description serves, `gain_reduction_bar`,
  `transfer_curve`, `eq_response`, `meter` and `time_response` (omx-panel's, code 4), in the order of their codes; declared here, no longer restated by hand in
  omx-clap-core. The six catalogs carry their sentences as drafts.
- `PANEL_DISPLAY_SOURCES` (`family`, `meters`, `gain_adjustment`, `curve`) and `PANEL_PLACEMENTS` (`insert`, `return`,
  `bus`, `master`) (data/panel.json): where a panel description's display takes its data and where an instance sits, in the
  order of their codes; declared here beside the families, widgets and display kinds, no longer restated by hand in
  omx-clap-core and omx-plugins. The six catalogs carry their sentences as drafts.
- Shapes (`docs/shapes.md`, the typed-contracts spec `docs/typed-contracts-shared-behaviour.md`
  §3, lane S1): a document's shape is one JSON Schema 2020-12 file under `shapes/`, rendered by
  `render --target ts|py|c --shapes` to a TypeScript interface (json-schema-to-typescript, pinned), a Python `TypedDict`
  (datamodel-code-generator, pinned in `tools/shapes-requirements.txt`) and the C keys and words as X-macros, every
  render committed and held by `--check`; a shape that breaks a rule is refused by name. The first shape is
  `shapes/travel.schema.json`, the travel the scale law reads: `@openmixer/omx-contract/shapes/travel` (types),
  `omx_contract.shapes.travel` (python3-omx-contract), `omxcontract/omx_travel_shape.h` (the -devel package), and the
  schema installed under `share/omx-contract/shapes/`. Additive: a minor.
- A scanned CLAP parameter's kind is read by one rule, stated in `docs/descriptors.md` and held by
  `share/omx-contract/clap-kind-vectors.json`: the merged scale word (the contract entry's, else the stepped flag), an
  enumeration a choice, a stepped 0..1 with step 1 a toggle (default on at 0.5 and above), everything else a travel.
  plugin-hostd's describe and the console's catalog are held to the vectors, keeping no rule of their own.
- The `utility` panel family (`PANEL_FAMILIES`, appended after `pitch`): the panel family of a trim, a width control, a
  balancer or a clipper, the plugins omx-plugins declares as family `none` for want of a word. Additive; the words and their
  order are the contract, and omx-panel's role table gives the family its roles. The six catalogs carry its sentence.
- A catalog entry may be `by: same` (schema 3.19.0): the sentence is the source sentence itself, with its source hash;
  readers keep it and `translate` never regenerates it. The Catalan catalog's plain entries carry their `by` form.
- `python3-omx-contract` (#28), one package on RPM and DEB from the same source: `omx_contract` in site-packages /
  dist-packages with `catalog`, `scale` and `clap` as submodules, each the `share/omx-contract` reader byte for byte,
  so a program writes `import omx_contract.catalog` instead of loading a file by its path (`make install-python`).
  The `/usr/share/omx-contract/*.py` files stay installed for this release and go in the next. CI imports it from a
  clean Fedora 44, bookworm and trixie container. A new package, a minor.
- npm: `./catalog` names its types (`lib/catalog.d.mts`) and `./contract-dir` exports `loadContractDir`.
- The schemas are identified on the project's own domain (ruling D21): every `$id` and `$schema` this package
  writes or ships is `https://openmixer.org/schema/omx-contract/<ref>/<file>`, the frozen history included, and the
  reader builds that URL. A contract file that names the code host's address, under either organisation, is still
  read, so a package installed before this loads until it is released again. A declaration's `issue` may name
  FreeMixer or Open-Mixer: the old organisation's records keep their numbers there. The site serving the path is
  Open-Mixer/openmixer-www#24.
- The organisation's name: addresses that named FreeMixer name Open-Mixer, and the name in prose is OpenMixer; the
  C renders' banner follows the renderer.
- A reply code may declare itself transient (`transient: true`, schema 3.18.0, plugin-hostd-protocol#23, rulings D22
  and D23): an identical request may succeed later with no change by the caller. A reply code only; the package
  vocabulary header has `<CODE>_TRANSIENT 1` for it and the TS render the property, so a client asks the property and
  keeps no list of codes. Additive, default false. Schema 3.16.0 is frozen in schema/history.
- `share/omx-contract/omx_contract_scale.py`, the Python twin of the position-law reader
  (`@openmixer/omx-contract/scale`, omx-contract#20), so a Python surface such as Zynthian
  (`zyngine/zynthian_position_law.py`) can call it instead of restating the law: `LAWS`, `effective_law(travel)`,
  `scale_position(travel, value)` and `scale_value(travel, p)`, every law the contract declares (linear, log,
  stepped, map), held to the same `data/scale-vectors.json` as the TypeScript reader and to the TypeScript reader itself on a grid
  over every travel (a test is red when the two split). Installed beside
  `omx_contract.py` and `omx_contract_catalog.py` (`debian/omx-contract-data.install`, `packaging/omx-contract.spec`).
- `omx-contract translate --source <file>` (#24): an owner's source sentences from a file of key -> `{ text, args }`,
  for strings that are no contract data (a surface's own); the gate, the provenance, the paid-fallback guard and
  `--check` are the same.
- The installed command reads `languages.json` where omx-contract-data installs it (`<prefix>/share/omx-contract`),
  not in its own tree, so `omx-contract translate --check` works on an installed host; `OMX_CONTRACT_DATADIR` names
  another place. Both package arms of CI run the installed command's `translate --check`.
- Language packs (#21): a catalog entry is the sentence, a person's `{text, by: human}` or a model's `{text, by:
  machine, model, source}`, `source` the sha256 of the source sentence it was made from; both readers skip a stale one
  (`sourceHash`, `isStale`; `source_hash` in Python). `share/omx-contract/languages.json` lists the shipped languages
  (ca, es, fr, de, it, pt) and a test pair (ja, ar). `omx-contract translate` makes and keeps a language's catalog
  through an OpenAI-compatible endpoint behind the placeholder gate, refusing a model a router may answer through a
  paid provider unless `OMX_TRANSLATE_ALLOW_PAID=1`, and `--check` is the release gate. Each language
  is its own package (`omx-contract-langpack-<lang>`, `omx-contract-l10n-<lang>`). Schema 3.15.0 is frozen in
  schema/history. Schema 3.16.0, a minor.
- The `ca` migration ends (#2): every owner ships its Catalan sentences in its catalog, so a code's or a word's `text`
  carrying `ca` is refused by `validate` and by the contract-directory reader (`code-text-language`,
  `word-text-language`: a sentence carries `en` alone). The `catalog-migration` warning is gone. The schema's shape keeps
  the `ca` property, described as refused, until a major release removes it. Schema 3.14.0 is frozen in
  schema/history. Schema 3.15.0, a patch.
- The catalog reader (`@openmixer/omx-contract/catalog`) loads only what a surface's lookup needs: the schema check,
  the placeholder reader (`placeholders`, its own module now) and the JSON shape, never the validator; it builds with no
  implicit any (`tsconfig.strict.json`, part of `npm run build`).
- The fourteen library modules are TypeScript (#15): their sources are `src/lib/*.mts`, built by `tsc` into `lib/*.mjs`
  with their declarations generated beside them; the hand-written `scale.d.mts` and `descriptor.d.mts` are gone, so a
  changed shape can no longer ship with a stale type. Every module stays where it was loaded from: the subpath exports,
  the installed `<prefix>/lib/omx-contract/lib/*.mjs` and a checkout's `lib/` (built by `npm ci`'s `prepare`, or
  `make build-lib`). Building needs TypeScript >= 4.8.4 and < 7; the
  package builds take node's and ajv's types from vendored tarballs (`vendor/build/`, build-only).
- A descriptor may state `integrity`: `version`, the plugin's own, and `commit`, the full commit its release tag names,
  stamped at build (omx-plugins#32). A host that links a plugin table matches the descriptor to the build it links by
  the commit, as it matches the RT verdicts. `contract.descriptor.integrity` refuses a version other than
  `plugin.version`. A reader before 3.14.0 refuses the whole contract directory on the unknown key, so a descriptor
  carrying it states `omx-contract-schema >= 3.14.0`.
- `share/omx-contract/omx_contract_catalog.py`, a small hand-written Python catalog reader (omx-contract#2), so a
  Python surface such as Zynthian can look a code or word up for the user's locale: `load_catalog(owner, lang)`,
  `sentence_of(catalog, key, source)` and `fill(sentence, args)`, the same shape as `@openmixer/omx-contract/catalog`.
  Installed beside the generated `omx_contract.py` (`debian/omx-contract-data.install`, `packaging/omx-contract.spec`);
  `render --target json|lv2|py --check` names it as the one hand-written file share/omx-contract/ holds beside the
  renders, as `omx_json_write.h` already is for `include/omxcontract/`.
- `MEASUREMENT_UNMEASURED_REASONS` gains `needsContent` (`needs-content`, group `nothing-to-measure`,
  omx-contract#2): an instrument silent under notes until a sample, a sound font or an instrument file is loaded,
  which the prober did not load, the instrument counterpart of `needs-impulse-response` and `needs-carrier`
  (plugin-qualify#21, #23).
- Every word `data/` declares now carries its English source sentence, `text.en` (omx-contract#2): the 262 words left
  without one since 3.12.0 gain it, each written from the item's and the word's own `doc`. A completeness test
  (`catalog.test.mjs`) holds every code and word of this repo to a source sentence; a word elsewhere in the
  vocabulary, declared by another owner, is unaffected and may still have none.
- A `codes` item's code may be a console code as the console spells it (owner openmixer): a refusal code in UPPER_SNAKE
  (`BAD_TYPE`) or a message code in dotted kebab (`rt.budget`) outside the hosting, contract, reply and panel families
  (docs/data-layout.md). Schema 3.13.0 is frozen in schema/history. Schema 3.14.0, a minor.
- `OMX_PLUGIN_FACE_IDS` (`data/plugin-face.json`, `omxcontract/omx_plugin_face_ids.h`) leaves omx-contract: the ids a
  plugin face gives its own controls are omx-plugins', who installs the item as `contract.d/3/omx-plugins/plugin-face.json`
  from 0.19.3 and renders the header itself, values unchanged. One owner per item: the contract-directory reader refuses
  an item two packages declare, so omx-contract-data conflicts with omx-plugins-contract before 0.19.3 (rpm
  `Conflicts`, deb `Breaks`). No installed omx-plugins header includes the old one, so the -devel floors stay. A removal in the development
  phase, a minor; it rides 3.13.0.
- `SCAN_FIELD_SCOPES` names its writers, omx-clap-core's scan and plugin-hostd's field dump; it named plugin-qualify,
  which writes none.
- `roleMeanings`, a new item kind: a package declares, in its own contract directory, the panel roles its panels name
  and the meaning each plays (a meaning of `$defs/meaning`, `unknown` for none), every role a row of its own. A role
  has one owner, refused as `contract.role.duplicate` by `validate` and the contract-directory reader; a role added is
  minor, a role removed or playing another meaning major (docs/contract-dir.md "A package's role meanings"). omx-contract
  declares no role. Schema 3.13.0, a minor.
- A code's and a word's `text` is the source sentence, `{ "en": ... }`, with `args`, for codes and words alike. A
  translation moves to the owner's catalog: `catalogs/<lang>.json` (`{ kind: "catalog", lang, owner, messages }`, keyed by
  the code or by `<ITEM>.<word>`, `$defs/catalog`), installed to `/usr/share/<owner>/catalogs/`. `text.ca` is deprecated and
  still read: `validate` warns `catalog-migration` and does not fail, so an owner moves in its own time. `validate` refuses a
  catalog key the owner does not declare and a placeholder outside its entry's `args`; `@openmixer/omx-contract/catalog`
  loads one and looks a key up with the source sentence as fallback (docs/data-layout.md). omx-contract's own Catalan moves
  to `catalogs/ca.json`; the C renders carry `_TEXT_EN` only. A code may be `panel.<a>.<b>...`, omx-panel's refusals.
  Schema 3.12.0, a minor.
- `semver` reads a pattern moved into the first member of an `anyOf` as that `anyOf`, so a member appended beside it is
  minor.
- `semver` reads a local `$ref` as the definition it names, so moving a definition into `$defs` is judged by what it
  resolves to.
- `scalePosition(travel, value)` and `scaleValue(travel, p)` (`lib/scale.mjs`, exported as `@openmixer/omx-contract/scale`):
  what `linear`, `log` and `stepped`, and the override `map`, mean as a position (docs/scale-position.md).
- `data/scale-vectors.json`: the golden vectors of each law, installed as `share/omx-contract/scale-vectors.json`; 20 Hz
  to 20 kHz puts 1 kHz at 0.5663.
- A log travel over a floor that is not positive is served linear by the library; the validator already drops an
  override entry that asks for one (`contract.override.scale-floor`), and a test holds both outcomes.
- `descriptorMeter` gains `held` (the plugin holds the block value until the host reads it; a foreign plugin is false and
  its meter unheld) and `clip` (a level meter carries a sticky clip word; false declares it absent), both optional booleans.
  The kinds stay `level` and `gain-reduction`; a level is in dBFS, dBTP, LUFS or LU and a gain reduction in dB, so
  `dBTP` and `LU` join the plugin-only units. A clip word on a gain reduction, or `clip: true` on a loudness unit, is
  refused with `contract.descriptor.meter`. `rms`, `vu` and `ppm` are not meter kinds.
- `descriptorMeter` gains `measurement` (`peak`, `true-peak`, `lufs-m`, `lufs-s`, `lufs-i`, `lra`, `gain-reduction`), optional.
  `true-peak` is in dBTP, `lufs-*` in LUFS, `lra` in LU, `peak` in dBFS; `gain-reduction` is the one measurement of a
  gain-reduction meter. A measurement in another unit is refused with `contract.descriptor.meter`.
- The schema states `x-omx-schema-version` 3.10.0 (the vocabulary's own number, as 4e85a8d did for 3.9.0; not a release).
  The semver command reads an `anyOf` member by member: a value added to an enum inside it, or a member appended, is
  MINOR; a member removed or rewritten is still MAJOR.
