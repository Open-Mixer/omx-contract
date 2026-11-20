// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The kinds a domain rebuilds into data files (docs/render.md, `render --with-domain`; docs/contract-dir.md,
// "Domains"): a word's stored `x-args`, the `words` kind and the `scalar` kind. The fixture test/fixtures/domain-kinds
// holds one domain (kinds/kinds.json, with a catalog in a second language), the data files it must rebuild byte for
// byte (golden/) and the terms its words are taken from (data/terms.json). The codes and sheet kinds of before are
// held to their golden files too, so the new kinds change nothing for them. An item with no `x-file` is read at run
// time only: it is not rebuilt, and not refused. The same rebuild serves a render of an installed contract directory
// (`render --installed --with-domain`), and the runtime reader serves the scalars (the C loader likewise, test/c).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { after, test } from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import { SCHEMA_MAJOR, installedSchemaUrl, sha256 } from '../lib/contract-dir.mjs';
import { domainDataFiles } from '../lib/domain.mjs';
import { openDomainAt } from '../lib/domain-reader.mjs';
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
const walk = (d) => (!existsSync(d) ? [] : readdirSync(d, { withFileTypes: true })).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));

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
  assert.equal(domainDataFiles('kinds', only(domain(), ['KINDS_CODES']))['refusals.json'], golden('refusals.json'));
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

test('the runtime reader serves a scalar: its value and unit; a words item and an unknown item are refused', () => {
  const d = openDomainAt(FIX, 'kinds');
  assert.deepEqual(d.scalar('KINDS_DIGEST_HEX_LEN'), { value: 64, unit: '' });
  assert.deepEqual(d.scalar('KINDS_RATE_HZ'), { value: 50, unit: 'Hz' });
  assert.throws(() => d.scalar('KINDS_CODES'), /contract\.word\.unknown|KINDS_CODES/);
  assert.throws(() => d.scalar('KINDS_NOPE'), /KINDS_NOPE/);
  assert.equal(d.words('KINDS_ADDRESS_FORMATS').length, 2);
});

test('an item with no x-file is not rebuilt and not refused; given an x-file, it is (sabotage)', () => {
  const doc = domain();
  assert.equal(doc.components.schemas.KINDS_ADDRESS_FORMATS['x-file'], undefined);
  const files = domainDataFiles('kinds', doc);
  assert.deepEqual(Object.keys(files).sort(), readdirSync(join(FIX, 'golden')).sort());
  for (const f of Object.values(files)) assert.ok(!f.includes('KINDS_ADDRESS_FORMATS'));
  const moved = domain();
  Object.assign(moved.components.schemas.KINDS_ADDRESS_FORMATS, { 'x-file': 'words.json', 'x-kind': 'words' });
  assert.notEqual(domainDataFiles('kinds', moved)['words.json'], golden('words.json'));
  const d = withDomain(moved);
  const r = cli('render', '--target', 'c', '--package', 'kinds-owner', '--data', join(d, 'data'), '--with-domain', join(d, 'kinds'), '--out', join(d, 'out'));
  assert.equal(r.status, 0, r.stderr);
  assert.match(readFileSync(join(d, 'out', 'kinds_owner_vocabulary.h'), 'utf8'), /KINDS_ADDRESS_FORMATS/);
});

/** A contract directory holding the package kinds-owner (`files`, each `{ rel: doc }`, given the installed $schema and a floor) and, when `doc` is given, the domain kinds. */
function installed(files, doc) {
  const root = join(SCRATCH, `in-${n++}`);
  const pkg = join(root, String(SCHEMA_MAJOR), 'kinds-owner');
  mkdirSync(pkg, { recursive: true });
  const hashes = {};
  for (const [rel, d] of Object.entries(files)) {
    const text = `${JSON.stringify({ $schema: installedSchemaUrl(SCHEMA_MAJOR), requires: { 'omx-contract-schema': `>= ${SCHEMA_VERSION}` }, ...d }, null, 2)}\n`;
    writeFileSync(join(pkg, rel), text);
    hashes[rel] = sha256(Buffer.from(text));
  }
  writeFileSync(join(pkg, 'MANIFEST.json'), `${JSON.stringify({ package: 'kinds-owner', version: '1.2.0', schemaMajor: SCHEMA_MAJOR, files: hashes }, null, 2)}\n`);
  if (doc) {
    mkdirSync(join(root, 'kinds', 'catalogs'), { recursive: true });
    writeFileSync(join(root, 'kinds', 'kinds.json'), `${JSON.stringify(doc, null, 2)}\n`);
    cpSync(join(FIX, 'kinds/catalogs/ca.json'), join(root, 'kinds', 'catalogs', 'ca.json'));
  }
  return root;
}
const terms = () => ({ 'terms.json': JSON.parse(readFileSync(join(FIX, 'data/terms.json'), 'utf8')) });
const installedRender = (root, target, out, ...extra) => spawnSync(process.execPath, [CLI, 'render', '--target', target, '--package', 'kinds-owner', '--installed', ...extra, '--out', out], { encoding: 'utf8', env: { ...process.env, OMX_CONTRACT_PATH: root } });

test('render --installed --with-domain gives the files the installed golden data gives, byte for byte (c and ts)', () => {
  const golds = Object.fromEntries(readdirSync(join(FIX, 'golden')).map((f) => [f, JSON.parse(golden(f))]));
  const pure = installed({ ...terms(), ...golds });
  const both = installed(terms(), domain());
  for (const target of ['c', 'ts']) {
    const a = installedRender(pure, target, `${pure}-out/${target}`);
    assert.equal(a.status, 0, a.stderr);
    const b = installedRender(both, target, `${both}-out/${target}`, '--with-domain', join(both, 'kinds'));
    assert.equal(b.status, 0, b.stderr);
    const files = walk(`${pure}-out/${target}`).map((p) => relative(`${pure}-out/${target}`, p)).sort();
    assert.ok(files.length > 0, `${target}: the installed golden data renders nothing`);
    assert.deepEqual(walk(`${both}-out/${target}`).map((p) => relative(`${both}-out/${target}`, p)).sort(), files);
    for (const f of files) assert.equal(readFileSync(join(`${both}-out/${target}`, f), 'utf8'), readFileSync(join(`${pure}-out/${target}`, f), 'utf8'), `${target}: ${f}`);
  }
});

test('render --installed --with-domain, sabotage: a changed x-text differs; a file both installed and rebuilt, and an owner not installed, are refused by name', () => {
  const golds = Object.fromEntries(readdirSync(join(FIX, 'golden')).map((f) => [f, JSON.parse(golden(f))]));
  const pure = installed({ ...terms(), ...golds });
  assert.equal(installedRender(pure, 'c', `${pure}-out`).status, 0);
  const changed = domain();
  changed.components.schemas.KINDS_CODES.oneOf[1]['x-text'] += ' Changed.';
  const c = installed(terms(), changed);
  assert.equal(installedRender(c, 'c', `${c}-out`, '--with-domain', join(c, 'kinds')).status, 0);
  assert.ok(existsSync(join(`${c}-out`, 'kinds_owner_vocabulary.h')), 'the render with the domain wrote no vocabulary header');
  assert.notEqual(readFileSync(join(`${c}-out`, 'kinds_owner_vocabulary.h'), 'utf8'), readFileSync(join(`${pure}-out`, 'kinds_owner_vocabulary.h'), 'utf8'));
  const twice = installed({ ...terms(), 'words.json': golds['words.json'] }, domain());
  const t = installedRender(twice, 'c', `${twice}-out`, '--with-domain', join(twice, 'kinds'));
  assert.notEqual(t.status, 0);
  assert.match(t.stderr, /kinds-owner\/words\.json/);
  const other = domain();
  other.info['x-owner'] = 'not-installed';
  const o = installed(terms(), other);
  const r = installedRender(o, 'c', `${o}-out`, '--with-domain', join(o, 'kinds'));
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /not-installed/);
});

/** The domain with one `from` of KINDS_REASONS.noAudio pointing into the domain `to` instead of omx-contract. */
function fromInto(to, item = 'KINDS_REASONS') {
  const doc = domain();
  const w = doc.components.schemas[item].oneOf.find((x) => x['x-from']);
  w['x-from'][0].$ref = `https://openmixer.org/contract/${to}#/components/schemas/KINDS_TERMS`;
  return doc;
}

test('a rebuilt word whose from reaches another package is refused by name: a rebuilt file carries no requires', () => {
  const want = /KINDS_REASONS\.oneOf\[1\]\.x-from\[0\].*plugin-db/;
  assert.throws(() => domainDataFiles('kinds', fromInto('plugin-db')), want);
  const d = withDomain(fromInto('plugin-db'));
  const r = cli('render', '--target', 'c', '--package', 'kinds-owner', '--data', join(d, 'data'), '--with-domain', join(d, 'kinds'), '--out', join(d, 'out'));
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, want);
  const i = installed(terms(), fromInto('plugin-db'));
  const ir = installedRender(i, 'c', `${i}-out`, '--with-domain', join(i, 'kinds'));
  assert.notEqual(ir.status, 0);
  assert.match(ir.stderr, want);
});

test('a rebuilt word\'s from may reach omx-contract, its own domain or its owner package; an item read at run time only may reach any', () => {
  for (const to of ['omx-contract', 'kinds', 'kinds-owner']) assert.equal(domainDataFiles('kinds', fromInto(to))['words.json'], golden('words.json'), to);
  const runtime = domain();
  runtime.components.schemas.KINDS_ADDRESS_FORMATS.oneOf[0]['x-from'] = [{ $ref: 'https://openmixer.org/contract/plugin-db#/components/schemas/KINDS_TERMS', 'x-term': 'latency' }];
  assert.deepEqual(Object.keys(domainDataFiles('kinds', runtime)).sort(), readdirSync(join(FIX, 'golden')).sort());
});
