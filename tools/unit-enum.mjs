#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
//
// The schema's $defs.unit enum, rendered from PARAM_UNITS (data/primitives.json): its words in their declared order.
// `--write` rewrites schema/omx-contract.schema.json; `--check` exits 1 naming what differs. `--root <dir>` reads
// another tree (the tests' scratch copies).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { isMain } from '../lib/entry.mjs';

/** The unit symbols of PARAM_UNITS (each word's `symbol`), in declared order. */
export function unitWords(root) {
  const item = JSON.parse(readFileSync(join(root, 'data/primitives.json'), 'utf8')).PARAM_UNITS;
  if (item?.kind !== 'words') throw new Error('data/primitives.json has no PARAM_UNITS words item');
  return Object.values(item.words).map((w) => w.symbol);
}

/** The schema text with $defs.unit.enum set to `words`, every other byte as it was. */
export function renderSchema(text, words) {
  const re = /("unit": \{\n\s+"description": [^\n]*\n\s+"enum": )\[[^\]\n]*\]/;
  if (!re.test(text)) throw new Error('schema/omx-contract.schema.json has no $defs.unit enum line');
  return text.replace(re, (_, head) => `${head}[${words.map((w) => JSON.stringify(w)).join(', ')}]`);
}

if (isMain(import.meta.url)) {
  const argv = process.argv.slice(2);
  const i = argv.indexOf('--root');
  const root = resolve(i >= 0 ? argv[i + 1] : join(import.meta.dirname, '..'));
  const file = join(root, 'schema/omx-contract.schema.json');
  const text = readFileSync(file, 'utf8');
  const words = unitWords(root);
  const next = renderSchema(text, words);
  if (argv.includes('--write')) {
    if (next !== text) writeFileSync(file, next);
  } else if (argv.includes('--check')) {
    if (next !== text) {
      const have = JSON.parse(text).$defs.unit.enum;
      console.error(`unit-enum: schema/omx-contract.schema.json $defs.unit is ${JSON.stringify(have)}, PARAM_UNITS renders ${JSON.stringify(words)}: run tools/unit-enum.mjs --write`);
      process.exit(1);
    }
  } else {
    console.error('usage: unit-enum.mjs --check|--write [--root <dir>]');
    process.exit(2);
  }
}
