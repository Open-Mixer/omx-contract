// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The strings section of an owner's header (docs/render.md; docs/units.md, the render shape): a sheet of strings in its
// own file, rendered as the X-macro <table>(X), one X(<prefix><FIELD>, "<field>", "<value>") per field, the first
// argument the very define a sibling header's numbers section renders (constCase: dbPerOct is DB_PER_OCT), the value
// a PARAM_UNITS const. Over a FIXTURE package (test/fixtures/package-strings), never an owner's data: the header byte
// for byte (test/golden/strings/acme_unit_ids.h, and acme_units.h with its own numbers rows only), a C consumer
// joining the two headers, the string sheet valid in its data form and in the root form a domain ships it in (its own
// x-file, the one root x-render, the ids header with scope package), and one refusal per rule, by name: a field the sibling sheet
// does not name, a value that is no PARAM_UNITS const, a read that lacks the sibling or PARAM_UNITS, a sheet that
// mixes numbers and strings, a numbers sheet of refs into the string sheet (a string sheet by what it declares, not
// by what refs resolve to) and a numbers header that reaches the string sheet, both "is not a finite number".
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { loadData, packageVersion, resolveData } from '../lib/data.mjs';
import { validateData } from '../lib/validate.mjs';
import { renderC } from '../render/c.mjs';
import { DATA, installParamDomain, ROOT, domainOwner } from './helpers.mjs';

const FIX = join(ROOT, 'test/fixtures/package-strings');
const GOLDEN = join(ROOT, 'test/golden/strings/acme_unit_ids.h');
const UNITS_GOLDEN = join(ROOT, 'test/golden/strings/acme_units.h');
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
  assert.equal(header(texts(), 'acme_units.h'), readFileSync(UNITS_GOLDEN, 'utf8'), 'the units header holds its own numbers rows only');
  assert.match(h, /^ {4}X\(ACME_UNIT_DB_PER_OCT, "dbPerOct", "dBPerOct"\)$/m, 'constCase: dbPerOct is DB_PER_OCT');
  assert.match(h, /^ {4}X\(ACME_UNIT_SEMITONE12_TET, "semitone12TET", "st"\) \\$/m);
  const units = header(texts(), 'acme_units.h');
  for (const [, name] of h.matchAll(/X\((ACME_UNIT_\w+),/g)) assert.match(units, new RegExp(`^#define ${name} \\d+u `, 'm'), `${name} is a define of acme_units.h`);
});

test('the string sheet is valid in its data form, and the numbers render does not take it', () => {
  assert.deepEqual(problems(texts()), []);
  assert.doesNotMatch(header(texts(), 'acme_units.h'), /dBPerOct/);
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
int main(void) { const char *a = unit_id(260u), *b = unit_id(14u); return a && b && a[0] == 'd' && a[2] == 'P' && b[0] == 'p' && !unit_id(999u) ? 0 : 1; }
`);
    const cc = spawnSync('cc', ['-std=c11', '-Wall', '-Wextra', '-Werror', '-nostdinc', join(dir, 'reader.c'), '-o', join(dir, 'reader')], { encoding: 'utf8' });
    assert.equal(cc.status, 0, cc.stderr);
    assert.equal(spawnSync(join(dir, 'reader')).status, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/**
 * The fixture as one domain of the owner acme, as omx-clap ships its code sheet: both sheets, each with its own x-file,
 * and the ROOT x-render (on the units file) declaring both headers. The units header reads its own file (scope file);
 * the ids header takes `scope: package`, the existing word, to reach the ids sheet in the other x-file: no new key.
 */
function rootFormDomain() {
  const u = fixture('acme-units.json');
  const i = fixture('acme-unit-ids.json');
  const sheet = (it, file) => ({ description: it.doc, 'x-kind': 'sheet', 'x-file': file, 'x-value': it.value, ...(it.docs ? { 'x-docs': it.docs } : {}) });
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://openmixer.org/contract/acme-param',
    info: { title: 'The acme fixture\'s unit codes and their standard ids', version: '1.0.0', 'x-owner': 'acme', 'x-stability': 'experimental' },
    'x-render': { c: [u.render.c[0], { ...i.render.c[0], scope: 'package' }] },
    'x-file': 'acme-units.json',
    components: { schemas: { ACME_UNITS: sheet(u.ACME_UNITS, 'acme-units.json'), ACME_UNIT_IDS: sheet(i.ACME_UNIT_IDS, 'acme-unit-ids.json') } },
  };
}

test('the root form: one domain, its root x-render declaring both headers (the ids one scope package), validates and renders both goldens', () => {
  const dir = mkdtempSync(join(tmpdir(), 'omx-strings-domain-'));
  try {
    // a contract directory holding omx-contract as make install writes it (the param domain, PARAM_UNITS, with it)
    const root = join(dir, 'cd');
    execFileSync('sh', [SH, '-x', 'scale-vectors.json', 'omx-contract', packageVersion(ROOT), DATA, root, 'data'], { stdio: 'ignore' });
    execFileSync('sh', [SH, '--domain', join(ROOT, 'contract.d/contract'), root, domainOwner(join(ROOT, 'contract.d/contract'))], { stdio: 'ignore' });
    installParamDomain(root);
    const dom = join(dir, 'contract.d', 'acme-param');
    mkdirSync(dom, { recursive: true });
    writeFileSync(join(dom, 'acme-param.json'), `${JSON.stringify(rootFormDomain(), null, 2)}\n`);
    const cli = (...a) => spawnSync(process.execPath, [CLI, ...a], { encoding: 'utf8' });
    const v = cli('validate', '--contract-dir', root, '--with-domain', dom);
    assert.equal(v.status, 0, v.stdout + v.stderr);
    const out = join(dir, 'out');
    const r = cli('render', '--target', 'c', '--contract-dir', root, '--package', 'acme', '--with-domain', dom, '--out', out);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(readFileSync(join(out, 'acme_unit_ids.h'), 'utf8'), readFileSync(GOLDEN, 'utf8'));
    // the units header holds its own numbers rows only, byte for byte as the data form renders it: no string reaches it
    assert.equal(readFileSync(join(out, 'acme_units.h'), 'utf8'), readFileSync(UNITS_GOLDEN, 'utf8'));
    // validate still refuses a key the domain format does not hold (an item-level x-render is no word of it)
    const bad = rootFormDomain();
    bad.components.schemas.ACME_UNIT_IDS['x-render'] = bad['x-render'];
    writeFileSync(join(dom, 'acme-param.json'), `${JSON.stringify(bad, null, 2)}\n`);
    const refused = cli('validate', '--contract-dir', root, '--with-domain', dom);
    assert.notEqual(refused.status, 0);
    assert.match(refused.stdout + refused.stderr, /unknown key x-render/);
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

test('sabotage: a numbers sheet whose fields are refs into the string sheet is no string sheet: refused as not a finite number', () => {
  // a sheet is a sheet of strings by what it declares, never by what its refs resolve to (data.mts r.strings)
  const refs = texts({ units: (d) => { const ids = fixture('acme-unit-ids.json').ACME_UNIT_IDS.value;
    // every field a ref, so the resolved sheet is all strings: only the declared value tells it from a string sheet
    d.ACME_UNITS.value = Object.fromEntries(Object.keys(ids).map((f) => [f, { ref: `ACME_UNIT_IDS.${f}` }])); } });
  assert.equal(refusal(refs), 'acme_units.h: ACME_UNITS.none is not a finite number');
  const out = problems(refs);
  assert.ok(out.includes('ACME_UNITS:finite:ACME_UNITS.db resolves to "dB"') && out.includes('ACME_UNITS:finite:ACME_UNITS.dbPerOct resolves to "dBPerOct"'), out.join('\n'));
  // the declared string sheet itself is still a string sheet, and the strings render does not take the refs sheet
  assert.ok(!out.some((p) => p.startsWith('ACME_UNIT_IDS:finite:')), out.join('\n'));
});

test('sabotage: a numbers header that reaches the string sheet (scope package on the units header) is refused as not a finite number', () => {
  const t = texts({ units: (d) => { d.render.c[0].scope = 'package'; } });
  assert.match(refusal(t), /^acme_units\.h: ACME_UNIT_IDS\.\w+ is not a finite number$/);
});

test('sabotage: a sheet that mixes numbers and strings, or nests a string, is refused by the schema', () => {
  const mixed = problems(texts({ ids: (d) => { d.ACME_UNIT_IDS.value.none = 0; } }));
  assert.ok(mixed.some((p) => p.startsWith('ACME_UNIT_IDS:schema:')), mixed.join('\n'));
  const nested = problems(texts({ ids: (d) => { d.ACME_UNIT_IDS.value.db = { a: 'dB' }; } }));
  assert.ok(nested.some((p) => p.startsWith('ACME_UNIT_IDS:schema:')), nested.join('\n'));
});
