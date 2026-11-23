// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// PARAM_SCALES, PARAM_UNITS and PARAM_UNIT_DIMENSIONS are the items of the `param` domain (contract.d/param/param.json,
// vocabulary sorting pass V21 and V23a+b): the standard units in one place, grown to the ruled set, each with what it
// measures. The words moved out of data/primitives.json; the readers read them where they are now. Three arms:
//  (a) golden: the real reads give the golden words: lib/descriptor.mjs `PARAM_SCALE_IDS`, tools/unit-enum.mjs
//      `unitWords` (the schema's $defs.unit), the tree read the renders take (`omx-contract render`: the C enum of
//      the scales, the unit and dimension defines) against test/golden/param-units.tsv, whose first 14 rows are the
//      units data/primitives.json held, in their order, but `x`, removed for `coef` (omx-contract#167);
//  (b) the one source: the domain holds the golden words and data/primitives.json holds no PARAM_ item (arm (b), both
//      sources agree, is the fixture of test/domain-set-units.test.mjs: the 15 units as data/primitives.json held them);
//  (c) sabotage: a copy of the tool whose domain lacks `log` and `dbu` reads scales without `log`, renders no
//      OMX_PARAM_SCALES_LOG and no dBu, and its unit-enum check refuses the committed schema.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { PARAM_SCALE_IDS } from '../lib/descriptor.mjs';
import { descriptorUnitWords, unitWords } from '../tools/unit-enum.mjs';
import { ROOT } from './helpers.mjs';

const GOLDEN = readFileSync(join(ROOT, 'test/golden/param-units.tsv'), 'utf8').trimEnd().split('\n').map((l) => {
  const [key, word, symbol, dimension, scope] = l.split('\t');
  return { key, word, symbol, dimension, scope };
});
const BEFORE = JSON.parse(readFileSync(join(ROOT, 'test/fixtures/domain-set-units/primitives.json'), 'utf8'));
const DOMAIN = join(ROOT, 'contract.d/param/param.json');
const schemas = (path = DOMAIN) => JSON.parse(readFileSync(path, 'utf8')).components.schemas;
const upperSnake = (k) => k.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();

test('golden: the first 14 units are the ones data/primitives.json held, in their order, but x, removed for coef', () => {
  const held = Object.entries(BEFORE.PARAM_UNITS.words).filter(([k]) => k !== 'x');
  assert.equal(held.length, 14);
  assert.deepEqual(GOLDEN.slice(0, 14).map((g) => [g.key, g.word, g.symbol]), held.map(([k, w]) => [k, w.word, w.symbol]));
  assert.ok(!GOLDEN.some((g) => g.word === 'x'), 'x is removed (omx-contract#167)');
  // the ruled set (owner, 2026-11-20) and the resource units (Q6) are in it
  for (const s of ['dBTP', 'dBu', 'LU', 'kHz', 'MHz', 'frames', 'bpm', 'bar', 'beat', 'm', 'cm', 'mm', 'km', 'inch', 'mile', 'deg', 'midiNote', 'ratio', 'coef', 'us', 'bytes', 'ns/sample', 'count', 'flag', 'ms', 's']) {
    assert.ok(GOLDEN.some((g) => g.symbol === s), s);
  }
});

test('(a) PARAM_SCALE_IDS, the descriptor check\'s scales, are the golden ids', () => {
  assert.deepEqual(PARAM_SCALE_IDS, ['linear', 'log', 'stepped']);
});

test('(a) unitWords and descriptorUnitWords, the schema\'s $defs.unit and $defs.descriptorUnit, are the golden ids by scope, in order', () => {
  // C2 (coordinator %4, 2026-11-23, plugin-hostd#215 D1/D2): the schema enumerates the PARAM_UNITS ids, the word a
  // descriptor and a reply carry; x-symbol ('%', 'dB/oct') is the display rendering and never a wire word
  const param = GOLDEN.filter((g) => g.scope === 'param').map((g) => g.word);
  const own = [...GOLDEN.filter((g) => g.scope === 'descriptor').map((g) => g.word), 'unknown'];
  assert.deepEqual(param, [...Object.values(BEFORE.PARAM_UNITS.words).map((w) => w.word).filter((u) => u !== 'x'), 'coef'], 'the param scope is the 15 of before, x removed for coef (omx-contract#167)');
  for (const symbol of ['%', '', 'dB/oct', 'dB/s', 'ns/sample', 'count']) {
    assert.ok(![...param, ...own].includes(symbol), `the symbol ${JSON.stringify(symbol)} is no wire word`);
  }
  assert.deepEqual(unitWords(ROOT), param);
  assert.deepEqual(descriptorUnitWords(ROOT), own);
  const defs = JSON.parse(readFileSync(join(ROOT, 'schema/omx-contract.schema.json'), 'utf8')).$defs;
  assert.deepEqual(defs.unit.enum, param);
  assert.deepEqual(defs.descriptorUnit.anyOf, [{ $ref: '#/$defs/unit' }, { enum: own }]);
});

test('(a) the committed renders carry the golden words: the scales enum, a define per unit and per dimension', () => {
  const limits = readFileSync(join(ROOT, 'include/omxcontract/omx_contract_limits.h'), 'utf8');
  assert.match(limits, /OMX_PARAM_SCALES_LINEAR = 0,[^\n]*\n {2}OMX_PARAM_SCALES_LOG = 1,[^\n]*\n {2}OMX_PARAM_SCALES_STEPPED = 2,/);
  assert.match(limits, /#define OMX_PARAM_SCALES_DEFAULT OMX_PARAM_SCALES_LINEAR/);
  const vocab = readFileSync(join(ROOT, 'include/omxcontract/omx_vocabulary.h'), 'utf8');
  // OMX_PARAM_UNITS_CLAP_ENCODED_* are the defines of the words item PARAM_UNITS_CLAP_ENCODED (V23d B2), not of PARAM_UNITS
  const defines = [...vocab.matchAll(/^#define OMX_PARAM_UNITS_(\w+) "([^"]*)"/gm)].filter((m) => !m[1].endsWith('_TEXT_EN') && !m[1].startsWith('CLAP_ENCODED_')).map((m) => [m[1], m[2]]);
  assert.deepEqual(defines, GOLDEN.map((g) => [upperSnake(g.key), g.word]));
  for (const d of new Set(GOLDEN.map((g) => g.dimension))) assert.match(vocab, new RegExp(`#define OMX_PARAM_UNIT_DIMENSIONS_\\w+ "${d}"`), d);
  for (const sc of ['param', 'descriptor']) assert.match(vocab, new RegExp(`#define OMX_PARAM_UNIT_SCOPES_${sc.toUpperCase()} "${sc}"`), sc);
});

test('(b) the domain holds the golden words, each unit\'s dimension a word of PARAM_UNIT_DIMENSIONS; data/ holds no PARAM_ item', () => {
  const s = schemas();
  assert.deepEqual(s.PARAM_UNITS.oneOf.map((w) => ({ key: w.title, word: w.const, symbol: w['x-symbol'], dimension: w['x-dimension'], scope: w['x-group'] })), GOLDEN);
  assert.equal(s.PARAM_UNITS['x-dimensions'], 'PARAM_UNIT_DIMENSIONS');
  assert.equal(s.PARAM_UNITS['x-groups'], 'PARAM_UNIT_SCOPES');
  const dims = s.PARAM_UNIT_DIMENSIONS.oneOf.map((w) => w.const);
  for (const g of GOLDEN) assert.ok(dims.includes(g.dimension), g.key);
  assert.deepEqual(s.PARAM_SCALES.oneOf.map((w) => w.const), ['linear', 'log', 'stepped']);
  assert.equal(s.PARAM_SCALES['x-default'], 'linear');
  assert.ok(!existsSync(join(ROOT, 'data/primitives.json')), 'data/primitives.json is gone: its last item, READOUT_RATE_HZ, went to omx-dsp (V22)');
});

/** The tool, copied, with `log` gone from PARAM_SCALES and `dbu` from PARAM_UNITS in its domain. */
function sabotaged(run) {
  const dir = mkdtempSync(join(tmpdir(), 'param-domain-'));
  try {
    for (const d of ['bin', 'lib', 'render', 'tools', 'schema', 'data', 'contract.d', 'include', 'catalogs', 'share', 'package.json']) cpSync(join(ROOT, d), join(dir, d), { recursive: true });
    symlinkSync(join(ROOT, 'node_modules'), join(dir, 'node_modules'));
    const file = join(dir, 'contract.d/param/param.json');
    const doc = JSON.parse(readFileSync(file, 'utf8'));
    for (const [item, word] of [['PARAM_SCALES', 'log'], ['PARAM_UNITS', 'dBu']]) {
      const words = doc.components.schemas[item].oneOf;
      const at = words.findIndex((w) => w.const === word);
      assert.ok(at >= 0, `${item} has ${word}`);
      words.splice(at, 1);
      words.forEach((w, i) => { w['x-code'] = i; });
    }
    writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`);
    return run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('(c) sabotage: a domain without log and dBu: the scales lack log, the render lacks both, the unit-enum check refuses', () => {
  sabotaged((dir) => {
    const ids = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', `import { PARAM_SCALE_IDS } from ${JSON.stringify(join(dir, 'lib/descriptor.mjs'))}; console.log(JSON.stringify(PARAM_SCALE_IDS));`], { encoding: 'utf8' }));
    assert.deepEqual(ids, ['linear', 'stepped'], 'the descriptor check reads its scales from the domain');
    const out = join(dir, 'out');
    execFileSync(process.execPath, [join(dir, 'bin/omx-contract.mjs'), 'render', '--target', 'c', '--out', out], { encoding: 'utf8', cwd: dir });
    assert.ok(!readFileSync(join(out, 'omxcontract/omx_contract_limits.h'), 'utf8').includes('OMX_PARAM_SCALES_LOG'), 'the render reads the scales from the domain');
    assert.ok(!readFileSync(join(out, 'omxcontract/omx_vocabulary.h'), 'utf8').includes('OMX_PARAM_UNITS_DBU '), 'the render reads the units from the domain');
    const r = spawnSync(process.execPath, [join(dir, 'tools/unit-enum.mjs'), '--check', '--root', dir], { encoding: 'utf8' });
    assert.equal(r.status, 1, 'unit-enum reads the units from the domain');
    assert.match(r.stderr, /\$defs\.descriptorUnit/);
    assert.ok(!descriptorUnitWords(dir).includes('dBu'));
  });
});

// The meaning of each scale, as plugin-hostd-protocol's tools/param-scales-gen.py reads it (the word's `description`,
// first letter lowered, no final stop) into the rows of PHD_PARAM_SCALES. The meanings were protocol.h's own before the
// sorting pass moved the item (include/plugin-hostd/protocol.h at 710a745^, lines 1068-1071); a move carries every field.
const SCALE_MEANINGS = [
  ['linear', 'The value is linear in position.'],
  ['log', 'The value is geometric in position; both bounds are positive.'],
  ['stepped', 'The whole numbers from min to max, step 1.'],
];

/** The PARAM_SCALES words that carry no `description`, by const. */
const scalesWithoutMeaning = (s) => s.PARAM_SCALES.oneOf.filter((w) => typeof w.description !== 'string' || w.description === '').map((w) => w.const);

test('(d) every PARAM_SCALES word carries its meaning, the description the protocol rows are written from', () => {
  const s = schemas();
  assert.deepEqual(scalesWithoutMeaning(s), [], 'a PARAM_SCALES word with no description');
  assert.deepEqual(s.PARAM_SCALES.oneOf.map((w) => [w.const, w.description]), SCALE_MEANINGS);
});

test('(d) sabotage: a PARAM_SCALES word whose description is removed is named', () => {
  const s = schemas();
  delete s.PARAM_SCALES.oneOf.find((w) => w.const === 'log').description;
  assert.deepEqual(scalesWithoutMeaning(s), ['log']);
});
