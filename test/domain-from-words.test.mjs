// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// A word's x-from may name a word of another domain's words item, not only a term of a terms item (docs/contract-dir.md,
// "Domains"): { "$ref": "<domain id>#/components/schemas/<ITEM>", "x-term": "<the target word's title>" }. The target
// domain is declared in info.x-requires with its floor, as for terms. The fixture test/fixtures/domain-from-words holds
// two domains: xa (owner pkg-a) with the words item XA_COLORS and the scalar XA_SIZE, and xb (owner pkg-b), whose
// XB_PAINTS words are taken from XA_COLORS. A from renders nothing of its own, as a terms reference renders nothing in
// a header today: xb's codes header is byte for byte the one of xb without its x-from (golden/xb_codes.h, written by
// the CLI of main from xb with x-from and x-requires stripped), and the data file xb rebuilds carries the from as the
// data form's `<ITEM>#<title>` (golden/paints.json).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { SCHEMA_MAJOR, installedSchemaUrl, sha256 } from '../lib/contract-dir.mjs';
import { domainDataFiles } from '../lib/domain.mjs';
import { SCHEMA_VERSION } from '../lib/validate.mjs';
import { ROOT } from './helpers.mjs';

const FIX = join(ROOT, 'test/fixtures/domain-from-words');
const CLI = join(ROOT, 'bin/omx-contract.mjs');
const SCRATCH = mkdtempSync(join(tmpdir(), 'omx-from-words-'));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));
let n = 0;

const xa = () => JSON.parse(readFileSync(join(FIX, 'xa/xa.json'), 'utf8'));
const xb = () => JSON.parse(readFileSync(join(FIX, 'xb/xb.json'), 'utf8'));
const golden = (f) => readFileSync(join(FIX, 'golden', f), 'utf8');
const cli = (...args) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });

/** A contract directory holding the domains given, `{ <name>: doc }` (a null doc is left out). */
function contractDir(docs) {
  const root = join(SCRATCH, `cd-${n++}`);
  for (const [name, doc] of Object.entries(docs)) {
    if (doc === null) continue;
    mkdirSync(join(root, name), { recursive: true });
    writeFileSync(join(root, name, `${name}.json`), `${JSON.stringify(doc, null, 2)}\n`);
  }
  return root;
}
const render = (root) => {
  const out = `${root}-out`;
  const r = cli('render', '--target', 'c', '--contract-dir', root, '--package', 'xb', '--out', out);
  return { ...r, out };
};
const paint = (doc, i = 0) => doc.components.schemas.XB_PAINTS.oneOf[i];

test('a word taken from another domain\'s words item validates, and xb renders byte for byte as without its from (golden)', () => {
  const root = contractDir({ xa: xa(), xb: xb() });
  const v = cli('validate', '--contract-dir', root);
  assert.equal(v.status, 0, v.stderr);
  const r = render(root);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readFileSync(join(r.out, 'xb_codes.h'), 'utf8'), golden('xb_codes.h'));
});

test('the title, not the word as written, names the target word: x-term "deep-blue" is refused, "deepBlue" resolves', () => {
  const doc = xb();
  paint(doc, 1)['x-from'][0]['x-term'] = 'deep-blue';
  const r = render(contractDir({ xa: xa(), xb: doc }));
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /contract\.ref\.unresolved/);
  assert.match(r.stderr, /"deep-blue".*XA_COLORS#deep-blue.*xa/);
});

test('the data file xb rebuilds carries the from as <ITEM>#<title> and the declared requires (golden)', () => {
  assert.equal(domainDataFiles('xb', xb())['paints.json'], golden('paints.json'));
});

test('render --installed --with-domain: xb rebuilt into pkg-b takes its words from the installed domain xa', () => {
  const root = contractDir({ xa: xa() });
  const pkg = join(root, String(SCHEMA_MAJOR), 'pkg-b');
  mkdirSync(pkg, { recursive: true });
  const text = `${JSON.stringify({ $schema: installedSchemaUrl(SCHEMA_MAJOR), requires: { 'omx-contract-schema': `>= ${SCHEMA_VERSION}` }, PKG_B_EXTRA: { kind: 'codes', since: '1.0.0', doc: 'A code pkg-b installs itself.', codes: { extraOne: { code: 'pkg.b.extra.one' } } } }, null, 2)}\n`;
  writeFileSync(join(pkg, 'extra.json'), text);
  writeFileSync(join(pkg, 'MANIFEST.json'), `${JSON.stringify({ package: 'pkg-b', version: '1.0.0', schemaMajor: SCHEMA_MAJOR, files: { 'extra.json': sha256(Buffer.from(text)) } }, null, 2)}\n`);
  const wd = join(SCRATCH, `wd-${n++}`, 'xb');
  mkdirSync(wd, { recursive: true });
  cpSync(join(FIX, 'xb/xb.json'), join(wd, 'xb.json'));
  const r = spawnSync(process.execPath, [CLI, 'render', '--target', 'c', '--package', 'pkg-b', '--installed', '--with-domain', wd, '--out', `${root}-out`], { encoding: 'utf8', env: { ...process.env, OMX_CONTRACT_PATH: root } });
  assert.equal(r.status, 0, r.stderr);
  // sabotage: the target word removed from xa is refused here too
  const gone = xa();
  gone.components.schemas.XA_COLORS.oneOf.splice(1, 1);
  writeFileSync(join(root, 'xa', 'xa.json'), `${JSON.stringify(gone, null, 2)}\n`);
  const s = spawnSync(process.execPath, [CLI, 'render', '--target', 'c', '--package', 'pkg-b', '--installed', '--with-domain', wd, '--out', `${root}-out2`], { encoding: 'utf8', env: { ...process.env, OMX_CONTRACT_PATH: root } });
  assert.notEqual(s.status, 0);
  assert.match(s.stderr, /XA_COLORS#deepBlue/);
});

test('sabotage: the target word removed from xa is refused by name, by render and validate', () => {
  const gone = xa();
  gone.components.schemas.XA_COLORS.oneOf.splice(0, 1);
  gone.components.schemas.XA_COLORS.oneOf[0]['x-code'] = 0;
  const root = contractDir({ xa: gone, xb: xb() });
  const r = render(root);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /contract\.ref\.unresolved/);
  assert.match(r.stderr, /XB_PAINTS\.oneOf\[0\]\.x-from\[0\] of the word "red".*XA_COLORS#red.*xa/);
  const v = cli('validate', '--contract-dir', root);
  assert.notEqual(v.status, 0);
  assert.match(v.stderr, /XA_COLORS#red/);
});

test('refused by name: a from naming an item of xa that is no words item (the scalar XA_SIZE)', () => {
  const doc = xb();
  paint(doc)['x-from'][0].$ref = 'https://openmixer.org/contract/xa#/components/schemas/XA_SIZE';
  const r = render(contractDir({ xa: xa(), xb: doc }));
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /contract\.ref\.unresolved/);
  assert.match(r.stderr, /XA_SIZE.*scalar.*no words item/);
});

test('refused by name: a from naming an item xa does not have', () => {
  const doc = xb();
  paint(doc)['x-from'][0].$ref = 'https://openmixer.org/contract/xa#/components/schemas/XA_SHADES';
  const r = render(contractDir({ xa: xa(), xb: doc }));
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /contract\.ref\.unresolved/);
  assert.match(r.stderr, /XA_SHADES/);
});

test('refused by name: the target domain not declared in info.x-requires', () => {
  const doc = xb();
  delete doc.info['x-requires'];
  const r = render(contractDir({ xa: xa(), xb: doc }));
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /contract\.ref\.undeclared/);
  assert.match(r.stderr, /"red".*xa.*x-requires/);
});

test('refused by name: the target domain below the floor, and absent', () => {
  const below = xb();
  below.info['x-requires'] = { xa: '>= 2.0.0' };
  const b = render(contractDir({ xa: xa(), xb: below }));
  assert.notEqual(b.status, 0);
  assert.match(b.stderr, /contract\.package\.too-old/);
  assert.match(b.stderr, /xa >= 2\.0\.0.*1\.2\.0/);
  const a = render(contractDir({ xa: null, xb: xb() }));
  assert.notEqual(a.status, 0);
  assert.match(a.stderr, /contract\.package\.absent/);
  assert.match(a.stderr, /xa/);
});

test('a word of the same domain\'s words item may be named too (the domain is its own, no x-requires needed)', () => {
  const doc = xa();
  doc.components.schemas.XA_TINTS = { description: 'Tints of the colours.', 'x-since': '1.0.0', oneOf: [{ const: 'red', title: 'pink', 'x-code': 0, 'x-from': [{ $ref: 'https://openmixer.org/contract/xa#/components/schemas/XA_COLORS', 'x-term': 'red' }] }] };
  const root = contractDir({ xa: doc });
  const v = cli('validate', '--contract-dir', root);
  assert.equal(v.status, 0, v.stderr);
  doc.components.schemas.XA_TINTS.oneOf[0]['x-from'][0]['x-term'] = 'green';
  const w = cli('validate', '--contract-dir', contractDir({ xa: doc }));
  assert.notEqual(w.status, 0);
  assert.match(w.stderr, /XA_COLORS#green/);
});

/** xb with its first word's from pointing at `<to>#<item>`, the word `term`. */
function fromAt(to, item, term) {
  const doc = xb();
  paint(doc)['x-from'] = [{ $ref: `https://openmixer.org/contract/${to}#/components/schemas/${item}`, 'x-term': term }];
  return doc;
}

test('the narrowed path is no hole: a from into omx-contract or the owner package, neither in the read, naming a word that does not exist, is refused by validate (word-from)', () => {
  for (const [to, item] of [['omx-contract', 'LV2_CORE_TERMS'], ['pkg-b', 'PKG_B_WORDS']]) {
    const v = cli('validate', '--contract-dir', contractDir({ xa: xa(), xb: fromAt(to, item, 'nope') }));
    assert.notEqual(v.status, 0, to);
    assert.match(v.stderr, new RegExp(`^xb/xb\\.json: XB_PAINTS: word-from: red: ${item}#nope: `, 'm'), to);
  }
});

test('the narrowed path is no hole: a from into omx-contract or the owner package, neither in the read, whose item only another package declares, is refused by name', () => {
  for (const to of ['omx-contract', 'pkg-b']) {
    const root = contractDir({ xa: xa(), xb: fromAt(to, 'XA_COLORS', 'red') });
    for (const r of [cli('validate', '--contract-dir', root), render(root)]) {
      assert.notEqual(r.status, 0, to);
      assert.match(r.stderr, /contract\.ref\.undeclared/, to);
      assert.match(r.stderr, new RegExp(`"red".*XA_COLORS#red from ${to}.*declared by xa`), to);
    }
  }
});
