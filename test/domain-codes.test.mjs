// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// A domain renders ONE file, its codes header (docs/render.md): the items marked "x-c-codes": true as constants, with
// an X-macro only where "x-c-xmacro": true, and nothing else. Its item names carry the domain's name, and no item
// of one domain starts with the name of a longer domain (docs/contract-dir.md, "Domains").
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, test } from 'node:test';
import { CONTRACT_CODES, ContractRefusal } from '../lib/codes.mjs';
import { loadContractDir } from '../lib/contract-dir.mjs';
import { ROOT } from './helpers.mjs';

const SCRATCH = mkdtempSync(join(tmpdir(), 'omx-domain-codes-'));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));
let n = 0;

const words = (list) => list.map(([title, c], i) => ({ const: c, title, 'x-code': i }));

/** A domain document: `schemas` is { ITEM: { mark, words } }, a mark the item-level keys. */
function domain(name, schemas) {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `https://openmixer.org/contract/${name}`,
    info: { title: `The ${name} vocabulary`, version: '1.0.0', 'x-owner': 'some-owner', 'x-stability': 'experimental' },
    components: { schemas: Object.fromEntries(Object.entries(schemas).map(([item, s]) => [item, { description: `The ${item}.`, ...(s.mark ?? {}), oneOf: words(s.words) }])) },
  };
}

/** A contract directory holding each domain document `{ name: doc }` as `<name>/<name>.json`. */
function dirWith(docs) {
  const root = join(SCRATCH, `d-${n++}`);
  for (const [name, doc] of Object.entries(docs)) {
    const p = join(root, name, `${name}.json`);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, `${JSON.stringify(doc, null, 2)}\n`);
  }
  return root;
}

const panel = () => domain('panel', {
  PANEL_FAMILIES: { mark: { 'x-c-codes': true }, words: [['strip', 'strip'], ['bus', 'bus'], ['utility', 'utility']] },
  PANEL_WIDGETS: { mark: { 'x-c-codes': true, 'x-c-xmacro': true }, words: [['knob', 'knob'], ['noAudioIn', 'no-audio-in']] },
  PANEL_PLACEMENTS: { words: [['insert', 'insert'], ['master', 'master']] },
});

/** The same domain with no item marked. */
function plain() {
  const doc = panel();
  for (const s of Object.values(doc.components.schemas)) { delete s['x-c-codes']; delete s['x-c-xmacro']; }
  return doc;
}

const render = (root, target, pkg, out) => spawnSync(process.execPath, [join(ROOT, 'bin', 'omx-contract.mjs'), 'render', '--target', target, '--contract-dir', root, '--package', pkg, '--out', out], { encoding: 'utf8' });

const refusalOf = (root) => {
  try { loadContractDir({ dir: root }); } catch (e) { assert.ok(e instanceof ContractRefusal, e.message); return e; }
  assert.fail('the read was not refused');
};

const HEADER = `// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
#ifndef OMX_PANEL_CODES_H
#define OMX_PANEL_CODES_H
/*
 * GENERATED: DO NOT EDIT BY HAND.
 * Produced by \`omx-contract render --target c --package panel\` from the domain panel: the codes of its items marked
 * "x-c-codes", one OMX_<ITEM>_<WORD> per word and an OMX_<ITEM>_COUNT per item, and an OMX_<ITEM>(X) X-macro where the
 * item is marked "x-c-xmacro" as well. Nothing else of the domain is rendered: its words are read at run time.
 */

/* PANEL_FAMILIES */
#define OMX_PANEL_FAMILIES_STRIP 0u
#define OMX_PANEL_FAMILIES_BUS 1u
#define OMX_PANEL_FAMILIES_UTILITY 2u
#define OMX_PANEL_FAMILIES_COUNT 3u

/* PANEL_WIDGETS */
#define OMX_PANEL_WIDGETS_KNOB 0u
#define OMX_PANEL_WIDGETS_NO_AUDIO_IN 1u
#define OMX_PANEL_WIDGETS_COUNT 2u
#define OMX_PANEL_WIDGETS(X) \\
    X(OMX_PANEL_WIDGETS_KNOB, KNOB) \\
    X(OMX_PANEL_WIDGETS_NO_AUDIO_IN, NO_AUDIO_IN)

#endif /* OMX_PANEL_CODES_H */
`;

test('a domain renders exactly its codes header: marked items as constants, the X-macro where marked, no other file', () => {
  const out = join(SCRATCH, `o-${n++}`);
  const r = render(dirWith({ panel: panel() }), 'c', 'panel', out);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(readdirSync(out), ['panel_codes.h']);
  assert.equal(readFileSync(join(out, 'panel_codes.h'), 'utf8'), HEADER);
});

test('a domain with no marked item renders no header', () => {
  const out = join(SCRATCH, `o-${n++}`);
  const r = render(dirWith({ panel: plain() }), 'c', 'panel', out);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(!existsSync(out) || readdirSync(out).length === 0);
});

test('a domain whose name has a dash spells it with an underscore: file, guard and macros', () => {
  const out = join(SCRATCH, `o-${n++}`);
  const doc = domain('dsp-kernels', { DSP_KERNELS_KINDS: { mark: { 'x-c-codes': true }, words: [['gain', 'gain']] } });
  const r = render(dirWith({ 'dsp-kernels': doc }), 'c', 'dsp-kernels', out);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(readdirSync(out), ['dsp_kernels_codes.h']);
  const text = readFileSync(join(out, 'dsp_kernels_codes.h'), 'utf8');
  assert.match(text, /#ifndef OMX_DSP_KERNELS_CODES_H\n/);
  assert.match(text, /#define OMX_DSP_KERNELS_KINDS_GAIN 0u\n/);
});

test('a domain render writes no ts and no python file', () => {
  const root = dirWith({ panel: plain() });
  for (const target of ['ts', 'py']) {
    const out = join(SCRATCH, `o-${n++}`);
    const r = render(root, target, 'panel', out);
    assert.notEqual(r.status, 0, `${target} rendered a domain`);
    assert.ok(!existsSync(out) || readdirSync(out).length === 0, `${target} wrote files`);
  }
});

test('x-c-xmacro without x-c-codes is refused', () => {
  const doc = panel();
  delete doc.components.schemas.PANEL_WIDGETS['x-c-codes'];
  const e = refusalOf(dirWith({ panel: doc }));
  assert.equal(e.code, CONTRACT_CODES.fileInvalid);
  assert.match(e.message, /x-c-xmacro/);
});

test('x-c-codes and x-c-xmacro are booleans', () => {
  for (const key of ['x-c-codes', 'x-c-xmacro']) {
    const doc = panel();
    doc.components.schemas.PANEL_WIDGETS[key] = 'yes';
    assert.equal(refusalOf(dirWith({ panel: doc })).code, CONTRACT_CODES.fileInvalid, key);
  }
});

test('rule 1: an item name starts with its domain name, and the refusal names the item and the domain', () => {
  const doc = plain();
  doc.components.schemas.WIDGETS_EXTRA = doc.components.schemas.PANEL_PLACEMENTS;
  const e = refusalOf(dirWith({ panel: doc }));
  assert.equal(e.code, CONTRACT_CODES.itemPrefix);
  assert.equal(e.code, 'contract.item.prefix');
  assert.match(e.message, /WIDGETS_EXTRA/);
  assert.match(e.message, /panel/);
});

test('rule 1: PANELS_X does not start with PANEL_, the prefix with its underscore', () => {
  const doc = plain();
  doc.components.schemas.PANELS_X = doc.components.schemas.PANEL_PLACEMENTS;
  assert.equal(refusalOf(dirWith({ panel: doc })).code, CONTRACT_CODES.itemPrefix);
});

test('rule 2: an item of one domain that starts with a longer domain\'s prefix is refused, naming both', () => {
  const dsp = domain('dsp', { DSP_KERNELS_X: { words: [['a', 'a']] } });
  const kernels = domain('dsp-kernels', { DSP_KERNELS_KINDS: { words: [['a', 'a']] } });
  const e = refusalOf(dirWith({ dsp, 'dsp-kernels': kernels }));
  assert.equal(e.code, CONTRACT_CODES.itemPrefix);
  assert.match(e.message, /DSP_KERNELS_X/);
  assert.match(e.message, /dsp-kernels/);
  const ok = domain('dsp', { DSP_GAINS: { words: [['a', 'a']] } });
  assert.ok(loadContractDir({ dir: dirWith({ dsp: ok, 'dsp-kernels': kernels }) }).items.has('DSP_KERNELS_KINDS'));
});
