// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The unit gate (omx-contract#193, decision 2 of plugin-hostd#215, owner ruling 2026-11-23): every unit a file states,
// and every lookup value of a map row whose word is a unit word, is a PARAM_UNITS standard symbol. `omx-contract units
// --check <path>...` runs it over any owner's own files, whatever their shape, so a unit with no standard id fails that
// owner's CI instead of a wave line (chain 3 stopped at line 53 on omx-dsp's "x"); `validate` holds a format map's
// unit lookups by rule map-unit. Which keys and words are unit-valued is read from the schema (each property whose
// schema is $defs.unit or $defs.descriptorUnit, and each descriptor word whose path ends at one), never listed here.
//
// Fixtures: omx-dsp 1ed8a2d's data/kernels/rotary.json (ROTARY_ACCEL_RANGE in "x", the file chain 3 refused) and
// 804cbc9's (in coef), verbatim; the domain-map fixtures, plugin-hostd 58b7145's two format tables (coef -> "x").
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { loadData } from '../lib/data.mjs';
import { unitGate, unitProblems } from '../lib/units.mjs';
import { validateData } from '../lib/validate.mjs';
import { ROOT, texts } from './helpers.mjs';

const FIX = join(ROOT, 'test/fixtures/unit-lookup');
const SCRATCH = mkdtempSync(join(tmpdir(), 'omx-unit-lookup-'));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));
const cli = (...a) => spawnSync(process.execPath, [join(ROOT, 'bin/omx-contract.mjs'), ...a], { encoding: 'utf8' });
const param = JSON.parse(readFileSync(join(ROOT, 'contract.d/param/param.json'), 'utf8')).components.schemas.PARAM_UNITS.oneOf;

test('the gate reads its keys, its words and its symbols from the schema, and the symbols are PARAM_UNITS\'s', () => {
  const g = unitGate();
  assert.ok(g.unitKeys.has('unit'), 'travel.unit and the items\' unit are unit-valued');
  assert.ok(g.unitMapKeys.has('choiceUnits'), 'a descriptor\'s choiceUnits maps names to units');
  assert.ok(g.isUnitWord('controls[].travel.unit'), 'the unit descriptor word, found by walking the descriptor schema');
  assert.ok(!g.isUnitWord('controls[].travel.scale') && !g.isUnitWord('plugin.doc') && !g.isUnitWord('controls[].nope.unit'));
  assert.deepEqual([...g.symbols].sort(), param.map((w) => w['x-symbol']).sort(), 'the symbols are PARAM_UNITS\'s x-symbol, one for one');
  assert.ok(!g.symbols.has('x') && !g.symbols.has('unknown'));
});

test('omx-dsp 1ed8a2d\'s rotary kernel is refused at its "x", file:line named; 804cbc9\'s in coef passes', () => {
  const bad = cli('units', '--check', join(FIX, 'omx-dsp-1ed8a2d'));
  assert.equal(bad.status, 1, bad.stderr);
  assert.match(bad.stderr, /omx-dsp-1ed8a2d\/kernels\/rotary\.json:106: \/controls\/\d+\/travel\/unit: "x" is no PARAM_UNITS standard symbol/);
  assert.equal(bad.stderr.trim().split('\n').filter((l) => l.includes('is no PARAM_UNITS')).length, 1, bad.stderr);
  const good = cli('units', '--check', join(FIX, 'omx-dsp-804cbc9'));
  assert.equal(good.status, 0, good.stderr);
  assert.match(good.stdout, /1 file, 20 units, 0 refused/);
});

test('a map row whose word is the unit word has each lookup value a symbol: plugin-hostd 58b7145\'s coef -> "x" is refused', () => {
  for (const f of ['clap', 'lv2']) {
    const r = cli('units', '--check', join(ROOT, `test/fixtures/domain-map/${f}.json`));
    assert.equal(r.status, 1, `${f}: ${r.stderr}`);
    assert.match(r.stderr, /\/values\/(coef|units:coef): "x" is no PARAM_UNITS standard symbol/, `${f}: ${r.stderr}`);
  }
});

test('a lookup refuses unknown and the lowercase spelling; a unit key takes unknown; a non-string unit is not a unit', () => {
  const doc = {
    controls: [{ travel: { unit: 'unknown' } }, { travel: { unit: 'dB/oct' } }],
    choiceUnits: { mode: 'Hz', shape: 'unknown' },
    rows: {
      a: { word: { word: 'controls[].travel.unit', transform: 'lookup', values: { db: 'dB', hz: 'hz', no: 'unknown', pc: '%', none: '' } } },
      b: { 'x-word': { word: 'controls[].travel.unit', transform: 'lookup', values: { k: 'kHz', m: 'mhz' } } },
      c: { word: { word: 'controls[].travel.scale', transform: 'lookup', values: { lin: 'whatever' } } },
    },
    items: { A: { 'x-unit': 'x' }, B: { unit: 3 } },
  };
  const got = unitProblems(doc).map((p) => `${p.pointer}=${p.value}`);
  assert.deepEqual(got.sort(), ['/choiceUnits/shape=unknown', '/items/A/x-unit=x', '/rows/a/word/values/hz=hz', '/rows/a/word/values/no=unknown', '/rows/b/x-word/values/m=mhz'].sort());
});

test('the gate is no pass on nothing: no path, a missing path or a file that is no JSON exits 2', () => {
  assert.equal(cli('units', '--check').status, 2);
  assert.equal(cli('units', '--check', join(SCRATCH, 'absent')).status, 2);
  writeFileSync(join(SCRATCH, 'broken.json'), '{ "unit": ');
  assert.equal(cli('units', '--check', join(SCRATCH, 'broken.json')).status, 2);
  writeFileSync(join(SCRATCH, 'empty.json'), '{}');
  const none = cli('units', '--check', join(SCRATCH, 'empty.json'));
  assert.equal(none.status, 2, 'a tree with no unit at all is a wrong path, never a pass');
  assert.match(none.stderr, /no unit/);
});

/** A format map in a file of its own (rule map-unit, validate). */
const MAP = 'data/maps/lv2.json';
const mapDoc = (values) => ({
  $schema: '../../schema/omx-contract.schema.json',
  ACME_LV2_MAP: {
    kind: 'formatMap', doc: 'How an LV2 scan becomes a descriptor.', format: 'lv2',
    rows: { 'units:unit': { term: 'LV2_UNITS_TERMS#unit', word: { word: 'controls[].travel.unit', transform: 'lookup', values } } },
  },
});
const mapUnit = (values) => validateData(loadData(null, texts((d) => { d[MAP] = mapDoc(values); }))).filter((p) => p.rule === 'map-unit').map((p) => p.message);

test('validate rule map-unit: a format map\'s unit lookup values are PARAM_UNITS symbols', () => {
  assert.deepEqual(mapUnit({ 'units:db': 'dB', 'units:hz': 'Hz', 'units:pc': '%', 'units:coef': 'coef' }), []);
  assert.deepEqual(mapUnit({ 'units:db': 'dB', 'units:coef': 'x' }), ['units:unit: units:coef -> "x" is no PARAM_UNITS standard symbol: a unit with no standard id is a dropped row (plugin-hostd#215, decision 2)']);
  assert.equal(mapUnit({ 'units:hz': 'hz' }).length, 1, 'the lowercase spelling is no symbol');
});
