// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The items the vocabulary sorting pass moves out of omx-contract, each to the new home its row names, leave here
// (docs/ownership-map.md): V22 READOUT_RATE_HZ (to omx-dsp, a `readout` domain), V25 RT_HARD_TARGET and the oracle
// rate lists (to omx-dsp; the standard rates and quanta stay), V26 CURVE_AXES and CURVE_KINDS (to omx-dsp) and V24
// PLUGIN_FEATURE_* (to plugin-db, its `plugin-feature` domain). Each is gone from the read of data/ (through the
// loader every render takes), from the committed renders, from the catalogs and from the ownership lists, and its
// file is gone when nothing else was in it. Sabotage arm: the same checks over a copy of data/ that still holds
// READOUT_RATE_HZ name it.
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { loadData } from '../lib/data.mjs';
import { DATA, ROOT } from './helpers.mjs';

const ROWS = {
  V22: ['READOUT_RATE_HZ'],
  V25: ['RT_HARD_TARGET', 'ORACLE_FLOOR_RATES', 'ORACLE_FULL_RATES'],
  V26: ['CURVE_AXES', 'CURVE_KINDS'],
  V24: ['PLUGIN_FEATURE_AUDIO_EFFECT', 'PLUGIN_FEATURE_INSTRUMENT', 'PLUGIN_FEATURE_NOTE_EFFECT', 'PLUGIN_FEATURE_ANALYZER', 'PLUGIN_FEATURE_OTHER'],
};
const GONE = Object.values(ROWS).flat();
const RENDERS = ['include/omxcontract/omx_contract_limits.h', 'include/omxcontract/omx_vocabulary.h', 'share/omx-contract/omx-contract.json', 'share/omx-contract/omx-vocabulary.schema.json', 'test/golden/ts/omx-contract.d.ts', 'test/golden/ts/omx-contract.js'];
const LANGS = ['ca', 'de', 'es', 'fr', 'it', 'pt'];

/** The name `n` as a whole name (CLAP_PLUGIN_FEATURE_ANALYZER, a CLAP term, is no PLUGIN_FEATURE_ANALYZER; OMX_READOUT_RATE_HZ is READOUT_RATE_HZ). */
const named = (n) => new RegExp(`(^|[^A-Z_]|OMX_)${n}([^A-Z_]|_[A-Z]|$)`, 'm');

/** The leaving items still in the read of `data`. */
const inRead = (data) => GONE.filter((n) => loadData(data).items.has(n));

test('the leaving items are in no file of data/, read through the loader', () => {
  assert.deepEqual(inRead(DATA), []);
  for (const f of ['primitives.json', 'curves.json', 'plugin-features.json']) assert.ok(!existsSync(join(DATA, f)), `data/${f} held only leaving items`);
  const rates = JSON.parse(readFileSync(join(DATA, 'rates.json'), 'utf8'));
  assert.ok(rates.STANDARD_SAMPLE_RATES && rates.STANDARD_QUANTA, 'the standard rates and quanta stay (V25)');
});

test('no committed render, catalog or ownership list names a leaving item', () => {
  for (const f of RENDERS) {
    const text = readFileSync(join(ROOT, f), 'utf8');
    for (const n of GONE) assert.ok(!named(n).test(text), `${f} names ${n}`);
  }
  for (const l of LANGS) {
    const keys = Object.keys(JSON.parse(readFileSync(join(ROOT, 'catalogs', `${l}.json`), 'utf8')).messages ?? {});
    for (const n of GONE) assert.ok(!keys.some((k) => k.startsWith(`${n}.`)), `catalogs/${l}.json translates ${n}`);
  }
  for (const f of ['ownership/owned.txt', 'ownership/moving-out.txt', 'ownership/words.json']) {
    const text = readFileSync(join(ROOT, f), 'utf8');
    for (const n of GONE) assert.ok(!named(n).test(text), `${f} names ${n}`);
  }
});

test('sabotage: a data/ that still holds READOUT_RATE_HZ is named', () => {
  const dir = mkdtempSync(join(tmpdir(), 'omx-removals-'));
  try {
    cpSync(DATA, join(dir, 'data'), { recursive: true });
    cpSync(join(ROOT, 'schema'), join(dir, 'schema'), { recursive: true });
    cpSync(join(ROOT, 'contract.d/param'), join(dir, 'contract.d/param'), { recursive: true });
    writeFileSync(join(dir, 'data/planted.json'), JSON.stringify({ $schema: '../schema/omx-contract.schema.json', READOUT_RATE_HZ: { kind: 'scalar', since: '1.0.0', doc: 'planted', unit: 'Hz', value: 50 } }));
    assert.deepEqual(inRead(join(dir, 'data')), ['READOUT_RATE_HZ']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
