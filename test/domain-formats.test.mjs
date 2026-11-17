// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The modules of a group (docs/contract-dir.md, "Domains"): formats/common, formats/clap and formats/lv2 read as the
// classic terms items, and what a module refers to in another it names by $id.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { CONTRACT_CODES, ContractRefusal } from '../lib/codes.mjs';
import { loadContractDir } from '../lib/contract-dir.mjs';
import { loadData, resolveData } from '../lib/data.mjs';
import { formatValues, renderFormatsHeader, renderFormatsPy } from '../render/formats.mjs';
import { DATA, ROOT, scratchDir } from './helpers.mjs';
import { formatsModules } from './domain-formats.mjs';

/** A contract directory holding the modules `docs`, each as `<group>/<module>/<module>.json`. */
function dirWith(docs) {
  const root = scratchDir('omx-formats-dir-');
  for (const [name, doc] of Object.entries(docs)) {
    const p = join(root, name, `${name.split('/').pop()}.json`);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, `${JSON.stringify(doc, null, 2)}\n`);
  }
  return root;
}
const refusalOf = (root) => {
  try { loadContractDir({ dir: root }); } catch (e) { assert.ok(e instanceof ContractRefusal, e.message); return e.code; }
  assert.fail('the read was not refused');
};

test('a group of modules is read: each a domain of its own name, version and owner', () => {
  const d = loadContractDir({ dir: dirWith(formatsModules(DATA)) });
  for (const m of ['formats/common', 'formats/clap', 'formats/lv2']) {
    assert.equal(d.packages.get(m).manifest.version, '1.0.0', m);
    assert.equal(d.packages.get(m).manifest.owner, 'omx-formats', m);
  }
  assert.equal(d.items.get('CLAP_ID_TERMS').pkg, 'formats/clap');
  assert.equal(d.items.get('LV2_UNITS_TERMS').pkg, 'formats/lv2');
  assert.equal(d.items.get('FORMAT_TERM_STATUSES').pkg, 'formats/common');
});

test('the terms are the classic terms items, 297 CLAP terms and 452 LV2 terms, in their order', () => {
  const old = loadData(DATA);
  const d = loadContractDir({ dir: dirWith(formatsModules(DATA)) });
  let clap = 0;
  let lv2 = 0;
  for (const [name, { item }] of old.items) {
    if (item.kind !== 'terms') continue;
    assert.deepEqual(d.items.get(name).item, item, name);
    assert.deepEqual(Object.keys(d.items.get(name).item.terms), Object.keys(item.terms), name);
    if (item.format === 'clap') clap += Object.values(item.terms).filter((t) => t.id !== undefined).length;
    else lv2 += Object.keys(item.terms).length;
  }
  assert.equal(clap, 297);
  assert.equal(lv2, 452);
});

test('the formats renders are byte for byte the renders of the classic terms', () => {
  const old = resolveData(loadData(DATA));
  const now = resolveData(loadContractDir({ dir: dirWith(formatsModules(DATA)) }));
  assert.equal(renderFormatsHeader(now), renderFormatsHeader(old));
  assert.equal(renderFormatsPy(now), renderFormatsPy(old));
  assert.deepEqual(formatValues(now), formatValues(old));
});

test('a module refers to the common words by $id, and a reference that names nothing is refused', () => {
  const docs = formatsModules(DATA);
  docs['formats/clap'].components.schemas.CLAP_ID_TERMS['x-kinds'].$ref = 'https://openmixer.org/contract/formats/absent#/components/schemas/FORMAT_TERM_KINDS';
  assert.equal(refusalOf(dirWith(docs)), CONTRACT_CODES.refUnresolved);
  const gone = formatsModules(DATA);
  gone['formats/clap'].components.schemas.CLAP_ID_TERMS['x-statuses'].$ref = 'https://openmixer.org/contract/formats/common#/components/schemas/NO_SUCH_WORDS';
  assert.equal(refusalOf(dirWith(gone)), CONTRACT_CODES.refUnresolved);
});

test('a term whose kind or status is no word of the common module is refused', () => {
  const docs = formatsModules(DATA);
  docs['formats/clap'].components.schemas.CLAP_ID_TERMS.oneOf[0]['x-term'].kind = 'gizmo';
  assert.equal(refusalOf(dirWith(docs)), CONTRACT_CODES.fileInvalid);
  const st = formatsModules(DATA);
  st['formats/clap'].components.schemas.CLAP_ID_TERMS.oneOf[0]['x-term'].status = 'maybe';
  assert.equal(refusalOf(dirWith(st)), CONTRACT_CODES.fileInvalid);
});

test('a kind the schema allows and the common module lacks is refused: the common words decide', () => {
  const docs = formatsModules(DATA);
  const kinds = docs['formats/common'].components.schemas.FORMAT_TERM_KINDS;
  kinds.oneOf = kinds.oneOf.filter((w) => w.const !== 'flag').map((w, i) => ({ ...w, 'x-code': i }));
  assert.equal(refusalOf(dirWith(docs)), CONTRACT_CODES.fileInvalid);
});

test('a module needs the $id of its own place, and a terms item names its format, spec and version', () => {
  const docs = formatsModules(DATA);
  docs['formats/lv2'].$id = 'https://openmixer.org/contract/formats/clap';
  assert.equal(refusalOf(dirWith(docs)), CONTRACT_CODES.manifestInvalid);
  const bare = formatsModules(DATA);
  delete bare['formats/lv2'].components.schemas.LV2_UNITS_TERMS['x-spec'];
  assert.equal(refusalOf(dirWith(bare)), CONTRACT_CODES.fileInvalid);
});

test('a group directory holds modules only, and a domain directory holds no module', () => {
  const stray = dirWith(formatsModules(DATA));
  writeFileSync(join(stray, 'formats', 'README.md'), 'x\n');
  assert.equal(refusalOf(stray), CONTRACT_CODES.fileInvalid);
  const root = dirWith(formatsModules(DATA));
  writeFileSync(join(root, 'formats', 'formats.json'), '{}\n');
  assert.equal(refusalOf(root), CONTRACT_CODES.manifestMismatch);
});

/** A data tree of one words item whose word is taken `from` a term of formats/lv2, `requires` naming the domain. */
function treeRequiring(floor) {
  const tree = scratchDir('omx-formats-tree-');
  mkdirSync(join(tree, 'data'));
  writeFileSync(join(tree, 'data', 'readings.json'), `${JSON.stringify({
    $schema: '../schema/omx-contract.schema.json',
    requires: { 'formats/lv2': floor },
    READING_UNITS: { kind: 'words', since: '1.0.0', doc: 'A unit a reading is in.', words: { ms: { word: 'ms', from: ['LV2_UNITS_TERMS#ms'], doc: 'Milliseconds.' } } },
  }, null, 2)}\n`);
  return join(tree, 'data');
}
const cli = (env, ...a) => spawnSync(process.execPath, [join(ROOT, 'bin/omx-contract.mjs'), ...a], { encoding: 'utf8', env: { ...process.env, PATH: '/nonexistent', ...env } });

test('a data tree that requires a domain is read with it, and renders its own items only', () => {
  const root = dirWith(formatsModules(DATA));
  const data = treeRequiring('>= 1.0.0');
  const ok = cli({ OMX_CONTRACT_PATH: root }, 'validate', '--data', data);
  assert.equal(ok.status, 0, ok.stderr);
  const out = scratchDir('omx-formats-render-');
  const r = cli({ OMX_CONTRACT_PATH: root }, 'render', '--target', 'c', '--data', data, '--out', out);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(!r.stdout.includes('omx_formats.h') && !/omx_formats/.test(spawnSync('ls', ['-R', out], { encoding: 'utf8' }).stdout), 'the required domain is not rendered into the tree');
});

test('a requirement no directory satisfies is refused by name: absent, or below its floor', () => {
  const none = cli({ OMX_CONTRACT_PATH: '' }, 'validate', '--data', treeRequiring('>= 1.0.0'));
  assert.equal(none.status, 1);
  assert.match(none.stderr, /contract\.requires\.unresolved/);
  const old = cli({ OMX_CONTRACT_PATH: dirWith(formatsModules(DATA)) }, 'validate', '--data', treeRequiring('>= 2.0.0'));
  assert.equal(old.status, 1);
  assert.match(old.stderr, /contract\.requires\.unresolved.*below its floor/);
});
