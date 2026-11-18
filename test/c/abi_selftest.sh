#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
# The self-test of `make check-abi`: the check must catch an export it was not told of, a function or a global
# variable alike. Each arm builds a stand-in libomx-domain.so.0 that exports abi/libomx-domain.abi plus one extra
# symbol, and runs the check against it (the sources are marked old, so the stand-in is never rebuilt): the check
# is wrong if it passes. Usage: abi_selftest.sh   (from the repository root)
set -u
cc=${CC:-cc}
tmp=$(mktemp -d) || exit 1
trap 'rm -rf "$tmp"' EXIT
fail=0
arm() { # arm <name> <extra symbol> <its definition>
  d=$tmp/$1
  mkdir -p "$d"
  { while read -r f; do echo "void $f(void) {}"; done < abi/libomx-domain.abi; echo "$3"; } > "$d/stand-in.c"
  { echo "OMX_DOMAIN_0 { global:"; sed 's/$/;/' abi/libomx-domain.abi; echo "$2;"; echo "local: *; };"; } > "$d/stand-in.map"
  $cc -fPIC -shared -Wl,-soname,libomx-domain.so.0 -Wl,--version-script="$d/stand-in.map" "$d/stand-in.c" -o "$d/libomx-domain.so.0" || { echo "FAIL: $1: the stand-in does not build" >&2; fail=1; return; }
  if make -s -o src/c/omx_domain.c -o include/omxcontract/omx_domain.h -o abi/libomx-domain.map check-abi CBUILD="$d" >"$d/out" 2>&1; then
    echo "FAIL: $1: an extra exported $2 is not caught by check-abi" >&2; fail=1
  elif grep -q "^+$2\$" "$d/out"; then echo "ok: $1: check-abi names $2"
  else echo "FAIL: $1: check-abi failed without naming $2" >&2; cat "$d/out" >&2; fail=1; fi
}
arm function omx_domain_extra_function 'void omx_domain_extra_function(void) {}'
arm data omx_domain_extra_data 'int omx_domain_extra_data = 1;'
arm bss omx_domain_extra_bss 'int omx_domain_extra_bss;'
arm rodata omx_domain_extra_rodata 'const int omx_domain_extra_rodata = 1;'
exit $fail
