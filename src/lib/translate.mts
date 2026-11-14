// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * What `omx-contract translate` makes, and what it refuses (omx-contract#21, docs/data-layout.md "Language packs").
 * The model call itself is the CLI's; everything it decides is here, with no network:
 *
 * - {@link toMake}: the keys of a language to make: every key with a source sentence that the catalog lacks, and
 *   every model's entry made from another source sentence (stale). A person's entry is never made again.
 * - {@link admit}: a model's answer for one key, behind the placeholder gate: its `{name}` placeholders are exactly
 *   the source sentence's, each one of the key's `args`, or it is refused and the run is red.
 * - {@link releaseProblems}: the release gate, with no model: a listed language with no catalog, a key it lacks, a
 *   stale entry.
 * - {@link catalogText}: the catalog as written, one message a line, the existing order kept and new keys after it.
 */
import type { Catalog, CatalogEntry, CatalogKey, CatalogRecord } from './catalog.mjs';
import { entryText, isStale, sourceHash } from './catalog.mjs';
import { placeholdersOf } from './placeholders.mjs';

/** One key to make: its source sentence and its args. */
export interface ToMake {
  readonly text: string;
  readonly args: readonly string[];
}

/** One release problem: the file, the key (or `-`), and what is wrong. */
export interface ReleaseProblem {
  readonly file: string;
  readonly key: string;
  readonly message: string;
}

/** Whether `entry` is kept, not generated: a sentence alone, `by: human`, or `by: same`. */
export const isHuman = (entry: CatalogEntry): boolean => typeof entry === 'string' || entry.by !== 'machine';

/** The keys with a source sentence: what a catalog of the owner holds, whole. */
function sourced(keys: ReadonlyMap<string, CatalogKey>): [string, string, readonly string[]][] {
  return [...keys].filter(([, k]) => typeof k.en === 'string' && k.en.length > 0).map(([key, k]) => [key, k.en as string, k.args]);
}

/** The keys of `catalog` (none when there is none yet) to make from their source sentences. */
export function toMake(keys: ReadonlyMap<string, CatalogKey>, catalog: Catalog | undefined): Map<string, ToMake> {
  const out = new Map<string, ToMake>();
  for (const [key, text, args] of sourced(keys)) {
    const entry = catalog?.messages[key];
    if (entry === undefined || (!isHuman(entry) && isStale(entry, text))) out.set(key, { text, args });
  }
  return out;
}

/**
 * A model's answer `answer` for `want` as an entry, or the reason it is refused: no text, or placeholders that are not
 * exactly the source sentence's (each of which is one of the key's args).
 */
export function admit(want: ToMake, answer: unknown, model: string): { entry: CatalogRecord } | { refused: string } {
  if (typeof answer !== 'string' || answer.trim() === '') return { refused: 'no translation in the answer' };
  const text = answer.trim();
  const got = new Set(placeholdersOf(text));
  const need = new Set(placeholdersOf(want.text));
  const stray = [...got].filter((n) => !need.has(n) || !want.args.includes(n));
  const lost = [...need].filter((n) => !got.has(n));
  if (stray.length || lost.length) {
    const list = (xs: string[]) => xs.map((x) => `{${x}}`).join(', ');
    return { refused: `placeholders ${[stray.length ? `not in the source: ${list(stray)}` : '', lost.length ? `lost: ${list(lost)}` : ''].filter(Boolean).join('; ')}` };
  }
  return { entry: { text, by: 'machine', model, source: sourceHash(want.text) } };
}

/** The release problems of the catalogs `catalogs` (by language, undefined when absent) against `keys`. */
export function releaseProblems(
  keys: ReadonlyMap<string, CatalogKey>,
  langs: readonly string[],
  catalogs: ReadonlyMap<string, Catalog | undefined>,
  fileOf: (lang: string) => string,
): ReleaseProblem[] {
  const out: ReleaseProblem[] = [];
  for (const lang of langs) {
    const c = catalogs.get(lang);
    if (c === undefined) {
      out.push({ file: fileOf(lang), key: '-', message: `no catalog: a listed language ships one (omx-contract translate --lang ${lang})` });
      continue;
    }
    for (const [key, text] of sourced(keys)) {
      const entry = c.messages[key];
      if (entry === undefined) out.push({ file: fileOf(lang), key, message: 'missing: the source sentence has no entry' });
      else if (isStale(entry, text)) out.push({ file: fileOf(lang), key, message: `stale: made from another source sentence${isHuman(entry) ? ' (a person\'s entry: review it)' : ''}` });
    }
  }
  return out;
}

/** The catalog's text: its head, then one message a line, in `order` (existing keys first, new ones sorted after). */
export function catalogText(catalog: Catalog & { readonly $schema?: string }, before: readonly string[] = []): string {
  const keys = Object.keys(catalog.messages);
  const old = before.filter((k) => keys.includes(k));
  const order = [...old, ...keys.filter((k) => !old.includes(k)).sort()];
  const head = [
    ...(catalog.$schema !== undefined ? [`  "$schema": ${JSON.stringify(catalog.$schema)},`] : []),
    '  "kind": "catalog",',
    `  "lang": ${JSON.stringify(catalog.lang)},`,
    `  "owner": ${JSON.stringify(catalog.owner)},`,
  ];
  const lines = order.map((k, i) => `    ${JSON.stringify(k)}: ${entryJson(catalog.messages[k] as CatalogEntry)}${i < order.length - 1 ? ',' : ''}`);
  return `{\n${head.join('\n')}\n  "messages": {\n${lines.join('\n')}\n  }\n}\n`;
}

/** An entry on one line, its fields in the schema's order. */
function entryJson(entry: CatalogEntry): string {
  if (typeof entry === 'string') return JSON.stringify(entry);
  const { text, by, model, source } = entry;
  return `{ ${[['text', text], ['by', by], ['model', model], ['source', source]].filter(([, v]) => v !== undefined).map(([k, v]) => `"${k}": ${JSON.stringify(v)}`).join(', ')} }`;
}

/** The text of one entry, for a caller that holds a catalog's raw messages. */
export { entryText };
