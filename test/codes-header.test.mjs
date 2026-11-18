// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The C header of CONTRACT_CODES (render/codes.mjs): a code's value is its place in data/codes.json from 1, the string
// is the code, and the header is read back here by its text, never by the renderer that wrote it.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { renderCodesHeader } from '../render/codes.mjs';
import { ROOT } from './helpers.mjs';

const header = readFileSync(join(ROOT, 'include/omxcontract/omx_contract_codes.h'), 'utf8');
const codes = Object.values(JSON.parse(readFileSync(join(ROOT, 'data/codes.json'), 'utf8')).CONTRACT_CODES.codes).map((c) => c.code);
const rows = [...header.matchAll(/^ {2}X\((\w+), (\d+), "([^"]+)"\)/gm)].map((m) => ({ name: m[1], value: Number(m[2]), code: m[3] }));

test('every code of CONTRACT_CODES is a row of the header: its place from 1, its string', () => {
  assert.deepEqual(rows.map((r) => r.code), codes);
  assert.deepEqual(rows.map((r) => r.value), codes.map((_, i) => i + 1));
});

test('every row is also an enumerator of the same value, and the last is the count', () => {
  for (const r of rows) assert.match(header, new RegExp(`OMX_CONTRACT_CODE_${r.name} = ${r.value},`), r.name);
  assert.match(header, new RegExp(`OMX_CONTRACT_CODE_LAST = ${codes.length} `));
});

test('the loader\'s three lookup codes have the names the C loader returns', () => {
  const by = Object.fromEntries(rows.map((r) => [r.code, r.name]));
  assert.equal(by['contract.item.unknown'], 'ITEM_UNKNOWN');
  assert.equal(by['contract.word.unknown'], 'WORD_UNKNOWN');
  assert.equal(by['contract.index.range'], 'INDEX_RANGE');
});

test('a camelCase key is an UPPER_SNAKE name, and a code added is appended with the next value', () => {
  const file = JSON.parse(readFileSync(join(ROOT, 'data/codes.json'), 'utf8'));
  file.CONTRACT_CODES.codes.fooBarBaz = { code: 'contract.foo.bar-baz', doc: 'd', text: { en: 'x' } };
  const text = renderCodesHeader(file);
  assert.match(text, new RegExp(`OMX_CONTRACT_CODE_FOO_BAR_BAZ = ${codes.length + 1},`));
  assert.match(text, new RegExp(`X\\(FOO_BAR_BAZ, ${codes.length + 1}, "contract.foo.bar-baz"\\)`));
});
