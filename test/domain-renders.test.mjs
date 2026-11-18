// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// A domain ships its JSON (+ catalogs) and a codes header, and no other render (docs/runtime-data.md, "The migration"):
// a domain's words are read at run time, so no committed file here holds a render of one. This holds the committed
// renders and goldens (include/, share/, python/, test/golden/) to it, by the domain and the file's name.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { ROOT } from './helpers.mjs';

/** The domains that left omx-contract, and the items each took with it: a name of one in a committed render is a render of the domain. */
const MOVED = {
};

const SURFACE = ['include', 'share', 'python', 'test/golden'];

/** What a codes header never holds (docs/render.md): a word string, a text, an initializer, an argument list. */
const NOT_CODES = /_INIT\b|_TEXT_[A-Z]{2}\b|_ARGS_|^#define [A-Za-z0-9_]+(\([A-Z]\))? .*"/m;

/** `<file>: a render of <domain> that is not codes` for each committed render that holds a render of a domain. */
export function nonCodeRenders(files, read) {
  const bad = [];
  for (const f of files) {
    const text = read(f);
    const dir = /(^|\/)omxdomain\/([^/]+)$/.exec(f);
    const codes = dir ? /^(.+)_codes\.h$/.exec(dir[2]) : null;
    if (codes) {
      const hit = NOT_CODES.exec(text);
      if (hit) bad.push(`${f}: a render of ${codes[1]} that is not codes (${hit[0].slice(0, 40)})`);
      continue; // the codes header of a domain holds that domain's names, by design
    }
    if (dir) {
      bad.push(`${f}: a render of ${/^[a-z0-9]+/.exec(dir[2])[0]} that is not codes`);
      continue;
    }
    for (const [domain, items] of Object.entries(MOVED)) {
      const hit = new RegExp(`(?<![A-Za-z0-9])(${items.join('|')})(?![A-Za-z0-9])`).exec(text);
      if (hit) bad.push(`${f}: a render of ${domain} that is not codes (${hit[1]})`);
    }
  }
  return bad;
}

const tracked = () => execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', ...SURFACE], { cwd: ROOT, encoding: 'utf8' }).split('\0').filter(Boolean);

test('no committed render or golden is a render of a domain that is not codes', () => {
  const bad = nonCodeRenders(tracked(), (f) => readFileSync(join(ROOT, f), 'utf8'));
  assert.deepEqual(bad, []);
});

test('the gate names the file and the domain of a render of one', () => {
  const read = (f) => (f === 'include/x.h' ? '#define OMX_SCAN_DOCUMENTS_COUNT 2u' : '');
  const saved = { ...MOVED };
  MOVED.scan = ['SCAN_DOCUMENTS'];
  try {
    assert.deepEqual(nonCodeRenders(['include/x.h', 'include/omxcontract/omxdomain/scan_vocabulary.h'], read), [
      'include/x.h: a render of scan that is not codes (SCAN_DOCUMENTS)',
      'include/omxcontract/omxdomain/scan_vocabulary.h: a render of scan that is not codes',
    ]);
  } finally {
    for (const k of Object.keys(MOVED)) delete MOVED[k];
    Object.assign(MOVED, saved);
  }
});

test('a domain\'s codes header passes, and one that carries more than codes is refused by name', () => {
  const codes = '#define OMX_SCAN_DOCUMENTS_PDF 0u\n#define OMX_SCAN_DOCUMENTS_COUNT 2u\n#define OMX_SCAN_DOCUMENTS(X) \\\n    X(OMX_SCAN_DOCUMENTS_PDF, PDF)\n';
  const files = { 'include/omxdomain/scan_codes.h': codes, 'include/omxdomain/dsp_codes.h': `${codes}#define OMX_SCAN_DOCUMENTS_INIT { "pdf" }\n`, 'include/omxdomain/dsp_kernels_codes.h': `${codes}#define OMX_SCAN_DOCUMENTS_PDF_TEXT_EN "Pdf."\n`, 'include/omxdomain/scan_vocabulary.h': codes };
  const bad = nonCodeRenders(Object.keys(files), (f) => files[f]);
  assert.deepEqual(bad.map((b) => b.split(' (')[0]), [
    'include/omxdomain/dsp_codes.h: a render of dsp that is not codes',
    'include/omxdomain/dsp_kernels_codes.h: a render of dsp_kernels that is not codes',
    'include/omxdomain/scan_vocabulary.h: a render of scan that is not codes',
  ]);
});
