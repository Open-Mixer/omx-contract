#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
# The omx-domain command (docs/runtime-data.md, "The C loader"): `omx-domain <domain> [needs] [item [word]]`.
# It reads OMX_CONTRACT_PATH (a test and development override, ruling 2); a refused domain exits 78 (EX_CONFIG) with
# the code, the domain and the reason on stderr. Usage: cli_test.sh <omx-domain> <fixtures dir>
set -u
bin=$1
fix=$2
fail=0
check() { # check <name> <want status> <got status>
  if [ "$2" != "$3" ]; then echo "cli_test: $1: exit $3, want $2" >&2; fail=1; fi
}

out=$(OMX_CONTRACT_PATH=$fix "$bin" demo 1.0.0 DEMO_COLORS fbs-fixed 2>&1); check "a word" 0 $?
case $out in *fbsFixed*"A dashed word."*) ;; *) echo "cli_test: a word: unexpected output: $out" >&2; fail=1 ;; esac

out=$(OMX_CONTRACT_PATH=$fix "$bin" demo 2>&1); check "a domain alone" 0 $?
case $out in *demo*) ;; *) echo "cli_test: a domain alone prints no name: $out" >&2; fail=1 ;; esac

out=$(OMX_CONTRACT_PATH=$fix "$bin" absent 2>&1); check "an absent domain" 78 $?
case $out in *contract.dir.absent*absent*) ;; *) echo "cli_test: absent: unexpected message: $out" >&2; fail=1 ;; esac

out=$(OMX_CONTRACT_PATH=$fix "$bin" notjson 2>&1); check "a domain that is not JSON" 78 $?
case $out in *contract.file.not-json*) ;; *) echo "cli_test: notjson: unexpected message: $out" >&2; fail=1 ;; esac

out=$(OMX_CONTRACT_PATH=$fix "$bin" demo 9.0.0 2>&1); check "a domain below the floor" 78 $?
case $out in *contract.package.too-old*) ;; *) echo "cli_test: floor: unexpected message: $out" >&2; fail=1 ;; esac

out=$(OMX_CONTRACT_PATH=$fix "$bin" demo 1.0.0 NO_SUCH 2>&1); check "an unknown item" 1 $?
case $out in *contract.item.unknown*) ;; *) echo "cli_test: unknown item: unexpected message: $out" >&2; fail=1 ;; esac

out=$("$bin" 2>&1); check "no argument" 64 $?

# no OMX_CONTRACT_PATH: the installed directory (the fixtures, as the library was built here)
out=$(env -u OMX_CONTRACT_PATH "$bin" demo 2>&1); check "the installed directory" 0 $?

[ $fail -eq 0 ] && echo "cli_test: all checks passed"
exit $fail
