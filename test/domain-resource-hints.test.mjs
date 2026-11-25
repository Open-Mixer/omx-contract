// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// V28 (omx-contract#189, docs/contract-dir.md "Domains"): a domain words item spells the data form's `units`, `bases`
// and `extension` (x-units, x-bases, x-extension) and a word's `figureUnit` and `basis` (x-figure-unit, x-basis), so
// the resource hints can move to plugin-hostd's `resource` domain. data/resource-profile.json written as a domain
// reads and rebuilds as the data form holds it, value for value; a word naming no word of its item is refused.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import { CONTRACT_FORMAT, SCHEMA_MAJOR, installedSchemaUrl } from '../lib/contract-dir.mjs';
import { domainDataFiles, readDomain } from '../lib/domain.mjs';
import { ROOT } from './helpers.mjs';

const DATA = JSON.parse(readFileSync(join(ROOT, 'data/resource-profile.json'), 'utf8'));
const ITEMS = ['RESOURCE_KINDS', 'RESOURCE_UNITS', 'RESOURCE_BASES', 'RESOURCE_HINTS'];
const read = (doc) => readDomain('resource', doc, installedSchemaUrl(SCHEMA_MAJOR), SCHEMA_MAJOR);

/** The four resource items of data/resource-profile.json as the domain `resource` would hold them. */
function resource() {
  const schemas = {};
  for (const item of ITEMS) {
    const d = DATA[item];
    schemas[item] = {
      description: d.doc, 'x-since': d.since, 'x-kind': 'words', 'x-file': 'resource-profile.json',
      ...(d.groups === undefined ? {} : { 'x-groups': d.groups }),
      ...(d.units === undefined ? {} : { 'x-units': d.units }),
      ...(d.bases === undefined ? {} : { 'x-bases': d.bases }),
      ...(d.extension === undefined ? {} : { 'x-extension': d.extension }),
      oneOf: Object.entries(d.words).map(([k, w], i) => ({
        const: w.word, title: k, description: w.doc, 'x-code': i, 'x-text': w.text.en,
        ...(w.group === undefined ? {} : { 'x-group': w.group }),
        ...(w.figureUnit === undefined ? {} : { 'x-figure-unit': w.figureUnit }),
        ...(w.basis === undefined ? {} : { 'x-basis': w.basis }),
      })),
    };
  }
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://openmixer.org/contract/resource', 'x-omx-contract': CONTRACT_FORMAT,
    info: { title: 'The resource hints', version: '1.0.0', 'x-owner': 'resource', 'x-stability': 'experimental' },
    components: { schemas },
  };
}

test('the resource items read as the data form holds them: units, bases, extension, figureUnit and basis', () => {
  const { doc } = read(resource());
  const h = doc.RESOURCE_HINTS;
  assert.equal(h.units, 'RESOURCE_UNITS');
  assert.equal(h.bases, 'RESOURCE_BASES');
  assert.deepEqual(h.extension, DATA.RESOURCE_HINTS.extension);
  for (const [k, w] of Object.entries(DATA.RESOURCE_HINTS.words)) assert.deepEqual([h.words[k].figureUnit, h.words[k].basis], [w.figureUnit, w.basis], k);
});

test('the rebuild gives data/resource-profile.json\'s four items back, value for value and in the data form\'s key order', () => {
  const file = JSON.parse(domainDataFiles('resource', resource())['resource-profile.json']);
  for (const item of ITEMS) assert.deepEqual(file[item], DATA[item], item);
  assert.deepEqual(Object.keys(file.RESOURCE_HINTS), Object.keys(DATA.RESOURCE_HINTS));
  const [k, w] = Object.entries(DATA.RESOURCE_HINTS.words)[0];
  assert.deepEqual(Object.keys(file.RESOURCE_HINTS.words[k]), Object.keys(w));
});

test('the domain schema accepts the resource items', () => {
  const schema = JSON.parse(readFileSync(join(ROOT, 'schema/domain.schema.json'), 'utf8'));
  const v = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
  assert.ok(v(resource()), JSON.stringify(v.errors));
});

/** `resource()` changed by `f`, read: the refusal's message. */
function refusal(f) {
  const d = resource();
  f(d.components.schemas);
  try { read(d); } catch (e) { return e.message; }
  return assert.fail('read');
}

test('refused by name: an x-figure-unit or x-basis naming no word, one with no x-units or x-bases, and x-units naming no item', () => {
  assert.match(refusal((s) => { s.RESOURCE_HINTS.oneOf[0]['x-figure-unit'] = 'furlongs'; }), /x-figure-unit "furlongs" is no word of RESOURCE_UNITS/);
  assert.match(refusal((s) => { s.RESOURCE_HINTS.oneOf[0]['x-basis'] = 'guessed'; }), /x-basis "guessed" is no word of RESOURCE_BASES/);
  assert.match(refusal((s) => { delete s.RESOURCE_HINTS['x-units']; }), /x-figure-unit.*names no x-units/);
  assert.match(refusal((s) => { delete s.RESOURCE_HINTS['x-bases']; }), /x-basis.*names no x-bases/);
  assert.match(refusal((s) => { s.RESOURCE_HINTS['x-units'] = 'RESOURCE_FURLONGS'; }), /x-units "RESOURCE_FURLONGS" is no words schema/);
  assert.match(refusal((s) => { s.RESOURCE_HINTS['x-extension'] = 'clap'; }), /x-extension is not an object/);
});
