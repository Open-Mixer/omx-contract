// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// The classic terms items of data/formats/ as the domain modules of docs/contract-dir.md ("Domains"): formats/common
// (the kinds and statuses every module shares) and one module per format. The conversion omx-formats' modules were
// written with (omx-contract#81, move 12), and the inverse a test reads them back through.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ID = 'https://openmixer.org/contract';
const KINDS = `${ID}/formats/common#/components/schemas/FORMATS_COMMON_KINDS`;
const STATUSES = `${ID}/formats/common#/components/schemas/FORMATS_COMMON_STATUSES`;

const filesUnder = (dir) => readdirSync(dir).sort().flatMap((n) => (statSync(join(dir, n)).isDirectory() ? filesUnder(join(dir, n)) : [join(dir, n)]));
const camel = (w) => w.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

/** What each kind of term is, one line, for the common module's words. */
export const KIND_DOCS = {
  specification: 'A specification as a whole.', class: 'A class of things a specification defines.', 'plugin-class': 'A class a plugin is of.',
  property: 'A property a thing may carry.', datatype: 'A datatype a value may have.', 'port-property': 'A property a port may carry.',
  feature: 'A feature a plugin may require or offer.', 'extension-data': 'Data a plugin hands a host to extend it.', option: 'An option a host sets.',
  parameter: 'A parameter a host or plugin states.', channel: 'A channel designation.', 'port-protocol': 'A protocol a port speaks.',
  unit: 'A unit a value is measured in.', individual: 'A named individual of a class.', extension: 'An extension a host or plugin may offer.',
  factory: 'A factory a library exposes.', 'plugin-feature': 'A feature a plugin declares about itself.', 'port-type': 'A type a port may have.',
  'window-api': 'A windowing API a graphical interface may use.', 'event-type': 'A type of event.', 'note-dialect': 'A dialect a note port speaks.',
  'process-status': 'A status a process call returns.', 'log-severity': 'A severity a log line carries.', flag: 'A bit of a set of flags.',
  'enum-value': 'A value of an enumeration.', constant: 'A constant a header declares.',
};
export const STATUS_DOCS = { used: 'A consumer reads or writes the term today.', 'supported-later': 'An issue brings the term.', 'out-of-scope': 'A ruling keeps the term out.' };

const words = (name, doc, since, list, docs) => ({ description: doc, 'x-since': since, oneOf: list.map((w, i) => ({ const: w, title: camel(w), description: docs[w], 'x-code': i })) });

/** The three documents `{ 'formats/common', 'formats/clap', 'formats/lv2' }` of the terms of the data directory `dir`/formats. */
export function formatsModules(dir, versions = '1.0.0') {
  const kinds = new Set();
  const statuses = new Set();
  const mods = { clap: {}, lv2: {} };
  for (const f of filesUnder(join(dir, 'formats')).filter((p) => p.endsWith('.json'))) {
    for (const [name, it] of Object.entries(JSON.parse(readFileSync(f, 'utf8')))) {
      if (name === '$schema') continue;
      for (const k of Object.keys(it)) if (!['kind', 'since', 'doc', 'format', 'spec', 'version', 'deprecated', 'terms'].includes(k)) throw new Error(`${name}: ${k} has no place in a domain`);
      for (const t of Object.values(it.terms)) { kinds.add(t.kind); statuses.add(t.status); }
      mods[it.format][name] = {
        description: it.doc, 'x-since': it.since, 'x-format': it.format, 'x-spec': it.spec, 'x-version': it.version,
        ...(it.deprecated ? { 'x-deprecated': true } : {}),
        'x-kinds': { $ref: KINDS }, 'x-statuses': { $ref: STATUSES },
        oneOf: Object.entries(it.terms).map(([key, t]) => ({ const: key, title: t.id ?? t.uri, 'x-term': t })),
      };
    }
  }
  const module = (name, title, schemas) => ({ $schema: 'https://json-schema.org/draft/2020-12/schema', $id: `${ID}/formats/${name}`, info: { title, version: versions, 'x-owner': 'omx-formats' }, components: { schemas } });
  return {
    'formats/common': module('common', 'The terms every plugin format shares', {
      FORMATS_COMMON_KINDS: words('', 'What a term of a plugin format is.', '1.0.0', Object.keys(KIND_DOCS).filter((k) => kinds.has(k)), KIND_DOCS),
      FORMATS_COMMON_STATUSES: words('', 'What a term is to us.', '1.0.0', Object.keys(STATUS_DOCS), STATUS_DOCS),
    }),
    'formats/clap': module('clap', 'The CLAP terms', mods.clap),
    'formats/lv2': module('lv2', 'The LV2 terms', mods.lv2),
  };
}
