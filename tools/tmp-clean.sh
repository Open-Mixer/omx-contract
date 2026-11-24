#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 Pau Aliagas
# tmp-clean.sh <command>...: run the command under a fresh, empty TMPDIR and refuse one that leaves anything in it.
# The suite made about 27 directories a run and /tmp ran out of inodes (#169); npm test runs the whole suite once
# under it, so a file that leaks is caught whichever it is, with no list of files to keep (test audit row 13).
# The runtime's own node-compile-cache is not counted.
# Exit: the command's own status when it fails, 1 when it leaves a file or a directory (each named), 0 otherwise.
t=$(mktemp -d "${TMPDIR:-/tmp}/omx-tmp-clean-XXXXXX") || exit 2
TMPDIR=$t "$@"
rc=$?
# node-compile-cache is the runtime's own module cache (node writes it under TMPDIR when the compile cache is on), no test's
left=$(ls -A "$t" | grep -vx 'node-compile-cache')
rm -rf "$t"
[ "$rc" -eq 0 ] || exit "$rc"
[ -z "$left" ] || { echo "tmp-clean: the suite left these in TMPDIR:" >&2; echo "$left" >&2; exit 1; }
