// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// A control's meaning is its ROLE, declared and never inferred (ruling R1 of 2026-11-24, omx-contract#61;
// docs/descriptors.md, "Meanings"): required on every control, a word of PARAM_MEANINGS (the param domain), whose
// words the schema's $defs.meaning enum renders. `bandwidth` (octaves) is a role apart from `q`.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileProblems } from '../lib/validate.mjs';
import { meaningWords } from '../tools/unit-enum.mjs';
import { ROOT, scratchDir } from './helpers.mjs';

const example = (name) => JSON.parse(readFileSync(join(ROOT, 'examples/descriptors', name), 'utf8'));
const problemsOf = (doc) => fileProblems({ rel: 'descriptors/x.json', text: '', doc, installed: true }).map((p) => `${p.code ?? p.rule}:${p.message}`);
const domainWords = () => JSON.parse(readFileSync(join(ROOT, 'contract.d/param/param.json'), 'utf8')).components.schemas.PARAM_MEANINGS?.oneOf?.map((w) => w.const);

test('PARAM_MEANINGS is a words item of the param domain, and $defs.meaning is its words in its order', () => {
  const words = domainWords();
  assert.ok(Array.isArray(words) && words.length > 0, 'contract.d/param/param.json has PARAM_MEANINGS');
  assert.deepEqual(JSON.parse(readFileSync(join(ROOT, 'schema/omx-contract.schema.json'), 'utf8')).$defs.meaning.enum, words);
  assert.deepEqual(meaningWords(ROOT), words);
});

test('bandwidth is a role apart from q, and unknown is the last word', () => {
  const words = domainWords();
  assert.ok(words.includes('bandwidth') && words.includes('q'));
  assert.equal(words.at(-1), 'unknown');
});

test('every example descriptor states a meaning on every control', () => {
  for (const name of ['authored-omx-delay.json', 'built-wrapped-synth.json', 'scanned-clap-unknown.json', 'scanned-lv2-compressor.json']) {
    const doc = example(name);
    assert.deepEqual(problemsOf(doc), [], name);
    for (const c of doc.controls) assert.ok(typeof c.meaning === 'string', `${name}: control ${c.id} has no meaning`);
  }
});

test('a control without a meaning is refused by the schema', () => {
  const doc = example('scanned-clap-unknown.json');
  delete doc.controls[0].meaning;
  assert.ok(problemsOf(doc).some((p) => /must have required property 'meaning'/.test(p)), problemsOf(doc).join('\n'));
});

test('a control states bandwidth, and a word outside PARAM_MEANINGS is refused', () => {
  const doc = example('authored-omx-delay.json');
  doc.controls[0].meaning = 'bandwidth';
  assert.deepEqual(problemsOf(doc), []);
  doc.controls[0].meaning = 'octaves';
  assert.ok(problemsOf(doc).some((p) => /\/meaning/.test(p)), problemsOf(doc).join('\n'));
});

test('sabotage: a domain without bandwidth leaves the schema enum stale, and unit-enum --check refuses it', () => {
  const dir = scratchDir('omx-meaning-role-');
  for (const d of ['contract.d', 'schema', 'tools', 'lib']) cpSync(join(ROOT, d), join(dir, d), { recursive: true });
  const file = join(dir, 'contract.d/param/param.json');
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  doc.components.schemas.PARAM_MEANINGS.oneOf = doc.components.schemas.PARAM_MEANINGS.oneOf.filter((w) => w.const !== 'bandwidth');
  writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`);
  const r = spawnSync(process.execPath, [join(dir, 'tools/unit-enum.mjs'), '--check', '--root', dir], { encoding: 'utf8' });
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stderr, /\$defs\.meaning/);
});
