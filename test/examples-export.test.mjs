// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/*
 * The example descriptors are published: `@openmixer/omx-contract/examples/descriptors/<file>`, resolved through the
 * package's own exports, is the tree's file, and the packed package carries every one, so a package that tests against
 * them reads these instead of keeping a copy.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { packedFiles } from './helpers.mjs';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXAMPLES = readdirSync(join(ROOT, 'examples/descriptors')).filter((f) => f.endsWith('.json')).sort();

test('each example descriptor resolves through the package exports to the tree file', () => {
  assert.ok(EXAMPLES.length > 0, 'positive control: there are example descriptors');
  for (const f of EXAMPLES)
    assert.equal(fileURLToPath(import.meta.resolve(`@openmixer/omx-contract/examples/descriptors/${f}`)), join(ROOT, 'examples/descriptors', f));
});

test('the packed package carries every example descriptor', () => {
  const packed = new Set(packedFiles());
  for (const f of EXAMPLES) assert.ok(packed.has(`examples/descriptors/${f}`), f);
});
