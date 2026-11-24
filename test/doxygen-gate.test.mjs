// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas
/**
 * The documentation gate of the installed headers (tools/doxygen-gate.sh, docs/render.md "Documentation"): red first
 * on each defect it exists for, over a scratch copy of include/omxcontract/ and of the baseline. Skipped where doxygen
 * is not installed (a skip is reported, not a pass); CI installs doxygen and runs them.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { appendFileSync, cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

/** The committed baseline's lines; an empty file is no line. */
const baselineLines = () => {
  const text = readFileSync(BASELINE, 'utf8');
  return text === '' ? [] : text.trimEnd().split('\n');
};

/**
 * A scratch copy whose headers carry two undocumented macros its baseline lists, so the set and shrink rules are
 * exercised on lines that exist whatever the committed baseline holds (it is empty once every header is documented).
 */
function scratchWithBaselined() {
  const s = scratch();
  addBeforeGuardEnd(join(s.headers, 'omx_json_write.h'), '#define OMX_FIXTURE_BASELINED_A 1\n#define OMX_FIXTURE_BASELINED_B 1');
  const lines = [...baselineLines(), ...['A', 'B'].map((x) => `omx_json_write.h: warning: Member OMX_FIXTURE_BASELINED_${x} (macro definition) of file omx_json_write.h is not documented.`)]
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  writeFileSync(s.baseline, `${lines.join('\n')}\n`);
  const at = gate('--input', s.headers, '--baseline', s.baseline);
  assert.equal(at.status, 0, `the fixture is at its baseline: ${at.out}`);
  return { ...s, lines };
}

test('the committed headers are at the baseline, and the baseline is sorted with no duplicate', { skip: noDoxygen }, () => {
  const r = gate();
  assert.equal(r.status, 0, r.out);
  const lines = baselineLines();
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

test('red: the baseline is a set: one line swapped for a stray one is red by both names, a dropped trailing newline is no change', { skip: noDoxygen }, () => {
  const s = scratchWithBaselined();
  const { lines } = s;
  const stray = 'omx_formats.h: warning: Member OMX_FIXTURE_SWAPPED_IN (macro definition) of file omx_formats.h is not documented.';
  writeFileSync(s.baseline, `${[stray, ...lines.slice(1)].join('\n')}\n`);
  const swapped = gate('--input', s.headers, '--baseline', s.baseline);
  assert.equal(swapped.status, 1, swapped.out);
  assert.ok(swapped.out.includes(lines[0]), 'the line swapped out is named as new');
  assert.ok(swapped.out.includes(stray), 'the stray line is named as stale');
  writeFileSync(s.baseline, lines.join('\n'));
  const noNewline = gate('--input', s.headers, '--baseline', s.baseline);
  assert.equal(noNewline.status, 0, noNewline.out);
});

test('refused by name, exit 2: no Doxyfile where it runs, no baseline file, no header under --input', { skip: noDoxygen }, () => {
  const s = scratch();
  const elsewhere = spawnSync('sh', [join(ROOT, 'tools/doxygen-gate.sh')], { cwd: s.dir, encoding: 'utf8' });
  assert.equal(elsewhere.status, 2, elsewhere.stderr);
  assert.match(elsewhere.stderr, /no Doxyfile in /);
  const noBaseline = gate('--input', s.headers, '--baseline', join(s.dir, 'no-such-baseline.txt'));
  assert.equal(noBaseline.status, 2, noBaseline.out);
  assert.match(noBaseline.out, /no baseline at .*no-such-baseline\.txt/);
  const noHeader = gate('--input', join(s.dir, 'empty'), '--baseline', s.baseline);
  assert.equal(noHeader.status, 2, noHeader.out);
  assert.match(noHeader.out, /no header under/);
});

test('tracked headers only: a stray undocumented header beside the installed ones counts on neither side', { skip: noDoxygen }, () => {
  // a scratch repository holding the gate, the Doxyfile, the baseline and the tracked headers: the stray file is
  // written there, never into this tree, where the render checks of the parallel suites would read it as extra
  const dir = scratchDir('omx-doxygen-repo-');
  const git = (...a) => spawnSync('git', ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { encoding: 'utf8' });
  cpSync(HEADERS, join(dir, 'include/omxcontract'), { recursive: true });
  cpSync(join(ROOT, 'tools/doxygen-gate.sh'), join(dir, 'tools/doxygen-gate.sh'));
  cpSync(join(ROOT, 'Doxyfile'), join(dir, 'Doxyfile'));
  cpSync(BASELINE, join(dir, 'docs/doxygen-baseline.txt'));
  assert.equal(git('init', '-q').status, 0);
  assert.equal(git('add', '-A').status, 0);
  const inDir = (...args) => {
    const r = spawnSync('sh', ['tools/doxygen-gate.sh', ...args], { cwd: dir, encoding: 'utf8' });
    return { status: r.status, out: `${r.stdout}${r.stderr}` };
  };
  const stray = join(dir, 'include/omxcontract/omx_stray_fixture.h');
  writeFileSync(stray, '/** @file\n * @brief A stray. */\n#ifndef OMX_STRAY_H\n#define OMX_STRAY_H\nstatic inline int omx_stray_undocumented(int a) { return a; }\n#endif\n');
  const r = inDir();
  assert.equal(r.status, 0, r.out);
  assert.doesNotMatch(inDir('--list').out, /omx_stray/);
  // the same header read through --input is seen: the tracked filter is the only thing that hid it
  const seen = inDir('--input', join(dir, 'include/omxcontract'), '--baseline', join(dir, 'docs/doxygen-baseline.txt'));
  assert.equal(seen.status, 1, seen.out);
  assert.match(seen.out, /omx_stray_undocumented/);
  assert.ok(!existsSync(join(HEADERS, 'omx_stray_fixture.h')), 'nothing was written into this tree');
});

test('--update only lowers: refused by name while a new warning stands, written when a line is struck', { skip: noDoxygen }, () => {
  const s = scratch();
  const before = readFileSync(s.baseline, 'utf8');
  addBeforeGuardEnd(join(s.headers, 'omx_json_write.h'), 'static inline int omx_fixture_undocumented(int a) { return a; }');
  const refused = gate('--input', s.headers, '--baseline', s.baseline, '--update');
  assert.equal(refused.status, 1, refused.out);
  assert.match(refused.out, /--update only lowers/);
  assert.match(refused.out, /omx_fixture_undocumented/);
  assert.equal(readFileSync(s.baseline, 'utf8'), before, 'the baseline is untouched');
  const t = scratch();
  appendFileSync(t.baseline, 'omx_json_write.h: warning: Member OMX_FIXTURE_STRUCK (macro definition) of file omx_json_write.h is not documented.\n');
  const written = gate('--input', t.headers, '--baseline', t.baseline, '--update');
  assert.equal(written.status, 0, written.out);
  assert.equal(readFileSync(t.baseline, 'utf8'), readFileSync(BASELINE, 'utf8'), 'the struck line is gone, nothing else moved');
});

test('red: a header with no @file block is refused before doxygen, since doxygen would read none of it', { skip: noDoxygen }, () => {
  const s = scratch();
  const f = join(s.headers, 'omx_json_write.h');
  writeFileSync(f, readFileSync(f, 'utf8').replace('@file', '@fil_'));
  const r = gate('--input', s.headers, '--baseline', s.baseline);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /no @file doc block/);
  assert.match(r.out, /omx_json_write\.h/);
});

test('the baseline only shrinks: a line added against the base is refused, a struck line is not', { skip: noDoxygen }, () => {
  const s = scratchWithBaselined();
  const { lines } = s;
  // the base's list lacks one of today's lines: today's change added it
  const smaller = join(s.dir, 'base-smaller.txt');
  writeFileSync(smaller, `${lines.slice(1).join('\n')}\n`);
  const grown = gate('--input', s.headers, '--baseline', s.baseline, '--base-baseline', smaller);
  assert.equal(grown.status, 1, grown.out);
  assert.match(grown.out, /only shrinks/);
  assert.ok(grown.out.includes(lines[0]), lines[0]);
  // the base's list is today's: nothing added
  const same = gate('--input', s.headers, '--baseline', s.baseline, '--base-baseline', s.baseline);
  assert.equal(same.status, 0, same.out);
  // the base's list carries a line today's struck (documented since): a shrink, allowed
  const bigger = join(s.dir, 'base-bigger.txt');
  writeFileSync(bigger, `${lines.join('\n')}\nomx_json_write.h: warning: Member OMX_FIXTURE_STRUCK (macro definition) of file omx_json_write.h is not documented.\n`);
  const shrunk = gate('--input', s.headers, '--baseline', s.baseline, '--base-baseline', bigger);
  assert.equal(shrunk.status, 0, shrunk.out);
});

test('make doxygen-check: the base ref is held to; a ref git cannot read, or an empty DOXYGEN_BASE, is a refusal, exit 2', { skip: noDoxygen || (spawnSync('make', ['--version']).status !== 0 && 'no make') }, () => {
  const make = (base) => spawnSync('make', ['doxygen-check', `DOXYGEN_BASE=${base}`], { cwd: ROOT, encoding: 'utf8' });
  const head = make('HEAD');
  assert.equal(head.status, 0, `${head.stdout}${head.stderr}`);
  const none = make('no-such-ref-for-the-gate');
  assert.equal(none.status, 2, `${none.stdout}${none.stderr}`);
  assert.match(none.stderr, /no commit git can read here/);
  const empty = make('');
  assert.equal(empty.status, 2, `${empty.stdout}${empty.stderr}`);
  assert.match(empty.stderr, /set DOXYGEN_BASE/);
});

/** The gate run from a scratch directory holding `doxyfile` as its Doxyfile, over the scratch headers and baseline. */
function gateWith(doxyfile, s) {
  writeFileSync(join(s.dir, 'Doxyfile'), doxyfile);
  const r = spawnSync('sh', [join(ROOT, 'tools/doxygen-gate.sh'), '--input', s.headers, '--baseline', s.baseline], { cwd: s.dir, encoding: 'utf8' });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

test('red: a Doxyfile that suppresses what the gate counts is a finding by key, never a lower baseline', { skip: noDoxygen }, () => {
  const s = scratch();
  const doxyfile = readFileSync(join(ROOT, 'Doxyfile'), 'utf8');
  const same = gateWith(doxyfile, s);
  assert.equal(same.status, 0, same.out);
  for (const [planted, key] of [['EXCLUDE_SYMBOLS = omx_*', 'EXCLUDE_SYMBOLS'], ['WARN_IF_UNDOCUMENTED = NO', 'WARN_IF_UNDOCUMENTED'], ['HIDE_UNDOC_MEMBERS = YES', 'HIDE_UNDOC_MEMBERS'], ['EXTRACT_ALL = YES', 'EXTRACT_ALL'], ['ENABLED_SECTIONS = X', 'ENABLED_SECTIONS']]) {
    const r = gateWith(`${doxyfile}${planted}\n`, s);
    assert.equal(r.status, 1, `${planted}: ${r.out}`);
    assert.match(r.out, new RegExp(`suppresses what the gate counts[\\s\\S]*${key}`), planted);
  }
  for (const [dropped, key] of [['EXTRACT_STATIC', 'EXTRACT_STATIC'], ['WARN_NO_PARAMDOC', 'WARN_NO_PARAMDOC'], ['WARN_IF_UNDOC_ENUM_VAL', 'WARN_IF_UNDOC_ENUM_VAL'], ['MACRO_EXPANSION', 'MACRO_EXPANSION']]) {
    const r = gateWith(doxyfile.replace(new RegExp(`^${dropped} .*$`, 'm'), ''), s);
    assert.equal(r.status, 1, `${dropped}: ${r.out}`);
    assert.match(r.out, new RegExp(`drops a setting the gate needs: ${key}`));
  }
});

test('red: a header that hides a new function under @cond is refused by name, and so is a @file in a plain comment', { skip: noDoxygen }, () => {
  const s = scratch();
  addBeforeGuardEnd(join(s.headers, 'omx_json_write.h'), '/// @cond HIDDEN\nstatic inline int omx_fixture_hidden(int a) { return a; }\n/// @endcond');
  const hidden = gate('--input', s.headers, '--baseline', s.baseline);
  assert.equal(hidden.status, 1, hidden.out);
  assert.match(hidden.out, /hides code from doxygen \(@cond\)/);
  assert.match(hidden.out, /omx_json_write\.h:\d+:.*@cond HIDDEN/);
  const t = scratch();
  const f = join(t.headers, 'omx_json_write.h');
  writeFileSync(f, readFileSync(f, 'utf8').replace(/\/\*\* @file[\s\S]*?\*\//, '// @file\n// @brief A plain comment, which doxygen does not read.'));
  assert.match(readFileSync(f, 'utf8'), /^\/\/ @file$/m, 'the fixture holds a plain-comment @file');
  const plain = gate('--input', t.headers, '--baseline', t.baseline);
  assert.equal(plain.status, 1, plain.out);
  assert.match(plain.out, /no @file doc block/);
  assert.match(plain.out, /omx_json_write\.h/);
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
