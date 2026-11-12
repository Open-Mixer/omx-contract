// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * A sentence's `{name}` placeholders: what a code's or a word's source sentence and each catalog entry are held to
 * against the code's `args` (docs/data-layout.md). Its own module so the catalog reader carries no validator.
 */

/** The names of `sentence`'s `{name}` placeholders. */
export function placeholdersOf(sentence: unknown): Set<string> {
  return new Set([...String(sentence ?? '').matchAll(/\{([^{}]*)\}/g)].map((m) => m[1] as string));
}
