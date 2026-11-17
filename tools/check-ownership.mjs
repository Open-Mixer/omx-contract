#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/*
 * check-ownership.mjs — the items data/ declares against ownership/owned.txt and ownership/moving-out.txt
 * (docs/contract-dir.md "What omx-contract owns"): an item in neither list is red, a moving-out line the base lacks
 * is red (the list only shrinks), and a listed item data/ no longer declares is red.
 *
 *   node tools/check-ownership.mjs [--data <dir>] [--lists <dir>] [--base <ref>]
 *
 * The base is origin/main unless named; a ref git cannot read is a refusal. Exit 0 clean; 1 a finding; 2 not run.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const jsonFiles = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = join(dir, e.name);
  return e.isDirectory() ? jsonFiles(p) : e.name.endsWith('.json') ? [p] : [];
}).sort();

/** The items of data/: item name to the file that declares it (the first, on a repeat). */
export function declaredItems(dataDir) {
  const items = new Map();
  for (const f of jsonFiles(dataDir)) {
    for (const k of Object.keys(JSON.parse(readFileSync(f, 'utf8')))) {
      if (k !== '$schema' && !items.has(k)) items.set(k, f);
    }
  }
  return items;
}

/** A list file's item names: one per line, `#` lines and blanks left out. */
export const parseList = (text) => text.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));

/** The findings, each named: `items` the declared map, `owned` and `moving` the lists, `baseMoving` the base's moving-out list. */
export function ownershipProblems(items, owned, moving, baseMoving) {
  const problems = [];
  const own = new Set(owned);
  const mov = new Set(moving);
  const base = new Set(baseMoving);
  for (const [name, file] of items) {
    if (!own.has(name) && !mov.has(name)) problems.push(`${name} (${file}) is in neither ownership/owned.txt nor ownership/moving-out.txt: a new vocabulary lives with its owner, not here`);
  }
  for (const name of mov) {
    if (!base.has(name)) problems.push(`${name} is added to ownership/moving-out.txt: the list only shrinks (omx-contract#81)`);
  }
  for (const name of [...own, ...mov]) {
    if (!items.has(name)) problems.push(`${name} is listed but data/ declares no such item: a moved item leaves its line in the same change`);
  }
  for (const name of own) {
    if (mov.has(name)) problems.push(`${name} is in both lists`);
  }
  return problems;
}

function main(argv) {
  const opt = { data: join(ROOT, 'data'), lists: join(ROOT, 'ownership'), base: 'origin/main' };
  for (let i = 0; i < argv.length; i += 2) {
    const k = argv[i].replace(/^--/, '');
    if (!(k in opt) || argv[i + 1] === undefined || argv[i + 1] === '') { console.error('usage: check-ownership.mjs [--data <dir>] [--lists <dir>] [--base <ref>]'); return 2; }
    opt[k] = argv[i + 1];
  }
  const rel = 'ownership/moving-out.txt';
  let baseText;
  try {
    execFileSync('git', ['-C', ROOT, 'rev-parse', '-q', '--verify', `${opt.base}^{commit}`], { stdio: 'ignore' });
  } catch {
    console.error(`check-ownership: ${opt.base} is no commit git can read here; fetch it, the shrink check needs it`);
    return 2;
  }
  try {
    baseText = execFileSync('git', ['-C', ROOT, 'show', `${opt.base}:${rel}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    console.log(`check-ownership: ${opt.base} carries no ${rel}; the shrink check starts at the next change`);
    baseText = null;
  }
  const items = declaredItems(opt.data);
  const owned = parseList(readFileSync(join(opt.lists, 'owned.txt'), 'utf8'));
  const moving = parseList(readFileSync(join(opt.lists, 'moving-out.txt'), 'utf8'));
  const problems = ownershipProblems(items, owned, moving, baseText === null ? moving : parseList(baseText));
  for (const p of problems) console.error(`check-ownership: ${p}`);
  if (!problems.length) console.log(`check-ownership: ${items.size} items, ${owned.length} owned, ${moving.length} moving out`);
  return problems.length ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
