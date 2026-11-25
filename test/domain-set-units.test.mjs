// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The domain format reads a set and a unit list (vocabulary sorting pass, S0, for V21 and V23a+b): a words item of
// `x-kind` set names its default (`x-default`, one of its words) and is read as the data form's set (ids, default);
// a word may carry its symbol as written (`x-symbol`) and its dimension (`x-dimension`, a word of the words item the
// item's `x-dimensions` names), read as the data form's `symbol`, `dimension` and `dimensions`. The fixture
// test/fixtures/domain-set-units/primitives.json is PARAM_SCALES and PARAM_UNITS as data/primitives.json held them
// before they moved: written as a domain, the rebuild gives them back, value for value.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import { CONTRACT_FORMAT, SCHEMA_MAJOR, installedSchemaUrl } from '../lib/contract-dir.mjs';
import { domainDataFiles, readDomain } from '../lib/domain.mjs';
import { ROOT } from './helpers.mjs';

const BEFORE = JSON.parse(readFileSync(join(ROOT, 'test/fixtures/domain-set-units/primitives.json'), 'utf8'));
const read = (doc) => readDomain('sample', doc, installedSchemaUrl(SCHEMA_MAJOR), SCHEMA_MAJOR);

/** A `sample` domain holding PARAM_SCALES and PARAM_UNITS of the fixture as SAMPLE_ items, with a dimensions item. */
function sample() {
  const scales = BEFORE.PARAM_SCALES;
  const units = BEFORE.PARAM_UNITS;
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://openmixer.org/contract/sample', 'x-omx-contract': CONTRACT_FORMAT,
    info: { title: 'A sample of a set and a unit list', version: '1.0.0', 'x-owner': 'sample', 'x-stability': 'experimental' },
    components: {
      schemas: {
        SAMPLE_SCALES: {
          description: scales.doc, 'x-since': scales.since, 'x-kind': 'set', 'x-file': 'sample.json', 'x-default': scales.default,
          oneOf: scales.ids.map((id, i) => ({ const: id, title: id, 'x-code': i })),
        },
        SAMPLE_UNITS: {
          description: units.doc, 'x-since': units.since, 'x-why': units.why, 'x-kind': 'words', 'x-file': 'sample.json', 'x-dimensions': 'SAMPLE_DIMENSIONS',
          oneOf: Object.entries(units.words).map(([k, w], i) => ({ const: w.word, title: k, description: w.doc, 'x-code': i, 'x-text': w.text.en, 'x-symbol': w.symbol, 'x-dimension': 'any' })),
        },
        SAMPLE_DIMENSIONS: {
          description: 'What a unit measures.', 'x-kind': 'words', 'x-file': 'sample.json',
          oneOf: [{ const: 'any', title: 'any', 'x-code': 0, description: 'Anything.' }],
        },
      },
    },
  };
}

test('a set item reads as the data form\'s set: its words the ids in order, x-default the default', () => {
  const { doc } = read(sample());
  assert.deepEqual(doc.SAMPLE_SCALES, { kind: 'set', since: '1.3.0', doc: BEFORE.PARAM_SCALES.doc, ids: ['linear', 'log', 'stepped'], default: 'linear' });
});

test('a word reads its x-symbol and x-dimension as symbol and dimension; the item its x-dimensions as dimensions', () => {
  const { doc } = read(sample());
  assert.equal(doc.SAMPLE_UNITS.dimensions, 'SAMPLE_DIMENSIONS');
  assert.deepEqual(Object.keys(doc.SAMPLE_UNITS.words), Object.keys(BEFORE.PARAM_UNITS.words));
  for (const [k, w] of Object.entries(BEFORE.PARAM_UNITS.words)) {
    assert.equal(doc.SAMPLE_UNITS.words[k].symbol, w.symbol, k);
    assert.equal(doc.SAMPLE_UNITS.words[k].dimension, 'any', k);
  }
});

test('the rebuild gives the set and the unit list back as data/primitives.json held them, value for value', () => {
  const file = JSON.parse(domainDataFiles('sample', sample())['sample.json']);
  assert.deepEqual(file.SAMPLE_SCALES, BEFORE.PARAM_SCALES);
  const units = structuredClone(file.SAMPLE_UNITS);
  assert.equal(units.dimensions, 'SAMPLE_DIMENSIONS');
  delete units.dimensions;
  for (const w of Object.values(units.words)) { assert.equal(w.dimension, 'any'); delete w.dimension; }
  assert.deepEqual(units, BEFORE.PARAM_UNITS);
  // the key order of the data form: word, symbol, dimension, then doc and text
  assert.deepEqual(Object.keys(file.SAMPLE_UNITS.words.percent), ['word', 'symbol', 'dimension', 'doc', 'text']);
  assert.deepEqual(Object.keys(file.SAMPLE_SCALES), ['kind', 'since', 'doc', 'ids', 'default']);
});

test('the domain schema accepts the set and the unit list', () => {
  const schema = JSON.parse(readFileSync(join(ROOT, 'schema/domain.schema.json'), 'utf8'));
  const v = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
  assert.ok(v(sample()), JSON.stringify(v.errors));
});

/** `sample()` changed by `f`, read: the refusal's message. */
function refusal(f) {
  const d = sample();
  f(d.components.schemas);
  try { read(d); } catch (e) { return e.message; }
  assert.fail('read');
}

test('refused by name: a set\'s x-default that is none of its words, and x-default on an item that is no set', () => {
  assert.match(refusal((s) => { s.SAMPLE_SCALES['x-default'] = 'cubic'; }), /x-default "cubic" is no word of SAMPLE_SCALES/);
  assert.match(refusal((s) => { s.SAMPLE_DIMENSIONS['x-default'] = 'any'; }), /x-default.*only a set/);
});

test('refused by name: an x-dimension that is no word of x-dimensions, one with no x-dimensions, and an x-symbol that is no string', () => {
  assert.match(refusal((s) => { s.SAMPLE_UNITS.oneOf[0]['x-dimension'] = 'mass'; }), /x-dimension "mass" is no word of/);
  assert.match(refusal((s) => { delete s.SAMPLE_UNITS['x-dimensions']; }), /x-dimension.*names no x-dimensions/);
  assert.match(refusal((s) => { s.SAMPLE_UNITS['x-dimensions'] = 'SAMPLE_MASSES'; }), /x-dimensions "SAMPLE_MASSES" is no words schema/);
  assert.match(refusal((s) => { s.SAMPLE_UNITS.oneOf[0]['x-symbol'] = 1; }), /x-symbol is not a string/);
});

test('refused by name: a unit word whose id is not camelCase, a "-" or a "/" in it (docs/units.md, 2026-11-23)', () => {
  for (const bad of ['dB-oct', 'dB/oct', 'ns per sample', '9db']) {
    const said = refusal((s) => { s.SAMPLE_UNITS.oneOf[0].const = bad; });
    assert.ok(String(said).includes(`unit id ${JSON.stringify(bad)} is not camelCase`), said);
  }
});
