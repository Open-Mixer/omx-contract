// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The shared domain conformance suite, TypeScript side. test/fixtures/conformance/cases.json lists domain documents,
// each a contract directory holding one domain, with its expected verdict; test/c/conformance_test.c runs the same list
// through the C loader (omx_domain_open_at). Three things are asserted here:
//   1. openDomainAt (lib/domain-reader.mjs, the reader beside the C loader) gives each case its `verdict`: ok, or the
//      contract code and a message that names the member the refusal is about;
//   2. loadContractDir (the build's reader, with the full schema checks) gives each case its `build` verdict, a
//      refusal code, where the case has one (a rule only the build checks: an unknown key, a prefix, a stray file),
//      else the case's `verdict` code;
//   3. the C loader and openDomainAt agree on every case, code and member: skipped, with its reason stated, only when
//      the C runner is not built; with OMX_CONFORMANCE_C=required (CI, after make test-c) an absent runner fails.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { ContractRefusal } from '../lib/codes.mjs';
import { loadContractDir } from '../lib/contract-dir.mjs';
import { openDomainAt } from '../lib/domain-reader.mjs';
import { ROOT } from './helpers.mjs';

const SUITE = join(ROOT, 'test/fixtures/conformance');
const CASES = JSON.parse(readFileSync(join(SUITE, 'cases.json'), 'utf8'));
const C_RUNNER = join(ROOT, 'build/test-c/conformance_test');

/** 'ok', or { code, text } of the refusal `run` raises (text: the line a user reads, file and message). */
function verdict(run) {
  try { run(); return 'ok'; } catch (e) {
    if (!(e instanceof ContractRefusal)) throw e;
    return { code: e.code, text: `${e.file}: ${e.message}` };
  }
}
const runtime = ({ case: name, domain, needs }) => verdict(() => openDomainAt(join(SUITE, name), domain, needs));
const build = ({ case: name, domain, needs }) => verdict(() => {
  const read = loadContractDir({ dir: join(SUITE, name), needs: needs === null ? {} : { [domain]: `>= ${needs}` } });
  assert.ok(read.packages.has(domain), `the read holds no domain ${domain}`);
});
const want = (c) => (c.verdict === 'ok' ? 'ok' : `${c.verdict.code} naming "${c.verdict.member}"`);

for (const c of CASES) {
  test(`domain conformance, openDomainAt: ${c.case}`, () => {
    const got = runtime(c);
    if (c.verdict === 'ok') return assert.equal(got, 'ok', `wanted ok, got ${got.code}: ${got.text}`);
    assert.notEqual(got, 'ok', `wanted ${want(c)}, got ok`);
    assert.equal(got.code, c.verdict.code, `wanted ${want(c)}, got ${got.code}: ${got.text}`);
    assert.ok(got.text.includes(c.verdict.member), `wanted ${want(c)}, got it without: ${got.text}`);
  });
  test(`domain conformance, loadContractDir: ${c.case}`, () => {
    const got = build(c);
    const code = (c.build ?? c.verdict)?.code;
    if (code === undefined) return assert.equal(got, 'ok', `wanted ok, got ${got.code}: ${got.text}`);
    assert.notEqual(got, 'ok', `wanted ${code}, got ok`);
    assert.equal(got.code, code, `wanted ${code}, got ${got.code}: ${got.text}`);
    if (c.build === undefined) assert.ok(got.text.includes(c.verdict.member), `wanted ${want(c)}, got it without: ${got.text}`);
  });
}

const C_REQUIRED = process.env['OMX_CONFORMANCE_C'] === 'required';

test('domain conformance: the C loader and openDomainAt give one verdict per case', { skip: existsSync(C_RUNNER) || C_REQUIRED ? false : `${C_RUNNER} is not built (make test-c builds it)` }, () => {
  assert.ok(existsSync(C_RUNNER), `${C_RUNNER} is not built, and OMX_CONFORMANCE_C=required: run make test-c first`);
  const run = spawnSync(C_RUNNER, ['--verdicts', SUITE], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  const c = new Map(run.stdout.trim().split('\n').map((l) => { const [name, code, ...text] = l.split(' '); return [name, { code, text: text.join(' ') }]; }));
  assert.deepEqual([...c.keys()].sort(), CASES.map((x) => x.case).sort(), 'the C runner ran another list of cases');
  const differ = CASES.flatMap((x) => {
    const ts = runtime(x);
    const have = c.get(x.case);
    const member = x.verdict === 'ok' ? undefined : x.verdict.member;
    if ((ts === 'ok' ? 'ok' : ts.code) !== have.code) return [`${x.case}: C ${have.code}, TS ${ts === 'ok' ? 'ok' : ts.code}`];
    if (member !== undefined && !(have.text.includes(member) && ts.text.includes(member))) return [`${x.case}: C and TS refuse with ${have.code}, and one does not name "${member}"`];
    return [];
  });
  assert.deepEqual(differ, [], `the readers differ on ${differ.length} case(s)`);
});
