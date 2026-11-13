// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * `validate(schema, doc)`: the one JSON Schema (draft 2020-12) check the OpenMixer tools share, so a package that
 * validates a document against a schema of its own carries no Ajv loader. Exported as
 * `@openmixer/omx-contract/validate`.
 *
 * Returns `{ ok, errors }`, each error `{ path, code, message }`: `path` the JSON pointer of the refused value
 * (`""` for the document), `code` the Ajv keyword that refused (`required`, `pattern`, `additionalProperties`, ...).
 * Every error is listed, not the first; the schema is strict, so a misspelt keyword in it throws rather than passing
 * everything. A schema is compiled once however often it is used.
 */
import Ajv2020 from 'ajv/dist/2020.js';

/** The class: the CommonJS module's export is the class itself, which TypeScript types as the module object. */
type Ajv2020Class = typeof import('ajv/dist/2020.js').default;
type Ajv = InstanceType<Ajv2020Class>;
type Check = ReturnType<Ajv['compile']>;

let ajv: Ajv | undefined;
const compiled = new WeakMap<object, Check>();

const validatorOf = (schema: object): Check => {
  if (compiled.has(schema)) return compiled.get(schema)!;
  ajv ??= new (Ajv2020 as unknown as Ajv2020Class)({ allErrors: true, strict: true, strictRequired: false, allowUnionTypes: true });
  // the contract's own schema versions itself with one; it constrains nothing
  if (!ajv.getKeyword('x-omx-schema-version')) ajv.addKeyword({ keyword: 'x-omx-schema-version', schemaType: 'string' });
  const check = ajv.compile(schema);
  compiled.set(schema, check);
  return check;
};

/** @returns {{ ok: boolean, errors: { path: string, code: string, message: string }[] }} */
export function validate(schema: object, doc: unknown): { ok: boolean; errors: { path: string; code: string; message: string }[] } {
  if (schema === null || typeof schema !== 'object') throw new TypeError('validate: the schema is an object');
  const check = validatorOf(schema);
  const ok = check(doc) as boolean;
  return { ok, errors: ok ? [] : (check.errors ?? []).map((e) => ({ path: e.instancePath, code: e.keyword, message: e.message ?? '' })) };
}
