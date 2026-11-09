// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * An owner's catalogs: its codes' and words' sentences in one language each (docs/data-layout.md, "Catalogs").
 * The contract holds the source sentence, in English, with its `args`; a translation is never contract data. An owner
 * ships `catalogs/<lang>.json`, installed to `/usr/share/<owner>/catalogs/<lang>.json` by its rpm and its deb alike:
 *
 *     { "kind": "catalog", "lang": "ca", "owner": "<package>", "messages": { "<key>": "<sentence with {args}>" } }
 *
 * A key is a code of the owner (`reply.plugin-hostd.no-param-contract`), or a word of the owner as `<ITEM>.<word>`
 * (`PLUGIN_DB_REASONS.no-cell`), since one word may belong to two items. Exported as `@openmixer/omx-contract/catalog`:
 * the checks (`catalogProblems`) and the one lookup a surface makes (`loadCatalog`, `sentenceOf`, `fill`): the catalog's
 * sentence for the key, else the source sentence, its placeholders filled.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { validate } from './schema-validate.mjs';
import { placeholdersOf } from './validate.mjs';

/** Where an installed owner's catalogs live, the same for rpm and deb: `/usr/share/<owner>/catalogs`. */
export const CATALOG_SHARE_DIR = '/usr/share';
export const catalogDirOf = (owner, root = CATALOG_SHARE_DIR) => join(root, owner, 'catalogs');
export const catalogPathOf = (owner, lang, root = CATALOG_SHARE_DIR) => join(catalogDirOf(owner, root), `${lang}.json`);

let schemaOf;
const catalogSchema = () => {
  if (schemaOf) return schemaOf;
  const whole = JSON.parse(readFileSync(new URL('../schema/omx-contract.schema.json', import.meta.url), 'utf8'));
  schemaOf = { $schema: whole.$schema, $defs: whole.$defs, $ref: '#/$defs/catalog' };
  return schemaOf;
};

/** The key of a code (its code) or of a word (`<ITEM>.<word>`). */
export const codeKey = (code) => code;
export const wordKey = (item, word) => `${item}.${word}`;

/**
 * Every code and word an owner declares, by its catalog key: `Map<key, { args, en }>`. `resolved` is the resolved data
 * (`resolveData`), and `extra` more items as `[name, item]` (a tool's own table, data/codes.json); `owner`, when the
 * data names packages, keeps only that package's items.
 */
export function catalogKeys(resolved, { owner, extra = [] } = {}) {
  const keys = new Map();
  const add = (name, kind, value) => {
    for (const e of Object.values(value ?? {})) {
      const key = kind === 'codes' ? codeKey(e.code) : wordKey(name, e.word);
      keys.set(key, { args: e.args ?? [], en: e.text?.en });
    }
  };
  for (const [name, r] of resolved) {
    if (r.kind !== 'codes' && r.kind !== 'words') continue;
    if (owner !== undefined && resolved.packageOf?.get(name) !== undefined && resolved.packageOf.get(name) !== owner) continue;
    add(name, r.kind, r.value);
  }
  for (const [name, item] of extra) add(name, item.kind, item.kind === 'codes' ? item.codes : item.words);
  return keys;
}

/**
 * A catalog's problems, `[{ file, item, rule, message }]`: its schema (`catalog-schema`), a key that is no code or word
 * the owner declares (`catalog-key`), and a placeholder that is not one of that entry's `args` (`catalog-placeholders`).
 */
export function catalogProblems(rel, catalog, keys) {
  const problems = [];
  const say = (item, rule, message) => problems.push({ file: rel, item, rule, message });
  const v = validate(catalogSchema(), catalog);
  for (const e of v.errors) say('-', 'catalog-schema', `${e.path || '/'} ${e.message}`);
  if (!v.ok) return problems;
  for (const [key, sentence] of Object.entries(catalog.messages)) {
    const known = keys.get(key);
    if (known === undefined) {
      say(key, 'catalog-key', `${key} is no code or word ${catalog.owner} declares`);
      continue;
    }
    for (const n of placeholdersOf(sentence)) {
      if (!known.args.includes(n)) say(key, 'catalog-placeholders', `${key}: {${n}} is not in its args (${known.args.map((a) => `{${a}}`).join(', ') || 'none'})`);
    }
  }
  return problems;
}

/**
 * The catalog of `owner` in `lang`, or `undefined` when none is installed or it does not read: a surface then shows the
 * source sentence. `root` defaults to the share dir; a test or a build names its own.
 */
export function loadCatalog(owner, lang, root = CATALOG_SHARE_DIR) {
  let catalog;
  try {
    catalog = JSON.parse(readFileSync(catalogPathOf(owner, lang, root), 'utf8'));
  } catch {
    return undefined;
  }
  return validate(catalogSchema(), catalog).ok && catalog.owner === owner && catalog.lang === lang ? catalog : undefined;
}

/** The sentence a surface shows for `key`: the catalog's, else `source` (the code's or word's `text.en`). */
export function sentenceOf(catalog, key, source) {
  const s = catalog?.messages?.[key];
  return typeof s === 'string' ? s : source;
}

/** `sentence` with each `{name}` replaced by `args[name]`; a placeholder with no value is left as written. */
export function fill(sentence, args = {}) {
  return String(sentence).replace(/\{([^{}]*)\}/g, (m, n) => (Object.hasOwn(args, n) ? String(args[n]) : m));
}
