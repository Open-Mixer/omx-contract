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

// V27a: the LV2 terms are plugin-db's `lv2` domain. data/formats/lv2 leaves, and the term-to-resource mapping goes with
// the terms: RESOURCE_* (which stays here this pass) names no LV2 term in a word's `from` (coordinator, 2026-11-20).
test('V27a: no LV2 terms item in the read, no data/formats/lv2, and no RESOURCE_ word takes an LV2 term', () => {
  const data = loadData(DATA);
  assert.deepEqual([...data.items.keys()].filter((n) => /^LV2_.*_TERMS$/.test(n)), []);
  assert.ok(!existsSync(join(DATA, 'formats/lv2')));
  const from = [...data.items.values()].filter((i) => i.name.startsWith('RESOURCE_')).flatMap((i) => Object.values(i.item.words ?? {}).flatMap((w) => w.from ?? []));
  assert.deepEqual(from.filter((f) => f.startsWith('LV2_')), []);
});

// V27b: the CLAP terms are omx-clap's `clap` domain. data/formats/clap leaves, and the CLAP entries of the resource
// words' `from` go with it (coordinator, 2026-11-20), so a RESOURCE_ word takes no format term at all.
test('V27b: no CLAP terms item in the read, no data/formats/clap, and no RESOURCE_ word takes a format term', () => {
  const data = loadData(DATA);
  assert.deepEqual([...data.items.keys()].filter((n) => /^CLAP_.*_TERMS$/.test(n)), []);
  assert.ok(!existsSync(join(DATA, 'formats')));
  const resource = [...data.items.values()].filter((i) => i.name.startsWith('RESOURCE_'));
  assert.ok(resource.length > 0, 'positive control: the RESOURCE_ items stay this pass');
  assert.deepEqual(resource.flatMap((i) => Object.values(i.item.words ?? {}).flatMap((w) => w.from ?? [])), []);
});

// The CLAP core's packages are omx-clap (coordinator, 2026-11-20): omx-clap-contract, omx-clap-devel and
// libomx-clap-dev, pkg-config omx-clap, share/omx-clap, contract.d/3/omx-clap, omx_clap_vocabulary.h and
// omx_clap_host_verbs.h. No file of this tree names an old package spelling, the release history aside (the repository
// keeps its name: a citation omx-clap-core:<path> or omx-clap-core#N is the repository's).
test('the omx-clap package names: no old package spelling outside the release history', async () => {
  const { execFileSync } = await import('node:child_process');
  const old = /libomx-clap-core|omx-clap-core-(devel|contract|hosting|vocabulary)|omx_clap_core|OMX_CLAP_CORE_VOCABULARY|contract\.d\/3\/omx-clap-core|share\/omx-clap-core|--package omx-clap-core|pkg-config omx-clap-core/;
  const files = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8' }).split('\n').filter((f) => f && !['debian/changelog', 'packaging/omx-contract.spec', 'CHANGELOG.md', 'test/sorting-removals.test.mjs'].includes(f));
  const hits = files.filter((f) => { try { return old.test(readFileSync(join(ROOT, f), 'utf8')); } catch { return false; } });
  assert.deepEqual(hits, []);
});

// V23d: the unit codes of org.openmixer.param-contract/1 are a CLAP particular, ruled to move to omx-clap. Not in this
// pass (coordinator ruling, 2026-11-21): the sheet keeps its one home here, and the move is ONE change later, with the
// console's reader switch (the sheet moves, every reader switches, and this copy is removed together). Until then the
// sheet, its file and its render are present.
test('V23d: OMX_PARAM_CONTRACT_UNITS, data/param-contract.json and omx_param_units.h stay until the console switches', () => {
  assert.ok(loadData(DATA).items.has('OMX_PARAM_CONTRACT_UNITS'));
  assert.ok(existsSync(join(DATA, 'param-contract.json')));
  assert.ok(existsSync(join(ROOT, 'include/omxcontract/omx_param_units.h')));
  assert.match(readFileSync(join(ROOT, 'include/omxcontract/omx_param_units.h'), 'utf8'), /^#define OMX_CLAP_UNIT_DB 13u /m);
});
