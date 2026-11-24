#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
//
// domain-schema-ts.mjs — src/lib/domain-schema.mts, the typed constant of schema/domain.schema.json (`as const`, for
// json-schema-to-ts FromSchema), written from the schema so the two never differ.
//   domain-schema-ts.mjs          write it
//   domain-schema-ts.mjs --check  exit 1 when the file is not what the schema gives
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'src/lib/domain-schema.mts');
const schema = JSON.parse(readFileSync(join(root, 'schema/domain.schema.json'), 'utf8'));
const text = `// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// Written by tools/domain-schema-ts.mjs from schema/domain.schema.json: do not edit.
/** The schema of a domain document, as a constant a consumer reads with json-schema-to-ts \`FromSchema\` and validates with Ajv 2020. */
export const domainSchema = ${JSON.stringify(schema, null, 2)} as const;
`;
if (process.argv.includes('--check')) {
  let have = '';
  try { have = readFileSync(out, 'utf8'); } catch { /* absent */ }
  if (have !== text) { console.error('src/lib/domain-schema.mts is not what schema/domain.schema.json gives: run node tools/domain-schema-ts.mjs'); process.exit(1); }
  console.log('src/lib/domain-schema.mts is in step with schema/domain.schema.json');
} else writeFileSync(out, text);
