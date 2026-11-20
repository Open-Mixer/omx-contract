// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The 3.7.0 descriptor vocabulary (docs/descriptors.md): the meanings added by FreeMixer/omx-contract#100 and the
// synonyms they refuse.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { MEANING_SYNONYMS } from '../lib/descriptor.mjs';
import { fileProblems } from '../lib/validate.mjs';
import { ROOT } from './helpers.mjs';

const read = (rel) => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
const authored = () => read('examples/descriptors/authored-omx-delay.json');
const problemsOf = (doc) => fileProblems({ rel: 'descriptors/x.json', text: '', doc, installed: true }).map((p) => p.message);

test('shape, model, algorithm, mode, type and pingpong are meanings', () => {
  for (const meaning of ['shape', 'model', 'algorithm', 'mode', 'type', 'pingpong']) {
    const d = authored();
    d.controls[0].meaning = meaning;
    assert.deepEqual(problemsOf(d), [], meaning);
  }
});

test('on and speed are no meanings: the validator names enabled and rate', () => {
  assert.deepEqual(MEANING_SYNONYMS, { on: 'enabled', speed: 'rate' });
  for (const [word, canonical] of Object.entries(MEANING_SYNONYMS)) {
    const d = authored();
    d.controls[0].meaning = word;
    const said = problemsOf(d);
    assert.ok(said.some((m) => m.includes(`"${word}" is not a meaning, the word is "${canonical}"`)), JSON.stringify(said));
  }
  const d = authored();
  d.controls[0].meaning = 'wobble';
  const said = problemsOf(d);
  assert.ok(said.length > 0 && said.every((m) => !/the word is/.test(m)), 'a word with no synonym names no other');
});

// The table that maps every CLAP plugin feature and LV2 plugin class onto the feature words (PLUGIN_FEATURE_*, #120)
// is plugin-db's, in its plugin-feature domain (sorting pass V24), and its tests went with it.

test('the panel families and widgets are declared here, the scan words are a domain of omx-clap-core (#157, #81)', () => {
  const panel = read('data/panel.json');
  const ws = (it) => Object.values(it.words).map((w) => w.word);
  assert.deepEqual(ws(panel.PANEL_FAMILIES), ['none', 'gate', 'dynamics', 'limiter', 'deesser', 'eq', 'filter', 'drive', 'modulation', 'delay', 'reverb', 'pitch', 'utility']);
  assert.deepEqual(ws(panel.PANEL_WIDGETS), ['auto', 'knob', 'fader', 'switch', 'selector']);
  assert.deepEqual(ws(panel.PANEL_STANDARD_WIDGETS), ['knob', 'fader', 'switch', 'selector', 'meter', 'curve', 'xy', 'display']);
  // the scan words are omx-clap-core's domain (contract.d/scan/), never a file of this tree (omx-contract#81)
  assert.equal(existsSync(join(ROOT, 'data', 'scan.json')), false);
});

test('the machine, measurement and qualification words are plugin-hostd\'s and plugin-qualify\'s domains, not files of this tree (#81)', () => {
  for (const f of ['machine-class.json', 'measurement.json']) assert.equal(existsSync(join(ROOT, 'data', f)), false, f);
  const left = Object.keys(read('data/resource-profile.json')).filter((k) => k !== '$schema');
  assert.deepEqual(left, ['RESOURCE_KINDS', 'RESOURCE_UNITS', 'RESOURCE_BASES', 'RESOURCE_HINTS']);
});
