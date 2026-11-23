// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas
/**
 * The shapes (docs/shapes.md): a document's shape is one JSON Schema 2020-12 file, shapes/<name>.schema.json, and the
 * types every language reads are renders of it, never written by hand. `render --target ts|py|c --shapes` writes them:
 *
 *   ts  shapes/<name>.d.ts                       json-schema-to-typescript, pinned exactly in package.json
 *   py  omx_contract_<name>_shape.py             datamodel-code-generator (TypedDicts), pinned in tools/shapes-requirements.txt
 *   c   omxcontract/omx_<name>_shape.h           this file: the keys, the words and the required set as X-macros, no struct
 *
 * The two generators run in the owner's CI and their output is committed; a consumer reads the committed file and runs
 * no generator. Each generator is held to its pin at run time: another version, or none, is refused by name, since its
 * bytes would differ. `--check` holds the committed files to a fresh render byte for byte. A shape that breaks a rule
 * (SHAPE_RULES) is refused by file, rule and JSON path, and nothing is rendered.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { cStringLiteral } from './c/c-literals.mjs';

const SCHEMA_2020 = 'https://json-schema.org/draft/2020-12/schema';
const SPDX = ['SPDX-License-Identifier: GPL-3.0-or-later', 'Copyright (C) 2026 Pau Aliagas'];
/** A C identifier: what a key, a word and a title's macro stem must be, so an X-macro argument is one token and no two collide. */
const C_IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
const TITLE = /^[A-Z][A-Za-z0-9]*$/;
/** A shape's $id: https://openmixer.org/schema/<owner>/<path>.schema.json, the owner the package that publishes it. */
const SHAPE_ID = /^https:\/\/openmixer\.org\/schema\/([a-z][a-z0-9-]*)\/(?:[^/]+\/)*[^/]+\.schema\.json$/;
/** The repository a render names as the source of a shape: its $id's owner (#78), never the generator's. */
const sourceOf = (schema) => `Open-Mixer/${SHAPE_ID.exec(schema.$id)[1]}`;

/** The shapes of a tree: every shapes/<name>.schema.json, parsed, in name order. */
export function shapesOf(root, dir = join(root, 'shapes')) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.schema.json')).sort().map((f) => ({
    name: basename(f, '.schema.json'),
    rel: `shapes/${f}`,
    schema: JSON.parse(readFileSync(join(dir, f), 'utf8')),
  }));
}

/** Every schema node under `s` (a type, properties, an enum, a const, a $ref or a oneOf), with its JSON path, parents first. */
function* nodes(s, path = '') {
  if (s === null || typeof s !== 'object' || Array.isArray(s)) return;
  if ('type' in s || 'properties' in s || 'enum' in s || 'const' in s || '$ref' in s || 'oneOf' in s) yield [path || '/', s];
  for (const [k, v] of Object.entries(s)) {
    if (k === 'properties' || k === '$defs') for (const [n, sub] of Object.entries(v)) yield* nodes(sub, `${path}/${k}/${n}`);
    else if (k === 'items' && typeof v === 'object') yield* nodes(v, `${path}/items`);
    else if (k === 'oneOf' || k === 'anyOf' || k === 'allOf') for (let i = 0; i < v.length; i++) yield* nodes(v[i], `${path}/${k}/${i}`);
  }
}

/** The object nodes of a shape, each `[path, node]`: the root when it is one, every $defs entry and every nested one. */
const objects = (s) => [...nodes(s)].filter(([, n]) => n.type === 'object');

/** The enum or const words of a property node, its oneOf and anyOf branches' included, or undefined when it has none. */
const wordsOf = (p) => {
  const own = p.enum ?? (p.const !== undefined ? [p.const] : undefined);
  const branches = [...(p.oneOf ?? []), ...(p.anyOf ?? [])].map(wordsOf).filter(Boolean).flat();
  if (!own && !branches.length) return undefined;
  return [...new Set([...(own ?? []), ...branches])];
};

const upper = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();

/** The rules a shape is held to, each with its check; a problem is `{ rule, path, message }`. The sabotage arm of test/shapes.test.mjs breaks each. */
export const SHAPE_RULES = [
  { rule: '$schema', check: (s) => (s.$schema === SCHEMA_2020 ? [] : [{ path: '/', message: `"$schema" is ${JSON.stringify(s.$schema)}, not ${SCHEMA_2020}` }]) },
  { rule: '$id', check: (s) => (typeof s.$id === 'string' && SHAPE_ID.test(s.$id) ? [] : [{ path: '/', message: 'no "$id" of the form https://openmixer.org/schema/<owner>/<path>.schema.json: the renders name <owner> as the source' }]) },
  {
    rule: 'title',
    check: (s) => [
      ...(TITLE.test(s.title ?? '') ? [] : [{ path: '/', message: 'no "title" (one CapitalisedWord, the type\'s name)' }]),
      ...objects(s).filter(([, n]) => !TITLE.test(n.title ?? '')).map(([path]) => ({ path, message: 'an object without a "title" (one CapitalisedWord): its macros and its type are named by it' })),
    ],
  },
  {
    // two titles that spell the same macro stem (ScaleMap and Scalemap both give OMX_SHAPE_SCALE_MAP... or the same word) would render one over the other
    rule: 'titles',
    check: (s) => {
      const seen = new Map();
      const out = [];
      for (const [path, n] of objects(s)) {
        if (!TITLE.test(n.title ?? '')) continue;
        const stem = upper(n.title);
        if (seen.has(stem)) out.push({ path, message: `the title ${n.title} renders the same macros as ${seen.get(stem)}: titles are distinct` });
        else seen.set(stem, n.title);
      }
      return out;
    },
  },
  {
    rule: 'description',
    check: (s) => [...nodes(s)].filter(([, n]) => !('$ref' in n) && !(typeof n.description === 'string' && n.description.trim())).map(([path]) => ({ path, message: 'no "description": the renders carry it as the doc comment' })),
  },
  {
    rule: 'additionalProperties',
    check: (s) => objects(s).filter(([, n]) => n.additionalProperties !== false).map(([path]) => ({ path, message: 'an object without "additionalProperties": false: a closed shape names every key' })),
  },
  {
    // a key is an X-macro argument and a word an identifier: one C token each, so no two spell the same one
    rule: 'identifiers',
    check: (s) => objects(s).flatMap(([path, n]) => Object.keys(n.properties ?? {}).filter((k) => !C_IDENT.test(k)).map((k) => ({ path: `${path}/properties/${k}`, message: `the key ${JSON.stringify(k)} is not a C identifier` }))),
  },
  {
    // an object keyed by a pattern has no key to name: the C macros would drop it silently
    rule: 'patternProperties',
    check: (s) => objects(s).filter(([, n]) => 'patternProperties' in n).map(([path]) => ({ path, message: '"patternProperties" cannot be rendered: a key set the C macros cannot name is not a closed shape (name every key under "properties")' })),
  },
  {
    rule: 'words',
    check: (s) => objects(s).flatMap(([path, n]) => Object.entries(n.properties ?? {}).flatMap(([k, p]) => {
      const words = wordsOf(p);
      if (!words) return [];
      const bad = words.filter((w) => typeof w !== 'string' || !C_IDENT.test(w));
      return bad.length ? [{ path: `${path}/properties/${k}`, message: `the words ${JSON.stringify(bad)} are not C identifiers: an enum or const of ${k} is strings, each one identifier` }] : [];
    })),
  },
  {
    // two keys (fooBar and foo_bar), or a title and a key, that spell one macro: the header would define it twice
    rule: 'macros',
    check: (s) => {
      const seen = new Map();
      const out = [];
      for (const m of macrosOf(s)) {
        const first = seen.get(m.macro);
        if (first) out.push({ path: m.path, message: `${m.what} renders ${m.macro}, as ${first.what} (${first.path}) does: every macro is defined once` });
        else seen.set(m.macro, m);
      }
      return out;
    },
  },
];

/** Every macro the C render of a shape defines, each `{ macro, path, what }`, in render order (renderShapeC). */
function macrosOf(s) {
  const P = `OMX_SHAPE_${macroStem(s.title ?? '')}`;
  const out = [{ macro: `${P}_SCHEMA`, path: '/', what: `the schema of ${s.title}` }, { macro: `${P}_ID`, path: '/', what: `the $id of ${s.title}` }];
  for (const [path, obj] of objects(s)) {
    const O = `OMX_SHAPE_${macroStem(obj.title ?? '')}`;
    out.push({ macro: `${O}_KEYS`, path, what: `the keys of ${obj.title}` }, { macro: `${O}_REQUIRED`, path, what: `the required keys of ${obj.title}` });
    for (const [k, p] of Object.entries(obj.properties ?? {})) {
      if (wordsOf(p)) out.push({ macro: `${O}_${macroStem(k)}_WORDS`, path: `${path}/properties/${k}`, what: `the words of ${obj.title}.${k}` });
    }
  }
  return out;
}

/** The problems of one shape, by rule; empty when it may be rendered. */
export function shapeProblems({ schema }) {
  return SHAPE_RULES.flatMap(({ rule, check }) => check(schema).map((p) => ({ rule, ...p })));
}

/** A title two shapes share spells the same macros in two headers, a redefinition where both are included: refused by both files. */
const crossShapeProblems = (shapes) => {
  const seen = new Map();
  const out = [];
  for (const s of shapes) {
    for (const [path, n] of objects(s.schema)) {
      if (!TITLE.test(n.title ?? '')) continue;
      const stem = upper(n.title);
      const first = seen.get(stem);
      if (first && first.rel !== s.rel) out.push(`${s.rel}: titles at ${path}: the title ${n.title} renders the same macros as ${first.title} of ${first.rel}: titles are distinct across shapes`);
      else if (!first) seen.set(stem, { rel: s.rel, title: n.title });
    }
  }
  return out;
};

const refuseProblems = (shapes) => {
  const lines = [...shapes.flatMap((s) => shapeProblems(s).map((p) => `${s.rel}: ${p.rule} at ${p.path}: ${p.message}`)), ...crossShapeProblems(shapes)];
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

/** Prose inside a C comment: a comment close is broken, a doxygen command character is escaped, a line break is a space. */
const inComment = (text) => String(text).replace(/\*\//g, '*\\/').replace(/[@\\]/g, '\\$&').replace(/\s*\n\s*/g, ' ');
const doxy = (text) => `/** ${inComment(text)} */`;
const macroStem = (s) => upper(s).replace(/[^A-Z0-9_]/g, '_');

/** The `c` render of one shape: the schema's installed path and id, and per object its keys, required keys and each enum's words, as X-macros. */
function renderShapeC({ name, rel, schema }) {
  const guard = `OMX_${macroStem(name)}_SHAPE_H`;
  const P = `OMX_SHAPE_${macroStem(schema.title)}`;
  const lines = [
    `/* ${SPDX[0]} */`,
    `/* ${SPDX[1]} */`,
    `/* GENERATED by \`omx-contract render --target c --shapes\` from ${rel} of ${sourceOf(schema)}, do not edit. */`,
    `#ifndef ${guard}`,
    `#define ${guard}`,
    '',
    `/** @file omx_${name}_shape.h`,
    ` *  @brief The shape ${schema.title} (${rel}): ${inComment(schema.description)}`,
    ` *  A C reader parses the document by key; these macros name every key, every word and the required set, so no name is`,
    ` *  typed twice. The schema itself is installed under the data directory for a reader that validates. */`,
    '',
    doxy(`The schema of ${schema.title}, relative to omx-contract's data directory (\`pkg-config --variable=datadir omx-contract\`).`),
    `#define ${P}_SCHEMA ${cStringLiteral(rel)}`,
    doxy(`The \`$id\` of the schema of ${schema.title}.`),
    `#define ${P}_ID ${cStringLiteral(schema.$id)}`,
  ];
  for (const [, obj] of objects(schema)) {
    const title = obj.title;
    const O = `OMX_SHAPE_${macroStem(title)}`;
    const keys = Object.keys(obj.properties ?? {});
    const required = obj.required ?? [];
    lines.push('', `/* ${title}: ${inComment(obj.description)} */`);
    lines.push(doxy(`The keys of ${title}, each as X(identifier, "key"): ${keys.join(', ')}.`));
    lines.push(`#define ${O}_KEYS(X) ${keys.map((k) => `X(${k}, ${cStringLiteral(k)})`).join(' ')}`);
    lines.push(doxy(`The keys ${title} requires${required.length ? '' : ' (none)'}, each as X(identifier, "key").`));
    lines.push(`#define ${O}_REQUIRED(X) ${required.map((k) => `X(${k}, ${cStringLiteral(k)})`).join(' ')}`.trimEnd());
    for (const [k, p] of Object.entries(obj.properties ?? {})) {
      const words = wordsOf(p);
      if (!words) continue;
      lines.push(doxy(`The words of ${title}.${k}, each as X(identifier, "word"): ${p.description}`));
      lines.push(`#define ${O}_${macroStem(k)}_WORDS(X) ${words.map((w) => `X(${w}, ${cStringLiteral(w)})`).join(' ')}`);
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

/** The exact version package.json pins for json-schema-to-typescript. */
export function tsGeneratorPin(root) {
  const pin = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).devDependencies?.['json-schema-to-typescript'];
  if (!/^\d+\.\d+\.\d+$/.test(pin ?? '')) throw new Error('package.json pins no exact json-schema-to-typescript version under devDependencies');
  return pin;
}

/** Whether the installed json-schema-to-typescript is the pinned one: `{ ok, why }`; `installed` is read from node_modules unless given. */
export function tsGeneratorVersion(root, installed) {
  const pin = tsGeneratorPin(root);
  if (installed === undefined) {
    const p = join(root, 'node_modules/json-schema-to-typescript/package.json');
    if (!existsSync(p)) return { ok: false, why: `json-schema-to-typescript is not installed (package.json pins ${pin}; npm ci)` };
    installed = JSON.parse(readFileSync(p, 'utf8')).version;
  }
  if (installed !== pin) return { ok: false, why: `json-schema-to-typescript ${installed} is not the pinned ${pin} of package.json: its output would differ` };
  return { ok: true, why: '' };
}

/** The `ts` target: json-schema-to-typescript at its pinned version; absent or another version, the render refuses and names it. */
export async function renderShapesTs(root, dir) {
  const shapes = shapesOf(root, dir);
  refuseProblems(shapes);
  const v = tsGeneratorVersion(root);
  if (!v.ok) throw new Error(`render --target ts --shapes: ${v.why}`);
  const { compile } = await import('json-schema-to-typescript');
  const out = [];
  for (const s of shapes) {
    const bannerComment = `// ${SPDX[0]}\n// ${SPDX[1]}\n// GENERATED by \`omx-contract render --target ts --shapes\` from ${s.rel} of ${sourceOf(s.schema)}, do not edit.`;
    const text = await compile(structuredClone(s.schema), s.schema.title, { bannerComment, additionalProperties: false, cwd: dir ?? join(root, 'shapes'), style: { printWidth: 120, singleQuote: false } });
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
