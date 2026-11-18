// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * A domain's codes header (docs/render.md): the ONE file `render --target c --package <domain>` writes, because the
 * rest of a domain is read at run time (docs/runtime-data.md). It holds the items the domain marks `x-c-codes`, the
 * whole item as constants, and nothing else: no word string, no description, no text. An item also marked `x-c-xmacro`
 * adds its X-macro. An item that is not marked renders nothing, and a domain with no marked item renders no header.
 */
import { domainStem } from '../lib/domain.mjs';
import { packageItems } from '../lib/data.mjs';
import { constCase, wordMacro } from './vocabulary.mjs';

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
