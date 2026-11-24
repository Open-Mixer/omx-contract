// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// Every installed C header compiles in one translation unit under -Werror (omx-contract#151): a macro two headers both
// define (the code sheet's OMX_PARAM_UNITS(X) and a words item's X-macro of the same name) is a consumer's build break,
// and `make check` only finds it in a package's %check, long after the tests. Each header also compiles alone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INCLUDE = join(ROOT, 'include');
const headers = readdirSync(join(INCLUDE, 'omxcontract')).filter((f) => f.endsWith('.h')).sort();

const compile = (names) => {
  const src = names.map((h) => `#include <omxcontract/${h}>\n`).join('');
  return spawnSync(process.env.CC || 'cc', ['-std=c11', '-Wall', '-Wextra', '-Werror', '-Wno-unused-function', '-fsyntax-only', `-I${INCLUDE}`, '-x', 'c', '-'], { input: src, encoding: 'utf8' });
};

test('every installed header compiles together under -Werror', () => {
  assert.ok(headers.length > 1, 'no installed headers found');
  const r = compile(headers);
  assert.equal(r.error, undefined, `no C compiler: ${r.error?.message}`);
  assert.equal(r.status, 0, r.stderr);
});

test('every installed header compiles alone under -Werror', () => {
  for (const h of headers) {
    const r = compile([h]);
    assert.equal(r.status, 0, `${h}: ${r.stderr}`);
  }
});

test('sabotage: a macro defined in two headers is refused', () => {
  const r = spawnSync(process.env.CC || 'cc', ['-std=c11', '-Wall', '-Werror', '-fsyntax-only', '-x', 'c', '-'], { input: '#define OMX_X(a) a\n#define OMX_X(a) a, a\n', encoding: 'utf8' });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /redefined/);
});
