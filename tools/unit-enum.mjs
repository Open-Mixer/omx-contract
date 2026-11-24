#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
//
// The schema's $defs.unit enum and $defs.descriptorUnit's own enum, rendered from PARAM_UNITS (the `param` domain,
// contract.d/param/param.json): the ids (each word's const) of its `param` units, and of its `descriptor` units then
// `unknown`, in their declared order (docs/units.md: the scope split is kept, Q16). The id is the wire word; a word's
// `x-symbol` is its display rendering and never enters the schema (C2, plugin-hostd#215 D1/D2).
// And $defs.meaning's enum, a control's role, rendered from PARAM_MEANINGS of the same domain, its words in order
// (docs/descriptors.md, "Meanings", #61).
// `--write` rewrites schema/omx-contract.schema.json; `--check` exits 1 naming what differs. `--root <dir>` reads
// another tree (the tests' scratch copies).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { isMain } from '../lib/entry.mjs';

/** The words of the words item `name` in the `param` domain (contract.d/param/param.json), in declared order. */
function paramWords(root, name) {
  const item = JSON.parse(readFileSync(join(root, 'contract.d/param/param.json'), 'utf8')).components?.schemas?.[name];
  if (!Array.isArray(item?.oneOf)) throw new Error(`contract.d/param/param.json has no ${name} words item`);
  return item.oneOf;
}
const unitList = (root) => paramWords(root, 'PARAM_UNITS');

/** The words of PARAM_MEANINGS, a control's roles, in declared order: $defs.meaning's enum. */
export const meaningWords = (root) => paramWords(root, 'PARAM_MEANINGS').map((w) => w.const);

/** The ids (each word's const) of the units of scope `param` (its `x-group`), in declared order: $defs.unit. */
export function unitWords(root) {
  return unitList(root).filter((w) => w['x-group'] === 'param').map((w) => w.const);
}

/** The ids of the units of scope `descriptor`, in declared order, then `unknown`: $defs.descriptorUnit's own enum. */
export function descriptorUnitWords(root) {
  return [...unitList(root).filter((w) => w['x-group'] === 'descriptor').map((w) => w.const), 'unknown'];
}

const enumOf = (words) => `[${words.map((w) => JSON.stringify(w)).join(', ')}]`;

/**
 * The schema text with $defs.unit.enum set to `words`, $defs.descriptorUnit's own enum to `own` and $defs.meaning's
 * enum to `meanings`, every other byte as it was.
 */
export function renderSchema(text, words, own, meanings) {
  const re = /("unit": \{\n\s+"description": [^\n]*\n\s+"enum": )\[[^\]\n]*\]/;
  if (!re.test(text)) throw new Error('schema/omx-contract.schema.json has no $defs.unit enum line');
  const out = text.replace(re, (_, head) => `${head}${enumOf(words)}`);
  if (own === undefined) return out;
  const ro = /("descriptorUnit": \{\n\s+"description": [^\n]*\n\s+"anyOf": \[\{ "\$ref": "#\/\$defs\/unit" \}, \{ "enum": )\[[^\]\n]*\]/;
  if (!ro.test(out)) throw new Error('schema/omx-contract.schema.json has no $defs.descriptorUnit enum line');
  const withOwn = out.replace(ro, (_, head) => `${head}${enumOf(own)}`);
  if (meanings === undefined) return withOwn;
  const rm = /("meaning": \{\n\s+"description": [^\n]*\n\s+"enum": )\[[^\]\n]*\]/;
  if (!rm.test(withOwn)) throw new Error('schema/omx-contract.schema.json has no $defs.meaning enum line');
  return withOwn.replace(rm, (_, head) => `${head}${enumOf(meanings)}`);
}

if (isMain(import.meta.url)) {
  const argv = process.argv.slice(2);
  const i = argv.indexOf('--root');
  const root = resolve(i >= 0 ? argv[i + 1] : join(import.meta.dirname, '..'));
  const file = join(root, 'schema/omx-contract.schema.json');
  const text = readFileSync(file, 'utf8');
  const words = unitWords(root);
  const own = descriptorUnitWords(root);
  const meanings = meaningWords(root);
  const next = renderSchema(text, words, own, meanings);
  if (argv.includes('--write')) {
    if (next !== text) writeFileSync(file, next);
  } else if (argv.includes('--check')) {
    if (next !== text) {
      const defs = JSON.parse(text).$defs;
      console.error(`unit-enum: schema/omx-contract.schema.json $defs.unit is ${JSON.stringify(defs.unit.enum)} and $defs.descriptorUnit's own ${JSON.stringify(defs.descriptorUnit.anyOf[1]?.enum)}, $defs.meaning ${JSON.stringify(defs.meaning.enum)}; PARAM_UNITS renders ${JSON.stringify(words)} and ${JSON.stringify(own)}, PARAM_MEANINGS ${JSON.stringify(meanings)}: run tools/unit-enum.mjs --write`);
      process.exit(1);
    }
  } else {
    console.error('usage: unit-enum.mjs --check|--write [--root <dir>]');
    process.exit(2);
  }
}
