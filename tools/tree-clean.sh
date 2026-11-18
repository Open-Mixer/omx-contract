#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 Pau Aliagas
# After the suite: no untracked file stands under the committed renders (include/, share/, ts/, python/). A test that
# writes there leaks into the render checks of the suites running beside it, and into the next run. Exit 1 names them;
# outside a git work tree there is nothing to compare, and it passes.
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0
left=$(git ls-files --others --exclude-standard -- include share ts python 2>/dev/null)
[ -z "$left" ] || { echo "tree-clean: the suite left untracked files under the renders:" >&2; echo "$left" >&2; exit 1; }
