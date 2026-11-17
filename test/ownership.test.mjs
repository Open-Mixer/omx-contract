// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * The ownership gate (docs/contract-dir.md "What omx-contract owns"): clean on the committed data and lists, and red
 * on a new word in neither list, on a line added to the moving-out list, and on a listed item data/ no longer holds.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { declaredItems, ownershipProblems, parseList } from '../tools/check-ownership.mjs';
import { DATA, ROOT } from './helpers.mjs';

const list = (n) => parseList(readFileSync(join(ROOT, 'ownership', n), 'utf8'));
const owned = list('owned.txt');
const moving = list('moving-out.txt');
const items = () => declaredItems(DATA);

test('the committed data and lists are clean', () => {
  assert.deepEqual(ownershipProblems(items(), owned, moving, moving), []);
});

test('a PANEL_ word in neither list is red, named', () => {
  const it = items();
  it.set('PANEL_FAKE_WORDS', 'data/panel.json');
  const p = ownershipProblems(it, owned, moving, moving);
  assert.equal(p.length, 1);
  assert.match(p[0], /^PANEL_FAKE_WORDS \(data\/panel\.json\) is in neither/);
});

test('a name added to the moving-out list is red', () => {
  const it = items();
  it.set('NEW_THING', 'data/x.json');
  const p = ownershipProblems(it, owned, [...moving, 'NEW_THING'], moving);
  assert.equal(p.length, 1);
  assert.match(p[0], /^NEW_THING is added to ownership\/moving-out\.txt/);
});

test('a removed moving-out line passes with its item gone, and is red with the item still declared', () => {
  const it = items();
  it.delete('SCAN_DOCUMENTS');
  const rest = moving.filter((n) => n !== 'SCAN_DOCUMENTS');
  assert.deepEqual(ownershipProblems(it, owned, rest, moving), []);
  const p = ownershipProblems(items(), owned, rest, moving);
  assert.match(p[0], /^SCAN_DOCUMENTS \(.*scan\.json\) is in neither/);
});

test('a listed item data/ no longer declares is red', () => {
  const it = items();
  it.delete('CONTRACT_CODES');
  assert.match(ownershipProblems(it, owned, moving, moving)[0], /^CONTRACT_CODES is listed but data\/ declares no such item/);
});
