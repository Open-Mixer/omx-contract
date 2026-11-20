// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Whether the module at `moduleUrl` is the script node was asked to run, not a module imported by another one.
 *
 * Both sides are real paths: npx and npm run start a command through `node_modules/.bin/<name>`, a symlink, so
 * `process.argv[1]` is the link while `import.meta.url` is the file it points to.
 *
 * @param moduleUrl the calling module's `import.meta.url`
 * @returns true when `process.argv[1]` resolves to that module
 */
export function isMain(moduleUrl: string): boolean {
  const script = process.argv[1];
  if (!script) return false;
  try {
    return realpathSync(script) === realpathSync(fileURLToPath(moduleUrl));
  } catch {
    return false;
  }
}
