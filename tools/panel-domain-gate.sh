#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
#
# panel-domain-gate.sh — the merge-order gate of the panel words' removal (docs/contract-dir.md, "Domains"): omx-contract
# stops carrying PANEL_* only once the package that OWNS contract.d/panel, omx-panel-contract (split from omx-panel in
# omx-panel#119), ships contract.d/panel/panel.json from the package channel, so no consumer is left without the words.
# Refuses (exit 1, by name) when the channel offers no package providing the file, and an EMPTY answer is a refusal, never
# a pass; exit 2 when the query itself cannot run. A query of a file path needs the filelists metadata, which dnf5 does
# not load by default, so it is asked for. Nothing here installs anything.
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
  dnf=$(command -v dnf5 || command -v dnf) || { echo "panel-domain-gate: no dnf: the channel cannot be queried" >&2; exit 2; }
  out=$("$dnf" repoquery --setopt=optional_metadata_types=filelists --qf '%{name}\n' --whatprovides "$file") || { echo "panel-domain-gate: dnf repoquery failed" >&2; exit 2; }
fi
if printf '%s\n' "$out" | grep -qx 'omx-panel-contract'; then
  echo "panel-domain-gate: omx-panel-contract provides $file in the channel"
  exit 0
fi
echo "panel-domain-gate: REFUSED: no omx-panel-contract in the package channel provides $file; omx-contract must not drop the panel words before their owner ships them (omx-panel#102, omx-panel#119)" >&2
exit 1
