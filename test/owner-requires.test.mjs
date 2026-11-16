// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// `translate --owner <tree>` (docs/data-layout.md "Catalogs"): a tree whose files name packages in `requires` reads
// them through $OMX_CONTRACT_PATH, then the installed directory, or is refused by name (contract.requires.unresolved);
// a tree that declares its codes outside data/ (schema/codes.json) has them read, or is refused by name
// (contract.owner.codes-unlocated). Neither ever reports a reference or a key undeclared that the tree declares.
// The fixtures are modelled on Open-Mixer/plugin-hostd-protocol (a verb refers to omx-clap-core's HOST_REPLY_CODES)
// and Open-Mixer/plugin-qualify (its codes are the bare item file schema/codes.json).
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, test } from 'node:test';
import { CONTRACT_CODES } from '../lib/codes.mjs';
import { SCHEMA_MAJOR, installedSchemaUrl, sha256 } from '../lib/contract-dir.mjs';
import { packageVersion } from '../lib/data.mjs';
import { SCHEMA_VERSION } from '../lib/validate.mjs';
import { DATA, ROOT } from './helpers.mjs';

const CLI = join(ROOT, 'bin', 'omx-contract.mjs');
const SCRATCH = mkdtempSync(join(tmpdir(), 'omx-owner-requires-'));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));
let n = 0;
const fresh = (what) => join(SCRATCH, `${what}-${n++}`);
const write = (root, rel, doc) => {
  const p = join(root, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, typeof doc === 'string' ? doc : `${JSON.stringify(doc, null, 2)}\n`);
};

/** A contract directory holding omx-contract's data and `omx-clap-core` 0.30.5 with HOST_REPLY_CODES, as an install writes them. */
function contractDir({ clapCore = true } = {}) {
  const root = fresh('contract');
  execFileSync('sh', [join(ROOT, 'tools/install-contract-dir.sh'), '-x', 'codes.json', '-x', 'scale-vectors.json', 'omx-contract', packageVersion(ROOT), String(SCHEMA_MAJOR), DATA, root, 'data'], { stdio: 'ignore' });
  if (!clapCore) return root;
  const pdir = join(root, String(SCHEMA_MAJOR), 'omx-clap-core');
  write(pdir, 'verbs.json', {
    $schema: installedSchemaUrl(SCHEMA_MAJOR),
    requires: { 'omx-contract-schema': `>= ${SCHEMA_VERSION}` },
    HOST_REPLY_CODES: {
      kind: 'codes', since: '0.22.0', doc: 'The refusals the verbs of this package answer.',
      codes: {
        memoryAllocation: { code: 'reply.host.memory-allocation', resp: -4, doc: 'out of memory', text: { en: 'The host ran out of memory. Free some and try again.' } },
        invalidOperation: { code: 'reply.host.invalid-operation', resp: -5, doc: 'not valid here', text: { en: 'That operation is not valid here. Use another.' } },
      },
    },
  });
  const files = {};
  for (const f of readdirSync(pdir)) files[f] = sha256(readFileSync(join(pdir, f)));
  write(pdir, 'MANIFEST.json', { package: 'omx-clap-core', version: '0.30.5', schemaMajor: SCHEMA_MAJOR, files });
  return root;
}

const placement = { code: 'reply.fixture.placement-invalid', resp: -501, doc: 'not a placement', text: { en: 'The plugin cannot be placed there; choose another place for it.' }, args: [] };

/** A tree modelled on plugin-hostd-protocol: its verbs refer to a code of a package its `requires` names. */
function hostdTree() {
  const tree = fresh('hostd');
  write(tree, 'data/verbs.json', {
    $schema: '../schema/omx-contract.schema.json',
    requires: { 'omx-contract-schema': `>= ${SCHEMA_VERSION}`, 'omx-clap-core': '>= 0.30.5' },
    FIXTURE_REPLY_CODES: { kind: 'codes', since: '0.1.0', doc: 'the fixture codes', codes: { placementInvalid: placement } },
    FIXTURE_VERBS: {
      kind: 'verbs', since: '0.1.0', doc: 'the fixture verbs',
      verbs: {
        workerList: {
          verb: 'worker_list', format: 'worker_list', reply: 'resp <n>',
          codes: [{ ref: 'HOST_REPLY_CODES.memoryAllocation' }, { ref: 'HOST_REPLY_CODES.invalidOperation' }],
          implementedBy: { 'plugin-hostd': 'required' }, doc: 'the workers',
        },
      },
    },
  });
  write(tree, 'catalogs/ca.json', { $schema: '../schema/omx-contract.schema.json#/$defs/catalog', kind: 'catalog', lang: 'ca', owner: 'fixture', messages: { 'reply.fixture.placement-invalid': 'El plugin no es pot col·locar allà; trieu-ne un altre lloc.' } });
  return tree;
}

/** A tree modelled on plugin-qualify: its codes are the bare item file schema/codes.json, none in data/. */
function qualifyTree({ codes = true } = {}) {
  const tree = fresh('qualify');
  write(tree, 'package.json', { name: '@openmixer/fixture-qualify' });
  write(tree, 'data/formats/x.json', { $schema: '../../schema/omx-contract.schema.json', requires: { 'omx-contract-schema': `>= ${SCHEMA_VERSION}` }, FIXTURE_SCALAR: { kind: 'scalar', doc: 'a scalar', unit: '', value: 1 } });
  if (codes) write(tree, 'schema/codes.json', { kind: 'codes', doc: 'the fixture codes', codes: { descriptorDuplicateSymbol: { code: 'qualify.descriptor.duplicate-symbol', doc: 'a symbol twice', text: { en: 'The plugin declares a symbol twice.' }, args: [] } } });
  write(tree, 'catalogs/ca.json', { $schema: '../schema/omx-contract.schema.json#/$defs/catalog', kind: 'catalog', lang: 'ca', owner: 'fixture-qualify', messages: { 'qualify.descriptor.duplicate-symbol': 'El plugin declara un símbol dues vegades.' } });
  return tree;
}

const run = (tree, env = {}) => {
  const e = { ...process.env, OMX_CONTRACT_PATH: '', ...env };
  if (!env.OMX_CONTRACT_PATH) delete e.OMX_CONTRACT_PATH;
  return spawnSync(process.execPath, [CLI, 'translate', '--check', '--owner', tree, '--lang', 'ca', '--package', tree.includes('hostd') ? 'fixture' : 'fixture-qualify'], { env: e, encoding: 'utf8' });
};

test('a tree whose refs point into a required package is green when OMX_CONTRACT_PATH holds it: no false undeclared', () => {
  const r = run(hostdTree(), { OMX_CONTRACT_PATH: contractDir() });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.doesNotMatch(r.stderr + r.stdout, /no item|undeclared/);
});

test('a requirement found nowhere is refused by name: the requirement, every place looked, the --installed form', () => {
  const dir = contractDir({ clapCore: false });
  const r = run(hostdTree(), { OMX_CONTRACT_PATH: dir, PATH: process.env.PATH });
  assert.equal(r.status, 1, r.stderr);
  assert.ok(r.stderr.startsWith(`${CONTRACT_CODES.requiresUnresolved} `), r.stderr);
  assert.match(r.stderr, /omx-clap-core >= 0\.30\.5/);
  assert.ok(r.stderr.includes(dir), 'OMX_CONTRACT_PATH is named as a place looked');
  assert.match(r.stderr, /pkg-config/);
  assert.match(r.stderr, /--installed/);
  assert.doesNotMatch(r.stderr, /no item|undeclared/, 'never the false report');
});

test('a requirement installed below its floor is refused the same way', () => {
  const dir = contractDir();
  const m = join(dir, String(SCHEMA_MAJOR), 'omx-clap-core/MANIFEST.json');
  const doc = JSON.parse(readFileSync(m, 'utf8'));
  doc.version = '0.30.4';
  writeFileSync(m, JSON.stringify(doc));
  const r = run(hostdTree(), { OMX_CONTRACT_PATH: dir });
  assert.equal(r.status, 1);
  assert.ok(r.stderr.startsWith(`${CONTRACT_CODES.requiresUnresolved} `), r.stderr);
  assert.match(r.stderr, /0\.30\.4/);
});

test('a tree with no requires beside the schema is read as before', () => {
  const r = run(qualifyTree());
  assert.equal(r.status, 0, r.stderr + r.stdout);
});

test('codes declared in schema/codes.json are read by --owner: no key of its catalogs reported undeclared', () => {
  const r = run(qualifyTree());
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.doesNotMatch(r.stderr + r.stdout, /catalog-key|is no code or word/);
});

test('catalogs with keys and no declared code location are refused by name, never as undeclared keys', () => {
  const r = run(qualifyTree({ codes: false }));
  assert.equal(r.status, 1, r.stderr);
  assert.ok(r.stderr.startsWith(`${CONTRACT_CODES.ownerCodesUnlocated} `), r.stderr);
  assert.match(r.stderr, /schema\/codes\.json/);
  assert.doesNotMatch(r.stderr, /catalog-key|is no code or word/);
});
