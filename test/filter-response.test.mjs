// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// A filter control states its response (omx-contract#208; docs/descriptors.md, "Filter responses"): an optional word
// of PARAM_FILTER_RESPONSES (the param domain), whose words the schema's $defs.filterResponse enum renders. The words are
// omx-dsp's BIQUAD_KINDS, in its order, so a consumer finds an EQ's edges by the word in any language, never by a name.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileProblems } from '../lib/validate.mjs';
import * as unitEnum from '../tools/unit-enum.mjs';
import { ROOT, scratchDir } from './helpers.mjs';

const example = (name) => JSON.parse(readFileSync(join(ROOT, 'examples/descriptors', name), 'utf8'));
const problemsOf = (doc) => fileProblems({ rel: 'descriptors/x.json', text: '', doc, installed: true }).map((p) => `${p.code ?? p.rule}:${p.message}`);
const item = () => JSON.parse(readFileSync(join(ROOT, 'contract.d/param/param.json'), 'utf8')).components.schemas.PARAM_FILTER_RESPONSES;
const SCHEMA = () => JSON.parse(readFileSync(join(ROOT, 'schema/omx-contract.schema.json'), 'utf8'));

// omx-dsp data/primitives/biquad-kinds.json, BIQUAD_KINDS: the section kinds omx_eq_design builds, in omx_eq_kind's order
const BIQUAD_KINDS = ['peaking', 'lowShelf', 'highShelf', 'highpass', 'lowpass', 'notch', 'bandpass', 'allpass1', 'allpass2'];

test('PARAM_FILTER_RESPONSES is a words item of the param domain: omx-dsp\'s BIQUAD_KINDS, each code its place', () => {
  const it = item();
  assert.equal(it?.['x-kind'], 'words', 'contract.d/param/param.json has the PARAM_FILTER_RESPONSES words item');
  assert.deepEqual(it.oneOf.map((w) => w.const), BIQUAD_KINDS);
  it.oneOf.forEach((w, i) => {
    assert.equal(w['x-code'], i, `${w.const}: x-code ${w['x-code']}, place ${i}`);
    assert.match(w.const, /^[a-z][A-Za-z0-9]*$/, `${w.const} is camelCase`);
  });
});

test('$defs.filterResponse is the item\'s words in its order, and a control may carry response', () => {
  const $ = SCHEMA().$defs;
  assert.deepEqual($.filterResponse?.enum, BIQUAD_KINDS);
  assert.deepEqual(unitEnum.filterResponseWords?.(ROOT), BIQUAD_KINDS);
  assert.deepEqual($.descriptorControl.properties.response, { $ref: '#/$defs/filterResponse' });
  assert.ok(!$.descriptorControl.required.includes('response'), 'response is optional');
});

test('the authored omx-eq8 example states highpass on its low edge and lowpass on its high edge, and is valid', () => {
  const doc = example('authored-omx-eq8.json');
  assert.deepEqual(problemsOf(doc), []);
  const edge = (g) => doc.controls.filter((c) => c.group?.[0] === g).map((c) => c.response);
  assert.deepEqual(edge('HPF'), ['highpass', 'highpass', 'highpass']);
  assert.deepEqual(edge('LPF'), ['lowpass', 'lowpass', 'lowpass']);
  assert.ok(doc.controls.filter((c) => c.group?.[0] === 'Bands').every((c) => c.response === undefined), 'a band whose shape a choice picks states none');
});

test('every word is accepted on a control, and the field absent is accepted', () => {
  const doc = example('authored-omx-delay.json');
  assert.ok(doc.controls.every((c) => c.response === undefined), 'positive control: the delay states no response');
  assert.deepEqual(problemsOf(doc), []);
  for (const w of BIQUAD_KINDS) {
    doc.controls[2].response = w;
    assert.deepEqual(problemsOf(doc), [], w);
  }
});

test('sabotage: an unknown response word is refused by name, naming the field and the words', () => {
  for (const bad of ['hpf', 'bell', 'highPass', 'lowshelf', 'unknown']) {
    const doc = example('authored-omx-delay.json');
    doc.controls[2].response = bad;
    const p = problemsOf(doc);
    assert.ok(p.some((x) => /^schema:\/controls\/2\/response must be equal to one of the allowed values \(peaking, lowShelf, highShelf, highpass, lowpass, notch, bandpass, allpass1, allpass2\)$/.test(x)), `${bad}: ${p.join('\n')}`);
  }
});

test('sabotage: a domain without lowpass leaves the schema enum stale, and unit-enum --check refuses it', () => {
  const dir = scratchDir('omx-filter-response-');
  for (const d of ['contract.d', 'schema', 'tools', 'lib']) cpSync(join(ROOT, d), join(dir, d), { recursive: true });
  const file = join(dir, 'contract.d/param/param.json');
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  doc.components.schemas.PARAM_FILTER_RESPONSES.oneOf = doc.components.schemas.PARAM_FILTER_RESPONSES.oneOf.filter((w) => w.const !== 'lowpass');
  writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`);
  const r = spawnSync(process.execPath, [join(dir, 'tools/unit-enum.mjs'), '--check', '--root', dir], { encoding: 'utf8' });
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stderr, /\$defs\.filterResponse/);
});
