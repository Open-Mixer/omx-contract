// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// A word's sentence, one per language beside the word, written by the word's owner, under a code's rules
// (docs/data-layout.md): what a menu says for a state, a run or a reason without keeping a sentence of its own.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadData } from '../lib/data.mjs';
import { classify } from '../lib/semver.mjs';
import { validateData } from '../lib/validate.mjs';
import { renderC } from '../render/c.mjs';
import { renderJson } from '../render/json.mjs';
import { renderTs } from '../render/ts.mjs';
import { resolvedOf, texts } from './helpers.mjs';

const FILE = 'data/measurement.json';
const ITEM = 'MEASUREMENT_UNMEASURED_REASONS';
const withText = (d, w = d[FILE][ITEM].words.noAudioIn) => {
  w.text = { en: '{plugin} has no audio input, so there is nothing to drive.', ca: "{plugin} no té cap entrada d'àudio, així que no hi ha res a excitar." };
  w.args = ['plugin'];
  return w;
};
const problems = (fn) => validateData(loadData(null, texts(fn))).map((p) => `${p.item}:${p.rule}`);

test('a word with no text stays green', () => assert.deepEqual(problems(() => {}), []));

test('a word with en and ca and the same placeholders, all in args, is green', () => assert.deepEqual(problems((d) => { withText(d); }), []));

test('fixture word-en-without-ca: a word with en and no ca is red', () => {
  const p = problems((d) => { const w = withText(d); w.text = { en: 'No audio in' }; delete w.args; });
  assert.ok(p.some((x) => x.startsWith(ITEM)), p.join());
});

test('fixture word-ca-without-en: a word with ca and no en is red', () => {
  const p = problems((d) => { const w = withText(d); w.text = { ca: 'Sense àudio' }; delete w.args; });
  assert.ok(p.some((x) => x.startsWith(ITEM)), p.join());
});

test('fixture word-text-extra-language: a language beside en and ca is red', () => {
  const p = problems((d) => { withText(d).text.es = '{plugin} no tiene entrada de audio.'; });
  assert.ok(p.some((x) => x.startsWith(ITEM)), p.join());
});

test('fixture word-placeholder-sets-differ: en and ca using different placeholder sets is red', () => {
  assert.ok(problems((d) => { withText(d).text.ca = "No ha arribat àudio a l'entrada."; }).includes(`${ITEM}:word-text-placeholders`));
  assert.ok(problems((d) => { const w = withText(d); w.args = ['plugin', 'rate']; w.text.ca += ' {rate}'; }).includes(`${ITEM}:word-text-placeholders`));
});

test('fixture word-placeholder-not-in-args: a placeholder that is not in args is red', () => {
  assert.ok(problems((d) => { withText(d).args = []; }).includes(`${ITEM}:word-text-arg`));
  assert.ok(problems((d) => { delete withText(d).args; }).includes(`${ITEM}:word-text-arg`), 'no args at all');
});

test('a word text with no placeholders needs no args', () => assert.deepEqual(problems((d) => { const w = withText(d); w.text = { en: 'No audio in.', ca: 'Sense àudio.' }; delete w.args; }), []));

test('a word arg name is lowerCamel and listed once', () => {
  assert.ok(problems((d) => { withText(d).args = ['Plugin']; }).length > 0);
  assert.ok(problems((d) => { withText(d).args = ['plugin', 'plugin']; }).length > 0);
});

test('the json render and the ts render carry text and args beside the word', () => {
  const r = resolvedOf(texts((d) => { withText(d); }));
  const json = JSON.parse(renderJson(r, '0.0.0').find((f) => f.path === 'omx-contract.json').text);
  assert.equal(json.items[ITEM].value.noAudioIn.text.ca, "{plugin} no té cap entrada d'àudio, així que no hi ha res a excitar.");
  assert.deepEqual(json.items[ITEM].value.noAudioIn.args, ['plugin']);
  const js = renderTs(r).find((f) => f.path === 'omx-contract.js').text;
  assert.match(js, /"en": "\{plugin\} has no audio input, so there is nothing to drive\."/);
});

test('the C vocabulary header and the vocabulary schema carry text and args beside the word', () => {
  const r = resolvedOf(texts((d) => { withText(d); }));
  const h = renderC(r).find((f) => f.path === 'omxcontract/omx_vocabulary.h').text;
  assert.match(h, /^#define OMX_MEASUREMENT_UNMEASURED_REASONS_NO_AUDIO_IN_TEXT_EN "\{plugin\} has no audio input, so there is nothing to drive\."$/m);
  assert.match(h, /^#define OMX_MEASUREMENT_UNMEASURED_REASONS_NO_AUDIO_IN_TEXT_CA "\{plugin\} no t.+ cap entrada d'.+udio, aix.+ que no hi ha res a excitar\."$/m);
  assert.match(h, /^#define OMX_MEASUREMENT_UNMEASURED_REASONS_NO_AUDIO_IN_ARGS_COUNT 1u$/m);
  assert.match(h, /^#define OMX_MEASUREMENT_UNMEASURED_REASONS_NO_AUDIO_IN_ARGS_INIT \{ "plugin" \}$/m);
  assert.equal((h.match(/^#define OMX_MEASUREMENT_UNMEASURED_REASONS_\w+_TEXT_EN /gm) ?? []).length, 1, 'a word with no text gains nothing');
  assert.match(h, /^#define OMX_MEASUREMENT_UNMEASURED_REASONS_COUNT \d+u$/m, 'the item keeps its _COUNT');
  const schema = JSON.parse(renderJson(r, '0.0.0').find((f) => f.path === 'omx-vocabulary.schema.json').text);
  assert.deepEqual(schema.$defs[ITEM]['x-omx-texts'], { 'no-audio-in': { text: { en: '{plugin} has no audio input, so there is nothing to drive.', ca: "{plugin} no té cap entrada d'àudio, així que no hi ha res a excitar." }, args: ['plugin'] } });
});

test('semver: a text added to a word is MINOR, reworded PATCH, removed or an arg changed MAJOR', () => {
  const base = resolvedOf(texts((d) => { withText(d); }));
  const lvl = (fn) => classify(base, resolvedOf(texts((d) => { fn(withText(d)); }))).level;
  assert.equal(classify(resolvedOf(texts()), base).level, 'minor');
  assert.equal(lvl((w) => { w.text.en = '{plugin} has no audio input: nothing to drive.'; }), 'patch');
  assert.equal(lvl((w) => { w.args = ['input']; w.text = { en: '{input}', ca: '{input}' }; }), 'major');
  assert.equal(classify(base, resolvedOf(texts())).level, 'major');
});
