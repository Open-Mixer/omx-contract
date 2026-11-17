// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * The documentation gate of the installed headers (tools/doxygen-gate.sh, docs/render.md "Documentation"): red first
 * on each defect it exists for, over a scratch copy of include/omxcontract/ and of the baseline. Skipped, never
 * green, where doxygen is not installed: CI installs it.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { appendFileSync, cpSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { ROOT, scratchDir } from './helpers.mjs';

const noDoxygen = spawnSync('doxygen', ['--version']).status !== 0 && 'no doxygen';
const BASELINE = join(ROOT, 'docs/doxygen-baseline.txt');
const HEADERS = join(ROOT, 'include/omxcontract');

/** The gate's run from the repository root: `{ status, out }`, `out` both streams. */
function gate(...args) {
  const r = spawnSync('sh', ['tools/doxygen-gate.sh', ...args], { cwd: ROOT, encoding: 'utf8' });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

/** A scratch copy of the installed headers, and of the baseline. */
function scratch() {
  const dir = scratchDir('omx-doxygen-');
  cpSync(HEADERS, join(dir, 'h'), { recursive: true });
  const baseline = join(dir, 'baseline.txt');
  writeFileSync(baseline, readFileSync(BASELINE, 'utf8'));
  return { dir, headers: join(dir, 'h'), baseline };
}

const addBeforeGuardEnd = (file, text) => {
  const s = readFileSync(file, 'utf8');
  const at = s.lastIndexOf('#endif');
  assert.ok(at > 0, `${file} ends its include guard`);
  writeFileSync(file, `${s.slice(0, at)}${text}\n${s.slice(at)}`);
};

test('the committed headers are at the baseline, and the baseline is sorted with no duplicate', { skip: noDoxygen }, () => {
  const r = gate();
  assert.equal(r.status, 0, r.out);
  const lines = readFileSync(BASELINE, 'utf8').trimEnd().split('\n');
  assert.deepEqual(lines, [...new Set(lines)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)), 'sorted, unique');
  for (const l of lines) assert.match(l, /^omx_\w+\.h: warning: /, l);
});

test('red: a new undocumented public function in a header is refused and named', { skip: noDoxygen }, () => {
  const s = scratch();
  addBeforeGuardEnd(join(s.headers, 'omx_json_write.h'), 'static inline int omx_fixture_undocumented(int a) { return a; }');
  const r = gate('--input', s.headers, '--baseline', s.baseline);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /the baseline does not carry/);
  assert.match(r.out, /omx_json_write\.h: warning: .*omx_fixture_undocumented/);
});

test('red: a new undocumented public macro is refused too (a define is a public declaration)', { skip: noDoxygen }, () => {
  const s = scratch();
  addBeforeGuardEnd(join(s.headers, 'omx_json_write.h'), '#define OMX_FIXTURE_UNDOCUMENTED 1');
  const r = gate('--input', s.headers, '--baseline', s.baseline);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /omx_json_write\.h: warning: .*OMX_FIXTURE_UNDOCUMENTED/);
});

test('green: the same new function documented, with its parameter and return, passes', { skip: noDoxygen }, () => {
  const s = scratch();
  addBeforeGuardEnd(join(s.headers, 'omx_json_write.h'), [
    '/** A fixture. @param a what it returns. @return `a`. */',
    'static inline int omx_fixture_documented(int a) { return a; }',
  ].join('\n'));
  const r = gate('--input', s.headers, '--baseline', s.baseline);
  assert.equal(r.status, 0, r.out);
});

test('red: a baseline line whose declaration is documented now must be struck', { skip: noDoxygen }, () => {
  const s = scratch();
  appendFileSync(s.baseline, 'omx_json_write.h: warning: Member OMX_FIXTURE_GONE (macro definition) of file omx_json_write.h is not documented.\n');
  const r = gate('--input', s.headers, '--baseline', s.baseline);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /documented now \(strike them/);
  assert.match(r.out, /OMX_FIXTURE_GONE/);
});

test('red: a header with no @file block is refused before doxygen, since doxygen would read none of it', { skip: noDoxygen }, () => {
  const s = scratch();
  const f = join(s.headers, 'omx_json_write.h');
  writeFileSync(f, readFileSync(f, 'utf8').replace('@file', '@fil_'));
  const r = gate('--input', s.headers, '--baseline', s.baseline);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /no @file block/);
  assert.match(r.out, /omx_json_write\.h/);
});

test('the baseline only shrinks: a line added against the base is refused, a struck line is not', { skip: noDoxygen }, () => {
  const s = scratch();
  const lines = readFileSync(BASELINE, 'utf8').trimEnd().split('\n');
  // the base's list lacks one of today's lines: today's change added it
  const smaller = join(s.dir, 'base-smaller.txt');
  writeFileSync(smaller, `${lines.slice(1).join('\n')}\n`);
  const grown = gate('--input', s.headers, '--baseline', s.baseline, '--base-baseline', smaller);
  assert.equal(grown.status, 1, grown.out);
  assert.match(grown.out, /only shrinks/);
  assert.ok(grown.out.includes(lines[0]), lines[0]);
  // the base's list is today's: nothing added
  const same = gate('--input', s.headers, '--baseline', s.baseline, '--base-baseline', BASELINE);
  assert.equal(same.status, 0, same.out);
  // the base's list carries a line today's struck (documented since): a shrink, allowed
  const bigger = join(s.dir, 'base-bigger.txt');
  writeFileSync(bigger, `${lines.join('\n')}\nomx_json_write.h: warning: Member OMX_FIXTURE_STRUCK (macro definition) of file omx_json_write.h is not documented.\n`);
  const shrunk = gate('--input', s.headers, '--baseline', s.baseline, '--base-baseline', bigger);
  assert.equal(shrunk.status, 0, shrunk.out);
});

test('make doxygen-check: the base ref is held to; a ref git cannot read is a refusal, exit 2, never a pass with no base', { skip: noDoxygen || (spawnSync('make', ['--version']).status !== 0 && 'no make') }, () => {
  const make = (base) => spawnSync('make', ['doxygen-check', `DOXYGEN_BASE=${base}`], { cwd: ROOT, encoding: 'utf8' });
  const head = make('HEAD');
  assert.equal(head.status, 0, `${head.stdout}${head.stderr}`);
  const none = make('no-such-ref-for-the-gate');
  assert.equal(none.status, 2, `${none.stdout}${none.stderr}`);
  assert.match(none.stderr, /no commit git can read here/);
});

test('--list prints the current warnings keyed by header and text, with no line number', { skip: noDoxygen }, () => {
  const r = gate('--list');
  assert.equal(r.status, 0, r.out);
  assert.equal(r.out, readFileSync(BASELINE, 'utf8'));
  assert.doesNotMatch(r.out, /\.h:\d+:/);
});

test('the gate cannot run without doxygen or a baseline, and says so with exit 2, never a pass', () => {
  const r = spawnSync('/bin/sh', ['tools/doxygen-gate.sh', '--baseline', 'no/such/baseline.txt'], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, PATH: noDoxygen ? process.env.PATH : '/nonexistent' } });
  assert.equal(r.status, 2, r.stderr);
  assert.match(r.stderr, /doxygen is not installed|no baseline/);
});
