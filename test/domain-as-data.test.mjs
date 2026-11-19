// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// A domain renders as its data form does (docs/render.md, omx-contract#139): omx-clap-core's hosting data, converted
// into a domain, rendered through `render --with-domain` beside the files still in data/ (verbs.json), gives the five
// files of the pure data render byte for byte.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import test from 'node:test';
import { ROOT } from './helpers.mjs';

const FIX = join(ROOT, 'test/fixtures/hosting-data');
const CLI = join(ROOT, 'bin/omx-contract.mjs');
const OUTPUTS = { c: ['clap_host_limits.h', 'hosted_stage_limits.h', 'omx_clap_core_vocabulary.h'], ts: ['omx-clap-core-hosting.js', 'omx-clap-core-hosting.d.ts', 'omx-clap-core-vocabulary.js', 'omx-clap-core-vocabulary.d.ts'] };

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));

/** The hosting data files of `dir` as one domain document, every item carrying the file it came from. */
function toDomain(dir) {
  const schemas = {};
  let render, renderFile;
  for (const p of walk(dir).filter((f) => /^hosting(\.json|\/)/.test(relative(dir, f))).sort()) {
    const rel = relative(dir, p);
    const doc = JSON.parse(readFileSync(p, 'utf8'));
    if (doc.render) { render = doc.render; renderFile = rel; }
    for (const [name, it] of Object.entries(doc)) {
      if (typeof it !== 'object' || it === null || !('kind' in it)) continue;
      const s = { description: it.doc, 'x-since': it.since, 'x-file': rel, 'x-kind': it.kind, ...(it.source === undefined ? {} : { 'x-source': it.source }) };
      if (it.kind === 'sheet') Object.assign(s, { 'x-value': it.value, 'x-docs': it.docs });
      else s.oneOf = Object.entries(it.codes).map(([key, c], i) => ({ const: c.code, title: key, ...(c.doc === undefined ? {} : { description: c.doc }), 'x-code': i, ...(c.text?.en === undefined ? {} : { 'x-text': c.text.en }), 'x-name': key }));
      schemas[name] = s;
    }
  }
  return { $schema: 'https://json-schema.org/draft/2020-12/schema', $id: 'https://openmixer.org/contract/hosting', info: { title: 'The hosting codes', version: '0.33.1', 'x-owner': 'omx-clap-core', 'x-stability': 'experimental' }, 'x-render': render, 'x-file': renderFile, components: { schemas } };
}

function scratch() {
  const dir = mkdtempSync(join(tmpdir(), 'domain-as-data-'));
  // the pure render reads the fixture under the name the owner's tree gives it, data/, as the comments name it
  cpSync(FIX, join(dir, 'pure', 'data'), { recursive: true });
  const data = join(dir, 'data');
  mkdirSync(data);
  cpSync(join(FIX, 'verbs.json'), join(data, 'verbs.json'));
  const dom = join(dir, 'hosting');
  mkdirSync(dom);
  return { dir, data, dom };
}

const render = (target, args, out) => spawnSync(process.execPath, [CLI, 'render', '--target', target, '--package', 'omx-clap-core', ...args, '--out', out], { encoding: 'utf8' });

function compare(domain) {
  const s = scratch();
  try {
    writeFileSync(join(s.dom, 'hosting.json'), JSON.stringify(domain, null, 2));
    const diffs = [];
    for (const [target, files] of Object.entries(OUTPUTS)) {
      const pure = render(target, ['--data', join(s.dir, 'pure', 'data')], join(s.dir, `pure-${target}`));
      assert.equal(pure.status, 0, pure.stderr);
      const both = render(target, ['--data', s.data, '--with-domain', s.dom], join(s.dir, `both-${target}`));
      if (both.status !== 0) return [`${target}: ${both.stderr.trim()}`];
      for (const f of files) if (readFileSync(join(s.dir, `pure-${target}`, f), 'utf8') !== readFileSync(join(s.dir, `both-${target}`, f), 'utf8')) diffs.push(f);
    }
    return diffs;
  } finally {
    rmSync(s.dir, { recursive: true, force: true });
  }
}

test('the hosting domain beside data/verbs.json renders the five files of the data form, byte for byte', () => {
  assert.deepEqual(compare(toDomain(FIX)), []);
});

test('sabotage: one x-text, one x-value and one x-file changed are each red', () => {
  const text = toDomain(FIX);
  const word = Object.values(text.components.schemas).find((s) => s.oneOf?.some((w) => w['x-text'])).oneOf.find((w) => w['x-text']);
  word['x-text'] += ' Changed.';
  assert.notDeepEqual(compare(text), []);
  const value = toDomain(FIX);
  const sheet = Object.values(value.components.schemas).find((s) => s['x-kind'] === 'sheet');
  const k = Object.keys(sheet['x-value'])[0];
  sheet['x-value'][k] = typeof sheet['x-value'][k] === 'number' ? sheet['x-value'][k] + 1 : sheet['x-value'][k];
  assert.notDeepEqual(compare(value), []);
  const file = toDomain(FIX);
  const moved = Object.values(file.components.schemas).find((s) => s['x-file'] !== file['x-file']);
  moved['x-file'] = file['x-file'];
  assert.notDeepEqual(compare(file), []);
});

test('a file both in data/ and rebuilt from the domain is refused by name', () => {
  const s = scratch();
  try {
    writeFileSync(join(s.dom, 'hosting.json'), JSON.stringify(toDomain(FIX), null, 2));
    cpSync(join(FIX, 'hosting.json'), join(s.data, 'hosting.json'));
    const r = render('c', ['--data', s.data, '--with-domain', s.dom], join(s.dir, 'out'));
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /hosting\.json/);
  } finally {
    rmSync(s.dir, { recursive: true, force: true });
  }
});
