// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * data/ against docs/data-layout.md: every word in the file its rule names, and each rule red when it is broken.
 * The format terms (fixtures test/fixtures/lv2-terms and clap-terms) are refused here: their owners' domains hold them.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { layoutProblems, readFiles } from '../tools/data-layout.mjs';
import { CLAP_TERMS, DATA, LV2_TERMS, ROOT } from './helpers.mjs';

const files = () => structuredClone(readFiles(DATA));
const doc = (fs, rel) => fs.find((f) => f.rel === rel).doc;

test('every file of data/ sits where its rule places it', () => {
  assert.deepEqual(layoutProblems(files()), []);
});

test('data/ holds no hosting code: they are omx-clap-core\'s, and no codes item at all: the refusal codes are the contract domain\'s', () => {
  const fs = files();
  assert.ok(fs.length > 1, 'positive control: the files');
  assert.deepEqual(fs.filter((f) => f.rel.startsWith('hosting/')).map((f) => f.rel), []);
  assert.deepEqual(fs.filter((f) => Object.values(f.doc).some((v) => v?.kind === 'codes')).map((f) => f.rel), []);
});

test('sabotage: an owner\'s hosting file put back into data/ is named', () => {
  const fs = files();
  fs.push({ rel: 'hosting/cost.json', doc: JSON.parse(readFileSync(join(ROOT, 'test/fixtures/package-codes/hosting/cost.json'), 'utf8')) });
  assert.deepEqual(layoutProblems(fs), ['hosting/cost.json: the hosting codes are omx-clap-core\'s (contract.d/omx-clap/hosting/), never omx-contract\'s']);
});

test('sabotage: a codes item in data/ is named', () => {
  const fs = files();
  doc(fs, 'resource-profile.json').RESOURCE_STRAY_CODES = { kind: 'codes', doc: 'd', codes: { stray: { code: 'hosting.cost.stray' } } };
  assert.deepEqual(layoutProblems(fs), ['resource-profile.json: RESOURCE_STRAY_CODES: a codes item in data/ (the refusal codes are the contract domain\'s)']);
});

test('sabotage: a format terms file put back into data/ is named, by its place and by its kind', () => {
  const fs = files();
  fs.push({ rel: 'formats/clap/ext/tail.json', doc: JSON.parse(readFileSync(join(CLAP_TERMS, 'ext/tail.json'), 'utf8')) });
  fs.push({ rel: 'formats/lv2/worker.json', doc: JSON.parse(readFileSync(join(LV2_TERMS, 'worker.json'), 'utf8')) });
  const p = layoutProblems(fs);
  for (const rel of ['formats/clap/ext/tail.json', 'formats/lv2/worker.json']) {
    assert.ok(p.includes(`${rel}: a terms item in data/ (the format terms are their owners' domains: plugin-db's lv2, omx-clap's clap)`), rel);
    assert.ok(p.includes(`${rel}: the format terms are plugin-db's lv2 domain and omx-clap's clap domain (sorting pass V27a/V27b), never omx-contract's`), rel);
  }
});

test('sabotage: a word file\'s item without its prefix is named', () => {
  const fs = files();
  const m = doc(fs, 'resource-profile.json');
  m.BASES = m.RESOURCE_BASES;
  assert.deepEqual(layoutProblems(fs), ['resource-profile.json: BASES: an item of resource-profile.json is named RESOURCE_...']);
});

test('sabotage: a file no rule places is named', () => {
  const fs = files();
  fs.push({ rel: 'misc.json', doc: { $schema: '../schema/omx-contract.schema.json' } });
  assert.deepEqual(layoutProblems(fs), ['misc.json: no rule of docs/data-layout.md places this file']);
});
