#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/*
 * consumer-drift.mjs — every consumer's use of this tree's install interface, read at its devel head and held to what
 * THIS tree provides, before a change to that interface merges (#262: 0.23 dropped the installer's schema-major
 * argument and ~60 call sites in nine consumers still passed it; nothing failed until each wave built). Three uses:
 *   - an rpm macro %{omx_contract_<x>} (%omx_contract_<x>, %%{...}) must be defined by packaging/macros.omx-contract.in;
 *   - a pkg-config variable read of omx-contract or libomx-domain (--variable=<x> <pc>, or ['--variable=<x>', '<pc>'])
 *     must be a variable of omx-contract.pc.in or libomx-domain.pc.in;
 *   - a call of install-contract-dir.sh (by its path, or through a variable a Makefile assigns it to) must pass no
 *     schema major: an argument that is, or a Makefile variable of the same file that is assigned, a bare number is
 *     refused, as the installer itself refuses it (no_major_argument; checked only where the installer has it).
 * Comment lines (#, //, *), Markdown, changelogs and docs/ are not read: they describe, they do not build.
 *
 *   node tools/consumer-drift.mjs [--base <ref>] [--list <file>] [<consumer checkout>...]
 *
 * With no checkout named, each `<owner/repo> <branch>` line of the list (tools/consumers.txt) is cloned at that branch's
 * head (depth 1, https://github.com/<owner/repo>) into a temporary directory. Each finding is printed as
 * `<consumer>:<file>:<line>: <what>`. With --base, the interface is read at <ref> too and only a finding the base
 * does not have is reported: the drift THIS change makes (a pull request's gate; a consumer already behind its base is
 * that consumer's own work, counted on the last line). Exit 0 no drift; 1 a finding; 2 the check could not run (a clone
 * failed, a list, a provided file or the base missing): never a pass.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMain } from '../lib/entry.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PCS = ['omx-contract', 'libomx-domain'];
const SKIP = /(^|\/)(docs\/|CHANGELOG[^/]*$|changelog$|[^/]*\.md$|[^/]*\.mbox$)/;

/** What this tree (or its state at a git ref) provides: the rpm macro names, each .pc file's variables, and whether
 * the installer refuses a schema major. */
export function provided(root = ROOT, ref = '') {
  const read = (f) => (ref ? execFileSync('git', ['-C', root, 'show', `${ref}:${f}`], { encoding: 'utf8' }) : readFileSync(join(root, f), 'utf8'));
  const macros = new Set();
  for (const l of read('packaging/macros.omx-contract.in').split('\n')) {
    const m = /^%(omx_contract_[A-Za-z0-9_]+)\b/.exec(l);
    if (m) macros.add(m[1]);
  }
  const pc = {};
  for (const p of PCS) {
    pc[p] = new Set(['prefix', 'pcfiledir']);
    for (const l of read(`${p}.pc.in`).split('\n')) {
      const m = /^([A-Za-z_][A-Za-z0-9_]*)=/.exec(l);
      if (m) pc[p].add(m[1]);
    }
  }
  return { macros, pc, noMajor: read('tools/install-contract-dir.sh').includes('no_major_argument') };
}

/** The lines of a file with backslash continuations joined, each with the number of its first line. */
function logicalLines(text) {
  const out = [];
  let buf = '';
  let at = 0;
  text.split('\n').forEach((l, i) => {
    if (!buf) at = i + 1;
    if (/\\$/.test(l)) { buf += l.slice(0, -1) + ' '; return; }
    out.push({ n: at, text: buf + l });
    buf = '';
  });
  if (buf) out.push({ n: at, text: buf });
  return out;
}

const isComment = (t) => /^\s*(#|\/\/|\*|\/\*)/.test(t);

/** The words after the installer on a command line, up to the end of that command (shell quoting and $( ) kept). */
function argsAfter(s) {
  const words = [];
  let w = '';
  let depth = 0;
  let q = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { w += c; if (c === q) q = ''; continue; }
    if (c === '"' || c === "'") { q = c; w += c; continue; }
    if (c === '$' && (s[i + 1] === '(' || s[i + 1] === '{')) { depth++; w += c + s[++i]; continue; }
    if (depth && (c === ')' || c === '}')) { depth--; w += c; continue; }
    if (!depth && /[;|&<>)}]/.test(c)) break;
    if (!depth && /\s/.test(c)) { if (w) words.push(w); w = ''; continue; }
    w += c;
  }
  if (w) words.push(w);
  return words;
}

/** The findings in one file's text: [{ n, what }]. */
export function scanText(text, { macros, pc, noMajor = true }) {
  const lines = logicalLines(text);
  const vars = new Map();
  for (const { text: t } of lines) {
    const m = /^\s*(?:export\s+|override\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*(?:\?|:|::|\+)?=\s*(.*?)\s*$/.exec(t);
    if (m && !isComment(t)) vars.set(m[1], m[2]);
  }
  const installerVars = [...vars].filter(([, v]) => /install-contract-dir\.sh/.test(v)).map(([k]) => k);
  const ref = (k) => `\\$(?:\\(${k}\\)|\\{${k}\\}|${k}\\b)`;
  const call = new RegExp(
    `(?:^|[;&|({]|\\bsh|\\bexec|^\\s*[@-]+)\\s*(?:"?(?:\\S*install-contract-dir\\.sh${installerVars.map((k) => `|${ref(k)}`).join('')})"?)(?=\\s|$)`,
  );
  const findings = [];
  for (const { n, text: t } of lines) {
    if (isComment(t)) continue;
    for (const m of t.matchAll(/%%?\{?(omx_contract_[A-Za-z0-9_]+)/g)) {
      if (!macros.has(m[1])) findings.push({ n, what: `the rpm macro %{${m[1]}} is not defined by packaging/macros.omx-contract.in` });
    }
    for (const m of t.matchAll(/--variable[= ]?['"]?\s*,?\s*['"]?([A-Za-z_][A-Za-z0-9_]*)['"]?\s*[, ]\s*['"]?(omx-contract|libomx-domain)\b(?!-)/g)) {
      if (!pc[m[2]].has(m[1])) findings.push({ n, what: `pkg-config ${m[2]} has no variable ${m[1]} (${m[2]}.pc.in)` });
    }
    const c = noMajor && call.exec(t);
    if (!c || /^\s*(?:export\s+|override\s+)?[A-Za-z_][A-Za-z0-9_]*\s*(?:\?|:|::|\+)?=/.test(t)) continue;
    argsAfter(t.slice(c.index + c[0].length)).forEach((raw, i) => {
      const bare = raw.replace(/^["']|["']$/g, '');
      const v = /^\$(?:\(([A-Za-z_][A-Za-z0-9_]*)\)|\{([A-Za-z_][A-Za-z0-9_]*)\})$/.exec(bare);
      const value = v ? vars.get(v[1] ?? v[2]) : bare;
      if (value !== undefined && /^[0-9]+$/.test(value)) {
        findings.push({ n, what: `install-contract-dir.sh argument ${i + 1} (${raw}) is a schema major; the installer takes none` });
      }
    });
  }
  return findings;
}

/** The findings in one consumer checkout: [`<consumer>:<file>:<line>: <what>`]. */
export function scanCheckout(dir, have, name = basename(dir)) {
  const files = execFileSync('git', ['-C', dir, 'ls-files', '-z'], { encoding: 'utf8', maxBuffer: 1 << 28 })
    .split('\0').filter((f) => f && !SKIP.test(f));
  const out = [];
  for (const f of files) {
    let text;
    try { text = readFileSync(join(dir, f), 'utf8'); } catch { continue; }
    if (text.includes('\0') || !/omx_contract_|--variable|install-contract-dir/.test(text)) continue;
    for (const { n, what } of scanText(text, have)) out.push(`${name}:${f}:${n}: ${what}`);
  }
  return [...new Set(out)];
}

function main(argv) {
  let list = join(ROOT, 'tools/consumers.txt');
  const dirs = [];
  let base = '';
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--list') list = argv[++i];
    else if (argv[i] === '--base') base = argv[++i];
    else dirs.push(argv[i]);
  }
  const have = provided();
  const targets = dirs.map((d) => ({ dir: d, name: basename(d) }));
  let tmp;
  if (!targets.length) {
    tmp = mkdtempSync(join(tmpdir(), 'consumer-drift-'));
    for (const l of readFileSync(list, 'utf8').split('\n')) {
      const t = l.replace(/#.*/, '').trim();
      if (!t) continue;
      const [repo, branch] = t.split(/\s+/);
      const dir = join(tmp, repo.replace('/', '-'));
      try {
        execFileSync('git', ['clone', '-q', '--depth', '1', '--branch', branch, `https://github.com/${repo}.git`, dir], { stdio: ['ignore', 'ignore', 'pipe'] });
      } catch (e) {
        console.error(`consumer-drift: could not clone ${repo} at ${branch}: ${String(e.stderr ?? e.message).trim()}`);
        rmSync(tmp, { recursive: true, force: true });
        return 2;
      }
      targets.push({ dir, name: `${repo}@${branch}` });
    }
  }
  const all = targets.flatMap((t) => scanCheckout(t.dir, have, t.name));
  const before = base ? new Set(targets.flatMap((t) => scanCheckout(t.dir, provided(ROOT, base), t.name))) : new Set();
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  const found = all.filter((f) => !before.has(f));
  for (const f of found) console.log(f);
  console.error(`consumer-drift: ${targets.length} consumer(s), ${found.length} finding(s)` +
    (base ? ` this change makes (${all.length - found.length} already there at ${base})` : ''));
  return found.length ? 1 : 0;
}

if (isMain(import.meta.url)) {
  try { process.exitCode = main(process.argv.slice(2)); } catch (e) { console.error(`consumer-drift: ${e.message}`); process.exitCode = 2; }
}
