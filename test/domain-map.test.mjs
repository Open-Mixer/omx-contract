// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The domain kind for a mapping table, `x-kind: map` (owner ruling 2026-11-23, decision 1 of plugin-hostd#215;
// omx-contract#191). A map item names its format (`x-format`) and is a oneOf of one row per source field: `const` and
// `title` the source key (`units:unit`, `clap_param_info.min_value`), `x-code` its place, exactly one outcome
// (`x-word`, the descriptor word with its transform and its lookup sub-table `values`; `x-extension`, carried in the
// extension bag; or `x-dropped`, with the ruling that drops it), what it covers (`x-term`, the term link
// `<TERMS item>#<term>` into a terms item of the format, or `x-from`, a link or URL for a field no terms item holds)
// and its `description`. render --with-domain rebuilds it as the data form's formatMap item, and validate checks the
// rows there.
//
// The fixtures are plugin-hostd 58b7145's two format tables (contract.d/plugin-hostd/{clap,lv2}/<f>.json, copied
// verbatim), which hold each map as a sheet whose x-value is { format, rows }. Written as a map item, the rebuild of
// each is byte for byte plugin-hostd fac7531's data/formats/<f>.json, the file the sheet was made from, less its
// `$schema` and `requires` lines (2-5), which a rebuilt file never carries from a domain with no x-requires
// (docs/render.md); the digests below are of those bytes.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import { SCHEMA_MAJOR, installedSchemaUrl } from '../lib/contract-dir.mjs';
import { domainDataFiles, readDomain } from '../lib/domain.mjs';
import { openDomainAt } from '../lib/domain-reader.mjs';
import { packageVersion } from '../lib/data.mjs';
import { CLAP_TERMS, DATA, installParamDomain, LV2_TERMS, ROOT, scratchUnion, domainOwner } from './helpers.mjs';

const FIX = join(ROOT, 'test/fixtures/domain-map');
const SCRATCH = mkdtempSync(join(tmpdir(), 'omx-domain-map-'));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));
const cli = (...a) => spawnSync(process.execPath, [join(ROOT, 'bin/omx-contract.mjs'), ...a], { encoding: 'utf8' });
const sha256 = (t) => createHash('sha256').update(t).digest('hex');

/** plugin-hostd fac7531's data/formats/<f>.json less lines 2-5 ($schema, requires): its row count and sha256. */
const GOLDEN = {
  clap: { item: 'PLUGIN_HOSTD_CLAP_MAP', rows: 373, sha256: '645031a95c26250b171dd60456ce7dab5f0b8d3fc6c3aebdff84f59bdf2f6aa7' },
  lv2: { item: 'PLUGIN_HOSTD_LV2_MAP', rows: 458, sha256: 'e18c6bb3d8604b53c01fd0299a7a216ceb0c8cdad94cb0e4b2e9957de894aad5' },
};

/** The data form's row as a map row: its outcome and what it covers under their x- names, its doc the description. */
const rowOf = ([field, r], i) => Object.fromEntries(Object.entries({
  const: field, title: field, 'x-code': i, description: r.doc,
  'x-term': r.term, 'x-from': r.from, 'x-word': r.word, 'x-extension': r.extension, 'x-dropped': r.dropped,
}).filter(([, v]) => v !== undefined));

/** plugin-hostd 58b7145's document for format `f`, its sheet written as a map item. */
function mapDoc(f) {
  const doc = JSON.parse(readFileSync(join(FIX, `${f}.json`), 'utf8'));
  const s = doc.components.schemas[GOLDEN[f].item];
  const { format, rows } = s['x-value'];
  doc.components.schemas[GOLDEN[f].item] = {
    description: s.description, 'x-since': s['x-since'], 'x-kind': 'map', 'x-file': s['x-file'], 'x-format': format,
    oneOf: Object.entries(rows).map(rowOf),
  };
  return doc;
}

const read = (name, doc) => readDomain(name, doc, installedSchemaUrl(SCHEMA_MAJOR), SCHEMA_MAJOR);
const schema = JSON.parse(readFileSync(join(ROOT, 'schema/domain.schema.json'), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: false }).compile(schema);

/** The data directory a data render reads (data/, the LV2 and CLAP terms). */
const UNION = scratchUnion();

/** The terms files of `dir` (test/fixtures/lv2-terms, clap-terms) as the domain `name` of `owner`: its directory. */
function termsDomain(dir, name, owner) {
  const walk = (d) => readdirSync(d).sort().flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
  const schemas = {};
  for (const f of walk(dir)) {
    for (const [k, it] of Object.entries(JSON.parse(readFileSync(f, 'utf8')))) {
      if (it?.kind !== 'terms') continue;
      schemas[k] = { description: it.doc, 'x-since': '1.0.0', 'x-kind': 'terms', 'x-format': it.format, 'x-spec': it.spec, 'x-version': it.version, ...(it.deprecated ? { 'x-deprecated': true } : {}), oneOf: Object.entries(it.terms).map(([t, v], i) => ({ const: t, title: t, 'x-code': i, 'x-term': v })) };
    }
  }
  const at = join(SCRATCH, 'terms/contract.d', name);
  mkdirSync(at, { recursive: true });
  writeFileSync(join(at, `${name}.json`), JSON.stringify({ $schema: 'https://json-schema.org/draft/2020-12/schema', $id: `https://openmixer.org/contract/${name}`, info: { title: `The ${name} terms`, version: '1.0.0', 'x-owner': owner, 'x-stability': 'experimental' }, components: { schemas } }));
  return at;
}

/**
 * The contract directory validate reads, as the owner's read is: omx-contract as `make install` writes it, its
 * contract and param domains, and the LV2 and CLAP terms as the domains lv2 (plugin-db's) and clap (omx-clap's).
 */
const CONTRACT_DIR = join(SCRATCH, 'contract-dir');
{
  const sh = join(ROOT, 'tools/install-contract-dir.sh');
  execFileSync('sh', [sh, '-x', 'scale-vectors.json', 'omx-contract', packageVersion(ROOT), DATA, CONTRACT_DIR, 'data'], { stdio: 'ignore' });
  execFileSync('sh', [sh, '--domain', join(ROOT, 'contract.d/contract'), CONTRACT_DIR, domainOwner(join(ROOT, 'contract.d/contract'))], { stdio: 'ignore' });
  installParamDomain(CONTRACT_DIR);
  for (const d of [termsDomain(LV2_TERMS, 'lv2', 'plugin-db'), termsDomain(CLAP_TERMS, 'clap', 'omx-clap')]) execFileSync('sh', [sh, '--domain', d, CONTRACT_DIR, domainOwner(d)], { stdio: 'ignore' });
}
const validate = (dir) => cli('validate', '--contract-dir', CONTRACT_DIR, '--with-domain', dir);

/** The map domain of `f` under a contract.d/ of its own: its directory. */
function domainDir(f, doc, tag) {
  const dir = join(SCRATCH, tag, 'contract.d/plugin-hostd', f);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${f}.json`), `${JSON.stringify(doc, null, 2)}\n`);
  return dir;
}

for (const f of Object.keys(GOLDEN)) {
  const { item, rows, sha256: want } = GOLDEN[f];

  test(`${f}: plugin-hostd 58b7145's ${item}, written as x-kind map, rebuilds formats/${f}.json byte for byte that of fac7531`, () => {
    const doc = mapDoc(f);
    assert.equal(doc.components.schemas[item].oneOf.length, rows);
    const text = domainDataFiles(`plugin-hostd/${f}`, doc)[`formats/${f}.json`];
    assert.equal(typeof text, 'string', `no formats/${f}.json rebuilt`);
    assert.equal(sha256(text), want);
    const rebuilt = JSON.parse(text)[item];
    assert.deepEqual([rebuilt.kind, rebuilt.format, Object.keys(rebuilt.rows).length], ['formatMap', f, rows]);
  });

  test(`${f}: the domain schema accepts the map, and the reader gives the build the data form's formatMap`, () => {
    const doc = mapDoc(f);
    assert.ok(ajv(doc), JSON.stringify(ajv.errors?.slice(0, 5)));
    const { doc: classic } = read(`plugin-hostd/${f}`, doc);
    assert.deepEqual(classic[item], JSON.parse(domainDataFiles(`plugin-hostd/${f}`, doc)[`formats/${f}.json`])[item]);
  });

  test(`${f}: validate --with-domain refuses 58b7145's coef -> "x" and pc -> "%" (rule map-unit, omx-contract#193: a unit is a PARAM_UNITS id) and nothing else`, () => {
    const v = validate(domainDir(f, mapDoc(f), `verbatim-${f}`));
    assert.equal(v.status, 1, v.stdout);
    const lines = v.stderr.trim().split('\n').filter((l) => l.includes(': map-unit: '));
    assert.equal(lines.length, 2, v.stderr);
    assert.ok(lines.some((l) => /: (coef|units:coef) -> "x" is no PARAM_UNITS standard id/.test(l)), v.stderr);
    assert.ok(lines.some((l) => /: (pc|units:pc) -> "%" is no PARAM_UNITS standard id/.test(l)), v.stderr);
  });

  test(`${f}: validate --with-domain reads the map valid with coef for "x" and percent for "%", its term links resolved; render --target json --with-domain carries it`, () => {
    // The ruled fixes, the only changes from 58b7145: coef is the one plain multiplier (omx-contract#167), and a unit is
    // spelled by its PARAM_UNITS id, the symbol "%" being display only (C2).
    const ID = { x: 'coef', '%': 'percent' };
    const doc = mapDoc(f);
    for (const r of doc.components.schemas[item].oneOf) for (const [k, u] of Object.entries(r['x-word']?.values ?? {})) if (ID[u]) r['x-word'].values[k] = ID[u];
    const dir = domainDir(f, doc, `valid-${f}`);
    const v = validate(dir);
    assert.equal(v.status, 0, v.stderr);
    assert.match(v.stdout, /valid/);
    const r = cli('render', '--target', 'json', '--data', UNION, '--with-domain', dir, '--out', join(SCRATCH, `json-${f}`));
    assert.equal(r.status, 0, r.stderr);
    const out = JSON.parse(readFileSync(join(SCRATCH, `json-${f}`, 'omx-contract.json'), 'utf8')).items[item];
    assert.deepEqual([out.kind, out.format, Object.keys(out.value).length], ['formatMap', f, rows]);
  });

  test(`${f}: the runtime reader serves the map's source keys as its words`, () => {
    const doc = mapDoc(f);
    const dir = join(SCRATCH, `runtime-${f}`);
    mkdirSync(join(dir, 'plugin-hostd', f), { recursive: true });
    writeFileSync(join(dir, 'plugin-hostd', f, `${f}.json`), JSON.stringify(doc));
    const words = openDomainAt(dir, `plugin-hostd/${f}`).words(item).map((w) => w.word);
    assert.deepEqual(words, doc.components.schemas[item].oneOf.map((r) => r.const));
  });
}

/** The lv2 map with one row changed by `edit`: the refusal of the reader, of the domain schema and of validate. */
const LV2 = 'PLUGIN_HOSTD_LV2_MAP';
function sabotage(tag, edit) {
  const doc = mapDoc('lv2');
  const rows = Object.fromEntries(doc.components.schemas[LV2].oneOf.map((r) => [r.const, r]));
  edit(rows);
  let reader = '';
  try { read('plugin-hostd/lv2', doc); } catch (e) { reader = e.message; }
  const v = validate(domainDir('lv2', doc, tag));
  return { reader, schema: ajv(doc), status: v.status, stderr: v.stderr };
}

test('refused: a row with no outcome, by the reader (naming the row), the domain schema and validate', () => {
  const r = sabotage('zero', (rows) => { delete rows['units:unit']['x-word']; });
  assert.match(r.reader, /units:unit.*has no outcome.*exactly one of x-word, x-extension or x-dropped/);
  assert.equal(r.schema, false);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /units:unit.*has no outcome/);
});

test('refused: a row with two outcomes, by the reader (naming both), the domain schema and validate', () => {
  const r = sabotage('two', (rows) => { rows['units:unit']['x-extension'] = true; });
  assert.match(r.reader, /units:unit.*has two outcomes, x-word and x-extension/);
  assert.equal(r.schema, false);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /units:unit.*two outcomes/);
});

test('refused: a dropped row without a ruling (none, or an empty one), by the reader, the domain schema and validate', () => {
  for (const [tag, dropped] of [['no-ruling', {}], ['empty-ruling', { ruling: '' }]]) {
    const r = sabotage(tag, (rows) => { rows['atom:Resource']['x-dropped'] = dropped; });
    assert.match(r.reader, /atom:Resource.*x-dropped names no ruling/, tag);
    assert.equal(r.schema, false, tag);
    assert.notEqual(r.status, 0, tag);
    assert.match(r.stderr, /atom:Resource.*x-dropped names no ruling/, tag);
  }
});

test('refused: a dangling term link, a terms item that is not there or a term it lacks, by validate (rule map-term)', () => {
  const item = sabotage('dangling-item', (rows) => { rows['units:unit']['x-term'] = 'LV2_FURLONG_TERMS#unit'; });
  assert.equal(item.reader, '', 'a term link into another domain is resolved by the read of all, not the reader of one');
  assert.notEqual(item.status, 0);
  assert.match(item.stderr, /formats\/lv2\.json: PLUGIN_HOSTD_LV2_MAP: map-term: units:unit: LV2_FURLONG_TERMS#unit: LV2_FURLONG_TERMS is no terms item/);
  const term = sabotage('dangling-term', (rows) => { rows['units:unit']['x-term'] = 'LV2_UNITS_TERMS#furlong'; });
  assert.notEqual(term.status, 0);
  assert.match(term.stderr, /formats\/lv2\.json: PLUGIN_HOSTD_LV2_MAP: map-term: units:unit: LV2_UNITS_TERMS#furlong: LV2_UNITS_TERMS has no term furlong/);
});

test('refused: a row that covers nothing or covers twice (x-term and x-from), a const that is not its title, an x-code out of place', () => {
  assert.match(sabotage('covers-none', (rows) => { delete rows['units:unit']['x-term']; }).reader, /units:unit.*covers nothing.*exactly one of x-term or x-from/);
  assert.match(sabotage('covers-two', (rows) => { rows['units:unit']['x-from'] = 'http://lv2plug.in/ns/extensions/units#unit'; }).reader, /units:unit.*covers twice/);
  assert.match(sabotage('title', (rows) => { rows['units:unit'].title = 'unit'; }).reader, /units:unit.*title.*the source key/);
  assert.match(sabotage('code', (rows) => { rows['units:unit']['x-code'] = 0; }).reader, /units:unit.*x-code 0.*its place/);
});
