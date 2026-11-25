// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// A domain named like a package shares its directory <contractdir>/<name>/ (docs/contract-dir.md, "Domains" and "One
// name, one directory"; ruling V16: a domain is named after the package that owns it; no schema-major level, 2026-11-25):
//  #125 it is read, never skipped: an item its package's files also declare is contract.item.duplicate, a domain named
//       like a package that does not own it is refused by name, and its items' x-since are held to its info.version;
//  #190 a floor on that name is held to the domain's info.version when the domain is installed alone (--domain only,
//       ruling %4 2026-11-23), and to the owner manifest's version when that manifest is installed beside it.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { SCHEMA_MAJOR, installedSchemaUrl, sha256 } from '../lib/contract-dir.mjs';
import { packageVersion } from '../lib/data.mjs';
import { DATA, installParamDomain, installVerbHosts, ROOT, domainOwner } from './helpers.mjs';

const SCRATCH = mkdtempSync(join(tmpdir(), 'omx-domain-named-'));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));
const SH = join(ROOT, 'tools/install-contract-dir.sh');
const CLI = join(ROOT, 'bin/omx-contract.mjs');
let n = 0;

/** The domain `owned`, version 1.0.0, owned by `owner`, holding OWNED_MODES (one word, first carried at `since`). */
const domain = (owner = 'owned', since = '1.0.0') => ({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://openmixer.org/contract/owned',
  info: { title: 'The words of the owner', version: '1.0.0', 'x-owner': owner, 'x-stability': 'experimental' },
  components: { schemas: { OWNED_MODES: { description: 'The modes.', 'x-since': since, 'x-kind': 'words', oneOf: [{ const: 'one', title: 'one', description: 'One.', 'x-code': 0 }] } } },
});

/** A contract directory holding omx-contract as `make install` writes it, and the domain `owned` given; its root. */
function contractDir(doc) {
  const root = join(SCRATCH, `cd-${n++}`);
  execFileSync('sh', [SH, '-x', 'scale-vectors.json', 'omx-contract', packageVersion(ROOT), DATA, root, 'data'], { stdio: 'ignore' });
  execFileSync('sh', [SH, '--domain', join(ROOT, 'contract.d/contract'), root, domainOwner(join(ROOT, 'contract.d/contract'))], { stdio: 'ignore' });
  installParamDomain(root);
  installVerbHosts(root);
  if (doc) writeDomain(root, doc);
  return root;
}

/** The domain document `doc` written as <root>/owned/owned.json, beside whatever the directory holds. */
function writeDomain(root, doc) {
  mkdirSync(join(root, 'owned'), { recursive: true });
  writeFileSync(join(root, 'owned/owned.json'), `${JSON.stringify(doc, null, 2)}\n`);
}

/** The classic package `owned` at `version`, its one data file declaring `item`. */
function classic(root, version, item) {
  const data = join(SCRATCH, `data-${n++}`);
  mkdirSync(data);
  writeFileSync(join(data, 'modes.json'), `${JSON.stringify({ $schema: '../schema/omx-contract.schema.json', [item]: { kind: 'words', since: '1.0.0', doc: 'The words.', words: { two: { word: 'two', doc: 'Two.' } } } }, null, 2)}\n`);
  execFileSync('sh', [SH, 'owned', version, data, root, 'data'], { stdio: 'ignore' });
}

const owner = (root, version) => execFileSync('sh', [SH, '--owner', 'owned', version, root, 'owned'], { stdio: 'ignore' });
const validate = (root, ...a) => spawnSync(process.execPath, [CLI, 'validate', '--contract-dir', root, ...a], { encoding: 'utf8' });

test('#125: an item both the package owned and the domain owned declare is contract.item.duplicate', () => {
  const root = contractDir(domain());
  classic(root, '1.0.0', 'OWNED_MODES');
  const r = validate(root);
  assert.equal(r.status, 1, `the domain is read, not skipped: ${r.stdout}`);
  assert.match(r.stderr, /contract\.item\.duplicate.*OWNED_MODES/s);
});

test('#125: the package and its own domain, distinct items, are both read', () => {
  const root = contractDir(domain());
  classic(root, '1.0.0', 'OWNED_EXTRA');
  const ok = validate(root, '--needs', 'owned@>= 1.0.0');
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /valid/);
  // the domain is in the read: a word taken from the package by the domain's x-since, above its info.version, is said
  const late = contractDir(domain('owned', '2.0.0'));
  classic(late, '1.0.0', 'OWNED_EXTRA');
  const r = validate(late);
  assert.equal(r.status, 1, r.stdout);
  assert.match(`${r.stdout}${r.stderr}`, /OWNED_MODES.*x-since 2\.0\.0 is above the document's info\.version 1\.0\.0/s);
});

test('#125: a domain named like a package it does not belong to is refused by name: two owners in one directory', () => {
  // written after the package, as no install would (install-contract-dir.sh refuses it either way, test/install-domain)
  const root = contractDir();
  classic(root, '1.0.0', 'OWNED_EXTRA');
  writeDomain(root, domain('omx-someone-else'));
  const r = validate(root);
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stderr, /contract\.manifest\.mismatch.*owned.*omx-someone-else/s);
});

test('#190: a floor on a domain named after its owner is held to the domain version alone, to the owner manifest beside it', () => {
  // the domain alone (version 1.0.0, --domain only): the floor is held to its info.version, met at 0.8.0 and 1.0.0
  const lone = contractDir(domain());
  for (const floor of ['0.8.0', '1.0.0']) {
    const r = validate(lone, '--needs', `owned@>= ${floor}`);
    assert.equal(r.status, 0, `${floor}: ${r.stderr}`);
  }
  // and not met above it: too old, naming the domain's version
  const alone = validate(lone, '--needs', 'owned@>= 1.1.0');
  assert.equal(alone.status, 1, alone.stdout);
  assert.match(alone.stderr, /contract\.package\.too-old.*owned >= 1\.1\.0.*1\.0\.0/s);
  // its owner manifest below the floor (the sabotage of an older package): too old
  const old = contractDir(domain());
  owner(old, '0.7.0');
  const r = validate(old, '--needs', 'owned@>= 0.8.0');
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stderr, /contract\.package\.too-old.*owned >= 0\.8\.0.*0\.7\.0/s);
  // at the floor: met, though the domain's own version (1.0.0) is above it and would meet 1.0.0 too
  const now = contractDir(domain());
  owner(now, '0.9.0');
  assert.equal(validate(now, '--needs', 'owned@>= 0.8.0').status, 0);
  const above = validate(now, '--needs', 'owned@>= 1.0.0');
  assert.equal(above.status, 1, 'the package is 0.9.0: a floor of 1.0.0 is not met by the domain version');
  assert.match(above.stderr, /contract\.package\.too-old/);
});

test('#199 (ruling %4 2026-11-24): a package-named directory of nested domains only, as plugin-hostd installs its tree, is read as before', () => {
  // plugin-hostd's shape: the package's MANIFEST.json in <root>/plugin-hostd/, beside clap, grouping, ... and no plugin-hostd.json
  const root = contractDir();
  classic(root, '1.0.0', 'OWNED_EXTRA');
  const src = join(SCRATCH, `src-${n++}`, 'contract.d', 'owned', 'clap');
  mkdirSync(src, { recursive: true });
  const nested = domain();
  nested.$id = 'https://openmixer.org/contract/owned/clap';
  nested.components.schemas = { OWNED_CLAP_MODES: { ...nested.components.schemas.OWNED_MODES } };
  writeFileSync(join(src, 'clap.json'), `${JSON.stringify(nested, null, 2)}\n`);
  execFileSync('sh', [SH, '--domain', src, root, domainOwner(src)], { stdio: 'ignore' });
  const r = validate(root, '--needs', 'owned@>= 1.0.0');
  assert.equal(r.status, 0, `a directory with no owned/owned.json is no package-named domain: ${r.stderr}`);
  assert.doesNotMatch(r.stderr, /contract\.manifest\.absent/);
});

/** The package `owned` hand-installed in <root>/owned/: `files` ({ rel: doc }) written and listed by a manifest of the reader's major. */
function handPackage(root, files) {
  const dir = join(root, 'owned');
  const listed = {};
  for (const [rel, doc] of Object.entries(files)) {
    mkdirSync(join(dir, rel, '..'), { recursive: true });
    const text = `${JSON.stringify({ $schema: installedSchemaUrl(SCHEMA_MAJOR), ...doc }, null, 2)}\n`;
    writeFileSync(join(dir, rel), text);
    listed[rel] = sha256(Buffer.from(text));
  }
  writeFileSync(join(dir, 'MANIFEST.json'), `${JSON.stringify({ package: 'owned', version: '1.0.0', schemaMajor: SCHEMA_MAJOR, files: listed }, null, 2)}\n`);
}
const extra = { OWNED_EXTRA: { kind: 'words', since: '1.0.0', doc: 'The words.', words: { two: { word: 'two', doc: 'Two.' } } } };

test('one name, one directory: the reader tells the package from the domain by MANIFEST.json and owned.json, and reads both', () => {
  const root = contractDir(domain());
  handPackage(root, { 'modes.json': extra });
  mkdirSync(join(root, 'owned/catalogs'));
  const r = validate(root);
  assert.equal(r.status, 0, `the package's file, the domain's document and an empty catalogs/ are told apart: ${r.stderr}`);
  // a stray file beside them is still the package's to list: the exclusion is the domain's two places only
  writeFileSync(join(root, 'owned/stray.json'), '{}\n');
  const stray = validate(root);
  assert.equal(stray.status, 1);
  assert.match(stray.stderr, /contract\.manifest\.mismatch.*owned\/stray\.json.*its manifest does not list it/s);
});

test('one name, one directory: an owner data file in a domain\'s place is refused by name (sabotage arms)', () => {
  // an owner data file named owned.json: the domain document's place
  let root = contractDir();
  handPackage(root, { 'owned.json': extra });
  let r = validate(root);
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stderr, /contract\.manifest\.mismatch.*owned\/owned\.json.*an owner data file named owned\.json: that is the place of the domain owned's document/s);
  // an owner data file under catalogs/ beside the domain document
  root = contractDir(domain());
  handPackage(root, { 'catalogs/xx.json': extra });
  r = validate(root);
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stderr, /contract\.manifest\.mismatch.*owned\/catalogs\/xx\.json.*catalogs\/ is the domain's/s);
  // positive control: catalogs/ of a package with no domain of its name is the package's own
  root = contractDir();
  handPackage(root, { 'catalogs/xx.json': extra });
  assert.doesNotMatch(validate(root).stderr, /catalogs\/ is the domain's/);
  // an owner data file inside a nested domain's directory
  root = contractDir();
  const nested = domain();
  nested.$id = 'https://openmixer.org/contract/owned/clap';
  nested.components.schemas = { OWNED_CLAP_MODES: { ...nested.components.schemas.OWNED_MODES } };
  mkdirSync(join(root, 'owned/clap'), { recursive: true });
  writeFileSync(join(root, 'owned/clap/clap.json'), `${JSON.stringify(nested, null, 2)}\n`);
  handPackage(root, { 'clap/x.json': extra });
  r = validate(root);
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stderr, /contract\.manifest\.mismatch.*owned\/clap\/x\.json.*inside the nested domain owned\/clap/s);
});

test('one name, one directory: a manifest naming another package than its directory is refused (two owners in one directory)', () => {
  const root = contractDir(domain());
  handPackage(root, { 'modes.json': extra });
  const mp = join(root, 'owned/MANIFEST.json');
  writeFileSync(mp, readFileSync(mp, 'utf8').replace('"package": "owned"', '"package": "omx-other"'));
  const r = validate(root);
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stderr, /contract\.manifest\.invalid.*names the package "omx-other", and sits in owned\//s);
});
