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
  const r = run('--domain', from, to);
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
  assert.equal(run('--domain', `${nested}/`, to).status, 0);
  assert.ok(existsSync(join(to, 'widget', 'widget.json')));
  const deep = source('formats/clap');
  const to2 = dest();
  assert.equal(run('--domain', deep, to2).status, 0);
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
    const r = run('--domain', arg, to);
    assert.equal(r.status, 2, `${arg}: ${r.stderr}`);
    assert.ok(/domain/.test(r.stderr), `a domain usage message: ${r.stderr}`);
    assert.ok(!existsSync(to), 'nothing installed');
  }
  assert.equal(run('--domain', from).status, 2);
});

/** A refusal: exit 1, the message names `named`, nothing installed. */
function refused(from, named) {
  const to = dest();
  const r = run('--domain', from, to);
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
  assert.equal(run('--domain', sub, to).status, 0);
  const from = source('formats');
  cpSync(sub, join(from, 'clap'), { recursive: true });
  assert.equal(run('--domain', from, to).status, 0);
  assert.deepEqual(files(join(to, 'formats')), ['catalogs/ca.json', 'clap/catalogs/ca.json', 'clap/clap.json', 'formats.json']);
  // the source of the sub-domain is changed in the install only; a reinstall of the parent leaves it
  const mark = join(to, 'formats/clap/clap.json');
  writeFileSync(mark, '{"kept":true}\n');
  rmSync(join(from, 'catalogs', 'ca.json'));
  assert.equal(run('--domain', from, to).status, 0);
  assert.equal(readFileSync(mark, 'utf8'), '{"kept":true}\n');
  assert.deepEqual(files(join(to, 'formats')), ['clap/catalogs/ca.json', 'clap/clap.json', 'formats.json']);
});

test('the package mode is unchanged: it still writes the manifest and rewrites $schema', () => {
  const to = dest();
  const from = join(SCRATCH, `pk-${n++}`);
  mkdirSync(from);
  writeFileSync(join(from, 'a.json'), '{\n  "$schema": "../schema/omx-contract.schema.json",\n  "A": 1\n}\n');
  const r = run('pkg', '1.0.0', '3', from, to);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(join(to, '3/pkg/MANIFEST.json')));
  assert.ok(readFileSync(join(to, '3/pkg/a.json'), 'utf8').includes('https://openmixer.org/schema/omx-contract/v3/'));
});
