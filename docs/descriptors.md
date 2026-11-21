<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com> -->
# Plugin descriptors

A descriptor file describes one plugin, ours or anyone's: its identity, its controls, its ports, whether it is an
instrument, what it needs from the host and whether it reports latency. A control is the kernel file's control
([kernel-files.md](kernel-files.md)) with a few words more, so a kernel and a plugin are described in one language.

The words are our own. Where LV2 or CLAP already has a word for the same fact, the descriptor borrows its name:
units from LV2 `units:`, meanings from LV2 `param:` and `lv2:designation`, choice labels from LV2 scale points,
`group` from LV2 `pg:group` and CLAP `module`, the flags from CLAP param flags, note dialects from CLAP note ports.
Two mappings (CLAP to descriptor, LV2 to descriptor) and two generators (descriptor to a CLAP face, descriptor to
an LV2 `.ttl`) read and write these words; what a format cannot say is `unknown` or an extra.

The schema (`schema/omx-contract.schema.json`, `$defs.descriptor`) holds the words; `omx-contract validate` and the
contract-directory reader hold a file to them. This release adds the words only: no item moves and no render
changes.

## The file

```json
{
  "$schema": "https://openmixer.org/schema/omx-contract/v3/omx-contract.schema.json",
  "requires": { "omx-contract-schema": ">= 3.0.0" },
  "origin": "authored",
  "plugin": { "id": "org.example.delay", "format": "clap", "name": "Delay", "features": ["audio-effect"] },
  "controls": [
    { "id": 0, "name": "time", "kind": "travel", "meaning": "delay", "group": ["Delay"],
      "travel": { "min": 1, "max": 2000, "unit": "ms", "default": 350, "scale": "log" } },
    { "id": 1, "name": "pingpong", "kind": "toggle", "default": false }
  ],
  "ports": [
    { "id": "in", "name": "Input", "kind": "audio", "direction": "in", "role": "main", "channels": 2, "layout": "stereo" },
    { "id": "out", "name": "Output", "kind": "audio", "direction": "out", "role": "main", "channels": 2, "layout": "stereo" }
  ],
  "source": { "impl": "src/delay.c#delay_process" }
}
```

A file is a descriptor when it carries `origin`; it then declares no item, and only the words below may stand at
its top: `$schema`, `requires`, `origin`, `plugin`, `controls`, `ports`, `instrument`, `needs`, `latency`,
`easy`, `meters`, `choiceUnits`, `integrity`, `extensions`, `source`.
Any other key or word is `contract.file.invalid`, never skipped.

## The words

"Existing" is a word the schema already had for kernel files and items; "new" is a word this release adds.

| Block | Word | Meaning | New / existing |
|---|---|---|---|
| file | `$schema`, `requires` | As every installed file ([contract-dir.md](contract-dir.md)) | existing |
| file | `origin` | `authored`, `built` or `scanned` (below) | new |
| `plugin` | `id`, `format` (`clap`, `lv2`), `uri`, `name`, `vendor`, `version` | Identity as the plugin states it; `id` is the CLAP id or the LV2 URI | new |
| `plugin` | `features` | `audio-effect`, `instrument`, `note-effect`, `analyzer`: CLAP's feature names, LV2 classes mapped onto them | new |
| `plugin` | `doc` | The plugin's one-line description, one word for both faces: CLAP `clap_plugin_descriptor.description`, LV2 `rdfs:comment`. Optional; one line | new (3.0.0) |
| control | `name`, `doc`, `kind`, `ids`, `labels`, `values`, `default`, `count`, `when` | As in kernel files; `name` is the plugin's own name for the control | existing |
| control | `kind`: `travel`, `choice` | A continuous or stepped travel; a list of named values | existing |
| control | `kind`: `toggle`, `trigger` | On or off (LV2 `lv2:toggled`); a momentary action (LV2 `pprops:trigger`) | new |
| control | `travel.min`, `.max`, `.step`, `.unit`, `.default`, `.defaultFrom`, `.scale` | Range, unit, scale (an id of `PARAM_SCALES`) and the come-up value | existing |
| control | `id` | The host's handle: the CLAP `clap_id` (an integer) or the LV2 port symbol | new |
| control | `symbol` | The stable name a session keys the control by, beside a CLAP `clap_id`: our authored plugins' parameter-contract symbol, so a restore finds the control when ids move. Optional; an LV2 control's `id` is its symbol already | new |
| control | `label` | The display name, when it differs from `name` | new |
| control | `group` | A path, outer first: `["Filter", "Envelope"]`. CLAP `module`, LV2 `pg:group`, our panel section | new |
| control | `meaning` | What the control does, from the closed list below. A skin binds by meaning, never by id | new |
| control | `hidden`, `readonly`, `automatable` | CLAP `IS_HIDDEN`, `IS_READONLY`, `IS_AUTOMATABLE`; LV2 `pprops:notOnGUI`, an output control | new |
| control | `source` | The control's own links, in the place of the file's | existing |
| `travel` | units `frames`, `bpm`, `midiNote`, `LUFS`, `deg`, `ratio`, `dBTP`, `LU` | Units a plugin uses that no item does (below) | new; `ratio` 3.0.0; `dBTP` and `LU` for the loudness meters |
| `travel` | `unit: "unknown"`, `scale: "unknown"` | The plugin states no unit or scale, or one with no word here | new |
| `ports[]` | `id`, `name`, `kind` (`audio`, `midi`, `note`, `cv`), `direction` (`in`, `out`) | One entry per port, in the plugin's order | new |
| `ports[]` | `role` (`main`, `sidechain`, `aux`), `channels`, `layout` (`mono`, `stereo`, `surround`) | An audio port's layout: CLAP audio ports (`IS_MAIN`, channel count, port type), LV2 `pg:` groups and `lv2:isSideChain` | new |
| `ports[]` | `dialects` (`clap`, `midi`, `midiMpe`, `midi2`) | What a note port accepts or emits: CLAP's note dialects | new |
| `instrument` | `voices`, `polyphonic` | Present exactly when `features` holds `instrument`: notes in, audio out. `voices` only when the plugin states it (CLAP voice info) | new |
| `needs` | `transport`, `tempo`, `extensions.required`, `extensions.optional` | What the host must give: CLAP host extensions, LV2 `lv2:requiredFeature` and `lv2:optionalFeature`, a `time:Position` input | new |
| `latency` | `reports`, `frames`, `sweep` | `reports: true` when the plugin reports its latency; `frames` only for a constant the plugin defines, never a measured figure. `sweep: { min, max }` for a modulated delay (a rotary speaker), which has no single latency: its lag moves inside the sweep, for example 5 to 47 frames at 48 kHz, so a host checks a measured lag against the declared range, not one figure; the reported latency is the sweep's shortest read. `min` and `max` are each a non-negative integer of frames or a `{ ref }` to a scalar item whose unit is `frames` or `ms`; a consumer reads an ms value at the running rate, rounded to the nearest frame. The unit of a latency ref is honoured, for `sweep` and for `frames`. A sweep with `min` above `max` (both integers, or both refs to scalars in one unit), a sweep whose ends are in two units (an integer is frames, so an integer with an ms ref is mixed), or a latency ref to an item that is no scalar in frames or ms, is refused (`contract.descriptor.latency`). A plugin with no sweep declares none | new (minor) |
| file | `easy` | The controls of the plugin's Easy face, in order, at most eight, each by its `symbol`, else its `id`: what a host opens the plugin on, with every control one click away. Optional; never in a `scanned` descriptor, whose scan has nothing to read it from. With none, a host's panel layout picks them from the roles (omx-panel `docs/panel-layout.md`) | new (minor) |
| file | `choiceUnits` | The unit of a choice's values, declared once by the plugin: an object from a choice control's `name` to a unit, one of the descriptor units (`dB/oct` for a filter slope, `ratio`, `Hz`, ...), never `unknown`. Readers (the MOD GUI generator, the renderer, a host) read the unit here and keep no map of their own. Optional; a choice with no entry carries no unit | new (minor) |
| `meters[]` | `id`, `symbol`, `name`, `doc`, `kind` (`gain-reduction`, `level`), `channels`, `unit`, `min`, `max`, `scale`, `measurement`, `held`, `clip`, `group`, `source` | A value the plugin publishes while it runs, which a host draws and never writes: CLAP `clap.meters/1` (`id` the meter id, `symbol` its `clap_meter_info.name`), LV2 output control ports. `symbol` is what a host reads it by: the LV2 port's symbol and the output symbol omx-clap-core derives from the CLAP name; a meter of more than one channel has one per channel, `<symbol>_<channel>` from 0. `min`, `max` and `scale` are the display range and scale, a kernel readout's ([readouts.md](readouts.md)) when `source.from` links one. Optional, in the plugin's order; no two meters share an id or a symbol, and no meter answers to a control's symbol. The kinds are what is measured: `level` in `dBFS`, `dBTP`, `LUFS` or `LU`, `gain-reduction` in `dB`; `rms`, `vu` and `ppm` are not words. `measurement`: what is measured, `peak` (dBFS), `true-peak` (dBTP), `lufs-m`, `lufs-s`, `lufs-i` (LUFS) or `lra` (LU) for a level, `gain-reduction` for a gain reduction; optional. `held`: the plugin keeps the block value until the host reads it (a foreign plugin that holds nothing is `false`, its meter unheld). `clip`: a level meter carries a sticky clip word latched by the reader, `false` declares it absent; only a level in `dBFS` or `dBTP` says `true`, and a gain reduction has none. Both are optional booleans | new (minor); `held`, `clip` new (minor) |
| `integrity` | `version`, `commit` | The source the descriptor was generated from: `version` the plugin's own (`plugin.version`), `commit` the full 40-hex commit its release tag names, stamped at build. A host that links the plugin's table matches the build it links by `commit`, as it matches the plugin's RT verdicts. It names no binary: a descriptor package serves every architecture, the shipped binary is the stripped one, and a host that links the table never runs the binary. Optional; both keys required when it stands | new (minor), 3.14.0 |
| `extensions` | `clap`, `lv2`: each `{ <source field>: <value> }` | The extension bag: a format's facts no word of ours carries, carried verbatim (below) | new (3.0.0) |
| `source` | `from`, `impl`, `at` | As in [contract-dir.md](contract-dir.md); for a scan, links into the `.ttl` or the CLAP binary | existing |

Never in a descriptor: measured latency per rate, CPU cost, stability, real-time safety, verdicts. They are
measurements of one machine and belong to a qualification record, which no descriptor carries.

### What each kind carries

| `kind` | Carries | Leaves out |
|---|---|---|
| `travel` | `travel`, with `unit` and `scale` always stated | `ids`, `labels`, `values` |
| `choice` | `ids`; optionally `labels` (one per id), `values` (one number per id: the value the plugin reads for it) and a `default` among the ids | `travel` |
| `toggle` | optionally a boolean `default` | `travel`, `ids` |
| `trigger` | nothing more: a trigger has no state, so no `default` | `travel`, `ids`, `default` |

### A scanned CLAP parameter's kind

CLAP states no kind: a parameter has a range, a default, flags and, for an enumeration, a text per value. A describing
host (plugin-hostd's `describe`, the console's catalog of a scanned descriptor) reads the kind from them by one rule,
stated here and held by the vectors below; no host keeps a rule of its own.

- The parameter's **scale** is the merged word: its contract entry's `scale` when it has one
  (`org.openmixer.param-contract/1`), else `stepped` when `CLAP_PARAM_IS_STEPPED` is set, else the flag's absence, a
  continuous travel. The contract entry wins over the raw flag both ways.
- A parameter flagged `CLAP_PARAM_IS_ENUM`, or one with value texts, is a `choice`, whatever its range.
- Else a parameter whose scale is stepped, whose `min` is 0 and `max` is 1, and whose step is 1 (the contract entry's
  `step` when it states one; CLAP's stepped means integer positions, so one is implied) is a **`toggle`**: CLAP states
  a boolean in no other way, and a plugin that draws it as a switch is right to. Its `default` is `true` when the
  parameter's default is at least 0.5, the nearer of its two positions.
- Else it is a `travel`, with the merged scale word: a stepped 0..2, a stepped 1..2, a continuous 0..1, and a stepped
  0..1 whose contract step is 0.25 (five positions, not two) all stay travels.

`share/omx-contract/clap-kind-vectors.json` holds the vectors: per case the inputs (the flags, the range, the default,
the contract entry or none, whether value texts exist) and the kind and default a host must read. The C reader
(plugin-hostd `src/describe.c`) and the console's TypeScript one are
held to this one file by their own tests; neither restates the table. It is no declaration: not loaded, rendered or
installed in the contract directory.

### Units

The unit list is a words item (3.21.0, behaviour-core decision 3): `PARAM_UNITS` in `data/param-contract.json`,
one word per unit, each its symbol as written (`dB`, `ms`, `""`, `dB/oct`), in the order the schema lists them. The
schema's `$defs.unit` enum is rendered from it (`render --check` holds the committed schema to it), so a unit is added
in one place. `descriptorUnit` keeps its plugin-only units beside it.

A descriptor's `travel.unit` is a unit of the item list (`dB dBFS ms s min Hz oct cents st %`, `""` and, since
3.1.0, `dB/oct`, a slope such as a key filter's tilt, for which LV2 has no unit, since 3.7.0 `LUFS`, a loudness, and `dB/s`, a gain change per second, and since 3.21.0 `coef`, a coefficient, the plain multiplier, which replaces `x` (omx-contract#167)), one of the six below, or `unknown`.

| Unit | Taken from |
|---|---|
| `frames` | LV2 `units:frame`, whose symbol is `frames` |
| `bpm` | LV2 `units:bpm` (its symbol is `BPM`) |
| `midiNote` | LV2 `units:midiNote` (its symbol is `note`) |
| `LUFS` | No LV2 unit: loudness, ITU-R BS.1770. Also an item unit since 3.7.0 |
| `deg` | LV2 `units:degree`, whose symbol is `deg` |
| `ratio` | No LV2 unit: a ratio `n:1`, a compressor's or a de-esser's (`""` says no unit, and an LV2 face writes none for it, so a scan could not tell the two apart) |
| `unknown` | The plugin states no unit (every CLAP parameter; an LV2 port without `units:unit`), or one with no word here; the LV2 unit stays in `source` |

The item list is the units the items use; these seven are for descriptors, `LUFS` also being an item unit since 3.7.0.

### Scales

`travel.scale` is an id of `PARAM_SCALES` (`linear`, `log`, `stepped`) or `unknown`: the plugin states none.

### Meanings

The closed list, seeded from the roles our plugin panels bind. Where LV2's `param:` vocabulary or `lv2:designation`
has the term, the meaning carries its name.

| Meaning | LV2 term |
|---|---|
| `gain`, `threshold`, `ratio`, `attack`, `release`, `hold`, `decay`, `frequency`, `cutoffFrequency`, `resonance`, `bypass` | `param:` of the same name |
| `wetDryRatio` (the mix of a wet and a dry signal) | `param:wetDryRatio` |
| `delay` (a delay time) | `param:delay` |
| `enabled` (on when the control is on; the inverse of `bypass`) | `lv2:enabled` |
| `range`, `knee`, `hysteresis`, `makeup`, `lookahead`, `ceiling`, `output`, `q`, `slope`, `width`, `drive`, `tone`, `rate`, `depth`, `feedback`, `spread`, `predelay`, `size`, `damping`, `lowCut`, `highCut`, `shift`, `fine`, `sync`, `division`, `listen`, `shape`, `model`, `algorithm`, `mode`, `type`, `pingpong` | none |
| `unknown` | The plugin states no meaning |

A control with no meaning in the list leaves `meaning` out and is shown by its `group` and `name`. A new meaning is
a schema minor. One word per meaning, no synonyms: `on` is `enabled` and `speed` is `rate`, so neither is a
meaning, and the validator names the word to use when a file writes one. `shape`, `model`, `algorithm`, `mode` and
`type` (a choice of which one) and `pingpong` (a delay's bounce) came with 3.7.0.

### Plugin features

`plugin.features` holds the four words `audio-effect`, `instrument`, `note-effect` and `analyzer`. Every CLAP plugin
feature (`clap/plugin-features.h`, 39 in clap 1.2.10) and every LV2 plugin class (lv2core, `lv2:*Plugin`) is mapped
onto one of them, or onto `other` for what fits none, in five items of plugin-db's `plugin-feature` domain (sorting
pass V24): `PLUGIN_FEATURE_AUDIO_EFFECT`, `_INSTRUMENT`, `_NOTE_EFFECT`, `_ANALYZER` and `_OTHER`. A word of an item is
the source term (`clap.reverb`, `lv2.Allpass`) and its `from` the format's term. A kind of effect (a compressor, a
reverb, a filter) is an `audio-effect`; the kind itself stays in the extension bag as the source states it. `other`
is a table target, never a word of `plugin.features`: a feature or class mapped to it, and one no row names, is not
written in `features`. The instrument rule stands: only a plugin that takes notes is an `instrument`, so a LV2
generator or oscillator is `other`. plugin-db's test holds the items to the terms: every feature and class has exactly one row.

### The extension bag

`extensions` holds, per format (`clap`, `lv2`), the facts of that format no word of ours carries, each under its
source field and carried verbatim: `{ "clap": { "clap_plugin_descriptor.features": ["delay", "stereo"] }, "lv2": {
"rdf:type": "lv2:CompressorPlugin" } }`. An `authored` descriptor may carry the extras its faces write (CLAP's open
features, the LV2 class); a `scanned` one carries what its format map classes `extension`. A reader never reads a bag
value as a word: a fact that has a word is written in the word, never in the bag.

The corrections a person or a measurement makes to a scanned descriptor are an override file, applied by one
function ([overrides.md](overrides.md)).

## The format maps

A `formatMap` item is one format's mapping table (`PLUGIN_HOSTD_CLAP_MAP`, `PLUGIN_HOSTD_LV2_MAP`, which plugin-hostd
installs): how each field a scan of that format reads becomes a descriptor, and, read backwards, how a generator
writes a face from one. Its `rows` are keyed by the source field, as the format names it: an LV2 CURIE
(`units:unit`), a CLAP struct field (`clap_param_info.min_value`), an element of a struct's fixed array by its index
(`omx_clap_panel_display.meter_ids[0]`, as omx-clap-scan's field dump names it). Each row has exactly one class:

| Class | Carries | Meaning |
|---|---|---|
| `word` | `{ word, transform, values? \| factor? }` | The descriptor word it becomes (`controls[].travel.unit`), the name of the transform that converts it (one of the closed list of the module that applies the map: plugin-hostd's `TRANSFORMS(X)`), and that transform's data: `values`, a map read forwards and backwards, or `factor`, a number. Never code. |
| `extension` | `true` | Carried verbatim into the descriptor's `extensions.<format>.<field>`. |
| `dropped` | `{ ruling }` | Left out, by the ruling it names (a spec path and section, or the term's `out-of-scope` ruling). |

Each row names what it covers, one of two: `term`, a term of a format file (`LV2_UNITS_TERMS#unit`, docs/data-layout.md),
of the map's format; or `from`, a link to the header or the specification line of a field no terms file lists (the
CLAP struct fields, `rdfs:comment`, `doap:name`). `validate` refuses (rule `map-term`) a `term` that is no term of a
terms item, or a term of another format. The coverage test of the package that installs the map holds every field
mapped once; the tool names no field.

## The three origins

| Origin | What | Made by | Lives in | Its links |
|---|---|---|---|---|
| `authored` | Our kernels and plugins: meaning, units, scale, come-up values | The owner, when the item is created | the contract directory, shipped by the owner | at least one `impl` into the owner's tree |
| `built` | A plugin we build whose parameter list lives only in its code (a ported or wrapped plugin) | The owner's build, from a scan of its built binary; the extras authored on top | the contract directory, shipped by the owner | `from` the built binary |
| `scanned` | Third-party CLAP and LV2 plugins | A scan on the user's machine, from the plugin's own metadata only | the console's own state directory: never the contract directory, never shipped | `from` the `.ttl` or the CLAP binary |

- An `authored` descriptor states what a person declared, so it never says `unknown`: a unit, a scale or a meaning
  of `unknown` in it is refused.
- A `built` or `scanned` descriptor writes only what the plugin states: what it does not state is `unknown`.
- The contract-directory reader refuses a `scanned` descriptor: what a machine found about itself is not a
  declaration.

## What validation refuses

A descriptor is held to the schema first; a word the schema does not have is `contract.file.invalid`. Then the
rules a schema cannot state, each with its own code in `CONTRACT_CODES` (the `contract` domain). A refusal names the
file, the control or port, and the code; the reader refuses the whole read on the first one.

| Code | When |
|---|---|
| `contract.descriptor.origin-source` | An `authored` descriptor with no `impl` link, or a `built` or `scanned` one with a control that has no `from` link (its own or the file's). |
| `contract.descriptor.unknown-authored` | An `authored` descriptor with a unit, a scale or a meaning of `unknown`. |
| `contract.descriptor.control-duplicate` | Two controls with one `id`, one `name` or one `symbol`. |
| `contract.descriptor.port-duplicate` | Two ports of one kind and direction with one `id` (CLAP numbers audio and note ports, inputs and outputs, apart). |
| `contract.descriptor.range` | A travel whose `min` is above its `max`, whose `step` is negative, or whose `default` lies outside it. |
| `contract.descriptor.latency` | A latency `sweep` whose `min` is above its `max` (both integers, or both refs to scalars in one unit), whose ends are in two units (an integer is frames), or a latency ref (`frames`, `sweep.min`, `sweep.max`) to an item that is no scalar in frames or ms. |
| `contract.descriptor.choice` | A choice whose `default` is not one of its ids, or whose `labels` or `values` are not one per id. |
| `contract.descriptor.scale-undeclared` | A scale that is neither an id of `PARAM_SCALES` nor `unknown`. |
| `contract.descriptor.port-words` | `role`, `channels` or `layout` on a port that is not audio; `dialects` on a port that is not a note port, or a note port without them; a `layout` its `channels` contradict (`mono` 1, `stereo` 2, `surround` more than 2). |
| `contract.descriptor.instrument` | An `instrument` block without the `instrument` feature or the feature without the block; an instrument without a note or MIDI input, or without an audio output. |
| `contract.descriptor.when-unresolved` | A `when` whose `control` names no choice of the descriptor, or whose `is` is not one of that choice's ids. |
| `contract.descriptor.integrity` | An `integrity` whose `version` is not the plugin's `plugin.version`, or on a plugin that states no version. |
| `contract.origin.misplaced` | A `scanned` descriptor installed in the contract directory. |
| `contract.descriptor.face-differs` | A plugin's built face, scanned as a host scans it, states other than its authored descriptor. The reader compares no faces: the owner's face check raises it (omx-plugins `tools/face-descriptor-check.mjs`). |

Each code has a test that breaks one fixture to raise it and reads its value back: `test/descriptor.test.mjs`,
over the example files in `examples/descriptors/`. A code another package raises, such as
`contract.descriptor.face-differs`, is named instead in `test/fixtures/codes-raised-elsewhere.json` with the
code that raises it, and the test holds that list to the registered codes.
