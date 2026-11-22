// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// PARAM_UNITS_CLAP_ENCODED (docs/units.md, V23d B2): the standard unit ids the CLAP extension encodes, a words item of
// the `param` domain whose every word is a copy of its PARAM_UNITS word, taken from it by x-from and keeping its
// x-code. omx-panel reads it to know whether a unit can be served; omx-clap's map check holds its mapping onto it. It
// is derived by tools/clap-encoded.mjs from the CLAP sheet's token-to-id map, never typed, so the served ids must be a
// prefix of PARAM_UNITS. Arms: a member that is no PARAM_UNITS word, a member whose x-code is not its source's and a
// served set that is no prefix are each refused by name.
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { loadData, resolveData } from '../lib/data.mjs';
import { validateData } from '../lib/validate.mjs';
import { encodedFaults, encodedItem, ITEM, servedIds } from '../tools/clap-encoded.mjs';
import { DATA, ROOT } from './helpers.mjs';

const PARAM = 'contract.d/param/param.json';
const doc = () => JSON.parse(readFileSync(join(ROOT, PARAM), 'utf8'));
const units = () => doc().components.schemas.PARAM_UNITS.oneOf;

/** A scratch tree (data/, schema/, contract.d/param) whose param domain `edit` changes; `fn(dir)` runs over it. */
function scratch(edit, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'omx-clap-encoded-'));
  try {
    for (const d of ['data', 'schema', 'contract.d/param']) cpSync(join(ROOT, d), join(dir, d), { recursive: true });
    const d = doc();
    edit(d.components.schemas[ITEM]);
    writeFileSync(join(dir, PARAM), `${JSON.stringify(d, null, 2)}\n`);
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const problems = (dir) => validateData(loadData(join(dir, 'data'))).map((p) => `${p.item}:${p.rule}:${p.message}`);

test('PARAM_UNITS_CLAP_ENCODED is a words item of the param domain, each word its PARAM_UNITS word by x-from', () => {
  const item = resolveData(loadData(DATA)).get(ITEM);
  assert.equal(item?.kind, 'words');
  const s = doc().components.schemas[ITEM];
  assert.equal(s['x-kind'], 'words');
  const all = units();
  // the 33 tokens of the CLAP unit sheet, 0..24, 256..263, on 33 ids: the first 33 words of PARAM_UNITS
  assert.equal(s.oneOf.length, 33);
  s.oneOf.forEach((w, i) => {
    assert.equal(w.const, all[i].const);
    assert.equal(w['x-code'], all[i]['x-code']);
    assert.deepEqual(w['x-from'], [{ $ref: 'https://openmixer.org/contract/param#/components/schemas/PARAM_UNITS', 'x-term': all[i].title }]);
  });
  assert.deepEqual(validateData(loadData(DATA)), []);
  assert.deepEqual(encodedFaults(ROOT), [], 'the committed item is the item its own members derive');
});

test('the derivation: a token-to-id map gives its ids in PARAM_UNITS order', () => {
  assert.deepEqual(servedIds({ db: 'dB', none: 'none', pc: 'percent' }, units()), ['dB', 'percent', 'none']);
});

test('sabotage: a member that is no PARAM_UNITS word is refused by name, in the map and in the item', () => {
  assert.throws(() => servedIds({ db: 'decibel' }, units()), /PARAM_UNITS_CLAP_ENCODED: the id "decibel" of the token db is no const of PARAM_UNITS/);
  assert.throws(() => servedIds({ db: 'dB', dbAgain: 'dB' }, units()), /the tokens db and dbAgain both map to "dB"/);
  const out = scratch((s) => { s.oneOf[0]['x-from'][0]['x-term'] = 'decibel'; }, problems);
  assert.ok(out.some((p) => /^PARAM_UNITS_CLAP_ENCODED:word-from:db: PARAM_UNITS#decibel: PARAM_UNITS has no word decibel$/.test(p)), out.join('\n'));
});

test('sabotage: a member whose x-code is not its source\'s is refused by name', () => {
  const out = scratch((s) => {
    [s.oneOf[0], s.oneOf[1]] = [{ ...s.oneOf[1], 'x-code': 0 }, { ...s.oneOf[0], 'x-code': 1 }];
  }, problems);
  assert.ok(out.some((p) => /^PARAM_UNITS_CLAP_ENCODED:word-from-differs:dbfs: PARAM_UNITS#dbfs: its x-code 0 is not the named word's 1$/.test(p)), out.join('\n'));
  assert.ok(scratch((s) => { s.oneOf[0]['x-text'] = 'planted'; }, (dir) => encodedFaults(dir)).length > 0, 'the tool names an item that is no copy');
});

test('sabotage: a served set that is no prefix of PARAM_UNITS is refused by name', () => {
  const all = units();
  assert.throws(() => encodedItem([all[0].const, all[2].const], all), /PARAM_UNITS_CLAP_ENCODED: the served set is not a prefix of PARAM_UNITS: a words copy cannot hold it/);
  assert.throws(() => encodedItem(servedIds({ db: 'dB', us: 'us' }, all), all), /the served set is not a prefix of PARAM_UNITS: a words copy cannot hold it \(us is not at its PARAM_UNITS place\)/);
  assert.doesNotThrow(() => encodedItem(servedIds({ db: 'dB', dbfs: 'dBFS' }, all), all));
});
