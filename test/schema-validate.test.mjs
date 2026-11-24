// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The one validate() (lib/schema-validate.mjs), exported as @openmixer/omx-contract/validate.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { validate } from '../lib/schema-validate.mjs';
import { ROOT } from './helpers.mjs';

const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

const SCHEMA = { $schema: 'https://json-schema.org/draft/2020-12/schema', type: 'object', required: ['name'], additionalProperties: false, properties: { name: { type: 'string', pattern: '^[a-z]+$' }, n: { type: ['integer', 'null'] } } };

test('validate(schema, doc): ok for a document that conforms, every refusal listed with its path and keyword', () => {
  assert.deepEqual(validate(SCHEMA, { name: 'abc', n: null }), { ok: true, errors: [] });
  const r = validate(SCHEMA, { name: 'A1', extra: 1 });
  assert.equal(r.ok, false);
  assert.deepEqual(r.errors.map((e) => `${e.path || '/'}:${e.code}`).sort(), ['/:additionalProperties', '/name:pattern']);
  assert.deepEqual(validate(SCHEMA, {}).errors.map((e) => e.code), ['required']);
});

test('validate: a misspelt keyword in the schema throws instead of passing everything, and a schema is compiled once', () => {
  assert.throws(() => validate({ type: 'object', requird: ['x'] }, {}), /strict mode|unknown keyword/i);
  assert.equal(validate(SCHEMA, { name: 'a' }).ok, validate(SCHEMA, { name: 'b' }).ok);
});

test('validate is exported as @openmixer/omx-contract/validate and reads the contract\'s own schema', async () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.exports['./validate'], './lib/schema-validate.mjs');
  const { validate: v } = await import(pathToFileURL(join(ROOT, pkg.exports['./validate'])).href);
  const schema = JSON.parse(read('schema/omx-contract.schema.json'));
  assert.equal(v(schema, { SOME: { kind: 'nonsense' } }).ok, false);
  assert.equal(v(schema, JSON.parse(read('data/rates.json'))).ok, true);
});
