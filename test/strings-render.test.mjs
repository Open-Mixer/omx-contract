// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The strings section of an owner's header (docs/render.md; docs/units.md, the render shape): a sheet of strings in its
// own file, rendered as the X-macro <table>(X), one X(<prefix><FIELD>, "<field>", "<value>") per field, the first
// argument the very define a sibling header's numbers section renders (constCase: dbPerOct is DB_PER_OCT), the value
// a PARAM_UNITS const. Over a FIXTURE package (test/fixtures/package-strings), never an owner's data: the header byte
// for byte (test/golden/strings/acme_unit_ids.h), a C consumer joining the two headers, the string sheet valid in
// its data form and as a domain item with its own x-file, and one refusal per rule, by name: a field the sibling sheet
// does not name, a value that is no PARAM_UNITS const, a read that lacks the sibling or PARAM_UNITS, and a sheet that
// mixes numbers and strings.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { SCHEMA_MAJOR } from '../lib/contract-dir.mjs';
import { loadData, packageVersion, resolveData } from '../lib/data.mjs';
import { validateData } from '../lib/validate.mjs';
import { renderC } from '../render/c.mjs';
import { DATA, installParamDomain, ROOT } from './helpers.mjs';

const FIX = join(ROOT, 'test/fixtures/package-strings');
const GOLDEN = join(ROOT, 'test/golden/strings/acme_unit_ids.h');
const CLI = join(ROOT, 'bin/omx-contract.mjs');
const SH = join(ROOT, 'tools/install-contract-dir.sh');
const UNITS = 'data/acme-units.json';
const IDS = 'data/acme-unit-ids.json';
const fixture = (f) => JSON.parse(readFileSync(join(FIX, f), 'utf8'));

/** The fixture's two files and the param domain (PARAM_UNITS), each changed by `edit(doc)` when given; `drop` leaves files out. */
function texts({ units, ids, drop = [] } = {}) {
  const u = fixture('acme-units.json');
  const i = fixture('acme-unit-ids.json');
  units?.(u);
  ids?.(i);
  const out = { [UNITS]: JSON.stringify(u), [IDS]: JSON.stringify(i), 'param/param.json': '' };
  for (const d of drop) delete out[d];
  return out;
}
const render = (t) => renderC(resolveData(loadData(DATA, t)), { pkg: 'acme' });
const header = (t, path = 'acme_unit_ids.h') => render(t).find((f) => f.path === path)?.text;
const refusal = (t) => { try { render(t); } catch (e) { return e.message; } return undefined; };
const problems = (t) => validateData(loadData(DATA, t)).map((p) => `${p.item}:${p.rule}:${p.message}`);

test('the strings section renders the golden header byte for byte, each row naming a define of the sibling header', () => {
  const h = header(texts());
  assert.equal(h, readFileSync(GOLDEN, 'utf8'));
  assert.match(h, /^ {4}X\(ACME_UNIT_DB_PER_OCT, "dbPerOct", "dB-oct"\)$/m, 'constCase: dbPerOct is DB_PER_OCT');
  assert.match(h, /^ {4}X\(ACME_UNIT_SEMITONE12_TET, "semitone12TET", "st"\) \\$/m);
  const units = header(texts(), 'acme_units.h');
  for (const [, name] of h.matchAll(/X\((ACME_UNIT_\w+),/g)) assert.match(units, new RegExp(`^#define ${name} \\d+u `, 'm'), `${name} is a define of acme_units.h`);
});

test('the string sheet is valid in its data form, and the numbers render does not take it', () => {
  assert.deepEqual(problems(texts()), []);
  assert.doesNotMatch(header(texts(), 'acme_units.h'), /dB-oct/);
});

test('a C reader joins the two headers through the row (the code define is the first argument)', { skip: spawnSync('cc', ['--version']).status !== 0 && 'no C compiler' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'omx-strings-c-'));
  try {
    for (const f of render(texts()).filter((x) => x.path.startsWith('acme_unit'))) writeFileSync(join(dir, f.path), f.text);
    writeFileSync(join(dir, 'reader.c'), `#include "acme_units.h"
#include "acme_unit_ids.h"
static const char *unit_id(unsigned code)
{
#define X(code_define, token, id) if (code == (code_define)) return id;
    ACME_UNIT_IDS(X)
#undef X
    return 0;
}
int main(void) { const char *a = unit_id(260u), *b = unit_id(14u); return a && b && a[0] == 'd' && a[2] == '-' && b[0] == 'p' && !unit_id(999u) ? 0 : 1; }
`);
    const cc = spawnSync('cc', ['-std=c11', '-Wall', '-Wextra', '-Werror', '-nostdinc', join(dir, 'reader.c'), '-o', join(dir, 'reader')], { encoding: 'utf8' });
    assert.equal(cc.status, 0, cc.stderr);
    assert.equal(spawnSync(join(dir, 'reader')).status, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/** A domain of the fixture owner acme holding one data file's sheet, its render block the file's: `{ name, doc }`. */
function sheetDomain(name, file) {
  const f = fixture(file);
  const [item, it] = Object.entries(f).find(([, v]) => v?.kind === 'sheet');
  return {
    name,
    doc: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: `https://openmixer.org/contract/${name}`,
      info: { title: `The acme fixture's ${item}`, version: '1.0.0', 'x-owner': 'acme', 'x-stability': 'experimental' },
      'x-render': f.render,
      'x-file': file,
      components: { schemas: { [item]: { description: it.doc, 'x-kind': 'sheet', 'x-file': file, 'x-value': it.value, ...(it.docs ? { 'x-docs': it.docs } : {}) } } },
    },
  };
}

test('a string sheet with its own x-file validates as a domain item, and renders through render --with-domain', () => {
  const dir = mkdtempSync(join(tmpdir(), 'omx-strings-domain-'));
  try {
    // a contract directory holding omx-contract as make install writes it (the param domain, PARAM_UNITS, with it)
    const root = join(dir, 'cd');
    execFileSync('sh', [SH, '-x', 'scale-vectors.json', 'omx-contract', packageVersion(ROOT), String(SCHEMA_MAJOR), DATA, root, 'data'], { stdio: 'ignore' });
    execFileSync('sh', [SH, '--domain', join(ROOT, 'contract.d/contract'), root], { stdio: 'ignore' });
    installParamDomain(root);
    // the owner's two domains, one file each: the units sheet and its numbers header, the ids sheet and its strings header
    const args = [];
    for (const { name, doc } of [sheetDomain('acme-units', 'acme-units.json'), sheetDomain('acme-ids', 'acme-unit-ids.json')]) {
      mkdirSync(join(dir, 'contract.d', name), { recursive: true });
      writeFileSync(join(dir, 'contract.d', name, `${name}.json`), `${JSON.stringify(doc, null, 2)}\n`);
      args.push('--with-domain', join(dir, 'contract.d', name));
    }
    const out = join(dir, 'out');
    const cli = (...a) => spawnSync(process.execPath, [CLI, ...a], { encoding: 'utf8' });
    const v = cli('validate', '--contract-dir', root, ...args);
    assert.equal(v.status, 0, v.stdout + v.stderr);
    const r = cli('render', '--target', 'c', '--contract-dir', root, '--package', 'acme', ...args, '--out', out);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(readFileSync(join(out, 'acme_unit_ids.h'), 'utf8'), readFileSync(GOLDEN, 'utf8'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('sabotage: a field the sibling sheet does not name is refused by name', () => {
  const planted = texts({ ids: (d) => { d.ACME_UNIT_IDS.value.planted = 'dB'; } });
  assert.match(refusal(planted), /^acme_unit_ids\.h: ACME_UNIT_IDS\.planted: no field of ACME_UNITS, the sheet of acme_units\.h \(numbers\.prefix ACME_UNIT_\): the row would name no define$/);
  assert.ok(problems(planted).some((p) => p.includes('render-c:acme_unit_ids.h: ACME_UNIT_IDS.planted: no field of ACME_UNITS')));
  // a field the sibling's numbers section omits renders no define either
  assert.match(refusal(texts({ ids: (d) => { d.ACME_UNIT_IDS.value.legacyRaw = 'none'; } })), /ACME_UNIT_IDS\.legacyRaw: no field of ACME_UNITS/);
});

test('sabotage: a value that is no PARAM_UNITS const (a key, a symbol, an unknown word) is refused by name', () => {
  for (const v of ['db', '%', 'decibel']) {
    assert.equal(refusal(texts({ ids: (d) => { d.ACME_UNIT_IDS.value.db = v; } })), `acme_unit_ids.h: ACME_UNIT_IDS.db: ${JSON.stringify(v)} is no const of PARAM_UNITS, a standard unit id`);
  }
});

test('sabotage: a read without the sibling header or without PARAM_UNITS is refused by name, never rendered unchecked', () => {
  assert.match(refusal(texts({ drop: [UNITS] })), /^acme_unit_ids\.h: a strings section, and no other header of its package has numbers\.prefix ACME_UNIT_/);
  assert.match(refusal(texts({ units: (d) => { d.render.c[0].numbers.prefix = 'ACME_CODE_'; } })), /no other header of its package has numbers\.prefix ACME_UNIT_/);
  assert.match(refusal(texts({ drop: ['param/param.json'] })), /^acme_unit_ids\.h: a strings section, and the read holds no PARAM_UNITS/);
});

test('sabotage: a sheet that mixes numbers and strings, or nests a string, is refused by the schema', () => {
  const mixed = problems(texts({ ids: (d) => { d.ACME_UNIT_IDS.value.none = 0; } }));
  assert.ok(mixed.some((p) => p.startsWith('ACME_UNIT_IDS:schema:')), mixed.join('\n'));
  const nested = problems(texts({ ids: (d) => { d.ACME_UNIT_IDS.value.db = { a: 'dB' }; } }));
  assert.ok(nested.some((p) => p.startsWith('ACME_UNIT_IDS:schema:')), nested.join('\n'));
});
