// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// A code's source sentence, in English beside the code, written by the code's owner; translations are catalogs
// (docs/data-layout.md, spec 7.11).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { atLeast } from '../lib/contract-dir.mjs';
import { loadData } from '../lib/data.mjs';
import { classify } from '../lib/semver.mjs';
import { SCHEMA_VERSION, dataWarnings, fileProblems, validateData } from '../lib/validate.mjs';
import { renderC } from '../render/c.mjs';
import { renderJson } from '../render/json.mjs';
import { DATA, resolvedOf, texts } from './helpers.mjs';

const FILE = 'data/hosting.json';
const withText = (d, c = d[FILE].HOSTING_CODES.codes.noteInput) => {
  c.text = { en: 'No contract directory at {path}' };
  c.args = ['path'];
  return c;
};
const problems = (fn) => validateData(loadData(null, texts(fn))).map((p) => `${p.item}:${p.rule}`);

test('a code with no text stays green', () => assert.deepEqual(problems(() => {}), []));

test('a code with its source sentence, its placeholders all in args, is green', () => assert.deepEqual(problems((d) => { withText(d); }), []));

test('fixture text-ca-deprecated: an owner file still carrying text.ca validates, with a catalog-migration warning', () => {
  const t = texts((d) => { withText(d).text.ca = 'No hi ha cap directori de contracte a {path}'; });
  assert.deepEqual(validateData(loadData(null, t)), [], 'no error: an owner migrates to its catalog in its own time');
  const w = dataWarnings(loadData(null, t));
  assert.deepEqual(w.map((x) => `${x.item}:${x.rule}`), ['HOSTING_CODES:catalog-migration']);
  assert.match(w[0].message, /catalogs\/ca\.json/);
  assert.deepEqual(dataWarnings(loadData(null, texts((d) => { withText(d); }))), [], 'no ca, no warning');
});

test('fixture text-ca-placeholder: a deprecated ca with a placeholder outside args is still red', () => {
  assert.ok(problems((d) => { withText(d).text.ca = 'Cap directori a {dir}'; }).includes('HOSTING_CODES:code-text-arg'));
});

test('fixture text-other-language: a language beside en and the deprecated ca is red', () => {
  const p = problems((d) => { withText(d).text.es = 'No hay directorio de contrato en {path}'; });
  assert.ok(p.some((x) => x.startsWith('HOSTING_CODES')), p.join());
});

test("the console's codes (owner openmixer) are codes as spelled: an UPPER_SNAKE refusal and a dotted kebab message", () => {
  const at = (code) => problems((d) => { d['data/zz-console.json'] = { $schema: '../schema/omx-contract.schema.json', ZZ_CONSOLE_CODES: { kind: 'codes', doc: 'd', codes: { a: { code, text: { en: 'Field {field} is refused.' }, args: ['field'] } } } }; });
  assert.deepEqual(at('BAD_TYPE'), [], 'a refusal code as the console spells it');
  assert.deepEqual(at('rt.budget'), [], 'a message code as the console spells it');
  assert.deepEqual(at('undo.label.set.gain'), []);
  assert.ok(at('Bad_Type').length > 0, 'neither UPPER_SNAKE nor lower case');
  assert.ok(at('_BAD').length > 0, 'a refusal code starts with a letter');
  assert.ok(at('rt..budget').length > 0, 'an empty segment');
  assert.ok(at('Rt.budget').length > 0, 'a message code is lower case');
  assert.ok(at('rt.Budget').length > 0);
  assert.ok(at('panel.skin').length > 0, "another family's prefix keeps that family's rule");
  assert.ok(at('reply.x').length > 0);
});

test('a panel.* code (omx-panel\'s refusals) is a code; a bare panel word is not', () => {
  const at = (code) => problems((d) => { d['data/zz-panel.json'] = { $schema: '../schema/omx-contract.schema.json', ZZ_PANEL_CODES: { kind: 'codes', doc: 'd', codes: { a: { code, text: { en: 'Skin {skin} names no control.' }, args: ['skin'] } } } }; });
  assert.deepEqual(at('panel.skin.unknown-control'), []);
  assert.ok(at('panel.skin').length > 0, 'two segments past the owner, as contract.* and reply.*');
  assert.ok(at('panel').length > 0);
});

test('fixture text-without-en: a text with no source sentence is red', () => assert.ok(problems((d) => { const c = withText(d); c.text = {}; delete c.args; }).length > 0));

test('fixture placeholder-not-in-args: a placeholder that is not in args is red', () => {
  assert.ok(problems((d) => { withText(d).args = []; }).includes('HOSTING_CODES:code-text-arg'));
  assert.ok(problems((d) => { delete withText(d).args; }).includes('HOSTING_CODES:code-text-arg'), 'no args at all');
});

test('text with no placeholders needs no args', () => assert.deepEqual(problems((d) => { const c = withText(d); c.text = { en: 'No directory' }; delete c.args; }), []));

test('an arg name is lowerCamel and listed once', () => {
  assert.ok(problems((d) => { withText(d).args = ['Path']; }).length > 0);
  assert.ok(problems((d) => { withText(d).args = ['path', 'path']; }).length > 0);
});

test('the json render carries text and args beside the code', () => {
  const json = JSON.parse(renderJson(resolvedOf(texts((d) => { withText(d); })), '0.0.0').find((f) => f.path === 'omx-contract.json').text);
  assert.deepEqual(json.items.HOSTING_CODES.value.noteInput.text, { en: 'No contract directory at {path}' });
  assert.deepEqual(json.items.HOSTING_CODES.value.noteInput.args, ['path']);
});

test('semver: a text added to a code is MINOR, reworded PATCH, an arg changed MAJOR', () => {
  const base = resolvedOf(texts((d) => { withText(d); }));
  const lvl = (fn) => classify(base, resolvedOf(texts((d) => { fn(withText(d)); }))).level;
  assert.equal(classify(resolvedOf(texts()), base).level, 'minor');
  assert.equal(lvl((c) => { c.text.en = 'No contract directory at {path}.'; }), 'patch');
  assert.equal(lvl((c) => { c.args = ['dir']; c.text = { en: '{dir}' }; }), 'major');
});

test('this repo\'s own codes (data/codes.json, CONTRACT_CODES) all carry their source sentence and nothing else, validating against omx-contract >= 3.12.0', () => {
  assert.ok(atLeast(SCHEMA_VERSION, '3.12.0'), `this schema is ${SCHEMA_VERSION}`);
  const doc = JSON.parse(readFileSync(join(DATA, 'codes.json'), 'utf8'));
  assert.deepEqual(fileProblems({ rel: 'data/codes.json', text: '', doc }), []);
  const codes = doc.CONTRACT_CODES.codes;
  const missing = Object.entries(codes).filter(([, c]) => !c.text?.en || Object.keys(c.text).length !== 1).map(([k]) => k);
  assert.deepEqual(missing, [], `codes with no text: ${missing.join(', ')}`);
});

test('the C vocabulary header, the vocabulary schema and an owner header carry text and args beside the code', () => {
  const t = texts((d) => {
    d['data/zz-words.json'] = { $schema: '../schema/omx-contract.schema.json', ZZ_CODES: { kind: 'codes', doc: 'd', codes: { gone: { code: 'hosting.zz.gone', text: { en: 'Gone: {what}' }, args: ['what'] }, bare: { code: 'hosting.zz.bare' } } } };
  });
  const r = resolvedOf(t);
  const h = renderC(r).find((f) => f.path === 'omxcontract/omx_vocabulary.h').text;
  assert.match(h, /^#define OMX_HOSTING_ZZ_GONE_TEXT_EN "Gone: \{what\}"$/m);
  assert.doesNotMatch(h, /_TEXT_CA/, 'no translation in a header');
  assert.match(h, /^#define OMX_HOSTING_ZZ_GONE_ARGS_INIT \{ "what" \}$/m);
  assert.doesNotMatch(h, /ZZ_BARE_TEXT/, 'a code with no text gains nothing');
  const schema = JSON.parse(renderJson(r, '0.0.0').find((f) => f.path === 'omx-vocabulary.schema.json').text);
  assert.deepEqual(schema.$defs.ZZ_CODES['x-omx-texts'], { 'hosting.zz.gone': { text: { en: 'Gone: {what}' }, args: ['what'] } });
  const own = renderC(resolvedOf(texts((d) => { withText(d); }))).find((f) => f.path === 'omxcontract/clap_host_limits.h').text;
  assert.match(own, /_TEXT_EN "No contract directory at \{path\}"/);
});
