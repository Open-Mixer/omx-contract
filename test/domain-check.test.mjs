// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The one domain check (omx-contract#124): `omx-contract domain check <new> <committed>` refuses by name a document
// whose words moved without a version, or whose codes moved at all; `omx-contract validate` refuses an item whose
// x-since is missing, not a version, or above the document's own info.version (docs/contract-dir.md, "Domains").
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { loadContractDir } from '../lib/contract-dir.mjs';
import { ROOT } from './helpers.mjs';

const SCRATCH = mkdtempSync(join(tmpdir(), 'omx-domain-check-'));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));
let n = 0;

const cli = (...a) => spawnSync(process.execPath, [join(ROOT, 'bin/omx-contract.mjs'), ...a], { encoding: 'utf8' });
const word = (c, i) => ({ const: c, title: c, description: `The ${c}.`, 'x-code': i });

/** A domain document of the domain `pad`: two words items, versioned `version`. */
function doc(version = '1.2.0', over = {}) {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://openmixer.org/contract/pad',
    info: { title: 'The pad vocabulary', version, 'x-owner': 'omx-pad', 'x-stability': 'experimental' },
    components: {
      schemas: {
        PAD_KINDS: { description: 'The kinds.', 'x-since': '1.0.0', oneOf: [word('alpha', 0), word('beta', 1)] },
        PAD_MODES: { description: 'The modes.', 'x-since': '1.1.0', oneOf: [word('on', 0), word('off', 1)] },
        ...over,
      },
    },
  };
}

function write(d) {
  const p = join(SCRATCH, `f-${n++}.json`);
  writeFileSync(p, `${JSON.stringify(d, null, 2)}\n`);
  return p;
}

const check = (next, committed) => cli('domain', 'check', write(next), write(committed));

/** A contract directory holding `d` as pad/pad.json. */
function dirWith(d) {
  const root = join(SCRATCH, `d-${n++}`);
  mkdirSync(join(root, 'pad'), { recursive: true });
  writeFileSync(join(root, 'pad', 'pad.json'), `${JSON.stringify(d, null, 2)}\n`);
  return root;
}

test('domain check: an unchanged document passes with one PASS line', () => {
  const r = check(doc(), doc());
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim().split('\n').length, 1);
  assert.match(r.stdout, /PASS/);
});

test('domain check: a word appended with a new version passes', () => {
  const next = doc('1.3.0');
  next.components.schemas.PAD_KINDS.oneOf.push(word('gamma', 2));
  assert.equal(check(next, doc()).status, 0);
});

test('domain check: a word added at the same version is refused by domain, item and word', () => {
  const next = doc();
  next.components.schemas.PAD_KINDS.oneOf.push(word('gamma', 2));
  const r = check(next, doc());
  assert.equal(r.status, 1);
  assert.match(r.stderr, /pad.*PAD_KINDS.*gamma/);
});

test('domain check: a word removed at the same version is refused by name', () => {
  const next = doc();
  next.components.schemas.PAD_MODES.oneOf.pop();
  const r = check(next, doc());
  assert.equal(r.status, 1);
  assert.match(r.stderr, /pad.*PAD_MODES.*off/);
});

test('domain check: an item added or removed at the same version is refused by name', () => {
  const added = check(doc('1.2.0', { PAD_NEW: { description: 'New.', 'x-since': '1.2.0', oneOf: [word('x', 0)] } }), doc());
  assert.equal(added.status, 1);
  assert.match(added.stderr, /pad.*PAD_NEW/);
  const gone = doc();
  delete gone.components.schemas.PAD_MODES;
  const removed = check(gone, doc());
  assert.equal(removed.status, 1);
  assert.match(removed.stderr, /pad.*PAD_MODES/);
});

test('domain check: an item added with a new version passes', () => {
  assert.equal(check(doc('1.3.0', { PAD_NEW: { description: 'New.', 'x-since': '1.3.0', oneOf: [word('x', 0)] } }), doc()).status, 0);
});

test('domain check: a word whose x-code moved is refused at the same version and at a new one', () => {
  for (const version of ['1.2.0', '1.3.0']) {
    const next = doc(version);
    const [a, b] = next.components.schemas.PAD_KINDS.oneOf;
    next.components.schemas.PAD_KINDS.oneOf = [{ ...b, 'x-code': 0 }, { ...a, 'x-code': 1 }];
    const r = check(next, doc());
    assert.equal(r.status, 1, version);
    assert.match(r.stderr, /pad.*PAD_KINDS.*alpha/, version);
  }
});

/** `doc(version)` with PAD_KINDS three words long, and `beta` removed when `drop`: `gamma`'s code shifts from 2 to 1. */
function shifted(version, mark, drop) {
  const d = doc(version);
  const item = d.components.schemas.PAD_KINDS;
  Object.assign(item, mark);
  item.oneOf = drop ? [word('alpha', 0), word('gamma', 1)] : [word('alpha', 0), word('beta', 1), word('gamma', 2)];
  return d;
}

test('domain check: a code shift in a words item WITHOUT x-c-codes passes, the shift named (omx-contract#167)', () => {
  const r = check(shifted('1.3.0', {}, true), shifted('1.2.0', {}, false));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /pad: PAD_KINDS: gamma: x-code shifted from 2 to 1/);
  assert.match(r.stdout, /no x-c-codes/);
  assert.match(r.stdout, /PASS/);
});

test('domain check: a code shift in a words item WITH x-c-codes stays refused, naming x-c-codes', () => {
  const r = check(shifted('1.3.0', { 'x-c-codes': true }, true), shifted('1.2.0', { 'x-c-codes': true }, false));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /pad: PAD_KINDS: gamma: x-code moved from 2 to 1/);
  assert.match(r.stderr, /x-c-codes/);
  const marked = check(shifted('1.3.0', {}, true), shifted('1.2.0', { 'x-c-codes': true }, false));
  assert.equal(marked.status, 1, 'the committed item carries x-c-codes: its codes are C constants');
});

test('domain check: a shift is no exemption from the version: a word removed at the same version is still refused', () => {
  const r = check(shifted('1.2.0', {}, true), shifted('1.2.0', {}, false));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /pad.*PAD_KINDS.*beta.*word removed/);
});

test('domain check: one line per problem', () => {
  const next = doc();
  next.components.schemas.PAD_KINDS.oneOf.push(word('gamma', 2));
  next.components.schemas.PAD_MODES.oneOf.pop();
  const lines = check(next, doc()).stderr.trim().split('\n');
  assert.equal(lines.length, 2);
});

test('domain check: an info.version going down is refused', () => {
  const r = check(doc('1.1.0'), doc());
  assert.equal(r.status, 1);
  assert.match(r.stderr, /pad.*1\.1\.0.*1\.2\.0/);
});

test('domain check: a usage error exits 2', () => {
  assert.equal(cli('domain').status, 2);
  assert.equal(cli('domain', 'check', write(doc())).status, 2);
  assert.equal(cli('domain', 'verify', write(doc()), write(doc())).status, 2);
});

test('validate: a domain whose items carry an x-since up to its version is valid', () => {
  const r = cli('validate', '--contract-dir', dirWith(doc()));
  assert.equal(r.status, 0, r.stderr);
});

test('validate: an item with no x-since is refused by name', () => {
  const d = doc();
  delete d.components.schemas.PAD_MODES['x-since'];
  const r = cli('validate', '--contract-dir', dirWith(d));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /PAD_MODES.*x-since/);
});

test('validate: an x-since that is not MAJOR.MINOR.PATCH is refused by name', () => {
  for (const bad of ['1.0', 'v1.0.0', '1.0.0-rc1', 3, '']) {
    const d = doc();
    d.components.schemas.PAD_KINDS['x-since'] = bad;
    const r = cli('validate', '--contract-dir', dirWith(d));
    assert.equal(r.status, 1, String(bad));
    assert.match(r.stderr, /PAD_KINDS.*since/, String(bad));
  }
});

test('validate: an x-since above the info.version is refused by name', () => {
  const d = doc('1.2.0');
  d.components.schemas.PAD_MODES['x-since'] = '1.3.0';
  const r = cli('validate', '--contract-dir', dirWith(d));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /PAD_MODES.*1\.3\.0.*1\.2\.0/);
});

test('validate: every bad item is one line, naming file, item and rule', () => {
  const d = doc('1.2.0');
  delete d.components.schemas.PAD_KINDS['x-since'];
  d.components.schemas.PAD_MODES['x-since'] = '1.3.0';
  const r = cli('validate', '--contract-dir', dirWith(d));
  assert.equal(r.status, 1);
  const lines = r.stderr.trim().split('\n');
  assert.equal(lines.length, 2);
  assert.match(lines[0], /pad\/pad\.json: PAD_KINDS: domain-x-since/);
  assert.match(lines[1], /pad\/pad\.json: PAD_MODES: domain-x-since/);
});

test('the reader opens a document whose x-since is above its info.version: only validate refuses it', () => {
  const d = doc('1.2.0');
  d.components.schemas.PAD_MODES['x-since'] = '9.0.0';
  delete d.components.schemas.PAD_KINDS['x-since'];
  assert.ok(loadContractDir({ dir: dirWith(d) }).packages.has('pad'));
});
