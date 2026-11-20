#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/*
 * format-inventory.mjs — the inventory of the CLAP vocabulary as installed: every identifier the CLAP headers
 * declare, with the version they were read from. The inventory is what data/formats/clap maps, term by term
 * (docs/data-layout.md); it is written by this tool and never edited by hand. The LV2 inventory is plugin-db's
 * (tools/lv2_inventory.py there, sorting pass V27a).
 *
 *   node tools/format-inventory.mjs [--clap <include dir>] [--out <dir>] [--check]
 *
 * --clap defaults to pkg-config's includedir for clap (else /usr/include); the CLAP headers are read as text.
 * --check compares with inventory/clap.json instead of writing it.
 *
 * Exit 0 written or equal; 1 a difference (each named) or a source that cannot be read; 2 usage.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMain } from '../lib/entry.mjs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const INVENTORY = join(ROOT, 'inventory');

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');

/** The plumbing macros of the CLAP headers: compiler and ABI spellings, include guards, function-like macros. */
const isPlumbing = (name) => /^(CLAP_(ABI|EXPORT|CONSTEXPR|NODISCARD|CPLUSPLUS|HAS_CXX\d*|VERSION_INIT))$|_H$/.test(name);

/**
 * One CLAP header's identifiers: `[{ name, group, value }]`, in the order the header declares them. A string
 * constant (an extension, factory, port-type or window-API id, a plugin feature) is `group: "string"` with its
 * text; a member of an enum is the enum's tag, or `enum` when it has none, with its value as written; a typed
 * constant is `const` and a numeric #define `define`, each with its value as written.
 */
export function readClapHeader(text) {
  const src = stripComments(text);
  const out = [];
  const seen = new Set();
  const add = (o) => { if (!seen.has(o.name) && !isPlumbing(o.name)) { seen.add(o.name); out.push(o); } };
  const rx = new RegExp([
    /const\s+(?:CLAP_CONSTEXPR\s+)?char\s+(CLAP_\w+)\s*\[\]\s*=\s*"([^"]*)"\s*;/.source,
    /#\s*define\s+(CLAP_\w+)[ \t]+"([^"]*)"/.source,
    /#\s*define\s+(CLAP_\w+)[ \t]+(\d+)\b/.source,
    /static\s+const\s+CLAP_CONSTEXPR\s+(?!char\b)\w+\s+(CLAP_\w+)\s*=\s*([^;]+);/.source,
    /\benum\s*(\w*)\s*\{([^}]*)\}/.source,
  ].join('|'), 'g');
  for (const m of src.matchAll(rx)) {
    if (m[1]) add({ name: m[1], group: 'string', value: m[2] });
    else if (m[3]) add({ name: m[3], group: 'string', value: m[4] });
    else if (m[5]) add({ name: m[5], group: 'define', value: m[6] });
    else if (m[7]) add({ name: m[7], group: 'const', value: m[8].trim().replace(/\s+/g, ' ') });
    else {
      const group = m[9] || 'enum';
      for (const part of m[10].split(',')) {
        const e = /^\s*(CLAP_\w+)\s*(?:=\s*([\s\S]+?))?\s*$/.exec(part);
        if (e) add({ name: e[1], group, value: e[2] === undefined ? null : e[2].replace(/\s+/g, ' ') });
      }
    }
  }
  return out;
}

/** Every header under `<include>/clap`, its private/ ones left out: `{ version, headers: { <path>: [...] } }`. */
export function readClap(include) {
  const root = join(include, 'clap');
  if (!existsSync(root)) throw new Error(`no ${root}`);
  const files = [];
  const walk = (d) => {
    for (const f of readdirSync(d).sort()) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) { if (f !== 'private') walk(p); } else if (f.endsWith('.h')) files.push(p);
    }
  };
  walk(root);
  const headers = {};
  for (const p of files.sort((a, b) => (relative(root, a) < relative(root, b) ? -1 : 1))) {
    const ids = readClapHeader(readFileSync(p, 'utf8'));
    if (ids.length) headers[relative(root, p).replace(/\.h$/, '')] = ids;
  }
  const v = Object.fromEntries((headers.version ?? []).filter((i) => i.group === 'define').map((i) => [i.name, i.value]));
  if (!v.CLAP_VERSION_MAJOR) throw new Error(`${root}/version.h: no CLAP_VERSION_MAJOR`);
  return { version: `${v.CLAP_VERSION_MAJOR}.${v.CLAP_VERSION_MINOR}.${v.CLAP_VERSION_REVISION}`, headers };
}

const pkgVar = (pkg, v) => {
  try { return execFileSync('pkg-config', [`--variable=${v}`, pkg], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || undefined; } catch { return undefined; }
};
export const defaultClapInclude = () => pkgVar('clap', 'includedir') ?? '/usr/include';

/** The inventory document of the sources named: `{ 'clap.json': text }` (the LV2 inventory is plugin-db's, V27a). */
export function inventories({ clap = defaultClapInclude() } = {}) {
  const c = { format: 'clap', from: 'the CLAP headers (clap package), private/ left out', ...readClap(clap) };
  return { 'clap.json': `${JSON.stringify(c, null, 2)}\n` };
}

function main(argv) {
  const opts = {};
  let out = INVENTORY;
  let check = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--check') check = true;
    else if (['--clap', '--out'].includes(a) && argv[i + 1]) {
      const v = argv[++i];
      if (a === '--out') out = v; else opts[a.slice(2)] = v;
    } else { process.stderr.write(`format-inventory: unknown argument ${a}\n`); return 2; }
  }
  let docs;
  try { docs = inventories(opts); } catch (e) { process.stderr.write(`format-inventory: ${e.message}\n`); return 1; }
  if (!check) {
    mkdirSync(out, { recursive: true });
    for (const [f, t] of Object.entries(docs)) writeFileSync(join(out, f), t);
    process.stdout.write(`format-inventory: wrote ${Object.keys(docs).map((f) => join(out, f)).join(', ')}\n`);
    return 0;
  }
  let bad = 0;
  for (const [f, t] of Object.entries(docs)) {
    const p = join(out, f);
    const have = existsSync(p) ? readFileSync(p, 'utf8') : '';
    if (have !== t) { bad = 1; process.stderr.write(`format-inventory: ${p} is not the inventory of the installed sources: run node tools/format-inventory.mjs\n`); }
  }
  if (!bad) process.stdout.write('format-inventory: the committed inventory is the installed sources\'\n');
  return bad;
}

if (isMain(import.meta.url)) process.exitCode = main(process.argv.slice(2));
