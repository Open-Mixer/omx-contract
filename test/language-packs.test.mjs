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
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { ROOT, scratchDir } from './helpers.mjs';
import * as cat from '../lib/catalog.mjs';
import { loadData, resolveData } from '../lib/data.mjs';
import { validate } from '../lib/schema-validate.mjs';
import { toMake } from '../lib/translate.mjs';

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
  assert.ok(ok(catalog('es', { [CODE]: { text: 'Bytes.', by: 'same', source: sha('Bytes.') } })).ok, 'by: same is a sentence kept identical to English, with its source hash');
  assert.ok(!ok(catalog('es', { [CODE]: { text: 'Bytes.', by: 'same' } })).ok, 'by: same records its source hash');
  assert.ok(!ok(catalog('es', { [CODE]: { text: 'Bytes.', by: 'same', source: sha('Bytes.'), model: 'm' } })).ok, 'by: same carries no model');
  assert.ok(ok(catalog('es', { [CODE]: machine('Ningún directorio en {path}') })).ok);
  assert.ok(!ok(catalog('es', { [CODE]: { text: 'x', by: 'machine', source: sha(SRC) } })).ok, 'a model\'s entry names its model');
  assert.ok(!ok(catalog('es', { [CODE]: { text: 'x', by: 'machine', model: 'm' } })).ok, 'a model\'s entry records its source hash');
  assert.ok(!ok(catalog('es', { [CODE]: { text: 'x', by: 'machine', model: 'm', source: 'abc' } })).ok, 'the hash is 64 hex');
  assert.ok(!ok(catalog('es', { [CODE]: { text: 'x', by: 'someone' } })).ok, 'by is human, same or machine');
  assert.ok(!ok(catalog('es', { [CODE]: { text: '', by: 'human' } })).ok, 'a text is never empty');
  assert.ok(!ok(catalog('es', { [CODE]: { text: 'x', by: 'human', extra: 1 } })).ok, 'nothing else');
});

test('a model\'s entry with a placeholder that is not one of its args is red, as a sentence is', () => {
  const p = catalogProblems('catalogs/es.json', catalog('es', { [CODE]: machine('Ningún directorio en {ruta}') }), KEYS);
  assert.deepEqual(p.map((x) => x.rule), ['catalog-placeholders']);
});

test('the TS reader: a stale model entry is skipped (the source sentence shows); a current one and a person\'s are read', () => {
  const root = scratchDir('omx-langpack-');
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
  write({ [CODE]: { text: 'Bytes.', by: 'same', source: sha('Bytes.') } });
  assert.equal(sentenceOf(loadCatalog('omx-contract', 'es', root), CODE, 'Bytes.'), 'Bytes.', 'a same entry is read');
  assert.equal(sentenceOf(loadCatalog('omx-contract', 'es', root), CODE, 'Octets.'), 'Octets.', 'a same entry whose source changed is stale');
  assert.equal(toMake(new Map([[CODE, { en: 'Octets.', args: [] }]]), loadCatalog('omx-contract', 'es', root)).size, 0, 'translate keeps a same entry, never regenerates it');
});

test('the Python reader skips a stale model entry the same way, and reads a person\'s', { skip: spawnSync('python3', ['--version']).status !== 0 && 'no python3' }, () => {
  const root = scratchDir('omx-langpack-py-');
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

/**
 * A chat/completions endpoint that translates by prefixing `[<lang>] `, breaking `breakKey`'s placeholders; with
 * `garbleOver`, a batch of more entries than that is answered with text that is no JSON (a cut-off answer).
 */
async function fakeEndpoint({ breakKey, breakOver, garbleOver, dropOver, router, group, fellBack } = {}) {
  const seen = [];
  const server = createServer((req, res) => {
    // a LiteLLM router's own settings and model groups, when this endpoint plays one; else none (a plain server)
    if (req.method === 'GET') {
      const answer = router && { '/router/settings': { current_values: { fallbacks: router.fallbacks } }, '/model_group/info': { data: router.groups } }[req.url];
      res.writeHead(answer ? 200 : 404, { 'content-type': 'application/json' });
      res.end(JSON.stringify(answer ?? { detail: 'Not Found' }));
      return;
    }
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      const request = JSON.parse(body);
      seen.push({ auth: req.headers.authorization, path: req.url, model: request.model });
      const content = request.messages.at(-1).content;
      const payload = JSON.parse(content.slice(content.indexOf('\n{') + 1));
      const out = {};
      seen.at(-1).size = Object.keys(payload.entries).length;
      seen.at(-1).maxTokens = request.max_tokens;
      if (garbleOver !== undefined && seen.at(-1).size > garbleOver) {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ model: 'served-model-1', choices: [{ message: { role: 'assistant', content: '{"cut off' } }] }));
        return;
      }
      for (const [i, [key, e]] of Object.entries(payload.entries).entries()) if (dropOver === undefined || seen.at(-1).size <= dropOver || i % 2 === 0) out[key] = key === breakKey && (breakOver === undefined || seen.at(-1).size > breakOver) ? `[${payload.lang}] ${e.text.replace(/\{(\w+)\}/g, '{$1_x}')}` : `[${payload.lang}] ${e.text}`;
      res.writeHead(200, { 'content-type': 'application/json', ...(group ? { 'x-litellm-model-group': group } : {}), ...(fellBack ? { 'x-litellm-attempted-fallbacks': '1', 'x-litellm-model-group': fellBack } : {}) });
      res.end(JSON.stringify({ model: 'served-model-1', choices: [{ message: { role: 'assistant', content: JSON.stringify(out) } }] }));
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${server.address().port}`, seen, close: () => new Promise((r) => server.close(r)) };
}

/** A copy of this tree's data/ and catalogs/ to run translate over. */
function ownerTree() {
  const dir = scratchDir('omx-translate-');
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

test('translate splits a batch whose answer does not parse (a cut-off answer) and asks again, so no entry is lost', async () => {
  const dir = ownerTree();
  const ep = await fakeEndpoint({ garbleOver: 5 });
  try {
    const r = await run(['translate', '--owner', dir, '--lang', 'es', '--package', 'omx-contract', '--batch', '40'], { OMX_TRANSLATE_URL: ep.url, OMX_TRANSLATE_MODEL: 'mid-dense' });
    assert.equal(r.status, 0, r.stderr);
    const es = JSON.parse(readFileSync(join(dir, 'catalogs', 'es.json'), 'utf8'));
    assert.equal(es.messages[CODE].text, `[es] ${sourceOf(dir, CODE)}`);
    assert.ok(ep.seen.some((s) => s.size > 5) && ep.seen.some((s) => s.size <= 5), 'a large batch was tried, then halves');
    assert.ok(ep.seen.every((s) => s.maxTokens >= 4096), 'the answer has room: max_tokens asked');
  } finally { await ep.close(); }
});

test('translate asks again for the keys a parsed answer leaves out, in halves, so no entry is lost', async () => {
  const dir = ownerTree();
  const ep = await fakeEndpoint({ dropOver: 5 });
  try {
    const r = await run(['translate', '--owner', dir, '--lang', 'es', '--package', 'omx-contract', '--batch', '40'], { OMX_TRANSLATE_URL: ep.url, OMX_TRANSLATE_MODEL: 'mid-dense' });
    assert.equal(r.status, 0, r.stderr);
    const check = await run(['translate', '--check', '--owner', dir, '--lang', 'es', '--package', 'omx-contract']);
    assert.equal(check.status, 0, check.stderr);
  } finally { await ep.close(); }
});

test('translate asks again, in halves, for the keys the placeholder gate refuses, so a batch the model garbles converges', async () => {
  const dir = ownerTree();
  const ep = await fakeEndpoint({ breakKey: CODE, breakOver: 1 });
  try {
    const r = await run(['translate', '--owner', dir, '--lang', 'es', '--package', 'omx-contract', '--batch', '20'], { OMX_TRANSLATE_URL: ep.url, OMX_TRANSLATE_MODEL: 'mid-dense' });
    assert.equal(r.status, 0, r.stderr);
    const es = JSON.parse(readFileSync(join(dir, 'catalogs', 'es.json'), 'utf8'));
    assert.equal(es.messages[CODE].text, `[es] ${sourceOf(dir, CODE)}`, 'asked alone, the key passes the gate');
    assert.ok(ep.seen.some((s) => s.size === 1), 'the refused key was asked again on its own');
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
  // a build never translates: no make target, no spec build section, no deb rule runs it
  const spec = readFileSync(join(ROOT, 'packaging/omx-contract.spec'), 'utf8');
  const build = ['%build', '%install', '%check'].map((s) => spec.split(`\n${s}\n`)[1]?.split('\n%')[0] ?? '').join('\n');
  assert.ok(build.includes('make'), 'positive control: the spec build sections are read');
  for (const [f, text] of [['Makefile', readFileSync(join(ROOT, 'Makefile'), 'utf8')], ['the spec build sections', build], ['debian/rules', readFileSync(join(ROOT, 'debian/rules'), 'utf8')]]) assert.doesNotMatch(text, /\btranslate\b/, `${f} never translates`);
});

// ---- --source: an owner's sentences from a file, for strings that are no contract data (#24) ------------------------

const SOURCE = {
  _generated: 'GENERATED by a test — a banner, no sentence.',
  'WEB_UI.common.action.save': { text: 'Save', args: [] },
  'WEB_UI.mixer.strip.name': { text: 'Strip {n}', args: ['n'] },
};

/** A surface's tree: its source file and an empty catalogs directory. */
function sourceTree() {
  const dir = scratchDir('omx-translate-source-');
  writeFileSync(join(dir, 'source.json'), JSON.stringify(SOURCE));
  mkdirSync(join(dir, 'catalogs'));
  return dir;
}
const sourceArgs = (dir, ...more) => ['translate', '--source', join(dir, 'source.json'), '--catalogs', join(dir, 'catalogs'), '--package', 'web-ui', ...more];

test('--source makes a catalog of the file\'s sentences (a banner is no sentence), each with its model and source hash', async () => {
  const dir = sourceTree();
  const ep = await fakeEndpoint();
  try {
    const r = await run(sourceArgs(dir, '--lang', 'es'), { OMX_TRANSLATE_URL: ep.url, OMX_TRANSLATE_MODEL: 'mid-dense' });
    assert.equal(r.status, 0, r.stderr);
    const es = JSON.parse(readFileSync(join(dir, 'catalogs', 'es.json'), 'utf8'));
    assert.equal(es.owner, 'web-ui');
    assert.deepEqual(Object.keys(es.messages).sort(), ['WEB_UI.common.action.save', 'WEB_UI.mixer.strip.name']);
    assert.deepEqual(es.messages['WEB_UI.mixer.strip.name'], { text: '[es] Strip {n}', by: 'machine', model: 'served-model-1', source: sha('Strip {n}') });
    const check = await run(sourceArgs(dir, '--check', '--lang', 'es'));
    assert.equal(check.status, 0, check.stderr);
  } finally { await ep.close(); }
});

test('--source keeps a person\'s entry, makes again one made from a changed sentence, and refuses a bad placeholder', async () => {
  const dir = sourceTree();
  writeFileSync(join(dir, 'catalogs', 'es.json'), JSON.stringify({ kind: 'catalog', lang: 'es', owner: 'web-ui', messages: {
    'WEB_UI.common.action.save': { text: 'Guardar', by: 'human' },
    'WEB_UI.mixer.strip.name': { text: 'Canal viejo {n}', by: 'machine', model: 'm', source: sha('Channel {n}') },
  } }));
  const ep = await fakeEndpoint();
  try {
    const r = await run(sourceArgs(dir, '--lang', 'es'), { OMX_TRANSLATE_URL: ep.url, OMX_TRANSLATE_MODEL: 'mid-dense' });
    assert.equal(r.status, 0, r.stderr);
    const es = JSON.parse(readFileSync(join(dir, 'catalogs', 'es.json'), 'utf8'));
    assert.deepEqual(es.messages['WEB_UI.common.action.save'], { text: 'Guardar', by: 'human' });
    assert.equal(es.messages['WEB_UI.mixer.strip.name'].text, '[es] Strip {n}');
  } finally { await ep.close(); }
  const bad = await fakeEndpoint({ breakKey: 'WEB_UI.mixer.strip.name' });
  try {
    const dir2 = sourceTree();
    const r = await run(sourceArgs(dir2, '--lang', 'fr'), { OMX_TRANSLATE_URL: bad.url, OMX_TRANSLATE_MODEL: 'mid-dense' });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /WEB_UI\.mixer\.strip\.name: placeholders/);
  } finally { await bad.close(); }
});

test('--source --check is red for a stale or missing entry, with no endpoint; --source and contract data are two inputs', async () => {
  const dir = sourceTree();
  writeFileSync(join(dir, 'catalogs', 'es.json'), JSON.stringify({ kind: 'catalog', lang: 'es', owner: 'web-ui', messages: {
    'WEB_UI.mixer.strip.name': { text: 'x {n}', by: 'machine', model: 'm', source: sha('Channel {n}') },
  } }));
  const check = await run(sourceArgs(dir, '--check', '--lang', 'es'));
  assert.equal(check.status, 1);
  assert.match(check.stderr, /WEB_UI\.mixer\.strip\.name: stale/);
  assert.match(check.stderr, /WEB_UI\.common\.action\.save: missing/);
  const both = await run([...sourceArgs(dir, '--check'), '--data', join(ROOT, 'data')]);
  assert.equal(both.status, 2);
  assert.match(both.stderr, /two inputs/);
});

// ---- no paid credit: a router alias whose fallback reaches a paid provider is refused ------------------------------

const ROUTER = {
  fallbacks: [{ 'big-dense': ['openrouter-big'] }, { 'mid-dense': ['mid-dense-desk'] }],
  groups: [
    { model_group: 'big-dense', providers: ['ollama'] },
    { model_group: 'openrouter-big', providers: ['openrouter'] },
    { model_group: 'mid-dense', providers: ['ollama'] },
    { model_group: 'mid-dense-desk', providers: ['ollama'] },
    { model_group: 'draft-prose', providers: ['ollama'] },
  ],
};

test('translate refuses a router alias whose fallback reaches a paid provider, before any call, unless allowed', async () => {
  const dir = ownerTree();
  const ep = await fakeEndpoint({ router: ROUTER });
  try {
    const r = await run(['translate', '--owner', dir, '--lang', 'es', '--package', 'omx-contract'], { OMX_TRANSLATE_URL: ep.url, OMX_TRANSLATE_MODEL: 'big-dense' });
    assert.equal(r.status, 2);
    assert.match(r.stderr, /big-dense.*openrouter-big.*openrouter.*OMX_TRANSLATE_ALLOW_PAID/s);
    assert.equal(ep.seen.length, 0, 'no completion was asked');
    const local = await run(['translate', '--owner', dir, '--lang', 'es', '--package', 'omx-contract'], { OMX_TRANSLATE_URL: ep.url, OMX_TRANSLATE_MODEL: 'mid-dense' });
    assert.equal(local.status, 0, local.stderr);
    const allowed = await run(['translate', '--owner', dir, '--lang', 'fr', '--package', 'omx-contract'], { OMX_TRANSLATE_URL: ep.url, OMX_TRANSLATE_MODEL: 'big-dense', OMX_TRANSLATE_ALLOW_PAID: '1' });
    assert.equal(allowed.status, 0, allowed.stderr);
  } finally { await ep.close(); }
});

test('the provenance names the model group the router answered with, from its header', async () => {
  const dir = ownerTree();
  const ep = await fakeEndpoint({ router: ROUTER, group: 'draft-prose' });
  try {
    const r = await run(['translate', '--owner', dir, '--lang', 'es', '--package', 'omx-contract'], { OMX_TRANSLATE_URL: ep.url, OMX_TRANSLATE_MODEL: 'draft-prose' });
    assert.equal(r.status, 0, r.stderr);
    const es = JSON.parse(readFileSync(join(dir, 'catalogs', 'es.json'), 'utf8'));
    assert.equal(es.messages[CODE].model, 'draft-prose');
  } finally { await ep.close(); }
});

test('a batch the router answered through a fallback to a paid group is refused, and the run is red', async () => {
  const dir = ownerTree();
  const ep = await fakeEndpoint({ router: ROUTER, fellBack: 'openrouter-big' });
  try {
    const r = await run(['translate', '--owner', dir, '--lang', 'es', '--package', 'omx-contract', '--batch', '400'], { OMX_TRANSLATE_URL: ep.url, OMX_TRANSLATE_MODEL: 'mid-dense' });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /fell back to openrouter-big/);
    const es = JSON.parse(readFileSync(join(dir, 'catalogs', 'es.json'), 'utf8'));
    assert.deepEqual(es.messages, {}, 'nothing a paid group answered is written');
  } finally { await ep.close(); }
});

// ---- installed: the CLI finds the language list where the data package installs it ----------------------------------

test('installed, translate --check reads languages.json from the data package\'s place, not from the CLI\'s tree', () => {
  const stage = scratchDir('omx-contract-installed-');
  const make = (target, ...more) => spawnSync('make', [...(Array.isArray(target) ? target : [target]), ...more, 'PREFIX=/usr', `DESTDIR=${stage}`], { cwd: ROOT, encoding: 'utf8' });
  // install-cli builds lib/ first. A lib/ no older than its sources must stay as it is: tsc rewriting lib/*.mjs in place
  // while the suite's other files load them failed "does not provide an export" under `node --test` (omx-contract#39).
  assert.equal(make(['-q', 'build-lib']).status, 0, 'precondition: lib/ is built from the current sources (npm run build)');
  const libStamp = () => Object.fromEntries(readdirSync(join(ROOT, 'lib')).map((f) => [f, statSync(join(ROOT, 'lib', f)).mtimeMs]));
  const libBefore = libStamp();
  for (const t of ['install', 'install-cli']) assert.equal(make(t).status, 0, `make ${t}`);
  assert.deepEqual(libStamp(), libBefore, 'make install-cli left lib/ as it was: a fresh lib/ is not rebuilt in place');
  const cli = join(stage, 'usr/lib/omx-contract/bin/omx-contract.mjs');
  assert.ok(!readdirSync(join(stage, 'usr/lib/omx-contract')).includes('share'), 'positive control: the CLI\'s tree carries no share/');
  const env = { ...process.env };
  delete env.OMX_CONTRACT_DATADIR;
  const r = spawnSync(process.execPath, [cli, 'translate', '--check', '--owner', ROOT], { cwd: stage, env, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.match(r.stdout, /6 languages \(ca, es, fr, de, it, pt\)/);
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
