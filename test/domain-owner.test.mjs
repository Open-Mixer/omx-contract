// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// One owner, several domains, and an owner whose contract is only domains (vocabulary sorting pass, S0, the gaps the
// omx-clap V15 and plugin-hostd-protocol V16 moves met):
//  (a) `render --with-domain` repeats: two domains of one owner, an item of one naming an item of the other, rebuild
//      into that one package and render; one of them alone is refused, naming the item the other holds;
//  (b) a domain whose info.x-requires names another domain may refer to that domain's items, installed or rebuilt
//      (the conformance case valid-domain-requires-domain holds the installed read);
//  (c) a domain-only owner: `install-contract-dir.sh --owner <package> <version> <major> <contractdir> <domain>...`
//      installs a package with no data file, its MANIFEST.json `files` empty and `domains` the domains its contract
//      is; the reader reads it with those domains, and refuses a listed domain that is not installed; a plain install
//      of a directory with no data file is still refused; and `render --with-domain` rebuilds an owner that is not
//      installed at all into a package of that name, at the domain's info.version.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { SCHEMA_MAJOR } from '../lib/contract-dir.mjs';
import { packageVersion } from '../lib/data.mjs';
import { DATA, installParamDomain, installVerbHosts, ROOT, domainOwner } from './helpers.mjs';

const SCRATCH = mkdtempSync(join(tmpdir(), 'omx-domain-owner-'));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));
const SH = join(ROOT, 'tools/install-contract-dir.sh');
const CLI = join(ROOT, 'bin/omx-contract.mjs');
let n = 0;

const domain = (name, title, schemas, requires) => ({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: `https://openmixer.org/contract/${name}`,
  info: { title, version: '1.0.0', 'x-owner': 'omx-owned', 'x-stability': 'experimental', ...(requires ? { 'x-requires': requires } : {}) },
  components: { schemas },
});
const HOST = domain('owned-host', 'The host words of the owner', {
  OWNED_HOST_REPLY_CODES: {
    description: 'The refusals.', 'x-since': '1.0.0', 'x-kind': 'codes', 'x-file': 'host.json',
    oneOf: [{ const: 'reply.owned-host.busy', title: 'busy', description: 'busy', 'x-code': 0, 'x-text': 'The host is busy; try again.', 'x-args': [], 'x-name': 'busy', 'x-resp': -901, 'x-transient': true }],
  },
});
const OWNED = domain('owned', 'The verbs of the owner', {
  OWNED_VERBS: {
    description: 'The verbs.', 'x-since': '1.0.0', 'x-kind': 'verbs', 'x-file': 'verbs.json',
    oneOf: [{ const: 'owned_ping', title: 'ownedPing', description: 'Ping the host.', 'x-code': 0, 'x-format': 'owned_ping %i', 'x-reply': 'resp 0', 'x-codes': [{ ref: 'OWNED_HOST_REPLY_CODES.busy' }], 'x-implemented-by': { 'plugin-hostd': 'required' }, 'x-since': '1.0.0' }],
  },
}, { 'owned-host': '>= 1.0.0' });

/** A tree holding contract.d/owned-host and contract.d/owned; its root. */
function tree() {
  const t = join(SCRATCH, `tree-${n++}`);
  for (const d of [HOST, OWNED]) {
    const name = d.$id.split('/').pop();
    mkdirSync(join(t, 'contract.d', name), { recursive: true });
    writeFileSync(join(t, 'contract.d', name, `${name}.json`), `${JSON.stringify(d, null, 2)}\n`);
  }
  return t;
}

/** A contract directory holding omx-contract as `make install` writes it; its root. */
function contractDir() {
  const root = join(SCRATCH, `cd-${n++}`);
  execFileSync('sh', [SH, '-x', 'scale-vectors.json', 'omx-contract', packageVersion(ROOT), String(SCHEMA_MAJOR), DATA, root, 'data'], { stdio: 'ignore' });
  execFileSync('sh', [SH, '--domain', join(ROOT, 'contract.d/contract'), root, domainOwner(join(ROOT, 'contract.d/contract'))], { stdio: 'ignore' });
  installParamDomain(root);
  installVerbHosts(root);
  return root;
}

const cli = (...a) => spawnSync(process.execPath, [CLI, ...a], { encoding: 'utf8' });

test('(a) render --with-domain twice: two domains of one owner rebuild into it and render; one alone is refused by the item', () => {
  const t = tree();
  const root = contractDir();
  const out = join(SCRATCH, `out-${n++}`);
  const r = cli('render', '--target', 'c', '--out', out, '--contract-dir', root, '--package', 'omx-owned', '--with-domain', join(t, 'contract.d/owned-host'), '--with-domain', join(t, 'contract.d/owned'));
  assert.equal(r.status, 0, r.stderr);
  assert.match(readFileSync(join(out, 'omx_owned_vocabulary.h'), 'utf8'), /#define OMX_REPLY_OWNED_HOST_BUSY "reply\.owned-host\.busy"/);
  // the verb of one domain carries the reply code of the other
  assert.match(readFileSync(join(out, 'omx_owned_host_verbs.h'), 'utf8'), /#define OMX_VERB_OWNED_PING_CODES_INIT \{ -901 \} \/\* reply\.owned-host\.busy \*\//);
  const one = cli('render', '--target', 'c', '--out', join(SCRATCH, `out-${n++}`), '--contract-dir', root, '--package', 'omx-owned', '--with-domain', join(t, 'contract.d/owned'));
  assert.notEqual(one.status, 0);
  assert.match(one.stderr, /OWNED_HOST_REPLY_CODES/);
});

test('(c) install --owner: a package with no data file, its manifest naming its domains; read with them, refused without', () => {
  const t = tree();
  const root = contractDir();
  const i = spawnSync('sh', [SH, '--owner', 'omx-owned', '1.0.0', String(SCHEMA_MAJOR), root, 'owned-host', 'owned'], { encoding: 'utf8' });
  assert.equal(i.status, 0, i.stderr);
  const m = JSON.parse(readFileSync(join(root, String(SCHEMA_MAJOR), 'omx-owned/MANIFEST.json'), 'utf8'));
  assert.deepEqual(m, { package: 'omx-owned', version: '1.0.0', schemaMajor: SCHEMA_MAJOR, files: {}, domains: ['owned-host', 'owned'] });
  const missing = cli('validate', '--contract-dir', root);
  assert.equal(missing.status, 1, 'a listed domain that is not installed is refused');
  assert.match(missing.stderr, /contract\.manifest\.mismatch.*owned-host/s);
  for (const d of ['owned-host', 'owned']) execFileSync('sh', [SH, '--domain', join(t, 'contract.d', d), root, domainOwner(join(t, 'contract.d', d))], { stdio: 'ignore' });
  const ok = cli('validate', '--contract-dir', root);
  assert.equal(ok.status, 0, ok.stderr);
  // a plain install of a directory with no data file stays refused: --owner says the package is only domains
  const empty = join(SCRATCH, `empty-${n++}`);
  mkdirSync(empty);
  assert.equal(spawnSync('sh', [SH, 'omx-owned', '1.0.0', String(SCHEMA_MAJOR), empty, join(SCRATCH, `cd-${n++}`)]).status, 1);
});

test('(c) render --with-domain builds an owner that is not installed, from its domains alone', () => {
  const t = tree();
  const root = contractDir();
  const out = join(SCRATCH, `out-${n++}`);
  const r = cli('render', '--target', 'ts', '--out', out, '--contract-dir', root, '--package', 'omx-owned', '--with-domain', join(t, 'contract.d/owned-host'), '--with-domain', join(t, 'contract.d/owned'));
  assert.equal(r.status, 0, r.stderr);
  const v = cli('validate', '--contract-dir', root, '--with-domain', join(t, 'contract.d/owned-host'), '--with-domain', join(t, 'contract.d/owned'), '--needs', "omx-owned@>= 1.0.0");
  assert.equal(v.status, 0, v.stderr);
});

// A domain item with no x-file is read at run time only: an installed domain's items never render into its owner's
// package (render --package <owner>), as the scan domain's SCAN_* stay out of omx-clap's renders. Only omx-contract's
// own param domain, which its data read takes beside data/ (lib/data.mjs TREE_DOMAINS), renders into its package.
test('an installed domain\'s run-time items are absent from its owner\'s package render', () => {
  const root = contractDir();
  const data = join(SCRATCH, `owned-data-${n++}`);
  mkdirSync(data);
  writeFileSync(join(data, 'owned.json'), `${JSON.stringify({ $schema: '../schema/omx-contract.schema.json', requires: { 'omx-contract-schema': '>= 3.0.0' }, OWNED_MODES: { kind: 'words', since: '1.0.0', doc: 'The modes.', words: { one: { word: 'one', doc: 'One.' } } } }, null, 2)}\n`);
  execFileSync('sh', [SH, 'omx-owned', '1.0.0', String(SCHEMA_MAJOR), data, root, 'data'], { stdio: 'ignore' });
  const run = structuredClone(HOST);
  run.components.schemas = { OWNED_HOST_RUN_WORDS: { description: 'Words read at run time.', 'x-since': '1.0.0', 'x-kind': 'words', oneOf: [{ const: 'live', title: 'live', description: 'Live.', 'x-code': 0 }] } };
  mkdirSync(join(root, 'owned-host'));
  writeFileSync(join(root, 'owned-host/owned-host.json'), `${JSON.stringify(run, null, 2)}\n`);
  for (const target of ['c', 'ts']) {
    const out = join(SCRATCH, `out-${n++}`);
    const r = cli('render', '--target', target, '--out', out, '--contract-dir', root, '--package', 'omx-owned');
    assert.equal(r.status, 0, r.stderr);
    const text = readdirSync(out).map((f) => readFileSync(join(out, f), 'utf8')).join('\n');
    assert.match(text, /OWNED_MODES/, `${target}: the package's own item renders`);
    assert.doesNotMatch(text, /OWNED_HOST_RUN_WORDS/, `${target}: the run-time item does not`);
  }
});

// A domain item's provenance in a render is its domain's document, contract.d/<domain>/<leaf>.json, never the
// data/<x-file> a rebuild writes it to (that path exists nowhere); a data item keeps its data/<file>. Rebuilt with
// --with-domain (the verbs header's banner) and read beside data/ (omx-contract's param domain, the ts @see).
test('a domain item\'s banner names its domain\'s document, contract.d/<domain>/<leaf>.json', () => {
  const t = tree();
  const root = contractDir();
  const out = join(SCRATCH, `out-${n++}`);
  const r = cli('render', '--target', 'c', '--out', out, '--contract-dir', root, '--package', 'omx-owned', '--with-domain', join(t, 'contract.d/owned-host'), '--with-domain', join(t, 'contract.d/owned'));
  assert.equal(r.status, 0, r.stderr);
  const verbs = readFileSync(join(out, 'omx_owned_host_verbs.h'), 'utf8');
  assert.match(verbs, /OWNED_VERBS\.ownedPing \(contract\.d\/owned\/owned\.json\)/);
  assert.doesNotMatch(verbs, /\(data\/verbs\.json\)/);
  const ts = readFileSync(join(ROOT, 'test/golden/ts/omx-contract.js'), 'utf8');
  assert.match(ts, /@see contract\.d\/param\/param\.json/);
  assert.doesNotMatch(ts, /@see param\/param\.json/);
  assert.match(ts, /@see data\/rates\.json/, 'a data item keeps its data/<file>');
});

// A nested domain (plugin-hostd/grouping) is named by its path after the last contract.d/, as
// install-contract-dir.sh --domain names it: `--with-domain <tree>/contract.d/owned/nested` is the domain owned/nested,
// its $id .../contract/owned/nested, its document nested.json; never the directory's basename.
test('render --with-domain names a nested domain by its path after the last contract.d/', () => {
  const t = join(SCRATCH, `nested-${n++}`);
  const doc = domain('owned/nested', 'The nested words of the owner', {
    OWNED_NESTED_MODES: { description: 'The modes.', 'x-since': '1.0.0', 'x-kind': 'words', 'x-file': 'nested.json', oneOf: [{ const: 'one', title: 'one', description: 'One.', 'x-code': 0 }] },
  });
  mkdirSync(join(t, 'contract.d/owned/nested'), { recursive: true });
  writeFileSync(join(t, 'contract.d/owned/nested/nested.json'), `${JSON.stringify(doc, null, 2)}\n`);
  const root = contractDir();
  const out = join(SCRATCH, `out-${n++}`);
  const r = cli('render', '--target', 'c', '--out', out, '--contract-dir', root, '--package', 'omx-owned', '--with-domain', join(t, 'contract.d/owned/nested'));
  assert.equal(r.status, 0, r.stderr);
  assert.match(readFileSync(join(out, 'omx_owned_vocabulary.h'), 'utf8'), /OWNED_NESTED_MODES \(contract\.d\/owned\/nested\/nested\.json\)/);
});
