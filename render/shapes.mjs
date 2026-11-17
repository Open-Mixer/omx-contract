// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * The shapes (docs/shapes.md): a document's shape is one JSON Schema 2020-12 file, shapes/<name>.schema.json, and the
 * types every language reads are renders of it, never written by hand. `render --target ts|py|c --shapes` writes them:
 *
 *   ts  shapes/<name>.d.ts                       json-schema-to-typescript, pinned in package.json
 *   py  omx_contract_<name>_shape.py             datamodel-code-generator (TypedDicts), pinned in tools/shapes-requirements.txt
 *   c   omxcontract/omx_<name>_shape.h           this file: the keys, the words and the required set as X-macros, no struct
 *
 * The two generators run in the owner's CI and their output is committed; a consumer reads the committed file and runs
 * no generator. `--check` holds the committed files to a fresh render byte for byte. A shape that breaks a rule
 * (SHAPE_RULES) is refused by name and nothing is rendered.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

const SCHEMA_2020 = 'https://json-schema.org/draft/2020-12/schema';
const SPDX = ['SPDX-License-Identifier: GPL-3.0-or-later', 'Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>'];

/** The shapes of a tree: every shapes/<name>.schema.json, parsed, in name order. */
export function shapesOf(root, dir = join(root, 'shapes')) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.schema.json')).sort().map((f) => ({
    name: basename(f, '.schema.json'),
    rel: `shapes/${f}`,
    schema: JSON.parse(readFileSync(join(dir, f), 'utf8')),
  }));
}

/** Every schema node under `s` that is an object (has `type` or `properties` or `enum` or `const`), with its JSON path. */
function* nodes(s, path = '') {
  if (s === null || typeof s !== 'object' || Array.isArray(s)) return;
  if ('type' in s || 'properties' in s || 'enum' in s || 'const' in s || '$ref' in s || 'oneOf' in s) yield [path || '/', s];
  for (const [k, v] of Object.entries(s)) {
    if (k === 'properties' || k === '$defs') for (const [n, sub] of Object.entries(v)) yield* nodes(sub, `${path}/${k}/${n}`);
    else if (k === 'items' && typeof v === 'object') yield* nodes(v, `${path}/items`);
    else if (k === 'oneOf' || k === 'anyOf' || k === 'allOf') for (let i = 0; i < v.length; i++) yield* nodes(v[i], `${path}/${k}/${i}`);
  }
}

/** The rules a shape is held to, each with its check; a problem is `{ rule, path, message }`. The sabotage arm of test/shapes.test.mjs breaks each. */
export const SHAPE_RULES = [
  { rule: '$schema', check: (s) => (s.$schema === SCHEMA_2020 ? [] : [{ path: '/', message: `"$schema" is ${JSON.stringify(s.$schema)}, not ${SCHEMA_2020}` }]) },
  { rule: '$id', check: (s) => (typeof s.$id === 'string' && s.$id.endsWith('.schema.json') ? [] : [{ path: '/', message: 'no "$id" ending in .schema.json' }]) },
  { rule: 'title', check: (s) => (typeof s.title === 'string' && /^[A-Z][A-Za-z0-9]*$/.test(s.title) ? [] : [{ path: '/', message: 'no "title" (one CapitalisedWord, the type\'s name)' }]) },
  {
    rule: 'description',
    check: (s) => [...nodes(s)].filter(([, n]) => !('$ref' in n) && !(typeof n.description === 'string' && n.description.trim())).map(([path]) => ({ path, message: 'no "description": the renders carry it as the doc comment' })),
  },
  {
    rule: 'additionalProperties',
    check: (s) => [...nodes(s)].filter(([, n]) => n.type === 'object' && n.additionalProperties !== false).map(([path]) => ({ path, message: 'an object without "additionalProperties": false: a closed shape names every key' })),
  },
];

/** The problems of one shape, by rule; empty when it may be rendered. */
export function shapeProblems({ schema }) {
  return SHAPE_RULES.flatMap(({ rule, check }) => check(schema).map((p) => ({ rule, ...p })));
}

const refuseProblems = (shapes) => {
  const lines = shapes.flatMap((s) => shapeProblems(s).map((p) => `${s.rel}: ${p.rule} at ${p.path}: ${p.message}`));
  if (lines.length) throw new Error(`render --shapes refused:\n${lines.join('\n')}`);
};

/** The path a target writes for one shape, relative to --out. */
export function shapePath(target, name) {
  if (target === 'ts') return `shapes/${name}.d.ts`;
  if (target === 'py') return `omx_contract_${name}_shape.py`;
  if (target === 'c') return `omxcontract/omx_${name}_shape.h`;
  throw new Error(`the shapes render has no target ${target} (ts, py, c)`);
}

/** The paths a target writes for a tree's shapes: what the plain render of that target must know beside its own files. */
export function shapePaths(root, target, dir) {
  return shapesOf(root, dir).map((s) => shapePath(target, s.name));
}

const upper = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[^A-Za-z0-9]+/g, '_').toUpperCase();
const ident = (s) => s.replace(/[^A-Za-z0-9_]/g, '_');
const doxy = (text) => `/** ${text.replace(/\*\//g, '*\\/')} */`;

/** The objects of a shape with their names: the root when it is an object, and every $defs entry that is. */
function objectsOf(schema) {
  const out = [];
  if (schema.type === 'object') out.push([schema.title, schema]);
  for (const [n, d] of Object.entries(schema.$defs ?? {})) if (d.type === 'object') out.push([d.title ?? n, d]);
  return out;
}

/** The `c` render of one shape: the schema's installed path and id, and per object its keys, required keys and each enum's words, as X-macros. */
function renderShapeC({ name, rel, schema }) {
  const guard = `OMX_${upper(name)}_SHAPE_H`;
  const P = `OMX_SHAPE_${upper(name)}`;
  const lines = [
    `/* ${SPDX[0]} */`,
    `/* ${SPDX[1]} */`,
    `/* GENERATED by \`omx-contract render --target c --shapes\` from ${rel} of Open-Mixer/omx-contract, do not edit. */`,
    `#ifndef ${guard}`,
    `#define ${guard}`,
    '',
    `/** @file omx_${name}_shape.h`,
    ` *  @brief The shape ${schema.title} (${rel}): ${schema.description}`,
    ` *  A C reader parses the document by key; these macros name every key, every word and the required set, so no name is`,
    ` *  typed twice. The schema itself is installed under the data directory for a reader that validates. */`,
    '',
    doxy(`The schema of ${schema.title}, relative to omx-contract's data directory (\`pkg-config --variable=datadir omx-contract\`).`),
    `#define ${P}_SCHEMA "${rel}"`,
    doxy(`The \`$id\` of the schema of ${schema.title}.`),
    `#define ${P}_ID "${schema.$id}"`,
  ];
  for (const [title, obj] of objectsOf(schema)) {
    const O = `OMX_SHAPE_${upper(title)}`;
    const keys = Object.keys(obj.properties ?? {});
    const required = obj.required ?? [];
    lines.push('', `/* ${title}: ${obj.description} */`);
    lines.push(doxy(`The keys of ${title}, each as X(identifier, "key"): ${keys.join(', ')}.`));
    lines.push(`#define ${O}_KEYS(X) ${keys.map((k) => `X(${ident(k)}, "${k}")`).join(' ')}`);
    lines.push(doxy(`The keys ${title} requires${required.length ? '' : ' (none)'}, each as X(identifier, "key").`));
    lines.push(`#define ${O}_REQUIRED(X) ${required.map((k) => `X(${ident(k)}, "${k}")`).join(' ')}`.trimEnd());
    for (const [k, p] of Object.entries(obj.properties ?? {})) {
      const words = p.enum ?? (p.const !== undefined ? [p.const] : undefined);
      if (!words || !words.every((w) => typeof w === 'string')) continue;
      lines.push(doxy(`The words of ${title}.${k}, each as X(identifier, "word"): ${p.description}`));
      lines.push(`#define ${O}_${upper(k)}_WORDS(X) ${words.map((w) => `X(${ident(w)}, "${w}")`).join(' ')}`);
    }
  }
  lines.push('', `#endif /* ${guard} */`, '');
  return lines.join('\n');
}

/** The `c` target: one header per shape. */
export function renderShapesC(root, dir) {
  const shapes = shapesOf(root, dir);
  refuseProblems(shapes);
  return shapes.map((s) => ({ path: shapePath('c', s.name), text: renderShapeC(s) }));
}

/** The `ts` target: json-schema-to-typescript, pinned in package.json; absent, the render refuses and names it. */
export async function renderShapesTs(root, dir) {
  const shapes = shapesOf(root, dir);
  refuseProblems(shapes);
  let compile;
  try { ({ compile } = await import('json-schema-to-typescript')); } catch {
    throw new Error('render --target ts --shapes needs json-schema-to-typescript, pinned in package.json (npm ci): not installed');
  }
  const out = [];
  for (const s of shapes) {
    const bannerComment = `// ${SPDX[0]}\n// ${SPDX[1]}\n// GENERATED by \`omx-contract render --target ts --shapes\` from ${s.rel} of Open-Mixer/omx-contract, do not edit.`;
    const text = await compile(structuredClone(s.schema), s.schema.title, { bannerComment, additionalProperties: false, cwd: join(root, 'shapes'), style: { printWidth: 120, singleQuote: false } });
    out.push({ path: shapePath('ts', s.name), text });
  }
  return out;
}

/** The pinned version of datamodel-code-generator, from tools/shapes-requirements.txt. */
export function pyGeneratorPin(root) {
  const m = readFileSync(join(root, 'tools/shapes-requirements.txt'), 'utf8').match(/^datamodel-code-generator==(\S+)$/m);
  if (!m) throw new Error('tools/shapes-requirements.txt pins no datamodel-code-generator==<version>');
  return m[1];
}

/** The generator's command: $OMX_DATAMODEL_CODEGEN, else `datamodel-codegen` on PATH. */
const pyGeneratorCommand = () => process.env.OMX_DATAMODEL_CODEGEN || 'datamodel-codegen';

/** Whether the pinned Python generator answers at its pinned version: `{ ok, why }`. */
export function pyGeneratorVersion(root = join(import.meta.dirname, '..')) {
  const pin = pyGeneratorPin(root);
  const r = spawnSync(pyGeneratorCommand(), ['--version'], { encoding: 'utf8' });
  const got = r.status === 0 ? (r.stdout.trim().split(/\s+/).pop() ?? '') : '';
  if (r.status !== 0) return { ok: false, why: `datamodel-codegen is not installed (tools/shapes-requirements.txt pins ${pin}; pip install -r tools/shapes-requirements.txt, or set OMX_DATAMODEL_CODEGEN)` };
  if (got !== pin) return { ok: false, why: `datamodel-codegen ${got} is not the pinned ${pin} of tools/shapes-requirements.txt: its output would differ` };
  return { ok: true, why: '' };
}

/** The `py` target: datamodel-code-generator at its pinned version, a TypedDict per object; absent or another version, the render refuses and names it. */
export function renderShapesPy(root, dir) {
  const shapes = shapesOf(root, dir);
  refuseProblems(shapes);
  const v = pyGeneratorVersion(root);
  if (!v.ok) throw new Error(`render --target py --shapes: ${v.why}`);
  const out = [];
  for (const s of shapes) {
    const tmp = mkdtempSync(join(tmpdir(), 'omx-shapes-py-'));
    try {
      const file = join(tmp, `${s.name}.py`);
      execFileSync(pyGeneratorCommand(), [
        '--input', join(dir ?? join(root, 'shapes'), `${s.name}.schema.json`), '--input-file-type', 'jsonschema',
        '--output', file, '--output-model-type', 'typing.TypedDict', '--target-python-version', '3.11',
        '--use-schema-description', '--use-title-as-name', '--disable-timestamp', '--class-name', s.schema.title,
        // plain typing.TypedDict (3.11), not typing_extensions' PEP 728 closed one: the installed module imports the standard library alone
        '--no-use-closed-typed-dict',
      ], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
      const body = readFileSync(file, 'utf8').replace(/^# generated by datamodel-codegen:\n(#.*\n)*\n?/, '');
      const text = `# ${SPDX[0]}\n# ${SPDX[1]}\n"""The shape ${s.schema.title} (${s.rel}): ${s.schema.description}\n\nGENERATED by \`omx-contract render --target py --shapes\` with datamodel-code-generator ${pyGeneratorPin(root)}, do not edit."""\n\n${body}`;
      out.push({ path: shapePath('py', s.name), text });
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }
  return out;
}

/** The files of a shapes target. */
export async function renderShapes(target, root, dir) {
  if (target === 'c') return renderShapesC(root, dir);
  if (target === 'ts') return renderShapesTs(root, dir);
  if (target === 'py') return renderShapesPy(root, dir);
  throw new Error(`the shapes render has no target ${target} (ts, py, c)`);
}
