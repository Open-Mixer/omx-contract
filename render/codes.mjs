// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * A domain's codes header (docs/render.md): the ONE file `render --target c --package <domain>` writes, because the
 * rest of a domain is read at run time (docs/runtime-data.md). It holds the items the domain marks `x-c-codes`, the
 * whole item as constants, and nothing else: no word string, no description, no text. An item also marked `x-c-xmacro`
 * adds its X-macro. An item that is not marked renders nothing, and a domain with no marked item renders no header.
 */
import { readFileSync } from 'node:fs';
import { domainDataFiles, domainStem } from '../lib/domain.mjs';
import { packageItems } from '../lib/data.mjs';
import { constCase, wordMacro } from './vocabulary.mjs';
import { doxyLine } from './c/c-literals.mjs';

/**
 * The codes header of the domain `domain`, `[{ path, text }]`, empty when no item is marked. `marked` maps each marked
 * item to `{ xmacro }`, as the reader of the domain returns it.
 */
export function domainCodesC(resolved, domain, marked) {
  const items = [...packageItems(resolved, domain).values()].filter((r) => r.kind === 'words' && marked.has(r.name));
  if (!items.length) return [];
  const guard = `OMX_${constCase(domainStem(domain))}_CODES_H`;
  const blocks = items.map((r) => {
    const names = Object.keys(r.value);
    const lines = [`/* ${r.name} */`, ...names.map((n, i) => `#define ${wordMacro(r.name, n)} ${i}u`), `#define OMX_${r.name}_COUNT ${names.length}u`];
    if (marked.get(r.name).xmacro) {
      const xs = names.map((n) => `    X(${wordMacro(r.name, n)}, ${constCase(n)})`);
      lines.push(`#define OMX_${r.name}(X) \\`, ...xs.map((x, i) => (i < xs.length - 1 ? `${x} \\` : x)));
    }
    return lines.join('\n');
  });
  const text = `// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
#ifndef ${guard}
#define ${guard}
/*
 * GENERATED: DO NOT EDIT BY HAND.
 * Produced by \`omx-contract render --target c --package ${domain}\` from the domain ${domain}: the codes of its items marked
 * "x-c-codes", one OMX_<ITEM>_<WORD> per word and an OMX_<ITEM>_COUNT per item, and an OMX_<ITEM>(X) X-macro where the
 * item is marked "x-c-xmacro" as well. Nothing else of the domain is rendered: its words are read at run time.
 */

${blocks.join('\n\n')}

#endif /* ${guard} */
`;
  return [{ path: `${domainStem(domain)}_codes.h`, text }];
}

/**
 * The C header of CONTRACT_CODES (the `contract` domain, contract.d/contract/contract.json): `omxcontract/omx_contract_codes.h`. A code's
 * VALUE is its place in the table, from 1, in the file's order; a code is appended and never moved or reworded, so a
 * value a program compiled in keeps its meaning. The C loader (omx_domain.h) returns these values; the string a refusal
 * prints is the table's second column. Rendered from this tool's own domain, not from the data read, so a read of the
 * installed directory renders the same bytes.
 */
export const CODES_HEADER = 'omxcontract/omx_contract_codes.h';

const upperSnake = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();

/** The header text of the CONTRACT_CODES table (its data form, which domainDataFiles rebuilds from the domain). */
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
 * Produced by \`omx-contract render --target c\` from CONTRACT_CODES (contract.d/contract/contract.json, docs/contract-dir.md): the
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
  const domain = JSON.parse(readFileSync(new URL('../contract.d/contract/contract.json', import.meta.url), 'utf8'));
  return { path: CODES_HEADER, text: renderCodesHeader(JSON.parse(domainDataFiles('contract', domain)['codes.json'])) };
}
