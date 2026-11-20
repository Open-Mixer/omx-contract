// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * word-from-differs (docs/contract-dir.md, "Domains"): a word whose `x-from` (the data form's `from`) names a word of a
 * WORDS item is that word. Its const (the data form's `word`) and its x-code (its place in its item, as the data
 * form's order is) are the target's, and so are its description (`doc`) and x-text (`text.en`), copied, never inherited.
 * A terms target is not compared: a word is never its term. Both readers that resolve a from use this one comparison:
 * validate (rule word-from-differs) and the read of a contract directory (lib/contract-dir.mjs).
 */

/** A word as the comparison reads it: its const, its x-code, its description and its English x-text. */
export interface FromWord { readonly word: unknown; readonly code: number; readonly doc?: unknown; readonly text?: unknown }

/** One field a word differs in from the word it names: the domain field's name, its value and the target's. */
export interface FromDifference { readonly field: 'const' | 'x-code' | 'description' | 'x-text'; readonly mine: unknown; readonly theirs: unknown }

/**
 * The fields `mine` differs in from `target`, the word its from names; empty when it is that word.
 *
 * An ABSENT description or x-text where the target carries one is a difference too (owner ruling (b), 2026-11-20:
 * copies only, no inheritance), so a runtime reader, which never resolves x-from, serves the same text a render does.
 */
export function fromDifferences(mine: FromWord, target: FromWord): FromDifference[] {
  const out: FromDifference[] = [];
  if (mine.word !== target.word) out.push({ field: 'const', mine: mine.word, theirs: target.word });
  if (mine.code !== target.code) out.push({ field: 'x-code', mine: mine.code, theirs: target.code });
  for (const [field, a, b] of [['description', mine.doc, target.doc], ['x-text', mine.text, target.text]] as const) {
    if (a !== b) out.push({ field, mine: a, theirs: b }); // an absent one too: copies only, no inheritance (owner ruling b)
  }
  return out;
}

/** The refusal's words for one difference: `its <field> <mine> is not the named word's <theirs>`, `(none)` for an absent one. */
const shown = (v: unknown): string => (v === undefined ? '(none)' : JSON.stringify(v));
export const fromDifference = (d: FromDifference): string => `its ${d.field} ${shown(d.mine)} is not the named word's ${shown(d.theirs)}`;
