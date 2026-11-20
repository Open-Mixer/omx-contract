// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * The whole CLAP vocabulary is mapped (docs/data-layout.md): every term of the inventory has its entry and its status,
 * and no entry names a term the inventory lacks. The inventory is the installed sources', checked where they are
 * installed. The LV2 terms, their inventory and its coverage are plugin-db's (sorting pass V27a, plugin-db#66).
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { coverageProblems, readFiles, readInventory } from '../tools/data-layout.mjs';
import { defaultClapInclude, inventories, readClapHeader } from '../tools/format-inventory.mjs';
import { DATA, ROOT } from './helpers.mjs';

const INVENTORY = join(ROOT, 'inventory');
const files = () => structuredClone(readFiles(DATA));
const doc = (fs, rel) => fs.find((f) => f.rel === rel).doc;
const statuses = (fs) => fs.filter((f) => f.rel.startsWith('formats/')).flatMap((f) => Object.values(Object.values(f.doc)[1].terms).map((t) => t.status));

test('every CLAP identifier of the inventory is mapped, with a status, and nothing more', () => {
  const inv = readInventory(INVENTORY);
  assert.deepEqual(coverageProblems(files(), inv), []);
  const clap = Object.values(inv.clap.headers).reduce((n, h) => n + h.length, 0);
  assert.ok(clap >= 297, `${clap} CLAP identifiers`);
  const st = statuses(files());
  assert.equal(st.length, clap);
  for (const s of st) assert.ok(['used', 'supported-later', 'out-of-scope'].includes(s), s);
});

test('sabotage: a term taken out of the mapping, and one the format does not define, are named', () => {
  const inv = readInventory(INVENTORY);
  let fs;
  fs = files();
  delete doc(fs, 'formats/clap/ext/params.json').CLAP_EXT_PARAMS_TERMS.terms.paramIsStepped;
  assert.deepEqual(coverageProblems(fs, inv), ['formats/clap/ext/params.json: CLAP_PARAM_IS_STEPPED is not mapped (as paramIsStepped)']);
  fs = files();
  doc(fs, 'formats/clap/ext/tail.json').CLAP_EXT_TAIL_TERMS.terms.invented = { id: 'CLAP_INVENTED', kind: 'constant', status: 'used', by: ['x:y'] };
  assert.deepEqual(coverageProblems(fs, inv), ['formats/clap/ext/tail.json: invented is no identifier of the installed clap/ext/tail.h']);
});

test('sabotage: a term without its status and a wrong version are named', () => {
  const inv = readInventory(INVENTORY);
  let fs = files();
  delete doc(fs, 'formats/clap/ext/params.json').CLAP_EXT_PARAMS_TERMS.terms.paramIsStepped.status;
  assert.deepEqual(coverageProblems(fs, inv), ['formats/clap/ext/params.json: paramIsStepped has no status']);
  fs = files();
  doc(fs, 'formats/clap/process.json').CLAP_PROCESS_TERMS.version = '1.2.9';
  assert.deepEqual(coverageProblems(fs, inv), ['formats/clap/process.json: version 1.2.9, the installed CLAP is 1.2.10']);
});

test('sabotage: a newer format installed, one term more, is named until it is mapped', () => {
  const inv = readInventory(INVENTORY);
  inv.clap.headers['ext/tail'].push({ name: 'CLAP_TAIL_FOREVER', group: 'enum', value: null });
  assert.deepEqual(coverageProblems(files(), inv), ['formats/clap/ext/tail.json: CLAP_TAIL_FOREVER is not mapped (as tailForever)']);
});

test('the inventory reads CLAP declarations as the tool writes them', () => {
  const h = `/* a */ static const CLAP_CONSTEXPR char CLAP_EXT_X[] =\n  "clap.x/1"; // b\nenum clap_x_flags { CLAP_X_A = 1 << 0, CLAP_X_B = 1 << 1, };\n#define CLAP_PLUGIN_FEATURE_Y "y"\nstatic const CLAP_CONSTEXPR uint16_t CLAP_X_ID = 0;\n`;
  assert.deepEqual(readClapHeader(h), [
    { name: 'CLAP_EXT_X', group: 'string', value: 'clap.x/1' },
    { name: 'CLAP_X_A', group: 'clap_x_flags', value: '1 << 0' },
    { name: 'CLAP_X_B', group: 'clap_x_flags', value: '1 << 1' },
    { name: 'CLAP_PLUGIN_FEATURE_Y', group: 'string', value: 'y' },
    { name: 'CLAP_X_ID', group: 'const', value: '0' },
  ].sort((a, b) => h.indexOf(a.name) - h.indexOf(b.name)));
});

const installed = existsSync(join(defaultClapInclude(), 'clap', 'clap.h'));

test('the committed inventory is the installed CLAP, where it is installed', { skip: installed ? false : 'no CLAP headers here' }, () => {
  const docs = inventories();
  const inv = readInventory(INVENTORY);
  assert.deepEqual(JSON.parse(docs['clap.json']), inv.clap, 'inventory/clap.json: run node tools/format-inventory.mjs and map what changed');
});
