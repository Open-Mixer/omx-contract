#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
#
# package-files.sh — which file lands in which binary package (BUILDING.md): the RPMs or the debs of one build held to
# the tree they were built from, with no node, what CI runs after each build.
#
#   package-files.sh rpm <dir of the RPMs>
#   package-files.sh deb <dir of the debs>
#
# omx-contract-data holds data/ installed as contract.d/<schema major>/omx-contract/ (less scale-vectors.json, with its
# MANIFEST.json), the contract and param domains (contract.d/contract/contract.json, contract.d/param/param.json), the schema, the committed renders and languages.json under share/omx-contract; each language pack its one catalog
# (share/omx-contract/catalogs/<lang>.json, a pack per language of languages.json); the development package the C
# render, the hand-written C beside it (less omx_domain.h and omx_contract_codes.h), omx-contract.pc, install-contract-dir.sh, the kernel recipe (recipes/, #227) and (RPM) the rpm macros; the command package the command, its tree under
# /usr/lib/omx-contract and its man page; python3-omx-contract the package omx_contract (catalog and scale, the
# share/omx-contract readers under their module names) in the interpreter's site-packages (RPM) or dist-packages (deb),
# shown as /SITE with the bytecode left out; the C loader's two arch-dependent packages (libomx-domain, libomx-domain-devel; deb libomx-domain0, libomx-domain-dev) the library, and
# its two headers, libomx-domain.pc, the ABI list and the omx-domain command. No file is in two packages, and the command, the development package and
# each pack require omx-contract-data at their own version; the command requires node with no version and recommends
# pkg-config; the build gave exactly these packages. Prints each package's list; exit 0 equal, 1 a difference, 2 usage.
set -eu

kind=${1-} dir=${2-}
{ [ "$kind" = rpm ] || [ "$kind" = deb ]; } && [ -d "$dir" ] || { sed -n '7,9p' "$0" >&2; exit 2; }
major=$(sed -n 's/^  "x-omx-schema-version": "\([0-9]*\)\..*",$/\1/p' schema/omx-contract.schema.json)
[ -n "$major" ] || { echo "package-files.sh: run it from the tree the packages were built from" >&2; exit 2; }
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# the files of one package, one absolute path a line, sorted; no directory, no build-id link, no licence or doc file
files() {
  if [ "$kind" = rpm ]; then
    rpm -qp --qf '[%{FILEMODES:perms} %{FILENAMES}\n]' "$1" | grep -v -e '^d' -e '/\.build-id/' | cut -d' ' -f2
  else
    dpkg-deb -c "$1" | awk '$1 !~ /^d/ { print $6 }' | sed 's|^\./|/|'
  fi | grep -v -e '^/usr/share/licenses/' -e '^/usr/share/doc/' | LC_ALL=C sort
}

pkgfile() {
  # the C loader's packages are arch-dependent, every other package is noarch (rpm) or all (deb); the main rpm is arch-dependent too
  if [ "$kind" = rpm ]; then
    case $1 in omx-contract|libomx-domain|libomx-domain-devel) set -- "$dir/$1"-[0-9]*."$(uname -m)".rpm ;; *) set -- "$dir/$1"-[0-9]*.noarch.rpm ;; esac
  else
    case $1 in libomx-domain0|libomx-domain-dev) set -- "$dir/$1"_*_"$(dpkg --print-architecture)".deb ;; *) set -- "$dir/$1"_*_all.deb ;; esac
  fi
  [ "$#" -eq 1 ] && [ -f "$1" ] || { echo "package-files.sh: not one package file for $pkg under $dir" >&2; exit 1; }
  echo "$1"
}

if [ "$kind" = rpm ]; then data=omx-contract-data devel=omx-contract-devel; else data=omx-contract-data devel=libomx-contract-dev; fi
cli=omx-contract py=python3-omx-contract
# the C loader (libomx-domain): the library package and its development package, arch-dependent; /LIB is the library
# directory of the platform (/usr/lib64, or /usr/lib/<triplet>)
if [ "$kind" = rpm ]; then dlib=libomx-domain ddev=libomx-domain-devel; else dlib=libomx-domain0 ddev=libomx-domain-dev; fi
echo /LIB/libomx-domain.so.0 > "$tmp/want-$dlib"
{ for h in omx_domain.h omx_contract_codes.h; do echo "/usr/include/omxcontract/$h"; done
  echo /LIB/libomx-domain.so
  echo /LIB/pkgconfig/libomx-domain.pc
  echo /usr/share/omx-contract/abi/libomx-domain.abi
  echo /usr/bin/omx-domain
  echo /usr/share/man/man1/omx-domain.1; } | LC_ALL=C sort > "$tmp/want-$ddev"
# the shipped languages, from the one line of languages.json that lists them
langs=$(sed -n 's/^  "languages": \[\(.*\)\],*$/\1/p' share/omx-contract/languages.json | tr -d '" ' | tr ',' ' ')
[ -n "$langs" ] || { echo "package-files.sh: share/omx-contract/languages.json lists no language" >&2; exit 2; }
if [ "$kind" = rpm ]; then pack=omx-contract-langpack-; else pack=omx-contract-l10n-; fi
packs=
for l in $langs; do packs="$packs $pack$l"; echo "/usr/share/omx-contract/catalogs/$l.json" > "$tmp/want-$pack$l"; done

# what the tree says each package holds
(cd data && find . -name '*.json' ! -path ./scale-vectors.json | sed "s|^\./|/usr/share/omx-contract/contract.d/$major/omx-contract/|"
  echo "/usr/share/omx-contract/contract.d/$major/omx-contract/MANIFEST.json"
  echo /usr/share/omx-contract/contract.d/contract/contract.json
  echo /usr/share/omx-contract/contract.d/param/param.json
  for f in omx-contract.json omx-vocabulary.schema.json omx-resource-hints.ttl omx_contract_catalog.py omx_contract_scale.py scale-vectors.json clap-kind-vectors.json; do echo "/usr/share/omx-contract/$f"; done
  echo /usr/share/omx-contract/languages.json
  for f in ../shapes/*.schema.json; do echo "/usr/share/omx-contract/shapes/$(basename "$f")"; done
  echo /usr/share/omx-contract/omx-contract.schema.json; echo /usr/share/omx-contract/domain.schema.json) | LC_ALL=C sort > "$tmp/want-$data"
# (the shapes' schemas, docs/shapes.md, beside the schema; the shapes' TypedDicts under omx_contract/shapes/)
# the renders and the hand-written C (omx_json_write.h) both live in include/omxcontract; the RPM macros of the
# contract directory are the RPM's alone (a deb has no rpm macros directory)
(for h in include/omxcontract/*.h; do case $(basename "$h") in omx_domain.h|omx_contract_codes.h) ;; *) echo "/usr/include/omxcontract/$(basename "$h")" ;; esac; done
  echo /usr/share/omx-contract/install-contract-dir.sh
  for r in recipes/*.json; do echo "/usr/share/omx-contract/recipes/$(basename "$r")"; done
  echo /usr/share/pkgconfig/omx-contract.pc
  [ "$kind" = rpm ] && echo /usr/lib/rpm/macros.d/macros.omx-contract) | LC_ALL=C sort > "$tmp/want-$devel"
(for m in __init__ catalog scale shapes/__init__; do echo "/SITE/omx_contract/$m.py"; done
  for f in share/omx-contract/omx_contract_*_shape.py; do echo "/SITE/omx_contract/shapes/$(basename "$f" _shape.py | sed 's/^omx_contract_//').py"; done) | LC_ALL=C sort > "$tmp/want-$py"

bad=0
for pkg in "$data" "$devel" "$cli" "$py" "$dlib" "$ddev" $packs; do
  f=$(pkgfile "$pkg")
  echo "== $pkg ($(basename "$f"))"
  if [ "$pkg" = "$py" ]; then
    # one interpreter's directory, whatever its version; the bytecode the RPM build compiles is not the tree's
    files "$f" | grep -v '/__pycache__/' | sed 's|^/usr/lib/python3[.0-9]*/[a-z]*-packages/|/SITE/|' > "$tmp/got-$pkg"
  elif [ "$pkg" = "$dlib" ] || [ "$pkg" = "$ddev" ]; then
    # the platform's library directory as /LIB; a symlink's target is no file of the list
    files "$f" | sed -e 's|^/usr/share/man/man1/omx-domain\.1.*|/usr/share/man/man1/omx-domain.1|' -e 's|^/usr/lib64/|/LIB/|' -e 's|^/usr/lib/[a-z0-9_]*-linux-gnu[a-z0-9]*/|/LIB/|' | LC_ALL=C sort > "$tmp/got-$pkg"
  else
    files "$f" > "$tmp/got-$pkg"
  fi
  # the command's vendored npm tree is counted, not listed
  grep -v '^/usr/lib/omx-contract/node_modules/' "$tmp/got-$pkg" || true
  n=$(grep -c '^/usr/lib/omx-contract/node_modules/' "$tmp/got-$pkg" || true)
  [ "$n" -eq 0 ] || echo "(and $n files under /usr/lib/omx-contract/node_modules/)"
  if [ "$pkg" = "$cli" ]; then
    # the command: /usr/bin/omx-contract, its man page, and its own tree, nothing under share/omx-contract
    grep -qx /usr/bin/omx-contract "$tmp/got-$pkg" || { echo "$pkg: no /usr/bin/omx-contract"; bad=1; }
    grep -q '^/usr/lib/omx-contract/bin/omx-contract.mjs$' "$tmp/got-$pkg" || { echo "$pkg: no /usr/lib/omx-contract/bin/omx-contract.mjs"; bad=1; }
    grep -v -e '^/usr/bin/omx-contract$' -e '^/usr/lib/omx-contract/' -e '^/usr/share/man/man1/omx-contract\.1' "$tmp/got-$pkg" > "$tmp/stray" || true
    [ ! -s "$tmp/stray" ] || { echo "$pkg: files outside the command's places:"; cat "$tmp/stray"; bad=1; }
  else
    diff -u "$tmp/want-$pkg" "$tmp/got-$pkg" || { echo "$pkg: the files differ from the tree's (- the tree, + the package)"; bad=1; }
  fi
done

# one file, one package
LC_ALL=C sort "$tmp"/got-* | uniq -d > "$tmp/twice"
[ ! -s "$tmp/twice" ] || { echo "files in two packages:"; cat "$tmp/twice"; bad=1; }

# the development package of the loader requires its library at a floor (>=), and ships the tree's ABI list
f=$(pkgfile "$ddev")
if [ "$kind" = rpm ]; then
  v=$(rpm -qp --qf '%{VERSION}-%{RELEASE}' "$f")
  rpm -qp --requires "$f" | grep -Eq "^libomx-domain(\\([a-z0-9_-]+\\))? >= $v" || { echo "$ddev: does not require libomx-domain >= $v"; bad=1; }
  rpm2cpio "$f" | cpio -i --to-stdout --quiet './usr/share/omx-contract/abi/libomx-domain.abi' | diff -u abi/libomx-domain.abi - || { echo "$ddev: the installed ABI list differs from the tree's"; bad=1; }
else
  dpkg-deb -f "$f" Depends | tr ',' '\n' | sed 's/^ *//' | grep -q '^libomx-domain0 (>= ' || { echo "$ddev: does not depend on libomx-domain0 (>= version)"; bad=1; }
  dpkg-deb --fsys-tarfile "$f" | tar -xO ./usr/share/omx-contract/abi/libomx-domain.abi | diff -u abi/libomx-domain.abi - || { echo "$ddev: the installed ABI list differs from the tree's"; bad=1; }
fi

# the command, the development package and each pack require the data at their own version
for pkg in "$cli" "$devel" $packs; do
  f=$(pkgfile "$pkg")
  if [ "$kind" = rpm ]; then
    v=$(rpm -qp --qf '%{VERSION}-%{RELEASE}' "$f")
    rpm -qp --requires "$f" | grep -qx "$data = $v" || { echo "$pkg: does not require $data = $v"; bad=1; }
  else
    v=$(dpkg-deb -f "$f" Version)
    dpkg-deb -f "$f" Depends | tr ',' '\n' | sed 's/^ *//' | grep -qx "$data (= $v)" || { echo "$pkg: does not depend on $data (= $v)"; bad=1; }
  fi
done
# the command runs on node with no version (the code runs on every node the releases carry, bookworm's 18 included; a
# floor above a release's node makes the package uninstallable there), and recommends pkg-config, which --installed
# reads the contract directory through
f=$(pkgfile "$cli")
if [ "$kind" = rpm ]; then
  rpm -qp --requires "$f" | grep -qx nodejs || { echo "$cli: does not require nodejs, with no version"; bad=1; }
  ! rpm -qp --requires "$f" | grep -q '^nodejs ' || { echo "$cli: requires nodejs at a version"; bad=1; }
  rpm -qp --recommends "$f" | grep -qx /usr/bin/pkg-config || { echo "$cli: does not recommend /usr/bin/pkg-config"; bad=1; }
else
  dpkg-deb -f "$f" Depends | tr ',' '\n' | sed 's/^ *//' | grep -qx nodejs || { echo "$cli: does not depend on nodejs, with no version"; bad=1; }
  dpkg-deb -f "$f" Recommends | grep -Eq '(^|[ ,|])pkg-?conf' || { echo "$cli: does not recommend pkg-config"; bad=1; }
fi
# the build gave these packages and no other (the debug packages of the arch-dependent ones aside): a package added to
# the spec or the control and never checked here is named
for f in "$dir"/*."$kind"; do
  case $f in *.src.rpm) continue ;; esac
  if [ "$kind" = rpm ]; then n=$(rpm -qp --qf '%{NAME}' "$f"); else n=$(dpkg-deb -f "$f" Package); fi
  case $n in *-debuginfo|*-debugsource|*-dbgsym) continue ;; esac
  echo "$n"
done | LC_ALL=C sort > "$tmp/built"
for pkg in "$data" "$devel" "$cli" "$py" "$dlib" "$ddev" $packs; do echo "$pkg"; done | LC_ALL=C sort > "$tmp/checked"
diff -u "$tmp/checked" "$tmp/built" || { echo "the packages built are not the ones this check holds (- checked, + built)"; bad=1; }
[ "$bad" -eq 0 ] && echo "package-files.sh: every file in its package; $cli and $devel require $data; the command needs node with no version"
exit "$bad"
