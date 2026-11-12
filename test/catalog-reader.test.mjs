// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The catalog reader (`@openmixer/omx-contract/catalog`, omx-contract#2) is TypeScript of its own: it loads only what a
// surface's lookup needs (the schema check, the placeholder reader and the shared JSON shape), never the contract's
// validator, and its sources build under the strictest typing the repository holds (no implicit any). A surface that
// reads one catalog carries no more of the contract than that.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { ROOT } from './helpers.mjs';

const SRC = join(ROOT, 'src/lib');
/** The relative modules a source imports, by their file name. */
const importsOf = (name) =>
  [...readFileSync(join(SRC, `${name}.mts`), 'utf8').matchAll(/^import\s[^;]*?from\s+'\.\/([a-z-]+)\.mjs';/gm)].map((m) => m[1]).sort();

test("the reader loads the schema check, the placeholder reader and the JSON shape, never the validator", () => {
  const seen = new Set();
  const walk = (name) => { if (seen.has(name)) return; seen.add(name); for (const n of importsOf(name)) walk(n); };
  walk('catalog');
  assert.deepEqual([...seen].sort(), ['catalog', 'json', 'placeholders', 'schema-validate']);
});

test('the reader and what it loads build with no implicit any (tsconfig.strict.json)', () => {
  const tsc = join(ROOT, 'node_modules/.bin/tsc');
  const r = spawnSync(tsc, ['-p', join(ROOT, 'tsconfig.strict.json')], { encoding: 'utf8' });
  assert.equal(r.status, 0, `${r.stdout}${r.stderr}`);
});
