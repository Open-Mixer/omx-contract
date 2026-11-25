#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
#
# install-contract-dir.sh — install definition files into the contract directory (docs/contract-dir.md), no node:
#   install-contract-dir.sh [-x <rel>]... <package> <version> <from dir> <contractdir> [<tree>]
#   install-contract-dir.sh --domain <path>/contract.d/<domain> <contractdir> <package>
#   install-contract-dir.sh --owner <package> <version> <contractdir> <domain>...
# The contract directory has no schema-major level (owner ruling 2026-11-25): a package is <contractdir>/<package>/,
# beside the domains, and shares <contractdir>/<name>/ with the domain of its name (docs/contract-dir.md, "One name, one
# directory"). The format a manifest states ("x-omx-contract": MAJOR.MINOR) and the major of an installed "$schema" are
# read from the omx-contract.schema.json beside this script (installed: the same directory; a checkout: ../schema/),
# never passed; a domain document must state a format of that major.
# Package: copies every .json under <from dir> (less each -x <rel>) to <contractdir>/<package>/, writes a relative
# "$schema" as the schema major's URL, and writes MANIFEST.json with each file's sha256 (<tree>: its "tree"). A
# reinstall removes the files its previous manifest listed, never a domain sharing the directory.
# Domain: copies the directory as it is to <contractdir>/<domain>/ (its <leaf>.json and catalogs/<lang>.json, no
# rewrite, no manifest); the domain is the path after the last contract.d/. <package> is the package whose build
# installs it, and the document's info.x-owner must name it (#88). A nested domain directory is skipped: each domain
# is installed by its own call.
# Owner: a package whose contract is only domains (no data file): writes <contractdir>/<package>/MANIFEST.json with no files and "domains", the domains named (each installed by its own --domain call; the reader
# refuses a listed domain that is not installed). Exit 0 installed; 1 a refusal (a file named); 2 usage.
set -eu

# the format, MAJOR.MINOR of the x-omx-schema-version of the schema installed beside this script, or of a checkout's schema/
schema_format() {
  here=$(cd "$(dirname "$0")" && pwd)
  for s in "$here/omx-contract.schema.json" "$here/../schema/omx-contract.schema.json"; do
    [ -f "$s" ] || continue
    m=$(sed -n 's/^  "x-omx-schema-version": "\([0-9]*\.[0-9]*\)\.[0-9]*",$/\1/p' "$s")
    [ -n "$m" ] || { echo "install-contract-dir.sh: $s states no x-omx-schema-version" >&2; exit 2; }
    echo "$m"
    return 0
  done
  echo "install-contract-dir.sh: no omx-contract.schema.json beside $0 (nor ../schema/): the schema major is read from it" >&2
  exit 2
}
# a schema major where the signature of before took one: refused, never read as a directory
no_major_argument() {
  case $1 in *[!0-9]* | '') ;; *) echo "install-contract-dir.sh: '$1' is a schema major; the contract directory has no major level (docs/contract-dir.md, 2026-11-25), and no argument names one" >&2; exit 2 ;; esac
}
# the one owner of <dir>/<name>/: a domain document <name>.json there names it in info.x-owner (#88, two owners in one directory)
same_owner() {
  doc=$1/$2.json
  [ -f "$doc" ] || return 0
  o=$(grep -o '"x-owner"[[:space:]]*:[[:space:]]*"[^"]*"' "$doc" | sed 's/.*"\([^"]*\)"$/\1/')
  [ "$o" = "$2" ] || { echo "install-contract-dir.sh: $doc: the domain $2 is owned by ${o:-nobody}, and $1 would hold the package $2: two owners in one directory" >&2; exit 1; }
}
# a reinstall of a package: the files its previous manifest listed and the manifest go, a domain sharing the directory stays
remove_previous() {
  [ -f "$1/MANIFEST.json" ] || return 0
  sed -n 's/^    "\([^"]*\)": "[0-9a-f]\{64\}",*$/\1/p' "$1/MANIFEST.json" | while read -r f; do rm -f "$1/$f"; done
  rm -f "$1/MANIFEST.json"
  find "$1" -mindepth 1 -depth -type d -empty -exec rmdir {} + 2>/dev/null || true
}

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
  # the format the document is written in (docs/contract-dir.md): x-omx-contract, MAJOR.MINOR of this schema's major
  formats=$(grep -o '"x-omx-contract"[[:space:]]*:[[:space:]]*"[^"]*"' "$from/$leaf.json" | sed 's/.*"\([^"]*\)"$/\1/')
  [ -n "$formats" ] || refuse "$from/$leaf.json: no x-omx-contract; a domain document states the omx-contract format it is written in"
  [ "$(printf '%s\n' "$formats" | wc -l)" -eq 1 ] || refuse "$from/$leaf.json: more than one x-omx-contract key"
  printf '%s\n' "$formats" | grep -Eqx '(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)' || refuse "$from/$leaf.json: x-omx-contract \"$formats\" is not MAJOR.MINOR"
  format=$(schema_format)
  [ "${formats%%.*}" = "${format%%.*}" ] || refuse "$from/$leaf.json: x-omx-contract $formats is of the format major ${formats%%.*}; this omx-contract installs ${format%%.*}"
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
  # one name, one directory: a manifest beside the domain is the package of that name, which must be the domain's owner
  if [ -f "$dest/MANIFEST.json" ] && [ "$owners" != "$name" ]; then
    refuse "$dest/MANIFEST.json: $dest holds the package $name, and the domain $name is owned by $owners: two owners in one directory"
  fi
  if [ -f "$dest/MANIFEST.json" ] && grep -Eq '^    "catalogs/' "$dest/MANIFEST.json"; then
    refuse "$dest/MANIFEST.json: the package $name lists files under catalogs/, the place of the domain $name's catalogs"
  fi
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
  [ "$#" -ge 5 ] || { sed -n '6,8p' "$0" >&2; echo "install-contract-dir.sh: --owner needs <package> <version> <contractdir> and at least one domain" >&2; exit 2; }
  pkg=$2 version=$3 to=$4
  no_major_argument "$to"
  shift 4
  case $pkg in *[!a-z0-9-]* | '' | -*) echo "install-contract-dir.sh: package $pkg is not a lower-case name" >&2; exit 2 ;; esac
  format=$(schema_format)
  echo "$version" | grep -Eq '^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$' || { echo "install-contract-dir.sh: version $version is not x.y.z" >&2; exit 2; }
  list='' seen=''
  for d in "$@"; do
    printf '%s\n' "$d" | grep -Eq '^[a-z][a-z0-9-]*(/[a-z][a-z0-9-]*)*$' || { echo "install-contract-dir.sh: the domain name '$d' is not [a-z][a-z0-9-]* segments" >&2; exit 2; }
    case " $seen " in *" $d "*) echo "install-contract-dir.sh: the domain $d is named twice" >&2; exit 2 ;; esac
    seen="$seen $d"
    list="$list${list:+, }\"$d\""
  done
  dest=$to/$pkg
  same_owner "$to/$pkg" "$pkg"
  remove_previous "$dest"
  install -d "$dest"
  printf '{\n  "package": "%s",\n  "version": "%s",\n  "x-omx-contract": "%s",\n  "files": {},\n  "domains": [%s]\n}\n' "$pkg" "$version" "$format" "$list" > "$dest/MANIFEST.json"
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
[ "$#" -eq 4 ] || [ "$#" -eq 5 ] || { sed -n '6,8p' "$0" >&2; exit 2; }
pkg=$1 version=$2 from=$3 to=$4 tree=${5-}
no_major_argument "$from"
case $pkg in *[!a-z0-9-]* | '' | -*) echo "install-contract-dir.sh: package $pkg is not a lower-case name" >&2; exit 2 ;; esac
echo "$version" | grep -Eq '^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$' || { echo "install-contract-dir.sh: version $version is not x.y.z" >&2; exit 2; }
[ -d "$from" ] || { echo "install-contract-dir.sh: no directory $from" >&2; exit 2; }

format=$(schema_format)
major=${format%%.*}
dest=$to/$pkg
url="https://openmixer.org/schema/omx-contract/v$major/omx-contract.schema.json"
same_owner "$to/$pkg" "$pkg"
list=$(cd "$from" && find . -type f -name '*.json' | sed 's|^\./||' | LC_ALL=C sort)
# a file the previous manifest lists is the package's own, never a domain's (it goes at the reinstall)
listed_before() { [ -f "$dest/MANIFEST.json" ] && grep -Fq "    \"$1\": \"" "$dest/MANIFEST.json"; }
# one name, one directory: no file of the package in the place of a domain sharing it (docs/contract-dir.md)
for rel in $list; do
  if printf '%s\n' "$exclude" | grep -Fxq "$rel"; then continue; fi
  [ "$rel" != "$pkg.json" ] || { echo "install-contract-dir.sh: $from/$rel: $pkg.json is the place of the domain $pkg's document; a data file of the package $pkg is never named so" >&2; exit 1; }
  case $rel in catalogs/*) [ ! -f "$dest/$pkg.json" ] || { echo "install-contract-dir.sh: $from/$rel: catalogs/ of $dest is the domain $pkg's" >&2; exit 1; } ;; esac
  d='' rest=$rel
  while :; do
    case $rest in */*) seg=${rest%%/*} rest=${rest#*/} ;; *) break ;; esac
    d=$d${d:+/}$seg
    [ ! -f "$dest/$d/$seg.json" ] || listed_before "$d/$seg.json" || { echo "install-contract-dir.sh: $from/$rel: $dest/$d/ is the nested domain $pkg/$d" >&2; exit 1; }
  done
done
remove_previous "$dest"
install -d "$dest"
manifest="$dest/MANIFEST.json"
{
  printf '{\n  "package": "%s",\n  "version": "%s",\n  "x-omx-contract": "%s",\n' "$pkg" "$version" "$format"
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
