// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// V29: the hosts a verb's implementedBy names are omx-clap's hosting words, HOSTING_VERB_HOSTS of its
// data/hosting/verb-hosts.json, installed as 3/omx-clap/hosting/verb-hosts.json. omx-contract's verbs validator
// (contract.verb.host-unknown) and its verbs render read them from the read only: a read with verbs and no such item
// is refused by name, and omx-contract ships no host list of its own. The fixture
// (test/fixtures/hosting-verb-hosts/hosting/verb-hosts.json) is omx-clap's file byte for byte; omx-contract
// neither builds nor tests against omx-clap itself.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { CONTRACT_CODES, ContractRefusal } from '../lib/codes.mjs';
import { SCHEMA_MAJOR, loadContractDir } from '../lib/contract-dir.mjs';
import { loadData, packageVersion, resolveData } from '../lib/data.mjs';
import { validateData } from '../lib/validate.mjs';
import { renderC } from '../render/c.mjs';
import { renderVerbsHeader } from '../render/verbs.mjs';
import { DATA, installParamDomain, resolvedOf, ROOT, texts, VERB_HOSTS_FIXTURE } from './helpers.mjs';

const SCRATCH = mkdtempSync(join(tmpdir(), 'omx-contract-verb-hosts-'));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));
let n = 0;
const VERBS = join(ROOT, 'test/fixtures/package-verbs');
const HOSTING = VERB_HOSTS_FIXTURE;
const ITEM = 'HOSTING_VERB_HOSTS';
const GOLDEN = join(ROOT, 'test/golden/verbs/omx_host_verbs.h');

const HOSTS = ['plugin-hostd', 'omx-clap-host', 'mod-host'];
/** The items of a data file `doc` that list the verb hosts: a words item holding the three host words. */
const hostListsOf = (doc) => Object.entries(doc).filter(([, it]) => it?.kind === 'words'
  && HOSTS.every((h) => Object.values(it.words ?? {}).some((w) => w.word === h))).map(([n]) => n);

const sh = (...a) => execFileSync('sh', [join(ROOT, 'tools/install-contract-dir.sh'), ...a], { stdio: 'ignore' });

/** A contract directory: omx-contract's data/ and param domain, the verbs fixture, and with `hosting` omx-clap's hosting files. */
function dir(hosting) {
  const root = join(SCRATCH, `cd-${n++}`);
  sh('-x', 'scale-vectors.json', 'omx-contract', packageVersion(ROOT), String(SCHEMA_MAJOR), DATA, root, 'data');
  installParamDomain(root);
  sh('verbs-fixture', '1.0.0', String(SCHEMA_MAJOR), VERBS, root, 'data');
  if (hosting) sh('omx-clap', '0.34.0', String(SCHEMA_MAJOR), hosting, root, 'data');
  return root;
}

/** A copy of the hosting fixture with `edit(item)` applied to its HOSTING_VERB_HOSTS. */
function hostingWith(edit) {
  const d = join(SCRATCH, `hosting-${n++}`);
  cpSync(HOSTING, d, { recursive: true });
  const f = join(d, 'hosting/verb-hosts.json');
  const doc = JSON.parse(readFileSync(f, 'utf8'));
  edit(doc[ITEM]);
  writeFileSync(f, `${JSON.stringify(doc, null, 2)}\n`);
  return d;
}

function refusal(root) {
  try {
    loadContractDir({ dir: root });
  } catch (e) {
    assert.ok(e instanceof ContractRefusal, `a refusal, not ${e.message}`);
    return e;
  }
  assert.fail('the read was not refused');
}

test('the fixture is omx-clap\'s hosting/verb-hosts.json: the item HOSTING_VERB_HOSTS, its three host words', () => {
  const doc = JSON.parse(readFileSync(join(HOSTING, 'hosting/verb-hosts.json'), 'utf8'));
  assert.deepEqual(Object.keys(doc).filter((k) => /^[A-Z]/.test(k)), [ITEM]);
  assert.equal(doc[ITEM].kind, 'words');
  assert.deepEqual(Object.values(doc[ITEM].words).map((w) => w.word), ['plugin-hostd', 'omx-clap-host', 'mod-host']);
});

test('a contract directory with verbs and no HOSTING_VERB_HOSTS is refused by name (contract.verb.host-unknown), with no fallback', () => {
  const e = refusal(dir());
  assert.equal(e.code, CONTRACT_CODES.verbHostUnknown);
  assert.match(e.message, /HOSTING_VERB_HOSTS/);
});

test('validate refuses a data directory with verbs and no HOSTING_VERB_HOSTS, under rule verb-host', () => {
  const t = texts((docs) => { for (const rel of Object.keys(docs)) if (hostListsOf(docs[rel]).length) delete docs[rel]; });
  t['data/fixture-host-verbs.json'] = readFileSync(join(VERBS, 'host-verbs.json'), 'utf8');
  t['data/fixture-errors.json'] = readFileSync(join(VERBS, 'errors.json'), 'utf8');
  const probs = validateData(loadData(null, t)).filter((p) => p.rule === 'verb-host');
  assert.ok(probs.length >= 1, 'refused');
  assert.ok(probs.every((p) => /HOSTING_VERB_HOSTS/.test(p.message)), probs.map((p) => p.message).join('\n'));
});

test('the verbs render refuses by name a read with verbs and no HOSTING_VERB_HOSTS: it reads no host list of its own', () => {
  const t = texts((docs) => { for (const rel of Object.keys(docs)) if (hostListsOf(docs[rel]).length) delete docs[rel]; });
  t['data/fixture-host-verbs.json'] = readFileSync(join(VERBS, 'host-verbs.json'), 'utf8');
  t['data/fixture-errors.json'] = readFileSync(join(VERBS, 'errors.json'), 'utf8');
  assert.throws(() => renderVerbsHeader(resolvedOf(t)), /HOSTING_VERB_HOSTS/);
});

test('the fixture read takes the hosts from omx-clap\'s item and renders the committed omx_host_verbs.h', () => {
  const root = dir(HOSTING);
  assert.ok(existsSync(join(root, String(SCHEMA_MAJOR), 'omx-clap/hosting/verb-hosts.json')), 'installed as 3/omx-clap/hosting/verb-hosts.json');
  const data = loadContractDir({ dir: root });
  assert.equal(data.items.get(ITEM).pkg, 'omx-clap');
  const whole = renderC(resolveData(data)).find((f) => f.path === 'omxcontract/omx_host_verbs.h');
  assert.equal(whole.text, readFileSync(GOLDEN, 'utf8'));
});

test('contract.verb.host-unknown reads the item: a host the item drops is refused, a host it adds is not', () => {
  const dropped = refusal(dir(hostingWith((it) => { delete it.words.modHost; })));
  assert.equal(dropped.code, CONTRACT_CODES.verbHostUnknown);
  assert.match(dropped.message, /implementedBy names mod-host, which is no word of HOSTING_VERB_HOSTS \(plugin-hostd, omx-clap-host\)/);
  const added = hostingWith((it) => { it.words.jalv = { ...it.words.modHost, word: 'jalv' }; });
  assert.doesNotThrow(() => loadContractDir({ dir: dir(added) }));
});

test('omx-contract ships no host list: no item of data/ lists the verb hosts, and data/verbs.json is gone', () => {
  assert.ok(!existsSync(join(DATA, 'verbs.json')), 'data/verbs.json');
  assert.deepEqual(loadData(DATA).files.flatMap((f) => hostListsOf(JSON.parse(f.text)).map((n) => `${f.rel}: ${n}`)), []);
  assert.deepEqual(hostListsOf(JSON.parse(readFileSync(join(HOSTING, 'hosting/verb-hosts.json'), 'utf8'))), [ITEM], 'positive control: the fixture\'s item is one');
  assert.ok(!loadData(DATA).items.has(ITEM), 'the item is omx-clap\'s, never omx-contract\'s');
});
