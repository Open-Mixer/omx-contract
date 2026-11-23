// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// A domain named like a package under 3/ (docs/contract-dir.md, "Domains"; ruling V16: a domain is named after the
// package that owns it):
//  #125 it is read, never skipped: an item its package's files also declare is contract.item.duplicate, a domain named
//       like a package that does not own it is refused by name, and its items' x-since are held to its info.version;
//  #190 a floor on that name is the package's: held to the owner manifest's version, never met by the domain's own
//       info.version, and refused (contract.package.absent) when the domain is installed without its owner manifest.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { SCHEMA_MAJOR } from '../lib/contract-dir.mjs';
import { packageVersion } from '../lib/data.mjs';
import { DATA, installParamDomain, installVerbHosts, ROOT } from './helpers.mjs';

const SCRATCH = mkdtempSync(join(tmpdir(), 'omx-domain-named-'));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));
const SH = join(ROOT, 'tools/install-contract-dir.sh');
const CLI = join(ROOT, 'bin/omx-contract.mjs');
const MAJOR = String(SCHEMA_MAJOR);
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
  execFileSync('sh', [SH, '-x', 'scale-vectors.json', 'omx-contract', packageVersion(ROOT), MAJOR, DATA, root, 'data'], { stdio: 'ignore' });
  execFileSync('sh', [SH, '--domain', join(ROOT, 'contract.d/contract'), root], { stdio: 'ignore' });
  installParamDomain(root);
  installVerbHosts(root);
  if (doc) {
    mkdirSync(join(root, 'owned'));
    writeFileSync(join(root, 'owned/owned.json'), `${JSON.stringify(doc, null, 2)}\n`);
  }
  return root;
}

/** The classic package `owned` at `version`, its one data file declaring `item`. */
function classic(root, version, item) {
  const data = join(SCRATCH, `data-${n++}`);
  mkdirSync(data);
  writeFileSync(join(data, 'owned.json'), `${JSON.stringify({ $schema: '../schema/omx-contract.schema.json', requires: { 'omx-contract-schema': '>= 3.0.0' }, [item]: { kind: 'words', since: '1.0.0', doc: 'The words.', words: { two: { word: 'two', doc: 'Two.' } } } }, null, 2)}\n`);
  execFileSync('sh', [SH, 'owned', version, MAJOR, data, root, 'data'], { stdio: 'ignore' });
}

const owner = (root, version) => execFileSync('sh', [SH, '--owner', 'owned', version, MAJOR, root, 'owned'], { stdio: 'ignore' });
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

test('#125: a domain named like a package it does not belong to is refused by name', () => {
  const root = contractDir(domain('omx-someone-else'));
  classic(root, '1.0.0', 'OWNED_EXTRA');
  const r = validate(root);
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stderr, /contract\.manifest\.mismatch.*owned.*omx-someone-else/s);
});

test('#190: a floor on a domain named after its owner is held to the owner manifest, never to the domain version', () => {
  // the domain alone (version 1.0.0): a floor 0.8.0 on its owner is not met by the domain's own version
  const alone = validate(contractDir(domain()), '--needs', 'owned@>= 0.8.0');
  assert.equal(alone.status, 1, alone.stdout);
  assert.match(alone.stderr, /contract\.package\.absent.*owned >= 0\.8\.0/s);
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
