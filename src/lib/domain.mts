// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * A domain document (docs/contract-dir.md, "Domains"): `<contractdir>/<domain>/<domain>.json`, one self-describing
 * JSON Schema 2020-12 document with an `info` block and `components.schemas`. readDomain() checks the document and
 * returns it as the classic file the rest of the tool reads (items, validation, every render), so a domain's words
 * render byte for byte what the same words item of the old layout renders.
 */
import { refuse } from './codes.mjs';
import type { JsonObject } from './json.mjs';

/** The stable `$id` of a domain: the URL every cross-domain reference names. */
export const domainId = (name: string): string => `https://openmixer.org/contract/${name}`;

/** A domain's name, or a group's and a module's: what a directory under a contractdir is called when it is not a schema major. */
export const DOMAIN_NAME = /^[a-z][a-z0-9-]*$/;

/** The last segment of a domain's name: a module's, and what its document is called (`formats/clap` is `clap.json`). */
export const domainLeaf = (name: string): string => name.slice(name.lastIndexOf('/') + 1);

/** The place of a domain's document under a contractdir, `<domain>/<leaf>.json`. */
export const domainPath = (name: string): string => `${name}/${domainLeaf(name)}.json`;

const VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const PACKAGE = /^[a-z][a-z0-9-]*$/;
const ITEM = /^[A-Z][A-Z0-9_]*$/;
const REF = /^https:\/\/openmixer\.org\/contract\/([a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)?)#\/components\/schemas\/([A-Z][A-Z0-9_]*)$/;
const TERM_FORMATS = ['clap', 'lv2'];

const only = (o: JsonObject, keys: string[], at: string, what: string): void => {
  for (const k of Object.keys(o)) if (!keys.includes(k)) refuse('fileInvalid', at, `${what}: unknown key ${k} (a ${what} holds ${keys.join(', ')})`);
};

/** A reference of a domain to a schema of another, by `$id`: the read resolves each (`readDomain`'s `uses`) once every domain is read. */
export interface DomainUse { at: string; domain: string; schema: string; values: string[] }

/** The words (the `const` of each `oneOf`) of the schema `name` of a domain document, or undefined when it holds none. */
export const wordsOf = (doc: JsonObject, name: string): string[] | undefined => {
  const s = ((doc.components as JsonObject | undefined)?.schemas as Record<string, JsonObject> | undefined)?.[name];
  return Array.isArray(s?.oneOf) ? s.oneOf.map((e: JsonObject) => e.const as string) : undefined;
};

/**
 * The domain document `doc`, installed as `<name>/<leaf>.json`, as `{ doc, manifest, uses }`: `doc` the classic file of
 * its items, `manifest` the domain's `{ package, owner, version, schemaMajor, title }` as a package of the read, `uses`
 * the schemas of other domains its terms items name for their kinds and statuses.
 * @throws ContractRefusal contract.manifest.invalid for a `$id`, `info` or place that disagrees, contract.file.invalid
 * for a shape the reader does not read.
 */
export function readDomain(name: string, doc: JsonObject, schemaUrl: string, schemaMajor: number): { doc: JsonObject; manifest: JsonObject; uses: DomainUse[] } {
  const at = domainPath(name);
  const uses: DomainUse[] = [];
  if (doc.$id !== domainId(name)) refuse('manifestInvalid', at, `$id ${JSON.stringify(doc.$id)} is not ${domainId(name)}, the id of the domain whose directory this is`);
  only(doc, ['$schema', '$id', 'info', 'components'], at, 'domain document');
  const info = doc.info as JsonObject | undefined;
  if (typeof info !== 'object' || info === null || Array.isArray(info)) refuse('manifestInvalid', at, 'info is not an object');
  only(info, ['title', 'version', 'x-owner'], at, 'info');
  if (typeof info.title !== 'string' || !info.title) refuse('manifestInvalid', at, 'info.title is not a sentence');
  if (typeof info.version !== 'string' || !VERSION.test(info.version)) refuse('manifestInvalid', at, `info.version ${JSON.stringify(info.version)} is not x.y.z`);
  if (typeof info['x-owner'] !== 'string' || !PACKAGE.test(info['x-owner'])) refuse('manifestInvalid', at, `info.x-owner ${JSON.stringify(info['x-owner'])} is not a package name`);
  const comp = doc.components as JsonObject | undefined;
  if (typeof comp !== 'object' || comp === null || Array.isArray(comp)) refuse('fileInvalid', at, 'components is not an object');
  only(comp, ['schemas'], at, 'components');
  const schemas = comp.schemas as Record<string, JsonObject> | undefined;
  if (typeof schemas !== 'object' || schemas === null || Array.isArray(schemas) || !Object.keys(schemas).length) refuse('fileInvalid', at, 'components.schemas is not a map of at least one schema');
  const out: JsonObject = { $schema: schemaUrl, requires: { 'omx-contract-schema': '>= 3.0.0' } };
  for (const [item, s] of Object.entries(schemas)) {
    const w = `components.schemas.${item}`;
    if (!ITEM.test(item)) refuse('fileInvalid', at, `${w}: the name of a schema is the item's, upper snake case`);
    if (typeof s !== 'object' || s === null || Array.isArray(s)) refuse('fileInvalid', at, `${w}: not an object`);
    if ('$ref' in s) refuse('fileInvalid', at, `${w}: a $ref is not read yet; a domain's words are its own`);
    if (s['x-format'] !== undefined) {
      out[item] = readTerms(item, s, at, w, uses);
      continue;
    }
    only(s, ['description', 'x-since', 'x-why', 'x-groups', 'oneOf'], at, w);
    if (s['x-groups'] !== undefined && (typeof s['x-groups'] !== 'string' || !(s['x-groups'] in schemas))) refuse('fileInvalid', at, `${w}.x-groups ${JSON.stringify(s['x-groups'])} is no words schema of this document`);
    if (!Array.isArray(s.oneOf) || !s.oneOf.length) refuse('fileInvalid', at, `${w}: only a words item is read, a oneOf of const words`);
    if (typeof s.description !== 'string') refuse('fileInvalid', at, `${w}.description is the item's doc`);
    const words: JsonObject = {};
    s.oneOf.forEach((e: JsonObject, i: number) => {
      const ew = `${w}.oneOf[${i}]`;
      if (typeof e !== 'object' || e === null || Array.isArray(e)) refuse('fileInvalid', at, `${ew}: not an object`);
      only(e, ['const', 'title', 'description', 'x-code', 'x-text', 'x-group', 'x-from'], at, ew);
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
          from.push(`${m![2]}#${r['x-term']}`);
        });
      }
      if (e.title in words) refuse('fileInvalid', at, `${ew}.title ${e.title} is used twice in ${item}`);
      words[e.title] = { word: e.const, ...(e['x-group'] === undefined ? {} : { group: e['x-group'] }), ...(from.length ? { from } : {}), ...(e.description === undefined ? {} : { doc: e.description }), ...(e['x-text'] === undefined ? {} : { text: { en: e['x-text'] } }) };
    });
    out[item] = { kind: 'words', ...(s['x-since'] === undefined ? {} : { since: s['x-since'] }), doc: s.description, ...(s['x-why'] === undefined ? {} : { why: s['x-why'] }), ...(s['x-groups'] === undefined ? {} : { groups: s['x-groups'] }), words };
  }
  return { doc: out, manifest: { package: name, owner: info['x-owner'], version: info.version, schemaMajor, title: info.title }, uses };
}

/** A terms item (docs/contract-dir.md, "Domains"): the classic `terms` item, its terms the `x-term` of each `oneOf` entry. */
function readTerms(item: string, s: JsonObject, at: string, w: string, uses: DomainUse[]): JsonObject {
  only(s, ['description', 'x-since', 'x-why', 'x-format', 'x-spec', 'x-version', 'x-deprecated', 'x-kinds', 'x-statuses', 'oneOf'], at, w);
  if (typeof s.description !== 'string') refuse('fileInvalid', at, `${w}.description is the item's doc`);
  if (typeof s['x-format'] !== 'string' || !TERM_FORMATS.includes(s['x-format'])) refuse('fileInvalid', at, `${w}.x-format ${JSON.stringify(s['x-format'])} is not ${TERM_FORMATS.join(' or ')}`);
  if (typeof s['x-spec'] !== 'string' || !s['x-spec']) refuse('fileInvalid', at, `${w}.x-spec is not the specification the terms map`);
  if (typeof s['x-version'] !== 'string' || !/^[0-9]+(\.[0-9]+)+$/.test(s['x-version'])) refuse('fileInvalid', at, `${w}.x-version is not the version of the specification`);
  if (s['x-deprecated'] !== undefined && s['x-deprecated'] !== true) refuse('fileInvalid', at, `${w}.x-deprecated is true or absent`);
  if (!Array.isArray(s.oneOf) || !s.oneOf.length) refuse('fileInvalid', at, `${w}: a terms item is a oneOf of terms`);
  const refs: Record<string, string> = {};
  for (const key of ['x-kinds', 'x-statuses']) {
    const r = s[key] as JsonObject | undefined;
    if (typeof r !== 'object' || r === null || Array.isArray(r)) refuse('fileInvalid', at, `${w}.${key} is no { "$ref" } to the words of a domain`);
    only(r, ['$ref'], at, `${w}.${key}`);
    const m = typeof r.$ref === 'string' ? REF.exec(r.$ref) : null;
    if (!m) refuse('fileInvalid', at, `${w}.${key}.$ref ${JSON.stringify(r.$ref)} is not ${domainId('<domain>')}#/components/schemas/<ITEM>`);
    refs[key] = `${m![1]}#${m![2]}`;
  }
  const kinds: string[] = [];
  const statuses: string[] = [];
  const terms: JsonObject = {};
  s.oneOf.forEach((e: JsonObject, i: number) => {
    const ew = `${w}.oneOf[${i}]`;
    if (typeof e !== 'object' || e === null || Array.isArray(e)) refuse('fileInvalid', at, `${ew}: not an object`);
    only(e, ['const', 'title', 'x-term'], at, ew);
    if (typeof e.const !== 'string' || !e.const) refuse('fileInvalid', at, `${ew}.const is not the term's key`);
    const t = e['x-term'] as JsonObject | undefined;
    if (typeof t !== 'object' || t === null || Array.isArray(t)) refuse('fileInvalid', at, `${ew}.x-term is not the term`);
    if (e.title !== (t.id ?? t.uri)) refuse('fileInvalid', at, `${ew}.title ${JSON.stringify(e.title)} is not the term's id or uri`);
    if (e.const in terms) refuse('fileInvalid', at, `${ew}.const ${e.const} is used twice in ${item}`);
    kinds.push(String(t.kind));
    statuses.push(String(t.status));
    terms[e.const] = t;
  });
  uses.push({ at: `${w}.x-kinds`, ...useOf(refs['x-kinds']), values: kinds }, { at: `${w}.x-statuses`, ...useOf(refs['x-statuses']), values: statuses });
  return { kind: 'terms', ...(s['x-since'] === undefined ? {} : { since: s['x-since'] }), doc: s.description, ...(s['x-why'] === undefined ? {} : { why: s['x-why'] }), format: s['x-format'], spec: s['x-spec'], version: s['x-version'], ...(s['x-deprecated'] === undefined ? {} : { deprecated: true }), terms };
}

const useOf = (ref: string): { domain: string; schema: string } => ({ domain: ref.slice(0, ref.indexOf('#')), schema: ref.slice(ref.indexOf('#') + 1) });
