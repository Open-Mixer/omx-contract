// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * A domain document (docs/contract-dir.md, "Domains"): `<contractdir>/<domain>/<domain>.json`, one self-describing
 * JSON Schema 2020-12 document with an `info` block and `components.schemas`. readDomain() checks the document and
 * returns it as the classic file the rest of the tool reads (items, validation), and the items it marks for C.
 */
import { refuse } from './codes.mjs';
import type { JsonObject } from './json.mjs';

/** The stable `$id` of a domain: the URL every cross-domain reference names. */
export const domainId = (name: string): string => `https://openmixer.org/contract/${name}`;

/** The one JSON Schema dialect a domain document is written in. */
export const DOMAIN_SCHEMA = 'https://json-schema.org/draft/2020-12/schema';

/**
 * A domain's prefix: its name in upper snake case with its underscore, which every item name of the domain starts with
 * (`panel` is `PANEL_`, `dsp-kernels` and `dsp/kernels` are `DSP_KERNELS_`).
 */
export const domainPrefix = (name: string): string => `${name.replace(/[-/]/g, '_').toUpperCase()}_`;

/** A domain's name as the stem of its codes header: `panel_codes.h`, `dsp_kernels_codes.h`. */
export const domainStem = (name: string): string => domainPrefix(name).slice(0, -1).toLowerCase();

/** A domain's marked items: `x-c-codes` is in the map, and `xmacro` says `x-c-xmacro` is too. */
export type DomainCodes = ReadonlyMap<string, { readonly xmacro: boolean }>;

/** A domain document of a read, for the prefix check: its path and the names of its items. */
export interface DomainItems { readonly rel: string; readonly items: readonly string[] }

/**
 * The prefix check of a read's domains (docs/contract-dir.md, "Domains"). An item of a domain starts with the domain's
 * prefix, and no item starts with the prefix of a LONGER domain of the read (`DSP_KERNELS_X` in `dsp` collides with
 * `dsp/kernels`): two headers never define one name. A name alone cannot say whether `DSP_KERNELS_` is a domain, so
 * the second rule compares against the domains of the read.
 * @throws ContractRefusal contract.item.prefix, naming the item and the domain.
 */
export function checkItemPrefixes(docs: readonly DomainItems[]): void {
  const domains = docs.map(({ rel, items }) => {
    const name = domainOfPath(rel);
    if (name === undefined) refuse('manifestMismatch', rel, `${rel} is no domain's document: a domain's document is <domain>/<last segment of the domain>.json`);
    return { name, rel, items };
  });
  for (const { name, rel, items } of domains) {
    const mine = domainPrefix(name);
    for (const item of items) {
      if (!item.startsWith(mine)) refuse('itemPrefix', rel, `${item} of the domain ${name} does not start with ${mine}, the domain's name in upper snake case with its underscore`);
      for (const other of domains) {
        const theirs = domainPrefix(other.name);
        if (other.name !== name && theirs.length > mine.length && item.startsWith(theirs)) refuse('itemPrefix', rel, `${item} of the domain ${name} starts with ${theirs}, the prefix of the domain ${other.name}: two headers would define one name`);
      }
    }
  }
}

/** The last segment of a domain's name: what its document is called (`dsp/kernels` is `kernels.json`). */
export const domainLeaf = (name: string): string => name.slice(name.lastIndexOf('/') + 1);

/** The place of a domain's document under a contractdir, `<domain>/<last segment>.json`: the one rule the reader reads a domain by. */
export const domainPath = (name: string): string => `${name}/${domainLeaf(name)}.json`;

/** The domain a document's path names, the inverse of {@link domainPath}; undefined when the path is no domain's place. */
export function domainOfPath(rel: string): string | undefined {
  const domain = rel.slice(0, Math.max(rel.lastIndexOf('/'), 0));
  return domain && domainPath(domain) === rel ? domain : undefined;
}

/** A domain's name: what a directory under a contractdir is called when it is not a schema major. */
export const DOMAIN_NAME = /^[a-z][a-z0-9-]*$/;

const VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
/** True when the MAJOR.MINOR.PATCH version `a` is below `b`. */
export function versionBelow(a: string, b: string): boolean {
  const x = VERSION.exec(a)!.slice(1).map(Number);
  const y = VERSION.exec(b)!.slice(1).map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i]! < y[i]!;
  return false;
}

const PACKAGE = /^[a-z][a-z0-9-]*$/;
const ITEM = /^[A-Z][A-Z0-9_]*$/;
const REF = /^https:\/\/openmixer\.org\/contract\/[a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)*#\/components\/schemas\/([A-Z][A-Z0-9_]*)$/;

const only = (o: JsonObject, keys: string[], at: string, what: string): void => {
  for (const k of Object.keys(o)) if (!keys.includes(k)) refuse('fileInvalid', at, `${what}: unknown key ${k} (a ${what} holds ${keys.join(', ')})`);
};

/** A range item (docs/contract-dir.md, "Domains"): `properties` of named parameters, each a `minimum` and `maximum` and optionally a `default`, `x-unit` and `x-scale`. It renders nothing; the loaders read it at run time. */
function readRange(item: string, s: JsonObject, at: string): void {
  const w = `components.schemas.${item}`;
  only(s, ['description', 'x-since', 'x-why', 'type', 'properties'], at, w);
  if (typeof s.description !== 'string') refuse('fileInvalid', at, `${w}.description is the item's doc`);
  if (s.type !== undefined && s.type !== 'object') refuse('fileInvalid', at, `${w}.type is not "object"`);
  const props = s.properties;
  if (typeof props !== 'object' || props === null || Array.isArray(props)) refuse('fileInvalid', at, `${w}.properties is not an object`);
  for (const [name, p] of Object.entries(props as JsonObject)) {
    const pw = `${w}.properties.${name}`;
    if (typeof p !== 'object' || p === null || Array.isArray(p)) refuse('fileInvalid', at, `${pw}: not an object`);
    only(p as JsonObject, ['minimum', 'maximum', 'default', 'x-unit', 'x-scale'], at, pw);
    const { minimum: mn, maximum: mx, default: df } = p as JsonObject;
    if (typeof mn !== 'number' || typeof mx !== 'number') refuse('fileInvalid', at, `${pw} has no numeric minimum and maximum`);
    if (df !== undefined && typeof df !== 'number') refuse('fileInvalid', at, `${pw}.default is not a number`);
    if ((mn as number) > (mx as number)) refuse('fileInvalid', at, `${pw} has a minimum above its maximum`);
    if (df !== undefined && ((df as number) < (mn as number) || (df as number) > (mx as number))) refuse('fileInvalid', at, `${pw}.default is outside its minimum and maximum`);
    for (const k of ['x-unit', 'x-scale']) if ((p as JsonObject)[k] !== undefined && typeof (p as JsonObject)[k] !== 'string') refuse('fileInvalid', at, `${pw}.${k} is not a string`);
  }
}

/**
 * The domain document `doc`, installed as `<name>/<name>.json`, as `{ doc, manifest }`: `doc` the classic file of its
 * items, `manifest` the domain's `{ package, owner, version, schemaMajor, title }` as a package of the read, `codes` the
 * items it marks `x-c-codes`, `names` every item of the document, a range item's among them (its codes header, docs/render.md) and whether each also marks `x-c-xmacro`.
 * @throws ContractRefusal contract.manifest.invalid for a `$id`, `info` or place that disagrees, contract.file.invalid
 * for a shape the reader does not read.
 */
export function readDomain(name: string, doc: JsonObject, schemaUrl: string, schemaMajor: number): { doc: JsonObject; manifest: JsonObject; codes: DomainCodes; names: string[] } {
  const at = domainPath(name);
  if (doc.$id !== domainId(name)) refuse('manifestInvalid', at, `$id ${JSON.stringify(doc.$id)} is not ${domainId(name)}, the id of the domain whose directory this is`);
  only(doc, ['$schema', '$id', 'info', 'components', 'x-render', 'x-file'], at, 'domain document');
  if (doc.$schema !== DOMAIN_SCHEMA) refuse('fileInvalid', at, `$schema ${JSON.stringify(doc.$schema)} is not ${DOMAIN_SCHEMA}: a domain document is JSON Schema 2020-12`);
  const info = doc.info as JsonObject | undefined;
  if (typeof info !== 'object' || info === null || Array.isArray(info)) refuse('manifestInvalid', at, 'info is not an object');
  only(info, ['title', 'version', 'x-owner', 'x-stability'], at, 'info');
  if (typeof info.title !== 'string' || !info.title) refuse('manifestInvalid', at, 'info.title is not a sentence');
  if (typeof info.version !== 'string' || !VERSION.test(info.version)) refuse('manifestInvalid', at, `info.version ${JSON.stringify(info.version)} is not x.y.z`);
  if (typeof info['x-owner'] !== 'string' || !PACKAGE.test(info['x-owner'])) refuse('manifestInvalid', at, `info.x-owner ${JSON.stringify(info['x-owner'])} is not a package name`);
  if (info['x-stability'] !== 'experimental' && info['x-stability'] !== 'stable') refuse('manifestInvalid', at, `info.x-stability ${JSON.stringify(info['x-stability'])} is not experimental or stable`);
  const comp = doc.components as JsonObject | undefined;
  if (typeof comp !== 'object' || comp === null || Array.isArray(comp)) refuse('fileInvalid', at, 'components is not an object');
  only(comp, ['schemas'], at, 'components');
  const schemas = comp.schemas as Record<string, JsonObject> | undefined;
  if (typeof schemas !== 'object' || schemas === null || Array.isArray(schemas) || !Object.keys(schemas).length) refuse('fileInvalid', at, 'components.schemas is not a map of at least one schema');
  const codes = new Map<string, { xmacro: boolean }>();
  const names: string[] = [];
  const out: JsonObject = { $schema: schemaUrl, requires: { 'omx-contract-schema': '>= 3.0.0' } };
  for (const [item, s] of Object.entries(schemas)) {
    const w = `components.schemas.${item}`;
    if (!ITEM.test(item)) refuse('fileInvalid', at, `${w}: the name of a schema is the item's, upper snake case`);
    if (typeof s !== 'object' || s === null || Array.isArray(s)) refuse('fileInvalid', at, `${w}: not an object`);
    if ('$ref' in s) refuse('fileInvalid', at, `${w}: a $ref is not read yet; a domain's words are its own`);
    if ('properties' in s && !('oneOf' in s)) { readRange(item, s, at); names.push(item); continue; } // a range item: read at run time, rendered nowhere
    if (s['x-kind'] === 'sheet') { // a data sheet, rebuilt by render --with-domain (docs/render.md): no words, read nowhere else
      only(s, ['description', 'x-since', 'x-why', 'x-kind', 'x-file', 'x-source', 'x-value', 'x-docs'], at, w);
      if (typeof s['x-value'] !== 'object' || s['x-value'] === null || Array.isArray(s['x-value'])) refuse('fileInvalid', at, `${w}.x-value is not the sheet's value`);
      names.push(item);
      continue;
    }
    only(s, ['description', 'x-since', 'x-why', 'x-groups', 'x-c-codes', 'x-c-xmacro', 'x-kind', 'x-file', 'x-source', 'oneOf'], at, w);
    if (s['x-kind'] !== undefined && s['x-kind'] !== 'codes') refuse('fileInvalid', at, `${w}.x-kind ${JSON.stringify(s['x-kind'])} is not codes or sheet`);
    for (const k of ['x-c-codes', 'x-c-xmacro'])
      if (s[k] !== undefined && typeof s[k] !== 'boolean') refuse('fileInvalid', at, `${w}.${k} is not true or false`);
    if (s['x-c-xmacro'] === true && s['x-c-codes'] !== true) refuse('fileInvalid', at, `${w}.x-c-xmacro without x-c-codes: the X-macro is part of the item's codes header`);
    if (s['x-c-codes'] === true) codes.set(item, { xmacro: s['x-c-xmacro'] === true });
    if (s['x-groups'] !== undefined && (typeof s['x-groups'] !== 'string' || !(s['x-groups'] in schemas))) refuse('fileInvalid', at, `${w}.x-groups ${JSON.stringify(s['x-groups'])} is no words schema of this document`);
    if (!Array.isArray(s.oneOf) || !s.oneOf.length) refuse('fileInvalid', at, `${w}: only a words item is read, a oneOf of const words`);
    if (typeof s.description !== 'string') refuse('fileInvalid', at, `${w}.description is the item's doc`);
    const words: JsonObject = {};
    s.oneOf.forEach((e: JsonObject, i: number) => {
      const ew = `${w}.oneOf[${i}]`;
      if (typeof e !== 'object' || e === null || Array.isArray(e)) refuse('fileInvalid', at, `${ew}: not an object`);
      only(e, ['const', 'title', 'description', 'x-code', 'x-text', 'x-group', 'x-from', 'x-name'], at, ew);
      if (typeof e.const !== 'string' || !e.const) refuse('fileInvalid', at, `${ew}.const is not a word`);
      if (typeof e.title !== 'string' || !/^[A-Za-z][A-Za-z0-9]*$/.test(e.title)) refuse('fileInvalid', at, `${ew}.title is not the word's key`);
      if (e.description !== undefined && typeof e.description !== 'string') refuse('fileInvalid', at, `${ew}.description is not the word's line`);
      if (e['x-code'] !== i) refuse('fileInvalid', at, `${ew}.x-code is ${JSON.stringify(e['x-code'])}, and a code is the word's place in the order (${i})`);
      if (e['x-text'] !== undefined && typeof e['x-text'] !== 'string') refuse('fileInvalid', at, `${ew}.x-text is not a sentence`);
      if (e['x-group'] !== undefined) {
        const g = typeof s['x-groups'] === 'string' ? schemas[s['x-groups']] : undefined;
        const gone = g?.oneOf;
        const known = Array.isArray(gone) ? gone.map((x: JsonObject) => x.const) : [];
        if (!known.includes(e['x-group'])) refuse('fileInvalid', at, `${ew}.x-group ${JSON.stringify(e['x-group'])} is no word of the schema ${w}.x-groups names`);
      }
      const from: string[] = [];
      if (e['x-from'] !== undefined) {
        if (!Array.isArray(e['x-from']) || !e['x-from'].length) refuse('fileInvalid', at, `${ew}.x-from is not a list of at least one term`);
        e['x-from'].forEach((r: JsonObject, j: number) => {
          const rw = `${ew}.x-from[${j}]`;
          if (typeof r !== 'object' || r === null || Array.isArray(r)) refuse('fileInvalid', at, `${rw}: not an object`);
          only(r, ['$ref', 'x-term'], at, rw);
          const m = typeof r.$ref === 'string' ? REF.exec(r.$ref) : null;
          if (!m) refuse('fileInvalid', at, `${rw}.$ref ${JSON.stringify(r.$ref)} is not ${domainId('<domain>')}#/components/schemas/<ITEM>, a domain id and an item`);
          if (typeof r['x-term'] !== 'string' || !r['x-term']) refuse('fileInvalid', at, `${rw}.x-term is not a term's key`);
          from.push(`${m![1]}#${r['x-term']}`);
        });
      }
      if (e.title in words) refuse('fileInvalid', at, `${ew}.title ${e.title} is used twice in ${item}`);
      if (Object.values(words).some((x: JsonObject) => x.word === e.const)) refuse('fileInvalid', at, `${ew}.const ${JSON.stringify(e.const)} is used twice in ${item}`);
      words[e.title] = { word: e.const, ...(e['x-group'] === undefined ? {} : { group: e['x-group'] }), ...(from.length ? { from } : {}), ...(e.description === undefined ? {} : { doc: e.description }), ...(e['x-text'] === undefined ? {} : { text: { en: e['x-text'] } }) };
    });
    names.push(item);
    out[item] = { kind: 'words', ...(s['x-since'] === undefined ? {} : { since: s['x-since'] }), doc: s.description, ...(s['x-why'] === undefined ? {} : { why: s['x-why'] }), ...(s['x-groups'] === undefined ? {} : { groups: s['x-groups'] }), words };
  }
  return { doc: out, codes, names, manifest: { package: name, owner: info['x-owner'], version: info.version, schemaMajor, title: info.title } };
}

/**
 * The data files a domain was made from (docs/render.md, `render --with-domain`), `{ <x-file>: <text> }`: the items of
 * one `x-file` in the document's order, `x-kind` codes as `{ kind, since, source, doc, codes }` (each word's `x-name`
 * its key, `const` its code, `description` its doc, `x-text` its English text) and `x-kind` sheet as `{ kind, since,
 * source, doc, value, docs }`; the root's `x-render` goes to the file the root's `x-file` names. Read the document with
 * readDomain() first; an item with no `x-file` is refused by name.
 */
export function domainDataFiles(name: string, doc: JsonObject): Record<string, string> {
  const at = domainPath(name);
  const files: Record<string, JsonObject> = {};
  const fileOf = (rel: unknown, w: string): JsonObject => {
    if (typeof rel !== 'string' || !rel.endsWith('.json')) refuse('fileInvalid', at, `${w}.x-file is not the data path the item came from`);
    // a path inside the data directory only: relative, forward slashes, no empty, . or .. segment
    if (rel.startsWith('/') || rel.includes('\\') || rel.split('/').some((g) => g === '' || g === '.' || g === '..'))
      refuse('fileInvalid', at, `${w}.x-file ${JSON.stringify(rel)} leaves the data directory: a relative path with no empty, . or .. segment and no backslash`);
    return (files[rel as string] ??= {});
  };
  if (doc['x-render'] !== undefined) fileOf(doc['x-file'], 'the root').render = doc['x-render'];
  for (const [item, s] of Object.entries((doc.components as JsonObject).schemas as Record<string, JsonObject>)) {
    const w = `components.schemas.${item}`;
    const f = fileOf(s['x-file'], w);
    const head = { kind: s['x-kind'] ?? 'codes', since: s['x-since'], ...(s['x-source'] === undefined ? {} : { source: s['x-source'] }), doc: s.description };
    if (s['x-kind'] === 'sheet') { f[item] = { ...head, value: s['x-value'], ...(s['x-docs'] === undefined ? {} : { docs: s['x-docs'] }) }; continue; }
    const codes: JsonObject = {};
    for (const e of s.oneOf as JsonObject[]) {
      if (typeof e['x-name'] !== 'string') refuse('fileInvalid', at, `${w}: the word ${JSON.stringify(e.const)} has no x-name, its key in the data item`);
      codes[e['x-name'] as string] = { code: e.const, ...(e.description === undefined ? {} : { doc: e.description }), ...(e['x-text'] === undefined ? {} : { text: { en: e['x-text'] } }) };
    }
    f[item] = { ...head, codes };
  }
  return Object.fromEntries(Object.entries(files).map(([rel, d]) => [rel, `${JSON.stringify(d, null, 2)}\n`]));
}
