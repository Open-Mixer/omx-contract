// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * The omx-contract format (docs/contract-dir.md, `x-omx-contract`): the schema's `x-omx-schema-version`, read once
 * here, and the `MAJOR.MINOR` every domain document and manifest states. A small module of no dependency, so the
 * runtime reader (domain-reader) and the build readers read the one value.
 */
import { readFileSync } from 'node:fs';

const SCHEMA = JSON.parse(readFileSync(new URL('../schema/omx-contract.schema.json', import.meta.url), 'utf8'));

/** The schema's version, x.y.z: the omx-contract release that last changed it. */
export const SCHEMA_VERSION: string = SCHEMA['x-omx-schema-version'];

/** The format major this omx-contract reads: a document of another one is refused by name. */
export const FORMAT_MAJOR = Number(SCHEMA_VERSION.split('.')[0]);

/** The format a document this omx-contract writes states, `x-omx-contract`: MAJOR.MINOR of the schema. */
export const CONTRACT_FORMAT = SCHEMA_VERSION.split('.').slice(0, 2).join('.');

/** A format as a document states it: MAJOR.MINOR, no leading zero. */
export const FORMAT = /^(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
