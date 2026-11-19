// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { after, test } from 'node:test';
import { ROOT } from './helpers.mjs';

// npx and npm run reach the CLI through node_modules/.bin/omx-contract, a symlink to bin/omx-contract.mjs. Run that way,
// the command must answer as it does when run by its own path: a refusal exits non-zero, never 0 with nothing printed.
const scratch = mkdtempSync(join(tmpdir(), 'omx-contract-bin-'));
after(() => rmSync(scratch, { recursive: true, force: true }));
const bin = join(scratch, 'node_modules', '.bin');
mkdirSync(bin, { recursive: true });
const link = join(bin, 'omx-contract');
symlinkSync(join(ROOT, 'bin/omx-contract.mjs'), link);

const viaNode = (...a) => spawnSync(process.execPath, [link, ...a], { encoding: 'utf8' });
const viaExec = (...a) => spawnSync(link, a, { encoding: 'utf8', env: { ...process.env, PATH: `${process.execPath.replace(/\/[^/]+$/, '')}:${process.env.PATH}` } });

for (const [how, cli] of [['node <link>', viaNode], ['the link itself (npx)', viaExec]]) {
  test(`through a symlinked bin (${how}), a usage error exits 2 and says why`, () => {
    const r = cli();
    assert.equal(r.status, 2);
    assert.match(r.stderr, /no command/);
  });

  test(`through a symlinked bin (${how}), a refused check exits 1 and names the cause`, () => {
    const r = cli('render', '--target', 'c', '--out', join(ROOT, 'test/fixtures'), '--check');
    assert.equal(r.status, 1);
    assert.match(r.stderr, /omxcontract\/omx_contract_limits\.h is missing/);
  });

  test(`through a symlinked bin (${how}), a passing check exits 0`, () => {
    assert.equal(cli('validate').status, 0);
  });
}

// Every command-line entry point decides that it was run, not imported, through lib/entry.mjs: comparing argv[1] with
// the module's own path by hand misses a symlinked path, and the module then does nothing and exits 0.
test('no entry point compares argv[1] with its own path by hand', () => {
  const files = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.mjs')) files.push(p);
    }
  };
  for (const d of ['bin', 'lib', 'tools', 'render']) walk(join(ROOT, d));
  const code = (f) => readFileSync(f, 'utf8').split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l));
  const hand = files.filter((f) => code(f).some((l) => /process\.argv\[1\].*import\.meta\.url/.test(l)))
    .map((f) => relative(ROOT, f));
  assert.deepEqual(hand, [], `compare by hand instead of lib/entry.mjs: ${hand.join(', ')}`);
});

// Other packages' command-line entry points take the same check from here, never a copy: the package exports it.
test('the package exports isMain at ./entry, and a consumer run through a symlinked bin runs', async () => {
  const url = import.meta.resolve('@openmixer/omx-contract/entry');
  const { isMain } = await import(url);
  assert.equal(typeof isMain, 'function');
  const pkg = join(scratch, 'consumer');
  mkdirSync(pkg, { recursive: true });
  const script = join(pkg, 'cli.mjs');
  writeFileSync(script, `import { isMain } from ${JSON.stringify(url)};\nif (isMain(import.meta.url)) { console.log('ran'); process.exitCode = 3; }\n`);
  const consumerLink = join(bin, 'consumer');
  symlinkSync(script, consumerLink);
  const r = spawnSync(process.execPath, [consumerLink], { encoding: 'utf8' });
  assert.equal(r.status, 3);
  assert.equal(r.stdout.trim(), 'ran');
});
