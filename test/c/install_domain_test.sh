#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
# tools/install-contract-dir.sh --domain, read by the C loader: the fixture domain `demo` is installed into a temporary
# contract directory and omx-domain (omx_domain_open_at) reads a word from it; the installed files are the source's bytes.
# Usage: install_domain_test.sh <omx-domain> <fixtures dir> <install-contract-dir.sh>
set -u
bin=$1
fix=$2
script=$3
tmp=$(mktemp -d) || exit 1
trap 'rm -rf "$tmp"' EXIT
fail=0
mkdir -p "$tmp/src/contract.d"
cp -R "$fix/demo" "$tmp/src/contract.d/demo"
sh "$script" --domain "$tmp/src/contract.d/demo" "$tmp/dir" >/dev/null || { echo "install_domain_test: the install failed" >&2; exit 1; }
diff -r "$fix/demo" "$tmp/dir/demo" >/dev/null || { echo "install_domain_test: the installed domain is not the source's bytes" >&2; fail=1; }
out=$(OMX_CONTRACT_PATH=$tmp/dir "$bin" demo 1.0.0 DEMO_COLORS fbs-fixed 2>&1) || { echo "install_domain_test: omx-domain refused: $out" >&2; fail=1; }
case $out in *fbsFixed*"A dashed word."*) ;; *) echo "install_domain_test: a word of the installed domain: unexpected output: $out" >&2; fail=1 ;; esac
[ $fail -eq 0 ] && echo "install_domain_test: all checks passed"
exit $fail
