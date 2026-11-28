// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The items the vocabulary sorting pass moves out of omx-contract, each to the new home its row names, leave here
// (docs/ownership-map.md): V22 READOUT_RATE_HZ (to omx-dsp, `data/primitives/readout.json`), V25 RT_HARD_TARGET and the oracle
// rate lists (to omx-dsp; the standard rates and quanta stay), V26 CURVE_AXES and CURVE_KINDS (to omx-dsp) and V24
// PLUGIN_FEATURE_* (to plugin-db, its `plugin-feature` domain), V1 PANEL_FAMILIES, PANEL_STANDARD_WIDGETS, PANEL_WIDGETS,
// PANEL_DISPLAY_KINDS, PANEL_DISPLAY_SOURCES and PANEL_PLACEMENTS (to omx-panel, its `panel` domain; data/panel.json goes)
// and V23d OMX_PARAM_CONTRACT_UNITS (to omx-clap, with omx_param_units.h). Each is gone from the read of data/ (through the
// loader every render takes), from the committed renders, from the catalogs and from the ownership lists, and its
// file is gone when nothing else was in it. Sabotage arm: the same checks over a copy of data/ that still holds
// READOUT_RATE_HZ name it.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
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
  V1: ['PANEL_FAMILIES', 'PANEL_STANDARD_WIDGETS', 'PANEL_WIDGETS', 'PANEL_DISPLAY_KINDS', 'PANEL_DISPLAY_SOURCES', 'PANEL_PLACEMENTS'],
  V24: ['PLUGIN_FEATURE_AUDIO_EFFECT', 'PLUGIN_FEATURE_INSTRUMENT', 'PLUGIN_FEATURE_NOTE_EFFECT', 'PLUGIN_FEATURE_ANALYZER', 'PLUGIN_FEATURE_OTHER'],
  V23d: ['OMX_PARAM_CONTRACT_UNITS'],
};
const GONE = Object.values(ROWS).flat();
const hasCc = () => spawnSync('cc', ['--version']).status === 0;
const RENDERS = ['include/omxcontract/omx_contract.h', 'include/omxcontract/omx_vocabulary.h', 'share/omx-contract/omx-contract.json', 'share/omx-contract/omx-vocabulary.schema.json', 'test/golden/ts/omx-contract.d.ts', 'test/golden/ts/omx-contract.js'];
const LANGS = ['ca', 'de', 'es', 'fr', 'it', 'pt'];

/** The name `n` as a whole name (CLAP_PLUGIN_FEATURE_ANALYZER, a CLAP term, is no PLUGIN_FEATURE_ANALYZER; OMX_READOUT_RATE_HZ is READOUT_RATE_HZ). */
const named = (n) => new RegExp(`(^|[^A-Z_]|OMX_)${n}([^A-Z_]|_[A-Z]|$)`, 'm');

/** The leaving items still in the read of `data`. */
const inRead = (data) => GONE.filter((n) => loadData(data).items.has(n));

test('the leaving items are in no file of data/, read through the loader', () => {
  assert.deepEqual(inRead(DATA), []);
  for (const f of ['primitives.json', 'curves.json', 'plugin-features.json', 'panel.json', 'param-contract.json']) assert.ok(!existsSync(join(DATA, f)), `data/${f} held only leaving items`);
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

// V27a: the LV2 terms are plugin-db's `lv2` domain. The lv2 formats directory leaves, and the term-to-resource mapping goes with
// the terms: RESOURCE_* (which stays here this pass) names no LV2 term in a word's `from` (coordinator, 2026-11-20).
test('V27a: no LV2 terms item in the read, no lv2 formats directory, and no RESOURCE_ word takes an LV2 term', () => {
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
  // the old names are built from parts: this test asserts they are absent, so the literal never stands in the tree
  const was = 'omx-clap-' + 'core';
  const old = new RegExp([`lib${was}`, `${was}-(devel|contract|hosting|vocabulary)`, 'omx_clap_core', 'OMX_CLAP_CORE_VOCABULARY', `contract\\.d/3/${was}`, `share/${was}`, `--package ${was}`, `pkg-config ${was}`].join('|'));
  const files = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8' }).split('\n').filter((f) => f && !['debian/changelog', 'packaging/omx-contract.spec', 'CHANGELOG.md', 'test/sorting-removals.test.mjs'].includes(f));
  const hits = files.filter((f) => { try { return old.test(readFileSync(join(ROOT, f), 'utf8')); } catch { return false; } });
  assert.deepEqual(hits, []);
});

// V23d: the unit codes of org.openmixer.param-contract/1 are a CLAP particular, and the sheet moves to omx-clap in ONE
// step of the chain-3 omx-contract layer (coordinator ruling B1, 2026-11-22: no window in which both serve it, no
// rename, no alias): the item, data/param-contract.json and its header omx_param_units.h leave together, and a consumer
// that still includes the header here fails to build, naming it. omx-clap's own header carries the same defines.
test('V23d: OMX_PARAM_CONTRACT_UNITS, data/param-contract.json and omx_param_units.h are gone, and nothing installs the header', () => {
  assert.ok(!loadData(DATA).items.has('OMX_PARAM_CONTRACT_UNITS'));
  assert.ok(!existsSync(join(DATA, 'param-contract.json')));
  assert.ok(!existsSync(join(ROOT, 'include/omxcontract/omx_param_units.h')));
  for (const f of ['Makefile', 'debian/libomx-contract-dev.install', 'packaging/omx-contract.spec']) {
    const text = readFileSync(join(ROOT, f), 'utf8').split('%changelog')[0];
    assert.ok(!text.includes('omx_param_units.h'), `${f} names omx_param_units.h`);
  }
});

test('V23d: a consumer that includes omxcontract/omx_param_units.h fails to build, naming the header', { skip: !hasCc() && 'no C compiler' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'omx-v23d-'));
  try {
    // -nostdinc: only this tree's include/ is searched, never a header an older release installed on the build host
    const cc = (name) => spawnSync('cc', ['-std=c11', '-nostdinc', '-fsyntax-only', '-I', join(ROOT, 'include'), join(dir, name)], { encoding: 'utf8' });
    writeFileSync(join(dir, 'consumer.c'), '#include <omxcontract/omx_vocabulary.h>\n#include <omxcontract/omx_param_units.h>\nint main(void) { return (int)OMX_CLAP_UNIT_DB; }\n');
    const r = cc('consumer.c');
    assert.notEqual(r.status, 0, 'the old header still builds');
    assert.match(r.stderr, /omxcontract\/omx_param_units\.h/);
    // positive control: the same consumer without the old header builds
    writeFileSync(join(dir, 'ok.c'), '#include <omxcontract/omx_vocabulary.h>\nint main(void) { return OMX_PARAM_UNITS_COUNT > 0u ? 0 : 1; }\n');
    const ok = cc('ok.c');
    assert.equal(ok.status, 0, ok.stderr);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
