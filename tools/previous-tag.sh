#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
# The previous release of this version's major, the tag release.yml's semver step compares with: the newest v<major>.*
# tag merged into HEAD other than v<version> itself, or nothing (the first release of the major). A tag of another
# major is never the previous release: 0.23.0 is the first of the 0.M.m line (the owner's ruling of 2026-11-25: every
# version is 0.M.m until 1.0) and the v3.* tags before it stay, unread here. No tag is deleted.
#
#   sh tools/previous-tag.sh <version>      prints the tag, or nothing; exit 2 on a version that is not x.y.z
printf '%s\n' "$1" | grep -Eqx '[0-9]+\.[0-9]+\.[0-9]+' || { echo "previous-tag: '$1' is not a version x.y.z" >&2; exit 2; }
major=${1%%.*}
git tag --list "v$major.*" --sort=-v:refname --merged HEAD | grep -vx "v$1" | head -1
