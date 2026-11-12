#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * omx-contract — the declarations as data, validated and rendered.
 *
 *   omx-contract validate [<input>]                            schema + semantic checks
 *   omx-contract fmt [--check] [<input>]                       the one formatting
 *   omx-contract render --target c|ts|json|lv2|py --out <dir> [--check] [<input> [--package <name>] | --sheet <fixture>]
 *   omx-contract semver <previous tag> [--report] | --from-dir <data dir> --from-version <x.y.z>
 *   omx-contract links [--check] [--root <tree>] [<input>] [--package <name>] [--at <package>=<tree>]... [--require-impl]
 *   omx-contract translate [--check] [--lang <xx>] [--owner <tree> | <input> --catalogs <dir> | --source <file> --catalogs <dir>] [--package <name>] [--model <alias>]
 *
 * <input> is `--data <dir>` (the bundled data/ by default), or a contract directory (docs/contract-dir.md):
 * `--contract-dir <dir>`, or `--installed` ($OMX_CONTRACT_PATH, else pkg-config), each with `--needs
 * <package>@'>= x.y.z'` repeatable. A refusal of the reader prints its CONTRACT_CODES code first on the line, and as
 * JSON on stdout with `--json`.
 *
 * Exit 0 is a pass, 1 a failure naming what failed, 2 a usage or environment error (never a pass).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ContractRefusal } from '../lib/codes.mjs';
import { contractVersion, loadContractDir } from '../lib/contract-dir.mjs';
import { KERNEL_SECTIONS, SIDE_FILES, TOOL_FILES, isKernelFile, kernelDocOf, loadData, packageVersion, resolveData } from '../lib/data.mjs';
import { checkLinks, linksOf, sourcesOf } from '../lib/links.mjs';
import { formatDoc } from '../lib/fmt.mjs';
import { classify, classifySchema, refusal, schemaVersionProblem } from '../lib/semver.mjs';
import { fileProblems, validateData } from '../lib/validate.mjs';
import { catalogKeys, catalogProblems } from '../lib/catalog.mjs';
import { admit, catalogText, releaseProblems, toMake } from '../lib/translate.mjs';
import { placeholdersOf } from '../lib/placeholders.mjs';
import { renderC, renderSheetC } from '../render/c.mjs';
import { renderFormatsPy } from '../render/formats.mjs';
import { renderLv2 } from '../render/hints.mjs';
import { renderJson } from '../render/json.mjs';
import { renderOwnerTs, renderTs } from '../render/ts.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

class Usage extends Error {}

function opt(argv, name) {
  const i = argv.indexOf(name);
  if (i < 0) return undefined;
  if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) throw new Usage(`${name} needs a value`);
  return argv[i + 1];
}

/** Every value of a repeatable option. */
function opts(argv, name) {
  const out = [];
  argv.forEach((a, i) => {
    if (a !== name) return;
    if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) throw new Usage(`${name} needs a value`);
    out.push(argv[i + 1]);
  });
  return out;
}

/** Whether the input is a contract directory rather than a data directory. */
const fromContractDir = (argv) => argv.includes('--installed') || argv.includes('--contract-dir');

function load(argv) {
  if (fromContractDir(argv)) {
    if (opt(argv, '--data') !== undefined) throw new Usage('--data and a contract directory are two inputs: name one');
    const needs = {};
    for (const n of opts(argv, '--needs')) {
      const m = /^([a-z][a-z0-9-]*)@(.+)$/.exec(n);
      if (!m) throw new Usage(`--needs ${n} is not <package>@'>= x.y.z'`);
      needs[m[1]] = m[2];
    }
    const dir = argv.includes('--installed') ? undefined : resolve(opt(argv, '--contract-dir'));
    return loadContractDir({ dir, needs });
  }
  const dir = resolve(opt(argv, '--data') ?? join(ROOT, 'data'));
  if (!existsSync(dir)) throw new Usage(`no data directory ${dir}`);
  return loadData(dir);
}

/** The tool's own tables at the top of a data directory (data/codes.json), as loaded files. */
function toolFiles(argv) {
  if (fromContractDir(argv)) return [];
  const dir = resolve(opt(argv, '--data') ?? join(ROOT, 'data'));
  return TOOL_FILES.filter((f) => existsSync(join(dir, f))).map((f) => {
    const text = readFileSync(join(dir, f), 'utf8');
    return { rel: relative(join(dir, '..'), join(dir, f)), text, doc: JSON.parse(text) };
  });
}

/** The owner's catalogs beside its data directory (`catalogs/<lang>.json`, lib/catalog.mjs), as loaded files. */
function catalogFiles(argv) {
  const named = opt(argv, '--catalogs');
  if (named === undefined && fromContractDir(argv)) return [];
  const dir = named !== undefined ? resolve(named) : join(resolve(opt(argv, '--data') ?? join(ROOT, 'data')), '..', 'catalogs');
  if (named !== undefined && !existsSync(dir)) throw new Usage(`no catalogs directory ${dir}`);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => {
    const text = readFileSync(join(dir, f), 'utf8');
    return { rel: relative(join(dir, '..'), join(dir, f)), doc: JSON.parse(text) };
  });
}

/** Every file under `dir`, relative to it. */
function filesUnder(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  const walk = (d) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else out.push(relative(dir, p));
    }
  };
  walk(dir);
  return out.sort();
}

function cmdValidate(argv) {
  const data = load(argv);
  const tools = toolFiles(argv);
  const problems = [...validateData(data), ...tools.flatMap(fileProblems)];
  const catalogs = problems.length ? [] : catalogFiles(argv);
  if (catalogs.length) {
    const resolved = resolveData(data);
    const extra = tools.flatMap((f) => Object.entries(f.doc).filter(([, v]) => v && typeof v === 'object' && v.kind));
    // from a contract directory, a catalog's keys are its owner's package's codes and words only
    for (const c of catalogs) problems.push(...catalogProblems(c.rel, c.doc, catalogKeys(resolved, { extra, ...(data.packages ? { owner: c.doc?.owner } : {}) })));
  }
  for (const p of problems) console.error(`${p.file}: ${p.item}: ${p.rule}: ${p.message}`);
  if (problems.length) return 1;
  const where = data.packages ? ` from ${data.packages.size} packages of ${data.roots.join(':')}` : '';
  console.log(`omx-contract validate: ${data.items.size} items in ${data.files.length} files${where}, valid${tools.length ? ` (and ${tools.map((f) => f.rel).join(', ')})` : ''}${catalogs.length ? `, ${catalogs.length} catalog${catalogs.length === 1 ? '' : 's'}` : ''}`);
  return 0;
}

function cmdFmt(argv) {
  const check = argv.includes('--check');
  if (fromContractDir(argv) && !check) throw new Usage('fmt writes a tree, never an installed contract directory: add --check');
  const dir = resolve(opt(argv, '--data') ?? join(ROOT, 'data'));
  const data = load(argv);
  const files = [...data.files, ...toolFiles(argv)];
  let bad = 0;
  for (const f of files) {
    const want = formatDoc(f.doc);
    if (want === f.text) continue;
    const name = f.pkg ? `${f.pkg}: ${f.rel}` : f.rel;
    if (check) { console.error(`omx-contract fmt --check: ${name} is not in the one formatting`); bad++; } else writeFileSync(join(dir, '..', f.rel), want);
  }
  if (bad) return 1;
  console.log(`omx-contract fmt${check ? ' --check' : ''}: ${files.length} files formatted`);
  return 0;
}

export function renderTarget(target, argv) {
  const sheet = opt(argv, '--sheet');
  if (sheet) {
    if (target !== 'c') throw new Usage('--sheet renders the c target only');
    return renderSheetC(JSON.parse(readFileSync(resolve(sheet), 'utf8')));
  }
  const data = load(argv);
  const resolved = resolveData(data);
  const pkg = opt(argv, '--package');
  if (pkg !== undefined) {
    // An owner renders its own, framed by its files' render words: from a contract directory that package's files,
    // from a data directory (the owner's tree) every file.
    if (data.packages && !data.packages.has(pkg)) throw new Usage(`no package ${pkg} is installed`);
    const files = data.files.filter((f) => (f.pkg ?? pkg) === pkg);
    if (target === 'c') return renderC(resolved, { pkg });
    if (target === 'ts') return renderOwnerTs(resolved, pkg, files);
    throw new Usage('the json, lv2 and py renders are the whole read, named @openmixer/omx-contract: --package renders c and ts');
  }
  if (target === 'c') return renderC(resolved);
  if (target === 'ts') return renderTs(resolved);
  if (target === 'json') return renderJson(resolved, contractVersion(data, packageVersion(ROOT)));
  if (target === 'lv2') return renderLv2(resolved);
  if (target === 'py') {
    const py = renderFormatsPy(resolved);
    return py === undefined ? [] : [{ path: 'omx_contract.py', text: py }];
  }
  throw new Usage(`unknown target ${target} (c, ts, json, lv2, py)`);
}

function cmdRender(argv) {
  const target = opt(argv, '--target');
  const out = opt(argv, '--out');
  if (!target || !out) throw new Usage('render needs --target <c|ts|json|lv2|py> and --out <dir>');
  const files = renderTarget(target, argv);
  const dir = resolve(out);
  if (argv.includes('--check')) {
    const bad = [];
    for (const f of files) {
      const p = join(dir, f.path);
      if (!existsSync(p)) bad.push(`${f.path} is missing`);
      else if (readFileSync(p, 'utf8') !== f.text) bad.push(`${f.path} differs`);
    }
    // An owner's header sits in its own tree among files the render does not write: only the whole render owns its directory.
    const scope = target === 'c' ? 'omxcontract' : '';
    const named = new Set(files.map((f) => f.path));
    // include/omxcontract/ also holds the hand-written C of the package (not rendered), which the npm tarball and the -devel packages ship beside the renders
    if (target === 'c') named.add('omxcontract/omx_json_write.h');
    // the json, lv2 and py renders are committed side by side (share/omx-contract/): each knows the others' files
    if (['json', 'lv2', 'py'].includes(target)) {
      for (const t of ['json', 'lv2', 'py']) for (const f of renderTarget(t, argv)) named.add(f.path);
      // share/omx-contract/ also holds the hand-written Python catalog reader (not rendered: a catalog is read, not generated), shipped beside omx_contract.py
      named.add('omx_contract_catalog.py');
      // and the language list (hand-written: the languages every owner ships a catalog of, omx-contract#21)
      named.add('languages.json');
    }
    if (opt(argv, '--package') === undefined) for (const rel of filesUnder(join(dir, scope))) if (!named.has(join(scope, rel))) bad.push(`${join(scope, rel)} is extra`);
    for (const b of bad) console.error(`omx-contract render --check: ${out.replace(/\/$/, '')}/${b}`);
    if (bad.length) return 1;
    console.log(`omx-contract render --target ${target} --check: ${files.length} files byte-identical under ${out}`);
    return 0;
  }
  for (const f of files) {
    mkdirSync(dirname(join(dir, f.path)), { recursive: true });
    writeFileSync(join(dir, f.path), f.text);
  }
  console.log(`omx-contract render --target ${target}: wrote ${files.length} files under ${out}`);
  return 0;
}

/**
 * The data of a git tag, as `{ rel: text }`. A tag released before 2.0.0 wrote its kernel files as flat item maps;
 * each is restated in the kernel-file shape (kernelDocOf, the inverse of the expansion the loader reads), so the
 * comparison is between the items the two releases declare.
 */
function dataAtTag(tag) {
  const git = (...a) => execFileSync('git', ['-C', ROOT, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  try { git('rev-parse', '--verify', `${tag}^{commit}`); } catch { throw new Usage(`no tag ${tag} in ${ROOT}`); }
  const texts = {};
  const isData = (p) => p.endsWith('.json') && ![...TOOL_FILES, ...SIDE_FILES].some((f) => p === `data/${f}`);
  for (const rel of git('ls-tree', '-r', '--name-only', tag, '--', 'data').split('\n').filter(isData)) {
    const text = git('show', `${tag}:${rel}`);
    let doc;
    try { doc = JSON.parse(text); } catch { texts[rel] = text; continue; }
    if (!isKernelFile(rel) || KERNEL_SECTIONS.some((k) => k in doc)) { texts[rel] = text; continue; }
    const { $schema, ...items } = doc;
    texts[rel] = JSON.stringify({ $schema, ...kernelDocOf(rel, Object.entries(items)) });
  }
  return texts;
}

const RANKS = { none: 0, patch: 1, minor: 2, major: 3 };

function cmdSemver(argv) {
  const fromDir = opt(argv, '--from-dir');
  const report = argv.includes('--report');
  let prev;
  let prevSchema;
  let from;
  if (fromDir) {
    from = opt(argv, '--from-version');
    if (!from) throw new Usage('--from-dir needs --from-version');
    prev = loadData(resolve(fromDir));
  } else {
    const tag = argv[1];
    if (!tag || tag.startsWith('--')) throw new Usage('semver needs the previous tag');
    from = tag;
    prev = loadData(null, dataAtTag(tag));
    try {
      prevSchema = JSON.parse(execFileSync('git', ['-C', ROOT, 'show', `${tag}:schema/omx-contract.schema.json`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
    } catch { prevSchema = undefined; }
  }
  // --schema-version: only whether the version the schema states carries its changes since the tag. The package's own
  // version moves at the release; this one moves with the change, so it holds on any commit
  if (argv.includes('--schema-version')) {
    if (!prevSchema) throw new Usage(`semver --schema-version: no schema at ${from}`);
    const nextSchema = JSON.parse(readFileSync(join(ROOT, 'schema/omx-contract.schema.json'), 'utf8'));
    const problem = schemaVersionProblem(prevSchema, nextSchema);
    console.log(JSON.stringify({ from: prevSchema['x-omx-schema-version'], to: nextSchema['x-omx-schema-version'], ok: !problem }));
    if (problem) { console.error(`omx-contract semver: ${problem}`); return 1; }
    return 0;
  }
  const to = opt(argv, '--version') ?? packageVersion(ROOT);
  const data = classify(resolveData(prev), resolveData(load(argv)));
  const changes = [...data.changes];
  let level = data.level;
  let schemaWhy = null;
  if (prevSchema) {
    const nextSchema = JSON.parse(readFileSync(join(ROOT, 'schema/omx-contract.schema.json'), 'utf8'));
    const sc = classifySchema(prevSchema, nextSchema);
    changes.push(...sc.changes);
    if (RANKS[sc.level] > RANKS[level]) level = sc.level;
    // the schema carries its own version: a changed schema needs it bumped by what its changes need, once the package is
    if (sc.level !== 'none' && to !== from.replace(/^v/, '')) schemaWhy = refusal(sc.level, prevSchema['x-omx-schema-version'], nextSchema['x-omx-schema-version']);
  }
  for (const c of changes) console.log(`${c.level.toUpperCase()} ${c.item}: ${c.what}`);
  const why = report ? null : (refusal(level, from, to) ?? (schemaWhy && `the schema: ${schemaWhy}`));
  console.log(JSON.stringify({ from: from.replace(/^v/, ''), to, level, changes: changes.length, ok: !why }));
  if (why) { console.error(`omx-contract semver: ${why}`); return 1; }
  return 0;
}

/**
 * `links`: list every item's source links, or with `--check` check them against the owner's tree (lib/links.mjs).
 * A problem prints its CONTRACT_CODES code first; links that lie in a tree not named by `--at` are reported unchecked.
 */
function cmdLinks(argv) {
  const data = load(argv);
  const only = opt(argv, '--package');
  if (only !== undefined && !data.packages) throw new Usage('--package names a package of a contract directory');
  if (only !== undefined && !data.packages.has(only)) throw new Usage(`no package ${only} is installed`);
  if (!argv.includes('--check')) {
    for (const s of sourcesOf(data)) {
      if (only !== undefined && s.pkg !== only) continue;
      for (const l of linksOf(s.source)) console.log(`${s.name}${l.field ? `.${l.field}` : ''} ${l.role} ${l.link}${l.at ? ` at ${l.at}` : ''}`);
    }
    return 0;
  }
  const trees = {};
  for (const a of opts(argv, '--at')) {
    const m = /^([a-z][a-z0-9-]*)=(.+)$/.exec(a);
    if (!m) throw new Usage(`--at ${a} is not <package>=<tree>`);
    trees[m[1]] = resolve(m[2]);
  }
  const root = resolve(opt(argv, '--root') ?? '.');
  if (!existsSync(root)) throw new Usage(`no tree ${root}`);
  const { problems, checked, unchecked, none } = checkLinks(data, { root, trees, requireImpl: argv.includes('--require-impl'), only });
  if (argv.includes('--json')) console.log(JSON.stringify({ problems, checked, unchecked, none }));
  for (const p of problems) console.error(`${p.code} ${p.file}: ${p.item}: ${p.link}: ${p.message}`);
  for (const u of unchecked) console.log(`omx-contract links: unchecked ${u}`);
  console.log(`omx-contract links --check: ${checked} links checked under ${root}, ${problems.length} problems, ${unchecked.length} unchecked, ${none} items with no impl link`);
  return problems.length ? 1 : 0;
}

// ---- translate (omx-contract#21, docs/data-layout.md "Language packs") ----------------------------------------------

/** The languages a catalog is shipped in, and the test ones: share/omx-contract/languages.json. */
function languageList() {
  const doc = JSON.parse(readFileSync(join(ROOT, 'share', 'omx-contract', 'languages.json'), 'utf8'));
  return { shipped: doc.languages, test: doc.test ?? [] };
}

/** The language a prompt names: its English name where the runtime knows it, else its tag. */
function languageName(lang) {
  try { return new Intl.DisplayNames(['en'], { type: 'language' }).of(lang) ?? lang; } catch { return lang; }
}

const TRANSLATE_PROMPT = (lang) => `Translate the user-interface messages of an audio mixing console from English into ${languageName(lang)} (${lang}).
Each entry is one sentence a console, a plugin host or a panel shows to its operator.
Rules: keep every {placeholder} exactly as written, untranslated, and use each one the source uses; keep codes,
file names, units and identifiers in backticks or capitals as they are; keep the register short and plain.
Answer with one JSON object mapping each key to its translated sentence, and nothing else.`;

/** The providers that run on hardware of one's own: an alias served by any other may cost credit. */
const LOCAL_PROVIDERS = new Set(['ollama', 'ollama_chat', 'hosted_vllm', 'vllm', 'lm_studio', 'llamafile', 'xinference']);

/** A batch the router answered through a fallback to a group that costs credit. */
class PaidFallback extends Error {}

/**
 * The paid groups an alias may reach, read from a LiteLLM router before any call: its fallbacks
 * (`/router/settings`) followed from the alias, each group's providers (`/model_group/info`). A group served by a
 * provider not in {@link LOCAL_PROVIDERS}, or whose providers the router does not say, is paid. An endpoint with no
 * router settings is no router and has no fallback. Returns `{ chain, paid }`.
 */
async function routerPaidGroups({ url, key, model }) {
  const base = url.replace(/\/+$/, '').replace(/\/v1$/, '');
  const get = async (path) => {
    const res = await fetch(`${base}${path}`, { headers: key ? { authorization: `Bearer ${key}` } : {}, signal: AbortSignal.timeout(30000) });
    return res.ok ? res.json() : undefined;
  };
  const settings = await get('/router/settings').catch(() => undefined);
  if (!settings) return { chain: [model], paid: [], local: [model] };
  const fallbacks = new Map();
  for (const f of settings?.current_values?.fallbacks ?? []) for (const [from, to] of Object.entries(f ?? {})) fallbacks.set(from, Array.isArray(to) ? to : []);
  const chain = [];
  for (const queue = [model]; queue.length;) {
    const g = queue.shift();
    if (chain.includes(g)) continue;
    chain.push(g);
    queue.push(...(fallbacks.get(g) ?? []));
  }
  const info = await get('/model_group/info').catch(() => undefined);
  const providers = new Map((info?.data ?? []).map((g) => [g.model_group, g.providers]));
  const paid = chain
    .map((g) => ({ group: g, providers: providers.get(g) }))
    .filter(({ providers: p }) => !Array.isArray(p) || p.length === 0 || p.some((x) => !LOCAL_PROVIDERS.has(x)));
  const local = chain.filter((g) => !paid.some((p) => p.group === g));
  return { chain, paid, local };
}

/** One batch through an OpenAI-compatible chat/completions endpoint: `{ model, answers }`. */
async function translateBatch({ url, key, model, lang, batch, localGroups = new Set([model]), allowPaid = false }) {
  const base = url.replace(/\/+$/, '');
  const endpoint = /\/v1$/.test(base) ? `${base}/chat/completions` : `${base}/v1/chat/completions`;
  const entries = Object.fromEntries([...batch].map(([k, w]) => [k, { text: w.text, args: w.args }]));
  const body = {
    model,
    temperature: 0,
    max_tokens: Number(process.env.OMX_TRANSLATE_MAX_TOKENS ?? 8192),
    messages: [
      { role: 'system', content: TRANSLATE_PROMPT(lang) },
      { role: 'user', content: `Translate these entries.\n${JSON.stringify({ lang, entries })}` },
    ],
  };
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(key ? { authorization: `Bearer ${key}` } : {}) },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(Number(process.env.OMX_TRANSLATE_TIMEOUT ?? 600) * 1000),
  });
  if (!res.ok) throw new Error(`translate: ${endpoint} answered ${res.status} ${(await res.text()).slice(0, 200)}`);
  // the model as the router answered it: a LiteLLM router names the group that served the call in a header (the body
  // names the alias asked, even when a fallback answered)
  const group = res.headers.get('x-litellm-model-group');
  const fellBack = Number(res.headers.get('x-litellm-attempted-fallbacks') ?? 0) > 0;
  // a fallback is accepted only to a group proven local before the run; any other may have cost credit
  if (fellBack && !allowPaid && (group === null || !localGroups.has(group))) throw new PaidFallback(`fell back to ${group ?? 'a group the router did not name'}, which costs credit (OMX_TRANSLATE_ALLOW_PAID=1 allows it)`);
  const reply = await res.json();
  const content = String(reply?.choices?.[0]?.message?.content ?? '');
  const json = content.slice(content.indexOf('{'), content.lastIndexOf('}') + 1);
  let answers;
  try { answers = JSON.parse(json); } catch { answers = undefined; }
  const served = group ?? (typeof reply?.model === 'string' && reply.model ? reply.model : model);
  return { model: served, answers: answers && typeof answers === 'object' ? answers : undefined };
}

/**
 * A batch's answers. The keys an answer leaves out (all of them when it does not parse, as an answer cut off) and the
 * keys whose answer the placeholder gate refuses (`accepts`; a model may garble a whole batch's placeholders and answer
 * the same keys right in a smaller one) are asked again in halves, down to one entry, so only a key the model will not
 * answer right on its own is left refused.
 */
async function answersOf(ask, batch, accepts = () => true) {
  const r = await ask(batch);
  const answers = r.answers ?? {};
  const left = batch.filter(([k, want]) => typeof answers[k] !== 'string' || !accepts(want, answers[k]));
  if (left.length === 0 || batch.length === 1) return { model: r.model, answers };
  const half = Math.ceil(left.length / 2);
  const parts = left.length === 1 ? [left] : [left.slice(0, half), left.slice(half)];
  let model = r.model;
  for (const part of parts) {
    const again = await answersOf(ask, part, accepts);
    model = again.model;
    Object.assign(answers, again.answers);
  }
  return { model, answers };
}

/** The owner's inputs: its keys, its catalogs directory and its name. */
/**
 * An owner's source sentences from a file (`--source`, #24), for strings that are no contract data (a surface's own):
 * `{ "<key>": { "text": "<English sentence>", "args": [...] } }`, the same `Map<key, { args, en }>` the data gives. A
 * string value is a generated file's banner, no sentence; `args` absent are the sentence's own placeholders.
 */
function sourceKeys(file) {
  if (!existsSync(file)) throw new Usage(`no source file ${file}`);
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) throw new Usage(`${file} is no object of key -> { text, args }`);
  const keys = new Map();
  for (const [key, v] of Object.entries(doc)) {
    if (typeof v === 'string') continue;
    if (!v || typeof v !== 'object' || typeof v.text !== 'string' || v.text === '') throw new Usage(`${file}: ${key} is neither a sentence { text, args } nor a banner`);
    keys.set(key, { args: Array.isArray(v.args) ? v.args : placeholdersOf(v.text), en: v.text });
  }
  return keys;
}

function translateInputs(argv) {
  const source = opt(argv, '--source');
  if (source !== undefined) {
    if (['--data', '--contract-dir', '--installed'].some((o) => argv.includes(o))) throw new Usage('--source and contract data are two inputs: name one');
    const owner = opt(argv, '--owner');
    const named = opt(argv, '--catalogs');
    if (named === undefined && owner === undefined) throw new Usage('--source names no catalogs: add --catalogs <dir> (or --owner <tree>, its catalogs/)');
    const dir = named !== undefined ? resolve(named) : join(resolve(owner), 'catalogs');
    const existing = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8'))) : [];
    const name = opt(argv, '--package') ?? existing.find((c) => c?.kind === 'catalog')?.owner;
    if (name === undefined) throw new Usage(`no catalog in ${dir} names its owner: add --package <name>`);
    return { keys: sourceKeys(resolve(source)), dir, name };
  }
  const owner = opt(argv, '--owner');
  const args = owner !== undefined ? [...argv, '--data', join(resolve(owner), 'data')] : argv;
  const data = load(args);
  const tools = toolFiles(args);
  const dir = opt(argv, '--catalogs') !== undefined ? resolve(opt(argv, '--catalogs'))
    : owner !== undefined ? join(resolve(owner), 'catalogs')
    : join(resolve(opt(args, '--data') ?? join(ROOT, 'data')), '..', 'catalogs');
  const existing = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8'))) : [];
  const name = opt(argv, '--package') ?? existing.find((c) => c?.kind === 'catalog')?.owner;
  if (name === undefined) throw new Usage(`no catalog in ${dir} names its owner: add --package <name>`);
  const extra = tools.flatMap((f) => Object.entries(f.doc).filter(([, v]) => v && typeof v === 'object' && v.kind));
  const keys = catalogKeys(resolveData(data), { extra, ...(data.packages ? { owner: name } : {}) });
  return { keys, dir, name };
}

async function cmdTranslate(argv) {
  if (process.env.RPM_BUILD_ROOT || process.env.DEB_HOST_ARCH || process.env.DEB_BUILD_ARCH) {
    throw new Usage('translate never runs inside a package build (no network, and a build is reproducible): run it at release preparation and commit the catalogs');
  }
  const { keys, dir, name } = translateInputs(argv);
  const { shipped, test } = languageList();
  const lang = opt(argv, '--lang');
  if (lang !== undefined && !shipped.includes(lang) && !test.includes(lang)) throw new Usage(`--lang ${lang} is not in languages.json (${[...shipped, ...test].join(', ')})`);
  const fileOf = (l) => join(dir, `${l}.json`);
  const read = (l) => (existsSync(fileOf(l)) ? JSON.parse(readFileSync(fileOf(l), 'utf8')) : undefined);

  if (argv.includes('--check')) {
    const langs = lang !== undefined ? [lang] : shipped;
    const problems = releaseProblems(keys, langs, new Map(langs.map((l) => [l, read(l)])), (l) => relative(process.cwd(), fileOf(l)) || fileOf(l));
    for (const c of langs.map(read).filter(Boolean)) problems.push(...catalogProblems(relative(process.cwd(), fileOf(c.lang)), c, keys).map((p) => ({ file: p.file, key: p.item, message: `${p.rule}: ${p.message}` })));
    for (const p of problems) console.error(`${p.file}: ${p.key}: ${p.message}`);
    if (problems.length) return 1;
    console.log(`omx-contract translate --check: ${name}: ${langs.length} language${langs.length === 1 ? '' : 's'} (${langs.join(', ')}), ${keys.size} keys, whole and none stale`);
    return 0;
  }

  if (lang === undefined) throw new Usage('translate makes one language a run: --lang <xx>');
  const url = process.env.OMX_TRANSLATE_URL;
  if (!url) throw new Usage('translate needs an OpenAI-compatible endpoint: OMX_TRANSLATE_URL (OMX_TRANSLATE_KEY, OMX_TRANSLATE_MODEL or --model)');
  const model = opt(argv, '--model') ?? process.env.OMX_TRANSLATE_MODEL;
  if (!model) throw new Usage('translate needs a model: --model <alias> or OMX_TRANSLATE_MODEL');
  const allowPaid = process.env.OMX_TRANSLATE_ALLOW_PAID === '1';
  const { chain, paid, local } = await routerPaidGroups({ url, key: process.env.OMX_TRANSLATE_KEY, model });
  if (paid.length && !allowPaid) {
    throw new Usage(`the model ${model} may be answered by ${paid.map((p) => `${p.group} (${(p.providers ?? ['providers not named']).join(', ')})`).join(', ')}, which costs credit (chain: ${chain.join(' -> ')}): choose a local model, or set OMX_TRANSLATE_ALLOW_PAID=1`);
  }
  const localGroups = new Set(local);
  const size = Number(opt(argv, '--batch') ?? 40);
  if (!Number.isInteger(size) || size < 1) throw new Usage('--batch is a count of entries, at least 1');

  const before = read(lang);
  // a new catalog of this tree names the schema beside it; one of another owner's (--source) names none, the path
  // being this tree's
  const ownSchema = opt(argv, '--source') === undefined ? { $schema: '../schema/omx-contract.schema.json#/$defs/catalog' } : {};
  const catalog = before ?? { ...ownSchema, kind: 'catalog', lang, owner: name, messages: {} };
  const todo = [...toMake(keys, catalog)];
  const messages = { ...catalog.messages };
  const refused = [];
  let used = model;
  for (let i = 0; i < todo.length; i += size) {
    const batch = todo.slice(i, i + size);
    let served;
    let answers;
    try {
      ({ model: served, answers } = await answersOf((b) => translateBatch({ url, key: process.env.OMX_TRANSLATE_KEY, model, lang, batch: b, localGroups, allowPaid }), batch, (want, answer) => 'entry' in admit(want, answer, model)));
    } catch (e) {
      if (!(e instanceof PaidFallback)) throw e;
      for (const [k] of batch) { refused.push(`${k}: ${e.message}`); delete messages[k]; }
      continue;
    }
    used = served;
    for (const [k, want] of batch) {
      const a = admit(want, answers[k], served);
      if ('entry' in a) messages[k] = a.entry;
      else { refused.push(`${k}: ${a.refused}`); delete messages[k]; }
    }
  }
  mkdirSync(dir, { recursive: true });
  writeFileSync(fileOf(lang), catalogText({ ...catalog, messages }, Object.keys(catalog.messages)));
  for (const r of refused) console.error(`omx-contract translate: ${lang}: ${r}`);
  console.log(`omx-contract translate: ${name} ${lang}: ${todo.length - refused.length} made by ${used}, ${refused.length} refused, ${Object.keys(messages).length} entries`);
  return refused.length ? 1 : 0;
}

const USAGE = `usage: omx-contract validate [<input>] [--catalogs <dir>]
       omx-contract fmt [--check] [<input>]
       omx-contract render --target c|ts|json|lv2|py --out <dir> [--check] [<input> [--package <name>] | --sheet <fixture.json>]
       omx-contract semver <previous tag> [--report] | --from-dir <data dir> --from-version <x.y.z> [--version <x.y.z>]
       omx-contract links [--check] [--root <tree>] [<input>] [--package <name>] [--at <package>=<tree>]... [--require-impl] [--json]
       omx-contract translate [--check] [--lang <xx>] [--owner <tree> | <input> --catalogs <dir> | --source <file> --catalogs <dir>] [--package <name>] [--model <alias>] [--batch <n>]
  <input>: --data <dir> | --contract-dir <dir> | --installed, a contract directory with [--needs <package>@'>= x.y.z']... [--json]`;

export function main(argv) {
  const cmds = { validate: cmdValidate, fmt: cmdFmt, render: cmdRender, semver: cmdSemver, links: cmdLinks, translate: cmdTranslate };
  const fail = (e) => {
    if (e instanceof Usage) { console.error(`omx-contract: ${e.message}\n${USAGE}`); return 2; }
    if (e instanceof ContractRefusal) {
      if (argv.includes('--json')) console.log(JSON.stringify(e.toJSON()));
      console.error(e.line());
      return 1;
    }
    console.error(`omx-contract: ${e.message}`);
    return 1;
  };
  try {
    const cmd = cmds[argv[0]];
    if (!cmd) throw new Usage(argv[0] ? `unknown command ${argv[0]}` : 'no command');
    const r = cmd(argv);
    // translate answers later (a model call); every other command answers now, as before
    return r instanceof Promise ? r.catch(fail) : r;
  } catch (e) {
    return fail(e);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = main(process.argv.slice(2));
  if (r instanceof Promise) r.then((code) => { process.exitCode = code; });
  else process.exitCode = r;
}
