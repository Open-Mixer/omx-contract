// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The domain format carries verbs, reply codes and terms items (vocabulary sorting pass, S0; ruled 2026-11-20):
//  - a words item of `x-kind` verbs: each word a verb, `const` its wire word, `title` its key, `description` its doc,
//    `x-format`, `x-reply`, `x-codes`, `x-implemented-by` and `x-since` its format, reply, codes, implementedBy and
//    since; read and rebuilt as the data form's verbs item (plugin-hostd-protocol's V15/V16 items);
//  - a code's `x-resp` and `x-transient`: a reply code's resp and transient;
//  - a words item of `x-kind` terms: `x-format`, `x-spec`, `x-version` (and `x-deprecated`) the item's, each word a
//    term, `const` and `title` its key, `x-code` its place, `x-term` the term as the data form writes it; read and
//    rebuilt as the data form's terms item (the LV2 and CLAP terms of V27a/b). The runtime readers (the C loader and
//    openDomainAt, test/fixtures/conformance) serve a verbs or terms item as words: the words are the verbs and the
//    term keys.
// The fixtures are data files as their owners write them today: plugin-hostd-protocol's data/verbs.json, and
// omx-contract's lv2 units sheet and clap plugin-features sheet (its data/formats directory). Written as a domain, the
// rebuild gives each back, key for key and in order.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import { SCHEMA_MAJOR, installedSchemaUrl } from '../lib/contract-dir.mjs';
import { domainDataFiles, readDomain } from '../lib/domain.mjs';
import { openDomainAt } from '../lib/domain-reader.mjs';
import { fileProblems } from '../lib/validate.mjs';
import { ROOT } from './helpers.mjs';

const FIX = join(ROOT, 'test/fixtures/domain-verbs-terms');
const SCRATCH = mkdtempSync(join(tmpdir(), 'omx-domain-verbs-terms-'));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));
const data = (f) => JSON.parse(readFileSync(join(FIX, f), 'utf8'));
const drop = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

/** One data item in its domain form. */
function itemOf(it, file) {
  const head = { description: it.doc, 'x-since': it.since, 'x-why': it.why, 'x-kind': it.kind, 'x-file': file };
  if (it.kind === 'codes') {
    return drop({ ...head, oneOf: Object.entries(it.codes).map(([k, c], i) => drop({ const: c.code, title: k, description: c.doc, 'x-code': i, 'x-text': c.text?.en, 'x-args': c.args, 'x-name': k, 'x-resp': c.resp, 'x-transient': c.transient, 'x-leaves-no-mark': c.leavesNoMark })) });
  }
  if (it.kind === 'verbs') {
    return drop({ ...head, oneOf: Object.entries(it.verbs).map(([k, v], i) => drop({ const: v.verb, title: k, description: v.doc, 'x-code': i, 'x-format': v.format, 'x-reply': v.reply, 'x-codes': v.codes, 'x-implemented-by': v.implementedBy, 'x-since': v.since })) });
  }
  if (it.kind === 'words') {
    return drop({ ...head, oneOf: Object.entries(it.words).map(([k, w], i) => drop({ const: w.word, title: k, description: w.doc, 'x-code': i, 'x-text': w.text?.en, 'x-args': w.args })) });
  }
  if (it.kind === 'terms') {
    return drop({ ...head, 'x-format': it.format, 'x-spec': it.spec, 'x-version': it.version, 'x-deprecated': it.deprecated, oneOf: Object.entries(it.terms).map(([k, t], i) => ({ const: k, title: k, 'x-code': i, 'x-term': t })) });
  }
  throw new Error(`no domain form for kind ${it.kind}`);
}

/** The data file `doc` (its `$schema` and `requires` aside) as the domain `name`, rebuilt into `file`. */
function domainOf(name, doc, file) {
  const { $schema: _s, requires, ...items } = doc;
  const extra = requires ?? [];
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `https://openmixer.org/contract/${name}`,
    info: { title: `The ${name} sample`, version: '1.0.0', 'x-owner': name, 'x-stability': 'experimental', ...(extra.length ? { 'x-requires': extra } : {}) },
    components: { schemas: Object.fromEntries(Object.entries(items).map(([k, it]) => [k, itemOf(it, file)])) },
  };
}

const read = (name, doc) => readDomain(name, doc, installedSchemaUrl(SCHEMA_MAJOR), SCHEMA_MAJOR);
const itemsText = (doc) => JSON.stringify(Object.fromEntries(Object.entries(doc).filter(([k]) => k !== '$schema' && k !== 'requires')), null, 2);

const CASES = [
  { name: 'plugin-hostd', fixture: 'verbs.json', file: 'verbs.json' },
  { name: 'lv2', fixture: 'lv2-units.json', file: 'lv2/units.json' },
  { name: 'clap', fixture: 'clap-plugin-features.json', file: 'clap/plugin-features.json' },
];

for (const { name, fixture, file } of CASES) {
  test(`${fixture}: written as the domain ${name}, the rebuild gives every item back, key for key and in order`, () => {
    const doc = domainOf(name, data(fixture), file);
    const rebuilt = JSON.parse(domainDataFiles(name, doc)[file]);
    assert.equal(itemsText(rebuilt), itemsText(data(fixture)));
  });

  test(`${fixture}: the build reads the domain ${name} as valid data, and the domain schema accepts it`, () => {
    const doc = domainOf(name, data(fixture), file);
    const { doc: classic } = read(name, doc);
    const problems = fileProblems({ rel: `${name}/${name}.json`, text: JSON.stringify(classic), doc: classic, pkg: name, installed: true });
    assert.deepEqual(problems, []);
    const schema = JSON.parse(readFileSync(join(ROOT, 'schema/domain.schema.json'), 'utf8'));
    const v = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
    assert.ok(v(doc), JSON.stringify(v.errors?.slice(0, 5)));
  });

  test(`${fixture}: the runtime reader opens the domain ${name} and serves each item's words`, () => {
    const doc = domainOf(name, data(fixture), file);
    const dir = join(SCRATCH, name);
    mkdirSync(join(dir, name), { recursive: true });
    writeFileSync(join(dir, name, `${name}.json`), JSON.stringify(doc, null, 2));
    const d = openDomainAt(dir, name);
    for (const [item, it] of Object.entries(data(fixture)).filter(([k]) => k !== '$schema' && k !== 'requires')) {
      const want = it.kind === 'verbs' ? Object.values(it.verbs).map((v) => v.verb)
        : it.kind === 'terms' ? Object.keys(it.terms)
          : it.kind === 'codes' ? Object.values(it.codes).map((c) => c.code) : Object.values(it.words).map((w) => w.word);
      assert.deepEqual(d.words(item).map((w) => w.word), want, item);
    }
  });
}

test('a verb reads as the data form\'s verb; a reply code keeps its resp and transient', () => {
  const doc = domainOf('plugin-hostd', data('verbs.json'), 'verbs.json');
  const { doc: classic } = read('plugin-hostd', doc);
  const src = data('verbs.json');
  assert.deepEqual(classic.PLUGIN_HOSTD_PROTOCOL_VERBS, src.PLUGIN_HOSTD_PROTOCOL_VERBS);
  const rebuilt = JSON.parse(domainDataFiles('plugin-hostd', doc)['verbs.json']);
  assert.deepEqual(rebuilt.PLUGIN_HOSTD_REPLY_CODES.codes.workerSpawn, src.PLUGIN_HOSTD_REPLY_CODES.codes.workerSpawn);
  assert.equal(rebuilt.PLUGIN_HOSTD_REPLY_CODES.codes.workerSpawn.transient, true);
});

test('a reply code keeps its leavesNoMark: x-leaves-no-mark (3.23.0) is the data form\'s leavesNoMark', () => {
  const src = data('verbs.json');
  const codes = src.PLUGIN_HOSTD_REPLY_CODES.codes;
  const [key] = Object.keys(codes).filter((k) => codes[k].resp !== undefined && !codes[k].transient);
  const marked = { ...src, PLUGIN_HOSTD_REPLY_CODES: { ...src.PLUGIN_HOSTD_REPLY_CODES, codes: { ...codes, [key]: { ...codes[key], leavesNoMark: true } } } };
  const doc = domainOf('plugin-hostd', marked, 'verbs.json');
  const word = doc.components.schemas.PLUGIN_HOSTD_REPLY_CODES.oneOf.find((w) => w.title === key);
  assert.equal(word['x-leaves-no-mark'], true);
  const rebuilt = JSON.parse(domainDataFiles('plugin-hostd', doc)['verbs.json']);
  assert.equal(rebuilt.PLUGIN_HOSTD_REPLY_CODES.codes[key].leavesNoMark, true);
  assert.deepEqual(rebuilt.PLUGIN_HOSTD_REPLY_CODES.codes[key], marked.PLUGIN_HOSTD_REPLY_CODES.codes[key]);
  const { doc: classic } = read('plugin-hostd', doc);
  assert.equal(classic.PLUGIN_HOSTD_REPLY_CODES.codes[key].leavesNoMark, true);
  // refused by name: not a boolean, and on a word that is no code
  assert.match(refusal('plugin-hostd', 'verbs.json', 'verbs.json', (s) => { s.PLUGIN_HOSTD_REPLY_CODES.oneOf[0]['x-leaves-no-mark'] = 'yes'; }), /x-leaves-no-mark is not true or false/);
  assert.match(refusal('plugin-hostd', 'verbs.json', 'verbs.json', (s) => { s.PLUGIN_HOSTD_PROTOCOL_EXTENSIONS.oneOf[0]['x-leaves-no-mark'] = true; }), /x-leaves-no-mark.*only a code/);
});

test('a terms item reads as the data form\'s terms item', () => {
  const doc = domainOf('lv2', data('lv2-units.json'), 'lv2/units.json');
  const { doc: classic } = read('lv2', doc);
  assert.deepEqual(classic.LV2_UNITS_TERMS, data('lv2-units.json').LV2_UNITS_TERMS);
});

/** The domain of `fixture` changed by `f`, read: the refusal's message. */
function refusal(name, fixture, file, f) {
  const doc = domainOf(name, data(fixture), file);
  f(doc.components.schemas);
  try { read(name, doc); } catch (e) { return e.message; }
  assert.fail('read');
}

test('refused by name: a verb with no x-format, a verb key on a words item, x-resp on a word that is no code', () => {
  assert.match(refusal('plugin-hostd', 'verbs.json', 'verbs.json', (s) => { delete s.PLUGIN_HOSTD_VERBS.oneOf[0]['x-format']; }), /x-format.*a verb/);
  assert.match(refusal('plugin-hostd', 'verbs.json', 'verbs.json', (s) => { s.PLUGIN_HOSTD_PROTOCOL_EXTENSIONS.oneOf[0]['x-reply'] = 'resp 0'; }), /x-reply.*only a verb/);
  assert.match(refusal('plugin-hostd', 'verbs.json', 'verbs.json', (s) => { s.PLUGIN_HOSTD_PROTOCOL_EXTENSIONS.oneOf[0]['x-resp'] = -1; }), /x-resp.*only a code/);
});

test('refused by name: a term with no x-term, a term whose title is not its key, a terms item with no x-format', () => {
  assert.match(refusal('lv2', 'lv2-units.json', 'lv2/units.json', (s) => { delete s.LV2_UNITS_TERMS.oneOf[0]['x-term']; }), /x-term.*a term/);
  assert.match(refusal('lv2', 'lv2-units.json', 'lv2/units.json', (s) => { s.LV2_UNITS_TERMS.oneOf[0].title = 'other'; }), /title.*the term's key/);
  assert.match(refusal('lv2', 'lv2-units.json', 'lv2/units.json', (s) => { delete s.LV2_UNITS_TERMS['x-format']; }), /x-format.*a terms item/);
});
