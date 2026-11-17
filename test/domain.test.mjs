// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// A domain document (docs/contract-dir.md, "Domains"): <contractdir>/<domain>/<domain>.json, read beside the
// <major>/<package>/ layout. Its words render byte for byte what the same words item of the old layout renders, and
// every refusal is raised by the reader's own code.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, test } from 'node:test';
import { CONTRACT_CODES, ContractRefusal } from '../lib/codes.mjs';
import { loadContractDir } from '../lib/contract-dir.mjs';
import { resolveData } from '../lib/data.mjs';
import { packageVocabularyC, wordsExports } from '../render/vocabulary.mjs';
import { ROOT } from './helpers.mjs';

const SCRATCH = mkdtempSync(join(tmpdir(), 'omx-domain-'));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));
let n = 0;

/** A copy of omx-panel's panel domain document (contract.d/panel/panel.json), the fixture of a domain with words. */
const panelDomain = () => JSON.parse(readFileSync(join(ROOT, 'test/fixtures/domain/panel.json'), 'utf8'));

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

test('its words render as the C header, the X-macros and the ts words the committed golden holds', () => {
  const resolved = resolveData(loadContractDir({ dir: dirWith(panelDomain()) }));
  const [h] = packageVocabularyC(resolved, 'panel');
  assert.equal(h.path, 'panel_vocabulary.h');
  assert.equal(h.text, readFileSync(join(ROOT, 'test/golden/domain/panel_vocabulary.h'), 'utf8'));
  assert.match(h.text, /^#define OMX_PANEL_PLACEMENTS_BUS "bus"/m);
  assert.match(h.text, /X\(4u, "time_response", TIME_RESPONSE\)/);
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
