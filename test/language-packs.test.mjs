// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// Language packs (omx-contract#21, docs/data-layout.md "Catalogs" and "Language packs"): a catalog entry carries how it
// was made (by a person, or by a model from a source sentence whose hash it records); both readers skip an entry whose
// source sentence has changed since; `omx-contract translate` fills and refreshes the machine entries of a listed
// language through an OpenAI-compatible endpoint, behind the placeholder gate, and never touches a person's entry;
// share/omx-contract/languages.json lists the languages, and the packaging builds one pack per language.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { ROOT } from './helpers.mjs';
import * as cat from '../lib/catalog.mjs';
import { loadData, resolveData } from '../lib/data.mjs';
import { validate } from '../lib/schema-validate.mjs';

const CLI = join(ROOT, 'bin', 'omx-contract.mjs');
const SCHEMA = JSON.parse(readFileSync(join(ROOT, 'schema/omx-contract.schema.json'), 'utf8'));
const against = (def) => (doc) => validate({ $schema: SCHEMA.$schema, $defs: SCHEMA.$defs, $ref: `#/$defs/${def}` }, doc);
const languages = () => JSON.parse(readFileSync(join(ROOT, 'share/omx-contract/languages.json'), 'utf8'));
const listed = () => languages().languages;
const { catalogPathOf, catalogProblems, loadCatalog, sentenceOf } = cat;
const sourceHash = (s) => cat.sourceHash(s);

const CODE = 'contract.dir.absent';
const SRC = 'No contract directory at {path}';
const KEYS = new Map([[CODE, { args: ['path'], en: SRC }]]);
const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');
const catalog = (lang, messages) => ({ kind: 'catalog', lang, owner: 'omx-contract', messages });
const machine = (text, source = SRC) => ({ text, by: 'machine', model: 'test-model', source: sha(source) });

test('sourceHash is the sha256 of the source sentence, in lowercase hex', () => {
  assert.equal(sourceHash(SRC), sha(SRC));
  assert.match(sourceHash(''), /^[0-9a-f]{64}$/);
});

test('the catalog schema: an entry is a sentence, a person\'s entry, or a model\'s entry with its model and source hash', () => {
  const ok = against('catalog');
  assert.ok(ok(catalog('es', { [CODE]: 'Ningún directorio de contrato en {path}' })).ok, 'a plain sentence stays valid (by a person) for one minor');
  assert.ok(ok(catalog('es', { [CODE]: { text: 'Ningún directorio en {path}', by: 'human' } })).ok);
  assert.ok(ok(catalog('es', { [CODE]: machine('Ningún directorio en {path}') })).ok);
  assert.ok(!ok(catalog('es', { [CODE]: { text: 'x', by: 'machine', source: sha(SRC) } })).ok, 'a model\'s entry names its model');
  assert.ok(!ok(catalog('es', { [CODE]: { text: 'x', by: 'machine', model: 'm' } })).ok, 'a model\'s entry records its source hash');
  assert.ok(!ok(catalog('es', { [CODE]: { text: 'x', by: 'machine', model: 'm', source: 'abc' } })).ok, 'the hash is 64 hex');
  assert.ok(!ok(catalog('es', { [CODE]: { text: 'x', by: 'someone' } })).ok, 'by is human or machine');
  assert.ok(!ok(catalog('es', { [CODE]: { text: '', by: 'human' } })).ok, 'a text is never empty');
  assert.ok(!ok(catalog('es', { [CODE]: { text: 'x', by: 'human', extra: 1 } })).ok, 'nothing else');
});

test('a model\'s entry with a placeholder that is not one of its args is red, as a sentence is', () => {
  const p = catalogProblems('catalogs/es.json', catalog('es', { [CODE]: machine('Ningún directorio en {ruta}') }), KEYS);
  assert.deepEqual(p.map((x) => x.rule), ['catalog-placeholders']);
});

test('the TS reader: a stale model entry is skipped (the source sentence shows); a current one and a person\'s are read', () => {
  const root = mkdtempSync(join(tmpdir(), 'omx-langpack-'));
  mkdirSync(join(root, 'omx-contract', 'catalogs'), { recursive: true });
  const write = (messages) => writeFileSync(catalogPathOf('omx-contract', 'es', root), JSON.stringify(catalog('es', messages)));
  write({ [CODE]: machine('Ningún directorio en {path}') });
  assert.equal(sentenceOf(loadCatalog('omx-contract', 'es', root), CODE, SRC), 'Ningún directorio en {path}');
  write({ [CODE]: machine('Ningún directorio en {path}', 'No contract dir at {path}') });
  assert.equal(sentenceOf(loadCatalog('omx-contract', 'es', root), CODE, SRC), SRC, 'the source changed since: stale, skipped');
  write({ [CODE]: { text: 'Ningún directorio en {path}', by: 'human' } });
  assert.equal(sentenceOf(loadCatalog('omx-contract', 'es', root), CODE, SRC), 'Ningún directorio en {path}');
  write({ [CODE]: 'Ningún directorio en {path}' });
  assert.equal(sentenceOf(loadCatalog('omx-contract', 'es', root), CODE, SRC), 'Ningún directorio en {path}');
});

test('the Python reader skips a stale model entry the same way, and reads a person\'s', { skip: spawnSync('python3', ['--version']).status !== 0 && 'no python3' }, () => {
  const root = mkdtempSync(join(tmpdir(), 'omx-langpack-py-'));
  mkdirSync(join(root, 'omx-contract', 'catalogs'), { recursive: true });
  writeFileSync(catalogPathOf('omx-contract', 'es', root), JSON.stringify(catalog('es', {
    [CODE]: machine('Ningún directorio en {path}', 'No contract dir at {path}'),
    'contract.dir.manifest-absent': machine('{package} no tiene MANIFEST.json', '{package} holds no MANIFEST.json'),
    'contract.dir.version-mismatch': { text: 'Versión distinta', by: 'human' },
  })));
  const mod = join(ROOT, 'share/omx-contract/omx_contract_catalog.py');
  const r = spawnSync('python3', ['-I', '-c', `import runpy
m = runpy.run_path(${JSON.stringify(mod)})
es = m["load_catalog"]("omx-contract", "es", ${JSON.stringify(root)})
print(m["sentence_of"](es, "contract.dir.absent", ${JSON.stringify(SRC)}))
print(m["sentence_of"](es, "contract.dir.manifest-absent", "{package} holds no MANIFEST.json"))
print(m["sentence_of"](es, "contract.dir.version-mismatch", "Another version"))
print(m["source_hash"](${JSON.stringify(SRC)}))
`], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(r.stdout.trim().split('\n'), [SRC, '{package} no tiene MANIFEST.json', 'Versión distinta', sha(SRC)]);
});

test('languages.json: the shipped set made by translate, a non-Latin and a right-to-left test pair never shipped, en never', () => {
  const doc = languages();
  assert.ok(against('languages')(doc).ok, 'the list validates against $defs/languages');
  assert.deepEqual(doc.languages, ['ca', 'es', 'fr', 'de', 'it', 'pt']);
  assert.deepEqual(doc.test, ['ja', 'ar']);
  assert.ok(![...doc.languages, ...doc.test].includes('en'));
  assert.ok(!against('languages')({ ...doc, languages: ['ca', 'ca'] }).ok, 'a language once');
  assert.ok(!against('languages')({ ...doc, languages: [{ lang: 'ca', by: 'human' }] }).ok, 'a language is its tag');
  for (const lang of doc.test) assert.ok(!readdirSync(join(ROOT, 'catalogs')).includes(`${lang}.json`), `${lang} is not shipped`);
});

test('this tree is release-ready: translate --check finds every listed language\'s catalog whole and none stale', () => {
  const r = spawnSync(process.execPath, [CLI, 'translate', '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  for (const lang of listed()) assert.ok(readdirSync(join(ROOT, 'catalogs')).includes(`${lang}.json`), `catalogs/${lang}.json`);
});

// ---- translate, against an OpenAI-compatible endpoint stood up here ------------------------------------------------

/** A chat/completions endpoint that translates by prefixing `[<lang>] `, breaking `breakKey`'s placeholders. */
async function fakeEndpoint({ breakKey } = {}) {
  const seen = [];
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      const request = JSON.parse(body);
      seen.push({ auth: req.headers.authorization, path: req.url, model: request.model });
      const content = request.messages.at(-1).content;
      const payload = JSON.parse(content.slice(content.indexOf('\n{') + 1));
      const out = {};
      for (const [key, e] of Object.entries(payload.entries)) out[key] = key === breakKey ? `[${payload.lang}] ${e.text.replace(/\{(\w+)\}/g, '{$1_x}')}` : `[${payload.lang}] ${e.text}`;
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ model: 'served-model-1', choices: [{ message: { role: 'assistant', content: JSON.stringify(out) } }] }));
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${server.address().port}`, seen, close: () => new Promise((r) => server.close(r)) };
}

/** A copy of this tree's data/ and catalogs/ to run translate over. */
function ownerTree() {
  const dir = mkdtempSync(join(tmpdir(), 'omx-translate-'));
  cpSync(join(ROOT, 'data'), join(dir, 'data'), { recursive: true });
  mkdirSync(join(dir, 'catalogs'));
  return dir;
}

function run(args, env = {}) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [CLI, ...args], { env: { ...process.env, ...env } });
    let stdout = '';
    let stderr = '';
    p.stdout.on('data', (c) => { stdout += c; });
    p.stderr.on('data', (c) => { stderr += c; });
    p.on('close', (status) => resolve({ status, stdout, stderr }));
  });
}

/** The source sentence of `key` in the owner tree `dir`, as translate reads it (its data and data/codes.json). */
const sourceOf = (dir, key) => {
  const extra = Object.entries(JSON.parse(readFileSync(join(dir, 'data', 'codes.json'), 'utf8'))).filter(([, v]) => v && typeof v === 'object' && v.kind);
  return cat.catalogKeys(resolveData(loadData(join(dir, 'data'))), { extra }).get(key).en;
};

test('translate fills a language from the source sentences, by model, each entry with its model and source hash', async () => {
  const dir = ownerTree();
  const ep = await fakeEndpoint();
  try {
    const r = await run(['translate', '--owner', dir, '--lang', 'es', '--package', 'omx-contract'], { OMX_TRANSLATE_URL: ep.url, OMX_TRANSLATE_KEY: 'k', OMX_TRANSLATE_MODEL: 'mid-dense' });
    assert.equal(r.status, 0, r.stderr);
    const es = JSON.parse(readFileSync(join(dir, 'catalogs', 'es.json'), 'utf8'));
    assert.equal(es.owner, 'omx-contract');
    const e = es.messages[CODE];
    assert.deepEqual(e, { text: `[es] ${sourceOf(dir, CODE)}`, by: 'machine', model: 'served-model-1', source: sha(sourceOf(dir, CODE)) });
    assert.ok(ep.seen.length >= 1 && ep.seen.every((s) => s.auth === 'Bearer k' && s.path === '/v1/chat/completions' && s.model === 'mid-dense'));
    const check = await run(['translate', '--check', '--owner', dir, '--lang', 'es', '--package', 'omx-contract']);
    assert.equal(check.status, 0, check.stderr);
  } finally { await ep.close(); }
});

test('translate refuses an entry whose placeholders are not its args, writes the rest, and the run is red', async () => {
  const dir = ownerTree();
  const ep = await fakeEndpoint({ breakKey: CODE });
  try {
    const r = await run(['translate', '--owner', dir, '--lang', 'es', '--package', 'omx-contract'], { OMX_TRANSLATE_URL: ep.url, OMX_TRANSLATE_MODEL: 'mid-dense' });
    assert.equal(r.status, 1);
    assert.match(r.stderr, new RegExp(`${CODE.replace(/\./g, '\\.')}: .*placeholder`));
    const es = JSON.parse(readFileSync(join(dir, 'catalogs', 'es.json'), 'utf8'));
    assert.equal(es.messages[CODE], undefined, 'the refused entry is not written');
    assert.ok(Object.keys(es.messages).length > 10, 'the others are');
  } finally { await ep.close(); }
});

test('translate never overwrites a person\'s entry, and refreshes a stale model entry', async () => {
  const dir = ownerTree();
  const src = sourceOf(dir, CODE);
  const other = 'contract.manifest.absent';
  writeFileSync(join(dir, 'catalogs', 'es.json'), JSON.stringify(catalog('es', {
    [CODE]: { text: 'Ningún directorio de contrato en {path}', by: 'human' },
    [other]: { text: 'viejo', by: 'machine', model: 'old', source: sha('an older source sentence') },
  })));
  const ep = await fakeEndpoint();
  try {
    const r = await run(['translate', '--owner', dir, '--lang', 'es'], { OMX_TRANSLATE_URL: ep.url, OMX_TRANSLATE_MODEL: 'mid-dense' });
    assert.equal(r.status, 0, r.stderr);
    const es = JSON.parse(readFileSync(join(dir, 'catalogs', 'es.json'), 'utf8'));
    assert.deepEqual(es.messages[CODE], { text: 'Ningún directorio de contrato en {path}', by: 'human' });
    assert.equal(es.messages[other].text, `[es] ${sourceOf(dir, other)}`);
    assert.equal(es.messages[other].source, sha(sourceOf(dir, other)));
    assert.ok(src);
  } finally { await ep.close(); }
});

test('translate --check is red for a stale model entry and for a listed language with no catalog, with no endpoint', async () => {
  const dir = ownerTree();
  writeFileSync(join(dir, 'catalogs', 'es.json'), JSON.stringify(catalog('es', { [CODE]: machine('x {path}', 'an older source sentence') })));
  const stale = await run(['translate', '--check', '--owner', dir, '--lang', 'es', '--package', 'omx-contract']);
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /stale/);
  const missing = await run(['translate', '--check', '--owner', dir, '--package', 'omx-contract']);
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /catalogs\/fr\.json/);
});

test('translate refuses to run inside a package build (no network, reproducible), and names no endpoint by default', async () => {
  const dir = ownerTree();
  for (const env of [{ RPM_BUILD_ROOT: '/tmp/x' }, { DEB_HOST_ARCH: 'amd64' }]) {
    const r = await run(['translate', '--owner', dir, '--lang', 'es', '--package', 'omx-contract'], { OMX_TRANSLATE_URL: 'http://127.0.0.1:9', ...env });
    assert.equal(r.status, 2);
    assert.match(r.stderr, /package build/);
  }
  const env = { ...process.env };
  delete env.OMX_TRANSLATE_URL;
  const none = spawnSync(process.execPath, [CLI, 'translate', '--owner', dir, '--lang', 'es', '--package', 'omx-contract'], { env, encoding: 'utf8' });
  assert.equal(none.status, 2);
  assert.match(none.stderr, /OMX_TRANSLATE_URL/);
  for (const f of ['Makefile', 'packaging/omx-contract.spec', 'debian/rules']) assert.doesNotMatch(readFileSync(join(ROOT, f), 'utf8'), /\btranslate\b/, `${f} never translates`);
});

// ---- the packs ------------------------------------------------------------------------------------------------------

test('the RPM spec builds one langpack per listed language, each owning its catalog and supplementing the host locale', () => {
  const spec = readFileSync(join(ROOT, 'packaging/omx-contract.spec'), 'utf8');
  for (const lang of listed()) {
    const sub = spec.split(`%package langpack-${lang}\n`)[1]?.split('\n%')[0];
    assert.ok(sub, `%package langpack-${lang}`);
    assert.match(sub, new RegExp(`^Supplements: \\(%\\{name\\}-data and langpacks-${lang}\\)$`, 'm'));
    assert.match(sub, /^Requires: %\{name\}-data = %\{version\}-%\{release\}$/m);
    assert.match(spec, new RegExp(`%files langpack-${lang}\\n%\\{_datadir\\}/omx-contract/catalogs/${lang}\\.json\\n`));
  }
  assert.doesNotMatch(spec, /^%\{_datadir\}\/omx-contract\/catalogs\/$/m, 'the data package owns the directory, not the catalogs');
  assert.match(spec, /^%dir %\{_datadir\}\/omx-contract\/catalogs$/m);
});

test('the deb control builds one l10n package per listed language, each installing its catalog', () => {
  const control = readFileSync(join(ROOT, 'debian/control'), 'utf8');
  for (const lang of listed()) {
    const stanza = control.split('\n\n').find((s) => s.startsWith(`Package: omx-contract-l10n-${lang}\n`));
    assert.ok(stanza, `Package: omx-contract-l10n-${lang}`);
    assert.match(stanza, /^Depends: omx-contract-data \(= \$\{source:Version\}\), \$\{misc:Depends\}$/m);
    assert.equal(readFileSync(join(ROOT, `debian/omx-contract-l10n-${lang}.install`), 'utf8'), `usr/share/omx-contract/catalogs/${lang}.json\n`);
  }
  assert.doesNotMatch(readFileSync(join(ROOT, 'debian/omx-contract-data.install'), 'utf8'), /catalogs/);
});
