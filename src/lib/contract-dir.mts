// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * The contract directory (docs/contract-dir.md): `<contractdir>/<package>/` beside `<contractdir>/<domain>/`, with no
 * schema-major level (owner ruling 2026-11-25), each package's files listed with their hashes in its MANIFEST.json and
 * the schema major read from the documents. loadContractDir() reads it whole or refuses: any refusal is a
 * ContractRefusal carrying a CONTRACT_CODES code, and nothing is returned, so a reader never holds a partial set.
 * What it returns has the shape of loadData(), so validate, fmt and every render read it as they read `data/`.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { refuse } from './codes.mjs';
import { entriesOf, isDescriptor, isKernelFile, isUse, kernelName } from './data.mjs';
import { SCHEMA_VERSION, fileProblems, useProblems } from './validate.mjs';
import { verbProblems } from './verbs.mjs';
import { roleProblems } from './role-meanings.mjs';
import { readCatalogs } from './domain-reader.mjs';
import { parseStrict } from './json-strict.mjs';
import { DOMAIN_NAME, checkItemPrefixes, domainDataFiles, domainFroms, domainLeaf, domainPath, domainRequires, readDomain, requiresNames } from './domain.mjs';
import type { DomainCodes, DomainItems } from './domain.mjs';
import { fromDifference, fromDifferences } from './word-from.mjs';
import type { Json, JsonObject } from './json.mjs';

/** The schema major this reader reads: a manifest's `schemaMajor` and a file's `$schema` must state it. */
export const SCHEMA_MAJOR = Number(SCHEMA_VERSION.split('.')[0]);

/** The package whose files are read by the schema they ship with, and whose items every file may refer to. */
export const SCHEMA_PACKAGE = 'omx-contract';

/** The `$schema` an installed file carries: the schema of its major, by URL. */
export const installedSchemaUrl = (major) => `https://openmixer.org/schema/omx-contract/v${major}/omx-contract.schema.json`;
// the schema a contract file names: its id on openmixer.org, which this package writes
const INSTALLED_SCHEMA = /^https:\/\/openmixer\.org\/schema\/omx-contract\/v(\d+)\/omx-contract\.schema\.json$/;

const VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const FLOOR = /^>= ((0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*))$/;
const HASH = /^[0-9a-f]{64}$/;
const FILE_REL = /^[A-Za-z0-9_+.-]+(\/[A-Za-z0-9_+.-]+)*\.json$/;

/** Whether version `v` is at least version `floor`, both x.y.z. */
export function atLeast(v, floor) {
  const a = v.split('.').map(Number);
  const b = floor.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
}

/** The x.y.z of a floor `>= x.y.z`, or undefined when it is not one. */
export const floorOf = (s) => (typeof s === 'string' ? FLOOR.exec(s)?.[1] : undefined);

/** The sha256 of a file's bytes, as the manifest lists it. */
export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

/**
 * The directories that stand where `contractdir` stands, in their order: `dir` (a path or a list) when given, else
 * `$OMX_CONTRACT_PATH` (a `:` list), else `pkg-config --variable=contractdir omx-contract`.
 * @throws contract.dir.absent when none is found, or one named does not exist.
 */
/** Where the contract directory is read from: `dir` (one or a list), else `env.OMX_CONTRACT_PATH`, else pkg-config. */
export interface ContractRootsOptions {
  readonly dir?: string | readonly string[];
  readonly env?: NodeJS.ProcessEnv;
  readonly pkgConfig?: string;
}

/** What `loadContractDir` reads, and what the consumer requires: `needs` as `{ <package>: '>= x.y.z' }`. */
export interface LoadContractDirOptions extends ContractRootsOptions {
  readonly needs?: Readonly<Record<string, string>>;
  readonly major?: number;
  /**
   * The domains read in their data form (docs/render.md, `render --installed --with-domain`, repeatable): each its
   * document `doc`, named `name`, at `path`. The data files each rebuilds (domainDataFiles) join the installed package
   * its `info.x-owner` names, so two domains of one owner (an item of one naming an item of the other) rebuild into one
   * package; a domain directory of one of these names in the roots is not also read as a domain.
   */
  readonly withDomains?: readonly { readonly name: string; readonly doc: JsonObject; readonly path: string }[];
}

/** One file of the read: its reported path, text and document, its package and installed path. */
export interface ContractFile {
  readonly rel: string;
  readonly text: string;
  readonly doc: JsonObject;
  readonly pkg: string;
  readonly path: string;
  readonly installed: true;
}

/** One item of the read, by name: where it is declared and by which package. */
export interface ContractItem {
  readonly name: string;
  readonly rel: string;
  readonly item: JsonObject;
  readonly pkg: string;
}

/** One installed package of the read: its name, directory and manifest. */
export interface ContractPackage {
  readonly name: string;
  readonly dir: string;
  readonly manifest: JsonObject;
  /** A domain's items marked `x-c-codes` (docs/render.md); absent for a package of the other layout. */
  readonly codes?: DomainCodes;
}

export function contractRoots({ dir, env = process.env, pkgConfig = 'pkg-config' }: ContractRootsOptions = {}): string[] {
  let roots;
  let from;
  if (dir !== undefined) { roots = [dir].flat(); from = '--contract-dir'; }
  else if (env.OMX_CONTRACT_PATH) { roots = env.OMX_CONTRACT_PATH.split(':').filter(Boolean); from = 'OMX_CONTRACT_PATH'; }
  else {
    from = 'pkg-config';
    try {
      roots = [execFileSync(pkgConfig, ['--variable=contractdir', 'omx-contract'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()].filter(Boolean);
    } catch { roots = []; }
  }
  if (!roots.length) refuse('dirAbsent', from, 'no contract directory: neither --contract-dir, OMX_CONTRACT_PATH nor pkg-config names one');
  for (const r of roots) if (!existsSync(r) || !statSync(r).isDirectory()) refuse('dirAbsent', r, `the contract directory ${r} (from ${from}) does not exist`);
  return roots;
}

/** Every file under `dir`, relative to it with `/`, sorted. */
function filesUnder(dir) {
  const out: Json[] = [];
  const walk = (d) => {
    for (const f of readdirSync(d).sort()) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else out.push(relative(dir, p).split(sep).join('/'));
    }
  };
  walk(dir);
  return out.sort();
}

/**
 * The files of a package's directory that are its own, the manifest's to list (docs/contract-dir.md, "One name, one
 * directory"): every file under it less MANIFEST.json, the domain of its name (`<name>.json` and `catalogs/`) and each
 * nested domain (a subdirectory `<d>/` holding its `<last segment>.json`, which the manifest does not list).
 * @throws contract.manifest.mismatch for an owner file in a domain's place: named `<name>.json`, under `catalogs/`
 * beside the domain's document, or inside a nested domain.
 */
function packageFiles(pdir: string, name: string, listed: string[]): string[] {
  if (listed.includes(`${name}.json`)) refuse('manifestMismatch', `${name}/${name}.json`, `an owner data file named ${name}.json: that is the place of the domain ${name}'s document, and a package never lists it`);
  const domain = existsSync(join(pdir, `${name}.json`));
  for (const f of listed) if (domain && f.startsWith('catalogs/')) refuse('manifestMismatch', `${name}/${f}`, `an owner data file under catalogs/, beside the domain ${name}'s document: catalogs/ is the domain's`);
  const nested: string[] = [];
  const walk = (rel: string) => {
    for (const f of readdirSync(join(pdir, rel)).sort()) {
      const r = rel ? `${rel}/${f}` : f;
      if (!statSync(join(pdir, r)).isDirectory()) continue;
      if (existsSync(join(pdir, r, `${f}.json`)) && !listed.includes(`${r}/${f}.json`)) nested.push(r);
      else walk(r);
    }
  };
  walk('');
  for (const f of listed) {
    const n = nested.find((d) => f.startsWith(`${d}/`));
    if (n !== undefined) refuse('manifestMismatch', `${name}/${f}`, `an owner data file inside the nested domain ${name}/${n}: a nested domain's directory is the domain's`);
  }
  return filesUnder(pdir).filter((f) => f !== 'MANIFEST.json'
    && !(domain && (f === `${name}.json` || (f.startsWith('catalogs/') && f.endsWith('.json'))))
    && !nested.some((d) => f.startsWith(`${d}/`)));
}

/** One package's manifest, checked against its place. */
function readManifest(pdir, name, major) {
  const at = `${name}/MANIFEST.json`;
  const p = join(pdir, 'MANIFEST.json');
  if (!existsSync(p)) refuse('manifestAbsent', name, `${pdir} holds no MANIFEST.json`);
  let m;
  try { m = JSON.parse(readFileSync(p, 'utf8')); } catch (e) { refuse('manifestInvalid', at, `not JSON: ${(e as Error).message}`); }
  if (typeof m !== 'object' || m === null || Array.isArray(m)) refuse('manifestInvalid', at, 'not an object');
  const known = ['package', 'version', 'schemaMajor', 'tree', 'files', 'domains'];
  for (const k of Object.keys(m)) if (!known.includes(k)) refuse('manifestInvalid', at, `unknown key ${k}: a manifest holds ${known.join(', ')}`);
  if (m.package !== name) refuse('manifestInvalid', at, `names the package ${JSON.stringify(m.package)}, and sits in ${name}/`);
  if (typeof m.version !== 'string' || !VERSION.test(m.version)) refuse('manifestInvalid', at, `version ${JSON.stringify(m.version)} is not x.y.z`);
  if (!Number.isInteger(m.schemaMajor) || m.schemaMajor < 0) refuse('manifestInvalid', at, `schemaMajor ${JSON.stringify(m.schemaMajor)} is not a schema major`);
  if (m.schemaMajor !== major) refuse('schemaMajor', at, `the manifest states schema major ${m.schemaMajor}; this reader reads ${major}`);
  if (m.tree !== undefined && (typeof m.tree !== 'string' || !/^[A-Za-z0-9_+.-]+(\/[A-Za-z0-9_+.-]+)*$/.test(m.tree) || m.tree.split('/').includes('..'))) {
    refuse('manifestInvalid', at, `tree ${JSON.stringify(m.tree)} is not a relative directory`);
  }
  // a domain-only owner (install-contract-dir.sh --owner): no data file, `domains` the domains its contract is
  if (m.domains !== undefined && (!Array.isArray(m.domains) || !m.domains.length || m.domains.some((d) => typeof d !== 'string' || !DOMAIN_NAME.test(d)) || new Set(m.domains).size !== m.domains.length)) {
    refuse('manifestInvalid', at, `domains ${JSON.stringify(m.domains)} is not a list of at least one domain name, each once`);
  }
  if (typeof m.files !== 'object' || m.files === null || Array.isArray(m.files)) refuse('manifestInvalid', at, 'files is not a map of files');
  if (!Object.keys(m.files).length && m.domains === undefined) refuse('manifestInvalid', at, 'files is not a map of at least one file, and no domains are listed (a package of domains only is installed with --owner)');
  for (const [rel, h] of Object.entries(m.files)) {
    if (!FILE_REL.test(rel) || rel.split('/').some((s) => s === '..' || s === '.') || rel === 'MANIFEST.json') refuse('manifestInvalid', at, `${JSON.stringify(rel)} is not a relative .json path`);
    if (typeof h !== 'string' || !HASH.test(h)) refuse('manifestInvalid', at, `${rel}: ${JSON.stringify(h)} is not a sha256`);
  }
  return m;
}

/**
 * A descriptor's latency refs (`frames`, `sweep.min`, `sweep.max`) name a scalar item whose unit is frames or ms, and a
 * sweep whose ends are in one unit (an integer is frames) and in order (docs/descriptors.md, `latency`). An unresolved ref is
 * the reference loop's: it is skipped here.
 */
function latencyRefs(rel, doc, items) {
  const lat = doc.latency;
  if (typeof lat !== 'object' || lat === null) return;
  const scalarOf = (v, where) => {
    if (typeof v !== 'object' || v === null || typeof v.ref !== 'string') return undefined;
    const target = items.get(v.ref.split('.')[0]);
    if (!target) return undefined;
    const it = target.item;
    if (v.ref.includes('.') || it?.kind !== 'scalar' || (it.unit !== 'frames' && it.unit !== 'ms')) {
      refuse('descriptorLatency', rel, `${where}: refers to ${v.ref}, which is no scalar in frames or ms`);
    }
    return it;
  };
  scalarOf(lat.frames, 'latency.frames');
  const lo = scalarOf(lat.sweep?.min, 'latency.sweep.min');
  const hi = scalarOf(lat.sweep?.max, 'latency.sweep.max');
  // an integer end is frames: a sweep of two units has no order to read, so it is refused too
  const unitOf = (end, it) => (typeof end === 'number' ? 'frames' : it?.unit);
  const uMin = unitOf(lat.sweep?.min, lo);
  const uMax = unitOf(lat.sweep?.max, hi);
  if (uMin && uMax && uMin !== uMax) {
    refuse('descriptorLatency', rel, `latency.sweep: min is in ${uMin} and max in ${uMax}; both ends are in one unit`);
  }
  if (lo && hi && lo.unit === hi.unit && typeof lo.value === 'number' && typeof hi.value === 'number' && lo.value > hi.value) {
    refuse('descriptorLatency', rel, `latency.sweep: min ${lat.sweep.min.ref} (${lo.value} ${lo.unit}) is above max ${lat.sweep.max.ref} (${hi.value} ${hi.unit})`);
  }
}

/** Every `{ ref }` head, `count` derivation and control count a file's items name, as [name, where]. */
function referencesOf(rel, doc) {
  const out: Json[] = [];
  const walk = (v, where) => {
    if (Array.isArray(v)) { v.forEach((x) => walk(x, where)); return; }
    if (typeof v !== 'object' || v === null) return;
    if (typeof v.ref === 'string') out.push([v.ref.split('.')[0], where]);
    if (v.derive === 'count' && typeof v.of === 'string') out.push([v.of, where]);
    for (const [k, x] of Object.entries(v)) if (k !== 'ref') walk(x, where);
  };
  for (const [name, item] of entriesOf(rel, doc)) walk(item, name);
  if (isDescriptor(doc)) {
    for (const c of Array.isArray(doc.controls) ? doc.controls : []) {
      if (typeof c.count === 'string') out.push([c.count, c.name]);
      walk(c.travel, c.name);
    }
    walk(doc.latency, 'latency');
  } else if (isKernelFile(rel)) {
    for (const c of Array.isArray(doc.controls) ? doc.controls : []) {
      if (typeof c.count === 'string') out.push([c.count, c.name]);
      // a use names the item it takes, which another kernel may declare (a shared set)
      if (isUse(c)) out.push([c.global, c.name]);
      walk(c.travel, c.name);
    }
    for (const ro of Array.isArray(doc.readouts) ? doc.readouts : []) walk(ro, `readouts.${ro.name}`);
  }
  return out;
}

/**
 * Read the contract directory: `{ files, items, packages, roots }`, `files` and `items` in loadData's shape (each
 * file with `pkg`, `path` and `installed: true`, each item with `pkg`), files in the order of their reported path
 * (`<manifest tree>/<file>`, else `<package>/<file>`), `packages` a Map of package name to its manifest and dir.
 * `needs` is what the consumer requires, `{ <package>: '>= x.y.z' }`. A file's `requires` names packages, no version (the devel wave 2026-11-24).
 * @throws ContractRefusal, the first refusal met; see docs/contract-dir.md for the order.
 */
export function loadContractDir({ dir, env, pkgConfig, needs = {}, major = SCHEMA_MAJOR, withDomains = [] }: LoadContractDirOptions = {}): {
  files: ContractFile[];
  items: Map<string, ContractItem>;
  packages: Map<string, ContractPackage>;
  roots: string[];
} {
  const roots = contractRoots({ dir, env, pkgConfig });
  const packages = new Map();
  // a package is <root>/<name>/MANIFEST.json, one level down, beside the domains (no schema-major level, 2026-11-25)
  for (const root of roots) {
    for (const name of readdirSync(root).sort()) {
      const pdir = join(root, name);
      if (!statSync(pdir).isDirectory()) continue;
      if (/^\d+$/.test(name)) refuse('schemaMajor', `${name}/`, `${pdir} is a schema-major directory, the layout before 2026-11-25: the contract directory has no major level, and nothing under it is read`);
      if (packages.has(name) || !DOMAIN_NAME.test(name) || !existsSync(join(pdir, 'MANIFEST.json'))) continue;
      const manifest = readManifest(pdir, name, major);
      // before the domain read, which would take it for the domain's document (docs/contract-dir.md, "One name, one directory")
      if (Object.keys(manifest.files).includes(`${name}.json`)) refuse('manifestMismatch', `${name}/${name}.json`, `an owner data file named ${name}.json: that is the place of the domain ${name}'s document, and a package never lists it`);
      const owned = Object.keys(manifest.files).find((f) => f.startsWith('catalogs/'));
      if (owned !== undefined && existsSync(join(pdir, `${name}.json`))) refuse('manifestMismatch', `${name}/${owned}`, `an owner data file under catalogs/, beside the domain ${name}'s document: catalogs/ is the domain's`);
      packages.set(name, { name, dir: pdir, manifest });
    }
  }
  // a domain (docs/contract-dir.md): <root>/<domain>/<domain>.json, read as the classic file of its items
  const domainFiles: Json[] = [];
  const domainItems: DomainItems[] = [];
  // the packages each domain read declares in info.x-requires, held to be in the read once every package is known
  const declared: { at: string; requires: string[] }[] = [];
  // each domain of the read: its document, the package its items are read as, and whether it is rebuilt (--with-domain)
  const domains = new Map<string, { doc: Json; pkg: string; rebuilt: boolean }>();
  for (const root of roots) {
    for (const name of readdirSync(root).sort()) {
      const ddir = join(root, name);
      // the first root that holds a domain wins, as for a package
      if (!DOMAIN_NAME.test(name) || !statSync(ddir).isDirectory() || domains.has(name) || withDomains.some((w) => w.name === name)) continue;
      const path = join(ddir, `${domainLeaf(name)}.json`);
      const at = domainPath(name);
      // one name, one directory: MANIFEST.json marks the package, <name>.json the domain; a package directory with no
      // <name>.json (plugin-hostd's, of nested domains) holds no domain of its own name (ruling %4 2026-11-24)
      const shared = existsSync(join(ddir, 'MANIFEST.json'));
      if (!existsSync(path) && shared) continue;
      if (!existsSync(path)) refuse('manifestAbsent', name, `${ddir} holds no MANIFEST.json and no ${domainLeaf(name)}.json`);
      // beside a package, the package's own files are its manifest's check; alone, the document and catalogs are all
      if (!shared) {
        const present = filesUnder(ddir).filter((f) => !(f.startsWith('catalogs/') && f.endsWith('.json')));
        if (present.length !== 1) refuse('manifestMismatch', at, `a domain directory holds its one document, and ${present.filter((f) => f !== `${domainLeaf(name)}.json`).join(', ')} is beside it`);
      }
      // the catalogs are read as the runtime readers read them (lib/domain-reader.mjs), and each is also a classic catalog
      for (const c of readCatalogs(ddir, name)) {
        const f = `${name}/catalogs/${c.lang}.json`;
        const cat = JSON.parse(readFileSync(join(ddir, 'catalogs', `${c.lang}.json`), 'utf8'));
        if (cat.kind !== 'catalog' || typeof cat.owner !== 'string') refuse('catalogInvalid', f, 'a domain catalog is { kind: "catalog", lang: <its file name>, owner, messages }');
      }
      const text = readFileSync(path, 'utf8');
      let raw;
      try { raw = parseStrict(text); } catch (e) { refuse('fileNotJson', at, (e as Error).message); }
      if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) refuse('fileInvalid', at, 'a domain document is an object');
      const d = readDomain(name, raw, installedSchemaUrl(major), major);
      const file = { rel: at, text, doc: d.doc, pkg: name, path, installed: true, source: `contract.d/${at}` };
      const problems = fileProblems(file);
      if (problems.length) refuse('fileInvalid', at, problems.map((p) => `${p.item}: ${p.rule}: ${p.message}`).join('; '));
      // a domain named like a package shares its directory and is that package's (ruling V16): read beside it, never
      // skipped (#125), and the name stays the package's (#190)
      const pkg = packages.get(name);
      if (pkg === undefined) packages.set(name, { name, dir: ddir, manifest: d.manifest, codes: d.codes });
      else if (d.manifest.owner !== name) refuse('manifestMismatch', at, `the domain ${name} shares ${name}/ with the package ${name}, and its info.x-owner is ${d.manifest.owner}: two owners in one directory, and a domain named like a package is that package's`);
      else if (!Object.keys(pkg.manifest.files).length) pkg.codes = d.codes;
      declared.push({ at, requires: domainRequires(raw) });
      domains.set(name, { doc: raw, pkg: name, rebuilt: false });
      domainFiles.push(file);
      domainItems.push({ rel: at, items: d.names });
    }
  }
  checkItemPrefixes(domainItems);
  if (!packages.size) refuse('dirAbsent', roots.join(':'), `no package and no domain is installed in ${roots.join(':')}`);

  const files: Json[] = [];
  for (const { name, dir: pdir, manifest } of packages.values()) {
    if (manifest.files === undefined) continue; // a domain: its one document is read above
    const listed = Object.keys(manifest.files);
    const present = packageFiles(pdir, name, listed);
    for (const f of present) if (!listed.includes(f)) refuse('manifestMismatch', `${name}/${f}`, 'present in the package directory, and its manifest does not list it');
    for (const f of listed.sort()) {
      const at = `${name}/${f}`;
      if (!present.includes(f)) refuse('manifestMismatch', at, 'listed by the manifest, and not installed');
      const bytes = readFileSync(join(pdir, f));
      if (sha256(bytes) !== manifest.files[f]) refuse('manifestMismatch', at, `sha256 ${sha256(bytes)}, and the manifest lists ${manifest.files[f]}`);
      const text = bytes.toString('utf8');
      let doc;
      try { doc = JSON.parse(text); } catch (e) { refuse('fileNotJson', at, (e as Error).message); }
      if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) refuse('fileInvalid', at, 'a data file is an object');
      const m = INSTALLED_SCHEMA.exec(doc.$schema ?? '');
      if (!m) refuse('schemaMajor', at, `$schema ${JSON.stringify(doc.$schema)} is not ${installedSchemaUrl(major)}`);
      const named = m[1];
      if (Number(named) !== major) refuse('schemaMajor', at, `$schema names schema major ${named}; this reader reads ${major}`);
      requiresNames(doc.requires, (m) => refuse('fileInvalid', at, `requires ${m}`));
      if (isDescriptor(doc) && doc.origin === 'scanned') refuse('originMisplaced', at, 'a scanned plugin descriptor: what a machine found about itself is no declaration, and is never installed');
      const rel = `${manifest.tree ?? name}/${f}`;
      const file = { rel, text, doc, pkg: name, path: join(pdir, f), installed: true };
      const problems = fileProblems(file);
      // A descriptor's own rules carry their code; everything else a file can break is contract.file.invalid.
      const coded = problems.find((p) => p.name);
      if (coded) refuse(coded.name, at, problems.filter((p) => p.name === coded.name).map((p) => `${p.item}: ${p.message}`).join('; '));
      if (problems.length) refuse('fileInvalid', at, problems.map((p) => `${p.item}: ${p.rule}: ${p.message}`).join('; '));
      files.push(file);
    }
  }
  for (const withDomain of withDomains) {
    files.push(...rebuiltFiles(withDomain, packages, files, major));
    declared.push({ at: `${domainPath(withDomain.name)} (--with-domain)`, requires: domainRequires(withDomain.doc) });
    domains.set(withDomain.name, { doc: withDomain.doc, pkg: (withDomain.doc.info as Json)['x-owner'], rebuilt: true });
  }
  files.push(...domainFiles);
  files.sort((a, b) => (a.rel === b.rel ? (a.pkg < b.pkg ? -1 : 1) : a.rel < b.rel ? -1 : 1));

  const items = new Map();
  for (const f of files) {
    for (const [name, item] of entriesOf(f.rel, f.doc)) {
      if (items.has(name)) {
        const o = items.get(name);
        refuse('itemDuplicate', `${f.rel} (${f.pkg})`, `${name}: already declared by ${o.pkg} (${o.rel})`);
      }
      items.set(name, { name, rel: f.rel, item, pkg: f.pkg, ...(f.source === undefined ? {} : { source: f.source }) });
    }
  }

  // A kernel is one file: its controls are read in that file's order, so a second package's file of the same kernel,
  // even with names of its own, would replace its controls in the kernels index.
  const kernels = new Map();
  for (const f of files) {
    if (!isKernelFile(f.rel) || isDescriptor(f.doc)) continue;
    const k = kernelName(f.rel);
    if (kernels.has(k)) refuse('kernelDuplicate', `${f.rel} (${f.pkg})`, `kernel ${k}: already declared by ${kernels.get(k)}`);
    kernels.set(k, `${f.pkg} (${f.rel})`);
  }

  // the package that owns `pkg`: a domain's info.x-owner, a package itself
  const ownerOf = (pkg) => packages.get(pkg)?.manifest.owner ?? pkg;
  // the domains rebuilt into a package: a file of it may name one in its requires, and it is in the read
  const rebuiltDomain = (pkg) => { const d = domains.get(pkg); return d?.rebuilt ? d : undefined; };
  for (const f of files) {
    // an installed domain's file requires what its info.x-requires names: packages and domains
    const own = domains.get(f.pkg);
    const req = new Set<string>([...(f.doc.requires ?? []), ...(own && !own.rebuilt ? domainRequires(own.doc) : [])]);
    for (const [name, where] of referencesOf(f.rel, f.doc)) {
      const target = items.get(name);
      if (!target) refuse('refUnresolved', f.rel, `${where}: refers to ${name}, which no installed file declares`);
      // omx-contract's items, its data's or a domain's it owns, are every package's to name
      if (target.pkg !== f.pkg && target.pkg !== SCHEMA_PACKAGE && ownerOf(target.pkg) !== SCHEMA_PACKAGE && !req.has(target.pkg)) {
        refuse('refUndeclared', f.rel, `${where}: refers to ${name} of ${target.pkg}, which its requires does not name`);
      }
    }
    for (const pkg of req) if (rebuiltDomain(pkg) === undefined) checkPackage(packages, pkg, f.rel);
    if (isDescriptor(f.doc)) latencyRefs(f.rel, f.doc, items);
  }
  // A domain-only owner's domains (its manifest's `domains`): each in the read, installed or rebuilt.
  for (const { name, manifest } of packages.values()) {
    for (const d of Array.isArray(manifest.domains) ? manifest.domains : []) {
      if (!domains.has(d)) refuse('manifestMismatch', `${name}/MANIFEST.json`, `lists the domain ${d}, which is not installed`);
    }
  }
  // A domain's declared packages (info.x-requires): in the read, installed or rebuilt; no version is held (the devel wave 2026-11-24).
  for (const { at, requires } of declared) {
    for (const pkg of requires) if (rebuiltDomain(pkg) === undefined) checkPackage(packages, pkg, at);
  }
  // A word's x-from (docs/contract-dir.md, "Domains"): a term of a terms item or a word of a words item (by its title),
  // of the package or domain its $ref names, which is omx-contract, the domain, its owner or one info.x-requires
  // declares (held to be in the read above), resolved here when that package or domain is in the read. A rebuilt domain's
  // own words are its owner's; of a rebuilt domain only the words it rebuilds are in the read.
  for (const [name, { doc, pkg, rebuilt }] of domains) {
    const owner = (doc.info as Json)['x-owner'];
    const allowed = new Set([name, owner, SCHEMA_PACKAGE, ...domainRequires(doc)]);
    for (const f of domainFroms(doc, { rebuilt })) {
      const where = `${domainPath(name)}: ${f.where} of the word ${JSON.stringify(f.word)}`;
      const ref = `${f.item}#${f.term}`;
      if (!allowed.has(f.to)) refuse('refUndeclared', where, `takes ${ref} from ${f.to}, which the domain's info.x-requires does not declare (it may take from omx-contract, ${name}, its owner ${owner} and the packages x-requires names)`);
      const want = f.to === name ? pkg : domains.get(f.to)?.pkg ?? f.to;
      const target = items.get(f.item);
      // a package outside the read (omx-contract's data, an owner not installed beside its domain) is validate's to
      // look for (rule word-from), as it always was; a declared one is in the read, held above. An item of
      // the read is never taken for it: that item is the package's that declares it.
      if (!packages.has(want)) {
        if (target) refuse('refUndeclared', where, `takes ${ref} from ${f.to}, which is not in the read, and ${f.item} is declared by ${target.pkg}, not by ${want}`);
        continue;
      }
      if (!target) {
        const s = ((domains.get(f.to)?.doc.components as Json)?.schemas as Json)?.[f.item];
        const kind = s === undefined ? undefined : s['x-kind'] ?? ('properties' in s ? 'range' : 'oneOf' in s ? 'codes' : 'unknown');
        if (kind !== undefined) refuse('refUnresolved', where, `takes ${ref} from ${f.to}, and ${f.item} is a ${kind} item of ${f.to}, no words item: a from takes a word of a words item or a term of a terms item`);
        refuse('refUnresolved', where, `takes ${ref} from ${f.to}, and no installed file declares ${f.item}`);
      }
      if (target.pkg !== want) refuse('refUndeclared', where, `takes ${ref} from ${f.to}, and ${f.item} is declared by ${target.pkg}, not by ${want}`);
      const kind = target.item.kind;
      const keys = kind === 'terms' ? target.item.terms : kind === 'words' ? target.item.words : undefined;
      if (keys === undefined) refuse('refUnresolved', where, `takes ${ref} from ${f.to}, and ${f.item} is a ${kind} item, no words or terms item`);
      if (!Object.hasOwn(keys, f.term)) refuse('refUnresolved', where, `takes ${ref} from ${f.to}, and ${f.item} of ${f.to} has no ${kind === 'terms' ? 'term' : 'word titled'} ${f.term}`);
      // a word taken from a word is that word (word-from-differs, lib/word-from.mjs); a term is not compared
      if (kind === 'words') {
        const tw = keys[f.term];
        const [d] = fromDifferences({ word: f.word, code: f.code, doc: f.doc, text: f.text }, { word: tw.word, code: Object.keys(keys).indexOf(f.term), doc: tw.doc, text: tw.text?.en });
        if (d) refuse('fileInvalid', where, `word-from-differs: takes ${ref} from ${f.to}, and ${fromDifference(d)}`);
      }
    }
  }
  // A use (a control taking another control's item, its own kernel's or another's) takes an item of its own kind.
  const [use] = useProblems({ files, items });
  if (use) refuse('refUnresolved', use.rel, `${use.item}: ${use.message}`);
  // A verb has one owner, starts its format with its word, names known hosts and refusals that exist (lib/verbs.mjs).
  const [verb] = verbProblems(items);
  if (verb) refuse(verb.name, verb.rel, `${verb.item}: ${verb.message}`);
  // A role has one owner (lib/role-meanings.mjs).
  const [role] = roleProblems(items);
  if (role) refuse(role.name, role.rel, `${role.item}: ${role.message}`);
  for (const [pkg, v] of Object.entries(needs)) {
    if (!floorOf(v)) refuse('fileInvalid', 'needs', `${pkg} ${JSON.stringify(v)} is not a floor ">= x.y.z"`);
    checkPackage(packages, pkg, 'needs');
    const have = packages.get(pkg).manifest.version;
    if (!atLeast(have, floorOf(v))) refuse('packageTooOld', 'needs', `requires ${pkg} ${v}, and ${have} is installed`);
  }
  return { files, items, packages, roots };
}

/**
 * The data files the domain `withDomain` rebuilds (docs/render.md), as files of the installed package its
 * `info.x-owner` names, each at the place the package's own file would have (`<manifest tree or package>/<x-file>`).
 * @throws ContractRefusal contract.package.absent when that package is not installed, contract.manifest.mismatch for a
 * file it both installs and rebuilds, contract.file.invalid for a rebuilt file the schema refuses.
 */
function rebuiltFiles({ name, doc, path }, packages, installed, major): ContractFile[] {
  const d = readDomain(name, doc, installedSchemaUrl(major), major);
  const owner = d.manifest.owner as string;
  // an owner that is not installed is built from its domains alone (a domain-only owner), at the domain's version
  if (!packages.has(owner)) packages.set(owner, { name: owner, manifest: { package: owner, version: (doc.info as Json).version, schemaMajor: major, files: {}, domains: [] } });
  const p = packages.get(owner);
  if (p?.manifest.files === undefined) refuse('packageAbsent', `${name} (info.x-owner ${owner})`, `the domain ${name} is rebuilt into the package ${owner}, its info.x-owner, and ${owner} is a domain, no package`);
  if (Array.isArray(p.manifest.domains) && !p.manifest.domains.includes(name)) p.manifest.domains.push(name);
  const out: ContractFile[] = [];
  for (const [file, text] of Object.entries(domainDataFiles(name, doc))) {
    const rel = `${p.manifest.tree ?? owner}/${file}`;
    if (installed.some((f) => f.rel === rel && f.pkg === owner)) refuse('manifestMismatch', rel, `installed by the package ${owner} and rebuilt from the domain ${name}: one source per file`);
    const f = { rel, text, doc: JSON.parse(text), pkg: owner, path, installed: true as const, source: `contract.d/${domainPath(name)}` };
    const problems = fileProblems(f);
    if (problems.length) refuse('fileInvalid', rel, problems.map((x) => `${x.item}: ${x.rule}: ${x.message}`).join('; '));
    out.push(f);
  }
  return out;
}

function checkPackage(packages, pkg, from) {
  if (!packages.has(pkg)) refuse('packageAbsent', from, `requires ${pkg}, which is not installed`);
}

/** The version a read of the directory renders under: omx-contract's own manifest version, else `fallback`. */
export const contractVersion = (data, fallback) => data.packages?.get(SCHEMA_PACKAGE)?.manifest.version ?? fallback;
