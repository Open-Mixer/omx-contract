// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// Units have no single owner (owner ruling 2026-11-19): a dsp unit is omx-dsp's, a panel unit omx-panel's, a plugin's
// unit the plugin's. omx-contract declares no PARAM_UNITS words item, lists none in ownership/, and translates none.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { ROOT } from './helpers.mjs';

test('omx-contract declares, owns and translates no PARAM_UNITS', () => {
  const where = [];
  for (const f of readdirSync(join(ROOT, 'data')).filter((n) => n.endsWith('.json')))
    if ('PARAM_UNITS' in JSON.parse(readFileSync(join(ROOT, 'data', f), 'utf8'))) where.push(`data/${f}`);
  if (readFileSync(join(ROOT, 'ownership/owned.txt'), 'utf8').split('\n').includes('PARAM_UNITS')) where.push('ownership/owned.txt');
  if ('PARAM_UNITS' in JSON.parse(readFileSync(join(ROOT, 'ownership/words.json'), 'utf8'))) where.push('ownership/words.json');
  for (const f of readdirSync(join(ROOT, 'catalogs')).filter((n) => n.endsWith('.json')))
    if (Object.keys(JSON.parse(readFileSync(join(ROOT, 'catalogs', f), 'utf8')).messages).some((k) => k.startsWith('PARAM_UNITS.'))) where.push(`catalogs/${f}`);
  assert.deepEqual(where, []);
});
