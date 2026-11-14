// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The Python catalog reader (share/omx-contract/omx_contract_catalog.py, docs/data-layout.md "Catalogs", omx-contract#2):
// the one lookup a Python surface such as Zynthian makes, mirroring lib/catalog.mjs's loadCatalog/sentenceOf/fill.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { ROOT, scratchDir } from './helpers.mjs';

const MODULE = join(ROOT, 'share/omx-contract/omx_contract_catalog.py');
const hasPython = spawnSync('python3', ['--version']).status === 0;

function run(code) {
  const r = spawnSync('python3', ['-I', '-c', `import runpy\nm = runpy.run_path(${JSON.stringify(MODULE)})\n${code}`], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout;
}

test('the paths: catalog_dir_of and catalog_path_of, the same shape lib/catalog.mjs gives', { skip: !hasPython && 'no python3' }, () => {
  const out = run(`
print(m["catalog_dir_of"]("plugin-db"))
print(m["catalog_path_of"]("plugin-db", "ca", "/tmp/root"))
print(m["code_key"]("contract.dir.absent"))
print(m["word_key"]("MEASUREMENT_UNMEASURED_REASONS", "no-audio-in"))
`);
  assert.deepEqual(out.trim().split('\n'), [
    '/usr/share/plugin-db/catalogs',
    '/tmp/root/plugin-db/catalogs/ca.json',
    'contract.dir.absent',
    'MEASUREMENT_UNMEASURED_REASONS.no-audio-in',
  ]);
});

test('the lookup: the catalog\'s sentence, else the source sentence, its placeholders filled', { skip: !hasPython && 'no python3' }, () => {
  const root = scratchDir('omx-catalog-py-');
  mkdirSync(join(root, 'omx-contract', 'catalogs'), { recursive: true });
  writeFileSync(join(root, 'omx-contract', 'catalogs', 'ca.json'), JSON.stringify({
    kind: 'catalog', lang: 'ca', owner: 'omx-contract', messages: { 'contract.dir.absent': 'Cap directori de contracte a {path}' },
  }));
  const out = run(`
ca = m["load_catalog"]("omx-contract", "ca", ${JSON.stringify(root)})
print(m["fill"](m["sentence_of"](ca, "contract.dir.absent", "No contract directory at {path}"), {"path": "/x"}))
print(m["sentence_of"](ca, "MEASUREMENT_UNMEASURED_REASONS.no-audio-in", "{plugin} has no audio input."))
print(m["load_catalog"]("omx-contract", "es", ${JSON.stringify(root)}))
print(m["sentence_of"](None, "contract.dir.absent", "No contract directory at {path}"))
print(m["load_catalog"]("plugin-db", "ca", ${JSON.stringify(root)}))
print(m["fill"]("{a} and {b}", {"a": 1}))
`);
  assert.deepEqual(out.trim().split('\n'), [
    'Cap directori de contracte a /x',
    '{plugin} has no audio input.',
    'None',
    'No contract directory at {path}',
    'None',
    '1 and {b}',
  ]);
});

test('a catalog whose kind, owner or lang does not match falls back, as the JS reader does', { skip: !hasPython && 'no python3' }, () => {
  const root = scratchDir('omx-catalog-py-bad-');
  mkdirSync(join(root, 'omx-contract', 'catalogs'), { recursive: true });
  for (const [name, doc] of [
    ['wrong-kind.json', { kind: 'words', lang: 'ca', owner: 'omx-contract', messages: {} }],
    ['wrong-owner.json', { kind: 'catalog', lang: 'ca', owner: 'someone-else', messages: {} }],
    ['not-json.json', '{ not json'],
  ]) writeFileSync(join(root, 'omx-contract', 'catalogs', name), typeof doc === 'string' ? doc : JSON.stringify(doc));
  for (const [path, label] of [['wrong-kind.json', 'kind'], ['wrong-owner.json', 'owner'], ['not-json.json', 'syntax']]) {
    writeFileSync(join(root, 'omx-contract', 'catalogs', 'ca.json'), readFileSync(join(root, 'omx-contract', 'catalogs', path)));
    const out = run(`print(m["load_catalog"]("omx-contract", "ca", ${JSON.stringify(root)}))`);
    assert.equal(out.trim(), 'None', label);
  }
});

test('render --check: the package manifests ship the python catalog reader beside omx_contract.py', () => {
  for (const f of [join(ROOT, 'debian/omx-contract-data.install'), join(ROOT, 'packaging/omx-contract.spec')]) {
    const text = readFileSync(f, 'utf8');
    assert.match(text, /omx_contract_catalog\.py/, f);
  }
});
