#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/*
 * data-layout.mjs — omx-contract's own data/ against its layout (docs/data-layout.md): every word in the file its
 * rule names.
 *
 *   node tools/data-layout.mjs [--data <dir>]
 *
 * Layout: no hosting code (omx-clap-core's since 3.0.0, docs/hosting.md), no codes item (CONTRACT_CODES is the
 * `contract` domain's) and no format terms (the LV2 terms are plugin-db's `lv2` domain, the CLAP terms omx-clap's
 * `clap` domain: sorting pass V27a/V27b); the vocabulary files' items by their prefix.
 *
 * Exit 0 clean; 1 a problem, each named with its file; 2 usage.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dataFiles } from '../lib/data.mjs';
import { isMain } from '../lib/entry.mjs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** The files at the top of data/ outside the domain directories, and the prefix their items carry. */
export const TOP = {
  'rates.json': null,
  'resource-profile.json': 'RESOURCE_', 'verbs.json': 'VERB_',
  'panel.json': 'PANEL_',
};

const itemsOf = (doc) => Object.entries(doc).filter(([k]) => !k.startsWith('$') && !['requires', 'source', 'render', 'checks'].includes(k));

/** The layout problems of `files` (`[{ rel, doc }]`, rel below data/): `[message]`. */
export function layoutProblems(files) {
  const out = [];
  for (const { rel, doc } of files) {
    const items = itemsOf(doc);
    const say = (m) => out.push(`${rel}: ${m}`);
    const codesItems = items.filter(([, it]) => it.kind === 'codes');
    if (items.some(([, it]) => it.kind === 'terms')) say('a terms item in data/ (the format terms are their owners\' domains: plugin-db\'s lv2, omx-clap\'s clap)');
    if (rel.startsWith('hosting/')) {
      say('the hosting codes are omx-clap-core\'s (contract.d/3/omx-clap/hosting/), never omx-contract\'s');
    } else if (rel.startsWith('formats/')) {
      say('the format terms are plugin-db\'s lv2 domain and omx-clap\'s clap domain (sorting pass V27a/V27b), never omx-contract\'s');
    } else if (Object.hasOwn(TOP, rel)) {
      for (const [n] of items) if (TOP[rel] && !n.startsWith(TOP[rel])) say(`${n}: an item of ${rel} is named ${TOP[rel]}...`);
      if (codesItems.length) say(`${codesItems.map(([n]) => n).join(', ')}: a codes item in data/ (the refusal codes are the contract domain's)`);
    } else {
      say('no rule of docs/data-layout.md places this file');
    }
  }
  return out;
}

/** data/'s files as `[{ rel, doc }]`, rel below `dir`. */
export function readFiles(dir) {
  const rels = dataFiles(dir).map((p) => relative(dir, p));
  return rels.map((rel) => ({ rel, doc: JSON.parse(readFileSync(join(dir, rel), 'utf8')) }));
}

function main(argv) {
  let data = join(ROOT, 'data');
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--data' && argv[i + 1]) data = argv[++i];
    else { process.stderr.write(`data-layout: unknown argument ${argv[i]}\n`); return 2; }
  }
  const files = readFiles(data);
  const problems = layoutProblems(files);
  for (const p of problems) process.stderr.write(`data-layout: ${p}\n`);
  if (!problems.length) process.stdout.write(`data-layout: ${files.length} files, each in its place\n`);
  return problems.length ? 1 : 0;
}

if (isMain(import.meta.url)) process.exitCode = main(process.argv.slice(2));
