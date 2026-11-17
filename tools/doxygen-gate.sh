#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 Pau Aliagas
#
# The documentation gate of the installed C headers (docs/render.md "Documentation", omx-contract#64): doxygen over
# the headers with the repository's Doxyfile, its warnings keyed by header and text (no line number, so a declaration
# that moves is the same line), compared with the baseline, the sorted list of today's undocumented declarations.
# Red on a warning the baseline does not carry (a new or renamed public declaration must be documented) AND on a
# baseline line the warnings no longer carry (the declaration was documented: strike the line in the same change).
# With a base's baseline given, red on any line of the baseline the base's does not carry: the list only shrinks.
# A header with no `@file` block is refused before doxygen runs, since doxygen reads none of a file's globals without
# one and would report nothing. The headers read are the tracked ones (`git ls-files`), so a stray file beside them
# counts on neither side; `--input <dir>` reads every header of that directory instead (a test's scratch copy).
# `--list` prints the current warnings for the hand that strikes lines; `--update` writes them as the baseline only
# when they are a subset of it (the list lowers), and refuses by name otherwise; the shrink check holds both to the
# base.
#
#   tools/doxygen-gate.sh [--input <dir>] [--baseline <file>] [--base-baseline <file>] [--list | --update]
#
# exit 0 at the baseline, 1 red (the lines on stderr), 2 when the gate cannot run (no doxygen, no Doxyfile, no
# baseline file, no git for the tracked headers): never a pass.
set -eu

input=
baseline=docs/doxygen-baseline.txt
base_baseline=
mode=check
while [ $# -gt 0 ]; do
  case $1 in
    --input) input=$2; shift 2 ;;
    --baseline) baseline=$2; shift 2 ;;
    --base-baseline) base_baseline=$2; shift 2 ;;
    --list) mode=list; shift ;;
    --update) mode=update; shift ;;
    *) echo "doxygen-gate: unknown argument $1" >&2; exit 2 ;;
  esac
done

command -v doxygen >/dev/null 2>&1 || { echo "doxygen-gate: doxygen is not installed; the gate cannot run" >&2; exit 2; }
[ -f Doxyfile ] || { echo "doxygen-gate: no Doxyfile in $PWD; run from the repository root" >&2; exit 2; }

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# the headers read: the tracked ones of include/omxcontract/, or every header of --input
if [ -n "$input" ]; then
  headers=$(ls "$input"/*.h 2>/dev/null || true)
  [ -n "$headers" ] || { echo "doxygen-gate: no header under $input" >&2; exit 2; }
else
  headers=$(git ls-files -- 'include/omxcontract/*.h' 2>/dev/null) || { echo "doxygen-gate: git ls-files failed; the tracked headers cannot be listed" >&2; exit 2; }
  [ -n "$headers" ] || { echo "doxygen-gate: no tracked header under include/omxcontract/" >&2; exit 2; }
fi
# shellcheck disable=SC2086 # $headers is a newline-separated list of paths with no spaces, meant to split
set -- $headers

# every installed header documents itself, or doxygen reads none of its declarations
nofile=$(grep -L '@file' "$@" || true)
if [ -n "$nofile" ]; then
  echo "doxygen-gate: a header with no @file block is read by doxygen as having no public declaration:" >&2
  echo "$nofile" | sed 's/^/  /' >&2
  exit 1
fi

# doxygen's warnings, keyed <header>: <text>; its output goes to the scratch directory and is thrown away
{ cat Doxyfile; echo "INPUT=$*"; echo "OUTPUT_DIRECTORY=$tmp/out"; echo "GENERATE_HTML=YES"; } | doxygen - >/dev/null 2>"$tmp/raw" || {
  echo "doxygen-gate: doxygen failed:" >&2; cat "$tmp/raw" >&2; exit 2; }
sed -E 's#^.*/##; s/:[0-9]+: /: /' "$tmp/raw" | LC_ALL=C sort -u > "$tmp/now"

if [ "$mode" = list ]; then cat "$tmp/now"; exit 0; fi

[ -f "$baseline" ] || { echo "doxygen-gate: no baseline at $baseline" >&2; exit 2; }
LC_ALL=C sort -u "$baseline" > "$tmp/base"
red=0

if [ "$mode" = update ]; then
  new=$(LC_ALL=C comm -23 "$tmp/now" "$tmp/base")
  if [ -n "$new" ]; then
    echo "doxygen-gate: --update only lowers the baseline; undocumented public declarations it does not carry (document them):" >&2
    echo "$new" | sed 's/^/  /' >&2
    exit 1
  fi
  cp "$tmp/now" "$baseline"
  echo "doxygen-gate: $baseline written, $(wc -l < "$tmp/now" | tr -d ' ') lines ($(wc -l < "$tmp/base" | tr -d ' ') before)"
  exit 0
fi

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
