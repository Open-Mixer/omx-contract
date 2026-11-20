// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// CONTRACT_CODES is the reader's own table (the `contract` domain, docs/contract-dir.md "The refusal codes"): not a
// declaration, so no vocabulary render carries it, from data/ or from the installed tree. The domain is installed
// beside the data (make install), and the render of that installed tree is the render of data/, byte for byte, in every
// target (the handback-contract-dir step of ci.yml, the DEB and RPM install jobs).
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { renderTarget } from '../bin/omx-contract.mjs';
import { SCHEMA_MAJOR } from '../lib/contract-dir.mjs';
import { packageVersion } from '../lib/data.mjs';
import { DATA, ROOT } from './helpers.mjs';

const SCRATCH = mkdtempSync(join(tmpdir(), 'omx-codes-paths-'));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));

/** The tree `make install` writes: data/ and the contract domain, as install-contract-dir.sh writes each. */
function installedWithDomain() {
  const root = join(SCRATCH, 'cd');
  const sh = join(ROOT, 'tools/install-contract-dir.sh');
  execFileSync('sh', [sh, '-x', 'scale-vectors.json', 'omx-contract', packageVersion(ROOT), String(SCHEMA_MAJOR), DATA, root, 'data'], { stdio: 'ignore' });
  execFileSync('sh', [sh, '--domain', join(ROOT, 'contract.d/contract'), root], { stdio: 'ignore' });
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
