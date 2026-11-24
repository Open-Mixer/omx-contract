// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * The `c` target: `omxcontract/omx_contract_limits.h`, and beside it the header each file's `render.c` word declares
 * (docs/render.md); with a package named, only that package's declared headers, at their own paths. Every define of
 * omx_contract_limits.h is spelled by the helpers of c/c-literals.mjs; the frame (banner, section
 * comments) is this file's. A plugin's parameter header is rendered by omx-plugins from its
 * declaration, by reference to the items here.
 */
import {
  contractLine, cStringLiteral, described, documented, doxyLine, genDeclaredListsBlock, genDeclaredRates, genDeclaredScalarsBlock,
  genLimitBlock, scalarLiteral,
} from './c/c-literals.mjs';
import { ownerNames, renderOwnerHeader } from './c/owner-headers.mjs';
import { doors, isNativeTable } from './doors.mjs';
import { packageItems } from '../lib/data.mjs';
import { renderCodesFile } from './codes.mjs';
import { HINTS_HEADER, renderHintsHeader } from './hints.mjs';
import { packageVocabularyC, renderVocabularyHeader } from './vocabulary.mjs';
import { VERBS_HEADER, packageVerbsC, renderVerbsHeader, verbCNames } from './verbs.mjs';

const defined = (text) => new Set([...text.matchAll(/^#define (OMX_\w+)/gm)].map((m) => m[1]));

/** The rate tail of the header, outside the include guard. */
function ratesTail(rates) {
  return `
/* The standard sample rates (STANDARD_SAMPLE_RATES, declared in omx-contract's rates.json): the set
 * a rate is checked against and the grid a native tool iterates. Guarded on its own, outside the
 * include guard, so a tool built against an older copy of this header can include this one after
 * it and gain the rates without mixing the two copies' limits. */
#ifndef OMX_DECLARED_RATE_COUNT
${genDeclaredRates(rates)}
/**
 * The declared rates that are whole multiples of \`base\` (a tool's default grid: the 48 kHz family), in declaration
 * order, at most \`cap\` of them.
 * @param base the rate (Hz) every written rate is a whole multiple of; 0 is undefined behaviour (a division by zero)
 * @param out the caller's array of at least \`cap\` ints, filled from its start; the caller owns it
 * @param cap the most rates written; 0 or less writes none
 * @return how many rates were written to \`out\`, 0 to \`cap\`
 */
static inline int omx_declared_rates_multiple_of(unsigned base, int *out, int cap) {
  int n = 0;
  for (unsigned k = 0; k < OMX_DECLARED_RATE_COUNT && n < cap; k++)
    if ((unsigned)OMX_DECLARED_RATES[k] % base == 0) out[n++] = (int)OMX_DECLARED_RATES[k];
  return n;
}
#endif
`;
}

const constCase = (s) => String(s).replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();

/** Each PARAM_UNITS const by its title (`dB` -> `db`), or an empty map when the read holds no PARAM_UNITS. */
export const unitTitles = (resolved) => new Map(Object.entries(resolved.get('PARAM_UNITS')?.value ?? {}).map(([title, w]) => [w.word, title]));

/**
 * The enumerator names of one set, in order: `OMX_<SET>_<ID>`. An id that is a PARAM_UNITS const takes its PARAM_UNITS
 * title, as OMX_PARAM_UNITS_<TITLE> does, in any set: `dB` is `_DB`, `dBFS` `_DBFS`, `dBu` `_DBU`, never `_D_B`
 * (docs/render.md, omx-contract#206); any other id is its upper snake case.
 */
export const setEnumerators = (set, titles = new Map()) => set.ids.map((id) => `OMX_${set.name}_${constCase(titles.has(id) ? titles.get(id) : id)}`);

/**
 * Every set as a C enum: the id's position is its value for named ids, the number itself for numeric
 * ids; `OMX_<SET>_COUNT`, and `OMX_<SET>_DEFAULT` when the set names a default. A set whose ids carry values adds
 * `OMX_<SET>_UNIT`, `OMX_<SET>_<ID>_VALUE` for each id that carries one, and `omx_<set>_value(id, &out)`, which writes
 * the id's value and returns 1, or returns 0 for an id that carries none: a kernel reads the number from the id
 * (the drive's roll-off corner), never a sentinel. A set that names its standard ids adds `OMX_<SET>_STANDARD`, the
 * PARAM_UNITS const of each id by enumerator.
 */
function genSetValues(set, names) {
  const fn = `omx_${set.name.toLowerCase()}_value`;
  const carried = set.ids.map((id, i) => [names[i], set.values[i], set.ids[i]]).filter(([, v]) => v !== null);
  return [
    described(`#define OMX_${set.name}_UNIT ${cStringLiteral(set.unit)}`, `The unit of the values the ids of ${set.name} carry.`),
    ...carried.map(([n, v, id]) => described(`#define ${n}_VALUE ${floatLiteral(v)}`, `The value the id \`${doxyLine(id)}\` of ${set.name} carries (OMX_${set.name}_UNIT).`)),
    '/**',
    ` * The value an id of ${set.name} carries.`,
    ` * @param id an enumerator of enum omx_${set.name.toLowerCase()}`,
    ' * @param out where the value is written, when the id carries one; the caller owns it',
    ' * @return 1 when the id carries a value, written to `out`; 0 for an id that carries none, `out` untouched',
    ' */',
    `static inline int ${fn}(int id, float *out) {`,
    '  switch (id) {',
    ...carried.map(([n]) => `  case ${n}: *out = ${n}_VALUE; return 1;`),
    '  default: return 0;',
    '  }',
    '}',
  ];
}

function genDeclaredSetsEnums(sets, titles) {
  return sets.map((set) => {
    const names = setEnumerators(set, titles);
    const numeric = typeof set.ids[0] === 'number';
    const members = set.ids.map((id, i) => documented(`  ${names[i]} = ${numeric ? id : i},`, set.labels?.[i] !== undefined ? doxyLine(set.labels[i]) : `The id \`${doxyLine(id)}\`.`));
    const lines = [
      `/** ${contractLine(set.doc, { since: set.since })} ${numeric ? 'A numeric id is its own value.' : 'A named id\'s value is its position.'} */`,
      `enum omx_${set.name.toLowerCase()} {`, ...members, '};',
      described(`#define OMX_${set.name}_COUNT ${set.ids.length}u`, `The number of ids of ${set.name}.`),
    ];
    if (set.default !== undefined) lines.push(described(`#define OMX_${set.name}_DEFAULT ${names[set.ids.indexOf(set.default)]}`, `The id ${set.name} names as its default.`));
    if (set.values) lines.push(...genSetValues(set, names));
    if (set.standard) {
      lines.push(`/** The standard unit (a PARAM_UNITS const) each id of ${set.name} stands for, by enumerator. */`,
        `static const char *const OMX_${set.name}_STANDARD[OMX_${set.name}_COUNT] = {${set.standard.map(cStringLiteral).join(', ')}};`);
    }
    return lines.join('\n');
  }).join('\n');
}

/** A display bound: a float literal, a whole number with its decimal point. */
const floatLiteral = (n) => `${Number.isInteger(n) ? `${n}.0` : n}f`;

/**
 * Every kernel's readouts (docs/readouts.md), kernels in file order: an enum of the readouts, each at its position,
 * `OMX_<KERNEL>_READOUT_COUNT`, and per readout `_MIN`, `_MAX`, `_RATE_HZ`, `_SCALE` and `_UNIT`.
 */
function genReadouts(kernels) {
  return Object.entries(kernels ?? {}).filter(([, k]) => k.readouts?.length).map(([kernel, { readouts }]) => {
    const K = kernel.toUpperCase();
    const names = readouts.map((ro) => `OMX_${K}_READOUT_${constCase(ro.name)}`);
    const lines = [
      `/** The readouts of the ${kernel} kernel, the meters a host draws, each at its position. */`,
      `enum omx_${kernel}_readouts {`, ...names.map((n, i) => documented(`  ${n} = ${i},`, contractLine(readouts[i].doc, { unit: readouts[i].unit }))), '};',
      described(`#define OMX_${K}_READOUT_COUNT ${readouts.length}u`, `The number of readouts of the ${kernel} kernel.`),
    ];
    readouts.forEach((ro, i) => lines.push(
      described(`#define ${names[i]}_MIN ${floatLiteral(ro.min)}`, contractLine(`The least value the \`${ro.name}\` readout shows.`, { unit: ro.unit })),
      described(`#define ${names[i]}_MAX ${floatLiteral(ro.max)}`, contractLine(`The greatest value the \`${ro.name}\` readout shows.`, { unit: ro.unit })),
      described(`#define ${names[i]}_RATE_HZ ${scalarLiteral(ro.rateHz)}`, `How often the \`${ro.name}\` readout is published (Hz).`),
      described(`#define ${names[i]}_SCALE OMX_PARAM_SCALES_${constCase(ro.scale)}`, `How a host draws the \`${ro.name}\` readout, an enum omx_param_scales member.`),
      described(`#define ${names[i]}_UNIT ${cStringLiteral(ro.unit)}`, `The unit of the \`${ro.name}\` readout, as a string.`),
    ));
    return lines.join('\n');
  }).join('\n');
}

/**
 * The C names the c render spells for each item, `Map<name, Set<C name>>`, beyond OMX_<NAME>_*: a `_LIMITS` table's
 * fields (OMX_<PREFIX>_<FIELD>_MIN/_MAX/_DEFAULT), a declared scalar's macro
 * (OMX_<MACRO>, a sheet's or `_KERNEL` item's leaves included) and the names a file's `render.c` word gives its items
 * (docs/render.md). What `links` takes as naming the item.
 */
export function cNamesOf(resolved) {
  const out = new Map();
  const add = (name, c) => { if (!out.has(name)) out.set(name, new Set()); out.get(name).add(c); };
  const travel = (name, p) => { for (const s of ['MIN', 'MAX', 'DEFAULT']) add(name, `${p}_${s}`); };
  for (const r of resolved.values()) {
    if (isNativeTable(r)) for (const f of Object.keys(r.value)) travel(r.name, `OMX_${r.name.slice(0, -'_LIMITS'.length)}_${constCase(f)}`);
  }
  for (const s of doors(resolved).DECLARED_SCALARS) {
    const head = s.path.split('.')[0];
    add(head, `OMX_${s.macro}`);
    add(head, `OMX_${s.macro}_DOUBLE`);
  }
  for (const f of resolved.renders ?? []) {
    for (const h of Array.isArray(f.render.c) ? f.render.c : []) for (const n of f.items) for (const [c] of ownerNames(h, resolved.get(n))) add(n, c);
  }
  for (const [n, names] of verbCNames(resolved)) for (const c of names) add(n, c);
  return out;
}

/**
 * The defines of omx_contract_limits.h over `resolved`, its sections each under its comment: the native tables, the
 * declared scalars, lists and sets, and the kernels' readouts. What omx-contract's own header holds, and what an owner's `limits` section holds of its own items.
 */
export function limitsSections(resolved) {
  const d = doors(resolved);
  const tables = d.NATIVE_LIMIT_TABLES.map(([prefix, table]) => genLimitBlock(prefix, table)).join('\n\n');
  const above = defined(tables);
  const scalars = d.DECLARED_SCALARS.length ? genDeclaredScalarsBlock(d.DECLARED_SCALARS, above) : '';
  const lists = d.DECLARED_LISTS.length ? genDeclaredListsBlock(d.DECLARED_LISTS, defined([tables, scalars].join('\n'))) : '';
  // an owner's header reads its own items, which hold no PARAM_UNITS (omx-contract's): ownerHeaders hands the titles of the whole read
  const sets = d.DECLARED_SET_ITEMS.length ? genDeclaredSetsEnums(d.DECLARED_SET_ITEMS, resolved.unitTitles ?? unitTitles(resolved)) : '';
  const readouts = genReadouts(resolved.kernels);
  const sections = [
    [tables, `/* Per-parameter numeric travel, one block per \`travels\` table named <PREFIX>_LIMITS:
 * OMX_<PREFIX>_<FIELD>_MIN/_MAX/_DEFAULT, float literals. */`],
    [scalars, `/* Every scalar, sheet leaf and single travel's numbers, one block sorted by macro. An integer value
 * is an integer literal, any other a float literal AND its OMX_<macro>_DOUBLE spelling. */`],
    [lists, `/* Every list rendered to C, sorted by list: OMX_<LIST>_COUNT and OMX_<LIST>_INIT { a, b, … }. */`],
    [sets, `/* Every set rendered to C, sorted by set: an enum of the ids (a named id's position, or a numeric id's number), \`OMX_<SET>_COUNT\` and,
 * where the set names a default, \`OMX_<SET>_DEFAULT\`. */`],
    [readouts, `/* Every kernel's readouts, the meters a host draws (docs/readouts.md): an enum of the readouts at their position,
 * \`OMX_<KERNEL>_READOUT_COUNT\`, and per readout its display range (_MIN, _MAX), _RATE_HZ, _SCALE (an OMX_PARAM_SCALES_*
 * member) and _UNIT. */`],
  ].filter(([body]) => body);
  return sections.map(([body, comment]) => `${comment}\n${body}`).join('\n\n');
}

/** The limits header of the resolved data: omx-contract's own omx_contract_limits.h. */
export function renderLimitsHeader(resolved) {
  const d = doors(resolved);
  return `// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
#ifndef OMX_CONTRACT_LIMITS_H
#define OMX_CONTRACT_LIMITS_H
#include <math.h>
/*
 * GENERATED: DO NOT EDIT BY HAND.
 * Produced by \`omx-contract render --target c\` from Open-Mixer/omx-contract's data/, the declaration
 * as data (each item's reason is its \`doc\`). Change the data, never this file: a consumer builds
 * against the render of the omx-contract version it pins and commits none.
 *
 * A C contract (OMX_PRE/OMX_POST/OMX_INVARIANT) reads a limit from HERE, never a literal.
 */

/** @file
 * @brief The numbers of the contract: every declared limit, scalar, list and set as an OMX_ define or enum, and the
 * declared sample rates. */

${limitsSections(resolved)}

#endif /* OMX_CONTRACT_LIMITS_H */
${d.STANDARD_SAMPLE_RATES ? ratesTail(d.STANDARD_SAMPLE_RATES) : ''}`;
}

/** The OMX_ declared scalars of `resolved`, one block sorted by macro: an owner's `scalars` section. */
const scalarsBlock = (resolved) => genDeclaredScalarsBlock(doors(resolved).DECLARED_SCALARS, new Set());

/**
 * What a strings section reads beyond its own file (render/c/owner-headers.mjs), read-only: `sibling(prefix)`, the one
 * header of package `pkg` whose numbers.prefix is `prefix`, with the sheets of its file (`{ header, numbers, sheets }`,
 * undefined when none), and `item(name)`, an item of the whole read (the standard unit list, which omx-contract
 * declares).
 */
function stringsRead(resolved, pkg) {
  return Object.freeze({
    sibling(prefix) {
      for (const f of resolved.renders ?? []) {
        if (f.pkg !== pkg || !Array.isArray(f.render.c)) continue;
        const h = f.render.c.find((x) => x.numbers?.prefix === prefix);
        if (h) return { header: h.header, numbers: h.numbers, sheets: f.items.map((n) => resolved.get(n)).filter((r) => r?.kind === 'sheet') };
      }
      return undefined;
    },
    item: (name) => resolved.get(name),
  });
}

/**
 * The headers the `render.c` words of the data declare, `[{ path, text, pkg, omx }]`, `path` the word's `header`;
 * `omx` when a section spells OMX_ names (scalars, limits), which omx_contract_limits.h of a whole read holds already.
 * A header reads the items of the file that declares it, or with `scope: package` every item of its package. Those of
 * one package when `pkg` is given (a data directory's files are the package named).
 * @throws naming both files: two files that declare one header.
 */
export function ownerHeaders(resolved, { pkg, all = false } = {}) {
  const out = [];
  const seen = new Map();
  const titles = unitTitles(resolved);
  for (const f of resolved.renders ?? []) {
    if (!Array.isArray(f.render.c) || (!all && f.pkg !== undefined && f.pkg !== pkg)) continue;
    for (const h of f.render.c) {
      if (seen.has(h.header)) throw new Error(`${f.rel} and ${seen.get(h.header)} both declare the header ${h.header}`);
      seen.set(h.header, f.rel);
      let items;
      if (h.scope === 'package') items = packageItems(resolved, f.pkg);
      else {
        items = new Map(f.items.map((n) => [n, resolved.get(n)]));
        items.kernels = f.kernel !== undefined && resolved.kernels?.[f.kernel] ? { [f.kernel]: resolved.kernels[f.kernel] } : {};
      }
      // a unit set is named by the PARAM_UNITS titles of the whole read (dB _DB, never _D_B), whatever items the header holds
      items.unitTitles = titles;
      const text = renderOwnerHeader(h, items, { scalars: scalarsBlock, limits: limitsSections }, h.strings ? stringsRead(resolved, f.pkg) : undefined);
      out.push({ path: h.header, text, pkg: f.pkg, omx: Boolean(h.scalars || h.limits) });
    }
  }
  return out;
}

/**
 * Every file of the `c` target: `[{ path, text }]`, paths relative to the output directory. The whole data renders
 * omx_contract_limits.h and, under `omxcontract/` beside it, every declared header that spells no OMX_ name (the
 * layout omx-contract 2.14.0 installed), omx_vocabulary.h, the vocabulary's codes and words (render/vocabulary.mjs), and
 * omx_host_verbs.h when the read declares verbs (render/verbs.mjs); `{ pkg }` renders every header that package declares, each at its own path,
 * for the owner to commit, its vocabulary, `<stem>_vocabulary.h` (render/vocabulary.mjs), and its verbs, `<stem>_host_verbs.h`.
 */
export function renderC(resolved, { pkg } = {}) {
  if (pkg !== undefined) return [...ownerHeaders(resolved, { pkg }).map(({ path, text }) => ({ path, text })), ...packageVocabularyC(resolved, pkg), ...packageVerbsC(resolved, pkg)];
  const files = [{ path: 'omxcontract/omx_contract_limits.h', text: renderLimitsHeader(resolved) }];
  // a header of OMX_ names repeats lines of omx_contract_limits.h, which the whole read holds once
  for (const h of ownerHeaders(resolved, { all: true })) if (!h.omx) files.push({ path: `omxcontract/${h.path}`, text: h.text });
  const vocabulary = renderVocabularyHeader(resolved);
  if (vocabulary) files.push({ path: 'omxcontract/omx_vocabulary.h', text: vocabulary });
  const hints = renderHintsHeader(resolved);
  if (hints) files.push({ path: HINTS_HEADER, text: hints });
  const verbs = renderVerbsHeader(resolved);
  if (verbs) files.push({ path: VERBS_HEADER, text: verbs });
  files.push(renderCodesFile());
  return files;
}
