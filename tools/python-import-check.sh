#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
#
# python-import-check.sh — the installed python3-omx-contract answers `import omx_contract.catalog` (and .scale, .clap)
# from the interpreter's own path: run from / in isolated mode, so neither the checkout nor PYTHONPATH can supply it
# (omx-contract#28). CI runs it in the RPM and DEB containers after installing that package alone. Exit 0 or 1.
set -eu
cd /
python3 -I -c '
import omx_contract, omx_contract.catalog, omx_contract.scale, omx_contract.clap
assert "/share/omx-contract/" not in omx_contract.catalog.__file__, omx_contract.catalog.__file__
assert omx_contract.catalog.code_key("contract.dir.absent")
assert "%.4f" % omx_contract.scale.scale_position({"scale": "log", "min": 20, "max": 20000}, 1000) == "0.5663"
assert omx_contract.clap.CLAP_IDS["CLAP_EXT_AUDIO_PORTS_CONFIG"] == "clap.audio-ports-config"
print("python-import-check.sh: omx_contract from", omx_contract.__file__)
'
