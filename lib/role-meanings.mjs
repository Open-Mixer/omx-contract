// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * The roleMeanings items (docs/contract-dir.md "A package's role meanings"): the panel roles a package declares and
 * the descriptor meaning each plays. The schema holds each row's shape and its meaning to the closed list; the rule
 * held here, over a whole read so that `validate` (a data directory) and the contract-directory reader refuse the
 * same thing, is that a role has one owner. Each problem names its CONTRACT_CODES code by name.
 */

/** Every role of the read, in item order: `[{ item, key, row, rel, pkg }]`. */
export function rolesOf(items) {
  const out = [];
  for (const it of items.values()) {
    if (it.item?.kind !== 'roleMeanings') continue;
    for (const [key, row] of Object.entries(it.item.roles ?? {})) out.push({ item: it.name, key, row, rel: it.rel, pkg: it.pkg });
  }
  return out;
}

/** The meaning of every role the read declares: `Map<role, meaning>` (`unknown` for a role that plays none). */
export function meaningOfRoles(items) {
  return new Map(rolesOf(items).map(({ row }) => [row.role, row.meaning]));
}

/**
 * The problems of every role of `items` (a read's items, `Map<name, { name, rel, item, pkg }>`):
 * `[{ name, rel, item, message }]`, `name` the CONTRACT_CODES name: roleDuplicate (one role declared twice, by one
 * package or two).
 */
export function roleProblems(items) {
  const out = [];
  const owners = new Map();
  for (const { item, key, row, rel, pkg } of rolesOf(items)) {
    const at = `${item}.${key}`;
    if (owners.has(row.role)) {
      const o = owners.get(row.role);
      out.push({ name: 'roleDuplicate', rel, item: at, message: `${row.role}: already declared by ${o.at}${o.pkg ? ` (${o.pkg})` : ''}${pkg ? `, and again by ${pkg}` : ''}: a role has one owner` });
    } else owners.set(row.role, { at, pkg });
  }
  return out;
}
