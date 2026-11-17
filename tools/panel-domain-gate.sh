#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
#
# panel-domain-gate.sh — the merge-order gate of the panel words' removal (docs/contract-dir.md, "Domains"): omx-contract
# stops carrying PANEL_* only once omx-panel, the owner, ships contract.d/panel/panel.json from the package channel, so
# no consumer is left without the words. Refuses (exit 1, by name) when the channel offers no package providing the
# file; exit 2 when the query itself cannot run. Nothing here installs anything.
#
#   panel-domain-gate.sh
#
# PANEL_GATE_QUERY overrides the repository query (a command printing the package names that provide the file, one per
# line), for the gate's own sabotage test; it is never set in CI.
set -eu
file=/usr/share/omx-contract/contract.d/panel/panel.json
if [ -n "${PANEL_GATE_QUERY:-}" ]; then
  out=$($PANEL_GATE_QUERY) || { echo "panel-domain-gate: the query failed" >&2; exit 2; }
else
  command -v dnf >/dev/null || { echo "panel-domain-gate: no dnf: the channel cannot be queried" >&2; exit 2; }
  out=$(dnf repoquery --qf '%{name}\n' --whatprovides "$file") || { echo "panel-domain-gate: dnf repoquery failed" >&2; exit 2; }
fi
if printf '%s\n' "$out" | grep -qx 'omx-panel'; then
  echo "panel-domain-gate: omx-panel provides $file in the channel"
  exit 0
fi
echo "panel-domain-gate: REFUSED: no omx-panel in the package channel provides $file; omx-contract must not drop the panel words before omx-panel ships them (omx-panel#102)" >&2
exit 1
