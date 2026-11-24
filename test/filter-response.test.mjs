// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// A filter control states its response (omx-contract#208; docs/descriptors.md, "Filter responses"): an optional word
// of PARAM_FILTER_RESPONSES (the param domain), whose words the schema's $defs.filterResponse enum renders, so a consumer
// finds an EQ's edges by the word in any language, never by a name. The words are held here as the item states them:
// omx-contract reads no level above it (test/no-upward-read.test.mjs), and omx-dsp's EQ design reads this item's codes,
// held there by its own check.
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

const WORDS = () => item().oneOf.map((w) => w.const);

test('PARAM_FILTER_RESPONSES is a words item of the param domain, each code its place, each id camelCase', () => {
  const it = item();
  assert.equal(it?.['x-kind'], 'words', 'contract.d/param/param.json has the PARAM_FILTER_RESPONSES words item');
  assert.ok(it.oneOf.length > 0, 'positive control: the item has words');
  assert.ok(WORDS().includes('highpass') && WORDS().includes('lowpass'), 'the two edge words');
  it.oneOf.forEach((w, i) => {
    assert.equal(w['x-code'], i, `${w.const}: x-code ${w['x-code']}, place ${i}`);
    assert.match(w.const, /^[a-z][A-Za-z0-9]*$/, `${w.const} is camelCase`);
  });
});

test('$defs.filterResponse is the item\'s words in its order, and a control may carry response', () => {
  const $ = SCHEMA().$defs;
  assert.deepEqual($.filterResponse?.enum, WORDS());
  assert.deepEqual(unitEnum.filterResponseWords?.(ROOT), WORDS());
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
  for (const w of WORDS()) {
    doc.controls[2].response = w;
    assert.deepEqual(problemsOf(doc), [], w);
  }
});

test('sabotage: an unknown response word is refused by name, naming the field and the words', () => {
  for (const bad of ['hpf', 'bell', 'highPass', 'lowshelf', 'unknown']) {
    const doc = example('authored-omx-delay.json');
    doc.controls[2].response = bad;
    const p = problemsOf(doc);
    const want = `schema:/controls/2/response must be equal to one of the allowed values (${WORDS().join(', ')})`;
    assert.ok(p.includes(want), `${bad}: ${p.join('\n')}`);
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
