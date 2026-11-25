// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
//
// The previous release the release gate's semver step compares with (tools/previous-tag.sh, release.yml "The bump
// covers every change since the previous tag"): the newest tag of the version's own major. 0.23.0 follows v3.22.0 and
// v3.23.0 (the owner's ruling of 2026-11-25: every version is 0.M.m until 1.0), so a pick across majors would compare
// 0.23.0 with a v3 tag and refuse it as a lower version.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { ROOT, scratchDir } from './helpers.mjs';

const TOOL = join(ROOT, 'tools/previous-tag.sh');

/** A scratch repository holding one commit per tag, in order; `after` tags sit on a commit HEAD does not reach. */
function repo(tags, after = []) {
  const dir = scratchDir('omx-previous-tag-');
  const git = (...a) => {
    const r = spawnSync('git', ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...a], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    return r.stdout;
  };
  git('init', '-q', '-b', 'main');
  const commit = (t) => { writeFileSync(join(dir, 'f'), t); git('add', 'f'); git('commit', '-q', '-m', t); git('tag', t); };
  for (const t of tags) commit(t);
  if (after.length) {
    git('checkout', '-q', '-b', 'later');
    for (const t of after) commit(t);
    git('checkout', '-q', 'main');
  }
  return (version) => spawnSync('sh', [TOOL, version], { cwd: dir, encoding: 'utf8' });
}

test('previous-tag: the newest tag of the version\'s own major, never one of another major', () => {
  const pick = repo(['v3.21.0', 'v3.22.0', 'v3.23.0']);
  const first = pick('0.23.0');
  assert.equal(first.status, 0, first.stderr);
  assert.equal(first.stdout, '', 'the first release of the 0 major has no previous tag: v3.23.0 is not it');
  // positive control: the same repository answers a v3 version with its newest v3 tag
  assert.equal(pick('3.24.0').stdout, 'v3.23.0\n');
  assert.equal(pick('3.23.0').stdout, 'v3.22.0\n', 'the version\'s own tag is never its previous release');
});

test('previous-tag: a v0 tag below the version is compared, the newest by version order, never a v3 one', () => {
  const pick = repo(['v3.22.0', 'v0.23.0', 'v3.23.0', 'v0.23.1', 'v0.24.0']);
  assert.equal(pick('0.25.0').stdout, 'v0.24.0\n');
  assert.equal(pick('0.24.0').stdout, 'v0.23.1\n');
  // v0.10.0 sorts above v0.9.0 by version, not by text
  assert.equal(repo(['v0.9.0', 'v0.10.0'])('0.11.0').stdout, 'v0.10.0\n');
  // a v10 tag is not of the major 1
  assert.equal(repo(['v1.2.0', 'v10.0.0'])('1.3.0').stdout, 'v1.2.0\n');
});

test('previous-tag: a tag HEAD does not reach is not the previous release; a version that is not x.y.z is refused', () => {
  const pick = repo(['v0.23.0'], ['v0.24.0']);
  assert.equal(pick('0.25.0').stdout, 'v0.23.0\n');
  for (const v of ['', '0.23', 'v0.23.0', '0.23.0-1', '0..1']) {
    const r = pick(v);
    assert.equal(r.status, 2, `'${v}' is refused`);
    assert.match(r.stderr, /is not a version x\.y\.z/);
  }
});

test('previous-tag: the release gate picks the previous tag with the tool, by package.json\'s version', () => {
  const step = readFileSync(join(ROOT, '.github/workflows/release.yml'), 'utf8').split('- name: The bump covers every change since the previous tag')[1].split('\n\n')[0];
  assert.match(step, /prev=\$\(sh tools\/previous-tag\.sh "\$version"\) \|\| exit 1/);
  assert.match(step, /version=\$\(node -p 'require\("\.\/package\.json"\)\.version'\)/);
  assert.match(step, /node bin\/omx-contract\.mjs semver "\$prev"/);
  assert.doesNotMatch(step, /git tag --list 'v\*'/, 'no pick across every major is left in the step');
});
