// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// An owner's catalogs (docs/data-layout.md, "Catalogs"; spec 7.11): one file per language, keyed by the owner's codes
// and by `<ITEM>.<word>`, each placeholder one of its entry's args; the lookup falls back to the source sentence.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';

import { loadData, resolveData } from '../lib/data.mjs';
import { catalogDirOf, catalogKeys, catalogPathOf, catalogProblems, fill, loadCatalog, sentenceOf } from '../lib/catalog.mjs';
import { DATA, ROOT, resolvedOf, texts } from './helpers.mjs';

const FILE = 'data/measurement.json';
const ITEM = 'MEASUREMENT_UNMEASURED_REASONS';
const data = () => texts((d) => {
  const w = d[FILE][ITEM].words.noAudioIn;
  w.text = { en: '{plugin} has no audio input.' };
  w.args = ['plugin'];
  const c = d['data/hosting.json'].HOSTING_CODES.codes.noteInput;
  c.text = { en: 'No contract directory at {path}' };
  c.args = ['path'];
});
const keys = () => catalogKeys(resolvedOf(data()));
const WORD = `${ITEM}.no-audio-in`;
const CODE = (() => resolvedOf(data()).get('HOSTING_CODES').value.noteInput.code)();
const catalog = (messages) => ({ kind: 'catalog', lang: 'ca', owner: 'omx-contract', messages });
const rules = (messages) => catalogProblems('catalogs/ca.json', catalog(messages), keys()).map((p) => `${p.item}:${p.rule}`);

test('a catalog keyed by a code and by <ITEM>.<word>, its placeholders in args, is green', () => {
  assert.deepEqual(rules({ [CODE]: 'Cap directori de contracte a {path}', [WORD]: "{plugin} no té cap entrada d'àudio." }), []);
  assert.deepEqual(rules({}), [], 'an empty catalog: every key falls back');
});

test('fixture catalog-key: a key that is no code or word of the owner is red', () => {
  assert.deepEqual(rules({ 'hosting.nope.gone': 'x' }), ['hosting.nope.gone:catalog-key']);
  assert.deepEqual(rules({ [`${ITEM}.no-such-word`]: 'x' }), [`${ITEM}.no-such-word:catalog-key`]);
  assert.deepEqual(rules({ 'NO_SUCH_ITEM.no-audio-in': 'x' }), ['NO_SUCH_ITEM.no-audio-in:catalog-key'], 'a word key whose item does not exist');
  assert.ok(rules({ 'no-audio-in': 'x' }).every((r) => r.endsWith(':catalog-schema')) && rules({ 'no-audio-in': 'x' }).length > 0, 'a bare word is no key');
});

test('fixture catalog-placeholders: a placeholder that is not one of its entry\'s args is red', () => {
  assert.deepEqual(rules({ [CODE]: 'Cap directori a {dir}' }), [`${CODE}:catalog-placeholders`]);
  assert.deepEqual(rules({ [WORD]: '{plugin} a {rate}' }), [`${WORD}:catalog-placeholders`]);
  assert.deepEqual(rules({ [CODE]: 'Cap directori' }), [], 'a sentence may use fewer placeholders than args');
});

test('the catalog schema: kind, lang (never en), owner and messages, nothing else', () => {
  const bad = (doc) => catalogProblems('c.json', doc, keys()).some((p) => p.rule === 'catalog-schema');
  assert.ok(bad({ ...catalog({}), lang: 'en' }), 'the source language is no catalog');
  assert.ok(bad({ ...catalog({}), kind: 'words' }));
  assert.ok(bad({ kind: 'catalog', lang: 'ca', messages: {} }), 'no owner');
  assert.ok(bad({ ...catalog({}), extra: 1 }));
  assert.ok(bad(catalog({ [CODE]: 3 })), 'a sentence is a string');
});

test('the lookup: the catalog\'s sentence, else the source sentence, its placeholders filled', () => {
  const root = mkdtempSync(join(tmpdir(), 'omx-catalog-'));
  assert.equal(catalogPathOf('plugin-db', 'ca', root), join(root, 'plugin-db', 'catalogs', 'ca.json'));
  assert.equal(catalogDirOf('plugin-db'), '/usr/share/plugin-db/catalogs');
  mkdirSync(catalogDirOf('omx-contract', root), { recursive: true });
  writeFileSync(catalogPathOf('omx-contract', 'ca', root), JSON.stringify(catalog({ [CODE]: 'Cap directori de contracte a {path}' })));
  const ca = loadCatalog('omx-contract', 'ca', root);
  assert.equal(fill(sentenceOf(ca, CODE, 'No contract directory at {path}'), { path: '/x' }), 'Cap directori de contracte a /x');
  assert.equal(sentenceOf(ca, WORD, '{plugin} has no audio input.'), '{plugin} has no audio input.', 'a missing entry falls back');
  assert.equal(loadCatalog('omx-contract', 'es', root), undefined, 'no catalog for the language');
  assert.equal(sentenceOf(undefined, CODE, 'No contract directory at {path}'), 'No contract directory at {path}', 'no catalog falls back');
  assert.equal(loadCatalog('plugin-db', 'ca', root), undefined);
  assert.equal(fill('{a} and {b}', { a: 1 }), '1 and {b}');
});

test('this repo\'s own catalogs/ca.json validates, and holds a sentence for every own code with a source sentence', () => {
  const r = spawnSync(process.execPath, [join(ROOT, 'bin', 'omx-contract.mjs'), 'validate'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  // one catalog per shipped language (omx-contract#21)
  const langs = JSON.parse(readFileSync(join(ROOT, 'share', 'omx-contract', 'languages.json'), 'utf8')).languages;
  assert.match(r.stdout, new RegExp(`${langs.length} catalogs`));
  const ca = JSON.parse(readFileSync(join(ROOT, 'catalogs', 'ca.json'), 'utf8'));
  const own = JSON.parse(readFileSync(join(ROOT, 'data', 'codes.json'), 'utf8')).CONTRACT_CODES.codes;
  const lacking = Object.values(own).filter((c) => c.text && !(c.code in ca.messages)).map((c) => c.code);
  assert.deepEqual(lacking, []);
});

test('every code and word this repo declares carries a source sentence (omx-contract#2)', () => {
  const resolved = resolveData(loadData(DATA));
  const lacking = [];
  for (const [name, r] of resolved) {
    if (r.kind !== 'codes' && r.kind !== 'words') continue;
    for (const e of Object.values(r.value)) {
      if (!e.text?.en) lacking.push(`${name}.${e.code ?? e.word}`);
    }
  }
  assert.deepEqual(lacking, []);
});

test('needs-content: an instrument silent until content is loaded, grouped nothing-to-measure (plugin-qualify#21, #23)', () => {
  const resolved = resolveData(loadData(DATA));
  const w = resolved.get('MEASUREMENT_UNMEASURED_REASONS').value.needsContent;
  assert.equal(w.word, 'needs-content');
  assert.equal(w.group, 'nothing-to-measure');
  assert.equal(w.text.en, 'An instrument that is silent under notes until a sample, a sound font or an instrument file is loaded, which the prober did not load.');
});

test('memory-bound: a pass ended at the run\'s memory bound, grouped probe-failed (plugin-qualify#28)', () => {
  const resolved = resolveData(loadData(DATA));
  const w = resolved.get('MEASUREMENT_UNMEASURED_REASONS').value.memoryBound;
  assert.ok(w, 'MEASUREMENT_UNMEASURED_REASONS has no memoryBound');
  assert.equal(w.word, 'memory-bound');
  assert.equal(w.group, 'probe-failed');
  assert.equal(w.text.en, 'The pass took the plugin past the run\'s memory bound and was ended there; the run went on without its figure.');
});

test('no contract data file holds a language beside the source sentence', () => {
  const r = spawnSync('git', ['-C', ROOT, 'grep', '-l', '-E', '"(ca|es|fr|de)": "', '--', 'data/'], { encoding: 'utf8' });
  assert.equal(r.stdout.trim(), '', `translations in data: ${r.stdout}`);
});

test('validate --catalogs <dir> checks a named directory: a key the owner does not declare fails the run', () => {
  const dir = mkdtempSync(join(tmpdir(), 'omx-catalogs-'));
  writeFileSync(join(dir, 'ca.json'), JSON.stringify(catalog({ 'contract.no.such-code': 'x' })));
  const r = spawnSync(process.execPath, [join(ROOT, 'bin', 'omx-contract.mjs'), 'validate', '--catalogs', dir], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /catalog-key/);
});
