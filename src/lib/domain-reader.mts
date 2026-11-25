// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * The TypeScript runtime reader of a domain (docs/runtime-data.md, "TypeScript and Python"): the counterpart of the C
 * loader (`omx_domain_open_at`, src/c/omx_domain.c). `openDomainAt(dirs, domain, needs)` reads
 * `<dir>/<domain>/<last segment>.json` and its `catalogs/`, checks the structure the lookups read with the same rules,
 * the same codes and the same members in its messages as the C loader, and returns a handle to look words, ranges and
 * sentences up. The two readers are held to each other by one suite, test/fixtures/conformance/cases.json, which
 * test/c/conformance_test.c and test/domain-conformance.test.mjs both run. The full JSON Schema check of a document
 * stays with the build (`loadContractDir`, `omx-contract validate`).
 */
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { refuse } from './codes.mjs';
import { FORMAT, FORMAT_MAJOR } from './format.mjs';
import { parseStrict } from './json-strict.mjs';
import { placeholdersOf } from './placeholders.mjs';

/** The longest domain name, as in the C header (`OMX_DOMAIN_NAME_MAX`). */
export const DOMAIN_NAME_MAX = 255;

/** A word of a words item: as written, its key, its line (undefined when it has none) and its code. */
export interface DomainWord { readonly word: string; readonly title: string; readonly description?: string; readonly code: number }
/** The value of a scalar item (since 3.21.0): a number, or true or false, in its unit (`''` for none). */
export interface DomainScalar { readonly value: number | boolean; readonly unit: string }
/** A parameter of a range item. */
export interface DomainRange { readonly min: number; readonly max: number; readonly default?: number; readonly unit: string; readonly scale: string }
/** One catalog of a domain: its language and its sentences by key. */
export interface DomainCatalog { readonly lang: string; readonly messages: ReadonlyMap<string, string> }

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (o: unknown, k: string): string | undefined => (isObj(o) && typeof o[k] === 'string' ? (o[k] as string) : undefined);

const VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
// info.x-requires: a list of package or domain names, no version (docs/contract-dir.md, "Domains"; the devel wave 2026-11-24)
const REQUIRED = /^[a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)*$/;
const NAME = /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*$/;
const LANG = /^[A-Za-z]{2,8}(-[A-Za-z0-9]{1,8})*$/;
const ID_PREFIX = 'https://openmixer.org/contract/';
const triple = (v: string): bigint[] => VERSION.exec(v)!.slice(1, 4).map(BigInt);
const below = (have: bigint[], floor: bigint[]): boolean => {
  for (let i = 0; i < 3; i++) if (have[i] !== floor[i]) return have[i]! < floor[i]!;
  return false;
};

/** The last segment of a valid domain name: the document's file stem. */
const stem = (domain: string): string => domain.slice(domain.lastIndexOf('/') + 1);

/** Parse `text`; a syntax error or a key written twice is a refusal named `code`. */
function load(text: string, code: 'fileNotJson' | 'catalogInvalid', what: string, at: string): unknown {
  try { return parseStrict(text); } catch (e) { return refuse(code, at, `${what} does not parse as JSON: ${(e as Error).message}.`); }
}

/**
 * The catalogs of a domain directory `ddir` (`<ddir>/catalogs/<lang>.json`): each a regular file (never a symlink) named by a
 * language tag, JSON with a `lang` that is its name and a `messages` object of entries with a `text`. Sorted by language.
 * @throws ContractRefusal contract.catalog.invalid for the first that is not.
 */
export function readCatalogs(ddir: string, domain: string): DomainCatalog[] {
  const cdir = join(ddir, 'catalogs');
  let names: string[];
  try { names = readdirSync(cdir); } catch { return []; } // no catalogs: the source sentences are the only language
  const out: DomainCatalog[] = [];
  for (const f of names.filter((n) => n.length > 5 && n.endsWith('.json')).sort()) {
    const file = join(cdir, f);
    const lang = f.slice(0, -5);
    const at = `${domain}/catalogs/${f}`;
    if (!LANG.test(lang)) refuse('catalogInvalid', at, `The catalog ${file} of the domain ${domain} is not named by a language tag (es, pt-BR).`);
    if (!lstatSync(file).isFile()) refuse('catalogInvalid', at, `The catalog ${file} of the domain ${domain} is not a regular file (a symlink is refused).`);
    const root = load(readFileSync(file, 'utf8'), 'catalogInvalid', `The catalog ${file} of the domain ${domain}`, at);
    const msgs = isObj(root) ? root.messages : undefined;
    if (!isObj(msgs)) refuse('catalogInvalid', at, `The catalog ${file} of the domain ${domain} has no "messages" object.`);
    if ((root as Obj).lang !== lang) refuse('catalogInvalid', at, `The catalog ${file} of the domain ${domain} has "lang" ${JSON.stringify((root as Obj).lang)}, and its file name says "${lang}".`);
    const messages = new Map<string, string>();
    for (const [key, m] of Object.entries(msgs)) {
      const text = str(m, 'text');
      if (text === undefined) refuse('catalogInvalid', at, `The catalog ${file} of the domain ${domain}: the entry "${key}" has no string "text".`);
      messages.set(key, text!);
    }
    out.push({ lang, messages });
  }
  return out;
}

interface WordsItem { readonly words: DomainWord[]; readonly texts: Map<string, string> }
interface RangeItem { readonly params: Map<string, DomainRange> }
interface ScalarItem { readonly scalar: DomainScalar }

/** An opened, validated domain: read-only lookups of its words, ranges and sentences. */
export class Domain {
  /** @internal */
  constructor(private readonly wordItems: Map<string, WordsItem>, private readonly rangeItems: Map<string, RangeItem>, readonly catalogs: readonly DomainCatalog[], private readonly scalarItems: Map<string, ScalarItem> = new Map()) {}

  private item(name: string): WordsItem | RangeItem | ScalarItem {
    const it = this.wordItems.get(name) ?? this.rangeItems.get(name) ?? this.scalarItems.get(name);
    if (!it) refuse('itemUnknown', name, `The domain has no item ${name}.`);
    return it!;
  }

  /** The words of a words item in declared order. @throws ContractRefusal contract.item.unknown. */
  words(item: string): readonly DomainWord[] {
    const it = this.item(item);
    return 'words' in it ? it.words : [];
  }

  /** A word of an item by the word as written. @throws ContractRefusal contract.item.unknown, contract.word.unknown. */
  word(item: string, word: string): DomainWord {
    const w = this.words(item).find((x) => x.word === word);
    if (!w) refuse('wordUnknown', `${item}.${word}`, `The item ${item} has no word "${word}".`);
    return w!;
  }

  /** A parameter of a range item. @throws ContractRefusal contract.item.unknown, contract.word.unknown. */
  range(item: string, name: string): DomainRange {
    const it = this.item(item);
    const p = 'params' in it ? it.params.get(name) : undefined;
    if (!p) refuse('wordUnknown', `${item}.${name}`, `The item ${item} has no parameter "${name}".`);
    return p!;
  }

  /** The value and unit of a scalar item (since 3.21.0). @throws ContractRefusal contract.item.unknown, contract.word.unknown for a words or range item. */
  scalar(item: string): DomainScalar {
    const it = this.item(item);
    if (!('scalar' in it)) refuse('wordUnknown', item, `The item ${item} is no scalar: it has no value.`);
    return (it as ScalarItem).scalar;
  }

  /** The sentence of a word (`<ITEM>.<word>`) in `lang`, else its English source sentence; undefined when it has neither. */
  text(lang: string | undefined, key: string): string | undefined {
    const dot = key.indexOf('.');
    if (dot < 0) return undefined;
    const it = this.wordItems.get(key.slice(0, dot));
    const w = it?.words.find((x) => x.word === key.slice(dot + 1));
    if (!it || !w) return undefined;
    if (lang !== undefined && lang !== 'en') {
      const m = this.catalogs.find((c) => c.lang === lang)?.messages.get(key);
      if (m !== undefined) return m;
    }
    return it.texts.get(w.word);
  }
}

/** A word's `x-args` (3.21.0): exactly the placeholders of its `x-text`, each once; none when it names none; never without a text. */
function argsAgree(args: unknown, text: string | undefined): boolean {
  const named = placeholdersOf(text);
  if (args === undefined) return named.size === 0;
  if (text === undefined || !Array.isArray(args) || args.some((a) => typeof a !== 'string' || /[{}]/.test(a))) return false;
  return new Set(args).size === args.length && args.length === named.size && args.every((a) => named.has(a as string));
}

/** A scalar item (3.21.0): `x-kind` "scalar", `x-value` a number or true or false, `x-unit` a string. */
function readScalar(item: string, o: Obj, path: string, domain: string): ScalarItem {
  const lead = `The domain ${domain} at ${path}`;
  const v = o['x-value'];
  if (typeof v !== 'boolean' && (typeof v !== 'number' || !Number.isFinite(v))) refuse('fileInvalid', path, `${lead}: the scalar ${item} has no number, true or false "x-value".`);
  if (typeof o['x-unit'] !== 'string') refuse('fileInvalid', path, `${lead}: the scalar ${item} has no string "x-unit".`);
  return { scalar: { value: v as number | boolean, unit: o['x-unit'] as string } };
}

function readWords(item: string, oneOf: unknown[], path: string, domain: string): WordsItem {
  const words: DomainWord[] = [];
  const texts = new Map<string, string>();
  oneOf.forEach((w, at) => {
    const lead = `The domain ${domain} at ${path}`;
    if (isObj(w) && '$ref' in w) refuse('fileInvalid', path, `${lead}: ${item}.oneOf[${at}] has a "$ref", which the loader does not read.`);
    const word = str(w, 'const');
    if (!isObj(w) || word === undefined) refuse('fileInvalid', path, `${lead}: ${item}.oneOf[${at}] has no string "const".`);
    const o = w as Obj;
    if (typeof o.title !== 'string') refuse('fileInvalid', path, `${lead}: the word "${word}" of ${item} has no string "title".`);
    if (o.description !== undefined && typeof o.description !== 'string') refuse('fileInvalid', path, `${lead}: the "description" of the word "${word}" of ${item} is not a string.`);
    const code = o['x-code'];
    if (typeof code !== 'number' || !Number.isInteger(code) || code < 0 || code > 0x7fffffff) refuse('fileInvalid', path, `${lead}: the word "${word}" of ${item} has no non-negative integer "x-code".`);
    if (o['x-text'] !== undefined && typeof o['x-text'] !== 'string') refuse('fileInvalid', path, `${lead}: the "x-text" of the word "${word}" of ${item} is not a string.`);
    if (code !== at) refuse('fileInvalid', path, `${lead}: the word "${word}" of ${item} has x-code ${code}, and must have its place in the list, ${at}.`);
    if (!argsAgree(o['x-args'], o['x-text'] as string | undefined)) refuse('fileInvalid', path, `${lead}: the "x-args" of the word "${word}" of ${item} are not exactly the placeholders of its "x-text", each once.`);
    if (words.some((x) => x.word === word)) refuse('fileInvalid', path, `${lead}: ${item} declares the word "${word}" twice.`);
    words.push({ word: word!, title: o.title as string, ...(o.description === undefined ? {} : { description: o.description as string }), code: code as number });
    if (o['x-text'] !== undefined) texts.set(word!, o['x-text'] as string);
  });
  return { words, texts };
}

function readParams(item: string, props: Obj, path: string, domain: string): RangeItem {
  const params = new Map<string, DomainRange>();
  const lead = `The domain ${domain} at ${path}`;
  for (const [name, p] of Object.entries(props)) {
    if (isObj(p) && '$ref' in p) refuse('fileInvalid', path, `${lead}: the parameter "${name}" of ${item} has a "$ref", which the loader does not read.`);
    if (!isObj(p) || typeof p.minimum !== 'number' || typeof p.maximum !== 'number') refuse('fileInvalid', path, `${lead}: the parameter "${name}" of ${item} has no numeric "minimum" and "maximum".`);
    const o = p as Obj;
    const mn = o.minimum as number, mx = o.maximum as number, df = o.default;
    if (df !== undefined && typeof df !== 'number') refuse('fileInvalid', path, `${lead}: the "default" of the parameter "${name}" of ${item} is not a number.`);
    if (mn > mx) refuse('fileInvalid', path, `${lead}: the parameter "${name}" of ${item} has a minimum above its maximum.`);
    if (df !== undefined && ((df as number) < mn || (df as number) > mx)) refuse('fileInvalid', path, `${lead}: the "default" of the parameter "${name}" of ${item} is outside its minimum and maximum.`);
    if ((o['x-unit'] !== undefined && typeof o['x-unit'] !== 'string') || (o['x-scale'] !== undefined && typeof o['x-scale'] !== 'string')) refuse('fileInvalid', path, `${lead}: the "x-unit" or "x-scale" of the parameter "${name}" of ${item} is not a string.`);
    params.set(name, { min: mn, max: mx, ...(df === undefined ? {} : { default: df as number }), unit: (o['x-unit'] as string | undefined) ?? '', scale: (o['x-scale'] as string | undefined) ?? '' });
  }
  return { params };
}

/**
 * Open `domain` from the first of `dirs` (a directory, a `:` list or an array) that holds `<domain>/<last segment>.json`,
 * and validate it as the C loader does. `needs` is the version floor `x.y.z`, or null for none.
 * @throws ContractRefusal contract.dir.absent, contract.file.not-json, contract.file.invalid, contract.manifest.invalid,
 * contract.package.too-old or contract.catalog.invalid, with the message and the member the C loader gives.
 */
export function openDomainAt(dirs: string | readonly string[], domain: string, needs: string | null = null): Domain {
  if (!NAME.test(domain)) refuse('fileInvalid', domain, `"${domain}" is no domain name: slash-separated segments of letters, digits, - and _, none empty, "." or "..".`);
  if (Buffer.byteLength(domain) > DOMAIN_NAME_MAX) refuse('manifestInvalid', domain, `The domain name is ${Buffer.byteLength(domain)} bytes, longer than ${DOMAIN_NAME_MAX}.`);
  if (needs !== null && !VERSION.test(needs)) refuse('fileInvalid', domain, `The version floor "${needs}" asked of the domain ${domain} is not x.y.z.`);
  const roots = (typeof dirs === 'string' ? dirs.split(':') : [...dirs]).filter(Boolean);
  const rel = `${domain}/${stem(domain)}.json`;
  const root = roots.find((r) => existsSync(join(r, rel)));
  if (root === undefined) return refuse('dirAbsent', domain, `The domain ${domain} was not found at ${rel} under ${roots.join(':') || '(no contract directory)'}.`);
  const path = join(root, rel);
  const doc = load(readFileSync(path, 'utf8'), 'fileNotJson', `The domain ${domain} at ${path}`, rel) as unknown;
  const lead = `The domain ${domain} at ${path}`;
  if (!isObj(doc)) refuse('fileInvalid', rel, `${lead} is not a JSON object.`);
  const d = doc as Obj;
  const want = `${ID_PREFIX}${domain}`;
  if (d.$id !== want) refuse('manifestInvalid', rel, `${lead}: $id is "${typeof d.$id === 'string' ? d.$id : '(absent)'}", and must be "${want}".`);
  const format = str(d, 'x-omx-contract');
  if (format === undefined || !FORMAT.test(format)) refuse('manifestInvalid', rel, `${lead}: x-omx-contract is ${format === undefined ? '(absent)' : `"${format}"`}, and must be the omx-contract format the document is written in, MAJOR.MINOR.`);
  if (Number(format!.split('.')[0]) !== FORMAT_MAJOR) refuse('schemaMajor', rel, `${lead}: x-omx-contract ${format} is of the format major ${format!.split('.')[0]}; this loader reads ${FORMAT_MAJOR}.`);
  const info = d.info;
  const version = str(info, 'version');
  const stability = str(info, 'x-stability');
  if (version === undefined || !VERSION.test(version)) refuse('manifestInvalid', rel, `${lead} has no info.version of the form x.y.z.`);
  if (!str(info, 'x-owner')) refuse('manifestInvalid', rel, `${lead} has no info.x-owner.`);
  if (stability !== 'experimental' && stability !== 'stable') refuse('manifestInvalid', rel, `${lead}: info.x-stability is ${stability === undefined ? '(absent)' : `"${stability}"`}, and must be "experimental" or "stable".`);
  const req = isObj(info) ? info['x-requires'] : undefined;
  if (req !== undefined) {
    if (isObj(req)) refuse('manifestInvalid', rel, `${lead}: info.x-requires is a map of version floors; it lists package or domain names, no version (the devel wave 2026-11-24).`);
    if (!Array.isArray(req)) refuse('manifestInvalid', rel, `${lead}: info.x-requires is not a list of package or domain names.`);
    if (!(req as unknown[]).length) refuse('manifestInvalid', rel, `${lead}: info.x-requires is an empty list; a domain that refers to nothing has no info.x-requires.`);
    let prev: string | undefined;
    for (const k of req as unknown[]) {
      if (typeof k !== 'string') refuse('manifestInvalid', rel, `${lead}: info.x-requires names a non-string, which is no package or domain name.`);
      if (!REQUIRED.test(k as string)) refuse('manifestInvalid', rel, `${lead}: info.x-requires names "${k as string}", which is no package or domain name.`);
      if (prev !== undefined && !(prev < (k as string))) refuse('manifestInvalid', rel, `${lead}: info.x-requires is not in ascending order, each name once ("${prev}" before "${k as string}").`);
      prev = k as string;
    }
  }
  if (needs !== null && below(triple(version!), triple(needs))) refuse('packageTooOld', rel, `${lead} is version ${version}, below the floor ${needs} the program needs.`);
  const comp = d.components;
  const schemas = isObj(comp) ? comp.schemas : undefined;
  if (!isObj(schemas)) refuse('fileInvalid', rel, `${lead} has no "components"."schemas" object.`);
  const words = new Map<string, WordsItem>();
  const ranges = new Map<string, RangeItem>();
  const scalars = new Map<string, ScalarItem>();
  for (const [name, s] of Object.entries(schemas as Obj)) {
    if (!isObj(s)) refuse('fileInvalid', rel, `${lead}: the schema ${name} is not an object.`);
    const o = s as Obj;
    if ('$ref' in o) refuse('fileInvalid', rel, `${lead}: the schema ${name} has a "$ref", which the loader does not read.`);
    const oneOf = Array.isArray(o.oneOf) ? o.oneOf : undefined, props = isObj(o.properties) ? o.properties : undefined;
    if (oneOf && props) refuse('fileInvalid', rel, `${lead}: the schema ${name} has both "oneOf" and "properties": it is a words item or a range item, not both.`);
    if (oneOf) words.set(name, readWords(name, oneOf, rel, domain));
    else if (props) ranges.set(name, readParams(name, props, rel, domain));
    else if (o['x-kind'] === 'scalar') scalars.set(name, readScalar(name, o, rel, domain));
    // a schema that is no words, range or scalar item (a sheet) is not served
  }
  return new Domain(words, ranges, readCatalogs(join(root, domain), domain), scalars);
}
