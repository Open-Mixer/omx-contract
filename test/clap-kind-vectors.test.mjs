// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The vectors a describing host reads a scanned CLAP parameter's kind by (docs/descriptors.md, "A scanned CLAP
// parameter's kind"): share/omx-contract/clap-kind-vectors.json. This test holds the TABLE, never the rule: the rule's
// readers (plugin-hostd's describe in C, the console's catalog in TypeScript) hold themselves to the table in their own
// tests. Here: the file is one JSON object with a doc and vectors; every vector has a unique name, the inputs a host
// has (flags, min, max, default, the contract entry or null, points), and an expectation whose kind is a descriptor kind,
// a toggle's with a boolean default; and each determinant of the rule is exercised by a pair of vectors that differ in
// it alone (the enumeration flag, the range's floor and ceiling, the contract step, the merged scale word, the default's
// side of 0.5), so a reader that drops one check turns a vector red.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const FILE = join(ROOT, 'share/omx-contract/clap-kind-vectors.json');
const KINDS = new Set(['travel', 'choice', 'toggle', 'trigger']);
const FLAGS = new Set(['CLAP_PARAM_IS_STEPPED', 'CLAP_PARAM_IS_ENUM', 'CLAP_PARAM_IS_BYPASS', 'CLAP_PARAM_IS_AUTOMATABLE']);

const load = () => {
  assert.ok(existsSync(FILE), `${FILE} is the vectors file docs/descriptors.md names`);
  return JSON.parse(readFileSync(FILE, 'utf8'));
};

test('the vectors file is one object: a doc and a list of named vectors with the inputs a host has', () => {
  const v = load();
  assert.equal(typeof v.doc, 'string');
  assert.ok(Array.isArray(v.vectors) && v.vectors.length >= 10, 'at least ten vectors');
  const names = new Set();
  for (const c of v.vectors) {
    assert.equal(typeof c.name, 'string', JSON.stringify(c));
    assert.ok(!names.has(c.name), `vector ${c.name} is named once`);
    names.add(c.name);
    const { input: i, expect: e } = c;
    assert.ok(Array.isArray(i.flags) && i.flags.every((f) => FLAGS.has(f)), `${c.name}: flags are CLAP's param flags`);
    assert.ok(Number.isFinite(i.min) && Number.isFinite(i.max) && i.min <= i.max, `${c.name}: a range`);
    assert.ok(Number.isFinite(i.default), `${c.name}: a default`);
    assert.ok(i.contract === null || (typeof i.contract.scale === 'string' && (i.contract.step === undefined || Number.isFinite(i.contract.step))), `${c.name}: the contract entry or null`);
    assert.equal(typeof i.points, 'boolean', `${c.name}: whether value texts exist`);
    assert.ok(KINDS.has(e.kind), `${c.name}: expects a descriptor kind`);
    if (e.kind === 'toggle') assert.equal(typeof e.default, 'boolean', `${c.name}: a toggle's default is on or off`);
    if (e.kind === 'travel') assert.ok(['stepped', 'linear', 'log', 'unknown'].includes(e.scale), `${c.name}: a travel names its merged scale word`);
    if (e.kind !== 'toggle') assert.equal(e.default, undefined, `${c.name}: only a toggle expects a default here`);
  }
});

test('each determinant of the rule is exercised by two vectors that differ in it alone', () => {
  const { vectors } = load();
  const by = Object.fromEntries(vectors.map((c) => [c.name, c]));
  const pair = (a, b, differsIn) => {
    assert.ok(by[a] && by[b], `${a} and ${b} are vectors`);
    const same = (k) => JSON.stringify(by[a].input[k]) === JSON.stringify(by[b].input[k]);
    for (const k of ['flags', 'min', 'max', 'default', 'contract', 'points']) if (!differsIn.includes(k)) assert.ok(same(k), `${a} and ${b} differ in ${k}, which the pair does not test`);
    assert.notEqual(by[a].expect.kind === by[b].expect.kind && by[a].expect.default === by[b].expect.default, true, `${a} and ${b} read alike`);
  };
  pair('toggle-off', 'enum-two-values', ['flags', 'points']); // the enumeration flag and its texts: a choice
  pair('toggle-off', 'stepped-0-to-2', ['max']); // the ceiling
  pair('toggle-off', 'stepped-1-to-2', ['min', 'max']); // the floor
  pair('toggle-off', 'continuous-0-to-1', ['flags']); // no stepped flag, no contract: a continuous travel
  pair('contract-stepped-no-flag', 'contract-linear-with-flag', ['flags', 'contract']); // the merged word, both ways
  pair('contract-step-1', 'contract-step-quarter', ['contract']); // the contract step
  pair('toggle-off', 'toggle-on', ['default']); // the default's side of 0.5
  assert.equal(by['toggle-default-below-half'].expect.default, false);
  assert.equal(by['toggle-default-at-half'].expect.default, true);
  assert.equal(by['bypass'].expect.kind, 'toggle', 'a stepped 0..1 bypass is a toggle like any other');
});
