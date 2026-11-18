// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The prefix check takes a domain from the document's path by the ONE rule the reader reads a domain by,
// `<domain>/<last segment>.json`, and not from a second derivation of its own.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CONTRACT_CODES, ContractRefusal } from '../lib/codes.mjs';
import { checkItemPrefixes, domainOfPath, domainPath } from '../lib/domain.mjs';

const refusal = (docs) => {
  try { checkItemPrefixes(docs); } catch (e) { assert.ok(e instanceof ContractRefusal, e.message); return e; }
  assert.fail('not refused');
};

test('a domain\'s path and the domain it names are one rule, both ways', () => {
  assert.equal(domainPath('panel'), 'panel/panel.json');
  assert.equal(domainPath('dsp/kernels'), 'dsp/kernels/kernels.json');
  assert.equal(domainOfPath('panel/panel.json'), 'panel');
  assert.equal(domainOfPath('dsp/kernels/kernels.json'), 'dsp/kernels');
  assert.equal(domainOfPath('panel/other.json'), undefined);
  assert.equal(domainOfPath('panel.json'), undefined);
});

test('the prefix check names the domain the path gives, the one the reader uses', () => {
  const docs = [{ rel: 'dsp/kernels/kernels.json', items: ['DSP_KERNELS_KINDS'] }, { rel: 'dsp/dsp.json', items: ['DSP_KERNELS_X'] }];
  const e = refusal(docs);
  assert.equal(e.code, CONTRACT_CODES.itemPrefix);
  assert.equal(e.file, 'dsp/dsp.json');
  assert.match(e.message, /DSP_KERNELS_X of the domain dsp starts with DSP_KERNELS_, the prefix of the domain dsp\/kernels/);
});

test('a document whose path and declared domain disagree is no domain: the same refusal the reader gives', () => {
  const e = refusal([{ rel: 'panel/other.json', items: ['PANEL_X'] }]);
  assert.equal(e.code, CONTRACT_CODES.manifestMismatch);
});
