// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * The words and terms kinds (docs/data-layout.md): the validator's rules over them, each with a red arm, and their
 * generic renders.
 */
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { loadData, resolveData } from '../lib/data.mjs';
import { validateData } from '../lib/validate.mjs';
import { renderC } from '../render/c.mjs';
import { renderJson } from '../render/json.mjs';
import { renderTs } from '../render/ts.mjs';
import { DATA, ROOT, texts } from './helpers.mjs';

const problems = (t) => validateData(loadData(null, t));
const has = (t, item, rule) => problems(t).some((p) => p.item === item && p.rule === rule);
const R = 'data/resource-profile.json';
const M = 'data/measurement.json';

test('the vocabulary is valid', () => {
  assert.deepEqual(problems(texts()), []);
});

test('a word two names carry is refused', () => {
  assert.ok(has(texts((d) => { d[R].RESOURCE_BASES.words.again = { word: 'probe' }; }), 'RESOURCE_BASES', 'word-unique'));
});

test('a group that is no word of the item groups names, or a group with no groups, is refused', () => {
  assert.ok(has(texts((d) => { d[M].QUALIFICATION_MEASUREMENT_UNMEASURED_REASONS.words.noAudioIn.group = 'nothing-at-all'; }), 'QUALIFICATION_MEASUREMENT_UNMEASURED_REASONS', 'word-group'));
  assert.ok(has(texts((d) => { d[M].QUALIFICATION_MEASUREMENT_VOICE_BASES.words.probe.group = 'probe-failed'; }), 'QUALIFICATION_MEASUREMENT_VOICE_BASES', 'word-group'));
  assert.ok(has(texts((d) => { d[M].QUALIFICATION_MEASUREMENT_UNMEASURED_REASONS.groups = 'RT_HARD_TARGET'; }), 'QUALIFICATION_MEASUREMENT_UNMEASURED_REASONS', 'word-group'));
});

test('a unit or a basis that is no word of the item named, or one with no item named, is refused', () => {
  const withUnits = (d) => { d[R].RESOURCE_KINDS.units = 'RESOURCE_UNITS'; d[R].RESOURCE_KINDS.bases = 'RESOURCE_BASES'; };
  // positive control: a unit and a basis the items hold pass, so the red arms below are the rule's and not the setup's
  assert.deepEqual(problems(texts((d) => { withUnits(d); d[R].RESOURCE_KINDS.words.tail.figureUnit = 'ms'; d[R].RESOURCE_KINDS.words.tail.basis = 'declared'; })), []);
  assert.ok(has(texts((d) => { withUnits(d); d[R].RESOURCE_KINDS.words.tail.figureUnit = 'furlongs'; }), 'RESOURCE_KINDS', 'word-unit'));
  assert.ok(has(texts((d) => { withUnits(d); d[R].RESOURCE_KINDS.words.tail.basis = 'guessed'; }), 'RESOURCE_KINDS', 'word-basis'));
  assert.ok(has(texts((d) => { d[R].RESOURCE_KINDS.words.tail.figureUnit = 'ms'; }), 'RESOURCE_KINDS', 'word-unit'));
  assert.ok(has(texts((d) => { d[R].RESOURCE_KINDS.bases = 'RT_HARD_TARGET'; d[R].RESOURCE_KINDS.words.tail.basis = 'declared'; }), 'RESOURCE_KINDS', 'word-basis'));
});

test('a from that names no term, or no terms item, is refused', () => {
  assert.ok(has(texts((d) => { d[R].RESOURCE_KINDS.words.tail.from = ['CLAP_EXT_TAIL_TERMS#tails']; }), 'RESOURCE_KINDS', 'word-from'));
  assert.ok(has(texts((d) => { d[R].RESOURCE_KINDS.words.tail.from = ['RT_HARD_TARGET#tail']; }), 'RESOURCE_KINDS', 'word-from'));
});

test('a term of the wrong format\'s shape, or without the citation its status asks for, is refused', () => {
  const f = ['data', 'formats', 'lv2', 'urid.json'].join('/');
  assert.ok(has(texts((d) => { const t = d[f].LV2_URID_TERMS.terms.map; delete t.uri; t.id = 'CLAP_X'; }), 'LV2_URID_TERMS', 'term-format'));
  assert.ok(has(texts((d) => { delete d[f].LV2_URID_TERMS.terms.map.by; }), 'LV2_URID_TERMS', 'schema'));
  assert.ok(has(texts((d) => { const t = d[f].LV2_URID_TERMS.terms.map; t.status = 'supported-later'; delete t.by; }), 'LV2_URID_TERMS', 'schema'));
  assert.ok(has(texts((d) => { const t = d[f].LV2_URID_TERMS.terms.map; t.status = 'out-of-scope'; }), 'LV2_URID_TERMS', 'schema'));
  assert.ok(has(texts((d) => { delete d[f].LV2_URID_TERMS.terms.map.status; }), 'LV2_URID_TERMS', 'schema'));
});

test('an item named as a words item\'s ts export is refused', () => {
  assert.ok(problems(texts((d) => { d[R].RESOURCE_BASES_WORDS = { kind: 'scalar', doc: 'x', unit: 'none', value: 1 }; })).some((p) => p.rule === 'words-export'));
});

test('a word whose C name meets a words item\'s _COUNT is refused', () => {
  assert.ok(problems(texts((d) => { d[R].RESOURCE_BASES.words.count = { word: 'counted' }; })).some((p) => p.rule === 'c-name-unique' && /OMX_RESOURCE_BASES_COUNT/.test(p.message)));
});

// the moved words (test/fixtures/moved-words/) stand in as a words item with groups, text and args
const SCRATCH0 = mkdtempSync(join(tmpdir(), 'omx-contract-moved-'));
after(() => rmSync(SCRATCH0, { recursive: true, force: true }));
cpSync(DATA, join(SCRATCH0, 'data'), { recursive: true });
cpSync(join(ROOT, 'test/fixtures/moved-words/measurement.json'), join(SCRATCH0, 'data', 'measurement.json'));
cpSync(join(ROOT, 'schema'), join(SCRATCH0, 'schema'), { recursive: true });
cpSync(join(ROOT, 'contract.d/param'), join(SCRATCH0, 'contract.d/param'), { recursive: true });
const resolved = resolveData(loadData(join(SCRATCH0, 'data')));

// data/ holds no codes item to render since the hosting codes moved to omx-clap-core (docs/hosting.md): the codes
// kind is read beside it from an owner's codes file (test/fixtures/package-codes/hosting/cost.json).
const SCRATCH = mkdtempSync(join(tmpdir(), 'omx-contract-codes-'));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));
cpSync(DATA, join(SCRATCH, 'data'), { recursive: true });
cpSync(join(ROOT, 'test/fixtures/package-codes'), join(SCRATCH, 'data'), { recursive: true });
cpSync(join(ROOT, 'test/fixtures/moved-words/measurement.json'), join(SCRATCH, 'data', 'measurement.json'));
cpSync(join(ROOT, 'schema'), join(SCRATCH, 'schema'), { recursive: true });
cpSync(join(ROOT, 'contract.d/param'), join(SCRATCH, 'contract.d/param'), { recursive: true });
const withCodes = resolveData(loadData(join(SCRATCH, 'data')));

test('the C render defines every code and word once, by its code and by its item', () => {
  const h = renderC(withCodes).find((f) => f.path === 'omxcontract/omx_vocabulary.h').text;
  assert.match(h, /^#define OMX_HOSTING_COST_SPIKY_TAIL "hosting\.cost\.spiky-tail"$/m, 'a code by its code');
  assert.doesNotMatch(h, /OMX_HOSTING_COST_COST_SPIKY|OMX_HOSTING_COST_SPIKY /, 'never by its key');
  assert.match(h, /^#define OMX_QUALIFICATION_MEASUREMENT_LATENCY_METHODS_NOTE_ONSET "note-onset" \/\/\/< /m);
  assert.match(h, /^#define OMX_QUALIFICATION_MEASUREMENT_VOICE_BASES_COUNT 2u$/m);
  assert.doesNotMatch(h, /TERMS/, 'a terms item has no C render');
});

// A consumer builds its own tables from a words item (omx-clap-core's panel families, widgets and display kinds,
// Open-Mixer/omx-clap-core#104), so the item renders as one X-macro: X(<code>u, "<word>", <NAME>), the code being the
// word's place in the declared order and NAME the suffix of its own macro. A table built from it follows the contract
// with no edit in the consumer.
test('every words item renders an X-macro, X(code, "word", NAME), in its declared order', () => {
  const h = renderC(withCodes).find((f) => f.path === 'omxcontract/omx_vocabulary.h').text;
  assert.match(h, /^#define OMX_QUALIFICATION_MEASUREMENT_VOICE_BASES\(X\) \\\n {4}X\(0u, "declared", DECLARED\) X\(1u, "probe", PROBE\)$/m);
  for (const r of [...withCodes.values()].filter((x) => x.kind === 'words')) {
    // omx-clap's code sheet header omx_param_units.h owns OMX_PARAM_UNITS(X): the words item's is _WORDS (omx-contract#151)
    const x = r.name === 'PARAM_UNITS' ? 'PARAM_UNITS_WORDS' : r.name;
    const m = h.match(new RegExp(`^#define OMX_${x}\\(X\\) \\\\\\n((?: {4}.*\\n?)+)`, 'm'));
    assert.ok(m, `${r.name} renders an X-macro`);
    const got = [...m[1].matchAll(/X\((\d+)u, ("(?:[^"\\]|\\.)*"), (\w+)\)/g)].map(([, c, w, n]) => [Number(c), JSON.parse(w), n]);
    const want = Object.entries(r.value).map(([k, w], i) => {
      const def = h.match(new RegExp(`^#define (OMX_${r.name}_(\\w+)) ${JSON.stringify(w.word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?: |$)`, 'm'));
      return [i, w.word, def?.[2]];
    });
    assert.deepEqual(got, want, `${r.name}: each word once, at its place, named as its own macro`);
  }
});

test('a word whose C name meets a words item\'s X-macro is refused', () => {
  const clash = (d) => { d[R].RESOURCE_BASES_PROBE = { kind: 'words', since: '3.19.0', doc: 'x', words: { one: { word: 'one' } } }; };
  assert.ok(problems(texts(clash)).some((p) => p.rule === 'c-name-unique' && /OMX_RESOURCE_BASES_PROBE /.test(p.message)));
});

// The panel words (PANEL_DISPLAY_KINDS, _DISPLAY_SOURCES, _PLACEMENTS and the families and widgets) are omx-panel's `panel`
// domain (sorting pass V1); their tests went with them, and test/sorting-removals.test.mjs holds that they are gone here.

test('the JSON Schema fragment gives one enum per codes and words item, in order', () => {
  const f = JSON.parse(renderJson(withCodes, '0.0.0').find((x) => x.path === 'omx-vocabulary.schema.json').text);
  assert.deepEqual(f.$defs.QUALIFICATION_MEASUREMENT_LATENCY_METHODS.enum, ['impulse-onset', 'declared-port', 'note-onset']);
  assert.deepEqual(f.$defs.QUALIFICATION_MEASUREMENT_VOICE_BASES.enum, ['declared', 'probe']);
  assert.deepEqual(f.$defs.HOSTING_COST_CODES.enum, ['hosting.cost.above-ceiling', 'hosting.cost.fields-missing', 'hosting.cost.spiky-tail', 'hosting.cost.unmeasured-at-rate-and-quantum', 'hosting.cost.within-ceiling']);
  assert.equal(f.$defs.LV2_CORE_TERMS, undefined);
});

test('the ts render exports each words item\'s words in order', () => {
  const js = renderTs(resolved).find((f) => f.path === 'omx-contract.js').text;
  assert.match(js, /export const QUALIFICATION_MEASUREMENT_VERDICT_RATINGS_WORDS = \[\n {2}"suitable",\n {2}"conditional",\n {2}"unknown",\n {2}"unsuitable"\n\];/);
});

test('an owner\'s codes item, in a file with its own render word, stays out of the vocabulary renders', () => {
  const union = resolveData(loadData(null, texts()));
  assert.ok(union.has('HOSTING_CODES'), 'the owners\' fixture carries omx-clap-core\'s HOSTING_CODES');
  const h = renderC(union).find((f) => f.path === 'omxcontract/omx_vocabulary.h').text;
  assert.doesNotMatch(h, /HOSTING_CODES \(/);
  assert.equal(JSON.parse(renderJson(union, '0.0.0').find((x) => x.path === 'omx-vocabulary.schema.json').text).$defs.HOSTING_CODES, undefined);
});

// The macro name of the PARAM_UNITS words item does not depend on which other render is present (omx-contract#151): the
// code sheet and omx_param_units.h moved to omx-clap (V23d), whose header still defines OMX_PARAM_UNITS(X), and
// omx_vocabulary.h installs beside that header. With the sheet gone from this tree, the item's X-macro is still
// OMX_PARAM_UNITS_WORDS, never OMX_PARAM_UNITS.
test('the PARAM_UNITS X-macro is OMX_PARAM_UNITS_WORDS with the code sheet moved out', () => {
  const files = renderC(resolveData(loadData(null, texts())));
  assert.ok(!files.some((f) => f.path === 'omxcontract/omx_param_units.h'), 'positive control: no sheet header is rendered here');
  const h = files.find((f) => f.path === 'omxcontract/omx_vocabulary.h').text;
  assert.match(h, /^#define OMX_PARAM_UNITS_WORDS\(X\) \\$/m);
  assert.doesNotMatch(h, /^#define OMX_PARAM_UNITS\(X\)/m);
});
