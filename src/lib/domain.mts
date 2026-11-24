// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * A domain document (docs/contract-dir.md, "Domains"): `<contractdir>/<domain>/<domain>.json`, one self-describing
 * JSON Schema 2020-12 document with an `info` block and `components.schemas`. readDomain() checks the document and
 * returns it as the classic file the rest of the tool reads (items, validation), and the items it marks for C.
 */
import { refuse } from './codes.mjs';
import type { JsonObject } from './json.mjs';
import { placeholdersOf } from './placeholders.mjs';

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
const ARG = /^[a-z][A-Za-z0-9]*$/;
/** A package or domain a domain's `info.x-requires` names: a package name, or a domain name with its `/` segments. */
const REQUIRED = /^[a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)*$/;
const FLOOR = /^>= (0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
/** The schema floor of a file rebuilt from a domain, and of the classic file readDomain() returns. */
const REBUILT_SCHEMA_FLOOR = '>= 3.0.0';
const REF = /^https:\/\/openmixer\.org\/contract\/[a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)*#\/components\/schemas\/([A-Z][A-Z0-9_]*)$/;
/** An absolute URI (RFC 3986): a scheme, a colon and the rest, no white space; any scheme, urn: as much as http:. */
/** a unit id (docs/units.md, 2026-11-23): camelCase, letters and digits from a letter */
const UNIT_ID = /^[A-Za-z][A-Za-z0-9]*$/;
const ABSOLUTE_URI = /^[A-Za-z][A-Za-z0-9+.-]*:[^\s]+$/;

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

/** The kinds a words item (a oneOf of words) rebuilds: a codes item (the default), a words item and a set (its words the ids, `x-default` its default). */
const WORDS_KINDS = ['codes', 'words', 'set', 'verbs'];

/** A verb's own keys (a word of an item of `x-kind` verbs), each with the data form's key it rebuilds. */
const VERB_KEYS = [['x-format', 'format'], ['x-reply', 'reply'], ['x-codes', 'codes'], ['x-implemented-by', 'implementedBy'], ['x-since', 'since']];

/** A reply code's own keys (a word of a codes item), each with the data form's key it rebuilds. */
const REPLY_KEYS = [['x-resp', 'resp'], ['x-transient', 'transient']];

/** A verb's data form: the word its `const`, then its format, reply, codes, implementedBy and since, then its doc. */
const verbOf = (e: JsonObject): JsonObject => ({ verb: e.const, ...Object.fromEntries(VERB_KEYS.filter(([k]) => e[k!] !== undefined).map(([k, d]) => [d, e[k!]])), ...(e.description === undefined ? {} : { doc: e.description }) });

/**
 * An item's head as the data form writes it, from its domain keys: `since`, `source` (its `x-source`, omx-contract#215:
 * every read carries it, so `links` reads a domain's links), `doc` and `why`, each only where the item has it.
 */
const itemHead = (s: JsonObject): JsonObject => ({ ...(s['x-since'] === undefined ? {} : { since: s['x-since'] }), ...(s['x-source'] === undefined ? {} : { source: s['x-source'] }), doc: s.description, ...(s['x-why'] === undefined ? {} : { why: s['x-why'] }) });

/**
 * A terms item (3.21.0, docs/contract-dir.md "Domains"): a format's terms as one specification or header states them,
 * `x-format`, `x-spec`, `x-version` (and `x-deprecated`) the item's, and a `oneOf` of one word per term: `const` and
 * `title` the term's key, `x-code` its place, `x-term` the term as the data form writes it (its uri or id, kind,
 * status, ...; the build holds it to the schema's term). The runtime readers serve it as words, the words the keys.
 */
function readTerms(item: string, s: JsonObject, at: string): JsonObject {
  const w = `components.schemas.${item}`;
  only(s, ['description', 'x-since', 'x-why', 'x-kind', 'x-file', 'x-source', 'x-format', 'x-spec', 'x-version', 'x-deprecated', 'oneOf'], at, w);
  if (typeof s.description !== 'string') refuse('fileInvalid', at, `${w}.description is the item's doc`);
  for (const k of ['x-format', 'x-spec', 'x-version']) if (typeof s[k] !== 'string') refuse('fileInvalid', at, `${w}.${k} is absent or not a string: a terms item names its format, its specification and its version`);
  if (s['x-deprecated'] !== undefined && s['x-deprecated'] !== true) refuse('fileInvalid', at, `${w}.x-deprecated is not true`);
  if (!Array.isArray(s.oneOf) || !s.oneOf.length) refuse('fileInvalid', at, `${w}: a terms item is a oneOf of at least one term`);
  const terms: JsonObject = {};
  (s.oneOf as JsonObject[]).forEach((e, i) => {
    const ew = `${w}.oneOf[${i}]`;
    if (typeof e !== 'object' || e === null || Array.isArray(e)) refuse('fileInvalid', at, `${ew}: not an object`);
    only(e, ['const', 'title', 'x-code', 'x-term'], at, ew);
    if (typeof e.const !== 'string' || !e.const) refuse('fileInvalid', at, `${ew}.const is not a term's key`);
    if (e.title !== e.const) refuse('fileInvalid', at, `${ew}.title ${JSON.stringify(e.title)} is not ${JSON.stringify(e.const)}, the term's key`);
    if (e['x-code'] !== i) refuse('fileInvalid', at, `${ew}.x-code is ${JSON.stringify(e['x-code'])}, and a code is the term's place in the order (${i})`);
    const t = e['x-term'];
    if (typeof t !== 'object' || t === null || Array.isArray(t)) refuse('fileInvalid', at, `${ew}.x-term is absent or not an object: a term as the data form writes it`);
    if (Object.hasOwn(terms, e.const as string)) refuse('fileInvalid', at, `${ew}.const ${JSON.stringify(e.const)} is used twice in ${item}`);
    terms[e.const as string] = t;
  });
  return { kind: 'terms', ...itemHead(s), format: s['x-format'], spec: s['x-spec'], version: s['x-version'], ...(s['x-deprecated'] === undefined ? {} : { deprecated: true }), terms };
}

/** A map row's outcomes and covers: each its domain key and the data form's key it rebuilds, in the data form's order. */
const MAP_OUTCOMES = [['x-word', 'word'], ['x-extension', 'extension'], ['x-dropped', 'dropped']];
const MAP_COVERS = [['x-term', 'term'], ['x-from', 'from']];
/** A map row's keys in the data form's order (docs/descriptors.md): term, from, word, extension, dropped, doc. */
const MAP_ROW_KEYS = [...MAP_COVERS, ...MAP_OUTCOMES, ['description', 'doc']];
const TERM_LINK = /^[A-Z][A-Z0-9_]*#[A-Za-z0-9][A-Za-z0-9._/+-]*$/;

/** The data form's rows of a map item read with readMap(): each keyed by its `const`, in the `oneOf`'s order. */
const mapRows = (s: JsonObject): JsonObject => Object.fromEntries((s.oneOf as JsonObject[]).map((e) => [e.const, Object.fromEntries(MAP_ROW_KEYS.filter(([k]) => e[k!] !== undefined).map(([k, d]) => [d, e[k!]]))]));

/**
 * A map item (omx-contract#191, owner ruling 2026-11-23; docs/contract-dir.md "Domains"): one format's mapping table,
 * `x-format` the item's, and a `oneOf` of one row per source field: `const` and `title` the field, `x-code` its place,
 * exactly one outcome (`x-word`, `x-extension` or `x-dropped` with its ruling), exactly one cover (`x-term`, the term
 * link into a terms item, or `x-from`) and `description` its doc. Read as the data form's formatMap item, whose rows the
 * build holds to the schema and whose term links validate resolves (rule map-term). The runtime readers serve it as
 * words, the words the source keys.
 */
function readMap(item: string, s: JsonObject, at: string): JsonObject {
  const w = `components.schemas.${item}`;
  only(s, ['description', 'x-since', 'x-why', 'x-kind', 'x-file', 'x-source', 'x-format', 'oneOf'], at, w);
  if (typeof s.description !== 'string') refuse('fileInvalid', at, `${w}.description is the item's doc`);
  if (typeof s['x-format'] !== 'string') refuse('fileInvalid', at, `${w}.x-format is absent or not a string: a map item names the format whose fields it maps`);
  if (!Array.isArray(s.oneOf) || !s.oneOf.length) refuse('fileInvalid', at, `${w}: a map item is a oneOf of at least one row`);
  const seen = new Set<string>();
  (s.oneOf as JsonObject[]).forEach((e, i) => {
    const ew = `${w}.oneOf[${i}]`;
    if (typeof e !== 'object' || e === null || Array.isArray(e)) refuse('fileInvalid', at, `${ew}: not an object`);
    only(e, ['const', 'title', 'x-code', 'description', ...MAP_COVERS.map(([k]) => k!), ...MAP_OUTCOMES.map(([k]) => k!)], at, ew);
    if (typeof e.const !== 'string' || !e.const) refuse('fileInvalid', at, `${ew}.const is not a source field`);
    const row = `${ew} (${e.const})`;
    if (e.title !== e.const) refuse('fileInvalid', at, `${row}: its title ${JSON.stringify(e.title)} is not ${JSON.stringify(e.const)}, the source key`);
    if (e['x-code'] !== i) refuse('fileInvalid', at, `${row}: its x-code ${JSON.stringify(e['x-code'])} is not its place in the order (${i})`);
    if (seen.has(e.const as string)) refuse('fileInvalid', at, `${row}: the source key is used twice in ${item}`);
    seen.add(e.const as string);
    if (e.description !== undefined && typeof e.description !== 'string') refuse('fileInvalid', at, `${row}: its description is not a string`);
    const outcomes = MAP_OUTCOMES.map(([k]) => k!).filter((k) => e[k] !== undefined);
    if (!outcomes.length) refuse('fileInvalid', at, `${row} has no outcome: a row has exactly one of x-word, x-extension or x-dropped`);
    if (outcomes.length > 1) refuse('fileInvalid', at, `${row} has ${outcomes.length === 2 ? 'two' : 'three'} outcomes, ${outcomes.join(' and ')}: a row has exactly one of x-word, x-extension or x-dropped`);
    const covers = MAP_COVERS.map(([k]) => k!).filter((k) => e[k] !== undefined);
    if (!covers.length) refuse('fileInvalid', at, `${row} covers nothing: a row names exactly one of x-term or x-from`);
    if (covers.length > 1) refuse('fileInvalid', at, `${row} covers twice, x-term and x-from: a row names exactly one of x-term or x-from`);
    if (e['x-term'] !== undefined && (typeof e['x-term'] !== 'string' || !TERM_LINK.test(e['x-term']))) refuse('fileInvalid', at, `${row}: its x-term ${JSON.stringify(e['x-term'])} is no term link <TERMS item>#<term>`);
    if (e['x-from'] !== undefined && (typeof e['x-from'] !== 'string' || !e['x-from'])) refuse('fileInvalid', at, `${row}: its x-from is not a link or a URL`);
    if (e['x-extension'] !== undefined && e['x-extension'] !== true) refuse('fileInvalid', at, `${row}: its x-extension is not true`);
    const d = e['x-dropped'] as JsonObject | undefined;
    if (d !== undefined && (typeof d !== 'object' || d === null || Array.isArray(d) || typeof d.ruling !== 'string' || !d.ruling)) refuse('fileInvalid', at, `${row}: its x-dropped names no ruling: a dropped row is { "ruling": <the ruling that drops it> }`);
    const x = e['x-word'] as JsonObject | undefined;
    if (x !== undefined && (typeof x !== 'object' || x === null || Array.isArray(x) || typeof x.word !== 'string' || typeof x.transform !== 'string')) refuse('fileInvalid', at, `${row}: its x-word is not { word, transform }, the descriptor word and the transform that converts the field`);
  });
  return { kind: 'formatMap', ...itemHead(s), format: s['x-format'], rows: mapRows(s) };
}

/** A scalar item (docs/contract-dir.md, "Domains"): one value, `x-value` a number or true or false, in `x-unit` (`""` for none). render --with-domain rebuilds it as a data scalar; it is read nowhere else. */
function readScalar(item: string, s: JsonObject, at: string): void {
  const w = `components.schemas.${item}`;
  only(s, ['description', 'x-since', 'x-why', 'x-kind', 'x-file', 'x-source', 'x-unit', 'x-value'], at, w);
  if (typeof s.description !== 'string') refuse('fileInvalid', at, `${w}.description is the item's doc`);
  if (typeof s['x-unit'] !== 'string') refuse('fileInvalid', at, `${w}.x-unit is not the scalar's unit, a string ("" for none)`);
  const v = s['x-value'];
  if (typeof v !== 'boolean' && (typeof v !== 'number' || !Number.isFinite(v))) refuse('fileInvalid', at, `${w}.x-value ${JSON.stringify(v)} is not the scalar's value, a number or true or false`);
}

/**
 * A word's stored `x-args` (docs/contract-dir.md, "Domains"): the ordered names of the `{name}` placeholders of its
 * `x-text`, each placeholder once and no other name; a word whose `x-text` has no placeholder carries none. Stored,
 * never derived: its order is the order a renderer and a catalog read.
 */
function readArgs(e: JsonObject, ew: string, at: string): void {
  const args = e['x-args'];
  const named = placeholdersOf(e['x-text']);
  const want = [...named].map((p) => `{${p}}`).join(', ') || 'none';
  const word = JSON.stringify(e.const);
  if (args === undefined) {
    if (named.size) refuse('fileInvalid', at, `${ew}.x-args is absent, and the x-text of the word ${word} names ${want}: a word stores the args its sentence names`);
    return;
  }
  if (e['x-text'] === undefined) refuse('fileInvalid', at, `${ew}.x-args ${JSON.stringify(args)} of the word ${word}: a word with no x-text has no args`);
  if (!Array.isArray(args) || args.some((a) => typeof a !== 'string' || !ARG.test(a))) refuse('fileInvalid', at, `${ew}.x-args ${JSON.stringify(args)} of the word ${word} is not a list of placeholder names (lowerCamel)`);
  const list = args as string[];
  if (new Set(list).size !== list.length || list.length !== named.size || list.some((a) => !named.has(a)))
    refuse('fileInvalid', at, `${ew}.x-args ${JSON.stringify(list)} of the word ${word} are not the placeholders of its x-text (${want}): each placeholder once, and no other name`);
}

/**
 * The domain document `doc`, installed as `<name>/<name>.json`, as `{ doc, manifest }`: `doc` the classic file of its
 * items, `manifest` the domain's `{ package, owner, version, schemaMajor, title }` as a package of the read, `codes` the
 * items it marks `x-c-codes`, `names` every item of the document, a range item's among them (its codes header, docs/render.md) and whether each also marks `x-c-xmacro`.
 * @throws ContractRefusal contract.manifest.invalid for a `$id`, `info` or place that disagrees, contract.file.invalid
 * for a shape the reader does not read.
 */
/** A resource-hint item's data keys from its domain words (V28, #189): units, bases and extension, in the data form's order. */
const hintsOf = (s: JsonObject): JsonObject => ({ ...(s['x-units'] === undefined ? {} : { units: s['x-units'] }), ...(s['x-bases'] === undefined ? {} : { bases: s['x-bases'] }), ...(s['x-extension'] === undefined ? {} : { extension: s['x-extension'] }) });
/** A resource hint's figureUnit and basis from its domain words (V28, #189), in the data form's order. */
const hintOf = (e: JsonObject): JsonObject => ({ ...(e['x-figure-unit'] === undefined ? {} : { figureUnit: e['x-figure-unit'] }), ...(e['x-basis'] === undefined ? {} : { basis: e['x-basis'] }) });

export function readDomain(name: string, doc: JsonObject, schemaUrl: string, schemaMajor: number): { doc: JsonObject; manifest: JsonObject; codes: DomainCodes; names: string[] } {
  const at = domainPath(name);
  if (doc.$id !== domainId(name)) refuse('manifestInvalid', at, `$id ${JSON.stringify(doc.$id)} is not ${domainId(name)}, the id of the domain whose directory this is`);
  only(doc, ['$schema', '$id', 'info', 'components', 'x-render', 'x-file'], at, 'domain document');
  if (doc.$schema !== DOMAIN_SCHEMA) refuse('fileInvalid', at, `$schema ${JSON.stringify(doc.$schema)} is not ${DOMAIN_SCHEMA}: a domain document is JSON Schema 2020-12`);
  const info = doc.info as JsonObject | undefined;
  if (typeof info !== 'object' || info === null || Array.isArray(info)) refuse('manifestInvalid', at, 'info is not an object');
  only(info, ['title', 'version', 'x-owner', 'x-stability', 'x-requires'], at, 'info');
  if (typeof info.title !== 'string' || !info.title) refuse('manifestInvalid', at, 'info.title is not a sentence');
  if (typeof info.version !== 'string' || !VERSION.test(info.version)) refuse('manifestInvalid', at, `info.version ${JSON.stringify(info.version)} is not x.y.z`);
  if (typeof info['x-owner'] !== 'string' || !PACKAGE.test(info['x-owner'])) refuse('manifestInvalid', at, `info.x-owner ${JSON.stringify(info['x-owner'])} is not a package name`);
  if (info['x-stability'] !== 'experimental' && info['x-stability'] !== 'stable') refuse('manifestInvalid', at, `info.x-stability ${JSON.stringify(info['x-stability'])} is not experimental or stable`);
  const req = info['x-requires'];
  if (req !== undefined) {
    if (typeof req !== 'object' || req === null || Array.isArray(req)) refuse('manifestInvalid', at, `info.x-requires ${JSON.stringify(req)} is not a map of package to floor ">= x.y.z"`);
    for (const [k, v] of Object.entries(req as JsonObject)) {
      if (!REQUIRED.test(k)) refuse('manifestInvalid', at, `info.x-requires names ${JSON.stringify(k)}, which is no package or domain name`);
      if (typeof v !== 'string' || !FLOOR.test(v)) refuse('manifestInvalid', at, `info.x-requires.${k} ${JSON.stringify(v)} is not a floor ">= x.y.z"`);
    }
  }
  const comp = doc.components as JsonObject | undefined;
  if (typeof comp !== 'object' || comp === null || Array.isArray(comp)) refuse('fileInvalid', at, 'components is not an object');
  only(comp, ['schemas'], at, 'components');
  const schemas = comp.schemas as Record<string, JsonObject> | undefined;
  if (typeof schemas !== 'object' || schemas === null || Array.isArray(schemas) || !Object.keys(schemas).length) refuse('fileInvalid', at, 'components.schemas is not a map of at least one schema');
  const codes = new Map<string, { xmacro: boolean }>();
  const names: string[] = [];
  const out: JsonObject = { $schema: schemaUrl, requires: { 'omx-contract-schema': REBUILT_SCHEMA_FLOOR } };
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
    if (s['x-kind'] === 'scalar') { readScalar(item, s, at); names.push(item); continue; } // one value, rebuilt by render --with-domain, read nowhere else
    if (s['x-kind'] === 'terms') { out[item] = readTerms(item, s, at); names.push(item); continue; } // a format's terms, served as words
    if (s['x-kind'] === 'map') { out[item] = readMap(item, s, at); names.push(item); continue; } // a format's mapping table, served as words
    only(s, ['description', 'x-since', 'x-why', 'x-groups', 'x-dimensions', 'x-units', 'x-bases', 'x-extension', 'x-default', 'x-c-codes', 'x-c-xmacro', 'x-kind', 'x-file', 'x-source', 'oneOf'], at, w);
    if (s['x-kind'] !== undefined && !WORDS_KINDS.includes(s['x-kind'])) refuse('fileInvalid', at, `${w}.x-kind ${JSON.stringify(s['x-kind'])} is not ${WORDS_KINDS.join(', ')}, terms, map, scalar or sheet`);
    for (const k of ['x-c-codes', 'x-c-xmacro'])
      if (s[k] !== undefined && typeof s[k] !== 'boolean') refuse('fileInvalid', at, `${w}.${k} is not true or false`);
    if (s['x-c-xmacro'] === true && s['x-c-codes'] !== true) refuse('fileInvalid', at, `${w}.x-c-xmacro without x-c-codes: the X-macro is part of the item's codes header`);
    if (s['x-c-codes'] === true) codes.set(item, { xmacro: s['x-c-xmacro'] === true });
    for (const k of ['x-groups', 'x-dimensions', 'x-units', 'x-bases'])
      if (s[k] !== undefined && (typeof s[k] !== 'string' || !(s[k] in schemas))) refuse('fileInvalid', at, `${w}.${k} ${JSON.stringify(s[k])} is no words schema of this document`);
    if (s['x-extension'] !== undefined && (typeof s['x-extension'] !== 'object' || s['x-extension'] === null || Array.isArray(s['x-extension'])))
      refuse('fileInvalid', at, `${w}.x-extension is not an object: the data form's extension, verbatim (V28)`);
    if (!Array.isArray(s.oneOf) || !s.oneOf.length) refuse('fileInvalid', at, `${w}: only a words item is read, a oneOf of const words`);
    if (typeof s.description !== 'string') refuse('fileInvalid', at, `${w}.description is the item's doc`);
    const words: JsonObject = {};
    s.oneOf.forEach((e: JsonObject, i: number) => {
      const ew = `${w}.oneOf[${i}]`;
      if (typeof e !== 'object' || e === null || Array.isArray(e)) refuse('fileInvalid', at, `${ew}: not an object`);
      only(e, ['const', 'title', 'description', 'x-code', 'x-text', 'x-args', 'x-group', 'x-from', 'x-name', 'x-symbol', 'x-uri', 'x-dimension', 'x-figure-unit', 'x-basis', ...VERB_KEYS.map(([k]) => k!), ...REPLY_KEYS.map(([k]) => k!)], at, ew);
      const kind = s['x-kind'] ?? 'codes';
      for (const [k] of VERB_KEYS) if (e[k!] !== undefined && kind !== 'verbs') refuse('fileInvalid', at, `${ew}.${k}: only a verb (a word of an item of x-kind verbs) carries ${k}`);
      if (kind === 'verbs') {
        for (const k of ['x-format', 'x-reply']) if (typeof e[k] !== 'string') refuse('fileInvalid', at, `${ew}.${k} is absent or not a string: a verb states its format and its reply`);
        const ib = e['x-implemented-by'];
        if (typeof ib !== 'object' || ib === null || Array.isArray(ib)) refuse('fileInvalid', at, `${ew}.x-implemented-by is absent or not an object: a verb states what each host owes it`);
        if (e['x-codes'] !== undefined && !Array.isArray(e['x-codes'])) refuse('fileInvalid', at, `${ew}.x-codes is not a list of { ref }`);
        if (e['x-since'] !== undefined && typeof e['x-since'] !== 'string') refuse('fileInvalid', at, `${ew}.x-since is not a version`);
      }
      for (const [k] of REPLY_KEYS) if (e[k!] !== undefined && kind !== 'codes') refuse('fileInvalid', at, `${ew}.${k}: only a code (a word of an item of x-kind codes) carries ${k}`);
      if (e['x-resp'] !== undefined && (!Number.isInteger(e['x-resp']) || (e['x-resp'] as number) > -1)) refuse('fileInvalid', at, `${ew}.x-resp ${JSON.stringify(e['x-resp'])} is not a negative whole number, the n of resp <n>`);
      if (e['x-transient'] !== undefined && typeof e['x-transient'] !== 'boolean') refuse('fileInvalid', at, `${ew}.x-transient is not true or false`);
      if (typeof e.const !== 'string' || !e.const) refuse('fileInvalid', at, `${ew}.const is not a word`);
      if (typeof e.title !== 'string' || !/^[A-Za-z][A-Za-z0-9]*$/.test(e.title)) refuse('fileInvalid', at, `${ew}.title is not the word's key`);
      if (e.description !== undefined && typeof e.description !== 'string') refuse('fileInvalid', at, `${ew}.description is not the word's line`);
      if (e['x-code'] !== i) refuse('fileInvalid', at, `${ew}.x-code is ${JSON.stringify(e['x-code'])}, and a code is the word's place in the order (${i})`);
      if (e['x-text'] !== undefined && typeof e['x-text'] !== 'string') refuse('fileInvalid', at, `${ew}.x-text is not a sentence`);
      readArgs(e, ew, at);
      if (s['x-kind'] === 'words' && e['x-name'] !== undefined) refuse('fileInvalid', at, `${ew}.x-name: a word of an x-kind words item is keyed by its title; x-name is a code's key`);
      if (e['x-group'] !== undefined) {
        const g = typeof s['x-groups'] === 'string' ? schemas[s['x-groups']] : undefined;
        const gone = g?.oneOf;
        const known = Array.isArray(gone) ? gone.map((x: JsonObject) => x.const) : [];
        if (!known.includes(e['x-group'])) refuse('fileInvalid', at, `${ew}.x-group ${JSON.stringify(e['x-group'])} is no word of the schema ${w}.x-groups names`);
      }
      if (e['x-symbol'] !== undefined && typeof e['x-symbol'] !== 'string') refuse('fileInvalid', at, `${ew}.x-symbol is not a string: a unit word's symbol as written`);
      // a unit word's id is camelCase, "/" read "Per" (docs/units.md, 2026-11-23): dBPerOct, never dB-oct or dB/oct
      if (e['x-symbol'] !== undefined && (typeof e.const !== 'string' || !UNIT_ID.test(e.const)))
        refuse('fileInvalid', at, `${ew}: the unit id ${JSON.stringify(e.const)} is not camelCase: letters and digits from a letter, no "-", "/" or space, "/" read "Per" (dB/oct is dBPerOct; docs/units.md)`);
      // the URI a format spells the word as, of any scheme (urn:openmixer:unit#dBoct as much as an http LV2 URI)
      if (e['x-uri'] !== undefined && (typeof e['x-uri'] !== 'string' || !ABSOLUTE_URI.test(e['x-uri'])))
        refuse('fileInvalid', at, `${ew} (${JSON.stringify(e.title)}).x-uri ${JSON.stringify(e['x-uri'])} is no absolute URI: <scheme>:<rest>, of any scheme`);
      if (e['x-dimension'] !== undefined) {
        if (typeof s['x-dimensions'] !== 'string') refuse('fileInvalid', at, `${ew}.x-dimension ${JSON.stringify(e['x-dimension'])}, and ${w} names no x-dimensions, the words item of its dimensions`);
        const known = ((schemas[s['x-dimensions'] as string]!.oneOf ?? []) as JsonObject[]).map((x) => x.const);
        if (!known.includes(e['x-dimension'])) refuse('fileInvalid', at, `${ew}.x-dimension ${JSON.stringify(e['x-dimension'])} is no word of ${s['x-dimensions']}, the schema ${w}.x-dimensions names`);
      }
      // a resource hint's figureUnit and basis (V28, #189): a word of the item x-units or x-bases names
      for (const [k, of] of [['x-figure-unit', 'x-units'], ['x-basis', 'x-bases']] as const) {
        if (e[k] === undefined) continue;
        if (typeof s[of] !== 'string') refuse('fileInvalid', at, `${ew}.${k} ${JSON.stringify(e[k])}, and ${w} names no ${of}, the words item it is a word of`);
        const known = ((schemas[s[of] as string]!.oneOf ?? []) as JsonObject[]).map((x) => x.const);
        if (!known.includes(e[k])) refuse('fileInvalid', at, `${ew}.${k} ${JSON.stringify(e[k])} is no word of ${s[of]}, the schema ${w}.${of} names`);
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
      words[e.title] = { word: e.const, ...(e['x-symbol'] === undefined ? {} : { symbol: e['x-symbol'] }), ...(e['x-uri'] === undefined ? {} : { uri: e['x-uri'] }), ...(e['x-dimension'] === undefined ? {} : { dimension: e['x-dimension'] }), ...(e['x-group'] === undefined ? {} : { group: e['x-group'] }), ...hintOf(e), ...(from.length ? { from } : {}), ...(e.description === undefined ? {} : { doc: e.description }), ...(e['x-text'] === undefined ? {} : { text: { en: e['x-text'] } }), ...(e['x-args'] === undefined ? {} : { args: e['x-args'] }) };
    });
    names.push(item);
    const consts = (s.oneOf as JsonObject[]).map((e) => e.const);
    if (s['x-default'] !== undefined && s['x-kind'] !== 'set') refuse('fileInvalid', at, `${w}.x-default: only a set (x-kind set) names a default`);
    if (s['x-default'] !== undefined && !consts.includes(s['x-default'])) refuse('fileInvalid', at, `${w}.x-default ${JSON.stringify(s['x-default'])} is no word of ${item}`);
    const head = itemHead(s);
    if (s['x-kind'] === 'set') { out[item] = { kind: 'set', ...head, ids: consts, ...(s['x-default'] === undefined ? {} : { default: s['x-default'] }) }; continue; }
    if (s['x-kind'] === 'verbs') { out[item] = { kind: 'verbs', ...head, verbs: Object.fromEntries((s.oneOf as JsonObject[]).map((e) => [e.title, verbOf(e)])) }; continue; }
    // a reply-code item (its words carry x-resp) is read as the data form's codes item, the one a verb's codes name
    if ((s['x-kind'] ?? 'codes') === 'codes' && (s.oneOf as JsonObject[]).some((e) => e['x-resp'] !== undefined)) {
      out[item] = { kind: 'codes', ...head, codes: Object.fromEntries((s.oneOf as JsonObject[]).map((e, i) => {
        if (typeof e['x-name'] !== 'string') refuse('fileInvalid', at, `${w}.oneOf[${i}]: the word ${JSON.stringify(e.const)} of a reply-code item has no x-name, its key`);
        return [e['x-name'], { code: e.const, ...Object.fromEntries(REPLY_KEYS.filter(([k]) => e[k!] !== undefined).map(([k, d]) => [d, e[k!]])), ...(e.description === undefined ? {} : { doc: e.description }), ...(e['x-text'] === undefined ? {} : { text: { en: e['x-text'] } }), ...(e['x-args'] === undefined ? {} : { args: e['x-args'] }) }];
      })) };
      continue;
    }
    out[item] = { kind: 'words', ...head, ...(s['x-groups'] === undefined ? {} : { groups: s['x-groups'] }), ...(s['x-dimensions'] === undefined ? {} : { dimensions: s['x-dimensions'] }), ...hintsOf(s), words };
  }
  return { doc: out, codes, names, manifest: { package: name, owner: info['x-owner'], version: info.version, schemaMajor, title: info.title } };
}

/** A domain's `info.x-requires`, `{ <package>: '>= x.y.z' }` ({} when it declares none). Read the document with readDomain() first. */
export function domainRequires(doc: JsonObject): Record<string, string> {
  return ((doc.info as JsonObject)['x-requires'] ?? {}) as Record<string, string>;
}

/** A word's term taken from a domain: where it is written, the word, the domain or package `to` and the `item` and `term` there. */
export interface DomainFrom {
  readonly where: string; readonly word: string; readonly to: string; readonly item: string; readonly term: string;
  /** The word's place in its item (its x-code), its description and its x-text, for word-from-differs. */
  readonly code: number; readonly doc?: unknown; readonly text?: unknown;
}

function fromsOf(item: string, s: JsonObject): DomainFrom[] {
  if (s['x-kind'] === 'map') return []; // a map row's x-from is the link of a field no terms item holds, no term taken
  return ((s.oneOf ?? []) as JsonObject[]).flatMap((e, i) => ((e['x-from'] ?? []) as JsonObject[]).map((r, j) => ({
    where: `components.schemas.${item}.oneOf[${i}].x-from[${j}]`,
    word: e.const as string,
    to: (r.$ref as string).slice(domainId('').length).split('#')[0]!,
    item: REF.exec(r.$ref as string)![1]!,
    term: r['x-term'] as string,
    code: i,
    doc: e.description,
    text: e['x-text'],
  })));
}

/**
 * The terms and words the words of a domain take (`x-from`), for the read of a contract directory to resolve in the
 * package or domain each names: with `rebuilt` (the default) only the words of the items with an `x-file`, the ones
 * `render --with-domain` rebuilds; else every word. Read the document with readDomain() first.
 */
export function domainFroms(doc: JsonObject, { rebuilt = true }: { rebuilt?: boolean } = {}): DomainFrom[] {
  return Object.entries((doc.components as JsonObject).schemas as Record<string, JsonObject>).filter(([, s]) => !rebuilt || s['x-file'] !== undefined).flatMap(([item, s]) => fromsOf(item, s));
}

/**
 * The data files a domain was made from (docs/render.md, `render --with-domain`), `{ <x-file>: <text> }`: the items of
 * one `x-file` in the document's order, each `{ kind, since, source, doc, why, ... }`: `x-kind` codes (the default)
 * with `codes` (each word's `x-name` its key, `const` its code, `description` its doc, `x-text` its English text,
 * `x-args` its args), `x-kind` words with `groups` and `words` (each word's `title` its key, `const` its word, `x-group`
 * its group, `x-from` its terms, `description`, `x-text` and `x-args` as for a code), `x-kind` scalar with `unit` and
 * `value`, `x-kind` map as a formatMap with `format` and `rows` (each row `{ term, from, word, extension, dropped, doc }`),
 * and `x-kind` sheet with `value` and `docs`; the root's `x-render` goes to the file the root's `x-file`
 * names. A domain that declares `info.x-requires` gives every file it rebuilds `requires`, first: the schema floor,
 * then the declared packages in name order; a word whose `x-from` reaches a package beyond those, omx-contract, the
 * domain and its owner is refused by name. Read the document with readDomain() first. An item with no `x-file` is read
 * at run time only: it is not rebuilt, and not refused (a domain may hold both).
 */
export function domainDataFiles(name: string, doc: JsonObject): Record<string, string> {
  const at = domainPath(name);
  const files: Record<string, JsonObject> = {};
  const declared = domainRequires(doc);
  // what a rebuilt file needs: the schema floor, then the declared packages in name order; none when none is declared
  const requires = Object.keys(declared).length ? { 'omx-contract-schema': REBUILT_SCHEMA_FLOOR, ...Object.fromEntries(Object.entries(declared).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) } : undefined;
  const fileOf = (rel: unknown, w: string): JsonObject => {
    if (typeof rel !== 'string' || !rel.endsWith('.json')) refuse('fileInvalid', at, `${w}.x-file is not the data path the item came from`);
    // a path inside the data directory only: relative, forward slashes, no empty, . or .. segment
    if (rel.startsWith('/') || rel.includes('\\') || rel.split('/').some((g) => g === '' || g === '.' || g === '..'))
      refuse('fileInvalid', at, `${w}.x-file ${JSON.stringify(rel)} leaves the data directory: a relative path with no empty, . or .. segment and no backslash`);
    return (files[rel as string] ??= requires === undefined ? {} : { requires: { ...requires } });
  };
  if (doc['x-render'] !== undefined) fileOf(doc['x-file'], 'the root').render = doc['x-render'];
  for (const [item, s] of Object.entries((doc.components as JsonObject).schemas as Record<string, JsonObject>)) {
    const w = `components.schemas.${item}`;
    if (s['x-file'] === undefined) continue; // read at run time only: no data file holds it
    const f = fileOf(s['x-file'], w);
    const head = { kind: s['x-kind'] === 'map' ? 'formatMap' : s['x-kind'] ?? 'codes', ...itemHead(s) };
    if (s['x-kind'] === 'sheet') { f[item] = { ...head, value: s['x-value'], ...(s['x-docs'] === undefined ? {} : { docs: s['x-docs'] }) }; continue; }
    if (s['x-kind'] === 'scalar') { f[item] = { ...head, unit: s['x-unit'], value: s['x-value'] }; continue; }
    if (s['x-kind'] === 'terms') {
      f[item] = { ...head, format: s['x-format'], spec: s['x-spec'], version: s['x-version'], ...(s['x-deprecated'] === undefined ? {} : { deprecated: true }), terms: Object.fromEntries((s.oneOf as JsonObject[]).map((e) => [e.const, e['x-term']])) };
      continue;
    }
    if (s['x-kind'] === 'map') { f[item] = { ...head, format: s['x-format'], rows: mapRows(s) }; continue; }
    if (s['x-kind'] === 'verbs') { f[item] = { ...head, verbs: Object.fromEntries((s.oneOf as JsonObject[]).map((e) => [e.title, verbOf(e)])) }; continue; }
    // what a word says beside its key, in the order of the data form: doc, text, args
    const said = (e: JsonObject): JsonObject => ({ ...(e.description === undefined ? {} : { doc: e.description }), ...(e['x-text'] === undefined ? {} : { text: { en: e['x-text'] } }), ...(e['x-args'] === undefined ? {} : { args: e['x-args'] }) });
    // a rebuilt file requires what the domain declares: a from reaches omx-contract, the domain, its owner or a declared package
    const owner = (doc.info as JsonObject)['x-owner'] as string;
    for (const f of fromsOf(item, s)) {
      if (f.to !== name && f.to !== owner && f.to !== 'omx-contract' && !Object.hasOwn(declared, f.to))
        refuse('fileInvalid', at, `${f.where} of the word ${JSON.stringify(f.word)} names a term of ${f.to}, a package the domain does not declare: info.x-requires names the packages a rebuilt file requires (${Object.keys(declared).join(', ') || 'none'}), and render --with-domain refuses a from beyond them, omx-contract, the domain ${name} and its owner ${owner}`);
    }
    if (s['x-kind'] === 'words') {
      const words: JsonObject = {};
      for (const e of s.oneOf as JsonObject[]) {
        const from = ((e['x-from'] ?? []) as JsonObject[]).map((r) => `${REF.exec(r.$ref as string)![1]}#${r['x-term']}`);
        words[e.title as string] = { word: e.const, ...(e['x-symbol'] === undefined ? {} : { symbol: e['x-symbol'] }), ...(e['x-uri'] === undefined ? {} : { uri: e['x-uri'] }), ...(e['x-dimension'] === undefined ? {} : { dimension: e['x-dimension'] }), ...(e['x-group'] === undefined ? {} : { group: e['x-group'] }), ...hintOf(e), ...(from.length ? { from } : {}), ...said(e) };
      }
      f[item] = { ...head, ...(s['x-groups'] === undefined ? {} : { groups: s['x-groups'] }), ...(s['x-dimensions'] === undefined ? {} : { dimensions: s['x-dimensions'] }), ...hintsOf(s), words };
      continue;
    }
    if (s['x-kind'] === 'set') { f[item] = { ...head, ids: (s.oneOf as JsonObject[]).map((e) => e.const), ...(s['x-default'] === undefined ? {} : { default: s['x-default'] }) }; continue; }
    const codes: JsonObject = {};
    for (const e of s.oneOf as JsonObject[]) {
      if (typeof e['x-name'] !== 'string') refuse('fileInvalid', at, `${w}: the word ${JSON.stringify(e.const)} has no x-name, its key in the data item`);
      codes[e['x-name'] as string] = { code: e.const, ...Object.fromEntries(REPLY_KEYS.filter(([k]) => e[k!] !== undefined).map(([k, d]) => [d, e[k!]])), ...said(e) };
    }
    f[item] = { ...head, codes };
  }
  return Object.fromEntries(Object.entries(files).map(([rel, d]) => [rel, `${JSON.stringify(d, null, 2)}\n`]));
}
