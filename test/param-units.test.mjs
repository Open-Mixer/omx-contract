// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The unit list is declared once (behaviour-core decision 3): PARAM_UNITS, a words item of data/primitives.json, and
// the schema's $defs.unit enum is its words in their declared order, written by tools/unit-enum.mjs and held by --check.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (root, f) => JSON.parse(readFileSync(join(root, f), 'utf8'));
const check = (root) => spawnSync(process.execPath, [join(ROOT, 'tools/unit-enum.mjs'), '--check', '--root', root], { encoding: 'utf8' });

test('PARAM_UNITS is a words item and the schema unit enum is its words, in order', () => {
  const item = read(ROOT, 'data/primitives.json').PARAM_UNITS;
  assert.equal(item?.kind, 'words', 'data/primitives.json has no PARAM_UNITS words item');
  const words = Object.values(item.words).map((w) => w.symbol);
  assert.deepEqual(read(ROOT, 'schema/omx-contract.schema.json').$defs.unit.enum, words);
  const r = check(ROOT);
  assert.equal(r.status, 0, r.stderr);
});

test('sabotage: a unit added to PARAM_UNITS and not rendered into the schema is named', () => {
  const dir = mkdtempSync(join(tmpdir(), 'param-units-'));
  try {
    for (const d of ['data', 'schema']) cpSync(join(ROOT, d), join(dir, d), { recursive: true });
    const p = join(dir, 'data/primitives.json');
    const doc = JSON.parse(readFileSync(p, 'utf8'));
    doc.PARAM_UNITS.words.bar = { word: 'bar', symbol: 'bar', doc: 'A planted unit.' };
    writeFileSync(p, JSON.stringify(doc, null, 2));
    const r = check(dir);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /\$defs\.unit/);
    assert.match(r.stderr, /"bar"/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
