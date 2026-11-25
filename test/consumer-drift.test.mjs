// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// tools/consumer-drift.mjs (#262): a consumer's use of the install interface held to what this tree provides. Each
// kind of drift is found and named (an rpm macro, a pkg-config variable, a schema major passed to the installer by
// value or through a Makefile variable); comments, assignments and defined names are not; a finding is reported once
// per line; and with --base only the drift a change makes is reported, on a scratch git repository whose second
// commit removes a macro a consumer uses.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { provided, scanText } from '../tools/consumer-drift.mjs';
import { ROOT } from './helpers.mjs';

const have = provided();
const whats = (text, h = have) => scanText(text, h).map((f) => `${f.n} ${f.what}`);
const TMP = mkdtempSync(join(tmpdir(), 'omx-contract-consumer-drift-'));
after(() => rmSync(TMP, { recursive: true, force: true }));

test('this tree provides the contract directory by its macro and both .pc files', () => {
  assert.ok(have.macros.has('omx_contract_dir'));
  assert.ok(have.pc['omx-contract'].has('contractdir'));
  assert.ok(have.pc['libomx-domain'].has('contractdir'));
  assert.equal(have.noMajor, true);
});

test('an undefined rpm macro is named, a defined one and a comment are not', () => {
  assert.deepEqual(whats('%files\n%{omx_contract_dir}/x/\n%{omx_contract_domain_dir}/y/\n# %{omx_contract_gone}\n'), [
    '3 the rpm macro %{omx_contract_domain_dir} is not defined by packaging/macros.omx-contract.in',
  ]);
});

test('a pkg-config variable the .pc does not have is named, in a shell call and an argument list', () => {
  assert.deepEqual(whats('A = $(shell pkg-config --variable=schema_major omx-contract)\nB = $(shell pkg-config --variable=contractdir omx-contract)\n'), [
    '1 pkg-config omx-contract has no variable schema_major (omx-contract.pc.in)',
  ]);
  assert.deepEqual(whats("spawnSync('pkg-config', ['--variable=nodir', 'libomx-domain'])\n"), [
    '1 pkg-config libomx-domain has no variable nodir (libomx-domain.pc.in)',
  ]);
  assert.deepEqual(whats("pkg-config --variable=tsdir omx-contract-extra\n"), [], 'another .pc of a longer name is not read');
});

test('a schema major passed to the installer is named, by value and through a Makefile variable', () => {
  const mk = [
    'CONTRACT_SCHEMA_MAJOR = 3',
    'INSTALL_CONTRACT_DIR = $(shell pkg-config --variable=datadir omx-contract)/install-contract-dir.sh',
    'install-contract:',
    '\t@test -n "$(INSTALL_CONTRACT_DIR)" || { echo "no install-contract-dir.sh" >&2; exit 1; }',
    '\tsh $(INSTALL_CONTRACT_DIR) core $(VERSION) $(CONTRACT_SCHEMA_MAJOR) data \\',
    '\t  $(DESTDIR)$(CONTRACTDIR) data',
    '\tsh $(INSTALL_CONTRACT_DIR) core $(VERSION) data $(DESTDIR)$(CONTRACTDIR)',
    'other:',
    '\tsh /usr/share/omx-contract/install-contract-dir.sh openmixer "$version" 3 tree "$dir"; echo 3',
  ].join('\n');
  assert.deepEqual(whats(mk), [
    '5 install-contract-dir.sh argument 3 ($(CONTRACT_SCHEMA_MAJOR)) is a schema major; the installer takes none',
    '9 install-contract-dir.sh argument 3 (3) is a schema major; the installer takes none',
  ]);
});

test('an installer without the refusal is not held to it (the base of the change that brought it)', () => {
  assert.deepEqual(whats('sh install-contract-dir.sh p 1.0 3 data /d\n', { ...have, noMajor: false }), []);
});

test('--base reports only the drift the change makes', () => {
  const repo = join(TMP, 'tree');
  mkdirSync(join(repo, 'tools'), { recursive: true });
  mkdirSync(join(repo, 'packaging'));
  mkdirSync(join(repo, 'lib'));
  for (const f of ['omx-contract.pc.in', 'libomx-domain.pc.in', 'tools/install-contract-dir.sh', 'tools/consumer-drift.mjs', 'lib/entry.mjs']) cpSync(join(ROOT, f), join(repo, f));
  const macros = join(repo, 'packaging/macros.omx-contract.in');
  const git = (cwd, ...a) => execFileSync('git', ['-C', cwd, '-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...a], { encoding: 'utf8' });
  writeFileSync(macros, '%omx_contract_dir /c\n%omx_contract_old /o\n');
  git(TMP, 'init', '-q', repo); git(repo, 'add', '.'); git(repo, 'commit', '-qm', 'base');
  writeFileSync(macros, '%omx_contract_dir /c\n');
  git(repo, 'commit', '-qam', 'the change drops omx_contract_old');
  const consumer = join(TMP, 'consumer');
  git(TMP, 'init', '-q', consumer);
  writeFileSync(join(consumer, 'c.spec'), '%{omx_contract_old}/a/\n%{omx_contract_never}/b/\n');
  git(consumer, 'add', '.'); git(consumer, 'commit', '-qm', 'c');
  const run = (...a) => spawnSync(process.execPath, [join(repo, 'tools/consumer-drift.mjs'), ...a, consumer], { encoding: 'utf8' });
  const all = run();
  assert.equal(all.status, 1);
  assert.match(all.stdout, /consumer:c\.spec:1: the rpm macro %\{omx_contract_old\}/);
  assert.match(all.stdout, /consumer:c\.spec:2: the rpm macro %\{omx_contract_never\}/);
  const diff = run('--base', 'HEAD~1');
  assert.equal(diff.status, 1);
  assert.equal(diff.stdout, 'consumer:c.spec:1: the rpm macro %{omx_contract_old} is not defined by packaging/macros.omx-contract.in\n');
  assert.match(diff.stderr, /1 finding\(s\) this change makes \(1 already there at HEAD~1\)/);
  const none = run('--base', 'HEAD');
  assert.equal(none.status, 0, none.stderr);
  const unread = run('--base', 'no-such-ref');
  assert.equal(unread.status, 2, 'a base git cannot read is never a pass');
});
