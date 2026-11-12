// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The Python position-law reader (share/omx-contract/omx_contract_scale.py, docs/scale-position.md, omx-contract#20):
// LAWS, effective_law, scale_position and scale_value, the twin of lib/scale.mjs, held to the same
// data/scale-vectors.json both ways within one ulp, so a Python surface such as Zynthian
// (zyngine/zynthian_position_law.py) can call it instead of restating the law.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { ROOT } from './helpers.mjs';

const MODULE = join(ROOT, 'share/omx-contract/omx_contract_scale.py');
const VECTORS = JSON.parse(readFileSync(join(ROOT, 'data/scale-vectors.json'), 'utf8'));
const ULP = VECTORS.ulp;
const hasPython = spawnSync('python3', ['--version']).status === 0;

/** Within one ulp: relative to the expected, absolute where it is zero. */
const near = (got, want) => Math.abs(got - want) <= ULP * Math.max(Math.abs(want), 1e-300) || got === want;

function run(code) {
  const r = spawnSync('python3', ['-I', '-c', `import runpy\nm = runpy.run_path(${JSON.stringify(MODULE)})\n${code}`], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout;
}

/** scale_position(travel, row.value) and scale_value(travel, row.p) for every row, as [[gotP, gotV], ...]. */
function runLaw(travel, rows) {
  const out = run(`
import json
travel = json.loads(${JSON.stringify(JSON.stringify(travel))})
rows = json.loads(${JSON.stringify(JSON.stringify(rows))})
out = [[m["scale_position"](travel, r["value"]), m["scale_value"](travel, r["p"])] for r in rows]
print(json.dumps(out))
`);
  return JSON.parse(out.trim());
}

test('LAWS: linear, log, stepped, map', { skip: !hasPython && 'no python3' }, () => {
  assert.equal(run(`print(m["LAWS"])`).trim(), "('linear', 'log', 'stepped', 'map')");
});

test('the vectors pass both ways within one ulp', { skip: !hasPython && 'no python3' }, () => {
  const misses = [];
  for (const [law, { travel, rows }] of Object.entries(VECTORS.laws)) {
    const got = runLaw(travel, rows);
    rows.forEach((row, i) => {
      const [gotP, gotV] = got[i];
      const wantV = row.valueAtP ?? row.value;
      if (!near(gotP, row.p)) misses.push(`${law}: position of ${row.value} is ${gotP}, not ${row.p}`);
      if (!near(gotV, wantV)) misses.push(`${law}: value at ${row.p} is ${gotV}, not ${wantV}`);
    });
  }
  assert.deepEqual(misses, []);
});

test('effective_law: a positive floor is log, a floor that is not positive or unknown is linear', { skip: !hasPython && 'no python3' }, () => {
  const out = run(`
print(m["effective_law"]({"scale": "log", "min": 20, "max": 20000}))
print(m["effective_law"]({"scale": "log", "min": 0, "max": 1000}))
print(m["effective_law"]({"scale": "unknown", "min": 0, "max": 1}))
print(m["effective_law"]({"scale": "stepped", "min": 0, "max": 8, "step": 2}))
`);
  assert.deepEqual(out.trim().split('\n'), ['log', 'linear', 'linear', 'stepped']);
});

test('a value outside the travel is not clamped; the ends are exact', { skip: !hasPython && 'no python3' }, () => {
  const out = run(`
t = {"scale": "log", "min": 20, "max": 20000}
print(m["scale_position"](t, 20))
print(m["scale_position"](t, 20000))
print(m["scale_value"](t, 0))
print(m["scale_value"](t, 1))
print(m["scale_position"]({"scale": "linear", "min": 0, "max": 10}, 12) > 1)
`);
  assert.deepEqual(out.trim().split('\n'), ['0', '1', '20', '20000', 'True']);
});

test('stepped: a value between steps lands on the nearest step; a step is an index over the steps', { skip: !hasPython && 'no python3' }, () => {
  const out = run(`
t = {"scale": "stepped", "min": 10, "max": 90, "step": 10}
print(m["scale_position"](t, 37))
print(m["scale_value"](t, 0.45))
print(m["scale_value"](t, 2))
`);
  assert.deepEqual(out.trim().split('\n'), ['0.375', '50', '90']);
});

test('refused: a stepped travel without a step, an unknown word, a travel that does not run upward, a map with one point', { skip: !hasPython && 'no python3' }, () => {
  const out = run(`
import traceback
def refused(fn):
    try:
        fn()
        return False
    except ValueError:
        return True
print(refused(lambda: m["scale_position"]({"scale": "stepped", "min": 0, "max": 8}, 1)))
print(refused(lambda: m["scale_position"]({"scale": "wobble", "min": 0, "max": 8}, 1)))
print(refused(lambda: m["scale_position"]({"scale": "linear", "min": 8, "max": 8}, 8)))
print(refused(lambda: m["scale_value"]({"scale": "map", "points": [[0, 0]]}, 0.5)))
`);
  assert.deepEqual(out.trim().split('\n'), ['True', 'True', 'True', 'True']);
});

test('render --check: the package manifests ship the python scale reader beside omx_contract.py', () => {
  for (const f of [join(ROOT, 'debian/omx-contract-data.install'), join(ROOT, 'packaging/omx-contract.spec'), join(ROOT, 'Makefile')]) {
    const text = readFileSync(f, 'utf8');
    assert.match(text, /omx_contract_scale\.py/, f);
  }
});
