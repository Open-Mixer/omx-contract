// SPDX-License-Identifier: GPL-3.0-or-later
// A tracked file under tools/ or bin/ with a #! line is a script someone runs, so git holds it 100755: the mode an
// install copies, and the one lintian asks of a shipped script (script-not-executable, the staged deb build of devel
// 896ec8c: tools/kernel-recipe.mjs). A file only imported carries no #! line.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { ROOT } from './helpers.mjs';

test('every tracked #! file under tools/ and bin/ is 100755 in git', () => {
  const rows = execFileSync('git', ['-C', ROOT, 'ls-files', '-s', '--', 'tools', 'bin'], { encoding: 'utf8' }).trim().split('\n');
  const scripts = rows.map((r) => { const [meta, path] = r.split('\t'); return { mode: meta.split(' ')[0], path }; })
    .filter(({ path }) => readFileSync(join(ROOT, path)).subarray(0, 2).toString() === '#!');
  assert.ok(scripts.some(({ path }) => path === 'tools/kernel-recipe.mjs'), 'positive control: tools/kernel-recipe.mjs is a #! file');
  const bad = scripts.filter(({ mode }) => mode !== '100755').map(({ path, mode }) => `${path} (${mode})`);
  assert.deepEqual(bad, [], `#! files not 100755: ${bad.join(', ')}`);
});
