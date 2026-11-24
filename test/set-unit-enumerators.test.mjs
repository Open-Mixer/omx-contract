// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// An id of a set that is a PARAM_UNITS const names its C enumerator from the id's PARAM_UNITS title, the stem
// OMX_PARAM_UNITS_<TITLE> uses: dB is _DB, never _D_B (docs/render.md, ruling of 2026-11-23, omx-contract#206), in a
// set of units or a mixed one. Any other id is its upper snake case.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadData, resolveData } from '../lib/data.mjs';
import { renderC } from '../render/c.mjs';
import { texts } from './helpers.mjs';

const header = (ids) => renderC(resolveData(loadData(null, texts((d) => {
  d['data/rates.json'].DEMO_UNITS = { kind: 'set', doc: 'Planted.', ids };
}))))[0].text;
const enumerators = (h) => [...h.matchAll(/^ {2}(OMX_DEMO_UNITS_\w+) = \d+,/gm)].map((m) => m[1]);

test('a unit set: dB is _DB, kHz _KHZ, dBFS _DBFS, dBu _DBU, dBTP _DBTP, dBPerOct _DB_PER_OCT', () => {
  assert.deepEqual(enumerators(header(['dB', 'kHz', 'dBFS', 'dBu', 'dBTP', 'dBPerOct', 'Hz', 'percent'])), [
    'OMX_DEMO_UNITS_DB', 'OMX_DEMO_UNITS_KHZ', 'OMX_DEMO_UNITS_DBFS', 'OMX_DEMO_UNITS_DBU', 'OMX_DEMO_UNITS_DBTP',
    'OMX_DEMO_UNITS_DB_PER_OCT', 'OMX_DEMO_UNITS_HZ', 'OMX_DEMO_UNITS_PERCENT',
  ]);
});

test('the id stays the wire word in the enumerator doc', () => {
  assert.match(header(['dB', 'Hz']), /^ {2}OMX_DEMO_UNITS_DB = 0, \/\/\/< The id `dB`\.$/m);
});

test('a mixed set: a PARAM_UNITS id takes its title (dB _DB, dBFS _DBFS, dBu _DBU), any other id its upper snake case', () => {
  assert.deepEqual(enumerators(header(['dB', 'highCut', 'dBFS', 'dBu'])), ['OMX_DEMO_UNITS_DB', 'OMX_DEMO_UNITS_HIGH_CUT', 'OMX_DEMO_UNITS_DBFS', 'OMX_DEMO_UNITS_DBU']);
});
