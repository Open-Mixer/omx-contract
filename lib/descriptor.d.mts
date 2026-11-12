// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/** Types for the descriptor rules and the override layers (descriptor.mjs, docs/overrides.md). */
/** The ids a travel's scale may name besides unknown. */
export const PARAM_SCALE_IDS: readonly string[];
export const UNKNOWN: 'unknown';
export const MEANING_SYNONYMS: Readonly<Record<string, string>>;
/** One problem of a descriptor beyond the schema: `rule` and `code` the CONTRACT_CODES code, `name` its key. */
export interface DescriptorProblem {
  file: string;
  item: string;
  rule: string;
  code: string;
  name: string;
  message: string;
}
export function descriptorProblems(rel: string, doc: unknown, opts?: { scales?: readonly string[] }): DescriptorProblem[];
/** The schema's problems of an override file, none when it is well formed. */
export function overrideSchemaProblems(doc: unknown): { path: string; message: string }[];
/** A refused file or a warning of one layer; a dropped entry names its control too. */
export interface OverrideNote {
  layer: number;
  code: string;
  name: string;
  message: string;
}
export interface OverrideResult<D> {
  descriptor: D;
  family: string | undefined;
  answered: Record<string, number>;
  dropped: (OverrideNote & { control: string })[];
  warnings: OverrideNote[];
  refused: OverrideNote[];
}
/** The effective descriptor of `descriptor` under the override files `layers`, lowest first. */
export function applyOverride<D extends object>(descriptor: D, layers: readonly unknown[], opts?: { paramsFingerprint?: string }): OverrideResult<D>;
