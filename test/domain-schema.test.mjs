// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The schema of a domain document (docs/contract-dir.md, "Domains"): schema/domain.schema.json accepts what the
// reader accepts and refuses what the reader refuses, as far as JSON Schema can say it, and the package ships it
// beside omx-contract.schema.json: exported, typed, installed, packaged.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import { DATA, ROOT } from './helpers.mjs';
import { CONTRACT_FORMAT } from '../lib/contract-dir.mjs';

const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const PATH = 'schema/domain.schema.json';
const ID = 'https://openmixer.org/schema/omx-contract/v0/domain.schema.json';
const schema = existsSync(join(ROOT, PATH)) ? JSON.parse(read(PATH)) : {};
const validate = new Ajv2020({ allErrors: true, strict: true }).compile(existsSync(join(ROOT, PATH)) ? schema : {});

/** The domain document of a data/ words file, as its owner writes it. */
function domainOf(file) {
  const old = JSON.parse(readFileSync(join(DATA, file), 'utf8'));
  const schemas = {};
  for (const [name, it] of Object.entries(old)) {
    if (it?.kind !== 'words') continue;
    schemas[name] = {
      description: it.doc,
      ...(it.since === undefined ? {} : { 'x-since': it.since }),
      ...(it.why === undefined ? {} : { 'x-why': it.why }),
      oneOf: Object.entries(it.words).map(([key, w], i) => ({ const: w.word, title: key, ...(w.doc ? { description: w.doc } : {}), 'x-code': i, ...(w.text ? { 'x-text': w.text.en } : {}) })),
    };
  }
  return Object.keys(schemas).length ? { name: file.replace(/\.json$/, ''), schemas } : undefined;
}
const wrap = (name, schemas) => ({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: `https://openmixer.org/contract/${name}`, 'x-omx-contract': CONTRACT_FORMAT,
  info: { title: `The ${name} vocabulary`, version: '1.0.0', 'x-owner': 'omx-contract', 'x-stability': 'experimental' },
  components: { schemas },
});
const word = (title, c, i, more = {}) => ({ const: c, title, 'x-code': i, ...more });
const small = () => wrap('panel', { PANEL_FAMILIES: { description: 'The families.', oneOf: [word('strip', 'strip', 0)] } });
const grouped = () => wrap('grouped', {
  GROUPED_KINDS: { description: 'The groups.', 'x-since': '3.0.0', 'x-why': 'Because.', 'x-c-codes': true, 'x-c-xmacro': true, oneOf: [word('cannot', 'cannot', 0, { description: 'No.', 'x-text': 'It cannot.' })] },
  GROUPED_REASONS: {
    description: 'Reasons.', 'x-groups': 'GROUPED_KINDS',
    oneOf: [word('impulse', 'impulse', 0, { 'x-group': 'cannot', 'x-from': [{ $ref: 'https://openmixer.org/contract/omx-contract#/components/schemas/LV2_CORE_TERMS', 'x-term': 'latency' }] })],
  },
});
const nestedRef = () => wrap('grouped', { GROUPED_REASONS: { description: 'Reasons.', oneOf: [word('impulse', 'impulse', 0, { 'x-from': [{ $ref: 'https://openmixer.org/contract/dsp/kernels#/components/schemas/X', 'x-term': 't' }] })] } });
const nested = () => wrap('dsp/kernels', { DSP_KERNELS_KINDS: { description: 'Kinds.', oneOf: [word('a', 'a', 0)] } });

test('the schema is JSON Schema 2020-12 with its $id on openmixer.org, major only', () => {
  assert.ok(existsSync(join(ROOT, PATH)), `${PATH} exists`);
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(schema.$id, ID);
});

test('the domain documents of the repo validate: every words file of data/ written as a domain, and the shapes the tests read', () => {
  const docs = readdirSync(DATA).filter((f) => f.endsWith('.json')).map(domainOf).filter(Boolean).map(({ name, schemas }) => wrap(name, schemas));
  assert.ok(docs.length > 0, 'data/ holds words files');
  for (const doc of [...docs, small(), grouped(), nested(), nestedRef(), { ...small(), info: { ...small().info, 'x-stability': 'stable' } }]) assert.ok(validate(doc), `${doc.$id}: ${JSON.stringify(validate.errors)}`);
});

const breaks = {
  'no $schema': (d) => { delete d.$schema; },
  'another dialect': (d) => { d.$schema = 'http://json-schema.org/draft-07/schema#'; },
  'no $id': (d) => { delete d.$id; },
  'a $id of the schema form': (d) => { d.$id = 'https://openmixer.org/schema/omx-contract/v0/panel.schema.json'; },
  'a $id with a fragment': (d) => { d.$id = 'https://openmixer.org/contract/panel#x'; },
  'a $id of an upper case domain': (d) => { d.$id = 'https://openmixer.org/contract/Panel'; },
  'no info': (d) => { delete d.info; },
  'no info.version': (d) => { delete d.info.version; },
  'a version that is not x.y.z': (d) => { d.info.version = '1.0'; },
  'no info.title': (d) => { delete d.info.title; },
  'an empty info.title': (d) => { d.info.title = ''; },
  'no info.x-owner': (d) => { delete d.info['x-owner']; },
  'an owner that is no package name': (d) => { d.info['x-owner'] = 'Omx_Panel'; },
  'no info.x-stability': (d) => { delete d.info['x-stability']; },
  'an x-stability that is neither experimental nor stable': (d) => { d.info['x-stability'] = 'beta'; },
  'an unknown key of info': (d) => { d.info['x-note'] = 'stable'; },
  'an unknown top-level key': (d) => { d.paths = {}; },
  'no components': (d) => { delete d.components; },
  'an unknown key of components': (d) => { d.components.parameters = {}; },
  'no schemas': (d) => { d.components.schemas = {}; },
  'an item that is not upper snake case': (d) => { d.components.schemas.panelFamilies = d.components.schemas.PANEL_FAMILIES; },
  'an item with a $ref': (d) => { d.components.schemas.PANEL_FAMILIES.$ref = '#/components/schemas/X'; },
  'an unknown key of an item': (d) => { d.components.schemas.PANEL_FAMILIES.type = 'string'; },
  'an item without oneOf': (d) => { delete d.components.schemas.PANEL_FAMILIES.oneOf; },
  'an item with an empty oneOf': (d) => { d.components.schemas.PANEL_FAMILIES.oneOf = []; },
  'an item without description': (d) => { delete d.components.schemas.PANEL_FAMILIES.description; },
  'an x-c-codes that is no boolean': (d) => { d.components.schemas.PANEL_FAMILIES['x-c-codes'] = 'yes'; },
  'x-c-xmacro without x-c-codes': (d) => { d.components.schemas.PANEL_FAMILIES['x-c-xmacro'] = true; },
  'x-c-xmacro with x-c-codes false': (d) => { Object.assign(d.components.schemas.PANEL_FAMILIES, { 'x-c-codes': false, 'x-c-xmacro': true }); },
  'a word without x-code': (d) => { delete d.components.schemas.PANEL_FAMILIES.oneOf[0]['x-code']; },
  'an x-code that is no whole number': (d) => { d.components.schemas.PANEL_FAMILIES.oneOf[0]['x-code'] = 0.5; },
  'a negative x-code': (d) => { d.components.schemas.PANEL_FAMILIES.oneOf[0]['x-code'] = -1; },
  'a word without const': (d) => { delete d.components.schemas.PANEL_FAMILIES.oneOf[0].const; },
  'an empty const': (d) => { d.components.schemas.PANEL_FAMILIES.oneOf[0].const = ''; },
  'a word without title': (d) => { delete d.components.schemas.PANEL_FAMILIES.oneOf[0].title; },
  'a title that is no key': (d) => { d.components.schemas.PANEL_FAMILIES.oneOf[0].title = 'no-key'; },
  'an unknown key of a word': (d) => { d.components.schemas.PANEL_FAMILIES.oneOf[0].default = true; },
  'an x-text that is no string': (d) => { d.components.schemas.PANEL_FAMILIES.oneOf[0]['x-text'] = 1; },
  'an empty x-from': (d) => { d.components.schemas.PANEL_FAMILIES.oneOf[0]['x-from'] = []; },
  'an x-from $ref that is no domain item': (d) => { d.components.schemas.PANEL_FAMILIES.oneOf[0]['x-from'] = [{ $ref: '../formats/formats.json#/x', 'x-term': 't' }]; },
  'an x-from without x-term': (d) => { d.components.schemas.PANEL_FAMILIES.oneOf[0]['x-from'] = [{ $ref: 'https://openmixer.org/contract/formats#/components/schemas/LV2_CORE_TERMS' }]; },
};
for (const [what, mutate] of Object.entries(breaks)) {
  test(`the schema refuses ${what}`, () => {
    const d = structuredClone(small());
    mutate(d);
    assert.equal(validate(d), false);
  });
}

test('the schema says a document is <domain>/<last segment>.json, as the reader places it', () => {
  assert.match(schema.description ?? '', /<contractdir>\/<domain>\/<last segment>\.json/);
  assert.doesNotMatch(schema.description ?? '', /<domain>\/<domain>\.json/);
});

test('the schema names the rules it leaves to the reader', () => {
  for (const rule of ['prefix', 'x-code', 'x-groups', 'x-group', 'twice', 'directory']) assert.match(schema.description ?? '', new RegExp(rule), `description names the ${rule} rule`);
});

test('the package exports the schema as a file and as a typed constant, and ships both', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.exports['./domain.schema.json'], './schema/domain.schema.json');
  assert.deepEqual(pkg.exports['./domain-schema'], { types: './lib/domain-schema.d.mts', import: './lib/domain-schema.mjs' });
  assert.ok(pkg.files.includes('schema/'));
  const src = read('src/lib/domain-schema.mts');
  assert.match(src, /as const;\s*$/);
  const out = execFileSync('node', ['tools/domain-schema-ts.mjs', '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.match(out, /in step/);
});

test('the install, the packages and the file list carry it beside omx-contract.schema.json', () => {
  const make = execFileSync('make', ['-n', 'install', 'install-cli', 'DESTDIR=/nowhere'], { cwd: ROOT, encoding: 'utf8' });
  assert.match(make, /schema\/domain\.schema\.json[^\n]*\/omx-contract\/\n/, 'make install: share dir');
  assert.match(make, /schema\/domain\.schema\.json \/nowhere[^\n]*\/schema\/\n/, 'make install-cli: the command tree');
  assert.match(read('debian/omx-contract-data.install'), /^usr\/share\/omx-contract\/domain\.schema\.json$/m);
  assert.match(read('packaging/omx-contract.spec'), /^%\{_datadir\}\/omx-contract\/domain\.schema\.json$/m);
  assert.match(read('tools/package-files.sh'), /echo \/usr\/share\/omx-contract\/domain\.schema\.json/);
});
