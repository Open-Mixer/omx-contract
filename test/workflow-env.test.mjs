// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// A step that writes `echo "X=$(cmd)" >> "$GITHUB_ENV"` takes echo's status: a failed cmd passes the step with an empty
// X. No workflow writes a command substitution straight into GITHUB_ENV or GITHUB_OUTPUT; it assigns, tests, then writes.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { ROOT } from './helpers.mjs';

const WORKFLOWS = readdirSync(join(ROOT, '.github/workflows')).filter((f) => f.endsWith('.yml'));

test('no workflow writes a command substitution straight into GITHUB_ENV or GITHUB_OUTPUT', () => {
  const shape = /\becho\b.*\$\(.*>>\s*"?\$\{?GITHUB_(ENV|OUTPUT)/;
  assert.ok(shape.test('echo "X=$(cmd)" >> "$GITHUB_ENV"'), 'positive control: the pattern sees the shape');
  assert.ok(WORKFLOWS.length >= 3, 'positive control: the workflows are read');
  for (const f of WORKFLOWS) for (const [i, l] of readFileSync(join(ROOT, '.github/workflows', f), 'utf8').split('\n').entries()) assert.doesNotMatch(l, shape, `${f}:${i + 1}`);
});
