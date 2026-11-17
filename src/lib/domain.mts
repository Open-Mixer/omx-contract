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

/** A domain's name: what a directory under a contractdir is called when it is not a schema major. */
/** The one JSON Schema dialect a domain document is written in. */
export const DOMAIN_SCHEMA = 'https://json-schema.org/draft/2020-12/schema';

export const DOMAIN_NAME = /^[a-z][a-z0-9-]*$/;

const VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const PACKAGE = /^[a-z][a-z0-9-]*$/;
const ITEM = /^[A-Z][A-Z0-9_]*$/;

const only = (o: JsonObject, keys: string[], at: string, what: string): void => {
  for (const k of Object.keys(o)) if (!keys.includes(k)) refuse('fileInvalid', at, `${what}: unknown key ${k} (a ${what} holds ${keys.join(', ')})`);
};

/**
 * The domain document `doc`, installed as `<name>/<name>.json`, as `{ doc, manifest }`: `doc` the classic file of its
 * items, `manifest` the domain's `{ package, owner, version, schemaMajor, title }` as a package of the read.
 * @throws ContractRefusal contract.manifest.invalid for a `$id`, `info` or place that disagrees, contract.file.invalid
 * for a shape the reader does not read.
 */
export function readDomain(name: string, doc: JsonObject, schemaUrl: string, schemaMajor: number): { doc: JsonObject; manifest: JsonObject } {
  const at = `${name}/${name}.json`;
  if (doc.$id !== domainId(name)) refuse('manifestInvalid', at, `$id ${JSON.stringify(doc.$id)} is not ${domainId(name)}, the id of the domain whose directory this is`);
  only(doc, ['$schema', '$id', 'info', 'components'], at, 'domain document');
  if (doc.$schema !== DOMAIN_SCHEMA) refuse('fileInvalid', at, `$schema ${JSON.stringify(doc.$schema)} is not ${DOMAIN_SCHEMA}: a domain document is JSON Schema 2020-12`);
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
    only(s, ['description', 'x-since', 'x-why', 'oneOf'], at, w);
    if (!Array.isArray(s.oneOf) || !s.oneOf.length) refuse('fileInvalid', at, `${w}: only a words item is read, a oneOf of const words`);
    if (typeof s.description !== 'string') refuse('fileInvalid', at, `${w}.description is the item's doc`);
    const words: JsonObject = {};
    s.oneOf.forEach((e: JsonObject, i: number) => {
      const ew = `${w}.oneOf[${i}]`;
      if (typeof e !== 'object' || e === null || Array.isArray(e)) refuse('fileInvalid', at, `${ew}: not an object`);
      only(e, ['const', 'title', 'description', 'x-code', 'x-text'], at, ew);
      if (typeof e.const !== 'string' || !e.const) refuse('fileInvalid', at, `${ew}.const is not a word`);
      if (typeof e.title !== 'string' || !/^[A-Za-z][A-Za-z0-9]*$/.test(e.title)) refuse('fileInvalid', at, `${ew}.title is not the word's key`);
      if (typeof e.description !== 'string') refuse('fileInvalid', at, `${ew}.description is not the word's line`);
      if (e['x-code'] !== i) refuse('fileInvalid', at, `${ew}.x-code is ${JSON.stringify(e['x-code'])}, and a code is the word's place in the order (${i})`);
      if (e['x-text'] !== undefined && typeof e['x-text'] !== 'string') refuse('fileInvalid', at, `${ew}.x-text is not a sentence`);
      if (e.title in words) refuse('fileInvalid', at, `${ew}.title ${e.title} is used twice in ${item}`);
      words[e.title] = { word: e.const, doc: e.description, ...(e['x-text'] === undefined ? {} : { text: { en: e['x-text'] } }) };
    });
    out[item] = { kind: 'words', ...(s['x-since'] === undefined ? {} : { since: s['x-since'] }), doc: s.description, ...(s['x-why'] === undefined ? {} : { why: s['x-why'] }), words };
  }
  return { doc: out, manifest: { package: name, owner: info['x-owner'], version: info.version, schemaMajor, title: info.title } };
}
