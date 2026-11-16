// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * The C text of the `c` target's defines: limit tables, declared rates, scalars and lists, and the literals they
 * are spelled with. Pure functions of the declarations they are handed.
 */

/** a limit-table field name -> a C constant prefix (`thresholdDb` -> `THRESHOLD_DB`). */
function fieldConstName(field) {
  return field.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
}

function numLiteral(n) {
  // A whole number still gets a decimal point — this header feeds float comparisons in C, and
  // an integer literal compared against a float is a silent promotion, never a typo to chase.
  return Number.isInteger(n) ? `${n}.0` : `${n}`;
}

function genLimitBlock(prefix, table) {
  const lines = [];
  for (const [field, limit] of Object.entries(table)) {
    const c = fieldConstName(field);
    lines.push(`#define OMX_${prefix}_${c}_MIN ${numLiteral(limit.min)}f`);
    lines.push(`#define OMX_${prefix}_${c}_MAX ${numLiteral(limit.max)}f`);
    // a field with no come-up value (the gate key filter's edges) has no DEFAULT, as in genCoreLimitBlock
    if (limit.default !== undefined) {
      lines.push(`#define OMX_${prefix}_${c}_DEFAULT ${numLiteral(limit.default)}f`);
    }
  }
  return lines.join('\n');
}

/**
 * The declared sample rates (core's `STANDARD_SAMPLE_RATES`, row-codecs.ts) as a C array the
 * contracts' `rate-is-declared` PRE reads through `omx_rate_is_declared` — never a literal list.
 */
function genDeclaredRates(STANDARD_SAMPLE_RATES) {
  if (!Array.isArray(STANDARD_SAMPLE_RATES) || STANDARD_SAMPLE_RATES.length === 0) {
    throw new Error('contract-limits-gen: STANDARD_SAMPLE_RATES is missing from the sheet');
  }
  for (const r of STANDARD_SAMPLE_RATES) {
    if (!Number.isInteger(r) || r <= 0) throw new Error(`contract-limits-gen: a declared rate must be a positive integer, got ${r}`);
  }
  return [
    `#define OMX_DECLARED_RATE_COUNT ${STANDARD_SAMPLE_RATES.length}u`,
    `static const float OMX_DECLARED_RATES[OMX_DECLARED_RATE_COUNT] = { ${STANDARD_SAMPLE_RATES.map((r) => `${numLiteral(r)}f`).join(', ')} };`,
  ].join('\n');
}

/**
 * The scalar door's literal law (dsp-primitives §7): an integer value is an integer literal, so it
 * can size a ring or count; any other number is a float literal. A C reader dividing two
 * integer-valued declarations promotes one itself — this generator knows no units.
 */
export function scalarLiteral(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) throw new Error(`contract-limits-gen: a declared scalar must be a finite number, got ${n}`);
  return Number.isInteger(n) ? `${n}` : `${n}f`;
}

/** The same non-integer as C's own double literal — `OMX_<macro>_DOUBLE`, for a consumer that designs in double. */
export function scalarDoubleLiteral(n) {
  if (typeof n !== 'number' || !Number.isFinite(n) || Number.isInteger(n)) throw new Error(`contract-limits-gen: a double spelling is for a non-integer, got ${n}`);
  return `${n}`;
}

/**
 * ONE block for every declared scalar and sheet leaf (core's declaredScalars over the core barrel
 * and the declarations): `#define OMX_<macro> <literal>`, sorted by macro. This generator names
 * none of them — a kernel's scalars are its exports. A macro another block already defined is a
 * collision, refused.
 */
function genDeclaredScalarsBlock(DECLARED_SCALARS, definedBefore) {
  if (!Array.isArray(DECLARED_SCALARS) || DECLARED_SCALARS.length === 0) {
    throw new Error('contract-limits-gen: the declared-scalar discovery is empty — nothing declared');
  }
  return DECLARED_SCALARS.flatMap(({ macro, value }) => {
    for (const name of [`OMX_${macro}`, `OMX_${macro}_DOUBLE`]) {
      if (definedBefore.has(name)) throw new Error(`contract-limits-gen: ${name} is a declared scalar AND another block's define — rename one`);
    }
    return Number.isInteger(value)
      ? [`#define OMX_${macro} ${scalarLiteral(value)}`]
      : [`#define OMX_${macro} ${scalarLiteral(value)}`, `#define OMX_${macro}_DOUBLE ${scalarDoubleLiteral(value)}`];
  }).join('\n');
}

/**
 * A string as a C string literal (dsp-primitives §7, record sets): `\\`, `\"` and `\?` (no trigraph
 * can form) escaped, `\n`/`\t`/`\r` by name, every other byte outside printable ASCII as a
 * three-digit octal escape of its UTF-8 encoding.
 */
export function cStringLiteral(s) {
  if (typeof s !== 'string') throw new Error(`contract-limits-gen: a C string literal needs a string, got ${typeof s}`);
  const named = { 0x5c: '\\\\', 0x22: '\\"', 0x3f: '\\?', 0x0a: '\\n', 0x09: '\\t', 0x0d: '\\r' };
  let out = '"';
  for (const b of new TextEncoder().encode(s)) {
    if (named[b] !== undefined) out += named[b];
    else if (b >= 0x20 && b <= 0x7e) out += String.fromCharCode(b);
    else out += `\\${b.toString(8).padStart(3, '0')}`;
  }
  return `${out}"`;
}

/**
 * ONE block for every declared number list (core's declaredLists; dsp-primitives §7):
 * `OMX_<LIST>_COUNT` and `OMX_<LIST>_INIT { a, b, … }`, values in declaration order, each the
 * scalar literal. A list with a non-finite element is refused whole; a macro another block defines
 * is a collision, refused.
 */
function genDeclaredListsBlock(DECLARED_LISTS, definedElsewhere) {
  if (!Array.isArray(DECLARED_LISTS) || DECLARED_LISTS.length === 0) {
    throw new Error('contract-limits-gen: the declared-list discovery is empty — nothing declared');
  }
  return DECLARED_LISTS.map(({ name, values }) => {
    for (const macro of [`OMX_${name}_COUNT`, `OMX_${name}_INIT`]) {
      if (definedElsewhere.has(macro)) throw new Error(`contract-limits-gen: ${macro} is a declared list AND another block's define — rename one`);
    }
    if (!values.every((v) => typeof v === 'number' && Number.isFinite(v))) {
      throw new Error(`contract-limits-gen: OMX_${name}_INIT refused — an element is not a finite number`);
    }
    return [`#define OMX_${name}_COUNT ${values.length}u`, `#define OMX_${name}_INIT { ${values.map(scalarLiteral).join(', ')} }`].join('\n');
  }).join('\n');
}

export { genLimitBlock, genDeclaredScalarsBlock, genDeclaredListsBlock, genDeclaredRates };
