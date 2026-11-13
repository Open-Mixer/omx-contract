// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The Python readers are a package (omx-contract#28): python3-omx-contract, on rpm and deb from the same source,
// installs omx_contract in site-packages / dist-packages with catalog, scale and clap as submodules, so a program
// writes `import omx_contract.catalog` instead of loading a file by its path. The submodules are the files
// /usr/share/omx-contract/ already ships, byte for byte (one source), and those stay installed for one release.
// While here: the npm export ./catalog has its types and loadContractDir is exported.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { ROOT } from './helpers.mjs';

const hasPython = spawnSync('python3', ['--version']).status === 0;
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const SUBMODULES = { catalog: 'omx_contract_catalog.py', scale: 'omx_contract_scale.py', clap: 'omx_contract.py' };

/** `make <target>` into a fresh DESTDIR; the tree it installed, removed by the caller. */
function install(target, vars = {}) {
  const dest = mkdtempSync(join(tmpdir(), 'omx-contract-py.'));
  const args = ['-s', '-C', ROOT, target, `DESTDIR=${dest}`, ...Object.entries(vars).map(([k, v]) => `${k}=${v}`)];
  const r = spawnSync('make', args, { encoding: 'utf8' });
  assert.equal(r.status, 0, `make ${target}: ${r.stderr}${r.stdout}`);
  return dest;
}

test('make install-python installs omx_contract with catalog, scale and clap, and each imports and answers', { skip: !hasPython && 'no python3' }, () => {
  const dest = install('install-python', { PYTHONDIR: '/py' });
  try {
    const pkg = join(dest, 'py', 'omx_contract');
    for (const f of ['__init__.py', 'catalog.py', 'scale.py', 'clap.py']) assert.ok(existsSync(join(pkg, f)), `omx_contract/${f} installed`);
    const r = spawnSync('python3', ['-I', '-c', `import sys
sys.path.insert(0, ${JSON.stringify(join(dest, 'py'))})
import omx_contract.catalog, omx_contract.scale, omx_contract.clap
print(omx_contract.catalog.code_key("contract.dir.absent"))
print("%.4f" % omx_contract.scale.scale_position({"scale": "log", "min": 20, "max": 20000}, 1000))
print(omx_contract.clap.CLAP_IDS["CLAP_EXT_AUDIO_PORTS_CONFIG"])
`], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(r.stdout.trim().split('\n').slice(1), ['0.5663', 'clap.audio-ports-config']);
  } finally {
    rmSync(dest, { recursive: true, force: true });
  }
});

test('the submodules are the files /usr/share/omx-contract/ ships, byte for byte: one source', () => {
  const dest = install('install-python', { PYTHONDIR: '/py' });
  try {
    for (const [sub, file] of Object.entries(SUBMODULES)) {
      assert.equal(readFileSync(join(dest, 'py', 'omx_contract', `${sub}.py`), 'utf8'), read(`share/omx-contract/${file}`), `omx_contract.${sub} is ${file}`);
    }
  } finally {
    rmSync(dest, { recursive: true, force: true });
  }
});

test('make install still installs the /usr/share/omx-contract/*.py files, for one release', () => {
  const dest = install('install', { PREFIX: '/usr' });
  try {
    for (const file of Object.values(SUBMODULES)) assert.ok(existsSync(join(dest, 'usr/share/omx-contract', file)), `${file} kept`);
  } finally {
    rmSync(dest, { recursive: true, force: true });
  }
});

test('the rpm and the deb each ship python3-omx-contract from the same source, built with install-python', () => {
  const spec = read('packaging/omx-contract.spec');
  assert.match(spec, /^%package -n python3-omx-contract$/m);
  assert.match(spec, /%package -n python3-omx-contract\n(?:.*\n)*?BuildArch: noarch\n/);
  assert.match(spec, /install-python DESTDIR=%\{buildroot\} PYTHONDIR=%\{python3_sitelib\}/);
  assert.match(spec, /^%files -n python3-omx-contract\n(?:.*\n)*?%\{python3_sitelib\}\/omx_contract\/$/m);
  const control = read('debian/control');
  assert.match(control, /^Package: python3-omx-contract\nSection: python\nArchitecture: all\n/m);
  assert.match(read('debian/rules'), /install-python DESTDIR=\$\(CURDIR\)\/debian\/tmp PYTHONDIR=\/usr\/lib\/python3\/dist-packages/);
  assert.equal(read('debian/python3-omx-contract.install').trim(), 'usr/lib/python3/dist-packages/omx_contract');
});

test('the README shows the import', () => {
  assert.match(read('README.md'), /^import omx_contract\.catalog$/m);
});

test('npm: ./catalog has its types, and loadContractDir is exported', async () => {
  const pkg = JSON.parse(read('package.json'));
  const catalog = pkg.exports['./catalog'];
  assert.equal(typeof catalog, 'object', './catalog names its types and its import');
  assert.equal(catalog.types, './lib/catalog.d.mts');
  assert.ok(existsSync(join(ROOT, catalog.types)), `${catalog.types} is built`);
  const dir = pkg.exports['./contract-dir'];
  assert.ok(dir && dir.types && dir.import, './contract-dir is exported with its types');
  assert.ok(existsSync(join(ROOT, dir.types)), `${dir.types} is built`);
  const mod = await import(pathToFileURL(join(ROOT, dir.import)).href);
  assert.equal(typeof mod.loadContractDir, 'function', 'loadContractDir is exported');
});
