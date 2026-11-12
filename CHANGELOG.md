# Changelog

The releases are in `debian/changelog` and `packaging/omx-contract.spec`. This file holds what the next release will carry.

## Unreleased

- Language packs (#21): a catalog entry is the sentence, a person's `{text, by: human}` or a model's `{text, by:
  machine, model, source}`, `source` the sha256 of the source sentence it was made from; both readers skip a stale one
  (`sourceHash`, `isStale`; `source_hash` in Python). `share/omx-contract/languages.json` lists the shipped languages
  (ca, es, fr, de, it, pt) and a test pair (ja, ar). `omx-contract translate` makes and keeps a language's catalog
  through an OpenAI-compatible endpoint behind the placeholder gate, and `--check` is the release gate. Each language
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
