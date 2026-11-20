// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// CONTRACT_CODES is the reader's own table (the `contract` domain, docs/contract-dir.md "The refusal codes"): not a
// declaration, so no vocabulary render carries it, from data/ or from the installed tree. The domain is installed
// beside the data (make install), and the render of that installed tree is the render of data/, byte for byte, in every
// target (the handback-contract-dir step of ci.yml, the DEB and RPM install jobs).
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { renderTarget } from '../bin/omx-contract.mjs';
import { SCHEMA_MAJOR } from '../lib/contract-dir.mjs';
import { packageVersion } from '../lib/data.mjs';
import { DATA, installParamDomain, ROOT } from './helpers.mjs';

const SCRATCH = mkdtempSync(join(tmpdir(), 'omx-codes-paths-'));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));

/** The tree `make install` writes: data/ and the contract domain, as install-contract-dir.sh writes each. */
function installedWithDomain() {
  const root = join(SCRATCH, 'cd');
  const sh = join(ROOT, 'tools/install-contract-dir.sh');
  execFileSync('sh', [sh, '-x', 'scale-vectors.json', 'omx-contract', packageVersion(ROOT), String(SCHEMA_MAJOR), DATA, root, 'data'], { stdio: 'ignore' });
  execFileSync('sh', [sh, '--domain', join(ROOT, 'contract.d/contract'), root], { stdio: 'ignore' });
  installParamDomain(root);
  return root;
}

const byPath = (files) => Object.fromEntries(files.map((f) => [f.path, f.text]));

for (const target of ['c', 'json', 'ts', 'py', 'lv2']) {
  test(`the render of the installed tree is the render of data/: ${target}`, () => {
    const dir = installedWithDomain();
    assert.deepEqual(byPath(renderTarget(target, ['--contract-dir', dir])), byPath(renderTarget(target, [])));
  });
}

test('no vocabulary render carries CONTRACT_CODES, from the installed tree', () => {
  const dir = installedWithDomain();
  for (const target of ['c', 'json', 'ts']) {
    for (const f of renderTarget(target, ['--contract-dir', dir])) {
      if (f.path === 'omxcontract/omx_contract_codes.h') continue;
      assert.ok(!/contract\.dir\.absent|CONTRACT_CODES/.test(f.text), `${target}: ${f.path} carries the reader's own table`);
    }
  }
});

/**
 * A copy of the tool whose contract domain also holds CONTRACT_STATES, a words item of its own file (`states.json`): what a
 * second item of the domain (the units' dimensions) will be. The tool renders its own table raw and no more.
 */
function withSecondItem() {
  const dir = join(SCRATCH, 'copy');
  mkdirSync(dir);
  for (const d of ['bin', 'tools', 'lib', 'render', 'schema', 'data', 'contract.d', 'include', 'catalogs', 'share', 'package.json']) cpSync(join(ROOT, d), join(dir, d), { recursive: true });
  symlinkSync(join(ROOT, 'node_modules'), join(dir, 'node_modules'));
  const file = join(dir, 'contract.d/contract/contract.json');
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  doc.components.schemas.CONTRACT_STATES = {
    description: 'The states of a fixture of the contract domain.',
    'x-since': '1.0.0',
    oneOf: [
      { const: 'idle', title: 'idle', description: 'doing nothing', 'x-code': 0 },
      { const: 'busy', title: 'busy', description: 'doing something', 'x-code': 1 },
    ],
    'x-file': 'states.json',
    'x-kind': 'words',
  };
  writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`);
  return dir;
}

const filesUnder = (dir, rel = '') => readdirSync(join(dir, rel), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? filesUnder(dir, join(rel, e.name)) : [join(rel, e.name)]));

test('a second item of the contract domain renders on both paths, and the two paths agree; CONTRACT_CODES renders on neither', () => {
  const tool = withSecondItem();
  const cli = join(tool, 'bin/omx-contract.mjs');
  const root = join(SCRATCH, 'copy-cd');
  const sh = join(tool, 'tools/install-contract-dir.sh');
  execFileSync('sh', [sh, '-x', 'scale-vectors.json', 'omx-contract', packageVersion(ROOT), String(SCHEMA_MAJOR), join(tool, 'data'), root, 'data'], { stdio: 'ignore' });
  execFileSync('sh', [sh, '--domain', join(tool, 'contract.d/contract'), root], { stdio: 'ignore' });
  execFileSync('sh', [sh, '--domain', join(tool, 'contract.d/param'), root], { stdio: 'ignore' });
  for (const target of ['c', 'json', 'ts']) {
    const plain = join(SCRATCH, `plain-${target}`);
    const inst = join(SCRATCH, `inst-${target}`);
    execFileSync(process.execPath, [cli, 'render', '--target', target, '--out', plain], { cwd: tool });
    execFileSync(process.execPath, [cli, 'render', '--target', target, '--out', inst, '--contract-dir', root], { cwd: tool });
    assert.deepEqual(filesUnder(inst), filesUnder(plain), `${target}: the same files`);
    let carries = false;
    for (const f of filesUnder(plain)) {
      const a = readFileSync(join(plain, f), 'utf8');
      assert.equal(readFileSync(join(inst, f), 'utf8'), a, `${target}: ${f} differs between the paths`);
      if (f === 'omxcontract/omx_contract_codes.h') continue;
      assert.ok(!a.includes('contract.dir.absent'), `${target}: ${f} carries the reader's own table`);
      if (/CONTRACT_STATES/.test(a)) carries = true;
    }
    assert.ok(carries, `${target}: the second item renders`);
  }
});
