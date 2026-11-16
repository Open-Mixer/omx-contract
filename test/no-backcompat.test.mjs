// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas
// No backward-compatibility machinery: the old code-host `$schema` address, Conflicts/Breaks/Replaces, the Catalan
// `text.ca` property, the bare-string catalog entry, the released-header fixtures and the alias words they proved
// gone, the frozen limits sheet and its round-trip proof, the old checkout-name fallback of the Makefile. Each is
// refused here by `leftovers`; the sabotage test plants each one in a scratch copy and the check must name it.
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { ROOT } from './helpers.mjs';

const TEXT = ['src/lib/contract-dir.mts', 'src/lib/catalog.mts', 'share/omx-contract/omx_contract_catalog.py', 'packaging/omx-contract.spec',
  'debian/control', 'schema/omx-contract.schema.json', 'test/helpers.mjs', 'Makefile',
  '.github/workflows/ci.yml', '.github/workflows/release.yml', '.github/workflows/publish.yml'];
const GONE = ['test/formerly.test.mjs', 'test/round-trip.test.mjs', 'tools/proof/round-trip.mjs', 'test/fixtures/frozen-limits-sheet.json',
  'test/fixtures/limits-0.1.3', 'test/fixtures/openmixer-6ee8a9bde101',
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((m) => `test/fixtures/omx-contract-2.${m}.0`)];

/** What of the back-compat machinery is still in the tree `root`. */
function leftovers(root) {
  const out = [];
  const at = (rel) => readFileSync(join(root, rel), 'utf8');
  for (const rel of GONE) if (existsSync(join(root, rel))) out.push(`${rel} exists`);
  if (/github\\?\.com/.test(/const INSTALLED_SCHEMA = .*/.exec(at('src/lib/contract-dir.mts'))?.[0] ?? '')) out.push('INSTALLED_SCHEMA accepts the code-host address');
  if (/^Conflicts:/m.test(at('packaging/omx-contract.spec'))) out.push('the spec has Conflicts');
  if (/^(Breaks|Replaces):/m.test(at('debian/control'))) out.push('debian/control has Breaks or Replaces');
  const schema = JSON.parse(at('schema/omx-contract.schema.json'));
  if (Object.keys(schema.$defs.sentence.properties).some((k) => k !== 'en')) out.push('the schema sentence has a language besides en');
  if (schema.$defs.catalogEntry.oneOf.some((b) => b.$ref)) out.push('catalogEntry accepts a bare string');
  if (/typeof entry === 'string'|CatalogEntry = string/.test(at('src/lib/catalog.mts'))) out.push('catalog.mts reads a bare string');
  if (/isinstance\(entry, str\)/.test(at('share/omx-contract/omx_contract_catalog.py'))) out.push('the Python catalog reader reads a bare string');
  if (/ALIAS_NAMES/.test(at('test/helpers.mjs'))) out.push('ALIAS_NAMES');
  if (/FREEMIXER_DOTGITHUB/.test(at('Makefile'))) out.push('the Makefile falls back to the old checkout variable');
  for (const w of ['ci', 'release', 'publish']) if (/proof\/round-trip\.mjs/.test(at(`.github/workflows/${w}.yml`))) out.push(`${w}.yml runs the round-trip proof`);
  return out;
}

test('no backward-compatibility machinery is left (rows of the back-compat audit)', () => {
  assert.deepEqual(leftovers(ROOT), []);
});

test('sabotage: each old thing planted in a scratch copy is named', () => {
  const plant = {
    'INSTALLED_SCHEMA accepts the code-host address': ['src/lib/contract-dir.mts', (t) => t.replace(/const INSTALLED_SCHEMA = /, 'const INSTALLED_SCHEMA = /github.com/; const X = ')],
    'the spec has Conflicts': ['packaging/omx-contract.spec', (t) => `${t}\nConflicts: omx-dsp-devel < 0.25.0\n`],
    'debian/control has Breaks or Replaces': ['debian/control', (t) => `${t}\nBreaks: libx (<< 1)\n`],
    'the Makefile falls back to the old checkout variable': ['Makefile', (t) => `${t}\nX ?= $(FREEMIXER_DOTGITHUB)\n`],
    'ALIAS_NAMES': ['test/helpers.mjs', (t) => `${t}\nexport const ALIAS_NAMES = 1;\n`],
    'ci.yml runs the round-trip proof': ['.github/workflows/ci.yml', (t) => `${t}\n        run: node tools/proof/round-trip.mjs --quiet\n`],
    'the schema sentence has a language besides en': ['schema/omx-contract.schema.json', (t) => { const j = JSON.parse(t); j.$defs.sentence.properties.ca = {}; return JSON.stringify(j); }],
    'catalogEntry accepts a bare string': ['schema/omx-contract.schema.json', (t) => { const j = JSON.parse(t); j.$defs.catalogEntry.oneOf.unshift({ $ref: '#/$defs/text' }); return JSON.stringify(j); }],
    'catalog.mts reads a bare string': ['src/lib/catalog.mts', (t) => `${t}\nconst x = typeof entry === 'string';\n`],
    'the Python catalog reader reads a bare string': ['share/omx-contract/omx_contract_catalog.py', (t) => `${t}\n    if isinstance(entry, str):\n`],
  };
  for (const [want, [rel, edit]] of Object.entries(plant)) {
    const dir = mkdtempSync(join(tmpdir(), 'omx-contract-nobc-'));
    try {
      for (const f of TEXT) { mkdirSync(dirname(join(dir, f)), { recursive: true }); cpSync(join(ROOT, f), join(dir, f)); }
      assert.deepEqual(leftovers(dir), [], 'positive control: the scratch copy is clean');
      writeFileSync(join(dir, rel), edit(readFileSync(join(dir, rel), 'utf8')));
      assert.ok(leftovers(dir).includes(want), `${want}: planted and not named: ${leftovers(dir).join('; ')}`);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }
  const dir = mkdtempSync(join(tmpdir(), 'omx-contract-nobc-'));
  try {
    for (const f of TEXT) { mkdirSync(dirname(join(dir, f)), { recursive: true }); cpSync(join(ROOT, f), join(dir, f)); }
    mkdirSync(join(dir, 'test/fixtures/omx-contract-2.5.0'), { recursive: true });
    assert.ok(leftovers(dir).includes('test/fixtures/omx-contract-2.5.0 exists'), 'a released-header fixture is named');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
