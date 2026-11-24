// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// #71: the two shape generators are pinned with their whole dependency trees, since a dependency that formats
// differently (prettier, black) changes the committed bytes and --check would go red for no change of ours.
//  - Python: tools/shapes-constraints.txt pins every package of the pinned datamodel-code-generator's tree, and every
//    workflow installs the generator with it (-c); an installed generator's tree is held to it package by package.
//  - TypeScript: package-lock.json (npm ci) is the pin of json-schema-to-typescript's tree: the generator at its
//    package.json pin and every package it reaches, each with a version and an integrity.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { pyGeneratorPin, pyGeneratorVersion, tsGeneratorPin } from '../render/shapes.mjs';
import { ROOT } from './helpers.mjs';

const CONSTRAINTS = join(ROOT, 'tools/shapes-constraints.txt');
const norm = (n) => n.toLowerCase().replace(/[-_.]+/g, '-');

/** The pins of a constraints text, `Map<normalised name, version>`; a line that is not `name==version` is thrown. */
export function constraintsOf(text) {
  const out = new Map();
  for (const line of text.split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const m = /^([A-Za-z0-9][A-Za-z0-9._-]*)==(\S+)$/.exec(line);
    if (!m) throw new Error(`not a pin name==version: ${line}`);
    out.set(norm(m[1]), m[2]);
  }
  return out;
}

/** The packages of a v3 package-lock.json that `name` reaches, as node resolves them: `[{ path, version, integrity }]`. */
export function lockTree(lock, name) {
  const pkgs = lock.packages ?? {};
  const resolve = (from, dep) => {
    for (let at = from; ; at = at.slice(0, at.lastIndexOf('/node_modules/'))) {
      const p = `${at ? `${at}/` : ''}node_modules/${dep}`;
      if (pkgs[p]) return p;
      if (!at.includes('/node_modules/')) return pkgs[`node_modules/${dep}`] ? `node_modules/${dep}` : undefined;
    }
  };
  const seen = new Map();
  const walk = (path, want) => {
    if (path === undefined) throw new Error(`package-lock.json does not resolve ${want}`);
    if (seen.has(path)) return;
    const p = pkgs[path];
    seen.set(path, { path, version: p.version, integrity: p.integrity });
    for (const dep of Object.keys(p.dependencies ?? {})) walk(resolve(path, dep), dep);
  };
  walk(`node_modules/${name}`, name);
  return [...seen.values()];
}

test('tools/shapes-constraints.txt pins the generator at its requirements pin, each line name==version', () => {
  assert.ok(existsSync(CONSTRAINTS), 'tools/shapes-constraints.txt: the generator\'s dependency tree is pinned');
  const pins = constraintsOf(readFileSync(CONSTRAINTS, 'utf8'));
  assert.equal(pins.get('datamodel-code-generator'), pyGeneratorPin(ROOT), 'the constraints hold the generator at the requirements pin');
  assert.ok(pins.size > 1, 'and its dependencies');
  assert.throws(() => constraintsOf('black>=24\n'), /not a pin/, 'a range is no pin');
});

test('every workflow that installs the Python generator installs it with the constraints', () => {
  const dir = join(ROOT, '.github/workflows');
  const lines = readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).flatMap((f) => readFileSync(join(dir, f), 'utf8').split('\n').filter((l) => /shapes-requirements\.txt/.test(l) && !/^\s*#/.test(l)).map((l) => `${f}: ${l.trim()}`));
  assert.ok(lines.length > 0, 'a workflow installs the generator');
  assert.deepEqual(lines.filter((l) => !/-c tools\/shapes-constraints\.txt/.test(l)), [], 'pip install -r tools/shapes-requirements.txt -c tools/shapes-constraints.txt');
});

// The installed generator's tree, read by the interpreter that runs it, against the constraints: complete and equal.
const pyGenerator = pyGeneratorVersion();
test('the installed Python generator\'s whole tree is in the constraints, at the constrained versions', { skip: pyGenerator.ok || process.env.CI ? false : pyGenerator.why }, () => {
  const cmd = process.env.OMX_DATAMODEL_CODEGEN || spawnSync('sh', ['-c', 'command -v datamodel-codegen'], { encoding: 'utf8' }).stdout.trim();
  // a venv's own interpreter beside the command (a long venv path gets a sh shebang), else the command's shebang
  const sibling = join(dirname(cmd), 'python3');
  const python = existsSync(sibling) ? sibling : /^#!\s*(\S+)/.exec(readFileSync(cmd, 'utf8'))?.[1] ?? 'python3';
  const script = [
    'import importlib.metadata as m, json, re',
    'from packaging.requirements import Requirement',
    'seen = {}',
    'def walk(n):',
    '    k = re.sub(r"[-_.]+", "-", n).lower()',
    '    if k in seen: return',
    '    d = m.distribution(n); seen[k] = d.version',
    '    for r in d.requires or []:',
    '        q = Requirement(r)',
    '        if q.marker is None or q.marker.evaluate({"extra": ""}): walk(q.name)',
    'walk("datamodel-code-generator")',
    'print(json.dumps(seen))',
  ].join('\n');
  const r = spawnSync(python, ['-c', script], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const installed = new Map(Object.entries(JSON.parse(r.stdout)));
  const pins = constraintsOf(readFileSync(CONSTRAINTS, 'utf8'));
  assert.ok(installed.size > 1, `the walk reached the dependencies: ${[...installed.keys()]}`);
  const off = [...installed].filter(([n, v]) => pins.get(n) !== v).map(([n, v]) => `${n} ${v} (constrained ${pins.get(n) ?? 'nowhere'})`);
  assert.deepEqual(off, [], 'every package of the installed tree is constrained, at the installed version');
  assert.deepEqual([...pins.keys()].filter((n) => !installed.has(n)), [], 'and the constraints name nothing outside the tree');
});

test('package-lock.json pins json-schema-to-typescript and every package it reaches, with an integrity', () => {
  const lock = JSON.parse(readFileSync(join(ROOT, 'package-lock.json'), 'utf8'));
  assert.ok(lock.lockfileVersion >= 2, 'a lockfile with the packages map');
  const tree = lockTree(lock, 'json-schema-to-typescript');
  assert.equal(tree[0].version, tsGeneratorPin(ROOT), 'the lockfile holds the generator at the package.json pin');
  assert.ok(tree.length > 1, 'and its dependencies');
  assert.deepEqual(tree.filter((p) => !p.version || !/^sha(256|384|512)-/.test(p.integrity ?? '')), [], 'every package of the tree has a version and an integrity');
  // the walk is right: a dependency the lockfile does not hold is named, never skipped
  const cut = structuredClone(lock);
  const dep = Object.keys(cut.packages['node_modules/json-schema-to-typescript'].dependencies)[0];
  for (const k of Object.keys(cut.packages)) if (k.endsWith(`node_modules/${dep}`)) delete cut.packages[k];
  assert.throws(() => lockTree(cut, 'json-schema-to-typescript'), new RegExp(`does not resolve ${dep.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}`));
});
