// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// What a consumer's contract tools read from an installed omx-contract, never from a source checkout or a git tag
// (omx-contract#227): the kernel recipe under <datadir>/omx-contract/recipes/, named by the .pc's recipesdir, the
// installer install-contract-dir.sh under <datadir>/omx-contract/, the headers under <includedir>/omxcontract/, and the
// CLI tree under <clidir> with the recipe reader tools/kernel-recipe.mjs beside bin/, lib/ and render/. The staged
// install is `make install install-cli` into a scratch DESTDIR (no compiler, no package build), and the RPM %files and
// the Debian .install lists ship each path.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { ROOT } from './helpers.mjs';

const STAGE = mkdtempSync(join(tmpdir(), 'omx-contract-install-tree-'));
after(() => rmSync(STAGE, { recursive: true, force: true }));
const DIRS = { PREFIX: '/usr', INCLUDEDIR: '/usr/include', DATADIR: '/usr/share', CLIDIR: '/usr/lib/omx-contract', BINDIR: '/usr/bin', MANDIR: '/usr/share/man' };

let staged;
function stage() {
  if (staged) return staged;
  const vars = Object.entries(DIRS).map(([k, v]) => `${k}=${v}`);
  const r = spawnSync('make', ['-s', '-C', ROOT, 'install', 'install-cli', `DESTDIR=${STAGE}`, ...vars], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  staged = STAGE;
  return staged;
}
const at = (p) => join(stage(), p);

test('the staged install carries the kernel recipe under <datadir>/omx-contract/recipes/, byte for byte', () => {
  const installed = at('usr/share/omx-contract/recipes/kernel.recipe.json');
  assert.ok(existsSync(installed), 'no recipes/kernel.recipe.json under <datadir>/omx-contract');
  assert.equal(readFileSync(installed, 'utf8'), readFileSync(join(ROOT, 'recipes/kernel.recipe.json'), 'utf8'));
});

test('the .pc names the recipe directory: recipesdir is <datadir>/omx-contract/recipes', () => {
  const pc = at('usr/share/pkgconfig/omx-contract.pc');
  const v = execFileSync('pkg-config', ['--variable=recipesdir', pc], { encoding: 'utf8' }).trim();
  assert.equal(v, '/usr/share/omx-contract/recipes');
  assert.equal(execFileSync('pkg-config', ['--variable=datadir', pc], { encoding: 'utf8' }).trim(), '/usr/share/omx-contract', 'install-contract-dir.sh is under datadir');
});

test('the staged install carries what a consumer\'s contract tools take: the installer, the headers, the recipe reader', () => {
  for (const p of ['usr/share/omx-contract/install-contract-dir.sh', 'usr/include/omxcontract/omx_vocabulary.h', 'usr/lib/omx-contract/bin/omx-contract.mjs',
    'usr/lib/omx-contract/lib/data.mjs', 'usr/lib/omx-contract/tools/kernel-recipe.mjs', 'usr/lib/omx-contract/schema/omx-contract.schema.json', 'usr/lib/omx-contract/package.json']) {
    assert.ok(existsSync(at(p)), `${p} is not installed`);
  }
});

test('the installed recipe reader reads the installed recipe: kernel-recipe.mjs run from <clidir> finds <recipesdir>', () => {
  const pc = at('usr/share/pkgconfig');
  // the staged .pc says /usr/share/...; pkg-config prefixes PKG_CONFIG_SYSROOT_DIR, as for any consumer of a staged tree
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', `import { loadRecipe } from ${JSON.stringify(at('usr/lib/omx-contract/tools/kernel-recipe.mjs'))}; console.log(Object.keys(loadRecipe()).length > 0 ? 'read' : 'empty');`],
    { encoding: 'utf8', env: { ...process.env, PKG_CONFIG_PATH: pc, PKG_CONFIG_SYSROOT_DIR: stage(), PKG_CONFIG_LIBDIR: pc } });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), 'read');
});

test('the RPM %files and the Debian .install lists ship the recipe directory and the recipe reader', () => {
  const spec = readFileSync(join(ROOT, 'packaging/omx-contract.spec'), 'utf8');
  const devel = spec.split('%files devel')[1].split('%files')[0];
  assert.match(devel, /^%\{_datadir\}\/omx-contract\/recipes\/$/m, 'the -devel package ships recipes/');
  const dev = readFileSync(join(ROOT, 'debian/libomx-contract-dev.install'), 'utf8');
  assert.match(dev, /^usr\/share\/omx-contract\/recipes$/m, 'libomx-contract-dev ships recipes/');
  // the CLI tree is shipped whole by omx-contract (RPM: %{_prefix}/lib/omx-contract/, deb: usr/lib/omx-contract)
  assert.match(readFileSync(join(ROOT, 'debian/omx-contract.install'), 'utf8'), /^usr\/lib\/omx-contract$/m);
});

// lintian's script-not-executable (the staged deb build of devel 896ec8c, trixie arm64, exit 2): a file the package
// ships with a #! line is run, so it is installed executable. tools/kernel-recipe.mjs went in 0644.
test('every file the CLI tree installs with a #! line is executable (lintian script-not-executable)', () => {
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? (e.name === 'node_modules' ? [] : walk(join(d, e.name))) : [join(d, e.name)]);
  const root = at('usr/lib/omx-contract');
  const scripts = walk(root).filter((f) => readFileSync(f).subarray(0, 2).toString() === '#!');
  assert.ok(scripts.some((f) => f.endsWith('/tools/kernel-recipe.mjs')), 'positive control: the recipe reader is a #! file');
  const bad = scripts.filter((f) => (statSync(f).mode & 0o111) !== 0o111).map((f) => f.slice(root.length + 1));
  assert.deepEqual(bad, [], `installed #! files not executable: ${bad.join(', ')}`);
});
