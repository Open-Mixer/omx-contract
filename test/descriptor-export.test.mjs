// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// A consumer applies override layers through the package, never through a path into lib/: the package exports
// applyOverride at ./descriptor, with its types, and the exported function is the tree's.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { applyOverride } from '@openmixer/omx-contract/descriptor';
import * as tree from '../lib/descriptor.mjs';
import { ROOT } from './helpers.mjs';

const read = (rel) => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));

test('the package exports applyOverride, and it applies a layer', () => {
  assert.equal(applyOverride, tree.applyOverride);
  const r = applyOverride(read('examples/descriptors/scanned-clap-unknown.json'), [read('test/fixtures/overrides/good.json')], { paramsFingerprint: '5f0c' });
  assert.deepEqual([r.refused, r.dropped, r.warnings], [[], [], []]);
  assert.equal(r.family, 'filter');
  assert.equal(r.descriptor.controls.find((c) => String(c.id) === '5').label, 'Cutoff');
});

test('the export names files the package carries, and the types name every export of the module', () => {
  const pkg = read('package.json');
  const entry = pkg.exports['./descriptor'];
  assert.deepEqual(entry, { types: './lib/descriptor.d.mts', import: './lib/descriptor.mjs' });
  for (const rel of Object.values(entry)) assert.ok(existsSync(join(ROOT, rel)), rel);
  assert.ok(pkg.files.includes('lib/'));
  const dts = readFileSync(join(ROOT, entry.types), 'utf8');
  for (const name of Object.keys(tree)) assert.match(dts, new RegExp(`export (const|function) ${name}\\b`), name);
});
