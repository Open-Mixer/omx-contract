<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- Copyright (C) 2026 Pau Aliagas -->
# Typed contracts and shared behaviour: one shape source, one implementation, bound per runtime

Status: PART RULED by the owner, 2026-11-17: behaviour (§4, §5; decisions 3, 4, 6 and 7 of §9) is RULED — one C
implementation, bound by ctypes and the engine's native door and compiled to WebAssembly for every JavaScript
runtime; the TypeScript and Python arithmetic go. Shapes (§3; decisions 1 and 2) stay PROPOSED, with the owner's
question answered in §3.4 (what Protobuf and TypeSpec add). No lane starts before the shapes ruling: S1 of §8 is
the first lane and needs it. A design, no code. It answers the owner's question of 2026-11-17: the
contracts are the basis of sharing; JSON is standard but untyped and carries no behaviour; TypeScript is expressive
but one language. How does every surface (the console, TypeScript in Node and in a browser; Zynthian, Python; the
renderer and the engine, C; a MOD GUI in a browser) use the SAME contract, with no twins? It evaluates the
coordinator's proposal (JSON Schema as the one typed source with generated types per language; one C implementation
of each behaviour, bound per runtime; the fixtures as the proof every binding passes) and makes it concrete.

**Author:** Pau Aliagas.

**Builds on, and does not reopen:** the owner's decision of 2026-11-17 on the console (the console on the shared
abstractions: served curves, one gesture reference, ownership by gesture; "the console's decision" below) and the
rulings it rests on: all DSP maths is written in C in omx-dsp and TypeScript holds none (the console's ruling that
DSP results come from C, which excludes a WASM build of omx-dsp "unless a client must compute while no console
answers it" — the case §5.2 below is about); declarations as data, rendered, never copied
(`docs/overview.md` here); the vocabulary-owner rule (a word is declared by the package that owns it,
FreeMixer/omx-contract#157); no backward-compatibility machinery while developing (the owner, 2026-11-16).
Related issues: Open-Mixer/omx-panel#52 (Python constants generated from `schema/gestures.json`),
Open-Mixer/omx-contract#46 (named members for `scale.LAWS`), Open-Mixer/omx-contract#66 (one owner for a rule, with
conformance vectors), Open-Mixer/zynthian-ui#42 (the drawbar and XY answer the one gesture vocabulary). The console's own repository is
private: this document states its facts and cites none of its files or issues.

---

## 0. The three-line gate

- **Which primitive fits?** Two that exist. For shapes: omx-contract's render (`data/` under one JSON Schema,
  rendered to C, TypeScript, Python and JSON, each held equal to the data by `render --check`); it renders VALUES
  today and is extended to render TYPES of documents. For behaviour: the C library bound by its runtime, which exists
  three times already (Zynthian loads libomx_panel's renderer with `ctypes.CDLL`; the console's engine links omx-dsp
  in its native DSP door, a node-gyp addon; the renderer's `input.c` is the gesture arithmetic in C). No new
  transport, no new language.
- **Extend the vocabulary, never a local one-off.** A document's shape is one JSON Schema file owned by the package
  that owns the document, installed in the contract directory like a declaration; the types every language reads are
  renders of it, never written by hand. A behaviour is one C function; a language reads it through a binding, never
  through a port.
- **Why isn't X a Y?** Why isn't a TypeScript interface the type source? Because Python and C cannot read it, and the
  console is one surface of four. Why isn't a port in each language acceptable when the fixtures hold it? Because a
  port is a twin: §1 counts three gesture implementations and two curve implementations, each held by a test that
  measures the drift instead of removing it. Why not Protobuf, TypeSpec or CUE? §3.4: each adds a compiler to every
  build for a language the surfaces do not speak, and two of the three produce JSON Schema anyway.

## 1. What exists, checked

Checked on the checkouts of 2026-11-17: omx-contract 484a3a6, omx-panel e622b75, omx-dsp 31aa5fb (0.32.4),
plugin-hostd-protocol, the console and zynthian-ui at their heads of that day.

### 1.1 Shapes: where a type lives today

| Subject | Source of truth | Rendered or generated | Hand-written twins | Drift gate |
|---|---|---|---|---|
| The declarations (travels, limits, words, verbs, codes, sheets; 17 item kinds) | `data/*.json` here and each owner's files in the contract directory, under `schema/omx-contract.schema.json` (JSON Schema 2020-12, 59 KB, closed) | C headers (`include/omxcontract/*.h`, the owners' headers, X-macros for words), TypeScript (`as const` values with literal types), Python (`share/omx-contract/omx_contract.py`, dicts), resolved JSON, LV2 TTL | none for values | `render --check` on every target, CI `handback-render` |
| The scale position law | `docs/scale-position.md` and `data/scale-vectors.json` (six rows per law, 60-digit arithmetic) | — | `src/lib/scale.mts` (TS) and `share/omx-contract/omx_contract_scale.py` (Python), both held to the vectors within one ulp; no C (the renderer is handed positions) | the vectors |
| A panel description, a skin package | `omx-panel/schema/panel.schema.json`, `skin-package.schema.json` (JSON Schema 2020-12) | nothing: ajv validates (`lib/validate.mjs`); no TS, Python or C type | every reader types the document for itself (the renderer with cJSON, Zynthian with dicts, the console with its own interfaces) | none |
| The gesture vocabulary, its timings and table; the look roles; the codes | `omx-panel/schema/gestures.json`, `look-roles.json`, `codes.json` (data with `"schema": 1`, no JSON Schema of their own) | `renderer/src/look_roles.h` from look-roles | Python restates the words as string literals (omx-panel#52) | `omx-panel look --check` for roles; none for gestures |
| plugin-hostd's protocol (verbs, replies, codes, events) | the C headers `include/plugin-hostd/protocol.h` and siblings | `protocol/plugin-hostd.json`, `plugin-hostd-protocol.json`, `mod-host.json` by `tools/protocol-gen.c` compiled against the header; `plugin-hostd.schema.json` | the verbs are declared a second time in omx-contract `data/verbs.json` (`PLUGIN_HOSTD_PROTOCOL_VERBS`, 3.3.0, rendered to `omx_host_verbs.h`); each protocol row names its `declared` item | `make check-generated` |
| The console's declarations package | the installed plugin-hostd headers and mod-host.json, the installed omx-contract | a generated protocol module by the console's own C macro-table reader (537 lines, with a trap of its own on record: a table argument that calls a macro), a generated mod-host module (116 lines), a re-render of omx-contract (121) | the three generators are consumer-side twins of the producers' renders | each generated file checked against its source at build |

What the table says: the one place where shapes are typed once and rendered everywhere is omx-contract, and it renders
values. The DOCUMENTS the surfaces exchange (a panel description, a gesture event and its answer, a curve request and
its points, a descriptor, a protocol reply) have a schema at best and a type in no language but the one that happened
to write the reader.

### 1.2 Behaviour: the twins, counted

| Behaviour | Implementations today | Held by |
|---|---|---|
| Gestures (events in, a value in the control's unit, begin and end, the word, the refusal) | JS, the reference: `omx-panel/tools/gestures.mjs` (356 lines). C: `omx-panel/renderer/src/input.c`, "tools/gestures.mjs carried to C rule for rule". Python: `zynthian-ui/zyngine/zynthian_panel_gestures.py`, reading `gestures.json`. The console: its own mapping in its FX-gesture module and its components (the console's decision, lane F, imports the JS reference into the browser) | `test/fixtures/gestures/scripts.json` (20 scripts): `test/gestures.test.mjs` (JS), `renderer/test/input.test.mjs` (C against the JS), zynthian-ui's `tests/test_bar_xy_gestures.py` |
| Curve points (an EQ or transfer curve from a kernel's terms) | C: `omx_curve_points` in `omx-dsp/include/omxdsp/omx_curve.h` (846 lines, inline; omx-dsp builds static archives, the headers are 32 k lines). TypeScript: `omx-dsp/ts/src/curve.ts`, the twin published as `@openmixer/omx-dsp`, imported by the console's browser (8 files; the console's decision, part 1, removes them) and by `omx-panel modgui` for the static SVG | `ts/test/agreement.test.mjs` against the C oracle binary `ts/oracle/ts-twin-oracle.c` within `test/tolerances.mjs`; `omx-dsp-copy-check` refuses a third copy |
| The scale position law | TS and Python (§1.1) | `data/scale-vectors.json` |
| Meter fill, RTA band aggregation, dB conversions | C in omx-dsp; TS twins in `@openmixer/omx-dsp`, imported by the console's browser (its meter component and spectrum module) | the same agreement test |

Five behaviours, eleven implementations. Each twin is held to a fixture, so the drift is measured, not absent: the
curve tolerance file exists because two compilers of one formula round differently, and the gesture C test
exists because a port can miss a rule.

### 1.3 Bindings that exist

- Python to C: `zynthian-ui/zyngine/zynthian_omx_panel_view.py` loads libomx_panel's renderer with `ctypes.CDLL`
  (`$ZYNTHIAN_OMX_PANEL_RENDER` names a file, else the soname) and declares every signature by hand.
- Node to C: the console's native package (node-gyp) links omx-dsp, omx-clap-core, omx-plugins and
  plugin-hostd-protocol; its DSP addon is the DSP results door, "TypeScript holds no DSP maths".
- Browser to C: none. The console's browser draws served rows (the console's decision); the MOD GUI draws a static SVG computed at
  generation time and reads nothing live.

## 2. The decision, in one sentence each

1. **A shape is one JSON Schema 2020-12 file, owned by the package that owns the document, and every language's type
   of it is a render of that file; a type written by hand for a shape that has a schema is a twin and goes.**
2. **A behaviour is one C function in the package that owns it, bound by each runtime (ctypes, N-API where a native
   build already exists, WebAssembly where only a JavaScript engine exists) and ported nowhere.**
3. **The fixtures are the contract's proof: the owner ships them with the package, and every implementation and
   every binding passes them from the shipped file, never from a copy.**

## 3. Part 1: shapes

### 3.1 The source

JSON Schema 2020-12, one file per document shape, in the owner's `shapes/` directory (`shapes/<name>.schema.json`,
as lane S1 built it: `docs/shapes.md`) and installed for a reader that validates: omx-contract's own under its data
directory (`share/omx-contract/shapes/`, S1); another owner's in the contract directory beside its declarations
(a shape is a `components.schemas` entry of its DOMAIN's document, `<contractdir>/<domain>/<domain>.json`, by `contract-dir.md`'s "Domains" (owner ruling 2026-11-17: keyed by domain, the owner is `info.x-owner`, no major in the path), so a reader finds a shape the
way it finds a declaration — the rule lane S2 adds with the first owner that needs it). The schemas that exist stay where they are
(`omx-panel/schema/panel.schema.json`, `skin-package.schema.json`, `plugin-hostd-protocol/protocol/plugin-hostd.schema.json`)
and are installed. New ones are written for the documents that have none:

- omx-panel: `gestures.schema.json` (the declaration's own shape: timings, words, inputs, table) and
  `gesture-io.schema.json` (a control member, an event, an answer, the refusal codes: the API of §4.1);
  `look-roles.schema.json`, `codes.schema.json`.
- omx-dsp: `curve-io.schema.json` (a curve request: kind, family, the terms, the extents, the grid; and its answer:
  points, marks, basis, code). It is the JSON form of `omx_curve_request_t` and of the reply of plugin-hostd's
  `curve_points` verb, so the host, the wasm and the row all speak one shape.
- plugin-hostd-protocol: the replies of the verbs that answer a document (today each reply is a line grammar; the
  schema describes the parsed form the clients already build).

A schema's `description` strings are the prose the renders carry as doc comments, as the renders carry `doc` and
`why` today; a schema without descriptions is refused by the render (the doxygen gate of #64 extends to it).

### 3.2 The renders, per language, standard tools first

| Language | Tool | What it writes | Where it runs |
|---|---|---|---|
| TypeScript | `json-schema-to-typescript` (npm, the standard one; interfaces with JSDoc from `description`, `$ref` across files, `additionalProperties: false` honoured) | `dist/ts/<name>.d.ts` beside the value render, exported by the owner's package (`@openmixer/omx-panel/gestures` gains its types; `@openmixer/omx-dsp` its curve types) | the owner's `prepack`; the file is committed to `test/golden/ts` and checked like every render |
| Python | `datamodel-code-generator` (PyPI; `--output-model-type typing.TypedDict`, `--use-schema-description`), a TypedDict per object, a `Literal` per enum; dataclasses only where a reader constructs the document | `share/<package>/<name>_types.py`, installed by the Python subpackage (`python3-omx-contract`, a `python3-omx-panel` that omx-panel#52 asks for) | the owner's CI; the generated file is committed, so a consumer never runs the generator and a distro build needs no PyPI |
| C | omx-contract's own `c` target, extended: per schema the property names, the enum words and the required set as defines and X-macros (the shape omx-contract#52's lane gives words), and the schema's installed path as a define for a reader that validates | `include/omxcontract/<name>_shape.h` | the owner's render, `render --check` |
| JSON | the schema itself, installed; ajv in JS (a dependency here already), `jsonschema` in Python, validated by the reader that parses | — | — |

C gets no generated struct. No standard generator writes C structs from JSON Schema (quicktype stops at C++;
the rest are one-person projects), and the C readers that exist read a document with cJSON by key and need the KEY
NAMES and the WORDS, not a struct. Where a C struct is the API (`omx_curve_request_t`, the gesture event of §4.1),
the struct is the ABI and the schema is its JSON form; they are held equal by one conformance test in the owner
(every property of the schema is a field of the struct with the same name and kind, read from the header's doxygen),
the way plugin-hostd holds its JSON to its header. That is one hand-written C struct per shape with a mechanical
gate, stated plainly: C's type is written once, in C, because C is the implementation language of §4.

The generators are pinned by the owner's lockfile (npm) and `requirements` file (PyPI) and run only in the owner's
CI; the committed output is what consumers read. `render --check` regenerates and compares, so a stale type is a
red build, as a stale header is today.

### 3.3 Migration, in order

1. omx-contract: the shapes facility — `render --target ts|py|c --shapes`, the install rule for `schema/` files in the
   contract directory, the drift check, `docs/shapes.md`. Nothing else changes; the value renders are untouched.
2. omx-panel: `gestures.schema.json`, `gesture-io.schema.json`, the panel and skin schemas installed; the TS and Python
   renders published (closes omx-panel#52 with a generated module, as it asks). The console's own interfaces for a
   panel description go when the render lands.
3. plugin-hostd-protocol: the reply schemas; the TS render of the protocol published with the protocol (it is the
   generated half of the console's decision, lane D, the TS client). The console deletes its two protocol generators
   (653 lines of consumer-side generator) and its declarations package re-exports the published renders.
4. omx-dsp: `curve-io.schema.json`; its TS type replaces the twin's hand-typed `CurveRequest` (§5).
5. zynthian-ui: imports the Python renders; the restated literals go (omx-panel#52's done-when).

### 3.4 Why not Protobuf, TypeSpec, CUE

- **Protobuf** (protoc with protobuf-c or nanopb, the Python and TS plugins): generates real C structs, which is the
  one thing JSON Schema does not. Against: our documents are JSON text on disk, in REST rows and in LV2 bundles, and
  proto3's JSON mapping is a second encoding of a second source (`.proto`) that the OPTIONS rows, ajv and the contract
  directory would have to be re-taught; the console's REST OPTIONS already serve JSON Schema-shaped travels. One
  benefit, three new compilers in every build.
- **TypeSpec**: a pleasant authoring language whose emitters write JSON Schema and OpenAPI. It adds a Node compiler
  to every owner's build to produce the file we would otherwise write by hand, and its emitters are its own moving
  target. Write the JSON Schema.
- **CUE**: the strongest typing and validation of the three, and it exports JSON Schema and validates data in one Go
  binary. Against: one more language the team does not speak, a Go toolchain on every CI, and its JSON Schema export
  is lossy for the constructs it is good at. It fits an organisation whose configuration is the product; ours are
  contracts read by three runtimes.
- **JSON Schema 2020-12, proposed**: it is what two repositories already use, ajv already validates it, both
  generators of §3.2 are the standard ones for their language, and the schema is itself the installed, versioned,
  licensed data the contract directory serves.

The owner asked (2026-11-17) what Protobuf and TypeSpec add. The answer, in one line each: JSON Schema is the
CONSUMED format either way — the installed file a reader validates against and the generators of §3.2 read.
TypeSpec adds an authoring layer above it: one source that emits committed JSON Schema AND an OpenAPI document,
which the console's REST entity map (its ~85 entities, their OPTIONS and streams) would gain for free; consumers
need no compiler, only the owner's CI runs `tsp compile` and commits the output, checked like a render. That is a
possible LATER step for the console's map alone, after the shapes of §3.3 are in place, not a part of this ruling.
Protobuf adds a binary wire and C structs; it is taken only for a real binary wire need, which no surface has.

## 4. Part 2: behaviour

### 4.1 Gestures: C is the one implementation

Today's reference is JavaScript (`tools/gestures.mjs`) and the C (`input.c`) is "carried rule for rule" from it. The
direction reverses: the gesture arithmetic becomes one C unit in omx-panel, `renderer/src/gesture.c` with
`include/omx_panel_gesture.h`, pure (no renderer, no window, no I/O; the declaration is handed in as the JSON text of
`gestures.json` and parsed with cJSON, as `input.c` does today), exported in libomx_panel's ABI:

- `omx_gesture_open(const char *gestures_json, const char *settings_json)` — a context holding the timings and the
  table; refuses a hold below the declared floor (`GESTURE_HOLD_BELOW_FLOOR`) as `timingsOf` does.
- `omx_gesture_run(ctx, const char *control_json, const char *events_json, char *answer, size_t cap)` — a control
  member and a script of events in, the answer of `gesture-io.schema.json` out, as JSON text. One call shape, three
  runtimes, no struct crosses the boundary: this is what keeps the ctypes signatures to three and the wasm glue to
  nothing. A caller that holds a gesture in flight re-runs the script on each event, as the console's decision already
  rules for it ("imported, not ported; re-running the script on each event is the price of one
  implementation").
- `omx_gesture_close(ctx)`.

`input.c` calls `gesture.c` for the arithmetic and keeps only the renderer's mapping (which pointer owns which
target). `tools/gestures.mjs` keeps its exported names (`runGesture`, `memberOf`, `timingsOf`, `GESTURE_CODES`,
`GESTURES`) and becomes the loader of the wasm build of `gesture.c` (§4.3), so the console's lane F imports the same
module and changes nothing. `zynthian_panel_gestures.py` becomes the ctypes binding of the three calls over the
library Zynthian already loads; its own arithmetic goes.

### 4.2 The runtimes

| Runtime | Binding | Why this one |
|---|---|---|
| C (the renderer, the engine, plugin-hostd) | link the library | — |
| Python (Zynthian, mod-ui where it is ours) | `ctypes` on the installed shared library, the signatures declared once in the generated Python render of §3.2 (a `_lib.py` the owner writes from the header's doxygen with the same conformance test as the C struct) | it is what Zynthian does today for the renderer; no compiler on the Pi |
| Node, where a native build exists (the console's engine) | the N-API addon that exists (`pipewire-native`), compiled with the engine's own compiler: bit-equal to the kernel the engine runs | a second addon or a wasm beside a native door would be the twin #1601 ended |
| Node, where no native build exists (omx-panel's tools, `omx-panel modgui`) and the browser (the console's page, a MOD GUI) | the SAME C compiled to WebAssembly, loaded by Node's and the browser's built-in `WebAssembly`; one artefact for both | the only way C runs in a browser; and omx-panel then needs no node-gyp |

The rule in one line: native where a native door exists, wasm where only a JavaScript engine exists, a port nowhere.

### 4.3 The wasm build

- **Toolchain:** `clang --target=wasm32-wasi` with wasi-libc and `lld`, all three distribution packages
  (Fedora 45: `clang` 23.1, `lld`, `wasi-libc-devel` 34, read from the repository metadata on 2026-11-22; Debian
  bookworm and trixie: `clang`, `lld`, `wasi-libc`, to be confirmed by the lane's first build); no Emscripten SDK
  and no download, because a release builds on a stage box from the distribution's packages alone
  (the staged inside-out release cadence). Emscripten is rejected for its JavaScript glue and its own pinned toolchain.
  The lane's first step is a red-first build on the three distributions; a distribution without wasi-libc
  is a finding reported to the owner, not worked around with a vendored SDK.
- **What is compiled:** omx-dsp's curve subset (`omx_curve.h` and the kernels it reaches: the EQ design, the
  transfer-curve closed forms) and omx-panel's `gesture.c` with cJSON. Both are plain C with libm and `malloc`,
  which wasi-libc provides; `omx_curve_points` writes into the caller's buffers already. No threads, no files, no
  clock: the gesture's time comes from the events.
- **Size, estimated and then measured:** `gesture.c` (the arithmetic of a 356-line reference plus cJSON's 3 k lines)
  around 60–100 kB of wasm; the curve subset around 100–200 kB. The lane records the measured sizes in the owner's
  CHANGELOG. A module of that size loads in a few milliseconds and is cached by the browser like any asset.
- **Packaging:** the wasm is architecture-independent, so it ships in a `noarch` subpackage (`omx-panel-wasm`,
  `omx-dsp-wasm`, under `/usr/share/<package>/wasm/`) and in the npm tarball (`dist/<name>.wasm` beside the loader).
  A built artefact is never committed; the fixtures (§6) are its proof, the version is the package's.
- **CI:** the owner's CI builds the wasm and runs the fixtures through it under `node --test`, in the same job as the
  native build, so the two are released together or not at all; the release job attaches the wasm to the GitHub
  release as it attaches the npm tarball.
- **Risks:** (i) libm: wasi-libc's `log`, `exp` and `pow` are musl's and may differ from glibc's in the last ulp; the
  fixtures compare values within the declared step (gestures) and within `tolerances.mjs` (curves), and the scale
  vectors within one ulp — a miss is reported with the function and the ulps, never absorbed by widening the
  tolerance without a ruling. The tolerance is what today's TS twin is held to; the wasm is the same source, so the
  expectation is zero ulps for the arithmetic and at most one for the libm calls. (ii) An exported function that
  takes a struct needs glue; §4.1's JSON-text calls need none, and the curve call gets a sibling
  `omx_curve_points_json` with the same discipline. (iii) A browser without WebAssembly: none that MOD-UI or the
  console support. (iv) The C must stay free of `-ffast-math` reorderings that differ per target; omx-dsp's
  `FASTMATH=off` build is the one compiled to wasm, and the native oracle is built the same way for the agreement
  test, as it is today.

## 5. Part 2 applied to curves

### 5.1 Where a server answers

Decided by the console's decision and not reopened: the console's browser draws served rows computed by omx-dsp's C through
the DSP results door; a hosted plugin's display is served from plugin-hostd's `curve_points` through the client.
Zynthian asks plugin-hostd the same verb. No wasm there.

### 5.2 Where no server answers: the MOD GUI in a browser

A MOD GUI is a bundle (`modgui.ttl`, `modgui/`) that MOD-UI serves to a browser; the page talks to MOD-UI's own
socket, and MOD-UI talks to the host (mod-host, or plugin-hostd as its superset). Today `omx-panel modgui` draws
the curve once, at the come-up values, by the TS twin, as a static polyline; reading live "needs the bundle's own
`modgui:javascript`, which this generator does not write".

**Can the host answer `curve_points` instead?** Only when the host is plugin-hostd, and only through a relay MOD-UI
does not have: the page has no socket to the host, MOD-UI would need a new endpoint forwarding the verb, and that is a
change to upstream MOD-UI (the forks keep upstream compatibility until the final release; nothing goes upstream before
it is proved). A generated GUI must also work under stock mod-host, which has no such verb. So: **no**, not as the
only path, and not as the first.

**Decision:** the MOD GUI's live curve is the wasm of §4.3 in the bundle: `omx-panel modgui` writes a
`modgui:javascript` that loads `modgui/omx-curve.wasm`, reads the port values MOD-UI pushes, and calls
`omx_curve_points_json` with the same request the static SVG was drawn from; the static SVG stays the come-up picture
and the picture a browser without the script sees. The same wasm, loaded in Node, draws the static SVG at
generation time, so the TS twin has no caller left in omx-panel. Where every bundle carries its own copy,
`omx-modgui-sync` writes one bundle per installed plugin without a GUI, so a copy per bundle is the module's size
times that count; the lane measures and chooses between a copy per bundle and one file under
`/usr/share/omx-panel/wasm/` linked into each bundle, and records the choice.
A host relay (plugin-hostd's verb through MOD-UI) may be added later for a page that wants the host's own numbers; it
is not needed for one implementation, because the wasm IS the host's implementation.

### 5.3 The twin retires

`@openmixer/omx-dsp` (the TypeScript twins and their oracle) keeps its name and its exported names and becomes the
wasm and its loader: `curvePoints`, `meterFill`, `aggregateSpectrumBands`, `dbToLinearGain` and the rest call into
the module. `ts/src/*.ts` and `ts/test/agreement.test.mjs` go; `ts/oracle/ts-twin-oracle.c` stays as the native
oracle the wasm is held to (§6), and `omx-dsp-copy-check` keeps refusing a port. Consumers (the console's browser
for meters and spectrum, omx-panel) change an import of nothing. the console's decision, part 1, removes the curve imports from
the console's browser first; what remains there after it (meters, spectrum, conversions) is a served row or this
wasm, decided per row by the same test: does a console answer it?

## 6. Part 3: the fixtures are the contract

1. **The owner ships them.** A behaviour's fixtures are files in the owner's package, installed under
   `/usr/share/<package>/fixtures/` and in the npm tarball, and exported by name (`@openmixer/omx-panel/fixtures`'s
   `GESTURE_SCRIPTS`, the console's decision, lane E; `@openmixer/omx-dsp/fixtures`'s `CURVE_VECTORS`;
   `omx-contract`'s `scale-vectors.json` already is one). Gestures: `test/fixtures/gestures/scripts.json`
   (events → values, begin, end, the word, the refusal). Curves: `vectors/curve-points.json` (terms → points): a
   closed-form oracle computed in high-precision arithmetic as `scale-vectors.json` is, "never by the library", at a
   handful of grid points per kind and family, with its tolerance beside each row.
2. **Every implementation and binding passes them from the shipped file.** The C test, the wasm test under
   `node --test`, the ctypes test under Zynthian's `tests/`, the console's conformance test: each reads the installed
   or imported fixture, never a copy in its own tree; a conformance test per consumer refuses a file named
   `scripts.json` or `*-vectors.json` that is not the import (the `.fake.ts` lesson: a copy in a test tree is a twin
   that escapes every gate).
3. **A fixture change is the owner's minor, released first.** A new script or vector lands in the owner, every
   binding's suite goes red on the next floor bump, and the binding is fixed or the finding is filed; a fixture is
   never edited in a consumer.
4. **The sabotage arm is part of the fixture.** Each fixture set carries at least one script whose expected value a
   plausible wrong implementation would miss (the fine ratio, the palm guard, the dead travel; an infinite cut, a
   non-positive frequency), so a binding that answers a constant stays red.

## 7. Recommendation

Yes to the coordinator's proposal, with three changes made concrete: C gets no generated struct (the struct is the
ABI; a conformance test holds it to the schema); Node gets no second addon (the engine keeps its native door, every
other JavaScript loads the wasm); and the MOD GUI gets the wasm in the bundle, not a host relay. The order is
shapes first (they cost nothing at run time and remove the consumer-side generators), then gestures (the C exists,
the fixtures exist, Zynthian's binding exists), then curves (the wasm toolchain proved on the three distributions
by the gestures lane carries over).

## 8. Order, as lanes, each its own issue and PR

| # | Repo | What | Done when |
|---|---|---|---|
| S1 | omx-contract | the shapes facility of §3.1–3.2: schema install rule, `render --shapes` for ts (json-schema-to-typescript) and py (datamodel-code-generator), the C defines, `render --check`, `docs/shapes.md` | a fixture schema renders three targets held by `--check`; red first: a hand-edited render fails |
| S2 | omx-panel | `gestures.schema.json`, `gesture-io.schema.json`, look-roles and codes schemas; TS and Python renders published; omx-panel#52 closed | zynthian-ui imports the Python module; the console imports the TS types |
| S3 | plugin-hostd-protocol | reply schemas; the TS render published with the protocol (with the console's lane D) | the console deletes its two protocol generators; its declarations package re-exports |
| B1 | omx-panel | `gesture.c` and `omx_panel_gesture.h` of §4.1; `input.c` on it; the C fixture test; the ABI file | the 20 scripts green from C, red first; `gestures.mjs` still the JS until B2 |
| B2 | omx-panel | the wasm build of §4.3 on the three distributions; `gestures.mjs` as the loader; `omx-panel-wasm` noarch; the fixtures through the wasm | the scripts green through the wasm; the JS arithmetic deleted; measured size in the CHANGELOG |
| B3 | zynthian-ui | `zynthian_panel_gestures.py` as ctypes on libomx_panel; `tests/test_bar_xy_gestures.py` on the shipped scripts | green on the Pi from the installed package; the Python arithmetic deleted |
| B4 | omx-dsp | `curve-io.schema.json` (with S1), `omx_curve_points_json`, `vectors/curve-points.json` with its oracle, the wasm build, `@openmixer/omx-dsp` as the loader; the TS twins deleted | the vectors green natively and through the wasm; `agreement.test.mjs` replaced by the vectors; `omx-dsp-wasm` noarch |
| B5 | omx-panel | `omx-panel modgui` draws the static SVG by the wasm and writes the `modgui:javascript` of §5.2 | a generated bundle's curve follows a port change in MOD-UI's page; the copy-or-link choice recorded |
| B6 | openmixer | after #660 part 1: the remaining `@openmixer/omx-dsp` imports in the browser, each a row or the wasm | no TS maths in `web-ui`; the conformance arm of #660 extended to the module's exports |

S1 before S2–S3; B1 before B2 before B3 and B5; B4 after B2 (the toolchain); B6 last. Each lane is red first against
the twin it removes: the test that holds the twin today is the test that holds the binding tomorrow.

## 9. What the owner decides

1. PROPOSED — JSON Schema 2020-12 as the one shape source, written by hand, installed in the contract directory
   (§3.1, §3.4), as the consumed format; TypeSpec possibly later as an authoring layer for the console's REST map
   (§3.4); Protobuf only for a real binary wire need.
2. PROPOSED — The generators: `json-schema-to-typescript` and `datamodel-code-generator` (TypedDict), pinned in the
   owner and their output committed; C gets defines and X-macros, and a hand-written struct per API shape held by a
   conformance test (§3.2).
3. RULED YES (owner, 2026-11-17) — Gestures: the reference moves from JavaScript to C in omx-panel;
   `gestures.mjs` is the wasm loader; the JS and Python arithmetic are deleted once the wasm and the ctypes binding
   pass the shipped scripts (§4.1).
4. RULED YES (owner, 2026-11-17) — Behaviour is C + WebAssembly for ALL JavaScript runtimes: distribution `clang` +
   wasi-libc + `lld`, no Emscripten; the artefact in a noarch subpackage and in the npm tarball, never committed
   (§4.3).
5. Node: the engine keeps its native addon; every other JavaScript, in Node or a browser, loads the wasm; no second
   addon (§4.2). Carried by decision 4.
6. RULED YES (owner, 2026-11-17) — The MOD GUI's live curve: the wasm in the bundle, no MOD-UI relay; the static SVG
   stays the come-up picture (§5.2).
7. RULED YES (owner, 2026-11-17) — `@openmixer/omx-dsp` keeps its name and becomes the wasm build and its loader;
   the TypeScript twins go (§5.3).
8. The tolerance rule: a wasm-versus-native miss is a reported finding with the function and the ulps, never a
   widened tolerance without a ruling (§4.3).
9. The lane order and owners of §8; no lane starts before decisions 1 and 2 (S1 needs them).
