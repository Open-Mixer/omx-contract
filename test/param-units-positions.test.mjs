// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// One id for a plain multiplier (omx-contract#167, coordinator ruling 2026-11-21): PARAM_UNITS holds `coef`, not `x`.
// `x` is removed, with no alias, and the later words shift: a PARAM_UNITS code is the word's position in the list, not a
// wire number (the wire codes are OMX_PARAM_CONTRACT_UNITS'), so every reader takes the words, never the codes.
// `coef` is a unit of the items ($defs.unit), the scope `x` had, so an item stated in `x` states `coef`.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(ROOT, f), 'utf8');
const UNITS = JSON.parse(read('contract.d/param/param.json')).components.schemas.PARAM_UNITS;

test('PARAM_UNITS has no `x` and holds `coef`', () => {
  const words = UNITS.oneOf.map((w) => w.const);
  assert.ok(!words.includes('x'), 'PARAM_UNITS still holds x');
  assert.ok(!UNITS.oneOf.some((w) => w.title === 'x' || w['x-symbol'] === 'x'), 'a word still spells x');
  assert.ok(words.includes('coef'), 'PARAM_UNITS has no coef');
});

test('a PARAM_UNITS code is its position in the list', () => {
  UNITS.oneOf.forEach((w, i) => assert.equal(w['x-code'], i, `${w.const} has the code ${w['x-code']} at position ${i}`));
});

test('`coef` is a unit of the items: $defs.unit holds coef and not x', () => {
  const coef = UNITS.oneOf.find((w) => w.const === 'coef');
  assert.equal(coef['x-group'], 'param');
  const defs = JSON.parse(read('schema/omx-contract.schema.json')).$defs;
  assert.ok(defs.unit.enum.includes('coef'), '$defs.unit has no coef');
  assert.ok(!defs.unit.enum.includes('x'), '$defs.unit still holds x');
  assert.ok(!defs.descriptorUnit.anyOf[1].enum.includes('x'));
});

test('the renders carry no `x` unit: the C words macro has coef at its position, the json and ts lists no x', () => {
  const h = read('include/omxcontract/omx_vocabulary.h');
  assert.doesNotMatch(h, /OMX_PARAM_UNITS_X\b/);
  const at = UNITS.oneOf.findIndex((w) => w.const === 'coef');
  assert.match(h, new RegExp(`X\\(${at}u, "coef", COEF\\)`));
  assert.equal(JSON.parse(read('share/omx-contract/omx-contract.json')).items.PARAM_UNITS.value.x, undefined);
  assert.doesNotMatch(read('test/golden/ts/omx-contract.d.ts'), /PARAM_UNITS_WORDS: readonly \[[^\]]*"x"/);
  for (const lang of ['ca', 'de', 'es', 'fr', 'it', 'pt']) assert.ok(!(`PARAM_UNITS.x` in JSON.parse(read(`catalogs/${lang}.json`)).messages), `catalogs/${lang}.json still translates PARAM_UNITS.x`);
});
