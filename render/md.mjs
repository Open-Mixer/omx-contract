// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * `render --target md` (docs/render.md, "The domains as a reference"; omx-contract#202): the read's vocabularies as
 * human-readable pages, one per domain and one per package for its classic data items, from the same resolved items
 * the json target reads. It is the doc check too: an item, a word or a code with no doc refuses the render, by page,
 * item and word, and nothing is written.
 */
import { linksOf } from '../lib/links.mjs';

/**
 * The page an item is on: a domain document's item (`<domain>/<leaf>.json`, its leaf the domain's last segment) is on
 * its domain's page, a nested domain's `/` read `-`; any other on its package's (`pkg`, or `fallback`).
 */
export function pageOf(r, fallback) {
  const rel = String(r.rel ?? '').replace(/^data\//, '');
  const parts = rel.split('/');
  const leaf = parts.at(-1).replace(/\.json$/, '');
  if (parts.length > 1 && parts.at(-2) === leaf) return parts.slice(0, -1).join('-');
  return r.pkg ?? fallback;
}

/** A table cell: one line, its pipes escaped. */
const cell = (v) => (v === undefined || v === null ? '' : String(v).replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|'));
const code = (v) => (v === undefined || v === null || v === '' ? '' : `\`${String(v).replace(/`/g, "'")}\``);
const table = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---|').join('')}`, ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`)];

/**
 * An item's source links as one line, `Source: impl `a`, `b`; from `c`.` (a from map's field before its link, a link's
 * own `at` after it), read by links.mjs's linksOf as `links` reads them; none when the item has no source (#215).
 */
function sourceLine(source) {
  const links = linksOf(source);
  if (!links.length) return [];
  const one = (l) => `${l.field ? `${l.field}: ` : ''}${code(l.link)}${l.at ? ` at ${code(l.at)}` : ''}`;
  const roles = ['impl', 'from'].filter((role) => links.some((l) => l.role === role));
  return [`Source: ${roles.map((role) => `${role} ${links.filter((l) => l.role === role).map(one).join(', ')}`).join('; ')}.`, ''];
}

/** A sheet's leaves, `[dotted field, value]`, in the sheet's order. */
function leaves(v, at = '') {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return [[at, Array.isArray(v) ? v.join(', ') : v]];
  return Object.entries(v).flatMap(([k, x]) => leaves(x, at ? `${at}.${k}` : k));
}

/** The body of one item's section, after its heading and doc line. */
function body(r) {
  const v = r.value;
  if (r.kind === 'words') {
    return table(['Word', 'Key', 'Group', 'Unit', 'Doc'], Object.entries(v).map(([k, w]) => [code(w.word), k, w.group ?? '', w.symbol ?? w.dimension ?? w.figureUnit ?? '', w.doc]));
  }
  if (r.kind === 'codes') return table(['Code', 'Key', 'Doc'], Object.entries(v).map(([k, c]) => [code(c.code), k, c.doc]));
  if (r.kind === 'set') return [`Ids: ${v.map(code).join(', ')}.${r.default === undefined ? '' : ` Default: ${code(r.default)}.`}`];
  if (r.kind === 'list') return [`Values: ${v.map((x) => code(x)).join(', ')}${r.unit ? ` (${r.unit})` : ''}.`];
  if (r.kind === 'scalar') return [`Value: ${code(v)}${r.unit ? ` ${r.unit}` : ''}.`];
  if (r.kind === 'sheet') return table(['Field', 'Value'], leaves(v).map(([f, x]) => [code(f), code(x)]));
  return [];
}

/** What a page lacks: one line per item, word or code with no doc. */
function undocumented(page, r) {
  const out = [];
  const none = (d) => typeof d !== 'string' || !d.trim();
  if (none(r.doc)) out.push(`${page}: ${r.name}: the item has no doc`);
  if (r.kind === 'words') for (const [k, w] of Object.entries(r.value)) if (none(w.doc)) out.push(`${page}: ${r.name}: ${w.word ?? k}: the word has no doc`);
  if (r.kind === 'codes') for (const [k, c] of Object.entries(r.value)) if (none(c.doc)) out.push(`${page}: ${r.name}: ${c.code ?? k}: the code has no doc`);
  return out;
}

/**
 * The md render of `resolved`: `[{ path: '<page>.md', text }]`, pages and items in name order. `pkg` keeps that
 * package's pages (its domains are the pages its items are on); `fallback` names the package of classic items with no
 * `pkg` (omx-contract's own read); `sources` maps an item's name to its effective source (`links`' reading), printed as
 * one line under its doc. Throws, naming every undocumented item, word and code, when any has no doc.
 */
export function renderMd(resolved, { pkg, fallback = 'omx-contract', sources = new Map() } = {}) {
  const pages = new Map();
  for (const r of resolved.values()) {
    if (pkg !== undefined && (r.pkg ?? fallback) !== pkg) continue;
    const page = pageOf(r, fallback);
    if (!pages.has(page)) pages.set(page, []);
    pages.get(page).push(r);
  }
  const missing = [...pages].flatMap(([page, items]) => items.flatMap((r) => undocumented(page, r)));
  if (missing.length) throw new Error(`render --target md refused: an undocumented item, word or code\n${missing.join('\n')}`);
  return [...pages.keys()].sort().map((page) => {
    const items = pages.get(page).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    const lines = [`# ${page}`, '', `<!-- GENERATED by \`omx-contract render --target md\`, from the declarations: do not edit. -->`, ''];
    for (const r of items) {
      lines.push(`## ${r.name}`, '', `${r.kind}${r.since ? `, since ${r.since}` : ''}. ${cell(r.doc)}`, '');
      lines.push(...sourceLine(sources.get(r.name)));
      const b = body(r);
      if (b.length) lines.push(...b, '');
    }
    return { path: `${page}.md`, text: lines.join('\n') };
  });
}
