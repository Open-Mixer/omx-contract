// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The kinds a domain rebuilds into data files (docs/render.md, `render --with-domain`; docs/contract-dir.md,
// "Domains"): a word's stored `x-args`, the `words` kind and the `scalar` kind. The fixture test/fixtures/domain-kinds
// holds one domain (kinds/kinds.json, with a catalog in a second language), the data files it must rebuild byte for
// byte (golden/) and the terms its words are taken from (data/terms.json). The codes and sheet kinds of before are
// held to their golden files too, so the new kinds change nothing for them. An item with no `x-file` is read at run
// time only: it is not rebuilt, and not refused. The same rebuild serves a render of an installed contract directory
// (`render --installed --with-domain`), and the runtime reader serves the scalars (the C loader likewise, test/c).
// A domain's `info.x-requires` declares the packages its rebuilt words take terms from, by name, no version (the devel wave 2026-11-24):
// each rebuilt file carries them in its `requires` (golden-requires/), and a render of an installed contract directory
// holds the declared package to be installed (two packages: kinds-owner and kinds-terms).
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
import { ROOT, provenanceNaming, provenanceTo } from './helpers.mjs';

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

/** A contract directory: the domain `doc` (and its catalog), and beside it its owner package kinds-owner holding the terms its words are taken from (the package the words' x-from names). */
function contractDir(doc) {
  const root = join(SCRATCH, `cd-${n++}`);
  mkdirSync(join(root, 'kinds', 'catalogs'), { recursive: true });
  writeFileSync(join(root, 'kinds', 'kinds.json'), `${JSON.stringify(doc, null, 2)}\n`);
  cpSync(join(FIX, 'kinds/catalogs/ca.json'), join(root, 'kinds', 'catalogs', 'ca.json'));
  const pkg = join(root, 'kinds-owner');
  mkdirSync(pkg, { recursive: true });
  const terms = JSON.parse(readFileSync(join(FIX, 'data/terms.json'), 'utf8'));
  const text = `${JSON.stringify({ $schema: installedSchemaUrl(SCHEMA_MAJOR), ...terms }, null, 2)}\n`;
  writeFileSync(join(pkg, 'terms.json'), text);
  writeFileSync(join(pkg, 'MANIFEST.json'), `${JSON.stringify({ package: 'kinds-owner', version: '1.2.0', schemaMajor: SCHEMA_MAJOR, files: { 'terms.json': sha256(Buffer.from(text)) } }, null, 2)}\n`);
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

test('render --data --with-domain gives the files the golden data gives, byte for byte but for the provenance, which names the domain document (c and ts, omx-contract#241)', () => {
  const pure = join(SCRATCH, `pure-${n++}`);
  cpSync(join(FIX, 'data'), join(pure, 'data'), { recursive: true });
  cpSync(join(FIX, 'golden'), join(pure, 'data'), { recursive: true });
  const both = withDomain(domain());
  // the files the domain rebuilds, as the golden data names them, and the document they come from
  const rebuilt = readdirSync(join(FIX, 'golden')).map((f) => `data/${f}`);
  const doc = 'contract.d/kinds/kinds.json';
  let named = 0;
  for (const target of ['c', 'ts']) {
    const a = cli('render', '--target', target, '--package', 'kinds-owner', '--data', join(pure, 'data'), '--out', join(pure, `out-${target}`));
    assert.equal(a.status, 0, a.stderr);
    const b = cli('render', '--target', target, '--package', 'kinds-owner', '--data', join(both, 'data'), '--with-domain', join(both, 'kinds'), '--out', join(both, `out-${target}`));
    assert.equal(b.status, 0, b.stderr);
    const files = walk(join(pure, `out-${target}`)).map((p) => relative(join(pure, `out-${target}`), p)).sort();
    assert.ok(files.length > 0, `${target}: the golden data renders nothing`);
    assert.deepEqual(walk(join(both, `out-${target}`)).map((p) => relative(join(both, `out-${target}`), p)).sort(), files);
    for (const f of files) {
      const got = readFileSync(join(both, `out-${target}`, f), 'utf8');
      assert.equal(got, provenanceTo(readFileSync(join(pure, `out-${target}`, f), 'utf8'), rebuilt, doc), `${target}: ${f}`);
      assert.deepEqual(provenanceNaming(got, rebuilt), [], `${target}: ${f} names a data/<x-file>, a path that exists nowhere`);
      named += provenanceNaming(got, [doc]).length;
    }
  }
  assert.ok(named > 0, `no provenance line names ${doc}`);
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
  assert.deepEqual(d.scalar('KINDS_DIGEST_HEX_LEN'), { value: 64, unit: 'none' });
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
  const pkg = join(root, 'kinds-owner');
  mkdirSync(pkg, { recursive: true });
  const hashes = {};
  for (const [rel, d] of Object.entries(files)) {
    const text = `${JSON.stringify({ $schema: installedSchemaUrl(SCHEMA_MAJOR), ...d }, null, 2)}\n`;
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
/** A render with each item's provenance (`/* NAME (<path>) *\/`, `@see <path>`) left out: the two forms' sources differ by rule. */
const unsourced = (t) => t.replace(/^\/\* ([A-Z][A-Z0-9_]*) \([^)]*\) \*\/$/gm, '/* $1 */').replace(/^( \* @see) \S+$/gm, '$1');
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
    // byte for byte but the provenance: a domain item's banner names its domain's document, the data form its file
    for (const f of files) {
      const dom = readFileSync(join(`${both}-out/${target}`, f), 'utf8');
      assert.equal(unsourced(dom), unsourced(readFileSync(join(`${pure}-out/${target}`, f), 'utf8')), `${target}: ${f}`);
      assert.ok(!/(?:\(|@see )kinds-owner\/(?:constants|plain|refusals|words)\.json/.test(dom), `${target}: ${f} names a rebuilt data path as a domain item's source`);
      if (/KINDS_CODES/.test(dom)) assert.match(dom, /contract\.d\/kinds\/kinds\.json/, `${target}: ${f}: a domain item's source is its domain's document`);
    }
  }
});

test('render --installed --with-domain: a ts module framed by the root x-render names the domain document in its GENERATED line, never data/<x-file> (omx-contract#218)', () => {
  const doc = domain();
  doc['x-render'] = { ...doc['x-render'], ts: { module: 'kinds-constants' } };
  const root = installed(terms(), doc);
  // the owner's tree is data/, as omx-clap's is: the rebuild writes the root's x-file to data/constants.json
  const manifest = join(root, 'kinds-owner', 'MANIFEST.json');
  writeFileSync(manifest, `${JSON.stringify({ ...JSON.parse(readFileSync(manifest, 'utf8')), tree: 'data' }, null, 2)}\n`);
  const r = installedRender(root, 'ts', `${root}-out`, '--with-domain', join(root, 'kinds'));
  assert.equal(r.status, 0, r.stderr);
  for (const f of ['kinds-constants.js', 'kinds-constants.d.ts']) {
    const text = readFileSync(join(`${root}-out`, f), 'utf8');
    const generated = text.split('\n').find((l) => l.startsWith('// GENERATED'));
    assert.equal(generated, '// GENERATED by `omx-contract render --target ts --package kinds-owner` from kinds-owner\'s contract.d/kinds/kinds.json, do not edit.', f);
    assert.ok(!text.includes('data/constants.json'), `${f} names data/<x-file>, a path that exists nowhere`);
    assert.match(text, /^ \* @see contract\.d\/kinds\/kinds\.json$/m, `${f}: the items name the same document`);
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

test('a rebuilt word whose from reaches a package its domain does not declare in info.x-requires is refused by name', () => {
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

test('a rebuilt word\'s from may reach omx-contract, its own domain or its owner package; the rebuild does not check an item read at run time only (the read of a contract directory does)', () => {
  for (const to of ['omx-contract', 'kinds', 'kinds-owner']) assert.equal(domainDataFiles('kinds', fromInto(to))['words.json'], golden('words.json'), to);
  const runtime = domain();
  runtime.components.schemas.KINDS_ADDRESS_FORMATS.oneOf[0]['x-from'] = [{ $ref: 'https://openmixer.org/contract/plugin-db#/components/schemas/KINDS_TERMS', 'x-term': 'latency' }];
  assert.deepEqual(Object.keys(domainDataFiles('kinds', runtime)).sort(), readdirSync(join(FIX, 'golden')).sort());
});

const GOLDEN_REQ = join(FIX, 'golden-requires');
const goldenReq = (f) => readFileSync(join(GOLDEN_REQ, f), 'utf8');

/** The domain with every from of its words pointing into the package kinds-terms, declared in x-requires by `names` (none when undefined). */
function declared(names = ['kinds-terms']) {
  const doc = domain();
  if (names !== undefined) doc.info['x-requires'] = names;
  for (const s of Object.values(doc.components.schemas)) for (const e of s.oneOf ?? []) for (const r of e['x-from'] ?? []) r.$ref = 'https://openmixer.org/contract/kinds-terms#/components/schemas/KINDS_TERMS';
  return doc;
}

test('x-requires: every file a domain rebuilds carries its requires, the declared names, byte for byte (golden)', () => {
  const files = domainDataFiles('kinds', declared());
  assert.deepEqual(Object.keys(files).sort(), readdirSync(GOLDEN_REQ).sort());
  for (const [f, text] of Object.entries(files)) assert.equal(text, goldenReq(f), f);
  // a domain with no x-requires still rebuilds its files with no requires, byte for byte
  for (const [f, text] of Object.entries(domainDataFiles('kinds', domain()))) assert.equal(text, golden(f), f);
});

test('x-requires, sabotage: drop the declared package and the rebuilt word is refused, naming the package and the word', () => {
  const doc = declared();
  doc.info['x-requires'] = ['kinds-other'];
  const want = /KINDS_REASONS\.oneOf\[\d+\]\.x-from\[0\] of the word "[a-z-]+".*kinds-terms/;
  assert.throws(() => domainDataFiles('kinds', doc), want);
  delete doc.info['x-requires'];
  assert.throws(() => domainDataFiles('kinds', doc), want);
  const d = withDomain(doc);
  const r = cli('render', '--target', 'c', '--package', 'kinds-owner', '--data', join(d, 'data'), '--with-domain', join(d, 'kinds'), '--out', join(d, 'out'));
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, want);
});

/** A file a package installs besides the terms, so that a package is never empty: one code of its own. */
const extra = (item) => ({ 'extra.json': { [item]: { kind: 'codes', since: '1.0.0', doc: 'A code the package installs itself.', codes: { extraOne: { code: `${item.toLowerCase().replace(/_/g, '.')}.one` } } } } });

/**
 * A contract directory with two packages: kinds-owner (`owner`, each `{ rel: doc }`, and a file of its own) and,
 * unless `termsVersion` is null, kinds-terms at that version holding `termFiles` (the terms) and a file of its own;
 * the domain `doc` when given.
 */
function twoPackages(owner, termsVersion, doc, termFiles = terms()) {
  const root = installed({ ...extra('KINDS_OWNER_EXTRA'), ...owner }, doc);
  if (termsVersion === null) return root;
  const pkg = join(root, 'kinds-terms');
  mkdirSync(pkg, { recursive: true });
  const hashes = {};
  for (const [rel, d] of Object.entries({ ...extra('KINDS_TERMS_EXTRA'), ...termFiles })) {
    const text = `${JSON.stringify({ $schema: installedSchemaUrl(SCHEMA_MAJOR), ...d }, null, 2)}\n`;
    writeFileSync(join(pkg, rel), text);
    hashes[rel] = sha256(Buffer.from(text));
  }
  writeFileSync(join(pkg, 'MANIFEST.json'), `${JSON.stringify({ package: 'kinds-terms', version: termsVersion, schemaMajor: SCHEMA_MAJOR, files: hashes }, null, 2)}\n`);
  return root;
}

test('x-requires, two packages: render --installed --with-domain takes the declared terms and gives the installed golden render, byte for byte', () => {
  const golds = Object.fromEntries(readdirSync(GOLDEN_REQ).map((f) => [f, JSON.parse(goldenReq(f))]));
  const pure = twoPackages(golds, '1.0.0');
  const both = twoPackages({}, '1.0.0', declared());
  for (const target of ['c', 'ts']) {
    const a = installedRender(pure, target, `${pure}-out/${target}`);
    assert.equal(a.status, 0, a.stderr);
    const b = installedRender(both, target, `${both}-out/${target}`, '--with-domain', join(both, 'kinds'));
    assert.equal(b.status, 0, b.stderr);
    const files = walk(`${pure}-out/${target}`).map((p) => relative(`${pure}-out/${target}`, p)).sort();
    assert.ok(files.length > 0);
    assert.deepEqual(walk(`${both}-out/${target}`).map((p) => relative(`${both}-out/${target}`, p)).sort(), files);
    // byte for byte but the provenance: a domain item's banner names its domain's document, the data form its file
    for (const f of files) {
      const dom = readFileSync(join(`${both}-out/${target}`, f), 'utf8');
      assert.equal(unsourced(dom), unsourced(readFileSync(join(`${pure}-out/${target}`, f), 'utf8')), `${target}: ${f}`);
      assert.ok(!/(?:\(|@see )kinds-owner\/(?:constants|plain|refusals|words)\.json/.test(dom), `${target}: ${f} names a rebuilt data path as a domain item's source`);
      if (/KINDS_CODES/.test(dom)) assert.match(dom, /contract\.d\/kinds\/kinds\.json/, `${target}: ${f}: a domain item's source is its domain's document`);
    }
  }
  // any installed version is taken: no floor (the devel wave 2026-11-24)
  const newer = twoPackages({}, '1.4.0', declared());
  const n2 = installedRender(newer, 'c', `${newer}-out`, '--with-domain', join(newer, 'kinds'));
  assert.equal(n2.status, 0, n2.stderr);
});

test('x-requires, two packages: a declared package absent is refused by name; a declared term another package holds is refused by name', () => {
  const absent = twoPackages({}, null, declared());
  const a = installedRender(absent, 'c', `${absent}-out`, '--with-domain', join(absent, 'kinds'));
  assert.notEqual(a.status, 0);
  assert.match(a.stderr, /contract\.package\.absent/);
  assert.match(a.stderr, /kinds-terms/);
  // the terms installed by kinds-owner, not by kinds-terms, which the words name
  const elsewhere = twoPackages(terms(), '1.0.0', declared(), {});
  const e = installedRender(elsewhere, 'c', `${elsewhere}-out`, '--with-domain', join(elsewhere, 'kinds'));
  assert.notEqual(e.status, 0);
  assert.match(e.stderr, /contract\.ref\.undeclared/);
  assert.match(e.stderr, /KINDS_TERMS.*kinds-terms|kinds-terms.*KINDS_TERMS/);
});

test('x-requires: an installed domain (not rebuilt) is held to its declared names too', () => {
  const ok = twoPackages({}, '1.0.0', declared());
  const o = cli('validate', '--contract-dir', ok);
  assert.equal(o.status, 0, o.stderr);
  const absent = twoPackages({}, null, declared());
  const v = cli('validate', '--contract-dir', absent);
  assert.notEqual(v.status, 0);
  assert.match(v.stderr, /contract\.package\.absent.*kinds-terms|kinds-terms.*contract\.package\.absent/s);
});

const BAD_REQUIRES = {
  // red-first arm of the devel wave 2026-11-24: the map of floors, the form before it, is refused by name
  'a map of floors': [{ 'kinds-terms': '>= 1.0.0' }, /x-requires.*map of version floors/],
  'an empty list': [[], /x-requires.*empty list/],
  'a name that is no package name': [['Kinds Terms'], /x-requires.*Kinds Terms/],
  'names out of order': [['kinds-terms', 'kinds-other'], /x-requires.*ascending order/],
  'a string, not a list': ['kinds-terms', /x-requires/],
};
for (const [what, [value, name]] of Object.entries(BAD_REQUIRES)) {
  test(`x-requires refused by name: ${what}`, () => {
    const doc = declared();
    doc.info['x-requires'] = value;
    const v = cli('validate', '--contract-dir', twoPackages({}, '1.0.0', doc));
    assert.notEqual(v.status, 0);
    assert.match(v.stderr, /contract\.manifest\.invalid/);
    assert.match(v.stderr, name);
    const d = withDomain(doc);
    const r = cli('render', '--target', 'c', '--package', 'kinds-owner', '--data', join(d, 'data'), '--with-domain', join(d, 'kinds'), '--out', join(d, 'out'));
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, name);
    assert.throws(() => openDomainAt(twoPackages({}, '1.0.0', doc), 'kinds'), name);
  });
}

test('x-requires refused by name: an unknown key of info (x-require)', () => {
  const doc = declared(undefined);
  doc.info['x-require'] = ['kinds-terms'];
  const v = cli('validate', '--contract-dir', twoPackages({}, '1.0.0', doc));
  assert.notEqual(v.status, 0);
  assert.match(v.stderr, /x-require/);
});

test('the domain schema takes info.x-requires, a list of names, and refuses a map of floors, an empty list or a bad name', () => {
  const schema = JSON.parse(readFileSync(join(ROOT, 'schema/domain.schema.json'), 'utf8'));
  const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  assert.ok(validate(declared()), JSON.stringify(validate.errors));
  // the order is the readers' to hold (a schema states no order)
  for (const [what, [value]] of Object.entries(BAD_REQUIRES).filter(([w]) => w !== 'names out of order')) {
    const doc = declared();
    doc.info['x-requires'] = value;
    assert.equal(validate(doc), false, what);
  }
});
