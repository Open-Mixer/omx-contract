// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas
// The C text helpers live in render/c/c-literals.mjs. The frozen limits renderer they once shared a file with is gone:
// no render module imports it, test/live-owners.test.mjs keeps no exemption for it, and package.json publishes no
// export for it. `leftovers` names what is still there; the sabotage test plants each one in a scratch copy.
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { ROOT } from './helpers.mjs';

const OLD = 'contract-limits-render';
const DIRS = ['render', 'render/c', 'lib', 'bin'];

function leftovers(root) {
  const out = [];
  if (existsSync(join(root, `render/c/${OLD}.mjs`))) out.push(`render/c/${OLD}.mjs exists`);
  if (existsSync(join(root, `render/c/${OLD}.d.mts`))) out.push(`render/c/${OLD}.d.mts exists`);
  for (const d of DIRS) {
    if (!existsSync(join(root, d))) continue;
    for (const f of readdirSync(join(root, d)).filter((n) => n.endsWith('.mjs'))) {
      if (new RegExp(`import[^;]*from '[^']*${OLD}`).test(readFileSync(join(root, d, f), 'utf8'))) out.push(`${d}/${f} imports ${OLD}`);
    }
  }
  if (Object.hasOwn(JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).exports ?? {}, `./${OLD}`)) out.push(`package.json exports ./${OLD}`);
  if (readFileSync(join(root, 'test/live-owners.test.mjs'), 'utf8').includes(OLD)) out.push(`live-owners.test.mjs exempts ${OLD}`);
  return out;
}

test('the C text helpers have their own module; the frozen limits renderer and its exemption are gone', () => {
  assert.deepEqual(leftovers(ROOT), []);
  assert.ok(existsSync(join(ROOT, 'render/c/c-literals.mjs')), 'the helpers module exists');
});

test('sabotage: each leftover planted in a scratch copy is named', () => {
  const plant = {
    [`render/c/${OLD}.mjs exists`]: (r) => writeFileSync(join(r, `render/c/${OLD}.mjs`), '// x\n'),
    [`render/hints.mjs imports ${OLD}`]: (r) => writeFileSync(join(r, 'render/hints.mjs'), `${readFileSync(join(r, 'render/hints.mjs'), 'utf8')}\nimport { x } from './c/${OLD}.mjs';\n`),
    [`package.json exports ./${OLD}`]: (r) => {
      const p = JSON.parse(readFileSync(join(r, 'package.json'), 'utf8'));
      p.exports[`./${OLD}`] = { import: `./render/c/${OLD}.mjs` };
      writeFileSync(join(r, 'package.json'), JSON.stringify(p));
    },
    [`live-owners.test.mjs exempts ${OLD}`]: (r) => writeFileSync(join(r, 'test/live-owners.test.mjs'), `// render/c/${OLD}.mjs\n`),
  };
  for (const [expected, doIt] of Object.entries(plant)) {
    const scratch = mkdtempSync(join(tmpdir(), 'render-helpers-'));
    try {
      for (const rel of ['render', 'lib', 'bin', 'package.json', 'test/live-owners.test.mjs']) {
        mkdirSync(dirname(join(scratch, rel)), { recursive: true });
        cpSync(join(ROOT, rel), join(scratch, rel), { recursive: true });
      }
      doIt(scratch);
      assert.ok(leftovers(scratch).includes(expected), `names: ${expected}`);
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  }
});
