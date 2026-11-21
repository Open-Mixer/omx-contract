// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// A classic set may name, for each id, the standard unit it stands for (`standard`, coordinator ruling 2026-11-21,
// for omx-dsp's CURVE_UNITS): a list of PARAM_UNITS consts of any group, one per id in id order. A wrong length, a
// const PARAM_UNITS lacks and the field on a kind that is no set are refused by name. Every render carries it: json
// as `standard`, ts as `<SET>_STANDARD` (id to const), C as `OMX_<SET>_STANDARD[OMX_<SET>_COUNT]`.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { loadData, resolveData } from '../lib/data.mjs';
import { validateData } from '../lib/validate.mjs';
import { renderC } from '../render/c.mjs';
import { renderJson } from '../render/json.mjs';
import { renderTs } from '../render/ts.mjs';
import { scratchDir, texts } from './helpers.mjs';

// a planted set of three curve-like words, each with its standard id (coef is of the descriptor group)
const plant = (fn) => texts((d) => {
  const s = { kind: 'set', doc: 'Planted units.', ids: ['hz', 'db', 'coef'], standard: ['Hz', 'dB', 'coef'] };
  fn?.(s, d);
  d['data/rates.json'].DEMO_UNITS = s;
});
const problems = (t) => validateData(loadData(null, t)).map((p) => `${p.item}:${p.rule}: ${p.message}`);

test('a set with a standard id per id is valid', () => {
  assert.deepEqual(problems(plant()), []);
});

test('a wrong length is refused by name', () => {
  const p = problems(plant((s) => { s.standard = ['Hz', 'dB']; }));
  assert.ok(p.some((x) => /^DEMO_UNITS:set-standard: 2 standard ids for 3 ids/.test(x)), p.join('\n'));
});

test('a const PARAM_UNITS lacks is refused by name', () => {
  const p = problems(plant((s) => { s.standard = ['Hz', 'decibel', 'coef']; }));
  assert.ok(p.some((x) => /^DEMO_UNITS:set-standard: .*"decibel".*db.*PARAM_UNITS/.test(x)), p.join('\n'));
});

test('the field on a kind that is no set is refused', () => {
  const p = problems(texts((d) => { d['data/rates.json'].DEMO_SCALAR = { kind: 'scalar', doc: 'Planted.', unit: 'Hz', value: 1, standard: ['Hz'] }; }));
  assert.ok(p.some((x) => /^DEMO_SCALAR:schema/.test(x)), p.join('\n'));
});

const planted = () => resolveData(loadData(null, plant()));

test('json: the set carries its standard ids', () => {
  const it = JSON.parse(renderJson(planted(), '0.0.0')[0].text).items.DEMO_UNITS;
  assert.deepEqual([it.value, it.standard], [['hz', 'db', 'coef'], ['Hz', 'dB', 'coef']]);
});

test('ts: <SET>_STANDARD maps each id to its standard id', () => {
  const [js, dts] = renderTs(planted()).map((f) => f.text);
  assert.match(js, /^export const DEMO_UNITS_STANDARD = \{\n {2}"hz": "Hz",\n {2}"db": "dB",\n {2}"coef": "coef"\n\};$/m);
  assert.match(dts, /^export declare const DEMO_UNITS_STANDARD: \{\n {2}readonly hz: "Hz";\n {2}readonly db: "dB";\n {2}readonly coef: "coef";\n\};$/m);
});

test('c: OMX_<SET>_STANDARD is a table by enumerator, documented', () => {
  const h = renderC(planted())[0].text;
  assert.match(h, /^\/\*\* The standard unit \(a PARAM_UNITS const\) each id of DEMO_UNITS stands for, by enumerator\. \*\/\nstatic const char \*const OMX_DEMO_UNITS_STANDARD\[OMX_DEMO_UNITS_COUNT\] = \{"Hz", "dB", "coef"\};$/m);
});

const cc = (process.env.CC ?? 'cc').split(' ');
test('c: the table compiles and reads by enumerator', { skip: spawnSync(cc[0], [...cc.slice(1), '--version']).status !== 0 && 'no cc' }, () => {
  const dir = scratchDir('omx-set-standard-');
  mkdirSync(join(dir, 'omxcontract'));
  writeFileSync(join(dir, 'omxcontract/omx_contract_limits.h'), renderC(planted())[0].text);
  writeFileSync(join(dir, 'main.c'), [
    '#include <string.h>',
    '#include <omxcontract/omx_contract_limits.h>',
    'int main(void) {',
    '  if (strcmp(OMX_DEMO_UNITS_STANDARD[OMX_DEMO_UNITS_HZ], "Hz") != 0) return 1;',
    '  if (strcmp(OMX_DEMO_UNITS_STANDARD[OMX_DEMO_UNITS_COEF], "coef") != 0) return 2;',
    '  return 0;',
    '}',
  ].join('\n'));
  execFileSync(cc[0], [...cc.slice(1), '-std=c11', '-Wall', '-Wextra', '-Werror', '-Wno-unused-function', '-Wno-unused-variable', `-I${dir}`, join(dir, 'main.c'), '-o', join(dir, 'main'), '-lm']);
  execFileSync(join(dir, 'main'));
});
