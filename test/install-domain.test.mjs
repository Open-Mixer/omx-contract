// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// tools/install-contract-dir.sh --domain (docs/contract-dir.md, "The installer"): a domain directory is copied as it
// is to <contractdir>/<domain>/, read back by the reader of an installed domain; what the reader would refuse is
// refused at install, naming the file; a nested domain is installed by its own call and left alone by this one.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { loadContractDir } from '../lib/contract-dir.mjs';
import { ROOT } from './helpers.mjs';

const SCRATCH = mkdtempSync(join(tmpdir(), 'omx-install-domain-'));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));
const SCRIPT = join(ROOT, 'tools/install-contract-dir.sh');
const WIDGET = join(ROOT, 'test/fixtures/install-domain/widget');
/** The package that owns the fixture domain, its info.x-owner: the one --domain may install it for (#88). */
const OWNER = 'omx-fixture';
let n = 0;

/** A source tree `<tmp>/contract.d/<name>` holding a copy of the widget fixture (document renamed to the leaf); returns its path. */
function source(name = 'widget') {
  const dir = join(SCRATCH, `s-${n++}`, 'contract.d', name);
  cpSync(WIDGET, dir, { recursive: true });
  const leaf = name.split('/').pop();
  if (leaf !== 'widget') cpSync(join(dir, 'widget.json'), join(dir, `${leaf}.json`));
  if (leaf !== 'widget') rmSync(join(dir, 'widget.json'));
  return dir;
}

const dest = () => join(SCRATCH, `d-${n++}`);
const run = (...args) => spawnSync('sh', [SCRIPT, ...args], { encoding: 'utf8' });
const files = (dir, pre = '') => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name), `${pre}${e.name}/`) : [`${pre}${e.name}`])).sort();

test('--domain copies the document and the catalogs byte for byte, and the reader reads the domain', () => {
  const from = source();
  const to = dest();
  const r = run('--domain', from, to, OWNER);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(files(join(to, 'widget')), ['catalogs/ca.json', 'widget.json']);
  for (const f of ['widget.json', 'catalogs/ca.json']) {
    assert.equal(readFileSync(join(to, 'widget', f), 'utf8'), readFileSync(join(from, f), 'utf8'), `${f} is the source's bytes`);
    assert.equal(statSync(join(to, 'widget', f)).mode & 0o777, 0o644);
  }
  const read = loadContractDir({ dir: to });
  assert.equal(read.packages.get('widget').manifest.version, '1.2.0');
  assert.ok(read.items.has('WIDGET_COLORS'));
});

test('the domain name is the path after the last contract.d/ component', () => {
  const from = source('widget');
  const nested = join(SCRATCH, `n-${n++}`, 'contract.d', 'x', 'contract.d', 'widget');
  cpSync(from, nested, { recursive: true });
  const to = dest();
  assert.equal(run('--domain', `${nested}/`, to, OWNER).status, 0);
  assert.ok(existsSync(join(to, 'widget', 'widget.json')));
  const deep = source('formats/clap');
  const to2 = dest();
  assert.equal(run('--domain', deep, to2, OWNER).status, 0);
  assert.ok(existsSync(join(to2, 'formats/clap/clap.json')));
});

test('a usage error is exit 2: no contract.d component, a name that is not [a-z][a-z0-9-]*, no directory', () => {
  const from = source();
  const plain = join(SCRATCH, `p-${n++}`, 'widget');
  cpSync(from, plain, { recursive: true });
  const upper = join(SCRATCH, `u-${n++}`, 'contract.d', 'Widget');
  cpSync(from, upper, { recursive: true });
  const digit = join(SCRATCH, `u-${n++}`, 'contract.d', 'a', '9b');
  cpSync(from, digit, { recursive: true });
  for (const arg of [plain, upper, digit, join(SCRATCH, 'contract.d', 'absent')]) {
    const to = dest();
    const r = run('--domain', arg, to, OWNER);
    assert.equal(r.status, 2, `${arg}: ${r.stderr}`);
    assert.ok(/domain/.test(r.stderr), `a domain usage message: ${r.stderr}`);
    assert.ok(!existsSync(to), 'nothing installed');
  }
  assert.equal(run('--domain', from).status, 2);
});

/** A refusal: exit 1, the message names `named`, nothing installed. */
function refused(from, named) {
  const to = dest();
  const r = run('--domain', from, to, OWNER);
  assert.equal(r.status, 1, r.stderr);
  assert.ok(r.stderr.includes(named), `${named} is named: ${r.stderr}`);
  assert.ok(!existsSync(join(to, 'widget')), 'nothing installed');
}

test('refusals: no document, a file beside the document, a bad catalog name, a symlink', () => {
  let from = source();
  rmSync(join(from, 'widget.json'));
  refused(from, 'widget.json');
  from = source();
  writeFileSync(join(from, 'README.md'), 'x');
  refused(from, 'README.md');
  from = source();
  writeFileSync(join(from, 'catalogs', 'notes.txt'), 'x');
  refused(from, 'notes.txt');
  from = source();
  writeFileSync(join(from, 'catalogs', 'Catalan.json'), '{}');
  refused(from, 'Catalan.json');
  from = source();
  writeFileSync(join(from, 'stray.json'), '{}');
  refused(from, 'stray.json');
  from = source();
  mkdirSync(join(from, 'sub'));
  writeFileSync(join(from, 'sub', 'other.json'), '{}');
  refused(from, 'sub');
  from = source();
  rmSync(join(from, 'catalogs', 'ca.json'));
  symlinkSync(join(from, 'widget.json'), join(from, 'catalogs', 'ca.json'));
  refused(from, 'ca.json');
  from = source();
  const real = join(SCRATCH, `real-${n++}.json`);
  cpSync(join(from, 'widget.json'), real);
  rmSync(join(from, 'widget.json'));
  symlinkSync(real, join(from, 'widget.json'));
  refused(from, 'widget.json');
});

test('a nested domain directory is skipped, never copied; reinstalling replaces only the domain\'s own files', () => {
  const to = dest();
  const sub = source('formats/clap'); // installed beside, by its own call
  assert.equal(run('--domain', sub, to, OWNER).status, 0);
  const from = source('formats');
  cpSync(sub, join(from, 'clap'), { recursive: true });
  assert.equal(run('--domain', from, to, OWNER).status, 0);
  assert.deepEqual(files(join(to, 'formats')), ['catalogs/ca.json', 'clap/catalogs/ca.json', 'clap/clap.json', 'formats.json']);
  // the source of the sub-domain is changed in the install only; a reinstall of the parent leaves it
  const mark = join(to, 'formats/clap/clap.json');
  writeFileSync(mark, '{"kept":true}\n');
  rmSync(join(from, 'catalogs', 'ca.json'));
  assert.equal(run('--domain', from, to, OWNER).status, 0);
  assert.equal(readFileSync(mark, 'utf8'), '{"kept":true}\n');
  assert.deepEqual(files(join(to, 'formats')), ['clap/catalogs/ca.json', 'clap/clap.json', 'formats.json']);
});

/** A package source directory holding `files` ({ rel: text }), every one a data file of relative $schema. */
function packageSource(files = { 'a.json': '{\n  "$schema": "../schema/omx-contract.schema.json",\n  "A": 1\n}\n' }) {
  const from = join(SCRATCH, `pk-${n++}`);
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(join(from, rel, '..'), { recursive: true });
    writeFileSync(join(from, rel), text);
  }
  return from;
}
const SCHEMA_MAJOR_OF_TREE = Number(JSON.parse(readFileSync(join(ROOT, 'schema/omx-contract.schema.json'), 'utf8'))['x-omx-schema-version'].split('.')[0]);

test('the package mode installs at <contractdir>/<package>/, no major level: the manifest and $schema state the schema major', () => {
  const to = dest();
  const r = run('pkg', '1.0.0', packageSource(), to);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(files(to), ['pkg/MANIFEST.json', 'pkg/a.json'], 'nothing under a major directory');
  assert.equal(JSON.parse(readFileSync(join(to, 'pkg/MANIFEST.json'), 'utf8')).schemaMajor, SCHEMA_MAJOR_OF_TREE, 'the major of the schema beside the script');
  assert.ok(readFileSync(join(to, 'pkg/a.json'), 'utf8').includes(`https://openmixer.org/schema/omx-contract/v${SCHEMA_MAJOR_OF_TREE}/`));
});

test('the signature of before is refused: a schema major argument is a usage error, never a directory (package and --owner)', () => {
  const to = dest();
  const old = run('pkg', '1.0.0', '3', packageSource(), to);
  assert.equal(old.status, 2, 'the six-argument form of before');
  const short = run('pkg', '1.0.0', '3', to);
  assert.equal(short.status, 2, 'the five-argument form of before: 3 is no <from dir>');
  assert.match(short.stderr, /'3' is a schema major; the contract directory has no major level/);
  const owner = run('--owner', 'pkg', '1.0.0', '3', to, 'widget');
  assert.equal(owner.status, 2);
  assert.match(owner.stderr, /'3' is a schema major/);
  assert.ok(!existsSync(to) || !files(to).length, 'nothing was installed');
});

test('one name, one directory: the package and the domain of its name share <contractdir>/<name>/, either order, and a reinstall of one keeps the other', () => {
  const domain = source(OWNER);
  for (const order of [['package', 'domain'], ['domain', 'package']]) {
    const to = dest();
    for (const step of order) {
      const r = step === 'domain' ? run('--domain', domain, to, OWNER) : run(OWNER, '1.0.0', packageSource({ 'a.json': '{}\n', 'kernels/k.json': '{}\n' }), to);
      assert.equal(r.status, 0, `${order}: ${r.stderr}`);
    }
    const want = ['MANIFEST.json', 'a.json', 'catalogs/ca.json', 'catalogs/es.json', `${OWNER}.json`, 'kernels/k.json'];
    assert.deepEqual(files(join(to, OWNER)), want.filter((f) => !f.startsWith('catalogs/') || existsSync(join(domain, f))).sort(), order.join(' then '));
    // a reinstall of the package with fewer files removes the file it no longer lists, never the domain's
    assert.equal(run(OWNER, '1.1.0', packageSource({ 'a.json': '{}\n' }), to).status, 0);
    assert.ok(!existsSync(join(to, OWNER, 'kernels')), 'the file the old manifest listed is gone, and its empty directory');
    assert.ok(existsSync(join(to, OWNER, `${OWNER}.json`)), 'the domain document stays');
    // the --owner mode beside the domain keeps it too
    assert.equal(run('--owner', OWNER, '1.2.0', to, OWNER).status, 0);
    assert.ok(existsSync(join(to, OWNER, `${OWNER}.json`)) && !existsSync(join(to, OWNER, 'a.json')), '--owner keeps the domain and drops the files of the old manifest');
  }
});

test('one name, one directory: an owner file in a domain\'s place and two owners in one directory are refused by name, nothing installed', () => {
  const to = dest();
  assert.equal(run('--domain', source(OWNER), to, OWNER).status, 0);
  const before = files(to);
  const clash = (rel) => run(OWNER, '1.0.0', packageSource({ [rel]: '{}\n' }), to);
  let r = clash(`${OWNER}.json`);
  assert.equal(r.status, 1);
  assert.match(r.stderr, new RegExp(`${OWNER}\\.json is the place of the domain ${OWNER}'s document`));
  r = clash('catalogs/xx.json');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /catalogs\/ of .* is the domain omx-fixture's/);
  // a nested domain beside the package: no file of the package inside it
  assert.equal(run('--domain', source(`${OWNER}/inner`), to, OWNER).status, 0);
  r = clash('inner/x.json');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /is the nested domain omx-fixture\/inner/);
  assert.ok(!existsSync(join(to, OWNER, 'MANIFEST.json')), 'no refused install wrote a manifest');
  assert.deepEqual(files(to).filter((f) => !f.startsWith(`${OWNER}/inner/`)), before, 'nor any file beside the domains');
  // two owners: the package widget beside a domain widget owned by omx-fixture, either order
  const two = dest();
  assert.equal(run('--domain', source(), two, OWNER).status, 0);
  r = run('widget', '1.0.0', packageSource(), two);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /the domain widget is owned by omx-fixture, and .* would hold the package widget: two owners in one directory/);
  const three = dest();
  assert.equal(run('widget', '1.0.0', packageSource(), three).status, 0);
  r = run('--domain', source(), three, OWNER);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /holds the package widget, and the domain widget is owned by omx-fixture: two owners in one directory/);
});

// the RPM macro (packaging/macros.omx-contract.in): a package's and a domain's %files name %{omx_contract_dir}/<name>/,
// the contract directory itself; no macro carries a schema major.
test('%{omx_contract_dir} is the contract directory, with no major level and no second macro', { skip: spawnSync('rpm', ['--version']).status !== 0 && 'no rpm' }, () => {
  const macros = join(ROOT, 'packaging/macros.omx-contract.in');
  const ev = (m) => spawnSync('rpm', ['--macros', `/usr/lib/rpm/macros:${macros}`, '--define', '_datadir /usr/share', '--eval', m], { encoding: 'utf8' }).stdout.trim();
  assert.equal(ev('%{omx_contract_dir}'), '/usr/share/omx-contract/contract.d');
  assert.deepEqual([...readFileSync(macros, 'utf8').matchAll(/^%(\S+)/gm)].map((m) => m[1]), ['omx_contract_dir'], 'one macro: no omx_contract_domain_dir, no omx_contract_schema_major');
  assert.doesNotMatch(readFileSync(macros, 'utf8'), /@[A-Z_]+@/, 'nothing substituted at install');
});

test('the document\'s info.x-owner must be the installing package: another is refused naming both, none is a usage error (#88)', () => {
  const from = source();
  const to = dest();
  const r = run('--domain', from, to, 'omx-intruder');
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stderr, /info\.x-owner is omx-fixture, not omx-intruder/);
  assert.ok(r.stderr.includes('widget.json'), r.stderr);
  assert.ok(!existsSync(join(to, 'widget')), 'nothing installed');
  const u = run('--domain', from, dest());
  assert.equal(u.status, 2, 'the package is a required argument');
  assert.match(u.stderr, /<package>/);
  const doc = join(from, 'widget.json');
  writeFileSync(doc, readFileSync(doc, 'utf8').replace(/"x-owner": "omx-fixture",?/, ''));
  const none = run('--domain', from, dest(), OWNER);
  assert.equal(none.status, 1, 'a document with no x-owner is refused');
  assert.match(none.stderr, /no info\.x-owner/);
});
