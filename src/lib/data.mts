// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * The declaration as data: load every `data/**.json` file, then resolve each item's references
 * and derivations into plain values. The renderers are pure functions of the resolved items.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { readDomain } from './domain.mjs';
import type { Json, JsonObject } from './json.mjs';

/**
 * omx-contract's own domains whose items join the read of a data directory: `<dir>/../contract.d/<name>/<name>.json`,
 * read as the classic file of its items at `<name>/<name>.json`, the place a read of the installed contract directory
 * gives it, so the renders of data/ and of the installed tree agree. `param` holds the standard parameter words
 * (PARAM_SCALES, PARAM_UNITS, PARAM_UNIT_DIMENSIONS; sorting pass V21, V23a+b). A data directory with no such domain
 * beside it reads as before.
 */
export const TREE_DOMAINS = ['param'];

/** The files of the TREE_DOMAINS beside `dir`, `{ rel, text, doc, domain: true }`, each `doc` the classic file of its items. */
export function treeDomainFiles(dir: string | null): Json[] {
  if (!dir) return []; // texts handed in with no directory: their files are the whole read
  return TREE_DOMAINS.flatMap((name) => {
    const path = join(dir, '..', 'contract.d', name, `${name}.json`);
    if (!existsSync(path)) return [];
    // the classic file, its $schema the relative path a file one directory down names (its schema major is not read here)
    const { doc } = readDomain(name, JSON.parse(readFileSync(path, 'utf8')), '../schema/omx-contract.schema.json', 0);
    return [{ rel: `${name}/${name}.json`, text: `${JSON.stringify(doc, null, 2)}\n`, doc, domain: true, source: `contract.d/${name}/${name}.json` }];
  });
}

/**
 * The files at the top of a data directory that are neither declarations nor items: `scale-vectors.json` holds the
 * golden vectors of the position law of each scale word (lib/scale.mjs). They are not loaded, not rendered and not
 * installed in a contract directory; the packages install the file beside omx-contract.json.
 */
export const SIDE_FILES = ['scale-vectors.json'];

/** Every `.json` file under `dir`, sorted by its path relative to `dir`, the side files at its top left out. */
export function dataFiles(dir) {
  const out: Json[] = [];
  const walk = (d) => {
    for (const f of readdirSync(d).sort()) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (f.endsWith('.json') && !(d === dir && SIDE_FILES.includes(f))) out.push(p);
    }
  };
  walk(dir);
  return out.sort((a, b) => (relative(dir, a) < relative(dir, b) ? -1 : 1));
}

/**
 * The raw data: `{ files: [{ path, rel, doc }], items: Map<name, { name, rel, item }> }`, items in
 * file order then key order. `files` may be handed in as `{ rel: text }` (a tag's data, a test). `sources` names, by
 * rel, the document a handed-in file was rebuilt from (`render --data --with-domain`: the domain's
 * `contract.d/<domain>/<leaf>.json`); the file and its items carry it as `source`, the provenance sourceOf reads.
 * @throws naming the file when one is not JSON, and an item declared by two files.
 */
export function loadData(dir: string, texts?: Readonly<Record<string, string>>, sources: Readonly<Record<string, string>> = {}): Json {
  const files: Json[] = [];
  const entries: [string, string][] = texts ? Object.entries((texts) as Record<string, Json>).sort(([a], [b]) => (a < b ? -1 : 1)) : dataFiles(dir).map((p) => [relative(join(dir, '..'), p), readFileSync(p, 'utf8')]);
  // texts handed in (a tag's data, a test) take a tree domain only where they name its place: a tag before it has none
  const domains = new Map(treeDomainFiles(dir).filter((f) => !texts || Object.hasOwn(texts, f.rel)).map((f) => [f.rel, f]));
  for (const rel of domains.keys()) if (!entries.some(([r]) => r === rel)) entries.push([rel, '']);
  entries.sort(([a], [b]) => (a < b ? -1 : 1));
  const items = new Map();
  for (const [rel, text] of entries) {
    let doc;
    const domain = domains.get(rel);
    const source = domain?.source ?? (Object.hasOwn(sources, rel) ? sources[rel] : undefined);
    if (domain) { files.push(domain); doc = domain.doc; } else {
      try { doc = JSON.parse(text); } catch (e) { throw new Error(`${rel}: not JSON: ${(e as Error).message}`); }
      files.push({ rel, text, doc, ...(source === undefined ? {} : { source }) });
    }
    for (const [name, item] of entriesOf(rel, doc)) {
      if (items.has(name)) throw new Error(`${rel}: ${name}: already declared by ${items.get(name).rel}`);
      items.set(name, { name, rel, item, ...(source === undefined ? {} : { source }) });
    }
  }
  return { files, items };
}

const snakeOf = (n) => n.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
const camelOf = (u) => u.toLowerCase().replace(/_([a-z0-9])/g, (_, x) => x.toUpperCase());

/** The four sections of a kernel file that declare items, in their order. */
export const KERNEL_SECTIONS = ['controls', 'tables', 'aggregates', 'constants'];

/** Every top-level key a kernel file may hold, in their order: the four sections and `readouts`, which declares no item. */
export const KERNEL_KEYS = ['controls', 'readouts', 'tables', 'aggregates', 'constants'];

/**
 * The keys a data file of any shape may carry beside its items (docs/contract-dir.md): `$schema`, `requires` (the
 * names of the packages and domains it refers to, no version: the devel wave 2026-11-24), `source` (the file's provenance and connector), `render` (how the
 * owner's own header spells the file's items, docs/render.md) and `checks` (sums held under a bound). They declare no
 * item.
 */
export const FILE_KEYS = ['$schema', 'requires', 'source', 'render', 'checks'];

/** Whether a data file is a kernel file (`kernels/<kernel>.json`), which holds the four sections, never an item map. */
export const isKernelFile = (rel) => /(^|\/)kernels\/[^/]+\.json$/.test(rel);

/**
 * Whether a parsed file is a plugin descriptor (docs/descriptors.md): it carries `origin`, which no item map or kernel
 * file may. A descriptor declares no item.
 */
export const isDescriptor = (doc) => typeof doc === 'object' && doc !== null && !Array.isArray(doc) && Object.hasOwn(doc, 'origin');

/** The kernel's upper-case prefix, read off its file name: `kernels/band_dyn.json` is BAND_DYN. */
export const kernelPrefix = (rel) => rel.replace(/^.*\//, '').replace(/\.json$/, '').toUpperCase().replace(/-/g, '_');

/**
 * Whether a control is a USE: it declares no travel and no ids of its own and takes its values from the item its
 * `global` names, which another control of the same kernel declares (an EQ's low-pass slope takes the slope set its
 * high-pass slope declares). A use adds no item; it is a control of the kernel all the same.
 */
export const isUse = (c) => c && !c.table && c.travel === undefined && c.ids === undefined && typeof c.global === 'string';

/** A control's item name: its `global`, else <KERNEL>_<NAME>_RANGE for a travel and <KERNEL>_<NAME>S for a choice. */
export const controlGlobal = (rel, c) => c.global ?? `${kernelPrefix(rel)}_${snakeOf(c.name)}${c.kind === 'choice' ? 'S' : '_RANGE'}`;

/**
 * A data file's items as [name, item] pairs. A kernel file's four sections are expanded into the items the renders
 * read: a travel control is a `travels` item named by controlGlobal, a choice a `set`; the controls of one `table`
 * regroup into that table's `travels` item with `fields`; an aggregate is regenerated as fields that reference its
 * controls; constants pass through. Any other top-level key of a kernel file is not read (validation names it).
 * rates.json and primitives.json are item maps, read as they are.
 */
export function entriesOf(rel: string, doc: Json): [string, Json][] {
  if (isDescriptor(doc)) return [];
  if (!isKernelFile(rel)) return Object.entries((doc) as Record<string, Json>).filter(([name]) => !FILE_KEYS.includes(name));
  const out: Json[] = [];
  const controls = Array.isArray(doc.controls) ? doc.controls : [];
  const tables = new Map<string, JsonObject>(Object.entries(((doc.tables ?? {}) as Record<string, JsonObject>) as Record<string, Json>).map(([n, meta]) => [n, { kind: 'travels', ...meta, fields: {} }]));
  const placed = new Set();
  for (const c of controls) {
    const { name, kind, global, table, rearms, count, of, when, ...rest } = c;
    if (isUse(c)) continue;
    if (table) {
      if (!tables.has(table)) throw new Error(`${rel}: control ${name} names table ${table}, which is not declared`);
      // a table is an item where its first control stands, so a control after a table keeps its place
      if (!placed.has(table)) { placed.add(table); out.push([table, tables.get(table)]); }
      tables.get(table)!.fields[name] = rest.travel;
      continue;
    }
    out.push([controlGlobal(rel, c), kind === 'choice' ? { kind: 'set', ...rest } : { kind: 'travels', ...rest }]);
  }
  for (const [n, t] of tables) if (!placed.has(n)) out.push([n, t]);
  const byName = new Map(controls.map((c) => [c.name, c]));
  for (const [n, a] of Object.entries(((doc.aggregates ?? {}) as Record<string, JsonObject>) as Record<string, Json>)) {
    const { fields, ...meta } = a;
    out.push([n, { kind: 'travels', ...meta, fields: Object.fromEntries((fields ?? []).map((f) => {
      if (!byName.has(f)) throw new Error(`${rel}: aggregate ${n} names control ${f}, which is not declared`);
      return [f, { ref: controlGlobal(rel, byName.get(f)) }];
    })) }]);
  }
  for (const [n, item] of Object.entries((doc.constants ?? {}) as Record<string, Json>)) out.push([n, item]);
  return out;
}

/** A kernel's name, read off its file name: `kernels/band_dyn.json` is band_dyn. */
export const kernelName = (rel) => rel.replace(/^.*\//, '').replace(/\.json$/, '');

/**
 * Every kernel's controls, in its file's order: `{ <kernel>: { controls: [{ name, kind, global, table?, rearms?, count?, when? }] } }`,
 * kernels in file order. `global` is the item the control's value lives in: its own travel or set, or, for a field of
 * a table, the table (`table` names it too, and the field is the control's name). `rearms` is carried only when true:
 * changing the control re-arms the kernel's state, it is not a smooth parameter. `count` names the item that counts a
 * control the kernel takes once per band (a scalar, or a sheet whose every variant gives its count as `max`). A
 * control that declares `of` is no control of its own but the travel the control it names reaches while the choice
 * `when` names holds the id it names: it is listed under that control's `when` as `{ control, is, global }`.
 */
export function kernelControls(data) {
  const out = {};
  for (const f of data.files) {
    if (!isKernelFile(f.rel) || isDescriptor(f.doc)) continue;
    const controls = Array.isArray(f.doc.controls) ? f.doc.controls : [];
    const global = (c) => c.table ?? controlGlobal(f.rel, c);
    out[kernelName(f.rel)] = {
      controls: controls.filter((c) => c.of === undefined).map((c) => {
        const when = controls.filter((x) => x.of === c.name).map((x) => ({ control: x.when.control, is: x.when.is, global: global(x) }));
        return {
          name: c.name,
          kind: c.kind,
          global: global(c),
          ...(c.table ? { table: c.table } : {}),
          ...(c.rearms === true ? { rearms: true } : {}),
          ...(c.count !== undefined ? { count: c.count } : {}),
          ...(when.length ? { when } : {}),
        };
      }),
    };
  }
  return out;
}

const isWholeRef = (v) => typeof v === 'object' && v !== null && Object.keys(v).length === 1 && typeof v.ref === 'string' && !v.ref.includes('.');

/**
 * The kernel file that declares `entries` ([name, item] pairs, the items entriesOf gives back), the inverse of
 * entriesOf: a single travel is a travel control and a set a choice; a fields table whose every field IS a single
 * travel of the kernel (`{ ref }`) is an aggregate, and its field names name those controls; any other fields table
 * is a table whose fields are its controls; every other item is a constant. A control's `global` is written only
 * when its name does not derive it. `kept`, a kernel file already written, is extended: its declarations stay as
 * they are and the entries it lacks are added. Empty sections are left out.
 * @throws naming the item: a fields table that mixes references and travels, an aggregate field whose name is not
 * its control's.
 */
export function kernelDocOf(rel: string, entries: [string, Json][], kept?: Json): JsonObject {
  const K = kernelPrefix(rel);
  const doc = kept ? JSON.parse(JSON.stringify(kept)) : {};
  doc.controls ??= [];
  for (const s of KERNEL_SECTIONS.slice(1)) doc[s] ??= {};
  const declared = new Set(entriesOf(rel, kept ?? {}).map(([n]) => n));
  const singles = new Map(entries.filter(([, it]) => (it.kind === 'travels' && it.travel) || it.kind === 'set'));
  for (const c of doc.controls) if (!c.table) singles.set(controlGlobal(rel, c), c);
  const isAggregate = (it: Json) => it.kind === 'travels' && it.fields && Object.values((it.fields) as Record<string, Json>).length > 0 && Object.values((it.fields) as Record<string, Json>).every((f) => isWholeRef(f) && singles.get(f.ref)?.travel);
  // an aggregate's field names are its controls' names
  const named = new Map();
  for (const [n, it] of entries) if (isAggregate(it)) for (const [f, t] of Object.entries((it.fields) as Record<string, Json>)) named.set(t.ref, f);
  for (const [n, it] of entries) {
    if (declared.has(n)) continue;
    if ((it.kind === 'travels' && it.travel) || it.kind === 'set') {
      const { kind, ...rest } = it;
      const ck = kind === 'set' ? 'choice' : 'travel';
      const suffix = ck === 'choice' ? 'S' : '_RANGE';
      const derived = n.startsWith(`${K}_`) && n.endsWith(suffix) && n.length > K.length + 1 + suffix.length ? camelOf(n.slice(K.length + 1, -suffix.length)) : undefined;
      const c: JsonObject = { name: named.get(n) ?? derived ?? camelOf(n.endsWith(suffix) ? n.slice(0, -suffix.length) : n), kind: ck };
      if (controlGlobal(rel, c) !== n) c.global = n;
      doc.controls.push({ ...c, ...rest });
    } else if (it.kind === 'travels' && it.fields && isAggregate(it)) {
      const { kind, fields, ...meta } = it;
      doc.aggregates[n] = { ...meta, fields: Object.entries((fields) as Record<string, Json>).map(([f, t]) => {
        const c = doc.controls.find((x) => !x.table && controlGlobal(rel, x) === t.ref) ?? { name: named.get(t.ref) };
        if (c.name !== f) throw new Error(`${rel}: ${n}.${f} refers to ${t.ref}, whose control is named ${c.name}: an aggregate's field is named by its control`);
        return f;
      }) };
    } else if (it.kind === 'travels' && it.fields) {
      const { kind, fields, ...meta } = it;
      if (Object.values((fields) as Record<string, Json>).some(isWholeRef)) throw new Error(`${rel}: ${n} mixes fields that refer to single travels with travels of its own: declare it as an aggregate of controls, or as a table`);
      doc.tables[n] = meta;
      for (const [f, travel] of Object.entries((fields) as Record<string, Json>)) doc.controls.push({ name: f, kind: 'travel', table: n, travel });
    } else {
      doc.constants[n] = it;
    }
  }
  for (const s of KERNEL_SECTIONS) if (s === 'controls' ? !doc[s].length : !Object.keys(doc[s]).length) delete doc[s];
  return doc;
}

/** An item's own value before resolution, by kind. */
export function rawValue(item) {
  switch (item.kind) {
    case 'scalar': return item.value;
    case 'travels': return item.fields ?? item.travel;
    case 'sheet': return item.value;
    case 'list': return item.values;
    case 'set': return item.ids;
    case 'codes': return item.codes;
    case 'words': return item.words;
    case 'terms': return item.terms;
    case 'formatMap': return item.rows;
    case 'verbs': return item.verbs;
    case 'roleMeanings': return item.roles;
    default: return undefined;
  }
}

/** The closed list of derivations. A new one is a change here with its own test. */
export const DERIVATIONS = {
  count: (d, val) => {
    const v = val(typeof d.of === 'string' ? { ref: d.of } : d.of);
    if (!Array.isArray(v)) throw new Error(`count: ${JSON.stringify(d.of)} is not a list`);
    return v.length;
  },
  sqrt: (d, val) => {
    const v = val(d.of);
    if (typeof v !== 'number' || v < 0) throw new Error(`sqrt: ${JSON.stringify(d.of)} is not a non-negative number`);
    return Math.sqrt(v);
  },
  ceilSum: (d, val) => {
    const terms = d.of.map((x) => val(x));
    if (!terms.every((t) => typeof t === 'number' && Number.isFinite(t))) throw new Error(`ceilSum: ${JSON.stringify(d.of)} holds a term that is not a finite number`);
    return Math.ceil(terms.reduce((a, t) => a + t, 0));
  },
  lagrangeReadL1: (d, val) => {
    const order = val(d.order);
    if (!Number.isInteger(order) || order < 1) throw new Error(`lagrangeReadL1: order ${order} is not a positive integer`);
    return lagrangeReadL1(order);
  },
};

/** The taps of the order-`order` Lagrange fractional read at fraction `f` (the fdelay kernel's read). */
export function lagrangeReadTaps(order, f) {
  const off = Math.floor((order - 1) / 2);
  const c: Json[] = [];
  for (let k = 0; k <= order; k++) {
    let num = 1;
    let den = 1;
    for (let j = 0; j <= order; j++) {
      if (j === k) continue;
      num *= f - (j - off);
      den *= k - j;
    }
    c.push(num / den);
  }
  return c;
}

/** The worst L1 norm of the read over 1024 fractions, rounded to 1e-9 (core's readKernelL1Norm). */
export function lagrangeReadL1(order) {
  const FRACTION_STEPS = 1024;
  let worst = 0;
  for (let i = 0; i < FRACTION_STEPS; i++) {
    const l1 = lagrangeReadTaps(order, i / FRACTION_STEPS).reduce((a, c) => a + Math.abs(c), 0);
    if (l1 > worst) worst = l1;
  }
  return Math.round(worst * 1e9) / 1e9;
}

const isObj = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Resolve every item: `{ name, rel, kind, doc, why?, since?, unit?, c?, shape?, default?, labels?, values?, standard?, groups?, axes?, format?, spec?, version?, value }`
 * (default, labels, values and standard: a set's; groups and axes: a words item's; format, spec and version: a terms item's), where `value` has
 * every `{ref}` and `{derive}` evaluated. The returned map also carries `kernels`, every kernel's ordered controls
 * (kernelControls) and, for a kernel that declares them, its ordered `readouts` `{ name, doc, unit, min, max, scale,
 * rateHz }` with every reference resolved, which the json render publishes beside the items; `packageOf`, each item's
 * package (undefined for a data directory), and `kernelPackageOf`, each kernel's; `checks`, every file's checks with its `rel`; and `renders`, every file that carries a `render` word,
 * `{ rel, pkg, render, items, kernel }` with its items' names in file order and, for a kernel file, its kernel.
 * @throws naming the item: a reference that does not resolve, a cycle, an unknown derivation.
 */
/** The resolved items by name, with what a read carries beside them (see resolveData). */
export type Resolved = Map<string, JsonObject> & {
  kernels: JsonObject;
  packageOf: Map<string, string | undefined>;
  ownerOf?: Map<string, string>;
  kernelPackageOf: Map<string, string | undefined>;
  renders: JsonObject[];
  checks?: JsonObject[];
};

export function resolveData(data: Json): Resolved {
  const done = new Map<string, JsonObject>();
  const busy = new Set();
  const lookup = (path, from) => {
    const [head, ...rest] = path.split('.');
    const entry = data.items.get(head);
    if (!entry) throw new Error(`${from}: reference ${path}: no item ${head}`);
    let v = resolveItem(head!).value;
    for (const k of rest) {
      if (!isObj(v) || !(k in v)) throw new Error(`${from}: reference ${path}: ${head} has no ${k}`);
      v = v[k];
    }
    return v;
  };
  const val = (v, from) => {
    if (Array.isArray(v)) return v.map((x) => val(x, from));
    if (!isObj(v)) return v;
    if ('ref' in v) return lookup(v.ref, from);
    if ('derive' in v) {
      const fn = DERIVATIONS[v.derive];
      if (!fn) throw new Error(`${from}: unknown derivation ${v.derive}`);
      try { return fn(v, (x) => val(x, from)); } catch (e) { throw new Error(`${from}: ${(e as Error).message}`); }
    }
    return Object.fromEntries(Object.entries((v) as Record<string, Json>).map(([k, x]) => [k, val(x, from)]));
  };
  function resolveItem(name: string): JsonObject {
    if (done.has(name)) return done.get(name)!;
    if (busy.has(name)) throw new Error(`${name}: reference cycle through ${[...busy].join(' -> ')} -> ${name}`);
    busy.add(name);
    const { rel, item, source } = data.items.get(name);
    const r: JsonObject = { name, rel, kind: item.kind, doc: item.doc };
    // where a render's banner says the item comes from (sourceOf): a domain item's domain document,
    // contract.d/<domain>/<leaf>.json, never the data/<x-file> a rebuild writes it to. Not enumerable: the json render
    // publishes the item's own fields, and its rel stays the file the read took it from.
    if (source !== undefined) Object.defineProperty(r, 'source', { value: source, enumerable: false });
    if (item.why !== undefined) r.why = item.why;
    if (item.since !== undefined) r.since = item.since;
    if (item.unit !== undefined) r.unit = item.unit;
    if (item.c !== undefined) r.c = item.c;
    if (item.docs !== undefined) r.docs = item.docs;
    if (item.kind === 'words') {
      for (const k of ['groups', 'axes', 'units', 'bases', 'dimensions', 'extension']) if (item[k] !== undefined) r[k] = item[k];
    }
    if (item.kind === 'formatMap') r.format = item.format;
    if (item.kind === 'terms') {
      r.format = item.format;
      r.spec = item.spec;
      r.version = item.version;
      if (item.deprecated) r.deprecated = true;
    }
    if (item.kind === 'set') {
      if (item.default !== undefined) r.default = setDefault(item, (v) => val(v, name), name);
      if (item.labels !== undefined) r.labels = item.labels;
      if (item.values !== undefined) r.values = val(item.values, name);
      if (item.standard !== undefined) r.standard = item.standard;
    }
    if (item.kind === 'travels') r.shape = item.fields ? 'table' : 'travel';
    const raw = rawValue(item);
    // a sheet of strings by what it DECLARES (every field a plain string, schema $defs.sheetValue), never by what its
    // references resolve to: a numbers sheet whose refs reach a string stays a numbers sheet, and the finite check
    // names it. Not enumerable: no render publishes it.
    if (item.kind === 'sheet') Object.defineProperty(r, 'strings', { value: isObj(raw) && Object.values(raw).every((v) => typeof v === 'string'), enumerable: false });
    r.value = val(raw, name);
    busy.delete(name);
    done.set(name, r);
    return r;
  }
  const out = new Map() as Resolved;
  for (const name of data.items.keys()) out.set(name, resolveItem(name));
  out.kernels = kernelControls(data);
  out.packageOf = new Map([...data.items.values()].map((it) => [it.name, it.pkg]));
  // an installed domain's items are read at run time and never render into a package's files, except omx-contract's
  // own TREE_DOMAINS, which its data read takes beside data/: those render into omx-contract's package (packageItems)
  out.ownerOf = new Map([...((data.packages ?? new Map()) as Map<string, Json>)].filter(([n, p]) => TREE_DOMAINS.includes(n) && p.manifest?.owner === 'omx-contract').map(([n, p]) => [n, p.manifest.owner]));
  out.kernelPackageOf = new Map(data.files.filter((f) => isKernelFile(f.rel) && !isDescriptor(f.doc)).map((f) => [kernelName(f.rel), f.pkg]));
  out.renders = data.files.filter((f) => !isDescriptor(f.doc) && isObj(f.doc.render)).map((f) => ({
    rel: f.rel, pkg: f.pkg, render: f.doc.render, items: entriesOf(f.rel, f.doc).map(([n]) => n), kernel: isKernelFile(f.rel) ? kernelName(f.rel) : undefined,
  }));
  out.checks = data.files.filter((f) => !isDescriptor(f.doc) && Array.isArray(f.doc.checks)).flatMap((f) => f.doc.checks.map((c) => ({ ...c, rel: f.rel, pkg: f.pkg })));
  for (const f of data.files) {
    if (!isKernelFile(f.rel) || isDescriptor(f.doc) || !Array.isArray(f.doc.readouts)) continue;
    out.kernels[kernelName(f.rel)].readouts = f.doc.readouts.map((ro) => {
      const from = `${kernelName(f.rel)}.readouts.${ro.name}`;
      return { name: ro.name, doc: ro.doc, unit: ro.unit, min: val(ro.min, from), max: val(ro.max, from), scale: ro.scale, rateHz: val(ro.rateHz, from) };
    });
  }
  return out;
}

/** Where a render's banner says a resolved item comes from: its domain's document for a domain item, else its data file. */
export const sourceOf = (r: JsonObject): string => (r.source ?? r.rel) as string;

/**
 * The resolved items of one package of a contract directory, in their order, with its kernels, packageOf and renders
 * cut to it: what an owner renders of its own (`render --package`). Every reference stays resolved over the whole
 * read. A data directory (no package on any file) is the package named, whole.
 */
export function packageItems(resolved: Resolved, pkg: string | undefined): Resolved {
  // an item of one of omx-contract's TREE_DOMAINS is omx-contract's own (resolveData's ownerOf)
  const own = (p: string | undefined) => p === undefined || p === pkg || (resolved.ownerOf?.get(p) ?? p) === pkg;
  const out = new Map([...resolved].filter(([n]) => own(resolved.packageOf.get(n)))) as Resolved;
  const mine = (p: string | undefined) => p === undefined || p === pkg;
  out.kernels = Object.fromEntries(Object.entries((resolved.kernels ?? {}) as Record<string, Json>).filter(([k]) => mine(resolved.kernelPackageOf.get(k))));
  out.packageOf = new Map([...resolved.packageOf].filter(([n]) => out.has(n)));
  out.kernelPackageOf = new Map([...resolved.kernelPackageOf].filter(([k]) => k in out.kernels));
  out.renders = (resolved.renders ?? []).filter((f) => f.pkg === undefined || f.pkg === pkg);
  return out;
}

/**
 * A set's default, resolved: an id as written, or `{ ref }` to the scalar that states it. A boolean scalar names the
 * second id of a two-id switch when true and the first when false (a delay's ping-pong switch takes its default from
 * the boolean come-up scalar, so the come-up value keeps one home).
 * @throws naming the set: a boolean default of a set that is not two ids.
 */
export function setDefault(item, val, name) {
  if (!isObj(item.default)) return item.default;
  const v = val(item.default);
  if (typeof v !== 'boolean') return v;
  if (item.ids.length !== 2) throw new Error(`${name}: a boolean default needs a two-id switch, not ${item.ids.length} ids`);
  return item.ids[v ? 1 : 0];
}

/** The package version (package.json), which names the tag, the release and the npm version. */
export function packageVersion(root) {
  return JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
}
