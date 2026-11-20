// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * data/ against docs/data-layout.md: every word in the file its rule names, and each rule red when it is broken.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { layoutProblems, readFiles } from '../tools/data-layout.mjs';
import { DATA, LV2_TERMS, ROOT } from './helpers.mjs';

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
  assert.deepEqual(layoutProblems(fs), ['hosting/cost.json: the hosting codes are omx-clap-core\'s (contract.d/3/omx-clap/hosting/), never omx-contract\'s']);
});

test('sabotage: a codes item in data/ is named', () => {
  const fs = files();
  doc(fs, 'resource-profile.json').RESOURCE_STRAY_CODES = { kind: 'codes', doc: 'd', codes: { stray: { code: 'hosting.cost.stray' } } };
  assert.deepEqual(layoutProblems(fs), ['resource-profile.json: RESOURCE_STRAY_CODES: a codes item in data/ (the refusal codes are the contract domain\'s)']);
});

/** data/'s files with the LV2 fixture (test/fixtures/lv2-terms) at formats/lv2/, as a tree that maps LV2 holds them. */
const withLv2 = () => [...files(), ...readFiles(LV2_TERMS).map(({ rel, doc }) => ({ rel: `formats/lv2/${rel}`, doc }))];

test('sabotage: unsorted terms are named', () => {
  const fs = withLv2();
  const t = doc(fs, 'formats/lv2/worker.json').LV2_WORKER_TERMS;
  t.terms = Object.fromEntries(Object.entries(t.terms).reverse());
  assert.deepEqual(layoutProblems(fs), ['formats/lv2/worker.json: LV2_WORKER_TERMS: its terms are not sorted by name']);
});

test('sabotage: an LV2 URI in a CLAP file, or in another specification\'s file, is named', () => {
  let fs = files();
  doc(fs, 'formats/clap/ext/latency.json').CLAP_EXT_LATENCY_TERMS.terms.latency.uri = 'http://lv2plug.in/ns/lv2core#latency';
  assert.ok(layoutProblems(fs).includes('formats/clap/ext/latency.json: an LV2 URI outside data/formats/lv2/'));
  assert.ok(layoutProblems(fs).includes('formats/clap/ext/latency.json: latency: a CLAP term carries its identifier, never a URI'));
  fs = withLv2();
  doc(fs, 'formats/lv2/worker.json').LV2_WORKER_TERMS.terms.schedule.uri = 'http://lv2plug.in/ns/ext/state#makePath';
  assert.deepEqual(layoutProblems(fs), ['formats/lv2/worker.json: schedule: http://lv2plug.in/ns/ext/state#makePath lies outside http://lv2plug.in/ns/ext/worker']);
});

test('sabotage: an item its path does not name, and a word file\'s item without its prefix, are named', () => {
  let fs = files();
  const d = doc(fs, 'formats/clap/ext/tail.json');
  d.CLAP_TAIL_TERMS = d.CLAP_EXT_TAIL_TERMS;
  delete d.CLAP_EXT_TAIL_TERMS;
  assert.deepEqual(layoutProblems(fs), ['formats/clap/ext/tail.json: holds one terms item, CLAP_EXT_TAIL_TERMS']);
  fs = files();
  const m = doc(fs, 'resource-profile.json');
  m.BASES = m.RESOURCE_BASES;
  assert.deepEqual(layoutProblems(fs), ['resource-profile.json: BASES: an item of resource-profile.json is named RESOURCE_...']);
});

test('sabotage: a file no rule places is named', () => {
  const fs = files();
  fs.push({ rel: 'misc.json', doc: { $schema: '../schema/omx-contract.schema.json' } });
  assert.deepEqual(layoutProblems(fs), ['misc.json: no rule of docs/data-layout.md places this file']);
});
