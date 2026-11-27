// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { main } from '../bin/omx-contract.mjs';
import { packageVersion } from '../lib/data.mjs';
import { readDomain } from '../lib/domain.mjs';
import { DEVELOPMENT_PHASE, bumpOf, classify, classifySchema, refusal, schemaVersionProblem, sinceProblems } from '../lib/semver.mjs';
import { DATA, ROOT, dropDecl, editData, relOf, resolvedOf, scratchData, texts } from './helpers.mjs';

const base = resolvedOf(texts());
const level = (fn) => classify(base, resolvedOf(texts(fn))).level;

test('no change is none', () => assert.equal(classify(base, base).level, 'none'));
test('doc text is PATCH', () => assert.equal(level((d) => { d['data/rates.json'].STANDARD_QUANTA.doc = 'reworded'; }), 'patch'));
test('a default moved inside its travel is MINOR', () => assert.equal(level((d, at) => { at('data/kernels/swell.json', 'SWELL_LIMITS.ratio').default = 10; }), 'minor'));
test('a travel widened is MINOR', () => assert.equal(level((d, at) => { at('data/kernels/swell.json', 'SWELL_LIMITS.ratio').max = 200; }), 'minor'));
test('a travel narrowed is MAJOR', () => assert.equal(level((d, at) => { at('data/kernels/swell.json', 'SWELL_LIMITS.ratio').max = 30; }), 'major'));
test('a unit changed is MAJOR', () => assert.equal(level((d, at) => { at('data/kernels/swell.json', 'SWELL_LIMITS.ratio').unit = '%'; }), 'major'));
test('a kernel constant changed is MAJOR', () => assert.equal(level((d, at) => { at('data/kernels/echo.json', 'ECHO_RISE_DB').value = 7; }), 'major'));
test('a derived constant changed is MAJOR', () => assert.equal(level((d) => { d[relOf('TOOL_READ_ORDER')].TOOL_READ_ORDER.value = 5; }), 'major'));
test('an item added is MINOR, removed is MINOR in the development phase and MAJOR after it', () => {
  assert.equal(level((d) => { d['data/rates.json'].NEW_RATE = { kind: 'scalar', doc: 'new', unit: 'Hz', value: 1 }; }), 'minor');
  const gone = texts((d) => { dropDecl('data/kernels/echo.json', d['data/kernels/echo.json'], 'ECHO_FEEDBACK_RANGE'); });
  const r = classify(resolvedOf(texts()), resolvedOf(gone));
  assert.equal(r.level, 'minor');
  assert.ok(r.changes[0].what.includes(`development phase: every consumer is ${DEVELOPMENT_PHASE.consumers.join(', ')}`), r.changes[0].what);
  assert.equal(classify(resolvedOf(texts()), resolvedOf(gone), { developmentPhase: null }).level, 'major');
});
test('a list member appended is MINOR, changed is MAJOR', () => {
  assert.equal(level((d) => { d['data/rates.json'].STANDARD_SAMPLE_RATES.values.push(384000); }), 'minor');
  assert.equal(level((d) => { d['data/rates.json'].STANDARD_SAMPLE_RATES.values[0] = 32000; }), 'major');
});
test('the bump must cover the class', () => {
  assert.equal(bumpOf('1.0.0', '1.1.0'), 'minor');
  assert.equal(refusal('minor', '1.0.0', '1.0.1'), 'the changes since 1.0.0 are MINOR, and 1.0.0 -> 1.0.1 is a patch bump');
  assert.equal(refusal('major', 'v1.2.3', '2.0.0'), null);
  assert.match(refusal('patch', '1.2.0', '1.1.0'), /lower/);
});

test('the CLI refuses a short bump and passes a sufficient one; a MAJOR class takes a minor in the development phase', () => {
  const dir = scratchData();
  editData(dir, 'kernels/swell.json', (d, at) => { at('SWELL_LIMITS.ratio').max = 30; });
  assert.equal(main(['semver', '--from-dir', DATA, '--from-version', '1.0.0', '--data', dir, '--version', '1.0.1']), 1);
  assert.equal(main(['semver', '--from-dir', DATA, '--from-version', '1.0.0', '--data', dir, '--version', '1.1.0']), 0);
  assert.equal(main(['semver', '--from-dir', DATA, '--from-version', '1.0.0', '--data', dir, '--version', '2.0.0']), 0);
});

test('a set\'s values added is MINOR, a value changed or the values removed is MAJOR (#29)', () => {
  const withValues = (s) => { s.values = [null, 4]; s.unit = 'x'; };
  const valued = resolvedOf(texts((d, at) => withValues(at('data/kernels/swell.json', 'SWELL_KINDS'))));
  assert.equal(classify(base, valued).level, 'minor');
  assert.equal(classify(valued, base).level, 'major');
  const moved = resolvedOf(texts((d, at) => { const s = at('data/kernels/swell.json', 'SWELL_KINDS'); withValues(s); s.values[1] = 8; }));
  assert.equal(classify(valued, moved).level, 'major');
  assert.deepEqual(classify(valued, moved).changes.map((c) => c.what), ['SWELL_KINDS: the value of hard: 4 -> 8 (a constant a kernel computes with)']);
});

test('refusal: a MAJOR class needs a minor bump in the development phase and a major bump after it', () => {
  assert.equal(refusal('major', '2.10.0', '2.11.0'), null);
  assert.match(refusal('major', '2.10.0', '2.10.1'), /MAJOR, and 2\.10\.0 -> 2\.10\.1 is a patch bump \(at least a minor in the development phase\)/);
  assert.equal(refusal('major', '2.10.0', '2.11.0', { developmentPhase: null }), 'the changes since 2.10.0 are MAJOR, and 2.10.0 -> 2.11.0 is a minor bump');
  assert.equal(refusal('major', '2.10.0', '3.0.0', { developmentPhase: null }), null);
});

test('a set id that changes type is visible in the change message (#29)', () => {
  // a roll-off set declared with numeric ids and no values, as 2.10.1 declared one
  const numeric = resolvedOf(texts((d, at) => { const s = at('data/kernels/contour.json', 'CONTOUR_ROLLOFFS'); s.ids = [0, 9000, 14000]; s.default = 0; delete s.values; delete s.unit; }));
  const what = classify(numeric, base).changes.filter((c) => c.item === 'CONTOUR_ROLLOFFS').map((c) => c.what);
  assert.ok(what.includes('CONTOUR_ROLLOFFS[1]: 9000 -> "9000"'), what.join('\n'));
  assert.ok(what.includes('CONTOUR_ROLLOFFS[0]: 0 -> "off"'));
});

// ---- the schema is classified too (#92)

const SCHEMA = JSON.parse(readFileSync(join(ROOT, 'schema/omx-contract.schema.json'), 'utf8'));
const schemaLevel = (fn) => { const next = structuredClone(SCHEMA); fn(next); return classifySchema(SCHEMA, next); };

test('schema: no change is none, a description is patch, the schema version is no change', () => {
  assert.equal(classifySchema(SCHEMA, SCHEMA).level, 'none');
  assert.equal(schemaLevel((n) => { n['x-omx-schema-version'] = '9.9.9'; }).level, 'none');
  assert.equal(schemaLevel((n) => { n.$defs.render.description = 'reworded'; }).level, 'patch');
});

test('schema: a property or an enum member added is minor; a property or an enum member removed, a constraint added or changed is major', () => {
  assert.equal(schemaLevel((n) => { n.$defs.renderHeader.properties.extra = { type: 'string' }; }).level, 'minor');
  assert.equal(schemaLevel((n) => { n.$defs.renderHeader.properties.scope.enum.push('tree'); }).level, 'minor');
  const gone = schemaLevel((n) => { delete n.$defs.renderHeader.properties.guard; });
  assert.equal(gone.level, 'major');
  assert.match(gone.changes[0].what, /renderHeader\.properties\.guard removed/);
  assert.equal(schemaLevel((n) => { n.$defs.renderHeader.properties.scope.enum.pop(); }).level, 'major');
  assert.equal(schemaLevel((n) => { n.$defs.renderHeader.properties.guard.pattern = '^X$'; }).level, 'major');
  assert.equal(schemaLevel((n) => { n.$defs.renderHeader.required.push('includes'); }).level, 'major');
  assert.equal(schemaLevel((n) => { n.$defs.renderHeader.required.pop(); }).level, 'minor');
});

test('schema: a definition moved into $defs and referenced is judged by what it resolves to, not by its spelling', () => {
  const inline = { type: 'object', properties: { en: { type: 'string' } }, required: ['en'], additionalProperties: false };
  const was = { $defs: { code: { type: 'object', properties: { text: structuredClone(inline) } } } };
  const moved = (def) => ({ $defs: { sentence: def, code: { type: 'object', properties: { text: { $ref: '#/$defs/sentence' } } } } });
  assert.equal(classifySchema(was, moved(structuredClone(inline))).level, 'minor', 'the same constraint, now shared: only the definition is new');
  assert.equal(classifySchema(was, moved({ ...structuredClone(inline), required: ['en', 'ca'] })).level, 'major', 'moved and tightened on the way');
  assert.equal(classifySchema(moved(structuredClone(inline)), was).level, 'major', 'a definition removed stays major');
});

test('schema: a pattern moved into an anyOf, another pattern appended beside it, is minor; changed on the way it is major', () => {
  const was = { $defs: { code: { type: 'string', pattern: '^a$' } } };
  const grown = (first) => ({ $defs: { code: { type: 'string', anyOf: [{ pattern: first }, { pattern: '^b$' }] } } });
  assert.equal(classifySchema(was, grown('^a$')).level, 'minor', 'what was accepted is still accepted');
  assert.equal(classifySchema(was, grown('^c$')).level, 'major', 'the old pattern rewritten');
  assert.equal(classifySchema(grown('^a$'), was).level, 'major', 'a member dropped');
});

test('the version a schema states moves with the schema, by what its changes need', () => {
  const was = { 'x-omx-schema-version': '3.7.0', $defs: { a: { type: 'object', properties: { x: { type: 'string' } } } } };
  const grown = (version) => ({ ...structuredClone(was), 'x-omx-schema-version': version, $defs: { a: { type: 'object', properties: { x: { type: 'string' }, y: { type: 'string' } } } } });
  assert.equal(schemaVersionProblem(was, structuredClone(was)), null, 'nothing changed, nothing to state');
  assert.equal(schemaVersionProblem(was, grown('3.9.0')), null, 'a member added, a minor stated');
  assert.match(schemaVersionProblem(was, grown('3.7.0')), /MINOR/, 'a member added, the version left');
  assert.match(schemaVersionProblem(was, grown('3.7.1')), /MINOR/, 'a member added, a patch stated');
  assert.match(schemaVersionProblem(was, { ...structuredClone(was), 'x-omx-schema-version': '3.9.0' }), /is what 3\.7\.0 was/, 'the version moved alone');
});

/** The previous release of this tree's major (tools/previous-tag.sh, the release gate's pick), or undefined: none yet. */
const previousTag = () => {
  const r = spawnSync('sh', [join(ROOT, 'tools/previous-tag.sh'), packageVersion(ROOT)], { cwd: ROOT, encoding: 'utf8' });
  return r.status === 0 && r.stdout.trim() ? r.stdout.trim() : undefined;
};

test('--schema-version holds the tree to the previous release of its major', () => {
  const prev = previousTag();
  if (prev === undefined) { process.stderr.write(`skipping: no previous tag of the major of ${packageVersion(ROOT)} in this checkout (its first release)\n`); return; }
  assert.equal(main(['semver', prev, '--schema-version']), 0);
});

test('the CLI against a tag reads the schema too, and --report names the level without refusing the bump', () => {
  const git = spawnSync('git', ['-C', ROOT, 'rev-parse', '--verify', 'v3.5.1^{commit}']);
  if (git.status !== 0) return;   // no tags in this checkout
  assert.equal(main(['semver', 'v3.5.1', '--report', '--version', '3.5.1']), 0);
  const dir = scratchData();
  editData(dir, 'kernels/swell.json', (d, at) => { at('SWELL_LIMITS.ratio').max = 30; });
  assert.equal(main(['semver', '--from-dir', DATA, '--from-version', '1.0.0', '--data', dir, '--version', '1.0.1', '--report']), 0);
  assert.equal(main(['semver', '--from-dir', DATA, '--from-version', '1.0.0', '--data', dir, '--version', '1.0.1']), 1);
});

test('schema: an anyOf that gains a member, or whose enum member gains a value, is minor; one that loses either, or has a member rewritten, is major', () => {
  const of = (anyOf) => ({ $defs: { u: { anyOf } } });
  const ref = { $ref: '#/$defs/unit' };
  const units = (...v) => ({ enum: v });
  const level = (a, b) => classifySchema(of(a), of(b)).level;
  assert.equal(level([ref, units('a', 'b')], [ref, units('a', 'b', 'c')]), 'minor', 'a value added inside a member');
  assert.equal(level([ref, units('a')], [ref, units('a'), units('z')]), 'minor', 'a member added');
  assert.equal(level([ref, units('a', 'b')], [ref, units('a')]), 'major', 'a value removed inside a member');
  assert.equal(level([ref, units('a')], [ref]), 'major', 'a member removed');
  assert.equal(level([ref, units('a')], [{ $ref: '#/$defs/other' }, units('a')]), 'major', 'a member rewritten');
  assert.equal(level([ref, units('a')], [units('a'), ref]), 'major', 'members reordered into different ones');
});

// A released tree is read back as it was released: `semver <previous tag>` compares it with this tree, and an id spelling
// rule added since (a unit id is camelCase, 2026-11-23) is not held against it, or the rename that rule asks for
// refuses the comparison that classifies it (v3.21.0's dB-oct, renamed dBPerOct). The rule still holds for any tree
// being built or installed.
test('a released tree\'s unit id is read as released (dB-oct), a tree being read now is refused it', () => {
  const doc = JSON.parse(readFileSync(join(ROOT, 'contract.d/param/param.json'), 'utf8'));
  const word = doc.components.schemas.PARAM_UNITS.oneOf.find((w) => w.const === 'dBPerOct');
  assert.ok(word, 'positive control: the unit dBPerOct');
  word.const = 'dB-oct';
  const read = (opts) => () => readDomain('param', structuredClone(doc), '../schema/omx-contract.schema.json', 0, opts);
  assert.throws(read(), /the unit id "dB-oct" is not camelCase/);
  assert.throws(read({ released: false }), /not camelCase/);
  const { doc: data } = read({ released: true })();
  assert.ok(JSON.stringify(data).includes('"dB-oct"'), 'the released id is read as it was released');
});

test('the CLI refuses a tag of another major by name, exit 2: it is no previous release of this line (2026-11-25)', () => {
  const v = packageVersion(ROOT);
  const other = `v${Number(v.split('.')[0]) + 3}.21.0`;
  const cli = (...a) => spawnSync(process.execPath, [join(ROOT, 'bin/omx-contract.mjs'), 'semver', ...a], { encoding: 'utf8' });
  for (const args of [[other, '--report'], [other, '--schema-version'], [other]]) {
    const r = cli(...args);
    assert.equal(r.status, 2, `${args.join(' ')}: ${r.stderr}`);
    assert.match(r.stderr, new RegExp(`semver ${other}: a tag of the major ${Number(v.split('.')[0]) + 3}, and this tree is ${v.replace(/\./g, '\\.')}, of the major ${v.split('.')[0]}: semver compares within one major`));
  }
  // positive control: --version of that major lifts the refusal, so the check reads the tree's major and nothing else
  assert.doesNotMatch(cli(other, '--report', '--version', `${Number(v.split('.')[0]) + 3}.22.0`).stderr, /semver compares within one major/);
});

// omx-contract#246: an item new since the previous tag says, as its x-since, the info.version of its domain that ships it
test('an item new since the tag with a stale x-since is refused by name; one that says the raised info.version passes', () => {
  const was = JSON.parse(readFileSync(join(ROOT, 'contract.d/param/param.json'), 'utf8'));
  const grown = (version, since) => {
    const d = structuredClone(was);
    d.info.version = version;
    d.components.schemas.PARAM_NEW_ITEM = { description: 'new', 'x-since': since, oneOf: [{ const: 'a', title: 'a', description: 'a', 'x-code': 0 }] };
    return d;
  };
  const at = was.info.version;
  const [a, b, c] = at.split('.').map(Number);
  const raised = `${a}.${b + 1}.0`;
  assert.deepEqual(sinceProblems({ param: was }, { param: structuredClone(was) }, 'v0.1.0'), [], 'nothing new, nothing refused');
  assert.deepEqual(sinceProblems({ param: was }, { param: grown(raised, raised) }, 'v0.1.0'), [], 'the raised version stated');
  assert.deepEqual(sinceProblems({ param: was }, { param: grown(raised, at) }, 'v0.1.0'),
    [`param PARAM_NEW_ITEM: new since v0.1.0, and its x-since ${at} is not ${raised}, the info.version of param that ships it`]);
  assert.deepEqual(sinceProblems({ param: was }, { param: grown(at, at) }, 'v0.1.0'),
    [`param PARAM_NEW_ITEM: new since v0.1.0, and param's info.version ${at} is what it was at v0.1.0: the release that adds the item raises it`]);
  // a domain the tag did not have: its items say its first version
  assert.deepEqual(sinceProblems({}, { param: was }, 'v0.1.0').length, Object.values(was.components.schemas).filter((d) => d['x-since'] !== at).length);
  void c;
});

test('the CLI against a tag runs the x-since check: the tree against its own HEAD has nothing new and passes', () => {
  const git = spawnSync('git', ['-C', ROOT, 'rev-parse', '--verify', 'HEAD^{commit}']);
  if (git.status !== 0) return;   // not a git checkout
  const r = spawnSync(process.execPath, [join(ROOT, 'bin/omx-contract.mjs'), 'semver', 'HEAD', '--version', packageVersion(ROOT)], { cwd: ROOT, encoding: 'utf8' });
  assert.doesNotMatch(r.stderr, /x-since/, r.stderr);
});
