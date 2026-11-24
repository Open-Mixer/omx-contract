// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// omx-contract reads no level above it (owner rule, the devel wave 2026-11-24): no workflow, tool or test fetches an
// owner's source (omx-dsp's archive, release or repository) or reads an owner's data directory. An owner proves its own
// data against the omx-contract it installs, the staged one in a release wave (omx-dsp's make contract-dir and
// units-check). The release proof of omx-contract is omx-contract's own tests.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';
import { ROOT } from './helpers.mjs';

const SELF = 'test/no-upward-read.test.mjs';
/** an owner's source fetched, or an owner's data handed in */
const UPWARD = [
  /github\.com\/[^\s"'/]+\/omx-dsp\b/,
  /api\.github\.com\/repos\/[^\s"'/]*\/?\$?\{?[^\s"'/]*\}?\/omx-dsp\b/,
  /repos\/\$GITHUB_REPOSITORY_OWNER\/omx-dsp/,
  /OMX_LIVE_OWNER_DATA/,
  /tools\/live-owner(-data\.sh|\.ref)/,
];

const files = (root, dir) => {
  const at = join(root, dir);
  if (!existsSync(at)) return [];
  return readdirSync(at).flatMap((n) => {
    const p = join(at, n);
    return statSync(p).isDirectory() ? (n === 'fixtures' || n === 'golden' ? [] : files(root, relative(root, p))) : [relative(root, p)];
  });
};

/** Every line of a workflow, tool or test of `root` that reads above omx-contract, as `file:line`. */
export function upwardReads(root) {
  const out = [];
  for (const rel of ['.github/workflows', 'tools', 'test'].flatMap((d) => files(root, d))) {
    if (rel === SELF || !/\.(ya?ml|sh|mjs|js|py|json)$|^tools\/[^.]+$/.test(rel)) continue;
    for (const [i, line] of readFileSync(join(root, rel), 'utf8').split('\n').entries()) {
      if (UPWARD.some((re) => re.test(line))) out.push(`${rel}:${i + 1}`);
    }
  }
  return out;
}

test('no workflow, tool or test reads an owner above omx-contract', () => {
  assert.ok(files(ROOT, '.github/workflows').length >= 3 && files(ROOT, 'tools').length > 5, 'positive control: the trees are read');
  assert.deepEqual(upwardReads(ROOT), []);
});

test('each upward read planted is named', () => {
  for (const line of [
    'data=$(sh tools/live-owner-data.sh "$RUNNER_TEMP/omx-dsp")',
    'curl -fsSL https://github.com/Open-Mixer/omx-dsp/archive/v0.34.0.tar.gz',
    'echo "OMX_LIVE_OWNER_DATA=$data" >> "$GITHUB_ENV"',
  ]) assert.ok(UPWARD.some((re) => re.test(line)), `not seen: ${line}`);
});
