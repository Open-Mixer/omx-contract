// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// A words item's word may carry `x-uri` (format ruling, 2026-11-20, for plugin-db#66): the absolute URI the word is
// spelt as in a format, of any scheme (an http LV2 unit URI, `urn:openmixer:unit#dBoct`), so a TTL writer reads the
// exact spelling from the domain. The data form's word carries it as `uri`. A value that is no absolute URI is
// refused by name. The conformance cases valid-word-uri and word-uri-not-a-uri hold both readers' verdicts.
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import { ContractRefusal } from '../lib/codes.mjs';
import { loadContractDir } from '../lib/contract-dir.mjs';
import { ROOT } from './helpers.mjs';

const SUITE = join(ROOT, 'test/fixtures/conformance');

test('a word\'s x-uri of any scheme is read, and the data form\'s word carries it as uri', () => {
  const read = loadContractDir({ dir: join(SUITE, 'valid-word-uri') });
  const words = read.items.get('DEMO_UNITS').item.words;
  assert.equal(words.ms.uri, 'http://lv2plug.in/ns/extensions/units#ms');
  assert.equal(words.percent.uri, 'urn:openmixer:unit#percent');
});

test('a word\'s x-uri that is no absolute URI is refused, naming x-uri and the word', () => {
  assert.throws(() => loadContractDir({ dir: join(SUITE, 'word-uri-not-a-uri') }), (e) => e instanceof ContractRefusal && e.code === 'contract.file.invalid' && /x-uri/.test(e.message) && /ms/.test(e.message));
});
