// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * CONTRACT_CODES, the refusal codes of the contract-directory reader and of the links check, read from the item
 * CONTRACT_CODES of the `contract` domain (`contract.d/contract/contract.json`, docs/contract-dir.md). The document is
 * read raw, not through readDomain: the reader refuses with these codes, so it cannot be needed to read them. A refusal is raised by the code's name and carries the code; nothing
 * classifies a refusal by its text.
 */
import { readFileSync } from 'node:fs';
import type { JsonObject } from './json.mjs';

/** The `contract` domain of this tool: the one place its codes are written. */
export const CODES_FILE = new URL('../contract.d/contract/contract.json', import.meta.url);

/** `{ <lowerCamel name>: <code> }`, in the domain's word order: a word's `x-name` is its name, its `const` the code. */
export const CONTRACT_CODES: Readonly<Record<string, string>> = Object.fromEntries(
  ((JSON.parse(readFileSync(CODES_FILE, 'utf8')).components.schemas.CONTRACT_CODES.oneOf) as JsonObject[]).map((w) => [w['x-name'] as string, w['const'] as string]),
);

/** A refusal: `code` is a CONTRACT_CODES code, `file` what it was found in, the message what was found. */
export class ContractRefusal extends Error {
  /** The CONTRACT_CODES code. */
  readonly code: string;
  /** What the refusal was found in. */
  readonly file: string;

  constructor(name: string, file: string, message: string) {
    if (!(name in CONTRACT_CODES)) throw new Error(`no contract code named ${name}`);
    super(message);
    this.code = CONTRACT_CODES[name]!;
    this.file = file;
  }

  /** The one line a refusal is printed as: its code first. */
  line(): string { return `${this.code} ${this.file}: ${this.message}`; }

  toJSON(): { code: string; file: string; message: string } { return { code: this.code, file: this.file, message: this.message }; }
}

/** Raise the refusal named `name`. */
export function refuse(name: string, file: string, message: string): never { throw new ContractRefusal(name, file, message); }
