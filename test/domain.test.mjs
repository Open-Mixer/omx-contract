// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// A domain document (docs/contract-dir.md, "Domains"): <contractdir>/<domain>/<domain>.json, read beside the
// <major>/<package>/ layout. Its words render byte for byte what the same words item of the old layout renders, and
// every refusal is raised by the reader's own code.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, test } from 'node:test';
import { CONTRACT_CODES, ContractRefusal } from '../lib/codes.mjs';
import { loadContractDir } from '../lib/contract-dir.mjs';
import { loadData, resolveData } from '../lib/data.mjs';
import { packageVocabularyC, wordsExports } from '../render/vocabulary.mjs';
import { DATA, ROOT } from './helpers.mjs';

const SCRATCH = mkdtempSync(join(tmpdir(), 'omx-domain-'));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));
let n = 0;

/** The domain document of data/panel.json, as the owner writes it: each words item a oneOf of const words. */
function panelDomain() {
  const old = JSON.parse(readFileSync(join(DATA, 'panel.json'), 'utf8'));
  const schemas = {};
  for (const [name, it] of Object.entries(old)) {
    if (name === '$schema') continue;
    schemas[name] = {
      description: it.doc,
      'x-since': it.since,
      ...(it.why === undefined ? {} : { 'x-why': it.why }),
      oneOf: Object.entries(it.words).map(([key, w], i) => ({ const: w.word, title: key, description: w.doc, 'x-code': i, ...(w.text ? { 'x-text': w.text.en } : {}) })),
    };
  }
  return { $id: 'https://openmixer.org/contract/panel', info: { title: 'The panel vocabulary', version: '1.0.0', 'x-owner': 'omx-panel' }, components: { schemas } };
}

/** A contract directory holding the domain document `doc` as `<name>/<name>.json`. */
function dirWith(doc, name = 'panel') {
  const root = join(SCRATCH, `d-${n++}`);
  const p = join(root, name, `${name}.json`);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, `${JSON.stringify(doc, null, 2)}\n`);
  return root;
}

function refusalOf(root) {
  try { loadContractDir({ dir: root }); } catch (e) { assert.ok(e instanceof ContractRefusal, e.message); return e.code; }
  assert.fail('the read was not refused');
}

test('a domain is read: a package of its own name, its owner metadata, its own version', () => {
  const d = loadContractDir({ dir: dirWith(panelDomain()) });
  const p = d.packages.get('panel');
  assert.equal(p.manifest.version, '1.0.0');
  assert.equal(p.manifest.owner, 'omx-panel');
  assert.ok(d.items.has('PANEL_FAMILIES') && d.items.get('PANEL_FAMILIES').pkg === 'panel');
});

test('its words render byte for byte what the old layout renders: C defines, X-macros, ts words', () => {
  const old = resolveData(loadData(DATA));
  const oldHeader = packageVocabularyC(old, undefined)[0].text;
  const resolved = resolveData(loadContractDir({ dir: dirWith(panelDomain()) }));
  const [h] = packageVocabularyC(resolved, 'panel');
  assert.equal(h.path, 'panel_vocabulary.h');
  const block = (text, item) => text.slice(text.indexOf(`/* ${item} (`), text.indexOf('\n\n', text.indexOf(`/* ${item} (`))).replace(/^\/\* (\w+) \([^)]*\) \*\//, '/* $1 */');
  for (const item of ['PANEL_FAMILIES', 'PANEL_WIDGETS', 'PANEL_STANDARD_WIDGETS', 'PANEL_DISPLAY_KINDS', 'PANEL_DISPLAY_SOURCES', 'PANEL_PLACEMENTS']) {
    assert.ok(block(h.text, item).length > 100, item);
    assert.equal(block(h.text, item), block(oldHeader, item), item);
  }
  const ts = wordsExports(resolved, (w) => JSON.stringify(w));
  assert.match(ts.js, /PANEL_PLACEMENTS_WORDS = \[\s*"insert",\s*"return",\s*"bus",\s*"master"\s*\]/);
});

test('a word is any string, not only an identifier', () => {
  const doc = panelDomain();
  doc.components.schemas.PANEL_PLACEMENTS.oneOf.push({ const: 'fbs-fixed', title: 'fbsFixed', description: 'a dashed word', 'x-code': 4 });
  const d = loadContractDir({ dir: dirWith(doc) });
  assert.equal(d.items.get('PANEL_PLACEMENTS').item.words.fbsFixed.word, 'fbs-fixed');
});

const refusals = [
  ['a $id that is not the directory\'s', (d) => { d.$id = 'https://openmixer.org/contract/look'; }, CONTRACT_CODES.manifestInvalid],
  ['a version that is not x.y.z', (d) => { d.info.version = '1.0'; }, CONTRACT_CODES.manifestInvalid],
  ['an owner that is no package name', (d) => { d.info['x-owner'] = 'Omx Panel'; }, CONTRACT_CODES.manifestInvalid],
  ['an unknown key of the document', (d) => { d.paths = {}; }, CONTRACT_CODES.fileInvalid],
  ['a schema that is no oneOf', (d) => { delete d.components.schemas.PANEL_PLACEMENTS.oneOf; d.components.schemas.PANEL_PLACEMENTS.enum = ['a']; }, CONTRACT_CODES.fileInvalid],
  ['a $ref', (d) => { d.components.schemas.PANEL_PLACEMENTS.$ref = 'https://openmixer.org/contract/look#/x'; }, CONTRACT_CODES.fileInvalid],
  ['a code that is not the place', (d) => { d.components.schemas.PANEL_PLACEMENTS.oneOf[1]['x-code'] = 7; }, CONTRACT_CODES.fileInvalid],
  ['two words of one key', (d) => { d.components.schemas.PANEL_PLACEMENTS.oneOf[1].title = 'insert'; }, CONTRACT_CODES.fileInvalid],
  ['a word that is not a string', (d) => { d.components.schemas.PANEL_PLACEMENTS.oneOf[0].const = 3; }, CONTRACT_CODES.fileInvalid],
];
for (const [what, edit, code] of refusals) {
  test(`refused: ${what}`, () => {
    const doc = panelDomain();
    edit(doc);
    assert.equal(refusalOf(dirWith(doc)), code);
  });
}

test('refused: a second file beside the document, and no document', () => {
  const root = dirWith(panelDomain());
  writeFileSync(join(root, 'panel', 'extra.json'), '{}\n');
  assert.equal(refusalOf(root), CONTRACT_CODES.manifestMismatch);
  const empty = join(SCRATCH, `d-${n++}`);
  mkdirSync(join(empty, 'panel'), { recursive: true });
  assert.equal(refusalOf(empty), CONTRACT_CODES.manifestAbsent);
});

test('refused: a name two domains declare', () => {
  const root = dirWith(panelDomain());
  const other = panelDomain();
  other.$id = 'https://openmixer.org/contract/panel2';
  mkdirSync(join(root, 'panel2'));
  writeFileSync(join(root, 'panel2', 'panel2.json'), JSON.stringify(other));
  assert.equal(refusalOf(root), CONTRACT_CODES.itemDuplicate);
});

test('a consumer needs a domain at its floor, compared to the domain\'s own version', () => {
  const root = dirWith(panelDomain());
  assert.doesNotThrow(() => loadContractDir({ dir: root, needs: { panel: '>= 1.0.0' } }));
  try { loadContractDir({ dir: root, needs: { panel: '>= 1.1.0' } }); assert.fail('read'); } catch (e) { assert.equal(e.code, CONTRACT_CODES.packageTooOld); }
});

/** A domain of a groups schema, a words schema that names it, and a word taken from format terms. */
function groupedDomain() {
  const w = (c, key, extra = {}) => ({ const: c, title: key, description: `${c}.`, ...extra });
  const code = (list) => list.map((e, i) => ({ ...e, 'x-code': i }));
  return {
    $id: 'https://openmixer.org/contract/grouped',
    info: { title: 'Grouped words', version: '1.0.0', 'x-owner': 'some-owner' },
    components: {
      schemas: {
        GROUPED_KINDS: { description: 'The groups.', 'x-since': '3.0.0', oneOf: code([w('nothing-to-measure', 'nothing'), w('cannot', 'cannot')]) },
        GROUPED_REASONS: {
          description: 'Reasons.', 'x-since': '3.0.0', 'x-groups': 'GROUPED_KINDS',
          oneOf: code([
            w('no-audio-in', 'noAudioIn', { 'x-group': 'nothing-to-measure' }),
            w('impulse', 'impulse', { 'x-group': 'cannot', 'x-from': [{ $ref: 'https://openmixer.org/contract/omx-contract#/components/schemas/LV2_CORE_TERMS', 'x-term': 'latency' }] }),
          ]),
        },
      },
    },
  };
}

test('a word names its group (x-group), its item the words schema of the groups (x-groups), a word its terms ($ref + x-term)', () => {
  const d = loadContractDir({ dir: dirWith(groupedDomain(), 'grouped') });
  const it = d.items.get('GROUPED_REASONS').item;
  assert.equal(it.groups, 'GROUPED_KINDS');
  assert.equal(it.words.noAudioIn.group, 'nothing-to-measure');
  assert.deepEqual(it.words.impulse.from, ['LV2_CORE_TERMS#latency']);
});

test('a group no word of the groups schema names, and a $ref that is no domain id, are refused', () => {
  const bad = groupedDomain();
  bad.components.schemas.GROUPED_REASONS.oneOf[0]['x-group'] = 'nope';
  assert.equal(refusalOf(dirWith(bad, 'grouped')), CONTRACT_CODES.fileInvalid);
  const path = groupedDomain();
  path.components.schemas.GROUPED_REASONS.oneOf[1]['x-from'][0].$ref = '../formats/formats.json#/x';
  assert.equal(refusalOf(dirWith(path, 'grouped')), CONTRACT_CODES.fileInvalid);
});

test('a domain directory may hold catalogs/<lang>.json, and nothing else beside its document', () => {
  const root = dirWith(groupedDomain(), 'grouped');
  mkdirSync(join(root, 'grouped', 'catalogs'));
  writeFileSync(join(root, 'grouped', 'catalogs', 'ca.json'), '{}\n');
  assert.ok(loadContractDir({ dir: root }).items.has('GROUPED_REASONS'));
  writeFileSync(join(root, 'grouped', 'other.json'), '{}\n');
  assert.equal(refusalOf(root), CONTRACT_CODES.manifestMismatch);
});

test('validate reads a domain catalog: the owner is the domain x-owner, and a key is a word of the domain', () => {
  const dom = groupedDomain();
  delete dom.components.schemas.GROUPED_REASONS.oneOf[1]['x-from']; // validate would (rightly) look for the terms
  const root = dirWith(dom, 'grouped');
  const cat = (owner, key) => JSON.stringify({ kind: 'catalog', lang: 'ca', owner, messages: { [key]: { text: 'Cap.', by: 'human' } } });
  mkdirSync(join(root, 'grouped', 'catalogs'));
  const run = () => spawnSync(process.execPath, [join(ROOT, 'bin', 'omx-contract.mjs'), 'validate', '--contract-dir', root], { encoding: 'utf8' });
  writeFileSync(join(root, 'grouped', 'catalogs', 'ca.json'), cat('some-owner', 'GROUPED_REASONS.no-audio-in'));
  assert.equal(run().status, 0, run().stderr);
  writeFileSync(join(root, 'grouped', 'catalogs', 'ca.json'), cat('grouped', 'GROUPED_REASONS.no-audio-in'));
  assert.match(run().stderr, /x-owner/);
  writeFileSync(join(root, 'grouped', 'catalogs', 'ca.json'), cat('some-owner', 'GROUPED_REASONS.nope'));
  assert.match(run().stderr, /catalog-key/);
});
