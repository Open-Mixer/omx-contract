// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * The domain check (omx-contract#124, docs/contract-dir.md, "Domains"): a freshly generated domain document against the
 * committed one. Words and items move only with `info.version`, and a word's `x-code` never moves: new words are
 * appended.
 */
import { versionBelow } from './domain.mjs';
import type { JsonObject } from './json.mjs';

const VERSION = /^(\d+)\.(\d+)\.(\d+)$/;

const objectOf = (v: unknown): JsonObject => (typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as JsonObject) : {});

/** The words of one item, `const` to `x-code`, in the document's order. */
function wordsOf(schema: JsonObject): Map<string, unknown> {
  const out = new Map<string, unknown>();
  for (const e of Array.isArray(schema.oneOf) ? schema.oneOf : []) {
    const w = objectOf(e);
    if (typeof w.const === 'string') out.set(w.const, w['x-code']);
  }
  return out;
}

/** The domain a document is, from its `$id` (the last part after `/contract/`); `-` when it names none. */
function domainName(doc: JsonObject): string {
  const m = typeof doc.$id === 'string' ? /\/contract\/(.+)$/.exec(doc.$id) : null;
  return m ? m[1]! : '-';
}

/**
 * The problems of `next` against `committed`, one line each, naming the domain, the item and the word; empty is clean.
 * A version going down is refused as well: a domain's version only rises.
 */
export function domainCheck(next: JsonObject, committed: JsonObject): string[] {
  const domain = domainName(next);
  const problems: string[] = [];
  const nv = objectOf(next.info).version;
  const cv = objectOf(committed.info).version;
  const versions = typeof nv === 'string' && VERSION.test(nv) && typeof cv === 'string' && VERSION.test(cv);
  if (!versions) problems.push(`${domain}: info.version: ${JSON.stringify(nv)} or ${JSON.stringify(cv)} is not MAJOR.MINOR.PATCH`);
  const same = versions && nv === cv;
  if (versions && versionBelow(nv as string, cv as string)) problems.push(`${domain}: info.version: ${nv} is below ${cv}, the committed version: a domain's version only rises`);
  const a = objectOf(objectOf(next.components).schemas);
  const b = objectOf(objectOf(committed.components).schemas);
  for (const item of Object.keys(a)) if (!(item in b) && same) problems.push(`${domain}: ${item}: item added while info.version stays ${nv}`);
  for (const item of Object.keys(b)) if (!(item in a) && same) problems.push(`${domain}: ${item}: item removed while info.version stays ${nv}`);
  for (const item of Object.keys(a)) {
    if (!(item in b)) continue;
    const was = wordsOf(objectOf(b[item]));
    const now = wordsOf(objectOf(a[item]));
    for (const [w] of now) if (!was.has(w) && same) problems.push(`${domain}: ${item}: ${w}: word added while info.version stays ${nv}`);
    for (const [w] of was) if (!now.has(w) && same) problems.push(`${domain}: ${item}: ${w}: word removed while info.version stays ${nv}`);
    for (const [w, code] of now) if (was.has(w) && was.get(w) !== code) problems.push(`${domain}: ${item}: ${w}: x-code moved from ${JSON.stringify(was.get(w))} to ${JSON.stringify(code)}: new words are appended`);
  }
  return problems;
}
