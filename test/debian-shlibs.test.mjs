// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// libomx-domain0 gives the packages that link it a version floor: debian/libomx-domain0.symbols lists every export of
// abi/libomx-domain.abi, no more and no fewer, each with the release that introduced it, so dpkg-shlibdeps writes
// `libomx-domain0 (>= floor)` into a consumer instead of a bare package name.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const ROOT = new URL('..', import.meta.url).pathname;

const lines = (f) => readFileSync(`${ROOT}/${f}`, 'utf8').split('\n').filter((l) => l !== '');

test('libomx-domain0.symbols exists and names the library, its package and the floor token', () => {
  const [head] = lines('debian/libomx-domain0.symbols');
  assert.equal(head, 'libomx-domain.so.0 libomx-domain0 #MINVER#');
});

test('libomx-domain0.symbols lists exactly the exports of the ABI list, each with the version that introduced it', () => {
  const [, ...rows] = lines('debian/libomx-domain0.symbols');
  const listed = rows.map((r) => {
    const m = /^ (\w+)@OMX_DOMAIN_0 (\d+\.\d+\.\d+~?)$/.exec(r);
    assert.ok(m, `not a symbol row of the OMX_DOMAIN_0 version: ${JSON.stringify(r)}`);
    return m[1];
  });
  // the version node itself is a row of dpkg-gensymbols' output; it is not an export of the ABI list
  assert.ok(listed.includes('OMX_DOMAIN_0'), 'the version node OMX_DOMAIN_0 is not listed');
  assert.deepEqual(listed.filter((n) => n !== 'OMX_DOMAIN_0').sort(), lines('abi/libomx-domain.abi'));
});

test('the build refuses a symbol missing from the symbols file', () => {
  const rules = readFileSync(`${ROOT}/debian/rules`, 'utf8');
  assert.match(rules, /^override_dh_makeshlibs:\n\tdh_makeshlibs -- -c4$/m);
});
