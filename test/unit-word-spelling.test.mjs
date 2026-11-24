// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * A unit word is spelled as a standard id (docs/units.md, owner rulings 2026-11-23 and 2026-11-24): camelCase, a
 * letter first, never a '-' or a '/'. `ns-per-sample` is `nsPerSample`, `dB/oct` is `dBPerOct`; the symbol a person
 * reads (`ns/sample`, `dB/oct`) is the unit's `x-symbol`, display only, never the word a wire or a file carries.
 *
 * Held here over every words item of data/ that names units (its name ends in `_UNITS`, today RESOURCE_UNITS), with a
 * positive control: the same check, given a copy of the data with the old `ns-per-sample` put back, names that word.
 * PARAM_UNITS, the param domain's consts, is held by the domain reader (src/lib/domain.mts, the camelCase check).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadData } from '../lib/data.mjs';
import { DATA } from './helpers.mjs';

const ID = /^[A-Za-z][A-Za-z0-9]*$/;

/** Every unit word of `items` (loadData's map) that is not spelled as a standard id, as `<ITEM>.<key>: "<word>"`. */
const unitWordProblems = (items) => {
  const problems = [];
  let seen = 0;
  for (const { name, item } of items.values()) {
    if (item.kind !== 'words' || !name.endsWith('_UNITS')) continue;
    for (const [key, w] of Object.entries(item.words)) {
      seen++;
      if (!ID.test(w.word)) problems.push(`${name}.${key}: "${w.word}" is no unit id (camelCase, never '-' or '/')`);
    }
  }
  return { problems, seen };
};

test('every unit word of data/ is spelled as a standard id: no "-", no "/"', () => {
  const { problems, seen } = unitWordProblems(loadData(DATA).items);
  assert.ok(seen >= 9, `the check read ${seen} unit words; RESOURCE_UNITS alone has nine`);
  assert.deepEqual(problems, []);
});

test('RESOURCE_UNITS states nanoseconds per sample as nsPerSample, the PARAM_UNITS id', () => {
  const ru = [...loadData(DATA).items.values()].find(({ name }) => name === 'RESOURCE_UNITS').item;
  assert.equal(ru.words.nsPerSample.word, 'nsPerSample');
});

test('the check names a hyphenated or slashed unit word (positive control)', () => {
  const items = loadData(DATA).items;
  const copy = new Map(items);
  const ru = structuredClone(items.get('RESOURCE_UNITS'));
  ru.item.words.nsPerSample.word = 'ns-per-sample';
  ru.item.words.ms.word = 'ms/s';
  copy.set('RESOURCE_UNITS', ru);
  const { problems } = unitWordProblems(copy);
  assert.equal(problems.length, 2);
  assert.match(problems[0], /RESOURCE_UNITS\.nsPerSample: "ns-per-sample"/);
  assert.match(problems[1], /RESOURCE_UNITS\.ms: "ms\/s"/);
});
