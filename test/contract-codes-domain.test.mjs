// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// CONTRACT_CODES is an item of the `contract` domain (contract.d/contract/contract.json, vocabulary sorting pass V20):
// the words moved, the readers switched where they read them. The proof is call-level, three arms:
//  (a) golden: the real reads (lib/codes.mjs `CONTRACT_CODES` and `refuse`, the C header render `renderCodesFile`)
//      give the 57 codes the 3.20.2 table gave, frozen in test/golden/contract-codes.tsv (value, key, code);
//  (b) both sources: while data/codes.json exists, the domain's words equal it, word for word;
//  (c) sabotage: a copy of the tool whose domain lacks one word reads a table without it, and its header differs.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { ContractRefusal, CONTRACT_CODES, refuse } from '../lib/codes.mjs';
import { renderCodesFile } from '../render/codes.mjs';
import { ROOT } from './helpers.mjs';

const golden = readFileSync(join(ROOT, 'test/golden/contract-codes.tsv'), 'utf8').trim().split('\n').map((l) => {
  const [value, key, code] = l.split('\t');
  return { value: Number(value), key, code };
});
const DOMAIN = join(ROOT, 'contract.d/contract/contract.json');
const upperSnake = (k) => k.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();

test('golden: 57 codes, the values 1..57 in order', () => {
  assert.equal(golden.length, 57);
  assert.deepEqual(golden.map((g) => g.value), golden.map((_, i) => i + 1));
});

test('(a) the reader\'s CONTRACT_CODES holds the golden codes by key, and refuse() raises each with its code', () => {
  assert.deepEqual(CONTRACT_CODES, Object.fromEntries(golden.map((g) => [g.key, g.code])));
  for (const g of golden) {
    assert.throws(() => refuse(g.key, 'f', 'm'), (e) => e instanceof ContractRefusal && e.code === g.code, g.key);
  }
  assert.throws(() => refuse('noSuchCode', 'f', 'm'), /no contract code named noSuchCode/);
});

test('(a) the C header render holds the golden rows: place from 1, the string, the enumerator', () => {
  const { path, text } = renderCodesFile();
  assert.equal(path, 'omxcontract/omx_contract_codes.h');
  const rows = [...text.matchAll(/^ {2}X\((\w+), (\d+), "([^"]+)"\)/gm)].map((m) => ({ value: Number(m[2]), key: m[1], code: m[3] }));
  assert.deepEqual(rows, golden.map((g) => ({ value: g.value, key: upperSnake(g.key), code: g.code })));
  assert.equal(text, readFileSync(join(ROOT, 'include/omxcontract/omx_contract_codes.h'), 'utf8'), 'byte for byte the committed header');
});

test('(b) both sources: the domain\'s words are the table\'s, in the table\'s order, while data/codes.json exists', (t) => {
  const old = join(ROOT, 'data/codes.json');
  if (!existsSync(old)) return t.skip('data/codes.json is removed');
  const table = JSON.parse(readFileSync(old, 'utf8')).CONTRACT_CODES.codes;
  const words = JSON.parse(readFileSync(DOMAIN, 'utf8')).components.schemas.CONTRACT_CODES.oneOf;
  assert.deepEqual(words.map((w) => w['x-name']), Object.keys(table));
  words.forEach((w, i) => {
    const c = table[w['x-name']];
    assert.deepEqual([w.const, w.description, w['x-text'], w['x-code'], w.title], [c.code, c.doc, c.text.en, i, w['x-name']]);
  });
});

/** The tool, copied, with the domain's `contract.dir.absent` word removed; `run` is called with the copy's root. */
function sabotaged(run) {
  const dir = mkdtempSync(join(tmpdir(), 'contract-codes-'));
  try {
    for (const d of ['bin', 'lib', 'render', 'schema', 'data', 'contract.d', 'include', 'catalogs', 'share', 'package.json']) cpSync(join(ROOT, d), join(dir, d), { recursive: true });
    symlinkSync(join(ROOT, 'node_modules'), join(dir, 'node_modules'));
    const file = join(dir, 'contract.d/contract/contract.json');
    const doc = JSON.parse(readFileSync(file, 'utf8'));
    const words = doc.components.schemas.CONTRACT_CODES.oneOf;
    const at = words.findIndex((w) => w.const === 'contract.dir.absent');
    assert.ok(at >= 0, 'the domain has contract.dir.absent');
    words.splice(at, 1);
    words.forEach((w, i) => { w['x-code'] = i; });
    writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`);
    return run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('(c) sabotage: a domain without contract.dir.absent leaves the reader without dirAbsent, and the header without its row', () => {
  sabotaged((dir) => {
    const table = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', `import { CONTRACT_CODES } from ${JSON.stringify(join(dir, 'lib/codes.mjs'))}; console.log(JSON.stringify(CONTRACT_CODES));`], { encoding: 'utf8' }));
    assert.equal(table.dirAbsent, undefined, 'the reader reads its words from the domain');
    assert.equal(Object.keys(table).length, 56);
    const out = join(dir, 'out');
    execFileSync(process.execPath, [join(dir, 'bin/omx-contract.mjs'), 'render', '--target', 'c', '--out', out], { encoding: 'utf8' });
    const header = readFileSync(join(out, 'omxcontract/omx_contract_codes.h'), 'utf8');
    assert.ok(!header.includes('contract.dir.absent'), 'the header renders the domain');
    assert.match(header, /OMX_CONTRACT_CODE_LAST = 56 /);
  });
});
