// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { packageVersion } from '../lib/data.mjs';
import { ROOT } from './helpers.mjs';

const read = (p) => readFileSync(join(ROOT, p), 'utf8');

// A branch holds the next release's code at the last release's version, and the schema's version moves with the schema,
// so it may name any minor past the last release (several unreleased bumps stack on one branch: 3.10.0 and 3.11.0 over
// a package at 3.9.1) and no patch or major; the release gate (semver against the last tag) then holds the package to
// at least that bump
const schemaFits = (schema, v) => {
  const [sa, si, sp] = schema.split('.').map(Number);
  const [va, vi] = v.split('.').map(Number);
  const n = (x) => x.split('.').map(Number).reduce((a, b) => a * 1000 + b, 0);
  return n(schema) <= n(v) || (sa === va && si > vi && sp === 0);
};

test('versions: what the schema may state against the package', () => {
  for (const [schema, v, want] of [['3.7.0', '3.8.0', true], ['3.8.0', '3.8.0', true], ['3.9.0', '3.8.0', true], ['3.9.0', '3.9.0', true],
    ['3.10.0', '3.8.0', true], ['3.9.1', '3.8.0', false], ['4.0.0', '3.8.0', false]]) assert.equal(schemaFits(schema, v), want, `${schema} against ${v}`);
});

test('versions: the schema is no newer than the next release, and nothing shipped states a schema floor (the devel wave 2026-11-24)', () => {
  const v = packageVersion(ROOT);
  const schema = JSON.parse(read('schema/omx-contract.schema.json'))['x-omx-schema-version'];
  assert.ok(schemaFits(schema, v), `x-omx-schema-version ${schema} is past the next release of the package ${v}`);
  const seen = [];
  const walk = (d) => {
    for (const f of readdirSync(join(ROOT, d), { withFileTypes: true })) {
      if (f.isDirectory()) walk(join(d, f.name));
      else if (f.name.endsWith('.json')) {
        seen.push(join(d, f.name));
        const req = JSON.parse(read(join(d, f.name))).requires;
        assert.ok(req === undefined || Array.isArray(req), `${join(d, f.name)} states requires as a map of floors`);
      }
    }
  };
  walk('data');
  walk('examples/descriptors');
  assert.ok(seen.length > 0, 'positive control: the walk reads files');
});

test('versions: package.json, the RPM spec and the debian changelog name one version', () => {
  const v = packageVersion(ROOT);
  assert.equal(/^Version: (\S+)$/m.exec(read('packaging/omx-contract.spec'))[1], v);
  assert.equal(/^omx-contract \(([^)]+)\)/.exec(read('debian/changelog'))[1], v);
  assert.equal(JSON.parse(read('share/omx-contract/omx-contract.json')).version, v);
  assert.equal(JSON.parse(read('package-lock.json')).version, v);
  assert.match(read('packaging/omx-contract.spec'), new RegExp(`^%changelog\\n\\* .* - ${v.replace(/\./g, '\\.')}-1$`, 'm'));
});

// lintian refuses a release dated no later than the one before it (latest-changelog-entry-without-new-date):
// 1.2.0 shipped dated as 1.1.0 and its four deb builds failed at release time
test('versions: the newest debian/changelog entry is dated strictly after the one before it', () => {
  const [newest, previous] = [...read('debian/changelog').matchAll(/^ -- .*>  (.+)$/gm)].map((m) => ({ text: m[1], at: Date.parse(m[1]) }));
  assert.ok(newest && previous, 'debian/changelog has at least two entries');
  assert.ok(!Number.isNaN(newest.at) && !Number.isNaN(previous.at), 'both dates parse');
  assert.ok(newest.at > previous.at,
    `debian/changelog: the newest entry (${newest.text}) is not dated after the one before it (${previous.text})`);
});

test('versions: npm publishes from publish.yml, by OIDC with no token', () => {
  // npmjs.com's trusted publisher names exactly these: Open-Mixer/omx-contract, publish.yml, no environment
  const y = read('.github/workflows/publish.yml');
  // the repository guard first (a copy of this tree never reaches npm), then the promotion's conditions (release-promote.test.mjs)
  assert.match(y, /\n {2}publish:\n(?: {4}#.*\n)* {4}if: >-\n {6}github\.repository == '[A-Za-z0-9-]+\/omx-contract' && /);
  assert.doesNotMatch(y, /\n {4}environment:/);  // npm's entry names none: a named one would not match it
  assert.match(y, /\n {4}permissions:\n {6}contents: read\n {6}actions: read\n {6}id-token: write\n/);  // job-level, not workflow-level; actions: read for the promotion gate
  assert.match(y, /npm publish --provenance --access public/);
  assert.doesNotMatch(y, /NPM_TOKEN|NODE_AUTH_TOKEN/);
  // release.yml no longer publishes to npm: one publisher, the one npmjs.com trusts
  assert.doesNotMatch(read('.github/workflows/release.yml'), /npm publish/);
});

// A consumer names the contract with no version and builds against the release installed beside it (the devel wave 2026-11-24: no
// hand-kept floor); a package description that says it pins an exact version, or a floor, describes a rule no
// consumer keeps (FreeMixer/omx-contract#108).
// Which file lands in which package, the architecture of each, what the command needs (node, with no version) and
// recommends (pkg-config), and that the build gave exactly the declared packages are held on the BUILT packages by
// tools/package-files.sh in CI (test audit omx-contract row 16: the spec and control were read here as text a second
// time). What a built package cannot show stays here: release.yml builds every package the spec and control declare.
test('release: release.yml builds every RPM the spec declares and every DEB the control declares', () => {
  const control = read('debian/control');
  const debs = [...control.matchAll(/^Package: (\S+)$/gm)].map((m) => m[1]);
  assert.ok(debs.includes('omx-contract') && debs.includes('omx-contract-data'), 'positive control: the control is read');
  const names = (job) => /binary-names: (.+)$/m.exec(read('.github/workflows/release.yml').split(`\n  ${job}:\n`)[1])[1].trim().split(/\s+/).sort();
  assert.deepEqual(names('deb'), debs.sort(), 'the release builds every DEB the control declares');
  const packs = JSON.parse(read('share/omx-contract/languages.json')).languages.map((l) => `omx-contract-langpack-${l}`);
  assert.deepEqual(names('rpm'), ['libomx-domain', 'libomx-domain-devel', 'omx-contract', 'omx-contract-data', 'omx-contract-devel', 'python3-omx-contract', ...packs].sort(), 'the release builds every RPM the spec declares');
});

// What the packages list, `make install` must put there: the deb's *.install is read against the staged tree (a file
// listed and never copied fails dh_install and rpmbuild only in the release build, 3.14.0).
test('packaging: make install stages every file the data package lists', () => {
  const stage = mkdtempSync(join(tmpdir(), 'omx-contract-stage-'));
  try {
    execFileSync('make', ['install', 'PREFIX=/usr', `DESTDIR=${stage}`], { cwd: ROOT, stdio: 'ignore' });
    const listed = read('debian/omx-contract-data.install').trim().split('\n');
    assert.ok(listed.includes('usr/share/omx-contract/omx_contract_catalog.py'), 'positive control: the catalog reader is listed');
    for (const rel of listed) assert.ok(existsSync(join(stage, rel)), `${rel} is listed in debian/omx-contract-data.install and make install does not stage it`);
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
});
