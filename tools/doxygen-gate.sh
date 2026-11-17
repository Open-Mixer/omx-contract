#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
#
# The documentation gate of the installed C headers (docs/render.md "Documentation", omx-contract#64): doxygen over
# the headers with the repository's Doxyfile, its warnings keyed by header and text (no line number, so a declaration
# that moves is the same line), compared with the baseline, the sorted list of today's undocumented declarations.
# Red on a warning the baseline does not carry (a new or renamed public declaration must be documented) AND on a
# baseline line the warnings no longer carry (the declaration was documented: strike the line in the same change).
# With a base's baseline given, red on any line of the baseline the base's does not carry: the list only shrinks.
# A header with no `@file` block is refused before doxygen runs, since doxygen reads none of a file's globals without
# one and would report nothing. No option writes the baseline: `--list` prints the current warnings for the hand that
# strikes lines, and the shrink check holds that hand to the base.
#
#   tools/doxygen-gate.sh [--input <dir>] [--baseline <file>] [--base-baseline <file>] [--list]
#
# exit 0 at the baseline, 1 red (the lines on stderr), 2 when the gate cannot run (no doxygen, no baseline file): never
# a pass.
set -eu

input=include/omxcontract
baseline=docs/doxygen-baseline.txt
base_baseline=
list=
while [ $# -gt 0 ]; do
  case $1 in
    --input) input=$2; shift 2 ;;
    --baseline) baseline=$2; shift 2 ;;
    --base-baseline) base_baseline=$2; shift 2 ;;
    --list) list=1; shift ;;
    *) echo "doxygen-gate: unknown argument $1" >&2; exit 2 ;;
  esac
done

command -v doxygen >/dev/null 2>&1 || { echo "doxygen-gate: doxygen is not installed; the gate cannot run" >&2; exit 2; }
[ -f Doxyfile ] || { echo "doxygen-gate: no Doxyfile here; run from the repository root" >&2; exit 2; }

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# every installed header documents itself, or doxygen reads none of its declarations
nofile=$(grep -L '@file' "$input"/*.h || true)
if [ -n "$nofile" ]; then
  echo "doxygen-gate: a header with no @file block is read by doxygen as having no public declaration:" >&2
  echo "$nofile" | sed 's/^/  /' >&2
  exit 1
fi

# doxygen's warnings, keyed <header>: <text>; its output goes to the scratch directory and is thrown away
{ cat Doxyfile; echo "INPUT=$input"; echo "OUTPUT_DIRECTORY=$tmp/out"; echo "GENERATE_HTML=YES"; } | doxygen - >/dev/null 2>"$tmp/raw" || {
  echo "doxygen-gate: doxygen failed:" >&2; cat "$tmp/raw" >&2; exit 2; }
sed -E 's#^.*/##; s/:[0-9]+: /: /' "$tmp/raw" | LC_ALL=C sort -u > "$tmp/now"

if [ -n "$list" ]; then cat "$tmp/now"; exit 0; fi

[ -f "$baseline" ] || { echo "doxygen-gate: no baseline at $baseline" >&2; exit 2; }
LC_ALL=C sort -u "$baseline" > "$tmp/base"
red=0

new=$(LC_ALL=C comm -23 "$tmp/now" "$tmp/base")
if [ -n "$new" ]; then
  echo "doxygen-gate: undocumented public declarations the baseline does not carry (document them):" >&2
  echo "$new" | sed 's/^/  /' >&2
  red=1
fi

stale=$(LC_ALL=C comm -13 "$tmp/now" "$tmp/base")
if [ -n "$stale" ]; then
  echo "doxygen-gate: baseline lines whose declaration is documented now (strike them from $baseline):" >&2
  echo "$stale" | sed 's/^/  /' >&2
  red=1
fi

if [ -n "$base_baseline" ]; then
  LC_ALL=C sort -u "$base_baseline" > "$tmp/parent"
  grown=$(LC_ALL=C comm -23 "$tmp/base" "$tmp/parent")
  if [ -n "$grown" ]; then
    echo "doxygen-gate: the baseline only shrinks; lines added against the base (document the declarations instead):" >&2
    echo "$grown" | sed 's/^/  /' >&2
    red=1
  fi
fi

if [ "$red" = 0 ]; then
  echo "doxygen-gate: $(wc -l < "$tmp/base" | tr -d ' ') undocumented public declarations, all in the baseline; none new"
fi
exit $red
