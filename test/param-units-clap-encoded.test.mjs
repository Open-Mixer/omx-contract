// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// PARAM_UNITS_CLAP_ENCODED (docs/units.md, V23d B2): the standard unit ids the CLAP extension encodes, a words item of
// the `param` domain whose every word is a copy of its PARAM_UNITS word, taken from it by x-from and keeping its
// x-code. omx-panel reads it to know whether a unit can be served; omx-clap's map check holds its mapping onto it. It
// is derived by tools/clap-encoded.mjs from the CLAP sheet's token-to-id map, never typed, so the served ids must be a
// prefix of PARAM_UNITS. Arms: a member that is no PARAM_UNITS word, a member whose x-code is not its source's and a
// served set that is no prefix are each refused by name.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { loadData, resolveData } from '../lib/data.mjs';
import { validateData } from '../lib/validate.mjs';
import { encodedFaults, encodedItem, ITEM, servedIds } from '../tools/clap-encoded.mjs';
import { DATA, ROOT, domainOwner } from './helpers.mjs';

const PARAM = 'contract.d/param/param.json';
const doc = () => JSON.parse(readFileSync(join(ROOT, PARAM), 'utf8'));
const units = () => doc().components.schemas.PARAM_UNITS.oneOf;

/** A scratch tree (data/, schema/, contract.d/param) whose param domain `edit` changes; `fn(dir)` runs over it. */
function scratch(edit, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'omx-clap-encoded-'));
  try {
    for (const d of ['data', 'schema', 'contract.d/param']) cpSync(join(ROOT, d), join(dir, d), { recursive: true });
    const d = doc();
    edit(d.components.schemas[ITEM]);
    writeFileSync(join(dir, PARAM), `${JSON.stringify(d, null, 2)}\n`);
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const problems = (dir) => validateData(loadData(join(dir, 'data'))).map((p) => `${p.item}:${p.rule}:${p.message}`);

test('PARAM_UNITS_CLAP_ENCODED is a words item of the param domain, each word its PARAM_UNITS word by x-from', () => {
  const item = resolveData(loadData(DATA)).get(ITEM);
  assert.equal(item?.kind, 'words');
  const s = doc().components.schemas[ITEM];
  assert.equal(s['x-kind'], 'words');
  const all = units();
  // the 33 tokens of the CLAP unit sheet, 0..24, 256..263, on 33 ids: the first 33 words of PARAM_UNITS
  assert.equal(s.oneOf.length, 33);
  s.oneOf.forEach((w, i) => {
    assert.equal(w.const, all[i].const);
    assert.equal(w['x-code'], all[i]['x-code']);
    assert.deepEqual(w['x-from'], [{ $ref: 'https://openmixer.org/contract/param#/components/schemas/PARAM_UNITS', 'x-term': all[i].title }]);
  });
  assert.deepEqual(validateData(loadData(DATA)), []);
  assert.deepEqual(encodedFaults(ROOT), [], 'the committed item is the item its own members derive');
});

test('the derivation: a token-to-id map gives its ids in PARAM_UNITS order', () => {
  assert.deepEqual(servedIds({ db: 'dB', none: 'none', pc: 'percent' }, units()), ['dB', 'percent', 'none']);
});

test('sabotage: a member that is no PARAM_UNITS word is refused by name, in the map and in the item', () => {
  assert.throws(() => servedIds({ db: 'decibel' }, units()), /PARAM_UNITS_CLAP_ENCODED: the id "decibel" of the token db is no const of PARAM_UNITS/);
  assert.throws(() => servedIds({ db: 'dB', dbAgain: 'dB' }, units()), /the tokens db and dbAgain both map to "dB"/);
  const out = scratch((s) => { s.oneOf[0]['x-from'][0]['x-term'] = 'decibel'; }, problems);
  assert.ok(out.some((p) => /^PARAM_UNITS_CLAP_ENCODED:word-from:db: PARAM_UNITS#decibel: PARAM_UNITS has no word decibel$/.test(p)), out.join('\n'));
});

test('sabotage: a member whose x-code is not its source\'s is refused by name', () => {
  const out = scratch((s) => {
    [s.oneOf[0], s.oneOf[1]] = [{ ...s.oneOf[1], 'x-code': 0 }, { ...s.oneOf[0], 'x-code': 1 }];
  }, problems);
  assert.ok(out.some((p) => /^PARAM_UNITS_CLAP_ENCODED:word-from-differs:dbfs: PARAM_UNITS#dbfs: its x-code 0 is not the named word's 1$/.test(p)), out.join('\n'));
  // the tool names the item and the word that differs, and which of its fields
  const faults = scratch((s) => { s.oneOf[0]['x-text'] = 'planted'; }, (dir) => encodedFaults(dir));
  assert.match(faults[0], /PARAM_UNITS_CLAP_ENCODED is not the item tools\/clap-encoded\.mjs derives/);
  assert.deepEqual(faults.slice(1), [`PARAM_UNITS_CLAP_ENCODED: word ${units()[0].const}: x-text differs from the derived copy`]);
  // against a map (what --check --ids reads), a word the map serves and the item lacks is named
  const map = Object.fromEntries(doc().components.schemas[ITEM].oneOf.map((w, i) => [`t${i}`, w.const]));
  const gone = scratch((s) => { s.oneOf.pop(); }, (dir) => encodedFaults(dir, map));
  assert.deepEqual(gone.slice(1), [`PARAM_UNITS_CLAP_ENCODED: word ${doc().components.schemas[ITEM].oneOf.at(-1).const}: derived, missing from the item`]);
});

test('sabotage: a served set that is no prefix of PARAM_UNITS is refused by name', () => {
  const all = units();
  assert.throws(() => encodedItem([all[0].const, all[2].const], all), /PARAM_UNITS_CLAP_ENCODED: the served set is not a prefix of PARAM_UNITS: a words copy cannot hold it/);
  assert.throws(() => encodedItem(servedIds({ db: 'dB', us: 'us' }, all), all), /the served set is not a prefix of PARAM_UNITS: a words copy cannot hold it \(us is not at its PARAM_UNITS place\)/);
  assert.doesNotThrow(() => encodedItem(servedIds({ db: 'dB', dbfs: 'dBFS' }, all), all));
});

test('the item first ships in 0.23.0, and an x-since above the domain\'s info.version is refused by name (domain-x-since)', () => {
  // the item first ships in 0.23.0, the first release of the 0.M.m line (the owner's ruling of 2026-11-25: every version
  // is 0.M.m until 1.0); the domain's info.version is that or a later minor
  assert.equal(doc().components.schemas[ITEM]['x-since'], '0.23.0');
  const [maj, min] = doc().info.version.split('.').map(Number);
  assert.ok(maj === 0 && min >= 23, `info.version ${doc().info.version} is not 0.23.0 or a later 0.x`);
  // the installed domain is where validate reads x-since: a contract directory holding the param domain, as installed
  const dir = mkdtempSync(join(tmpdir(), 'omx-clap-encoded-since-'));
  try {
    const sh = (...a) => execFileSync('sh', [join(ROOT, 'tools/install-contract-dir.sh'), ...a], { stdio: 'ignore' });
    const validate = (root) => spawnSync(process.execPath, [join(ROOT, 'bin/omx-contract.mjs'), 'validate', '--contract-dir', root], { encoding: 'utf8' });
    for (const [name, since] of [['ok', undefined], ['above', '0.24.0']]) {
      const src = join(dir, `src-${name}`, 'contract.d', 'param');
      mkdirSync(src, { recursive: true });
      const d = doc();
      if (since) d.components.schemas[ITEM]['x-since'] = since;
      writeFileSync(join(src, 'param.json'), `${JSON.stringify(d, null, 2)}\n`);
      const root = join(dir, `cd-${name}`);
      sh('--domain', src, root, domainOwner(src));
      const r = validate(root);
      if (!since) assert.doesNotMatch(r.stdout + r.stderr, /domain-x-since/, r.stdout + r.stderr);
      else assert.ok(r.stderr.includes(`param/param.json: PARAM_UNITS_CLAP_ENCODED: domain-x-since: x-since 0.24.0 is above the document's info.version ${d.info.version}`), r.stdout + r.stderr);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
