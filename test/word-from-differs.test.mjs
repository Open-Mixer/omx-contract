// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// word-from-differs (docs/contract-dir.md, "Domains"; format ruling 2026-11-20): a word whose x-from names a word of a
// WORDS item is that word: its const and x-code are the target's, and a description or x-text it carries is the
// target's too. A word that differs is refused by name, naming the item, the word and the field, by validate (rule
// word-from-differs, the data form's word-from) and by the read of a contract directory wherever the target is in the
// read (contract.file.invalid, naming word-from-differs). A terms target is unchanged: a word is never its term.
// An ABSENT description or x-text is refused as a difference (owner ruling (b), 2026-11-20: copies only, no
// inheritance), so runtime readers and renders give one text with no reader change. The fixture is test/fixtures/domain-from-words: xb's XB_PAINTS copy xa's XA_COLORS.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { domainDataFiles } from '../lib/domain.mjs';
import { ROOT } from './helpers.mjs';

const FIX = join(ROOT, 'test/fixtures/domain-from-words');
const CLI = join(ROOT, 'bin/omx-contract.mjs');
const SCRATCH = mkdtempSync(join(tmpdir(), 'omx-from-differs-'));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));
let n = 0;

const xa = () => JSON.parse(readFileSync(join(FIX, 'xa/xa.json'), 'utf8'));
const xb = () => JSON.parse(readFileSync(join(FIX, 'xb/xb.json'), 'utf8'));
const cli = (...args) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });
const paints = (doc) => doc.components.schemas.XB_PAINTS.oneOf;

/** A contract directory holding xa and the domain xb `doc`. */
function contractDir(doc) {
  const root = join(SCRATCH, `cd-${n++}`);
  for (const [name, d] of [['xa', xa()], ['xb', doc]]) {
    mkdirSync(join(root, name), { recursive: true });
    writeFileSync(join(root, name, `${name}.json`), `${JSON.stringify(d, null, 2)}\n`);
  }
  return root;
}
const render = (root) => cli('render', '--target', 'c', '--contract-dir', root, '--package', 'xb', '--out', `${root}-out`);

/** A data directory (the data form) holding XA_COLORS as a words file and the data file xb rebuilds from `doc`. */
function dataDir(doc) {
  const dir = join(SCRATCH, `dd-${n++}`, 'data');
  mkdirSync(dir, { recursive: true });
  const colors = { XA_COLORS: { kind: 'words', since: '1.0.0', doc: 'The colours of domain xa.', words: Object.fromEntries(xa().components.schemas.XA_COLORS.oneOf.map((e) => [e.title, { word: e.const, doc: e.description, text: { en: e['x-text'] } }])) } };
  const files = { 'colors.json': colors, 'paints.json': JSON.parse(domainDataFiles('xb', doc)['paints.json']) };
  for (const [f, d] of Object.entries(files)) {
    const { requires, ...items } = d;
    writeFileSync(join(dir, f), `${JSON.stringify({ $schema: '../schema/omx-contract.schema.json', ...items }, null, 2)}\n`);
  }
  return dir;
}

test('copies are accepted: xb\'s words carry the const, x-code, description and x-text of the xa words they name', () => {
  const v = cli('validate', '--contract-dir', contractDir(xb()));
  assert.equal(v.status, 0, v.stderr);
  const d = cli('validate', '--data', dataDir(xb()));
  assert.equal(d.status, 0, d.stderr);
});

/** Each way a word can differ from the word it names, the field the refusal names and the edit that makes it. */
const DIFFERS = {
  'a differing const': ['const', (doc) => { paints(doc)[0].const = 'scarlet'; }],
  'a differing x-code': ['x-code', (doc) => { const [a, b] = paints(doc); paints(doc).splice(0, 2, { ...b, 'x-code': 0 }, { ...a, 'x-code': 1 }); }],
  'a differing description': ['description', (doc) => { paints(doc)[0].description = 'A warm paint.'; }],
  'a differing x-text': ['x-text', (doc) => { paints(doc)[0]['x-text'] = 'Rouge'; }],
};

for (const [what, [field, edit]] of Object.entries(DIFFERS)) {
  test(`refused by name: ${what} from the word it names (validate, the data form and the read)`, () => {
    const doc = xb();
    edit(doc);
    const v = cli('validate', '--contract-dir', contractDir(doc));
    assert.notEqual(v.status, 0, 'validate --contract-dir');
    assert.match(v.stderr, new RegExp(`XB_PAINTS.*word-from-differs.*${field}`), 'validate --contract-dir');
    const r = render(contractDir(doc));
    assert.notEqual(r.status, 0, 'render');
    assert.match(r.stderr, /contract\.file\.invalid/, 'render');
    assert.match(r.stderr, new RegExp(`XB_PAINTS\\.oneOf\\[\\d\\].*word-from-differs.*${field}`), 'render');
    const d = cli('validate', '--data', dataDir(doc));
    assert.notEqual(d.status, 0, 'validate --data');
    assert.match(d.stderr, new RegExp(`^data/paints\\.json: XB_PAINTS: word-from-differs: .*${field === 'x-code' ? 'x-code' : field}`, 'm'), 'validate --data');
  });
}

// Owner ruling (b), 2026-11-20: copies only, no inheritance. A word missing a field its target carries is refused by
// name, as a differing one is; a field neither carries is no difference.
for (const [field, key] of [['description', 'description'], ['x-text', 'x-text']]) {
  test(`refused by name: an absent ${field} where the word it names carries one (copies only, no inheritance)`, () => {
    const doc = xb();
    delete paints(doc)[0][key];
    const v = cli('validate', '--contract-dir', contractDir(doc));
    assert.notEqual(v.status, 0, 'validate --contract-dir');
    assert.match(v.stderr, new RegExp(`XB_PAINTS.*word-from-differs.*its ${field} \\(none\\)`), 'validate --contract-dir');
    const r = render(contractDir(doc));
    assert.notEqual(r.status, 0, 'render');
    assert.match(r.stderr, new RegExp(`XB_PAINTS\\.oneOf\\[0\\].*word-from-differs.*its ${field} \\(none\\)`), 'render');
    const d = cli('validate', '--data', dataDir(doc));
    assert.notEqual(d.status, 0, 'validate --data');
    assert.match(d.stderr, new RegExp(`^data/paints\\.json: XB_PAINTS: word-from-differs: red: .*its ${field} \\(none\\)`, 'm'), 'validate --data');
  });
}

test('a field neither word carries is no difference: both without a description and an x-text are accepted', () => {
  const a = xa();
  for (const e of a.components.schemas.XA_COLORS.oneOf) { delete e.description; delete e['x-text']; }
  const doc = xb();
  for (const e of paints(doc)) { delete e.description; delete e['x-text']; }
  const root = join(SCRATCH, `cd-${n++}`);
  for (const [name, d] of [['xa', a], ['xb', doc]]) {
    mkdirSync(join(root, name), { recursive: true });
    writeFileSync(join(root, name, `${name}.json`), `${JSON.stringify(d, null, 2)}\n`);
  }
  const v = cli('validate', '--contract-dir', root);
  assert.equal(v.status, 0, v.stderr);
});

test('a terms target is unchanged: a word taken from a term is not that term (the domain-kinds golden words)', () => {
  const dir = join(SCRATCH, `terms-${n++}`, 'data');
  mkdirSync(dir, { recursive: true });
  const K = join(ROOT, 'test/fixtures/domain-kinds');
  cpSync(join(K, 'data/terms.json'), join(dir, 'terms.json'));
  cpSync(join(K, 'golden/words.json'), join(dir, 'words.json'));
  for (const f of ['terms.json', 'words.json']) writeFileSync(join(dir, f), `${JSON.stringify({ $schema: '../schema/omx-contract.schema.json', ...JSON.parse(readFileSync(join(dir, f), 'utf8')) }, null, 2)}\n`);
  const words = JSON.parse(readFileSync(join(dir, 'words.json'), 'utf8'));
  assert.ok(Object.values(words).some((it) => Object.values(it.words ?? {}).some((w) => (w.from ?? []).length && w.word !== w.from[0].split('#')[1])), 'the fixture has a word that is not its term');
  const v = cli('validate', '--data', dir);
  assert.equal(v.status, 0, v.stderr);
});
