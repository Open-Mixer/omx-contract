// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The roleMeanings kind (docs/contract-dir.md "A package's role meanings"): a package declares the panel roles it
// draws and the meaning each plays by a file in its own directory, with no change to omx-contract. The fixture package
// (test/fixtures/package-role-meanings/) is installed beside omx-contract's data/ the way an owner's release installs
// it, read back, and broken once per refusal: a meaning off the contract's list, a role with no meaning stated, one
// role declared twice.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { CONTRACT_CODES, ContractRefusal } from '../lib/codes.mjs';
import { SCHEMA_MAJOR, loadContractDir } from '../lib/contract-dir.mjs';
import { loadData, packageVersion } from '../lib/data.mjs';
import { meaningOfRoles } from '../lib/role-meanings.mjs';
import { classify } from '../lib/semver.mjs';
import { SCHEMA_VERSION, validateData } from '../lib/validate.mjs';
import { DATA, ROOT, texts } from './helpers.mjs';

const SCRATCH = mkdtempSync(join(tmpdir(), 'omx-contract-roles-'));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));
let n = 0;
const FIXTURE = join(ROOT, 'test/fixtures/package-role-meanings');
const PKG = 'roles-fixture';
const SCHEMA = JSON.parse(readFileSync(join(ROOT, 'schema/omx-contract.schema.json'), 'utf8'));

const install = (pkg, from, root) => execFileSync('sh', [join(ROOT, 'tools/install-contract-dir.sh'), pkg, '1.0.0', String(SCHEMA_MAJOR), from, root, 'data'], { stdio: 'ignore' });

/** omx-contract's own directory and the packages `pkgs` ({ name: dir }) installed beside it. */
function dirWith(pkgs) {
  const root = join(SCRATCH, `cd-${n++}`);
  execFileSync('sh', [join(ROOT, 'tools/install-contract-dir.sh'), '-x', 'codes.json', '-x', 'scale-vectors.json', 'omx-contract', packageVersion(ROOT), String(SCHEMA_MAJOR), DATA, root, 'data'], { stdio: 'ignore' });
  for (const [pkg, from] of Object.entries(pkgs)) install(pkg, from, root);
  return root;
}

/** A copy of the fixture with `edit(doc)` applied to its file. */
function fixtureWith(edit) {
  const dir = join(SCRATCH, `fx-${n++}`);
  cpSync(FIXTURE, dir, { recursive: true });
  const [f] = readdirSync(dir);
  const doc = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  edit(doc.ROLE_FIXTURE_ROLE_MEANINGS.roles, doc);
  writeFileSync(join(dir, f), `${JSON.stringify(doc, null, 2)}\n`);
  return dir;
}

function refusalOf(root) {
  try {
    loadContractDir({ dir: root });
  } catch (e) {
    assert.ok(e instanceof ContractRefusal, `a refusal, not ${e.message}`);
    return e;
  }
  assert.fail('the read was not refused');
}

test('the fixture installs into a contract directory and reads back: every role with its meaning, the renamed, the same-named and the ones that play none', () => {
  const data = loadContractDir({ dir: dirWith({ [PKG]: FIXTURE }) });
  const m = meaningOfRoles(data.items);
  assert.equal(m.get('mix'), 'wetDryRatio');
  assert.equal(m.get('time'), 'delay');
  assert.equal(m.get('hpf_freq'), 'lowCut');
  assert.equal(m.get('threshold'), 'threshold', 'a role whose name is a meaning is a row of its own');
  assert.equal(m.get('band_type'), 'unknown', 'a role that plays no meaning says so');
  assert.equal(m.get('knee_start'), undefined, 'a role no package declares has no meaning: a reader never falls back to its name');
});

test('every meaning the fixture names is a word of the contract\'s closed list', () => {
  const list = SCHEMA.$defs.meaning.enum;
  const doc = JSON.parse(readFileSync(join(FIXTURE, 'role-meanings.json'), 'utf8'));
  for (const r of Object.values(doc.ROLE_FIXTURE_ROLE_MEANINGS.roles)) assert.ok(list.includes(r.meaning), `${r.role}: ${r.meaning}`);
});

test('the fixture states the schema floor this reader reads', () => {
  const doc = JSON.parse(readFileSync(join(FIXTURE, 'role-meanings.json'), 'utf8'));
  assert.equal(doc.requires['omx-contract-schema'], `>= ${SCHEMA_VERSION}`);
});

test('a meaning off the contract\'s list is refused, and so is a row that states none', () => {
  const off = refusalOf(dirWith({ [PKG]: fixtureWith((r) => { r.mix.meaning = 'wetness'; }) }));
  assert.match(off.message, /mix|meaning|wetness/);
  const none = refusalOf(dirWith({ [PKG]: fixtureWith((r) => { delete r.time.meaning; }) }));
  assert.match(none.message, /meaning/);
});

test('a role declared by two packages is refused: contract.role.duplicate (one owner)', () => {
  const other = fixtureWith((roles, doc) => {
    doc.OTHER_ROLE_MEANINGS = { ...doc.ROLE_FIXTURE_ROLE_MEANINGS, roles: { mix: roles.mix } };
    delete doc.ROLE_FIXTURE_ROLE_MEANINGS;
  });
  const e = refusalOf(dirWith({ 'other-plugins': other, [PKG]: FIXTURE }));
  assert.equal(e.code, CONTRACT_CODES.roleDuplicate);
  assert.match(e.message, /mix: already declared by OTHER_ROLE_MEANINGS\.mix \(other-plugins\), and again by roles-fixture: a role has one owner/);
});

test('validate refuses the same in a data directory, under its rule', () => {
  const doc = JSON.parse(readFileSync(join(FIXTURE, 'role-meanings.json'), 'utf8'));
  const read = (edit) => {
    const t = texts();
    const d = JSON.parse(JSON.stringify(doc));
    edit(d.ROLE_FIXTURE_ROLE_MEANINGS.roles, d);
    t['data/fixture-role-meanings.json'] = JSON.stringify(d);
    return validateData(loadData(null, t)).map((p) => p.rule);
  };
  assert.deepEqual(read(() => {}), []);
  assert.deepEqual(read((r) => { r.again = r.mix; }), ['role-duplicate']);
});

test('semver: a role added is MINOR; a role removed or playing another meaning is MAJOR', () => {
  const item = (roles) => new Map([['R', { kind: 'roleMeanings', doc: 'd', value: roles }]]);
  const base = { mix: { role: 'mix', meaning: 'wetDryRatio' } };
  assert.equal(classify(item(base), item({ ...base, time: { role: 'time', meaning: 'delay' } })).level, 'minor');
  assert.equal(classify(item(base), item({})).level, 'major');
  assert.equal(classify(item(base), item({ mix: { role: 'mix', meaning: 'gain' } })).level, 'major');
});
