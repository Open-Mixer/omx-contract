// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * The one test of this repo against its owners' live data. The tool's own tests run over invented kernels
 * (test/fixtures/tool-kernels/), so a rule or a render that breaks an owner's real file would be seen only here (#109).
 * Given the data directories of the live owners in OMX_LIVE_OWNER_DATA (a colon-separated list, e.g. an omx-dsp
 * release's data/; in CI, tools/live-owner-data.sh fetches it), their data reads, validates and renders beside data/,
 * every kernel file is the one spelling of its items, the schema's unit list is the units in use, and the tool names
 * none of their items.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { entriesOf, isUse, kernelDocOf, loadData, resolveData } from '../lib/data.mjs';
import { formatDoc } from '../lib/fmt.mjs';
import { validateData } from '../lib/validate.mjs';
import { renderC } from '../render/c.mjs';
import { renderJson } from '../render/json.mjs';
import { renderTs } from '../render/ts.mjs';
import { DATA, HOSTING, ROOT, scratchDir } from './helpers.mjs';

const live = (process.env.OMX_LIVE_OWNER_DATA ?? '').split(':').filter(Boolean);
const skip = live.length === 0 && !process.env.GITHUB_ACTIONS && 'OMX_LIVE_OWNER_DATA names no live owner data directory';

/** data/, every live owner's data and the tool hosting file in one data directory (schema/ beside it). */
const liveUnion = () => {
  const dir = scratchDir('omx-contract-live-');
  cpSync(DATA, join(dir, 'data'), { recursive: true });
  for (const d of live) for (const sub of ['kernels', 'primitives']) if (existsSync(join(d, sub))) cpSync(join(d, sub), join(dir, 'data', sub), { recursive: true });
  cpSync(HOSTING, join(dir, 'data/hosting.json'));
  cpSync(join(ROOT, 'schema'), join(dir, 'schema'), { recursive: true });
  cpSync(join(ROOT, 'contract.d/param'), join(dir, 'contract.d/param'), { recursive: true });
  return join(dir, 'data');
};

// A skipped check is a check that is not there: in CI the owner's data is fetched, so a run that finds none is red.
test('in CI, OMX_LIVE_OWNER_DATA names a live owner and its kernels are there', () => {
  if (!process.env.GITHUB_ACTIONS) return;
  assert.ok(live.length > 0, 'OMX_LIVE_OWNER_DATA is not set: the live-owner step did not run');
  assert.ok(live.every((d) => existsSync(join(d, 'kernels'))), 'a live owner directory holds no kernels');
});

test('the live owners\' data reads, validates and renders beside data/', { skip }, () => {
  const data = loadData(liveUnion());
  const kernels = data.files.filter((f) => f.rel.startsWith('data/kernels/'));
  assert.ok(kernels.length >= 20, `positive control: ${kernels.length} live kernel files`);
  assert.deepEqual(validateData(data), []);
  const r = resolveData(data);
  for (const render of [renderC, renderTs]) assert.ok(render(r).every((f) => f.text.length > 0));
  assert.equal(Object.keys(JSON.parse(renderJson(r, '0.0.0')[0].text).kernels).length, kernels.length);
});

test('every live kernel file is the one formatting, and its items declare it again', { skip }, () => {
  for (const f of loadData(liveUnion()).files.filter((x) => x.rel.startsWith('data/kernels/'))) {
    assert.equal(formatDoc(f.doc), f.text, `${f.rel} is in the one formatting`);
    const items = entriesOf(f.rel, f.doc);
    assert.deepEqual(new Map(entriesOf(f.rel, kernelDocOf(f.rel, items))), new Map(items), `${f.rel}: the restated file expands to its items`);
    assert.ok((f.doc.controls ?? []).every((c) => isUse(c) || typeof c.doc === 'string' || c.table), `${f.rel}: every control that declares an item says what it is`);
  }
});

/**
 * A unit the contract declares ahead of its first user, with the issue that brings that user. Each must stay unused
 * by data/, the hosting file and the live owners: a unit that gains a user leaves the table (`dB/oct` did with the
 * comp's key filter slope, omx-dsp c208f5f, released in 0.27.0).
 */
const AWAITING_USER = { LUFS: 'FreeMixer/omx-contract#145', 'dB/s': 'FreeMixer/omx-contract#145' };

/**
 * A unit whose one user declares it outside any contract data, with where. `min` is FBS_COOLDOWN_MINUTES_RANGE's, which
 * stayed with the console's own declarations when fbs moved to omx-dsp (omx-dsp f8b816e: no omx-dsp source reads it).
 */
const USED_OUTSIDE = { min: 'the console\'s declarations, FBS_COOLDOWN_MINUTES_RANGE (omx-dsp f8b816e)' };

test('the schema unit enum lists exactly the units the live items and readouts use', { skip }, () => {
  const schema = JSON.parse(readFileSync(join(ROOT, 'schema/omx-contract.schema.json'), 'utf8'));
  const listed = new Set(schema.$defs.unit.enum);
  const used = new Set();
  const walk = (o) => {
    if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      if (k === 'unit' && typeof v === 'string') used.add(v);
      walk(v);
    }
  };
  const j = JSON.parse(renderJson(resolveData(loadData(liveUnion())), '0.0.0')[0].text);
  walk(j.items);
  walk(j.kernels);
  assert.ok(used.size >= 8, 'the probe sees the units in use');
  assert.deepEqual([...listed].filter((u) => !used.has(u) && !Object.hasOwn(AWAITING_USER, u) && !Object.hasOwn(USED_OUTSIDE, u)), [], 'a unit nothing uses is in the enum');
  assert.deepEqual(Object.keys(USED_OUTSIDE).filter((u) => used.has(u) || !listed.has(u)), [], 'a unit used outside is in the enum and unused here');
  assert.deepEqual(Object.keys(AWAITING_USER).filter((u) => used.has(u) || !listed.has(u)), [], 'a unit awaiting its user is in the enum and unused here');
  assert.deepEqual([...used].filter((u) => !listed.has(u)), [], 'a unit in use is missing from the enum');
});

test('the tool names no item an owner installs: the owner\'s file is the only place its spelling and its rules live', { skip }, () => {
  const sources = ['lib', 'render', 'render/c', 'bin'].flatMap((d) => readdirSync(join(ROOT, d)).filter((f) => f.endsWith('.mjs')).map((f) => [`${d}/${f}`, readFileSync(join(ROOT, d, f), 'utf8')]));
  const own = new Set(loadData(DATA).items.keys());
  const owned = [...loadData(liveUnion()).items.keys()].filter((n) => !own.has(n));
  assert.ok(owned.includes('HOSTED_STAGE_LIMITS') && owned.length > 150, 'positive control: the owners\' items');
  const named = owned.filter((name) => sources.some(([, text]) => new RegExp(`\\b${name}\\b`).test(text)));
  // The default EQ rule, the EQ band counts' rule and the band budget were the last (#1841): the rule left for omx-dsp,
  // the counts are the generic count and sheet-default rules, the budget a check its owner declares (docs/contract-dir.md).
  assert.deepEqual(named, [], 'no rule, render or comment of the tool names an owner\'s item');
});

// The step that fetches the owner's data, in each workflow that runs the tests. It sends the token, since the releases
// API answered a run without one with a 403, and it fails where the fetch fails: `echo "X=$(cmd)"` takes echo's status,
// so a failed cmd passes the step with an empty X and only the tests above go red.
const WORKFLOWS = readdirSync(join(ROOT, '.github/workflows')).filter((f) => f.endsWith('.yml'));
const workflow = (f) => readFileSync(join(ROOT, '.github/workflows', f), 'utf8');
const ownerStep = (f) => {
  const step = workflow(f).split(/^ {6}- /m).find((s) => s.includes('sh tools/live-owner-data.sh'));
  if (!step) return null;
  const lines = step.split('\n');
  const at = lines.findIndex((l) => /^ +run:/.test(l));
  const head = lines[at].replace(/^ +run: */, '');
  const indent = lines[at].search(/\S/);
  const body = [];
  for (const l of lines.slice(at + 1)) {
    if (l.trim() !== '' && l.search(/\S/) <= indent) break;
    body.push(l.trim());
  }
  return { step, run: head === '|' ? body.join('\n') : head };
};
const OWNER_WORKFLOWS = WORKFLOWS.filter((f) => ownerStep(f));

test('the live-owner step is in the workflows that run the tests', () => {
  assert.deepEqual(OWNER_WORKFLOWS.sort(), ['ci.yml', 'publish.yml', 'release.yml']);
});

test('the live-owner step sends the token to tools/live-owner-data.sh', () => {
  for (const f of OWNER_WORKFLOWS) assert.match(ownerStep(f).step, /^ +GITHUB_TOKEN: \$\{\{ github\.token \}\}$/m, f);
});

test('the live-owner step fails on a failed fetch and on an empty answer, and writes the path on a good one', () => {
  const cases = [
    { name: 'a failed fetch', script: 'exit 1', ok: false },
    { name: 'an empty answer', script: 'exit 0', ok: false },
    { name: 'a good fetch (the positive control)', script: 'echo /owner/data', ok: true },
  ];
  for (const f of OWNER_WORKFLOWS) for (const c of cases) {
    const dir = scratchDir('omx-owner-step-');
    mkdirSync(join(dir, 'tools'));
    writeFileSync(join(dir, 'tools/live-owner-data.sh'), `${c.script}\n`);
    const env = join(dir, 'env');
    writeFileSync(env, '');
    // the runner's own shell for a step with no `shell:` key
    const r = spawnSync('bash', ['-e', '-c', ownerStep(f).run], { cwd: dir, env: { ...process.env, GITHUB_ENV: env, RUNNER_TEMP: dir } });
    assert.equal(r.status === 0, c.ok, `${f}, ${c.name}: the step exited ${r.status}`);
    assert.equal(readFileSync(env, 'utf8'), c.ok ? 'OMX_LIVE_OWNER_DATA=/owner/data\n' : '', `${f}, ${c.name}: what the step wrote`);
  }
});

test('no workflow writes a command substitution straight into GITHUB_ENV or GITHUB_OUTPUT', () => {
  const shape = /\becho\b.*\$\(.*>>\s*"?\$\{?GITHUB_(ENV|OUTPUT)/;
  assert.ok(shape.test('echo "X=$(cmd)" >> "$GITHUB_ENV"'), 'positive control: the pattern sees the shape');
  for (const f of WORKFLOWS) for (const [i, l] of workflow(f).split('\n').entries()) assert.doesNotMatch(l, shape, `${f}:${i + 1}`);
});

// Which omx-dsp the proof reads (omx-contract#195). A release that removes an item omx-dsp's next release takes over
// publishes before that release (omx-dsp build-requires it), so the latest omx-dsp release still reads the item and
// the proof of the tag fails: v3.21.0 against omx-dsp 0.33.1, READOUT_RATE_HZ. tools/live-owner.ref names the commit the
// chain ships instead, until the release that carries it; from that release on, the latest release again.
const SHA = '1ed8a2df00fdd6383ffe07ca531ce960e7e1ca50';
/** Run tools/live-owner-data.sh in a scratch tree with a stub curl: what it fetched, what it printed, its status. */
const fetchOwner = ({ pin, latest, tag }) => {
  const dir = scratchDir('omx-owner-fetch-');
  mkdirSync(join(dir, 'tools'));
  mkdirSync(join(dir, 'bin'));
  cpSync(join(ROOT, 'tools/live-owner-data.sh'), join(dir, 'tools/live-owner-data.sh'));
  if (pin !== undefined) writeFileSync(join(dir, 'tools/live-owner.ref'), pin);
  // the archive's top directory is named as GitHub names it: omx-dsp-<version> for a tag, omx-dsp-<sha> for a commit
  writeFileSync(join(dir, 'bin/curl'), [
    '#!/bin/sh',
    `for a; do url=$a; done; echo "$url" >> "${dir}/fetched"`,
    'case $url in',
    `  */releases/latest) printf '{\\n  "tag_name": "%s",\\n}\\n' "${latest}" ;;`,
    '  */archive/refs/tags/v*.tar.gz) top=${url##*/v}; top=omx-dsp-${top%.tar.gz} ;;',
    '  */archive/*.tar.gz) top=${url##*/}; top=omx-dsp-${top%.tar.gz} ;;',
    '  *) exit 22 ;;',
    'esac',
    `[ -z "\${top:-}" ] || { s=$(mktemp -d "${dir}/a.XXXXXX"); mkdir -p "$s/$top/data/kernels"; tar -cz -C "$s" "$top"; }`,
    '',
  ].join('\n'), { mode: 0o755 });
  const r = spawnSync('sh', [join(dir, 'tools/live-owner-data.sh'), join(dir, 'out'), ...(tag ? [tag] : [])], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${join(dir, 'bin')}:${process.env.PATH}`, GITHUB_REPOSITORY_OWNER: 'Open-Mixer', GITHUB_TOKEN: '' },
  });
  const fetched = existsSync(join(dir, 'fetched')) ? readFileSync(join(dir, 'fetched'), 'utf8').trim().split('\n') : [];
  return { status: r.status, out: r.stdout.trim().replace(`${dir}/out/`, ''), fetched: fetched.map((u) => u.replace(/^.*\/omx-dsp\//, '')), err: r.stderr };
};

test('with no pin the proof reads omx-dsp\'s latest release', () => {
  const r = fetchOwner({ latest: 'v0.33.1' });
  assert.equal(r.status, 0, r.err);
  assert.deepEqual(r.fetched, ['releases/latest', 'archive/refs/tags/v0.33.1.tar.gz']);
  assert.equal(r.out, 'omx-dsp-0.33.1/data');
});

test('a pin names the omx-dsp commit the proof reads until the release it names is out', () => {
  const pin = `# the commit omx-dsp 0.34.0 is cut from (omx-dsp#123)\n${SHA} until v0.34.0\n`;
  const before = fetchOwner({ pin, latest: 'v0.33.1' });
  assert.equal(before.status, 0, before.err);
  assert.deepEqual(before.fetched, ['releases/latest', `archive/${SHA}.tar.gz`]);
  assert.equal(before.out, `omx-dsp-${SHA}/data`);
  for (const latest of ['v0.34.0', 'v0.34.1', 'v0.40.0']) {
    const after = fetchOwner({ pin, latest });
    assert.equal(after.status, 0, after.err);
    assert.deepEqual(after.fetched, ['releases/latest', `archive/refs/tags/${latest}.tar.gz`], `latest ${latest}: the pin is retired`);
    assert.match(after.err, /live-owner\.ref is retired/, `latest ${latest}: it says so`);
  }
  const named = fetchOwner({ pin, latest: 'v0.33.1', tag: 'v0.32.4' });
  assert.deepEqual(named.fetched, ['archive/refs/tags/v0.32.4.tar.gz'], 'a tag given on the command line wins');
});

test('a pin that is not one 40-hex commit and `until v<x.y.z>` is refused, never read as no pin', () => {
  for (const pin of [`${SHA}\n`, `${SHA.slice(0, 12)} until v0.34.0\n`, `${SHA} until 0.34.0\n`, `main until v0.34.0\n`, '# nothing\n', `${SHA} until v0.34.0\n${SHA} until v0.35.0\n`]) {
    const r = fetchOwner({ pin, latest: 'v0.33.1' });
    assert.notEqual(r.status, 0, `${JSON.stringify(pin)} was accepted`);
    assert.equal(r.out, '', `${JSON.stringify(pin)}: no path printed`);
    assert.ok(!r.fetched.some((u) => u.startsWith('archive/')), `${JSON.stringify(pin)}: nothing fetched`);
  }
});
