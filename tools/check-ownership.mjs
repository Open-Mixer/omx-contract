#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/*
 * check-ownership.mjs — what data/ and the schemas declare against ownership/owned.txt, ownership/moving-out.txt and
 * ownership/words.json (docs/contract-dir.md "What omx-contract owns"): an item in neither list, a word the item's
 * word set lacks, a name or word added to what is moving out, a moving-out name moved back to owned, a duplicate or
 * junk line and a listed item the data no longer holds are each a finding, named.
 *
 *   node tools/check-ownership.mjs [--root <repo>] [--base <ref>] [--update]
 *
 * The base is origin/main unless named; a ref git cannot read is a refusal. A base that predates the gate (it holds no
 * tools/check-ownership.mjs) is passed once, with a message; a base with the gate and no lists is a refusal.
 * `--update` rewrites ownership/words.json from the tree. Exit 0 clean; 1 a finding; 2 the check could not run.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { entriesOf, loadData } from '../lib/data.mjs';
import { domainDataFiles } from '../lib/domain.mjs';
import { isMain } from '../lib/entry.mjs';

const HERE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCHEMAS = ['schema/omx-contract.schema.json', 'shapes/travel.schema.json'];
const NAME = /^([A-Z][A-Za-z0-9_]*|[a-z][a-z0-9/.-]*\.json#(\/[^\s#]*)?)$/;

/** The words of an item: the keys of what it enumerates, or the members of its list. */
export function wordsOf(item) {
  for (const k of ['words', 'codes', 'terms', 'value']) {
    if (item[k] && typeof item[k] === 'object' && !Array.isArray(item[k])) return Object.keys(item[k]);
  }
  for (const k of ['ids', 'values']) if (Array.isArray(item[k])) return item[k].map(String);
  return [];
}

/** Every item and enum under `root`: name to `{ file, words }`. The data through the loader, the codes of the contract domain, the schemas' enums. */
export function declared(root) {
  const out = new Map();
  const add = (name, file, words) => { if (!out.has(name)) out.set(name, { file, words: [...new Set(words)].sort() }); };
  for (const { name, rel, item } of loadData(join(root, 'data')).items.values()) add(name, rel, wordsOf(item));
  const domain = 'contract.d/contract/contract.json';
  for (const [name, item] of entriesOf('codes.json', JSON.parse(domainDataFiles('contract', JSON.parse(readFileSync(join(root, domain), 'utf8')))['codes.json']))) add(name, domain, wordsOf(item));
  for (const file of SCHEMAS) {
    const walk = (node, ptr) => {
      if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${ptr}/${i}`));
      if (!node || typeof node !== 'object') return;
      for (const [k, v] of Object.entries(node)) {
        if (k === 'enum' && Array.isArray(v)) add(`${file}#${ptr}/enum`, file, v.map(String));
        else walk(v, `${ptr}/${k}`);
      }
    };
    walk(JSON.parse(readFileSync(join(root, file), 'utf8')), '');
  }
  return out;
}

/** A list's names: `#` lines and blanks left out; a junk line and a repeat are findings. */
export function parseList(text, file, problems) {
  const seen = new Set();
  for (const raw of text.split('\n')) {
    const l = raw.trim();
    if (!l || l.startsWith('#')) continue;
    if (!NAME.test(l)) problems.push(`${file}: "${l}" is junk, not an item name or a schema enum pointer`);
    else if (seen.has(l)) problems.push(`${file}: ${l} is listed twice`);
    seen.add(l);
  }
  return seen;
}

/**
 * The findings. `decl` is declared(); `lists` and `base` are `{ owned, moving, words }` (sets and the words object), `base`
 * null when the base predates the gate.
 */
export function ownershipProblems(decl, lists, base) {
  const problems = [];
  const { owned, moving, words } = lists;
  for (const [name, { file }] of decl) {
    if (!owned.has(name) && !moving.has(name)) problems.push(`${name} (${file}) is in neither ownership/owned.txt nor ownership/moving-out.txt: a new vocabulary lives with its owner, not here`);
  }
  for (const name of [...owned, ...moving]) {
    if (!decl.has(name)) problems.push(`${name} is listed but nothing declares it: a moved item leaves its line and its words in the same change`);
  }
  for (const name of owned) if (moving.has(name)) problems.push(`${name} is on both lists`);
  for (const [name, { file, words: have }] of decl) {
    const held = new Set(words[name] ?? []);
    for (const w of have) if (!held.has(w)) problems.push(`${name} (${file}): the word "${w}" is in the data and not in ownership/words.json; a new word is the owner's vocabulary, not omx-contract's`);
    for (const w of held) if (!have.includes(w)) problems.push(`${name} (${file}): ownership/words.json holds the word "${w}", which the data no longer has`);
  }
  for (const name of Object.keys(words)) if (!decl.has(name)) problems.push(`ownership/words.json holds ${name}, which nothing declares`);
  if (base) {
    for (const name of moving) if (!base.moving.has(name)) problems.push(`${name} is added to ownership/moving-out.txt: the list only shrinks (omx-contract#81)`);
    for (const name of owned) if (base.moving.has(name)) problems.push(`${name} stood on ownership/moving-out.txt at the base and now stands on ownership/owned.txt: an item moves out, never back`);
    for (const name of moving) {
      const was = new Set(base.words[name] ?? []);
      for (const w of words[name] ?? []) if (base.moving.has(name) && !was.has(w)) problems.push(`${name}: the word "${w}" is added to a moving out item in ownership/words.json: it only shrinks`);
    }
  }
  return problems;
}

const sortedWords = (decl) => Object.fromEntries([...decl].sort(([a], [b]) => (a < b ? -1 : 1)).map(([n, { words }]) => [n, words]));

function main(argv) {
  const opt = { root: HERE, base: 'origin/main' };
  let update = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--update') update = true;
    else if ((argv[i] === '--root' || argv[i] === '--base') && argv[i + 1]) { opt[argv[i].slice(2)] = argv[i + 1]; i += 1; } else { console.error('usage: check-ownership.mjs [--root <repo>] [--base <ref>] [--update]'); return 2; }
  }
  const git = (...a) => execFileSync('git', ['-C', opt.root, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  let decl;
  try { decl = declared(opt.root); } catch (e) { console.error(`check-ownership: ${e.message.split(opt.root).join('.')}`); return 1; }
  if (update) { writeFileSync(join(opt.root, 'ownership/words.json'), `${JSON.stringify(sortedWords(decl), null, 2)}\n`); return 0; }
  try { git('rev-parse', '-q', '--verify', `${opt.base}^{commit}`); } catch {
    console.error(`check-ownership: ${opt.base} is no commit git can read here; fetch it, the shrink check needs it`);
    return 2;
  }
  const problems = [];
  const lists = {
    owned: parseList(readFileSync(join(opt.root, 'ownership/owned.txt'), 'utf8'), 'ownership/owned.txt', problems),
    moving: parseList(readFileSync(join(opt.root, 'ownership/moving-out.txt'), 'utf8'), 'ownership/moving-out.txt', problems),
    words: JSON.parse(readFileSync(join(opt.root, 'ownership/words.json'), 'utf8')),
  };
  let base = null;
  const at = (rel) => { try { return git('show', `${opt.base}:${rel}`); } catch { return null; } };
  if (at('tools/check-ownership.mjs') === null) {
    console.log(`check-ownership: ${opt.base} predates the ownership gate; the shrink checks start with the change that lands it`);
  } else {
    const mv = at('ownership/moving-out.txt');
    const wd = at('ownership/words.json');
    if (mv === null || wd === null) { console.error(`check-ownership: ${opt.base} carries the gate but no ownership/moving-out.txt or ownership/words.json: a base without its lists is a refusal, not a pass`); return 2; }
    base = { moving: parseList(mv, `${opt.base}:ownership/moving-out.txt`, []), words: JSON.parse(wd) };
  }
  problems.push(...ownershipProblems(decl, lists, base));
  for (const p of problems) console.error(`check-ownership: ${p}`);
  if (!problems.length) console.log(`check-ownership: ${decl.size} items, ${lists.owned.size} owned, ${lists.moving.size} moving out`);
  return problems.length ? 1 : 0;
}

if (isMain(import.meta.url)) process.exit(main(process.argv.slice(2)));
