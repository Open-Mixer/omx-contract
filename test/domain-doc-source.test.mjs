// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// A domain item carries per-entry doc and source links (docs/contract-dir.md, "Per-entry doc and source links";
// omx-contract#215). The job: omx-clap's HOSTING_*_CODES leave data/ for one home, the hosting domain, installed
// alone (no x-file: the domain is the source, data/ drops the items). Each code's doc is its description, its text its
// x-text, the item's source its x-source; the installed read serves them, so `links` lists and `links --check` checks
// the domain's links against the owner's tree, `render --target md` prints the links and refuses an undocumented code,
// the schema and the read refuse a malformed x-source, and the domain schema's source is the classic schema's.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { test } from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import { ContractRefusal } from '../lib/codes.mjs';
import { loadContractDir } from '../lib/contract-dir.mjs';
import { ROOT, scratchDir } from './helpers.mjs';

const FIX = join(ROOT, 'test/fixtures/hosting-data');
const CLI = join(ROOT, 'bin/omx-contract.mjs');
const INSTALL = join(ROOT, 'tools/install-contract-dir.sh');
const cli = (...a) => spawnSync(process.execPath, [CLI, ...a], { encoding: 'utf8' });
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));

/** The classic HOSTING_*_CODES items of the fixture, `[name, item]` in file then declared order. */
const CLASSIC = walk(FIX).filter((f) => /^hosting(\.json|\/)/.test(relative(FIX, f))).sort()
  .flatMap((p) => Object.entries(JSON.parse(readFileSync(p, 'utf8'))).filter(([n, it]) => n.startsWith('HOSTING_') && it?.kind === 'codes'));
/** Every impl link the classic items carry, `<item> impl <link>`, as `links` prints it. */
const LINKS = CLASSIC.flatMap(([n, it]) => [it.source?.impl ?? []].flat().map((l) => `${n} impl ${l}`));

/** The items as the one-home hosting domain: no x-file, each code's doc its description and text its x-text, the source its x-source. */
function hostingDomain(keep = () => true) {
  const schemas = Object.fromEntries(CLASSIC.filter(([n, it]) => keep(n, it)).map(([n, it]) => [n, {
    description: it.doc, 'x-since': '1.0.0', ...(it.source === undefined ? {} : { 'x-source': it.source }),
    oneOf: Object.entries(it.codes).map(([key, c], i) => ({ const: c.code, title: key, ...(c.doc === undefined ? {} : { description: c.doc }), 'x-code': i, ...(c.text?.en === undefined ? {} : { 'x-text': c.text.en }), 'x-name': key })),
  }]));
  return { $schema: 'https://json-schema.org/draft/2020-12/schema', $id: 'https://openmixer.org/contract/hosting', info: { title: 'The hosting codes', version: '1.0.0', 'x-owner': 'omx-clap', 'x-stability': 'experimental' }, components: { schemas } };
}

/** `doc` installed as omx-clap installs its domain (install-contract-dir.sh --domain); the contract directory. */
function installed(doc) {
  const s = scratchDir('omx-doc-source-');
  const src = join(s, 'contract.d', 'hosting');
  mkdirSync(src, { recursive: true });
  writeFileSync(join(src, 'hosting.json'), `${JSON.stringify(doc, null, 2)}\n`);
  const r = spawnSync('sh', [INSTALL, '--domain', src, join(s, 'dir'), 'omx-clap'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return join(s, 'dir');
}

/** The owner's tree: every impl link's function, its body naming the item (docs/contract-dir.md, "links --check"). */
function ownerTree() {
  const t = scratchDir('omx-doc-source-tree-');
  const bodies = new Map();
  for (const [n, it] of CLASSIC) for (const l of [it.source?.impl ?? []].flat()) {
    const [path, fn] = l.split('#');
    bodies.set(path, `${bodies.get(path) ?? ''}int ${fn}(void)\n{\n  return 0; /* ${n} */\n}\n`);
  }
  for (const [path, text] of bodies) { mkdirSync(dirname(join(t, path)), { recursive: true }); writeFileSync(join(t, path), text); }
  return t;
}

const linksCheck = (dir, tree) => cli('links', '--check', '--root', tree, '--contract-dir', dir, '--package', 'hosting', '--json');
const report = (r) => JSON.parse(r.stdout.split('\n')[0]);

test('the fixture is a substrate where the defect shows: some items carry impl links, some codes a doc that is not their text', () => {
  assert.ok(LINKS.length >= 2, `the classic items carry ${LINKS.length} impl links`);
  assert.ok(CLASSIC.some(([, it]) => Object.values(it.codes).some((c) => c.doc && c.text?.en && c.doc !== c.text.en)));
});

test('links lists a domain item\'s x-source as it lists a classic item\'s source', () => {
  const r = cli('links', '--contract-dir', installed(hostingDomain()), '--package', 'hosting');
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(r.stdout.trim().split('\n').filter(Boolean).sort(), [...LINKS].sort());
});

test('links --check checks every impl link of the domain against the owner\'s tree', () => {
  const r = linksCheck(installed(hostingDomain()), ownerTree());
  assert.equal(r.status, 0, r.stderr);
  const got = report(r);
  assert.deepEqual(got.problems, []);
  assert.equal(got.checked, LINKS.length, 'every link checked');
  assert.equal(got.none, CLASSIC.filter(([, it]) => !it.source?.impl).length, 'only the items with no impl link counted as none');
});

test('sabotage: a domain impl link to an absent symbol, and one whose code does not name the item, are red by item and link', () => {
  const tree = ownerTree();
  const [name, item] = CLASSIC.find(([, it]) => it.source?.impl);
  const first = [item.source.impl].flat()[0];
  const gone = hostingDomain();
  gone.components.schemas[name]['x-source'] = { impl: `${first.split('#')[0]}#gone_function` };
  const a = linksCheck(installed(gone), tree);
  assert.equal(a.status, 1, a.stdout);
  assert.match(a.stderr, new RegExp(`^contract\\.source\\.symbol-absent \\S+: ${name}: ${first.split('#')[0]}#gone_function: `, 'm'));
  const other = CLASSIC.find(([n, it]) => n !== name && it.source?.impl);
  const unread = hostingDomain();
  unread.components.schemas[name]['x-source'] = { impl: [other[1].source.impl].flat()[0] };
  const b = linksCheck(installed(unread), tree);
  assert.equal(b.status, 1, b.stdout);
  assert.match(b.stderr, new RegExp(`^contract\\.source\\.unread \\S+: ${name}: `, 'm'));
});

test('a malformed x-source is refused by the domain schema and by the read, naming the item', () => {
  const schema = JSON.parse(readFileSync(join(ROOT, 'schema/domain.schema.json'), 'utf8'));
  const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  assert.ok(validate(hostingDomain()), JSON.stringify(validate.errors));
  const [name] = CLASSIC.find(([, it]) => it.source?.impl);
  for (const bad of [{ impl: 42 }, { impl: 'no link' }, { owner: 'x' }, {}]) {
    const doc = hostingDomain();
    doc.components.schemas[name]['x-source'] = bad;
    assert.equal(validate(doc), false, `the schema refuses x-source ${JSON.stringify(bad)}`);
    assert.ok(validate.errors.some((e) => e.instancePath.startsWith(`/components/schemas/${name}/x-source`)), JSON.stringify(validate.errors));
    assert.throws(() => loadContractDir({ dir: installed(doc) }), (e) => e instanceof ContractRefusal && e.code === 'contract.file.invalid' && e.message.includes(name), `the read refuses x-source ${JSON.stringify(bad)}`);
  }
});

test('the domain schema\'s source is the classic schema\'s, definition for definition', () => {
  const dom = JSON.parse(readFileSync(join(ROOT, 'schema/domain.schema.json'), 'utf8')).$defs;
  const classic = JSON.parse(readFileSync(join(ROOT, 'schema/omx-contract.schema.json'), 'utf8')).$defs;
  for (const k of ['source', 'links', 'oneLink', 'linkAt', 'link', 'at']) assert.deepEqual(dom[k], classic[k], `$defs.${k}`);
  for (const [k, d] of Object.entries(dom)) if (d.properties?.['x-source']) assert.deepEqual(d.properties['x-source'], { $ref: '#/$defs/source' }, `$defs.${k}.x-source`);
});

test('render --target md prints a domain item\'s links and each code\'s doc, never its text', () => {
  const documented = (n, it) => Object.values(it.codes).every((c) => c.doc);
  const out = join(scratchDir('omx-doc-source-md-'), 'pages');
  const r = cli('render', '--target', 'md', '--contract-dir', installed(hostingDomain(documented)), '--package', 'hosting', '--out', out);
  assert.equal(r.status, 0, r.stderr);
  const page = readFileSync(join(out, 'hosting.md'), 'utf8');
  for (const [n, it] of CLASSIC.filter(([nn, it]) => documented(nn, it))) {
    const impl = [it.source?.impl ?? []].flat();
    const section = page.split(/^## /m).find((s) => s.startsWith(`${n}\n`));
    assert.ok(section, `${n} has a section`);
    if (impl.length) assert.match(section, new RegExp(`^Source: impl ${impl.map((l) => `\`${l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\``).join(', ')}\\.$`, 'm'), `${n} prints its links`);
    else assert.doesNotMatch(section, /^Source:/m);
    for (const c of Object.values(it.codes)) {
      assert.ok(section.includes(c.doc.replace(/\|/g, '\\|')), `${n}: ${c.code}: its doc`);
      if (c.text?.en && c.text.en !== c.doc) assert.ok(!section.includes(c.text.en.replace(/\|/g, '\\|')), `${n}: ${c.code}: not its text`);
    }
  }
});

test('the doc check: a domain code with no description is refused by page, item and code, and nothing is written', () => {
  const documented = (n, it) => Object.values(it.codes).every((c) => c.doc);
  const doc = hostingDomain(documented);
  const [name, s] = Object.entries(doc.components.schemas)[0];
  delete s.oneOf[0].description;
  const out = join(scratchDir('omx-doc-source-md-'), 'pages');
  const r = cli('render', '--target', 'md', '--contract-dir', installed(doc), '--package', 'hosting', '--out', out);
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stderr, new RegExp(`^hosting: ${name}: ${s.oneOf[0].const.replace(/\./g, '\\.')}: the word has no doc$`, 'm'));
  assert.throws(() => readdirSync(out), 'nothing written');
});
