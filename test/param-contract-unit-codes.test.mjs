// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The codes of OMX_PARAM_CONTRACT_UNITS (data/param-contract.json) are the wire numbers of
// org.openmixer.param-contract/1: a plugin's get() reports them and a host decodes them, so a code is never renumbered
// and never reused. The sheet is append-only: every code below keeps its number, no two tokens share one, every token
// carries its docs line, and a token not listed here takes a code above the last vendor code. The vendor block holds
// 260 dbPerOct, 261 dbPerS, 262 dbtp and 263 lu beside 256..259. Sabotage arms: a renumbered, a reused and an
// inserted code are each named.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { ROOT } from './helpers.mjs';

const FROZEN = {
  none: 0, s: 1, ms: 2, min: 3, bar: 4, beat: 5, frame: 6, m: 7, cm: 8, mm: 9, km: 10, inch: 11, mile: 12, db: 13,
  pc: 14, coef: 15, hz: 16, khz: 17, mhz: 18, bpm: 19, oct: 20, cent: 21, semitone12TET: 22, degree: 23, midiNote: 24,
  dbfs: 256, dbu: 257, ratio: 258, lufs: 259, dbPerOct: 260, dbPerS: 261, dbtp: 262, lu: 263,
};
const LAST = Math.max(...Object.values(FROZEN));

export function codeFaults(value, docs) {
  const bad = [];
  for (const [token, code] of Object.entries(FROZEN)) {
    if (!(token in value)) bad.push(`${token} (${code}) is gone`);
    else if (value[token] !== code) bad.push(`${token} is ${value[token]}, it was ${code}`);
  }
  const seen = new Map();
  for (const [token, code] of Object.entries(value)) {
    if (seen.has(code)) bad.push(`${token} reuses ${code} of ${seen.get(code)}`);
    seen.set(code, token);
    if (!(token in FROZEN) && !(code > LAST)) bad.push(`${token} (${code}) is not appended above ${LAST}`);
    if (typeof docs?.[token] !== 'string' || docs[token] === '') bad.push(`${token} has no docs line`);
  }
  return bad;
}

const sheet = () => JSON.parse(readFileSync(join(ROOT, 'data/param-contract.json'), 'utf8')).OMX_PARAM_CONTRACT_UNITS;

test('the units sheet holds 260..263 and every code keeps its number', () => {
  const { value, docs } = sheet();
  assert.deepEqual([value.dbPerOct, value.dbPerS, value.dbtp, value.lu], [260, 261, 262, 263]);
  assert.deepEqual(codeFaults(value, docs), []);
});

test('the header defines 260..263', () => {
  const h = readFileSync(join(ROOT, 'include/omxcontract/omx_param_units.h'), 'utf8');
  for (const [name, code] of [['DB_PER_OCT', 260], ['DB_PER_S', 261], ['DBTP', 262], ['LU', 263]]) {
    assert.match(h, new RegExp(`^#define OMX_CLAP_UNIT_${name} ${code}u `, 'm'));
  }
});

test('sabotage: a renumbered, a reused and an inserted code are named', () => {
  const { value, docs } = sheet();
  assert.match(codeFaults({ ...value, dbtp: 264 }, docs).join('\n'), /dbtp is 264, it was 262/);
  assert.match(codeFaults({ ...value, planted: 13 }, { ...docs, planted: 'x' }).join('\n'), /planted reuses 13 of db/);
  assert.match(codeFaults({ ...value, planted: 30 }, { ...docs, planted: 'x' }).join('\n'), /planted \(30\) is not appended/);
});
