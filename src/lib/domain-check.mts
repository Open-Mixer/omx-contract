// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * The domain check (omx-contract#124, docs/contract-dir.md, "Domains"): a freshly generated domain document against the
 * committed one. Words and items move only with `info.version`, and a word's `x-code` never moves: new words are
 * appended. One exception (omx-contract#167, coordinator ruling 2026-11-21): in a words item WITHOUT `x-c-codes` a code
 * is the word's position, no constant a reader compiles, so a word removed or inserted shifts the codes after it, and
 * that shift is accepted and named. An item with `x-c-codes` (next or committed) renders its codes as C constants, and
 * any move of its codes stays refused, as does a reorder anywhere.
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

/** Whether the words both maps hold come in the same order in both: a removal or an insertion, never a reorder. */
function orderKept(was: Map<string, unknown>, now: Map<string, unknown>): boolean {
  const a = [...was.keys()].filter((w) => now.has(w));
  const b = [...now.keys()].filter((w) => was.has(w));
  return a.every((w, i) => w === b[i]);
}

/** What `domain check` finds: the problems (exit 1) and the accepted code shifts it names (omx-contract#167). */
export interface DomainCheckReport {
  problems: string[];
  shifts: string[];
}

/**
 * The problems of `next` against `committed`, one line each, naming the domain, the item and the word; empty is clean.
 * A version going down is refused as well: a domain's version only rises.
 */
export function domainCheck(next: JsonObject, committed: JsonObject): string[] {
  return domainCheckReport(next, committed).problems;
}

/** domainCheck's problems, and one line for each word whose code shifted in an item without `x-c-codes`, accepted. */
export function domainCheckReport(next: JsonObject, committed: JsonObject): DomainCheckReport {
  const domain = domainName(next);
  const problems: string[] = [];
  const shifts: string[] = [];
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
    const codes = objectOf(a[item])['x-c-codes'] === true || objectOf(b[item])['x-c-codes'] === true;
    const shift = !codes && orderKept(was, now);
    for (const [w, code] of now) {
      if (!was.has(w) || was.get(w) === code) continue;
      const move = `${domain}: ${item}: ${w}: x-code`;
      if (shift) shifts.push(`${move} shifted from ${JSON.stringify(was.get(w))} to ${JSON.stringify(code)}: accepted, the item has no x-c-codes, so a code is the word's position`);
      else if (codes) problems.push(`${move} moved from ${JSON.stringify(was.get(w))} to ${JSON.stringify(code)}: the item carries x-c-codes, its codes are C constants: new words are appended`);
      else problems.push(`${move} moved from ${JSON.stringify(was.get(w))} to ${JSON.stringify(code)}: the words were reordered: a code shifts only by a word removed or inserted, in an item without x-c-codes`);
    }
  }
  return { problems, shifts };
}
