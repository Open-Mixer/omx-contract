// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// render --target md (docs/render.md, "The domains as a reference"; omx-contract#202): one page per domain and per
// package, each item with its kind, since and doc and a table of its words or codes; an item, word or code with no
// doc refuses the render by page, item and word, and nothing is written; --check holds a directory to the render.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { loadData, resolveData } from '../lib/data.mjs';
import { pageOf, renderMd } from '../render/md.mjs';
import { ROOT, scratchData, scratchDir } from './helpers.mjs';

const cli = (...a) => spawnSync(process.execPath, [join(ROOT, 'bin/omx-contract.mjs'), ...a], { encoding: 'utf8' });

test('render --target md writes one page per domain and one for the package\'s classic items', () => {
  const out = scratchDir('omx-md-');
  const r = cli('render', '--target', 'md', '--out', out);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(join(out, 'param.md')) && existsSync(join(out, 'omx-contract.md')));
  const param = readFileSync(join(out, 'param.md'), 'utf8');
  assert.match(param, /^# param$/m);
  assert.match(param, /^## PARAM_MEANINGS\n\nwords, since 0\.23\.0\. What a descriptor control does/m);
  assert.match(param, /^\| `bandwidth` \| bandwidth \|  \|  \| An EQ band's or a filter's width, in octaves; q is its quality factor\. \|$/m);
  assert.match(param, /^\| `dB` \| db \| param \| dB \| Decibels, a gain or a level relative to unity\. \|$/m, 'a unit word shows its symbol');
  assert.match(param, /^Ids: `linear`, `log`, `stepped`\. Default: `linear`\.$/m, 'a set lists its ids and default');
  const own = readFileSync(join(out, 'omx-contract.md'), 'utf8');
  assert.match(own, /^## RESOURCE_HINTS$/m);
  assert.match(own, /^Values: .*\(Hz\)\.$/m, 'a list shows its values and unit');
  assert.equal(cli('render', '--target', 'md', '--out', out, '--check').status, 0, 'a fresh render passes --check');
  writeFileSync(join(out, 'param.md'), `${param}x\n`);
  const c = cli('render', '--target', 'md', '--out', out, '--check');
  assert.equal(c.status, 1);
  assert.match(c.stderr, /param\.md differs/);
});

test('the doc check: an item, a word and a code with no doc are refused by page, item and word, and nothing is written', () => {
  const data = scratchData();
  const file = join(data, 'resource-profile.json');
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  delete doc.RESOURCE_UNITS.words.ms.doc;
  delete doc.RESOURCE_BASES.doc;
  writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`);
  const resolved = resolveData(loadData(data));
  assert.throws(() => renderMd(resolved), (e) => /omx-contract: RESOURCE_UNITS: ms: the word has no doc/.test(e.message) && /omx-contract: RESOURCE_BASES: the item has no doc/.test(e.message));
  const out = join(scratchDir('omx-md-'), 'pages');
  const r = cli('render', '--target', 'md', '--data', data, '--out', out);
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stderr, /RESOURCE_UNITS: ms: the word has no doc/);
  assert.ok(!existsSync(out), 'nothing written');
});

test('a page: a domain item is on its domain\'s page (a nested domain\'s / read -), a classic item on its package\'s', () => {
  assert.equal(pageOf({ rel: 'param/param.json' }, 'omx-contract'), 'param');
  assert.equal(pageOf({ rel: 'dsp/kernels/kernels.json' }, 'x'), 'dsp-kernels');
  assert.equal(pageOf({ rel: 'data/rates.json' }, 'omx-contract'), 'omx-contract');
  assert.equal(pageOf({ rel: 'kernels/eq.json', pkg: 'omx-dsp' }, 'omx-contract'), 'omx-dsp');
});
