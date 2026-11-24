#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
#
# install-contract-dir.sh — install definition files into the contract directory (docs/contract-dir.md), no node:
#   install-contract-dir.sh [-x <rel>]... <package> <version> <schema major> <from dir> <contractdir> [<tree>]
#   install-contract-dir.sh --domain <path>/contract.d/<domain> <contractdir> <package>
#   install-contract-dir.sh --owner <package> <version> <schema major> <contractdir> <domain>...
# Package: copies every .json under <from dir> (less each -x <rel>) to <contractdir>/<schema major>/<package>/, writes a
# relative "$schema" as that major's URL, and writes MANIFEST.json with each file's sha256 (<tree>: its "tree").
# Domain: copies the directory as it is to <contractdir>/<domain>/ (its <leaf>.json and catalogs/<lang>.json, no
# rewrite, no manifest); the domain is the path after the last contract.d/. <package> is the package whose build
# installs it, and the document's info.x-owner must name it (#88). A nested domain directory is skipped: each domain
# is installed by its own call.
# Owner: a package whose contract is only domains (no data file): writes <contractdir>/<schema major>/<package>/
# MANIFEST.json with no files and "domains", the domains named (each installed by its own --domain call; the reader
# refuses a listed domain that is not installed). Exit 0 installed; 1 a refusal (a file named); 2 usage.
set -eu

if [ "$#" -gt 0 ] && [ "$1" = --domain ]; then
  usage() { sed -n '6,8p' "$0" >&2; echo "install-contract-dir.sh: $1" >&2; exit 2; }
  [ "$#" -eq 4 ] || usage "--domain needs <path>/contract.d/<domain>, <contractdir> and <package>, the package that installs it"
  from=${2%/}
  to=$3
  pkg=$4
  printf '%s\n' "$pkg" | grep -Eq '^[a-z][a-z0-9-]*$' || usage "the package '$pkg' is not [a-z][a-z0-9-]*"
  rest=/$from
  while :; do case $rest in */contract.d/*) rest=${rest#*/contract.d/} ;; *) break ;; esac; done
  [ "$rest" != "/$from" ] || usage "$from has no contract.d/ component"
  name=$rest
  segs='[a-z][a-z0-9-]*'
  printf '%s\n' "$name" | grep -Eq "^$segs(/$segs)*\$" || usage "the domain name '$name' (after the last contract.d/) is not [a-z][a-z0-9-]* segments"
  [ -d "$from" ] || usage "no directory $from"
  leaf=${name##*/}
  refuse() { echo "install-contract-dir.sh: $1" >&2; exit 1; }
  [ ! -L "$from/$leaf.json" ] && [ -f "$from/$leaf.json" ] || refuse "$from/$leaf.json: a domain holds its document <leaf>.json"
  # the domain's owner is the package that installs it (#88): info.x-owner, the one "x-owner" key of the document
  owners=$(grep -o '"x-owner"[[:space:]]*:[[:space:]]*"[^"]*"' "$from/$leaf.json" | sed 's/.*"\([^"]*\)"$/\1/')
  [ -n "$owners" ] || refuse "$from/$leaf.json: no info.x-owner; a domain names the package that owns it"
  [ "$(printf '%s\n' "$owners" | wc -l)" -eq 1 ] || refuse "$from/$leaf.json: more than one x-owner key"
  [ "$owners" = "$pkg" ] || refuse "$from/$leaf.json: its info.x-owner is $owners, not $pkg: a package installs only the domains it owns"
  for e in "$from"/* "$from"/.[!.]* "$from"/..?*; do
    [ -e "$e" ] || [ -L "$e" ] || continue
    b=${e##*/}
    [ ! -L "$e" ] || refuse "$e: a symlink"
    if [ "$b" = "$leaf.json" ] && [ -f "$e" ]; then continue; fi
    if [ "$b" = catalogs ] && [ -d "$e" ]; then
      for c in "$e"/* "$e"/.[!.]* "$e"/..?*; do
        [ -e "$c" ] || [ -L "$c" ] || continue
        [ ! -L "$c" ] || refuse "$c: a symlink"
        [ -f "$c" ] && printf '%s\n' "${c##*/}" | grep -Eq '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*\.json$' || refuse "$c: a domain catalog is catalogs/<lang>.json"
      done
      continue
    fi
    # a nested domain: a directory holding its own <leaf>.json; installed by its own call
    if [ -d "$e" ] && printf '%s\n' "$b" | grep -Eq "^$segs\$" && [ ! -L "$e/$b.json" ] && [ -f "$e/$b.json" ]; then continue; fi
    refuse "$e: a domain holds only $leaf.json, catalogs/<lang>.json and nested domains"
  done
  dest=$to/$name
  install -d "$dest"
  rm -rf "$dest/$leaf.json" "$dest/catalogs"
  install -m 0644 "$from/$leaf.json" "$dest/$leaf.json"
  n=1
  if [ -d "$from/catalogs" ]; then
    install -d "$dest/catalogs"
    for c in "$from"/catalogs/*; do
      [ -e "$c" ] || continue
      install -m 0644 "$c" "$dest/catalogs/${c##*/}"
      n=$((n + 1))
    done
  fi
  echo "install-contract-dir.sh: domain $name: $n files under $dest"
  exit 0
fi

if [ "$#" -gt 0 ] && [ "$1" = --owner ]; then
  [ "$#" -ge 6 ] || { sed -n '6,8p' "$0" >&2; echo "install-contract-dir.sh: --owner needs <package> <version> <schema major> <contractdir> and at least one domain" >&2; exit 2; }
  pkg=$2 version=$3 major=$4 to=$5
  shift 5
  case $pkg in *[!a-z0-9-]* | '' | -*) echo "install-contract-dir.sh: package $pkg is not a lower-case name" >&2; exit 2 ;; esac
  case $major in *[!0-9]* | '') echo "install-contract-dir.sh: schema major $major is not a number" >&2; exit 2 ;; esac
  echo "$version" | grep -Eq '^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$' || { echo "install-contract-dir.sh: version $version is not x.y.z" >&2; exit 2; }
  list='' seen=''
  for d in "$@"; do
    printf '%s\n' "$d" | grep -Eq '^[a-z][a-z0-9-]*(/[a-z][a-z0-9-]*)*$' || { echo "install-contract-dir.sh: the domain name '$d' is not [a-z][a-z0-9-]* segments" >&2; exit 2; }
    case " $seen " in *" $d "*) echo "install-contract-dir.sh: the domain $d is named twice" >&2; exit 2 ;; esac
    seen="$seen $d"
    list="$list${list:+, }\"$d\""
  done
  dest=$to/$major/$pkg
  rm -rf "$dest"
  install -d "$dest"
  printf '{\n  "package": "%s",\n  "version": "%s",\n  "schemaMajor": %s,\n  "files": {},\n  "domains": [%s]\n}\n' "$pkg" "$version" "$major" "$list" > "$dest/MANIFEST.json"
  chmod 0644 "$dest/MANIFEST.json"
  echo "install-contract-dir.sh: $pkg $version: no data file, the domains$seen"
  exit 0
fi

exclude=''
while [ "$#" -gt 0 ] && [ "$1" = -x ]; do
  [ "$#" -ge 2 ] || { echo "install-contract-dir.sh: -x needs a value" >&2; exit 2; }
  exclude="$exclude
$2"
  shift 2
done
[ "$#" -eq 5 ] || [ "$#" -eq 6 ] || { sed -n '6,8p' "$0" >&2; exit 2; }
pkg=$1 version=$2 major=$3 from=$4 to=$5 tree=${6-}
case $pkg in *[!a-z0-9-]* | '' | -*) echo "install-contract-dir.sh: package $pkg is not a lower-case name" >&2; exit 2 ;; esac
case $major in *[!0-9]* | '') echo "install-contract-dir.sh: schema major $major is not a number" >&2; exit 2 ;; esac
echo "$version" | grep -Eq '^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$' || { echo "install-contract-dir.sh: version $version is not x.y.z" >&2; exit 2; }
[ -d "$from" ] || { echo "install-contract-dir.sh: no directory $from" >&2; exit 2; }

dest=$to/$major/$pkg
url="https://openmixer.org/schema/omx-contract/v$major/omx-contract.schema.json"
rm -rf "$dest"
install -d "$dest"
list=$(cd "$from" && find . -type f -name '*.json' | sed 's|^\./||' | LC_ALL=C sort)
manifest="$dest/MANIFEST.json"
{
  printf '{\n  "package": "%s",\n  "version": "%s",\n  "schemaMajor": %s,\n' "$pkg" "$version" "$major"
  [ -z "$tree" ] || printf '  "tree": "%s",\n' "$tree"
  printf '  "files": {'
} > "$manifest.tmp"
sepr=''
n=0
for rel in $list; do
  if printf '%s\n' "$exclude" | grep -Fxq "$rel"; then continue; fi
  echo "$rel" | grep -Eq '^[A-Za-z0-9_+.-]+(/[A-Za-z0-9_+.-]+)*\.json$' || { echo "install-contract-dir.sh: $rel is a name the manifest cannot carry" >&2; rm -f "$manifest.tmp"; exit 1; }
  install -d "$dest/$(dirname "$rel")"
  sed -e "1,3s|^\\(  \"\\\$schema\": \"\\)\\(\\.\\./\\)*schema/omx-contract\\.schema\\.json\"|\\1$url\"|" "$from/$rel" > "$dest/$rel"
  chmod 0644 "$dest/$rel"
  sum=$(sha256sum "$dest/$rel" | cut -d' ' -f1)
  printf '%s\n    "%s": "%s"' "$sepr" "$rel" "$sum" >> "$manifest.tmp"
  sepr=','
  n=$((n + 1))
done
[ "$n" -gt 0 ] || { echo "install-contract-dir.sh: no .json file under $from" >&2; rm -f "$manifest.tmp"; exit 1; }
printf '\n  }\n}\n' >> "$manifest.tmp"
mv "$manifest.tmp" "$manifest"
chmod 0644 "$manifest"
echo "install-contract-dir.sh: $pkg $version: $n files under $dest"
