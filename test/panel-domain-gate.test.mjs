// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The merge-order gate of the panel words' removal (tools/panel-domain-gate.sh): it passes only when the channel offers
// omx-panel as the provider of the panel domain's document, and refuses by name when it does not; one sabotage arm each.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { test } from 'node:test';
import { ROOT } from './helpers.mjs';

const gate = (query) => spawnSync('sh', [join(ROOT, 'tools/panel-domain-gate.sh')], { encoding: 'utf8', env: { PATH: process.env.PATH, PANEL_GATE_QUERY: query } });

test('the gate passes when omx-panel provides the panel document', () => {
  const r = gate('echo omx-panel');
  assert.equal(r.status, 0, r.stderr);
});

test('sabotage: no provider, or another package, is REFUSED by name', () => {
  for (const q of ['true', 'echo omx-panel-render', 'echo omx-contract-data']) {
    const r = gate(q);
    assert.equal(r.status, 1, q);
    assert.match(r.stderr, /REFUSED: no omx-panel in the package channel provides \/usr\/share\/omx-contract\/contract\.d\/panel\/panel\.json/);
  }
});

test('a query that fails is not a pass: exit 2', () => {
  assert.equal(gate('false').status, 2);
});
