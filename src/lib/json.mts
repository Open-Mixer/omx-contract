// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
/**
 * The shapes the modules share for what they read as JSON: a document or an item is an object whose fields the
 * schema, not this type, holds to their shape, so a field is read as `any` and checked where it is used.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = any;
/** A JSON object: a document, an item, a row. */
export type JsonObject = { [key: string]: Json };
