# Changelog

The releases are in `debian/changelog` and `packaging/omx-contract.spec`. `Unreleased` holds what the next release will carry; a release moves its lines under its own heading.

## Unreleased

- FIXED: `omx_vocabulary.h` spells the `PARAM_UNITS` words item's X-macro `OMX_PARAM_UNITS_WORDS(X)`; it defined `OMX_PARAM_UNITS(X)`, the name of the released `omx_param_units.h` table, and the two headers together did not compile under `-Werror` (omx-contract#151). Tree version 3.21.0.
- ADDED: a domain renders as its data form did (omx-contract#139): `render --target c|ts --package <pkg> --data data --with-domain <dir>` rebuilds the data files the domain came from (each item's `x-file`; `x-kind` codes or sheet, `x-source`, `x-name`, `x-value`, `x-docs`; the root's `x-render` and `x-file`) beside the files still in `data/`, and renders them unchanged, byte for byte. A path in both is refused. The domain schema and the reader accept these words; a domain without them renders as before.
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
