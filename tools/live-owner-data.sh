#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
#
# live-owner-data.sh <dest> [<tag>]: fetch the omx-dsp that carries the kernels the goldens run over, unpack it below
# <dest> and print the path of its data/ directory: the value of OMX_LIVE_OWNER_DATA (test/live-owners.test.mjs,
# FreeMixer/omx-contract#109). Which omx-dsp, the first that applies:
#   - <tag>, given on the command line;
#   - the commit tools/live-owner.ref names, `<40-hex sha> until v<x.y.z>`, while omx-dsp's latest release is below
#     v<x.y.z>. A release of this repository that removes an item omx-dsp's next release takes over publishes before
#     that release (omx-dsp build-requires it), so the latest release still reads the item and the proof must read the
#     commit the chain ships instead (omx-contract#195). From v<x.y.z> on the pin is retired and the latest release is
#     read, so a re-run of an old tag proves against what the channel serves;
#   - the latest release: the release the ops release-consumers.tsv row of omx-dsp holds its consumers to.
# A failed fetch, a malformed pin or an omx-dsp with no data/kernels is an error, never an empty answer.
: "${GITHUB_REPOSITORY_OWNER:?live-owner-data: GITHUB_REPOSITORY_OWNER is not set (the organization to read omx-dsp from)}"
set -eu
dest=${1:?usage: live-owner-data.sh <dest> [<tag>]}
tag=${2:-}
pin=$(dirname "$0")/live-owner.ref
repo=https://github.com/$GITHUB_REPOSITORY_OWNER/omx-dsp

latest() {
  curl -fsSL ${GITHUB_TOKEN:+-H "Authorization: Bearer $GITHUB_TOKEN"} "https://api.github.com/repos/$GITHUB_REPOSITORY_OWNER/omx-dsp/releases/latest" | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' | head -n 1
}
is_version() { printf '%s\n' "$1" | grep -Eqx 'v[0-9]+\.[0-9]+\.[0-9]+'; }

commit=
if [ -z "$tag" ]; then
  tag=$(latest)
  test -n "$tag" || { echo "live-owner-data: no omx-dsp release found" >&2; exit 1; }
  if [ -f "$pin" ]; then
    lines=$(grep -Ev '^[[:space:]]*(#|$)' "$pin" || true)
    count=$(printf '%s' "$lines" | grep -c '' || true)
    [ "$count" = 1 ] || { echo "live-owner-data: $pin holds $count pins, not one" >&2; exit 1; }
    # shellcheck disable=SC2086 # the one pin line, split into its words on purpose
    set -- $lines
    { [ $# = 3 ] && [ "$2" = until ] && printf '%s\n' "$1" | grep -Eqx '[0-9a-f]{40}' && is_version "$3"; } ||
      { echo "live-owner-data: $pin: '$lines' is not '<40-hex commit> until v<x.y.z>'" >&2; exit 1; }
    is_version "$tag" || { echo "live-owner-data: the latest omx-dsp release '$tag' is no v<x.y.z>" >&2; exit 1; }
    if [ "$(printf '%s\n%s\n' "$3" "$tag" | sort -V | tail -n 1)" = "$tag" ]; then
      echo "live-owner-data: tools/live-owner.ref is retired: omx-dsp $tag is out (the pin waited for $3); reading $tag" >&2
    else
      commit=$1
      echo "live-owner-data: omx-dsp $commit, pinned by tools/live-owner.ref until $3 (the latest release is $tag)" >&2
    fi
  fi
fi
mkdir -p "$dest"
if [ -n "$commit" ]; then
  curl -fsSL "$repo/archive/$commit.tar.gz" | tar -xz -C "$dest"
  data="$dest/omx-dsp-$commit/data"
else
  curl -fsSL "$repo/archive/refs/tags/$tag.tar.gz" | tar -xz -C "$dest"
  data="$dest/omx-dsp-${tag#v}/data"
fi
test -d "$data/kernels" || { echo "live-owner-data: ${commit:-$tag} holds no data/kernels" >&2; exit 1; }
echo "$data"
