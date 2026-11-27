// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// release.yml: a dispatch with staged on BUILDS (the staging channel, the whole matrix by default); a v* tag PROMOTES that
// build through Open-Mixer/.github promote-staged.yml and builds nothing (owner ruling 2026-11-24: tag = promotion on
// main, npm latest at the promotion). What the layers above were built against is what ships.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const WORKFLOW = readFileSync(join(ROOT, '.github/workflows/release.yml'), 'utf8');

/** The top-level jobs of a workflow's text, each by name: the lines from `  <name>:` to the next job. */
export function jobs(text) {
  const body = text.slice(text.indexOf('\njobs:\n') + 7);
  const out = {};
  let name;
  for (const line of body.split('\n')) {
    const m = /^ {2}([a-z][a-z0-9-]*):$/.exec(line);
    if (m) { name = m[1]; out[name] = ''; continue; }
    if (name) out[name] += `${line}\n`;
  }
  return out;
}

const field = (job, key) => new RegExp(`^ {4}${key}: (.+)$`, 'm').exec(job)?.[1]?.trim();
const names = (job) => (/^ {6}binary-names: (.+)$/m.exec(job)?.[1] ?? '').trim().split(/\s+/);

/** Every finding of the release workflow `text` against the two paths, as sentences; [] when it holds. */
export function findings(text) {
  const out = [];
  const j = jobs(text);
  const on = text.slice(text.indexOf('\non:\n'), text.indexOf('\njobs:\n'));
  if (!/tags: \['v\*'\]/.test(on)) out.push('the workflow does not run on a v* tag');
  for (const kind of ['rpm', 'deb']) {
    const job = j[kind] ?? '';
    if (!job.includes(`uses: Open-Mixer/.github/.github/workflows/build-${kind}.yml@openmixer-v1`)) out.push(`${kind}: not the shared build-${kind}.yml`);
    const cond = field(job, 'if') ?? '';
    if (!/github\.event_name == 'workflow_dispatch'/.test(cond) || /ref_type == 'tag'|refs\/tags/.test(cond)) out.push(`${kind}: builds on a tag (its if is "${cond}"): a tag promotes, it never builds`);
    if (!/inputs\.version == ''/.test(cond)) out.push(`${kind}: builds on a promotion dry run (no inputs.version == '' in its if)`);
    if (!/^ {6}publish: false$/m.test(job)) out.push(`${kind}: publish is not false: only the staged build and the promotion publish`);
    if (!/^ {6}matrix: \$\{\{ inputs\.matrix \}\}$/m.test(job)) out.push(`${kind}: the staged build does not take the matrix input`);
  }
  const matrix = /^ {6}matrix:\n((?: {8}.*\n)+)/m.exec(on)?.[1] ?? '';
  if (!/^ {8}default: quick$/m.test(matrix)) out.push('the matrix input does not default to quick (the staging of every devel run)');
  if (!/^ {8}options: \[quick, full\]$/m.test(matrix)) out.push('the matrix input does not offer full (a promotion candidate is dispatched with matrix=full)');
  const promote = j.promote ?? '';
  if (!promote.includes('uses: Open-Mixer/.github/.github/workflows/promote-staged.yml@openmixer-v1')) out.push('promote: no job calls promote-staged.yml@openmixer-v1');
  if (!/github\.ref_type == 'tag'/.test(field(promote, 'if') ?? '')) out.push('promote: does not run on a tag');
  if (field(promote, 'needs') !== 'check') out.push('promote: does not wait for check (the tag on main, the tests)');
  if (!/^ {4}secrets: inherit$/m.test(promote)) out.push('promote: no signing secrets (secrets: inherit)');
  if (!/^ {6}package-name: omx-contract$/m.test(promote)) out.push('promote: package-name is not omx-contract');
  const rpm = new Set(names(j.rpm ?? '')), deb = new Set(names(j.deb ?? ''));
  for (const n of names(promote).filter(Boolean)) if (!rpm.has(n) || !deb.has(n)) out.push(`promote: binary-names names ${n}, which the rpm and deb builds do not both build`);
  if (!names(promote).filter(Boolean).length) out.push('promote: no binary-names');
  const check = j.check ?? '';
  if (!/- name: The tag is on main\n {8}if: github\.ref_type == 'tag'\n/.test(check)
    || !/git rev-parse -q --verify origin\/main/.test(check) || !/git merge-base --is-ancestor "\$GITHUB_SHA" "\$main"/.test(check)) {
    out.push('check: no step refuses a tag whose commit is not on main');
  }
  if (!/^ {4}needs: \[pack, promote\]$/m.test(j.attach ?? '')) out.push('attach: does not wait for the promotion (the release it creates)');
  for (const [name, job] of Object.entries(j)) {
    if (/build-(rpm|deb)\.yml/.test(job) && !['rpm', 'deb'].includes(name)) out.push(`${name}: another job builds packages`);
  }
  return out;
}

test('release.yml: a dispatch builds staged (the quick set by default, full on request), a v* tag on main promotes that build and builds nothing', () => {
  assert.deepEqual(findings(WORKFLOW), []);
});

// each arm is a release.yml a careless edit could leave; each must be named
const ARMS = [
  ['the rpm build back on the tag', (t) => t.replace(/( {2}rpm:\n {4}# the build path:[^\n]*\n) {4}if: [^\n]*\n/, "$1    if: github.event_name == 'workflow_dispatch' || github.ref_type == 'tag'\n"), /rpm: builds on a tag/],
  ['the deb build publishing on the tag', (t) => t.replace(/(\n {2}deb:\n[\s\S]*?) {6}publish: false\n/, "$1      publish: ${{ github.event_name == 'push' && startsWith(github.ref, 'refs/tags/') }}\n"), /deb: publish is not false/],
  ['the promote job gone', (t) => t.replace(/\n {2}promote:\n[\s\S]*?\n {2}pack:\n/, '\n  pack:\n'), /promote: no job calls promote-staged/],
  ['full by default', (t) => t.replace('        default: quick\n', '        default: full\n'), /does not default to quick/],
  ['full not offered', (t) => t.replace('        options: [quick, full]\n', '        options: [quick]\n'), /does not offer full/],
  ['a binary only the rpm builds', (t) => t.replace('binary-names: omx-contract omx-contract-data python3-omx-contract', 'binary-names: omx-contract omx-contract-devel'), /names omx-contract-devel, which the rpm and deb builds do not both build/],
  ['the on-main step gone', (t) => t.replace(/ {6}- name: The tag is on main\n[\s\S]*?fast-forward main to it first"; exit 1; \}\n/, ''), /check: no step refuses a tag whose commit is not on main/],
  ['promote without its secrets', (t) => t.replace(/(\n {2}promote:\n[\s\S]*?) {4}secrets: inherit\n/, '$1'), /promote: no signing secrets/],
];

test('each careless edit is named (the check is not blind)', () => {
  for (const [label, edit, want] of ARMS) {
    const planted = edit(WORKFLOW);
    assert.notEqual(planted, WORKFLOW, `${label}: the arm no longer applies`);
    const got = findings(planted);
    assert.ok(got.some((f) => want.test(f)), `${label}: not named (${JSON.stringify(got)})`);
  }
});

// publish.yml: npm follows the promotion, never the bare tag. It runs when release completes, and only for a v* tag push
// of this repository whose run concluded success and whose promote jobs all read success.
const PUBLISH = readFileSync(join(ROOT, '.github/workflows/publish.yml'), 'utf8');

/** Every finding of publish.yml `text` against "npm at the promotion", as sentences; [] when it holds. */
export function publishFindings(text) {
  const out = [];
  const on = text.slice(text.indexOf('\non:\n'), text.indexOf('\npermissions:\n'));
  if (/^ {2}push:/m.test(on) || /tags:/.test(on)) out.push('publish.yml runs on a tag push: npm would move before (or without) the promotion');
  if (!/^ {2}workflow_run:\n {4}workflows: \[release\]\n {4}types: \[completed\]$/m.test(on)) out.push('publish.yml does not run on release completing');
  const job = jobs(text).publish ?? '';
  const cond = /^ {4}if: >-\n((?: {6}.*\n)+)/m.exec(job)?.[1] ?? '';
  for (const [want, why] of [
    [/github\.event\.workflow_run\.conclusion == 'success'/, 'the release run concluded success'],
    [/github\.event\.workflow_run\.event == 'push'/, 'the release run was a push'],
    [/startsWith\(github\.event\.workflow_run\.head_branch, 'v'\)/, 'the push was a v* tag'],
    [/github\.event\.workflow_run\.head_repository\.full_name == github\.repository/, 'the run is of this repository'],
  ]) if (!want.test(cond)) out.push(`publish: its if does not ask that ${why}`);
  if (!/- name: The release run promoted the tag\n {8}if: github\.event_name == 'workflow_run'\n/.test(job)) out.push('publish: no step reads the promote jobs before publishing');
  if (!/^ {10}ref: \$\{\{ env\.SHA \}\}$/m.test(job)) out.push('publish: does not check out the tag\'s commit (workflow_run starts on the default branch)');
  if (job.indexOf('The release run promoted the tag') > job.indexOf('npm publish')) out.push('publish: the promotion is read after the publish');
  // npm 11 applies latest implicitly only to a version above the one latest names; the 0.M.m line sits below 3.x
  const publish = /^ {8}run: (npm publish\b.*)$/m.exec(job)?.[1] ?? '';
  if (!publish) out.push('publish: no npm publish step');
  else if (!/(^| )--tag latest( |$)/.test(publish)) out.push(`publish: npm publish names no --tag latest ("${publish}"): npm 11 refuses to move latest below 3.21.0`);
  return out;
}

/** The shell of publish.yml's promotion gate, its jobs list read from `tsv` instead of the API: the gate's exit status. */
function gate(tsv) {
  const step = /- name: The release run promoted the tag\n[\s\S]*? {8}run: \|\n((?: {10}.*\n)+)/.exec(PUBLISH)[1].replace(/^ {10}/gm, '');
  const script = step.replace(/^gh api .*> jobs\.tsv$/m, 'cp "$FIXTURE" jobs.tsv');
  assert.notEqual(script, step, 'positive control: the gate reads the jobs through gh api into jobs.tsv');
  const dir = mkdtempSync(join(tmpdir(), 'omx-contract-gate-'));
  try {
    writeFileSync(join(dir, 'fixture.tsv'), tsv);
    return spawnSync('bash', ['-c', script], { cwd: dir, env: { ...process.env, FIXTURE: join(dir, 'fixture.tsv'), TAG: 'v9.9.9', RUN: '1' }, encoding: 'utf8' }).status;
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

test('publish.yml: npm runs on release completing, never on the tag, and asks for a successful promotion', () => {
  assert.deepEqual(publishFindings(PUBLISH), []);
});

test('a refused promotion leaves npm untouched: the gate stops on a failed, skipped or missing promote job', () => {
  // the jobs of a real tag run (omx-contract v3.22.0, run 45524728510): the dry-run-only unsigned trees are skipped
  const ok = ['check\tsuccess', 'promote / Find the staged build\tsuccess', 'promote / Assemble the unsigned RPM tree, nothing is published\tskipped',
    'promote / Assemble the unsigned DEB tree, nothing is published\tskipped', 'promote / Promote the RPMs\tsuccess', 'promote / Promote the DEBs\tsuccess',
    'promote / The channel serves the same bytes\tsuccess', 'promote / Install check (fc45, x86_64)\tsuccess', 'promote / Release gate\tsuccess',
    'promote / GitHub release\tsuccess', 'pack\tsuccess', ''].join('\n');
  assert.equal(gate(ok), 0, 'positive control: a promotion whose publishing jobs succeeded, its dry-run-only trees skipped, publishes');
  assert.equal(gate(ok.replace('promote / Find the staged build\tsuccess', 'promote / Find the staged build\tfailure')), 1, 'a refused promotion (the staged tree incomplete)');
  assert.equal(gate(ok.replace('promote / Promote the DEBs\tsuccess', 'promote / Promote the DEBs\tskipped')), 1, 'a promotion that never published the DEBs');
  assert.equal(gate(ok.replace('promote / GitHub release\tsuccess\n', '')), 1, 'a promotion with no GitHub release job');
  assert.equal(gate(ok.replace('promote / Install check (fc45, x86_64)\tsuccess', 'promote / Install check (fc45, x86_64)\tcancelled')), 1, 'a cancelled install check');
  assert.equal(gate(ok.replace('promote / Install check (fc45, x86_64)\tsuccess', 'promote / Install check (fc45, x86_64)\tskipped')), 1, 'a skipped install check');
  assert.equal(gate(ok.replace('promote / Release gate\tsuccess', 'promote / Release gate\tskipped')), 1, 'a skipped release gate');
  assert.equal(gate('check\tfailure\npack\tsuccess\n'), 1, 'no promote job ran (the tag not on main stops check)');
});

const PUBLISH_ARMS = [
  ['the tag trigger back', (t) => t.replace("on:\n  workflow_run:\n", "on:\n  push:\n    tags: ['v*']\n  workflow_run:\n"), /runs on a tag push/],
  ['no conclusion asked', (t) => t.replace("github.event.workflow_run.conclusion == 'success' && ", ''), /concluded success/],
  ['the gate step gone', (t) => t.replace('- name: The release run promoted the tag', '- name: Note the release run'), /no step reads the promote jobs/],
  ['the default branch checked out', (t) => t.replace('          ref: ${{ env.SHA }}\n', ''), /does not check out the tag's commit/],
  ['the explicit latest tag dropped', (t) => t.replace(' --tag latest $DRY', ' $DRY'), /names no --tag latest/],
  ['another dist-tag named', (t) => t.replace(' --tag latest $DRY', ' --tag next $DRY'), /names no --tag latest/],
];

test('each careless edit of publish.yml is named', () => {
  for (const [label, edit, want] of PUBLISH_ARMS) {
    const planted = edit(PUBLISH);
    assert.notEqual(planted, PUBLISH, `${label}: the arm no longer applies`);
    assert.ok(publishFindings(planted).some((f) => want.test(f)), `${label}: not named (${JSON.stringify(publishFindings(planted))})`);
  }
});
