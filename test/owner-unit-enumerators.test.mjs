// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// An owner's header (render --package, a render word with a limits section) names a set's PARAM_UNITS ids by their
// PARAM_UNITS titles, as the whole read does (docs/render.md, omx-contract#206): dB is _DB, never _D_B. PARAM_UNITS is
// omx-contract's (the param domain), not an item of the owner's package, so the titles come from the whole read, not
// from the items the header holds.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { main } from '../bin/omx-contract.mjs';
import { SCHEMA_MAJOR } from '../lib/contract-dir.mjs';
import { packageVersion } from '../lib/data.mjs';
import { DATA, ROOT, domainOwner } from './helpers.mjs';

const SCRATCH = mkdtempSync(join(tmpdir(), 'omx-contract-owner-units-'));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));
const OWNER = join(ROOT, 'test/fixtures/owner-unit-set');

const quiet = (fn) => {
  const { log, error } = console;
  console.log = () => {};
  console.error = () => {};
  try { return fn(); } finally { console.log = log; console.error = error; }
};

/** A contract directory as an owner's build stages it: omx-contract's data/ and its param domain, then the owner's files. */
function contractDir() {
  const root = join(SCRATCH, 'dir');
  const sh = (...a) => execFileSync('sh', [join(ROOT, 'tools/install-contract-dir.sh'), ...a], { stdio: 'ignore' });
  sh('-x', 'scale-vectors.json', 'omx-contract', packageVersion(ROOT), String(SCHEMA_MAJOR), DATA, root, 'data');
  sh('--domain', join(ROOT, 'contract.d/param'), root, domainOwner(join(ROOT, 'contract.d/param')));
  sh('acme', '0.1.0', String(SCHEMA_MAJOR), OWNER, root, 'data');
  return root;
}

test('render --package: an owner\'s unit set is named by the PARAM_UNITS titles (dB _DB, kHz _KHZ, dBFS _DBFS, dBu _DBU, dBTP _DBTP)', () => {
  const out = join(SCRATCH, 'out');
  assert.equal(quiet(() => main(['render', '--target', 'c', '--contract-dir', contractDir(), '--package', 'acme', '--out', out])), 0);
  const header = readFileSync(join(out, 'acme/acme_definitions.h'), 'utf8');
  const names = [...header.matchAll(/^ {2}(OMX_ACME_UNITS_\w+) = \d+,/gm)].map((m) => m[1]);
  assert.deepEqual(names, ['OMX_ACME_UNITS_DB', 'OMX_ACME_UNITS_KHZ', 'OMX_ACME_UNITS_DBFS', 'OMX_ACME_UNITS_DBU', 'OMX_ACME_UNITS_DBTP', 'OMX_ACME_UNITS_HIGH_CUT']);
  assert.doesNotMatch(header, /_D_B|_K_HZ/, 'never the upper snake case of the raw id');
});
