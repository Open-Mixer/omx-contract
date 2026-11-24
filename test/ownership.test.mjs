// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * The ownership gate (docs/contract-dir.md "What omx-contract owns"), through its command line on a scratch copy of the
 * repository whose HEAD is the base: clean on the committed tree, and red, by name, on a new item, a new word inside an
 * existing item, a schema enum word, a line added to moving-out, an item moved back to owned, a grow exception beyond
 * its ruling, a duplicate or junk line, and a base git cannot read.
 */
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { ROOT } from './helpers.mjs';

const TOOL = join(ROOT, 'tools', 'check-ownership.mjs');
let dir;
const git = (...a) => execFileSync('git', ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@example.org', '-c', 'commit.gpgsign=false', ...a], { stdio: 'ignore' });
const read = (rel) => readFileSync(join(dir, rel), 'utf8');
const write = (rel, text) => writeFileSync(join(dir, rel), text);
const editJson = (rel, f) => { const d = JSON.parse(read(rel)); f(d); write(rel, `${JSON.stringify(d, null, 2)}\n`); };
const editList = (rel, f) => write(rel, f(read(rel).split('\n')).join('\n'));
const run = (...extra) => {
  const r = spawnSync(process.execPath, [TOOL, '--root', dir, ...(extra.includes('--base') ? [] : ['--base', 'HEAD']), ...extra], { encoding: 'utf8' });
  return { status: r.status, out: r.stdout + r.stderr };
};

before(() => {
  dir = mkdtempSync(join(tmpdir(), 'ownership-'));
  for (const d of ['data', 'contract.d', 'schema', 'shapes', 'ownership', 'tools']) cpSync(join(ROOT, d), join(dir, d), { recursive: true });
  git('init', '-q');
  git('add', '-A');
  git('commit', '-q', '-m', 'base');
});
after(() => rmSync(dir, { recursive: true, force: true }));
// every case starts from the base
const reset = () => { git('checkout', '-q', '--', '.'); git('clean', '-qfd'); };

test('the committed tree is clean', () => {
  reset();
  const r = run();
  assert.equal(r.status, 0, r.out);
});

test('a new item in neither list is red, named with its repository-relative file', () => {
  reset();
  editJson('data/resource-profile.json', (d) => { d.RESOURCE_FAKE_WORDS = d.RESOURCE_KINDS; });
  const r = run();
  assert.equal(r.status, 1);
  assert.match(r.out, /RESOURCE_FAKE_WORDS \(data\/resource-profile\.json\) is in neither/);
  assert.ok(!r.out.includes(dir), 'a message names a path relative to the repository');
});

test('a new word inside an existing item is red, named with the item and the word', () => {
  reset();
  editJson('data/resource-profile.json', (d) => { d.RESOURCE_KINDS.words.utility_x = { ...Object.values(d.RESOURCE_KINDS.words)[0] }; });
  let r = run();
  assert.equal(r.status, 1);
  assert.match(r.out, /RESOURCE_KINDS.*utility_x/);
  reset();
  editJson('data/resource-profile.json', (d) => { d.RESOURCE_UNITS.words.time_response_x = { ...Object.values(d.RESOURCE_UNITS.words)[0] }; });
  r = run();
  assert.equal(r.status, 1);
  assert.match(r.out, /RESOURCE_UNITS.*time_response_x/);
});

test('a new word in a schema enum is red, named by file and pointer', () => {
  reset();
  editJson('schema/omx-contract.schema.json', (d) => { d.$defs.meaning.enum.push('fake_meaning'); });
  let r = run();
  assert.equal(r.status, 1);
  assert.match(r.out, /schema\/omx-contract\.schema\.json#.*meaning.*fake_meaning/);
  reset();
  editJson('shapes/travel.schema.json', (d) => { const find = (o) => { for (const v of Object.values(o)) { if (v && typeof v === 'object') { if (Array.isArray(v.enum)) { v.enum.push('fake_unit'); return true; } if (find(v)) return true; } } return false; }; assert.ok(find(d)); });
  r = run();
  assert.equal(r.status, 1);
  assert.match(r.out, /shapes\/travel\.schema\.json#.*fake_unit/);
});

test('the override family enum has left (Z1, #161), the side-file fields and render are on no list', () => {
  const moving = read('ownership/moving-out.txt');
  const owned = read('ownership/owned.txt');
  assert.doesNotMatch(owned + moving, /override.*family/, 'the families are omx-panel\'s: no enum of them here');
  assert.ok(!Object.keys(JSON.parse(read('ownership/words.json'))).some((k) => /override.*family/.test(k)), 'and no words of them');
  assert.doesNotMatch(moving, /^HOSTING_VERB_HOSTS$/m, 'the verb hosts left with V29: omx-clap\'s, on no list of omx-contract');
  for (const n of ['ulp', 'doc', 'laws', 'render']) {
    assert.ok(!new RegExp(`^${n}$`, 'm').test(owned + moving), `${n} is no item`);
  }
});

test('a name added to moving-out is red, against the base', () => {
  reset();
  editJson('data/resource-profile.json', (d) => { d.NEW_THING = d.RESOURCE_KINDS; });
  editList('ownership/moving-out.txt', (l) => [...l, 'NEW_THING']);
  const r = run();
  assert.equal(r.status, 1);
  assert.match(r.out, /NEW_THING is added to ownership\/moving-out\.txt/);
});

test('a moving-out item moved back to owned is red', () => {
  reset();
  editList('ownership/moving-out.txt', (l) => l.filter((n) => n !== 'RESOURCE_UNITS'));
  editList('ownership/owned.txt', (l) => [...l, 'RESOURCE_UNITS']);
  const r = run();
  assert.equal(r.status, 1);
  assert.match(r.out, /RESOURCE_UNITS stood on ownership\/moving-out\.txt at the base/);
});

test('a word added to a moving-out item in words.json is red, even with the data matching', () => {
  reset();
  editJson('data/resource-profile.json', (d) => { d.RESOURCE_KINDS.words.utility_x = { ...Object.values(d.RESOURCE_KINDS.words)[0] }; });
  const u = spawnSync(process.execPath, [TOOL, '--root', dir, '--base', 'HEAD', '--update'], { encoding: 'utf8' });
  assert.equal(u.status, 0, u.stderr);
  const r = run();
  assert.equal(r.status, 1);
  assert.match(r.out, /RESOURCE_KINDS.*utility_x.*added.*moving out/);
});

test('a moved item and its words leave together: removing both is green', () => {
  reset();
  editJson('data/resource-profile.json', (d) => { delete d.RESOURCE_UNITS; });
  editList('ownership/moving-out.txt', (l) => l.filter((n) => n !== 'RESOURCE_UNITS'));
  editJson('ownership/words.json', (d) => { delete d.RESOURCE_UNITS; });
  const r = run();
  assert.equal(r.status, 0, r.out);
});

// ownership/grow-exceptions.txt: a moving-out item grows only by the words a ruling names (GROW_RULED). The one ruled
// growth, OMX_PARAM_CONTRACT_UNITS (coordinator 2026-11-21), went with the item when it moved to omx-clap (V23d), so
// GROW_RULED is empty and so is the file: any entry is refused by name.
const EXC = 'ownership/grow-exceptions.txt';
const MOVED = 'OMX_PARAM_CONTRACT_UNITS | dbPerOct dbPerS dbtp lu | coordinator 2026-11-21: V23d not in this pass; vendor codes 260-263 so the clap layer compiles';

test('grow exception: an entry for a moving-out item with no ruled growth is refused by name', () => {
  reset();
  write(EXC, 'RESOURCE_KINDS | utility_x | coordinator 2026-11-21: planted\n');
  const r = run();
  assert.equal(r.status, 1);
  assert.match(r.out, /grow-exceptions\.txt: RESOURCE_KINDS has no ruled growth/);
});

test('grow exception: an entry with no ruling text is refused', () => {
  reset();
  write(EXC, 'RESOURCE_KINDS | utility_x |\n');
  const r = run();
  assert.equal(r.status, 1);
  assert.match(r.out, /grow-exceptions\.txt: RESOURCE_KINDS names no ruling/);
});

test('grow exception: the moved units sheet\'s leftover entry is refused, and the empty file is green', () => {
  reset();
  write(EXC, `${MOVED}\n`);
  let r = run();
  assert.equal(r.status, 1);
  assert.match(r.out, /grow-exceptions\.txt: OMX_PARAM_CONTRACT_UNITS is not on ownership\/moving-out\.txt: .*the file is empty/);
  write(EXC, '');
  r = run();
  assert.equal(r.status, 0, r.out);
});

test('a duplicate line and a junk line are red', () => {
  reset();
  editList('ownership/owned.txt', (l) => [...l, 'CONTRACT_CODES']);
  let r = run();
  assert.equal(r.status, 1);
  assert.match(r.out, /CONTRACT_CODES is listed twice/);
  reset();
  editList('ownership/owned.txt', (l) => [...l, 'not a name!']);
  r = run();
  assert.equal(r.status, 1);
  assert.match(r.out, /junk/);
});

test('a base git cannot read is a refusal by name', () => {
  reset();
  const r = spawnSync(process.execPath, [TOOL, '--root', dir, '--base', 'no-such-ref'], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /no-such-ref is no commit git can read/);
});

test('a base that predates the gate passes once; a base with the gate but no lists is a refusal', () => {
  reset();
  const head = execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  git('rm', '-q', '-r', 'tools/check-ownership.mjs', 'ownership');
  git('commit', '-q', '-m', 'before the gate');
  git('tag', 'pre');
  git('checkout', '-q', head, '--', 'tools/check-ownership.mjs', 'ownership');
  let r = run('--base', 'pre');
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /pre predates the ownership gate/);
  git('rm', '-q', '-r', '-f', 'ownership');
  git('commit', '-q', '-m', 'the tool without its lists');
  git('tag', 'toolonly');
  git('checkout', '-q', head, '--', 'ownership');
  r = run('--base', 'toolonly');
  assert.equal(r.status, 2);
  assert.match(r.out, /toolonly carries the gate but no ownership\/moving-out\.txt/);
});

test('make ownership refuses when the base cannot be fetched', () => {
  const r = spawnSync('make', ['-C', ROOT, 'ownership', 'OWNERSHIP_REMOTE=/nonexistent-remote'], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /ownership: fetching the base from \/nonexistent-remote main failed/);
});
