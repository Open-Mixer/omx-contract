// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The schemas' identity is the project's own domain, openmixer.org, never a code host's organisation, which moved once
// already (FreeMixer to Open-Mixer): every $id and $schema this package writes or ships is
// https://openmixer.org/schema/omx-contract/v<major>/<file>, the MAJOR version only, never a branch or a full
// version. A declaration's issue may name either organisation: the records of the old one keep their numbers there,
// since the numbers did not carry over.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { installedSchemaUrl, SCHEMA_MAJOR } from '../lib/contract-dir.mjs';
import { loadData, resolveData } from '../lib/data.mjs';
import { renderVocabularySchema } from '../render/vocabulary.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://openmixer.org/schema/omx-contract/';
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const schemas = ['schema/omx-contract.schema.json'];

/** every "issue" property's pattern in a schema document */
function issuePatterns(node, out = []) {
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'issue' && v && typeof v === 'object' && typeof v.pattern === 'string') out.push(v.pattern);
      issuePatterns(v, out);
    }
  }
  return out;
}

test('an issue may name either organisation, one ref of each accepted, another refused', () => {
  for (const p of schemas) {
    const pats = issuePatterns(read(p));
    assert.ok(pats.length > 0, `${p} declares an issue pattern`);
    for (const pat of pats) {
      const re = new RegExp(pat);
      assert.ok(re.test('FreeMixer/omx-clap-core#12'), `${p}: a record of the old organisation is accepted (${pat})`);
      assert.ok(re.test('Open-Mixer/omx-clap-core#3'), `${p}: a record of the new organisation is accepted (${pat})`);
      assert.ok(!re.test('Elsewhere/omx-clap-core#3'), `${p}: another owner is refused (${pat})`);
    }
  }
});

test('every shipped schema is identified on openmixer.org, by the major version only', () => {
  for (const p of [...schemas, 'share/omx-contract/omx-vocabulary.schema.json']) {
    const file = p.split('/').pop();
    assert.equal(read(p).$id, `${BASE}v${SCHEMA_MAJOR}/${file}`, `${p}: $id names the major only`);
  }
});

test('the schema a contract file names is on openmixer.org', () => {
  assert.equal(installedSchemaUrl(SCHEMA_MAJOR), `${BASE}v${SCHEMA_MAJOR}/omx-contract.schema.json`);
});

test('a rendered vocabulary schema carries the openmixer.org id, by the major version only', () => {
  const doc = JSON.parse(renderVocabularySchema(resolveData(loadData(join(ROOT, 'data'))), '9.8.7'));
  assert.equal(doc.$id, `${BASE}v9/omx-vocabulary.schema.json`);
});
