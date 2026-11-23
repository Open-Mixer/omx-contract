// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The owner rule is Node 26 everywhere (#172): every workflow that sets up Node states node-version 26, and no
// workflow sets up Node without stating it.
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, '.github/workflows');
export const NODE = '26';

// Every setup-node step and every node-version line of a workflow that is not Node 26, as name:line: text.
export function notNode26(name, text) {
  const lines = text.split('\n');
  const bad = [];
  lines.forEach((line, i) => {
    if (/^\s*#/.test(line)) return;
    const v = /^\s*node-version:\s*['"]?([^'"\s#]+)/.exec(line);
    if (v && v[1] !== NODE) bad.push(`${name}:${i + 1}: ${line.trim()}`);
    if (/uses:\s*actions\/setup-node@/.test(line)) {
      const step = [];
      for (let j = i + 1; j < lines.length && !/^\s*-\s/.test(lines[j]); j++) step.push(lines[j]);
      if (!step.some((l) => /^\s*node-version:/.test(l))) bad.push(`${name}:${i + 1}: setup-node without node-version`);
    }
  });
  return bad;
}

test('every workflow sets up Node 26 (#172)', { skip: !existsSync(DIR) && 'no .github/workflows in this tree' }, () => {
  const files = readdirSync(DIR).filter((f) => /\.ya?ml$/.test(f));
  const steps = files.flatMap((f) => readFileSync(join(DIR, f), 'utf8').match(/actions\/setup-node@/g) ?? []);
  assert.ok(steps.length > 0, 'no setup-node step found: the check would pass on nothing');
  const bad = files.flatMap((f) => notNode26(f, readFileSync(join(DIR, f), 'utf8')));
  assert.deepEqual(bad, [], 'a workflow sets up Node other than 26');
});

test('the check is red on Node 22, on a setup-node without a version, and green on 26', () => {
  const step = (v) => `      - uses: actions/setup-node@v4\n        with:\n${v}      - run: npm ci\n`;
  assert.equal(notNode26('x', step('          node-version: 22\n')).length, 1);
  assert.equal(notNode26('x', step("          node-version: '24'\n")).length, 1);
  assert.equal(notNode26('x', step('          registry-url: https://registry.npmjs.org\n')).length, 1);
  assert.equal(notNode26('x', step('          node-version: 26\n')).length, 0);
  assert.equal(notNode26('x', step("          node-version: '26'\n")).length, 0);
  assert.equal(notNode26('x', '        # node-version: 22 was the old floor\n').length, 0);
});
