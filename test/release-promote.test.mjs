// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// release.yml: a dispatch with staged on BUILDS (the staging channel, the whole matrix by default); a v* tag PROMOTES that
// build through Open-Mixer/.github promote-staged.yml and builds nothing (owner ruling 2026-11-24: tag = promotion on
// main, npm latest at the promotion). What the layers above were built against is what ships.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
  if (!/^ {6}matrix:\n(?: {8}.*\n)*? {8}default: full$/m.test(on)) out.push('the matrix input does not default to full (a quick staged tree cannot be promoted)');
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

test('release.yml: a dispatch builds staged (full matrix by default), a v* tag on main promotes that build and builds nothing', () => {
  assert.deepEqual(findings(WORKFLOW), []);
});

// each arm is a release.yml a careless edit could leave; each must be named
const ARMS = [
  ['the rpm build back on the tag', (t) => t.replace("  rpm:\n    # the build path: a dispatch, never a tag (a tag promotes what this staged)\n    if: github.event_name == 'workflow_dispatch' && inputs.version == ''\n", "  rpm:\n    if: github.event_name == 'workflow_dispatch' || github.ref_type == 'tag'\n"), /rpm: builds on a tag/],
  ['the deb build publishing on the tag', (t) => t.replace(/(\n {2}deb:\n[\s\S]*?) {6}publish: false\n/, "$1      publish: ${{ github.event_name == 'push' && startsWith(github.ref, 'refs/tags/') }}\n"), /deb: publish is not false/],
  ['the promote job gone', (t) => t.replace(/\n {2}promote:\n[\s\S]*?\n {2}pack:\n/, '\n  pack:\n'), /promote: no job calls promote-staged/],
  ['the quick set by default', (t) => t.replace('        default: full\n', '        default: quick\n'), /does not default to full/],
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
