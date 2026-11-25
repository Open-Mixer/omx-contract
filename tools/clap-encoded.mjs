#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
//
// PARAM_UNITS_CLAP_ENCODED (the `param` domain, contract.d/param/param.json; docs/units.md, V23d B2): the standard
// unit ids the CLAP extension org.openmixer.param-contract/1 encodes, the ids that have a unit code. It is derived,
// never typed: from the CLAP unit sheet's token-to-id map (omx-clap's OMX_PARAM_CONTRACT_UNIT_IDS, token -> id), each
// id a PARAM_UNITS const, the members in PARAM_UNITS order. Each member is a words copy of its PARAM_UNITS word
// (`x-from`, word-from-differs: its const, title, description, x-code and x-text), so its place in the group is its
// PARAM_UNITS x-code: the served ids must be a prefix of PARAM_UNITS, and a set that is not is refused by name.
//
//   node tools/clap-encoded.mjs --ids <map.json> --write   rewrite the item from the map ({ token: id })
//   node tools/clap-encoded.mjs --ids <map.json> --check   exit 1 when the committed item is not the map's
//   node tools/clap-encoded.mjs --check                    exit 1 when the committed item is not a prefix copy
// `--root <dir>` reads another tree (the tests' scratch copies).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { isMain } from '../lib/entry.mjs';

export const ITEM = 'PARAM_UNITS_CLAP_ENCODED';
const PARAM = 'contract.d/param/param.json';
const REF = 'https://openmixer.org/contract/param#/components/schemas/PARAM_UNITS';

const DESCRIPTION = 'The standard units the CLAP extension org.openmixer.param-contract/1 encodes (docs/units.md, V23d B2): '
  + 'the ids that have a unit code at the CLAP level, each a word of PARAM_UNITS taken from it, in its order. omx-panel '
  + 'reads it to know whether a unit can be served; omx-clap\'s map check holds its code-to-id mapping onto it. The codes '
  + 'are omx-clap\'s; this item names none.';
const WHY = 'A reader that asks whether a unit can be served reads omx-contract only, the innermost layer, so nothing '
  + 'reads outward to omx-clap (coordinator ruling B2, 2026-11-22). Derived by tools/clap-encoded.mjs, never typed.';

/** The served ids of a token-to-id map, in PARAM_UNITS order. @throws naming the token: an id that is no PARAM_UNITS const, two tokens on one id. */
export function servedIds(ids, units) {
  const consts = units.map((w) => w.const);
  const seen = new Map();
  for (const [token, id] of Object.entries(ids)) {
    if (!consts.includes(id)) throw new Error(`${ITEM}: the id ${JSON.stringify(id)} of the token ${token} is no const of PARAM_UNITS`);
    if (seen.has(id)) throw new Error(`${ITEM}: the tokens ${seen.get(id)} and ${token} both map to ${JSON.stringify(id)}`);
    seen.set(id, token);
  }
  return consts.filter((c) => seen.has(c));
}

/** The item over `members` (ids in PARAM_UNITS order). @throws when they are not a prefix of PARAM_UNITS. */
export function encodedItem(members, units) {
  const prefix = units.slice(0, members.length).map((w) => w.const);
  if (members.some((m, i) => m !== prefix[i])) throw new Error(`${ITEM}: the served set is not a prefix of PARAM_UNITS: a words copy cannot hold it (${members.find((m, i) => m !== prefix[i])} is not at its PARAM_UNITS place)`);
  return {
    description: DESCRIPTION,
    'x-since': '0.23.0',
    'x-why': WHY,
    oneOf: units.slice(0, members.length).map((w) => ({
      const: w.const,
      title: w.title,
      ...(w.description === undefined ? {} : { description: w.description }),
      'x-code': w['x-code'],
      ...(w['x-text'] === undefined ? {} : { 'x-text': w['x-text'] }),
      'x-from': [{ $ref: REF, 'x-term': w.title }],
    })),
    'x-kind': 'words',
  };
}

const read = (root) => JSON.parse(readFileSync(join(root, PARAM), 'utf8'));
const unitsOf = (doc) => doc.components.schemas.PARAM_UNITS.oneOf;
const committed = (doc) => (doc.components.schemas[ITEM]?.oneOf ?? []).map((w) => w.const);

/** What differs between the committed item and the one `ids` (or, with none, its own members) derive; [] when none. */
export function encodedFaults(root, ids) {
  const doc = read(root);
  const want = encodedItem(ids === undefined ? committed(doc) : servedIds(ids, unitsOf(doc)), unitsOf(doc));
  const have = doc.components.schemas[ITEM];
  if (have === undefined) return [`${PARAM} declares no ${ITEM}`];
  if (JSON.stringify(have) === JSON.stringify(want)) return [];
  const from = ids === undefined ? ' from its own members' : ' from the map';
  const head = `${PARAM}: ${ITEM} is not the item tools/clap-encoded.mjs derives${from}: re-run it with --write`;
  return [head, ...wordFaults(have.oneOf ?? [], want.oneOf)];
}

/** Each word that differs, by name: one the item has and the derivation does not, the reverse, and a word whose copy differs (its fields). */
function wordFaults(have, want) {
  const byConst = (l) => new Map(l.map((w) => [w.const, w]));
  const h = byConst(have);
  const w = byConst(want);
  const out = [];
  for (const [c, x] of h) {
    if (!w.has(c)) out.push(`${ITEM}: word ${c}: not in the derived item`);
    else {
      const y = w.get(c);
      const keys = [...new Set([...Object.keys(x), ...Object.keys(y)])].filter((k) => JSON.stringify(x[k]) !== JSON.stringify(y[k]));
      if (keys.length) out.push(`${ITEM}: word ${c}: ${keys.join(', ')} differ${keys.length === 1 ? 's' : ''} from the derived copy`);
    }
  }
  for (const c of w.keys()) if (!h.has(c)) out.push(`${ITEM}: word ${c}: derived, missing from the item`);
  const order = have.map((x) => x.const).filter((c) => w.has(c));
  const wantOrder = want.map((x) => x.const).filter((c) => h.has(c));
  if (!out.length && JSON.stringify(order) !== JSON.stringify(wantOrder)) out.push(`${ITEM}: the words are not in PARAM_UNITS order`);
  return out;
}

if (isMain(import.meta.url)) {
  const argv = process.argv.slice(2);
  const opt = (k) => { const i = argv.indexOf(k); return i < 0 ? undefined : argv[i + 1]; };
  const root = resolve(opt('--root') ?? join(import.meta.dirname, '..'));
  const ids = opt('--ids') === undefined ? undefined : JSON.parse(readFileSync(opt('--ids'), 'utf8'));
  try {
    if (argv.includes('--write')) {
      if (ids === undefined) throw new Error('--write needs --ids <map.json>, the token-to-id map');
      const doc = read(root);
      doc.components.schemas[ITEM] = encodedItem(servedIds(ids, unitsOf(doc)), unitsOf(doc));
      writeFileSync(join(root, PARAM), `${JSON.stringify(doc, null, 2)}\n`);
    } else {
      const faults = encodedFaults(root, ids);
      for (const f of faults) console.error(f);
      process.exitCode = faults.length ? 1 : 0;
    }
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
