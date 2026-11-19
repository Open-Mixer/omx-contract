// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// `fmt` formats a domain document (docs/contract-dir.md, "Domains") by the one rule of the classic data files: two-space
// indent, one key per line, keys in the document schema's order, names and lists in the order the author gave them,
// a trailing newline. A domain document the reader accepts is neither skipped nor formatted as its classic image.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { ROOT } from './helpers.mjs';

const cli = (...a) => spawnSync(process.execPath, [join(ROOT, 'bin/omx-contract.mjs'), ...a], { encoding: 'utf8' });
const SCRATCH = mkdtempSync(join(tmpdir(), 'omx-fmt-domain-'));

const DOC = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://openmixer.org/contract/shade',
  info: { title: 'The shade vocabulary', version: '1.0.0', 'x-owner': 'omx-fixture', 'x-stability': 'experimental' },
  components: {
    schemas: {
      SHADE_TONES: {
        description: 'The tones of a shade, darkest last.',
        'x-since': '1.0.0',
        'x-c-codes': true,
        oneOf: [
          { const: 'light', title: 'light', description: 'The pale one.', 'x-code': 0, 'x-text': 'Light', 'x-from': [{ $ref: 'https://openmixer.org/contract/shade#/components/schemas/SHADE_KINDS', 'x-term': 'pale' }] },
          { const: 'dark', title: 'dark', 'x-code': 1 },
        ],
      },
      SHADE_KINDS: {
        description: 'A second schema, declared after the first, kept after it.',
        oneOf: [{ const: 'pale', title: 'pale', 'x-code': 0 }],
      },
    },
  },
};
const canonical = `${JSON.stringify(DOC, null, 2)}\n`;

/** A contract tree holding the domain document `text` as shade/shade.json. */
function tree(text) {
  const root = mkdtempSync(join(SCRATCH, 'c-'));
  mkdirSync(join(root, 'shade'));
  writeFileSync(join(root, 'shade', 'shade.json'), text);
  return root;
}

test('fmt --check passes a domain document in the one formatting', () => {
  const r = cli('fmt', '--check', '--contract-dir', tree(canonical));
  assert.equal(r.status, 0, r.stderr);
});

test('fmt turns a mis-indented domain document into the one formatting, and a second fmt changes nothing', () => {
  const root = tree(JSON.stringify(DOC));
  const p = join(root, 'shade', 'shade.json');
  assert.equal(cli('fmt', '--check', '--contract-dir', root).status, 1);
  assert.equal(cli('fmt', '--contract-dir', root).status, 0);
  assert.equal(readFileSync(p, 'utf8'), canonical);
  assert.equal(cli('fmt', '--contract-dir', root).status, 0);
  assert.equal(readFileSync(p, 'utf8'), canonical, 'idempotent');
  assert.equal(cli('fmt', '--check', '--contract-dir', root).status, 0);
});

test('fmt puts the keys of a domain document in the schema order and keeps every list and name where the author put it', () => {
  const shuffled = {
    components: { schemas: Object.fromEntries(Object.entries(DOC.components.schemas).map(([k, s]) => [k, { oneOf: s.oneOf.map((w) => Object.fromEntries(Object.entries(w).reverse())), ...Object.fromEntries(Object.entries(s).filter(([x]) => x !== 'oneOf').reverse()) }])) },
    info: Object.fromEntries(Object.entries(DOC.info).reverse()),
    $id: DOC.$id,
    $schema: DOC.$schema,
  };
  const root = tree(JSON.stringify(shuffled, null, 4));
  assert.equal(cli('fmt', '--contract-dir', root).status, 0);
  assert.equal(readFileSync(join(root, 'shade', 'shade.json'), 'utf8'), canonical);
});

test('every domain document of the fixtures is in the one formatting', async () => {
  const { formatDomain } = await import('../lib/fmt.mjs');
  const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? (f === 'catalogs' ? [] : walk(join(d, f))) : [join(d, f)]));
  for (const f of walk(join(ROOT, 'test/fixtures/domain')).filter((x) => !x.endsWith('notjson.json'))) {
    assert.equal(readFileSync(f, 'utf8'), formatDomain(JSON.parse(readFileSync(f, 'utf8'))), f);
  }
});
