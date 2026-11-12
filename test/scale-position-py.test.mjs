// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The Python position-law reader (share/omx-contract/omx_contract_scale.py, docs/scale-position.md, omx-contract#20):
// LAWS, effective_law, scale_position and scale_value, the twin of lib/scale.mjs, held to the same
// data/scale-vectors.json both ways within one ulp, each law once wrong red, and held to the TypeScript reader itself
// on a grid over every travel, so a Python surface such as Zynthian (zyngine/zynthian_position_law.py) can call it
// instead of restating the law.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { scalePosition, scaleValue } from '../lib/scale.mjs';
import { ROOT } from './helpers.mjs';

const MODULE = join(ROOT, 'share/omx-contract/omx_contract_scale.py');
const VECTORS = JSON.parse(readFileSync(join(ROOT, 'data/scale-vectors.json'), 'utf8'));
const ULP = VECTORS.ulp;
const hasPython = spawnSync('python3', ['--version']).status === 0;

/** Within one ulp: relative to the expected, absolute where it is zero. */
const near = (got, want) => Math.abs(got - want) <= ULP * Math.max(Math.abs(want), 1e-300) || got === want;

/** Runs `code` with `m`, the reader's namespace; `source` is the reader's text when it is not the shipped one. */
function run(code, source) {
  const load = source === undefined ? `m = runpy.run_path(${JSON.stringify(MODULE)})` : `m = {}\nexec(${JSON.stringify(source)}, m)`;
  const r = spawnSync('python3', ['-I', '-c', `import runpy\n${load}\n${code}`], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout;
}

/** scale_position(travel, row.value) and scale_value(travel, row.p) for every row, as [[gotP, gotV], ...]. */
function runLaw(travel, rows, source) {
  const out = run(`
import json
travel = json.loads(${JSON.stringify(JSON.stringify(travel))})
rows = json.loads(${JSON.stringify(JSON.stringify(rows))})
out = [[m["scale_position"](travel, r["value"]), m["scale_value"](travel, r["p"])] for r in rows]
print(json.dumps(out))
`, source);
  return JSON.parse(out.trim());
}

/** Every row of every law, both ways, through the reader (or `source`, a changed copy); the mismatches as strings. */
function misses(source) {
  const out = [];
  for (const [law, { travel, rows }] of Object.entries(VECTORS.laws)) {
    const got = runLaw(travel, rows, source);
    rows.forEach((row, i) => {
      const [gotP, gotV] = got[i];
      const wantV = row.valueAtP ?? row.value;
      if (!near(gotP, row.p)) out.push(`${law}: position of ${row.value} is ${gotP}, not ${row.p}`);
      if (!near(gotV, wantV)) out.push(`${law}: value at ${row.p} is ${gotV}, not ${wantV}`);
    });
  }
  return out;
}

test('LAWS: linear, log, stepped, map', { skip: !hasPython && 'no python3' }, () => {
  assert.equal(run(`print(m["LAWS"])`).trim(), "('linear', 'log', 'stepped', 'map')");
});

test('the vectors pass both ways within one ulp', { skip: !hasPython && 'no python3' }, () => {
  assert.deepEqual(misses(), []);
});

// each law once wrong in the Python reader alone: the line of that law replaced, red on that law's rows only
const WRONG = {
  linear: ['    return (value - lo) / (hi - lo)\n\n', '    return value / hi\n\n'],
  log: ['return math.log(value / lo) / math.log(hi / lo)', 'return (value - lo) / (hi - lo)'],
  // the index over the number of steps, not over the steps less one
  stepped: ['        return k / (n - 1)', '        return k / n'],
  // the first and last point's quantities, not the pieces between
  map: ['        a, b = _piece(pts, 1, value)', '        a, b = pts[0], pts[-1]'],
};
for (const [law, [from, to]] of Object.entries(WRONG)) {
  test(`sabotage: the ${law} law wrong in the Python reader is red on the ${law} rows`, { skip: !hasPython && 'no python3' }, () => {
    const text = readFileSync(MODULE, 'utf8');
    assert.equal(text.split(from).length, 2, `the line this arm changes is in the reader once: ${from.trim()}`);
    const bad = misses(text.replace(from, to));
    assert.ok(bad.length > 0, `the wrong ${law} law passes the vectors`);
    assert.ok(bad.every((b) => b.startsWith(`${law}:`)), bad.join('; '));
  });
}

test('the twins agree: the Python and the TypeScript reader give the same position and value on a grid over every travel, and outside it', { skip: !hasPython && 'no python3' }, () => {
  const split = [];
  // each reader is within one ulp of the law (the platform's pow and log are not the same code), so two apart at most
  const near = (got, want) => Math.abs(got - want) <= 2 * ULP * Math.max(Math.abs(want), 1e-300) || got === want;
  for (const [law, { travel, rows }] of Object.entries(VECTORS.laws)) {
    const lo = scaleValue(travel, 0);
    const hi = scaleValue(travel, 1);
    // 61 positions from -0.25 to 1.25 and the values there, so the ends, the pieces and the outside are all crossed
    const grid = Array.from({ length: 61 }, (_, i) => {
      const p = -0.25 + i * 0.025;
      return { p, value: lo + p * (hi - lo) };
    }).filter((g) => law !== 'log' || g.value > 0);
    const probes = [...rows.map(({ value, p }) => ({ value, p })), ...grid];
    const got = runLaw(travel, probes);
    probes.forEach(({ value, p }, i) => {
      const [wantP, wantV] = [scalePosition(travel, value), scaleValue(travel, p)];
      if (!near(got[i][0], wantP)) split.push(`${law}: position of ${value} is ${got[i][0]} in Python, ${wantP} in TypeScript`);
      if (!near(got[i][1], wantV)) split.push(`${law}: value at ${p} is ${got[i][1]} in Python, ${wantV} in TypeScript`);
    });
  }
  assert.deepEqual(split, []);
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
