#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
#
# c-loader-check.sh — the installed C loader packages (libomx-domain and its development package; deb libomx-domain0 and
# libomx-domain-dev), checked from outside the checkout with nothing but what they installed: libomx-domain.pc resolves,
# a program written against omx_domain.h and omx_contract_codes.h builds and links with it, the installed library exports
# exactly the ABI list the development package ships, and a missing domain is refused with the code and exit status 78.
# Needs a C compiler and pkg-config. Exit 0 all hold, 1 a failure, 2 a missing tool.
set -eu
command -v cc >/dev/null && command -v pkg-config >/dev/null && command -v nm >/dev/null || { echo "c-loader-check: needs cc, pkg-config and nm" >&2; exit 2; }
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
cd "$tmp"

pkg-config --exists libomx-domain || { echo "c-loader-check: libomx-domain.pc does not resolve" >&2; exit 1; }
abi=$(pkg-config --variable=abifile libomx-domain)
[ -f "$abi" ] || { echo "c-loader-check: no ABI list at $abi" >&2; exit 1; }
cat > consumer.c <<'C'
#include <omxcontract/omx_domain.h>
#include <stdio.h>
int main(void) {
  omx_domain *d = NULL;
  omx_domain_error err;
  int rc = omx_domain_open("no-such-domain", NULL, &d, &err);
  if (rc != OMX_CONTRACT_CODE_DIR_ABSENT || d != NULL) return 1;
  if (omx_domain_code(rc) == NULL) return 1;
  printf("%s\n", err.code);
  return 0;
}
C
# shellcheck disable=SC2046
cc -Wall -Werror consumer.c -o consumer $(pkg-config --cflags --libs libomx-domain) || { echo "c-loader-check: the consumer does not build" >&2; exit 1; }
out=$(./consumer) && [ "$out" = contract.dir.absent ] || { echo "c-loader-check: the consumer got \"$out\"" >&2; exit 1; }

lib=$(pkg-config --variable=libdir libomx-domain)/libomx-domain.so.0
nm -D --defined-only "$lib" | awk '$2 == "T" { sub(/@@.*/, "", $3); print $3 }' | LC_ALL=C sort | diff -u "$abi" - || { echo "c-loader-check: the installed library exports differ from $abi" >&2; exit 1; }

rc=0
omx-domain no-such-domain >/dev/null 2>"$tmp/err" || rc=$?
[ "$rc" -eq 78 ] && grep -q contract.dir.absent "$tmp/err" || { echo "c-loader-check: omx-domain exit $rc, want 78 and contract.dir.absent" >&2; exit 1; }
echo "c-loader-check: libomx-domain builds a consumer, exports its ABI list, refuses a missing domain with 78"
