// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * The C header of CONTRACT_CODES (data/codes.json, the reader's own table): `omxcontract/omx_contract_codes.h`. A code's
 * VALUE is its place in the table, from 1, in the file's order; a code is appended and never moved or reworded, so a
 * value a program compiled in keeps its meaning. The C loader (omx_domain.h) returns these values; the string a refusal
 * prints is the table's second column. Rendered from this tool's own table, not from the data read, so a read of the
 * installed directory renders the same bytes.
 */
import { readFileSync } from 'node:fs';
import { doxyLine } from './c/c-literals.mjs';

export const CODES_HEADER = 'omxcontract/omx_contract_codes.h';

const upperSnake = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();

/** The header text of the CONTRACT_CODES table (a parsed `data/codes.json`). */
export function renderCodesHeader(file) {
  const codes = Object.entries(file.CONTRACT_CODES.codes);
  const rows = codes.map(([k, c], i) => ({ name: upperSnake(k), value: i + 1, code: c.code, doc: c.doc }));
  const enumLines = rows.map((r) => `  OMX_CONTRACT_CODE_${r.name} = ${r.value}, ///< \`${r.code}\`: ${doxyLine(r.doc)}`);
  const xLines = rows.map((r) => `  X(${r.name}, ${r.value}, "${r.code}")`);
  return `// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
#ifndef OMX_CONTRACT_CODES_H
#define OMX_CONTRACT_CODES_H
/*
 * GENERATED: DO NOT EDIT BY HAND.
 * Produced by \`omx-contract render --target c\` from CONTRACT_CODES (data/codes.json, docs/contract-dir.md): the
 * refusal codes, each as the integer a function returns and the string it prints.
 */

/** @file
 * @brief The refusal codes of the contract directory (CONTRACT_CODES) as integers: a function returns the value, a
 * message prints the string. A value is the code's place in the table, from 1, and is never reused or moved. */

#ifdef __cplusplus
extern "C" {
#endif

/** The value of each CONTRACT_CODES code; 0 is success and no code. */
enum omx_contract_code {
${enumLines.join('\n')}
  OMX_CONTRACT_CODE_LAST = ${rows.length} ///< the last value: every value from 1 to this one is a code
};

/** The table as an X-macro: \`X(NAME, value, "code string")\` once per code, in value order. */
#define OMX_CONTRACT_CODES(X) \\
${xLines.join(' \\\n')}

#ifdef __cplusplus
}
#endif

#endif /* OMX_CONTRACT_CODES_H */
`;
}

/** The header of this tool's own table. */
export function renderCodesFile() {
  return { path: CODES_HEADER, text: renderCodesHeader(JSON.parse(readFileSync(new URL('../data/codes.json', import.meta.url), 'utf8'))) };
}
