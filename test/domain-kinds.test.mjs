// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The kinds a domain rebuilds into data files (docs/render.md, `render --with-domain`; docs/contract-dir.md,
// "Domains"): a word's stored `x-args`, the `words` kind and the `scalar` kind. The fixture test/fixtures/domain-kinds
// holds one domain (kinds/kinds.json, with a catalog in a second language), the data files it must rebuild byte for
// byte (golden/) and the terms its words are taken from (data/terms.json). The codes and sheet kinds of before are
// held to their golden files too, so the new kinds change nothing for them.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { after, test } from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import { SCHEMA_MAJOR, installedSchemaUrl, sha256 } from '../lib/contract-dir.mjs';
import { domainDataFiles } from '../lib/domain.mjs';
import { SCHEMA_VERSION } from '../lib/validate.mjs';
import { ROOT } from './helpers.mjs';

const FIX = join(ROOT, 'test/fixtures/domain-kinds');
const CLI = join(ROOT, 'bin/omx-contract.mjs');
const SCRATCH = mkdtempSync(join(tmpdir(), 'omx-domain-kinds-'));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));
let n = 0;

const domain = () => JSON.parse(readFileSync(join(FIX, 'kinds/kinds.json'), 'utf8'));
const golden = (f) => readFileSync(join(FIX, 'golden', f), 'utf8');
const cli = (...args) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));

/** `doc` with only the items `keep` names (the root's `x-render` goes with `constants.json`). */
function only(doc, keep) {
  const out = structuredClone(doc);
  out.components.schemas = Object.fromEntries(Object.entries(out.components.schemas).filter(([k]) => keep.includes(k)));
  if (!keep.some((k) => out.components.schemas[k]?.['x-file'] === out['x-file'])) { delete out['x-render']; delete out['x-file']; }
  return out;
}

/** A contract directory: the domain `doc` (and its catalog), and beside it the package kinds-terms holding the terms its words are taken from. */
function contractDir(doc) {
  const root = join(SCRATCH, `cd-${n++}`);
  mkdirSync(join(root, 'kinds', 'catalogs'), { recursive: true });
  writeFileSync(join(root, 'kinds', 'kinds.json'), `${JSON.stringify(doc, null, 2)}\n`);
  cpSync(join(FIX, 'kinds/catalogs/ca.json'), join(root, 'kinds', 'catalogs', 'ca.json'));
  const pkg = join(root, String(SCHEMA_MAJOR), 'kinds-terms');
  mkdirSync(pkg, { recursive: true });
  const terms = JSON.parse(readFileSync(join(FIX, 'data/terms.json'), 'utf8'));
  const text = `${JSON.stringify({ $schema: installedSchemaUrl(SCHEMA_MAJOR), requires: { 'omx-contract-schema': `>= ${SCHEMA_VERSION}` }, ...terms }, null, 2)}\n`;
  writeFileSync(join(pkg, 'terms.json'), text);
  writeFileSync(join(pkg, 'MANIFEST.json'), `${JSON.stringify({ package: 'kinds-terms', version: '1.0.0', schemaMajor: SCHEMA_MAJOR, files: { 'terms.json': sha256(Buffer.from(text)) } }, null, 2)}\n`);
  return root;
}

/** A data directory holding the terms, and beside it the domain `doc` as `kinds/kinds.json`: what `render --with-domain` reads. */
function withDomain(doc) {
  const dir = join(SCRATCH, `wd-${n++}`);
  cpSync(join(FIX, 'data'), join(dir, 'data'), { recursive: true });
  mkdirSync(join(dir, 'kinds'));
  writeFileSync(join(dir, 'kinds', 'kinds.json'), `${JSON.stringify(doc, null, 2)}\n`);
  return dir;
}

test('a codes item whose words store x-args rebuilds the data file with args, byte for byte', () => {
  assert.equal(domainDataFiles('kinds', only(domain(), ['KINDS_CODES']))['codes.json'], golden('codes.json'));
});

test('a words item (groups, from, doc, text and args) rebuilds today\'s kind words data file, byte for byte', () => {
  assert.equal(domainDataFiles('kinds', only(domain(), ['KINDS_STATES', 'KINDS_REASONS']))['words.json'], golden('words.json'));
});

test('a scalar item rebuilds today\'s kind scalar data file, with the root\'s x-render, byte for byte', () => {
  assert.equal(domainDataFiles('kinds', only(domain(), ['KINDS_DIGEST_HEX_LEN', 'KINDS_RATE_HZ']))['constants.json'], golden('constants.json'));
});

test('the kinds of before, codes without args and a sheet, still rebuild byte for byte', () => {
  assert.deepEqual(domainDataFiles('kinds', only(domain(), ['KINDS_PLAIN', 'KINDS_SHEET'])), { 'plain.json': golden('plain.json') });
});

test('the whole domain rebuilds the four golden files and nothing else', () => {
  const files = domainDataFiles('kinds', domain());
  assert.deepEqual(Object.keys(files).sort(), readdirSync(join(FIX, 'golden')).sort());
  for (const [f, text] of Object.entries(files)) assert.equal(text, golden(f), f);
});

test('render --with-domain gives the files the golden data gives, byte for byte (c and ts)', () => {
  const pure = join(SCRATCH, `pure-${n++}`);
  cpSync(join(FIX, 'data'), join(pure, 'data'), { recursive: true });
  cpSync(join(FIX, 'golden'), join(pure, 'data'), { recursive: true });
  const both = withDomain(domain());
  for (const target of ['c', 'ts']) {
    const a = cli('render', '--target', target, '--package', 'kinds-owner', '--data', join(pure, 'data'), '--out', join(pure, `out-${target}`));
    assert.equal(a.status, 0, a.stderr);
    const b = cli('render', '--target', target, '--package', 'kinds-owner', '--data', join(both, 'data'), '--with-domain', join(both, 'kinds'), '--out', join(both, `out-${target}`));
    assert.equal(b.status, 0, b.stderr);
    const files = walk(join(pure, `out-${target}`)).map((p) => relative(join(pure, `out-${target}`), p)).sort();
    assert.ok(files.length > 0, `${target}: the golden data renders nothing`);
    assert.deepEqual(walk(join(both, `out-${target}`)).map((p) => relative(join(both, `out-${target}`), p)).sort(), files);
    for (const f of files) assert.equal(readFileSync(join(both, `out-${target}`, f), 'utf8'), readFileSync(join(pure, `out-${target}`, f), 'utf8'), `${target}: ${f}`);
  }
});

test('the golden data files are valid data, with the catalog in a second language', () => {
  const dir = join(SCRATCH, `gd-${n++}`);
  cpSync(join(FIX, 'data'), join(dir, 'data'), { recursive: true });
  cpSync(join(FIX, 'golden'), join(dir, 'data'), { recursive: true });
  cpSync(join(FIX, 'catalogs'), join(dir, 'catalogs'), { recursive: true });
  for (const f of readdirSync(join(dir, 'data'))) {
    const p = join(dir, 'data', f);
    writeFileSync(p, `${JSON.stringify({ $schema: '../schema/omx-contract.schema.json', ...JSON.parse(readFileSync(p, 'utf8')) }, null, 2)}\n`);
  }
  const r = cli('validate', '--data', join(dir, 'data'));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /1 catalog/);
});

test('validate accepts the domain from a contract directory: its x-args, words, scalars and a catalog in a second language', () => {
  const r = cli('validate', '--contract-dir', contractDir(domain()));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /1 catalog/);
});

test('the domain schema accepts the domain document', () => {
  const schema = JSON.parse(readFileSync(join(ROOT, 'schema/domain.schema.json'), 'utf8'));
  const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  assert.ok(validate(domain()), JSON.stringify(validate.errors));
  const noValue = domain();
  delete noValue.components.schemas.KINDS_RATE_HZ['x-value'];
  assert.equal(validate(noValue), false, 'a scalar with no x-value');
  const badArgs = domain();
  badArgs.components.schemas.KINDS_CODES.oneOf[0]['x-args'] = 'path';
  assert.equal(validate(badArgs), false, 'x-args that is no list');
});

/** The four ways a word's x-args can disagree with its x-text, each on the code kinds.file.mismatch. */
const DISAGREE = {
  'a placeholder not in x-args': (e) => { e['x-args'] = ['file', 'want']; },
  'an arg the sentence does not name': (e) => { e['x-args'] = ['file', 'want', 'found', 'path']; },
  'no x-args where the sentence has placeholders': (e) => { delete e['x-args']; },
  'an arg twice': (e) => { e['x-args'] = ['file', 'want', 'found', 'file']; },
};

for (const [what, edit] of Object.entries(DISAGREE)) {
  test(`refused by name: a code whose x-args disagree with its x-text placeholders (${what})`, () => {
    const doc = domain();
    edit(doc.components.schemas.KINDS_CODES.oneOf[2]);
    const name = /KINDS_CODES\.oneOf\[2\]\.x-args.*kinds\.file\.mismatch|kinds\.file\.mismatch.*KINDS_CODES\.oneOf\[2\]\.x-args/;
    const v = cli('validate', '--contract-dir', contractDir(doc));
    assert.notEqual(v.status, 0);
    assert.match(v.stderr, name);
    const d = withDomain(doc);
    const r = cli('render', '--target', 'c', '--package', 'kinds-owner', '--data', join(d, 'data'), '--with-domain', join(d, 'kinds'), '--out', join(d, 'out'));
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, name);
  });
}

test('refused by name: x-args on a word with no x-text', () => {
  const doc = domain();
  doc.components.schemas.KINDS_PLAIN.oneOf[1]['x-args'] = ['path'];
  const v = cli('validate', '--contract-dir', contractDir(doc));
  assert.notEqual(v.status, 0);
  assert.match(v.stderr, /KINDS_PLAIN\.oneOf\[1\]\.x-args.*kinds\.plain\.two/);
});

test('refused by name: a scalar whose x-value is no number or boolean, and a scalar with no x-unit', () => {
  const value = domain();
  value.components.schemas.KINDS_RATE_HZ['x-value'] = { hz: 50 };
  assert.match(cli('validate', '--contract-dir', contractDir(value)).stderr, /KINDS_RATE_HZ\.x-value/);
  const unit = domain();
  delete unit.components.schemas.KINDS_RATE_HZ['x-unit'];
  assert.match(cli('validate', '--contract-dir', contractDir(unit)).stderr, /KINDS_RATE_HZ\.x-unit/);
});
