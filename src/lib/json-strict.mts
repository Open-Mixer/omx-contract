// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * JSON that refuses a key written twice in one object (the C loader reads with JSON_REJECT_DUPLICATES; JSON.parse keeps
 * the last one silently, so a document the two readers read would differ). `parseStrict` is JSON.parse plus that one rule.
 */

/** The first key written twice in one object of the JSON text `text`, with its line, or undefined. `text` must be valid JSON. */
export function duplicateKey(text: string): { key: string; line: number } | undefined {
  const stack: Array<Set<string> | null> = []; // an object's keys so far, null for an array
  let line = 1;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '\n') line++;
    else if (c === '{') stack.push(new Set());
    else if (c === '[') stack.push(null);
    else if (c === '}' || c === ']') stack.pop();
    else if (c === '"') {
      let j = i + 1;
      while (text[j] !== '"') j += text[j] === '\\' ? 2 : 1;
      const str = JSON.parse(text.slice(i, j + 1)) as string;
      let k = j + 1;
      while (' \t\r\n'.includes(text[k] ?? 'x')) k++;
      const keys = stack[stack.length - 1];
      if (text[k] === ':' && keys) {
        if (keys.has(str)) return { key: str, line };
        keys.add(str);
      }
      i = j;
    }
  }
  return undefined;
}

/**
 * JSON.parse of `text`, refusing a duplicate key.
 * @throws Error naming the syntax error, or the duplicate key and its line.
 */
export function parseStrict(text: string): unknown {
  const value = JSON.parse(text);
  const dup = duplicateKey(text);
  if (dup) throw new Error(`duplicate object key "${dup.key}" (line ${dup.line})`);
  return value;
}
