// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * The unit gate (omx-contract#193; decision 2 of plugin-hostd#215, owner ruling 2026-11-23): a unit is a PARAM_UNITS
 * standard id (a word's const; its x-symbol is display only, C2), never an alias, a display symbol, a lowercase
 * spelling or a unit of the owner's own; a unit with no standard id is a dropped row (docs/units.md). `omx-contract units --check` runs it over any owner's files, whatever their shape, and
 * validate holds a format map's unit lookups by it (rule map-unit).
 *
 * Nothing here lists a key or a word. The schema says which are unit-valued: every property whose schema is
 * `$defs.unit` or `$defs.descriptorUnit` (directly, or a member of its allOf or anyOf) is a unit key, every property
 * whose additionalProperties is one is a map of units, and a descriptor word (`controls[].travel.unit`) is a unit word
 * when its path through `$defs.descriptor` ends at such a property. A domain spells a data key `x-<key>`, so each unit
 * key is held in that spelling too. The ids are `$defs.descriptorUnit`'s, which tools/unit-enum.mjs renders from
 * PARAM_UNITS's consts and `render --check` holds equal; `unknown`, the descriptor's "states no unit", is a unit
 * key's value only, never a lookup's or a map of units'.
 */
import { readFileSync } from 'node:fs';
import type { Json } from './json.mjs';

const SCHEMA = JSON.parse(readFileSync(new URL('../schema/omx-contract.schema.json', import.meta.url), 'utf8'));
const UNIT_REFS = new Set(['#/$defs/unit', '#/$defs/descriptorUnit']);
/** The descriptor format's "states no unit": a descriptor's travel.unit may say it, a lookup never. */
export const UNKNOWN = 'unknown';

export interface UnitGate {
  /** PARAM_UNITS's standard ids. */
  ids: Set<string>;
  /** The keys whose string value is a unit (`unit`, and its domain spelling `x-unit`). */
  unitKeys: Set<string>;
  /** The keys whose value is an object of units (`choiceUnits`). */
  unitMapKeys: Set<string>;
  /** Whether a descriptor word (a map row's word.word) names a unit. */
  isUnitWord(path: string): boolean;
}

export interface UnitProblem {
  /** The JSON pointer of the value. */
  pointer: string;
  /** The key the value sits under (a unit key, or a lookup's source key). */
  key: string;
  value: string;
  message: string;
}

const refsUnit = (s: Json): boolean => s !== null && typeof s === 'object'
  && (UNIT_REFS.has(s.$ref) || [...(s.allOf ?? []), ...(s.anyOf ?? [])].some(refsUnit));

/** The gate as `schema` (omx-contract's own by default) defines it. */
export function unitGate(schema: Json = SCHEMA): UnitGate {
  const defs = schema.$defs as Record<string, Json>;
  const unitKeys = new Set<string>();
  const unitMapKeys = new Set<string>();
  const walk = (s: Json): void => {
    if (s === null || typeof s !== 'object') return;
    if (Array.isArray(s)) { s.forEach(walk); return; }
    for (const [k, v] of Object.entries((s.properties ?? {}) as Record<string, Json>)) {
      if (refsUnit(v)) unitKeys.add(k).add(`x-${k}`);
      if (v && typeof v === 'object' && refsUnit(v.additionalProperties)) unitMapKeys.add(k).add(`x-${k}`);
    }
    for (const v of Object.values(s)) walk(v);
  };
  walk(defs);
  const own = defs.descriptorUnit.anyOf.flatMap((m: Json) => (m.$ref === '#/$defs/unit' ? defs.unit.enum : m.enum ?? []));
  const ids = new Set<string>(own.filter((u: string) => u !== UNKNOWN));
  const deref = (s: Json): Json => {
    let at = s;
    for (let n = 0; at?.$ref && n < 16; n++) at = defs[at.$ref.replace('#/$defs/', '')];
    return at;
  };
  const child = (s: Json, name: string): Json | undefined => {
    const here = deref(s);
    for (const c of [here, ...(here?.allOf ?? [])].map(deref)) if (c?.properties?.[name]) return c.properties[name];
    return undefined;
  };
  const isUnitWord = (path: string): boolean => {
    let s: Json | undefined = defs.descriptor;
    const segs = path.split('.');
    for (const [i, seg] of segs.entries()) {
      const name = seg.replace(/\[\]$/, '');
      const next = child(s, name);
      if (next === undefined) return false;
      if (i === segs.length - 1) return refsUnit(next);
      s = seg.endsWith('[]') ? deref(next)?.items : next;
    }
    return false;
  };
  return { ids, unitKeys, unitMapKeys, isUnitWord };
}

const esc = (k: string) => k.replace(/~/g, '~0').replace(/\//g, '~1');
const NO_ID = 'is no PARAM_UNITS standard id';

/**
 * Every unit `doc` states that is no standard id: a unit key's string (or `unknown`), each value of a map of
 * units, and each lookup value of a map row whose word (`word`, or a domain's `x-word`) is a unit word.
 */
export function unitProblems(doc: Json, gate: UnitGate = unitGate()): UnitProblem[] & { checked: number } {
  const out = [] as unknown as UnitProblem[] & { checked: number };
  out.checked = 0;
  const hold = (pointer: string, key: string, v: Json, unknownOk: boolean, why: string) => {
    if (typeof v !== 'string') return;
    out.checked++;
    if (gate.ids.has(v) || (unknownOk && v === UNKNOWN)) return;
    out.push({ pointer, key, value: v, message: `${pointer}: ${JSON.stringify(v)} ${NO_ID}${why}` });
  };
  const visit = (v: Json, at: string): void => {
    if (v === null || typeof v !== 'object') return;
    if (Array.isArray(v)) { v.forEach((x, i) => visit(x, `${at}/${i}`)); return; }
    for (const [k, x] of Object.entries(v as Record<string, Json>)) {
      const p = `${at}/${esc(k)}`;
      if (gate.unitKeys.has(k)) hold(p, k, x, true, '');
      if (gate.unitMapKeys.has(k) && x && typeof x === 'object' && !Array.isArray(x)) {
        for (const [n, u] of Object.entries(x as Record<string, Json>)) hold(`${p}/${esc(n)}`, n, u, false, ` (${k}: never ${UNKNOWN})`);
      }
      if ((k === 'word' || k === 'x-word') && x && typeof x === 'object' && typeof x.word === 'string'
        && x.values && typeof x.values === 'object' && gate.isUnitWord(x.word)) {
        for (const [n, u] of Object.entries(x.values as Record<string, Json>)) hold(`${p}/values/${esc(n)}`, n, u, false, ` (a lookup of ${x.word}: a unit with no standard id is a dropped row)`);
      }
      visit(x, p);
    }
  };
  visit(doc, '');
  return out;
}

const quoted = (s: string) => JSON.stringify(s).replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

/**
 * A line finder over `text`: `find(key, value)` is the 1-based line of the next line stating `"key": "value"` (each
 * pair resumes after its last answer, so the problems of one file, in document order, get their lines in one pass
 * per pair); 0 when none does.
 */
export function lineFinder(text: string): (key: string, value: string) => number {
  const lines = text.split('\n');
  const next = new Map<string, number>();
  return (key, value) => {
    const pair = `${key}\0${value}`;
    const needle = new RegExp(`${quoted(key)}\\s*:\\s*${quoted(value)}`);
    for (let i = next.get(pair) ?? 0; i < lines.length; i++) {
      if (needle.test(lines[i]!)) { next.set(pair, i + 1); return i + 1; }
    }
    next.set(pair, lines.length);
    return 0;
  };
}

/** A format map's rows (the data form's formatMap value): each unit lookup value that is no id (rule map-unit). */
export function mapUnitProblems(rows: Record<string, Json>, gate: UnitGate = unitGate()): string[] {
  const out: string[] = [];
  for (const [field, row] of Object.entries(rows)) {
    const w = row?.word;
    if (!w || typeof w.word !== 'string' || !w.values || !gate.isUnitWord(w.word)) continue;
    for (const [from, to] of Object.entries(w.values as Record<string, Json>)) {
      if (typeof to === 'string' && gate.ids.has(to)) continue;
      out.push(`${field}: ${from} -> ${JSON.stringify(to)} ${NO_ID}: a unit with no standard id is a dropped row (plugin-hostd#215, decision 2)`);
    }
  }
  return out;
}
