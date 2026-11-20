# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
#
# Installs the committed renders (include/omxcontract/, share/omx-contract/omx-contract.json), the hand-written C of
# include/omxcontract/omx_json_write.h (hand-written, the one JSON string writer) beside them, the
# schema, omx-contract.pc, and data/ as the package omx-contract of the contract directory
# (CONTRACTDIR/<schema major>/omx-contract/, docs/contract-dir.md) with tools/install-contract-dir.sh, which is
# installed beside the schema for the packages that install their own definitions. No node runs here: a release build (RPM, deb) installs what
# `omx-contract render --check` already holds equal to the data (R-056). `make test` is the node suite.
#
# `make install-cli` installs the omx-contract command, which needs node at run time: the CLI's own files under
# CLIDIR with its runtime dependencies unpacked from the npm tarballs in vendor/ (no network, no npm) and their
# development files (dot files, tests, benchmarks, lint and TypeScript configuration) and their markdown left out, the command in
# BINDIR and its man page.

PREFIX ?= /usr/local
INCLUDEDIR ?= $(PREFIX)/include
DATADIR ?= $(PREFIX)/share
PKGCONFIGDIR ?= $(DATADIR)/pkgconfig
CONTRACTDIR ?= $(DATADIR)/omx-contract/contract.d
BINDIR ?= $(PREFIX)/bin
CLIDIR ?= $(PREFIX)/lib/omx-contract
MANDIR ?= $(DATADIR)/man
RPMMACRODIR ?= $(PREFIX)/lib/rpm/macros.d
SCHEMA_MAJOR := $(shell sed -n 's/^  "x-omx-schema-version": "\([0-9]*\)\..*",$$/\1/p' schema/omx-contract.schema.json)
CC ?= cc
VERSION := $(shell sed -n 's/^  "version": "\(.*\)",$$/\1/p' package.json)

.PHONY: all build-lib build-c install-c check-abi test-c fuzz fuzz-replay check ownership doxygen-check inventory-check layout public-sources install install-cli install-python install-rpm-macros test

all:
	@test -n "$(VERSION)" || { echo "no version in package.json" >&2; exit 1; }
	@test -n "$(SCHEMA_MAJOR)" || { echo "no x-omx-schema-version in schema/omx-contract.schema.json" >&2; exit 1; }

# The library modules (#15): src/lib/*.mts, built by tsc into lib/*.mjs with their .d.mts, a build product the CLI,
# the npm package and every checkout caller load from lib/. TSC is the checkout's (npm ci), else the system's
# (typescript >= 4.8.4, < 7). A package build has no network: when node_modules/ holds no @types/node, the build-only
# types (vendor/build/: @types/node, undici-types) and the runtime tarballs whose types the modules import (vendor/:
# ajv) are unpacked into node_modules/ by their package name first.
TSC ?= $(firstword $(wildcard node_modules/.bin/tsc) tsc)
build-lib: lib/codes.mjs

# A real file target (tsc emits every module of the library in one run, and lib/codes.mjs is one of them): a lib/ no older
# than its sources is a no-op, so an install run beside a parallel test suite never rewrites the modules the suite loads.
lib/codes.mjs: $(wildcard src/lib/*.mts) tsconfig.lib.json
	@if [ ! -d node_modules/@types/node ]; then \
	  for t in vendor/build/*.tgz vendor/*.tgz; do \
	    n=$$(tar -xzOf $$t --wildcards --no-wildcards-match-slash '*/package.json' | sed -n 's/^ *"name": *"\([^"]*\)",*$$/\1/p' | head -1); \
	    test -n "$$n" || { echo "build-lib: $$t names no package" >&2; exit 1; }; \
	    install -d node_modules/$$n && tar -xzf $$t --no-same-owner --strip-components=1 -C node_modules/$$n || exit 1; \
	  done; \
	fi
	$(TSC) -p tsconfig.lib.json

# The headers compile on their own, warnings as errors: the committed renders and the verbs fixture's (test/golden/verbs/).
check: all
	printf '#include <omxcontract/omx_contract_limits.h>\n#include <omxcontract/omx_vocabulary.h>\n#include <omxcontract/omx_resource_hints.h>\n#include <omxcontract/omx_param_units.h>\n#include <omxcontract/omx_formats.h>\n#include <omxcontract/omx_json_write.h>\nint main(void) { return OMX_READOUT_RATE_HZ > 0 && OMX_DECLARED_RATE_COUNT > 0 && OMX_PARAM_SCALES_LINEAR < OMX_PARAM_SCALES_COUNT && OMX_RESOURCE_HINT_COUNT > 0u && OMX_CLAP_REMOTE_CONTROLS_COUNT == 8u && OMX_CLAP_UNIT_DBFS == 256u && omx_json_string(0, 0, "a") == 3 ? 0 : 1; }\n' > check-headers.c
	$(CC) -std=c11 -Wall -Wextra -Werror -Wno-unused-function -Iinclude -Isrc check-headers.c -o check-headers
	./check-headers
	printf '#include "omx_host_verbs.h"\n#include "c/verbs_fixture_host_verbs.h"\n#include "c/verbs_fixture_vocabulary.h"\nint main(void) { return omx_host_verb_level(OMX_VERB_CHAIN, OMX_HOST_VERB_HOST_PLUGIN_HOSTD) == OMX_HOST_VERB_REQUIRED && verbs_fixture_host_verb_find(OMX_VERB_PARAM_INFO) != NULL ? 0 : 1; }\n' > check-headers.c
	$(CC) -std=c11 -Wall -Wextra -Werror -Wno-unused-function -Itest/golden/verbs check-headers.c -o check-headers
	./check-headers
	rm -f check-headers check-headers.c

# The Python readers as the package omx_contract (omx-contract#28): catalog, scale and clap are the files share/omx-contract/
# holds, and the shapes' TypedDicts (docs/shapes.md) as omx_contract.shapes.<name>; all of them the files share/omx-contract/
# holds (one source), installed under PYTHONDIR, where this python3 keeps pure modules under PREFIX; a package build names
# its own (the spec's python3_sitelib, Debian's dist-packages)
PYTHONDIR = $(shell python3 -c 'import sysconfig; print(sysconfig.get_path("purelib", vars={"base": "$(PREFIX)"}))')

install-python:
	install -d $(DESTDIR)$(PYTHONDIR)/omx_contract
	install -m 0644 python/omx_contract/__init__.py $(DESTDIR)$(PYTHONDIR)/omx_contract/__init__.py
	install -m 0644 share/omx-contract/omx_contract_catalog.py $(DESTDIR)$(PYTHONDIR)/omx_contract/catalog.py
	install -m 0644 share/omx-contract/omx_contract_scale.py $(DESTDIR)$(PYTHONDIR)/omx_contract/scale.py
	install -m 0644 share/omx-contract/omx_contract.py $(DESTDIR)$(PYTHONDIR)/omx_contract/clap.py
	install -d $(DESTDIR)$(PYTHONDIR)/omx_contract/shapes
	install -m 0644 python/omx_contract/shapes/__init__.py $(DESTDIR)$(PYTHONDIR)/omx_contract/shapes/__init__.py
	for f in share/omx-contract/omx_contract_*_shape.py; do n=$$(basename "$$f" _shape.py | sed 's/^omx_contract_//'); install -m 0644 "$$f" $(DESTDIR)$(PYTHONDIR)/omx_contract/shapes/$$n.py || exit 1; done

install: all
	install -d $(DESTDIR)$(INCLUDEDIR)/omxcontract $(DESTDIR)$(DATADIR)/omx-contract $(DESTDIR)$(PKGCONFIGDIR)
	install -m 0644 $(filter-out $(DOMAIN_HEADERS),$(wildcard include/omxcontract/*.h)) $(DESTDIR)$(INCLUDEDIR)/omxcontract/
	install -m 0644 share/omx-contract/omx-contract.json share/omx-contract/omx-vocabulary.schema.json share/omx-contract/omx-resource-hints.ttl share/omx-contract/omx_contract.py share/omx-contract/omx_contract_catalog.py share/omx-contract/omx_contract_scale.py share/omx-contract/languages.json share/omx-contract/clap-kind-vectors.json schema/omx-contract.schema.json schema/domain.schema.json data/scale-vectors.json $(DESTDIR)$(DATADIR)/omx-contract/
	install -m 0755 tools/install-contract-dir.sh $(DESTDIR)$(DATADIR)/omx-contract/
	install -d $(DESTDIR)$(DATADIR)/omx-contract/shapes
	install -m 0644 shapes/*.schema.json $(DESTDIR)$(DATADIR)/omx-contract/shapes/
	install -d $(DESTDIR)$(DATADIR)/omx-contract/catalogs
	install -m 0644 catalogs/*.json $(DESTDIR)$(DATADIR)/omx-contract/catalogs/
	sh tools/install-contract-dir.sh -x scale-vectors.json omx-contract $(VERSION) $(SCHEMA_MAJOR) data $(DESTDIR)$(CONTRACTDIR) data
	sh tools/install-contract-dir.sh --domain contract.d/contract $(DESTDIR)$(CONTRACTDIR)
	sed -e 's|@PREFIX@|$(PREFIX)|' -e 's|@INCLUDEDIR@|$(INCLUDEDIR)|' -e 's|@DATADIR@|$(DATADIR)|' -e 's|@VERSION@|$(VERSION)|' \
	  -e 's|@CONTRACTDIR@|$(CONTRACTDIR)|' -e 's|@SCHEMA_MAJOR@|$(SCHEMA_MAJOR)|' -e 's|@CLIDIR@|$(CLIDIR)|' \
	  omx-contract.pc.in > $(DESTDIR)$(PKGCONFIGDIR)/omx-contract.pc
	chmod 0644 $(DESTDIR)$(PKGCONFIGDIR)/omx-contract.pc

# The RPM macros of the contract directory (packaging/macros.omx-contract.in): an owner's spec says
# %{omx_contract_dir}/<owner>/ and never types the schema major, and %{omx_contract_domain_dir}/<domain>/ for a domain.
# The RPM build installs them into the devel package.
install-rpm-macros: all
	install -d $(DESTDIR)$(RPMMACRODIR)
	sed -e 's|@SCHEMA_MAJOR@|$(SCHEMA_MAJOR)|' packaging/macros.omx-contract.in > $(DESTDIR)$(RPMMACRODIR)/macros.omx-contract
	chmod 0644 $(DESTDIR)$(RPMMACRODIR)/macros.omx-contract

install-cli: all build-lib
	install -d $(DESTDIR)$(CLIDIR)/bin $(DESTDIR)$(CLIDIR)/lib $(DESTDIR)$(CLIDIR)/render/c $(DESTDIR)$(CLIDIR)/schema \
	  $(DESTDIR)$(CLIDIR)/data $(DESTDIR)$(CLIDIR)/contract.d/contract $(DESTDIR)$(BINDIR) $(DESTDIR)$(MANDIR)/man1
	install -m 0755 bin/omx-contract.mjs $(DESTDIR)$(CLIDIR)/bin/
	install -m 0644 lib/*.mjs $(DESTDIR)$(CLIDIR)/lib/
	install -m 0644 render/*.mjs $(DESTDIR)$(CLIDIR)/render/
	install -m 0644 render/c/*.mjs $(DESTDIR)$(CLIDIR)/render/c/
	install -m 0644 schema/omx-contract.schema.json schema/domain.schema.json $(DESTDIR)$(CLIDIR)/schema/
	cd data && find . -name '*.json' | LC_ALL=C sort | while read -r f; do install -D -m 0644 "$$f" "$(DESTDIR)$(CLIDIR)/data/$$f" || exit 1; done
	install -m 0644 contract.d/contract/contract.json $(DESTDIR)$(CLIDIR)/contract.d/contract/
	install -m 0644 package.json $(DESTDIR)$(CLIDIR)/
	for t in vendor/*.tgz; do \
	  m=$$(basename $$t .tgz | sed 's/-[0-9][^-]*$$//'); \
	  install -d $(DESTDIR)$(CLIDIR)/node_modules/$$m && tar -xzf $$t --no-same-owner --strip-components=1 -C $(DESTDIR)$(CLIDIR)/node_modules/$$m || exit 1; \
	  find $(DESTDIR)$(CLIDIR)/node_modules/$$m -mindepth 1 -maxdepth 1 \( -name '.*' -o -name test -o -name spec -o -name benchmark \
	    -o -name 'eslint.config.*' -o -name 'tsconfig*.json' \) -exec rm -rf {} + || exit 1; \
	  find $(DESTDIR)$(CLIDIR)/node_modules/$$m -type f -iname '*.md' -delete || exit 1; \
	done
	printf '#!/bin/sh\nexec node %s/bin/omx-contract.mjs "$$@"\n' '$(CLIDIR)' > $(DESTDIR)$(BINDIR)/omx-contract
	chmod 0755 $(DESTDIR)$(BINDIR)/omx-contract
	install -m 0644 man/omx-contract.1 $(DESTDIR)$(MANDIR)/man1/

test:
	npm test

# The C domain loader (docs/runtime-data.md "The C loader"): libomx-domain, its header include/omxcontract/omx_domain.h,
# and the command omx-domain, on the distribution's jansson. A start-up library, never linked into an audio thread.
# The library's exports are exactly abi/libomx-domain.abi (abi/libomx-domain.map is the linker's view of it); `make
# check-abi` compares them. `make test-c` builds it against the fixtures of test/fixtures/domain/ (as the installed
# directory) with the sanitizers, and runs test/c/. Needs a C compiler, jansson-devel and pkg-config.
LIBDIR ?= $(PREFIX)/lib
DOMAIN_SO = libomx-domain.so.0
JANSSON_CFLAGS ?= $(shell pkg-config --cflags jansson)
JANSSON_LIBS ?= $(shell pkg-config --libs jansson)
DOMAIN_CFLAGS = -std=c11 -Wall -Wextra -Werror -Wpedantic -Iinclude $(JANSSON_CFLAGS)
CBUILD ?= build/c

$(CBUILD)/$(DOMAIN_SO): src/c/omx_domain.c include/omxcontract/omx_domain.h abi/libomx-domain.map
	@mkdir -p $(CBUILD)
	$(CC) $(DOMAIN_CFLAGS) $(CFLAGS) -O2 -fPIC -shared -Wl,-soname,$(DOMAIN_SO) -Wl,--version-script=abi/libomx-domain.map $(LDFLAGS) \
	  -DOMX_CONTRACTDIR='"$(CONTRACTDIR)"' src/c/omx_domain.c -o $@ $(JANSSON_LIBS)

# CLI_RPATH is the test's way to find the library beside the command; an installed command is found by ldconfig.
CLI_RPATH ?=
$(CBUILD)/omx-domain: src/c/omx_domain_cli.c $(CBUILD)/$(DOMAIN_SO)
	$(CC) $(DOMAIN_CFLAGS) $(CFLAGS) -O2 src/c/omx_domain_cli.c -o $@ $(LDFLAGS) $(CLI_RPATH) $(CBUILD)/$(DOMAIN_SO)

build-c: $(CBUILD)/omx-domain

# The library, its symlink, its headers, its ABI list, libomx-domain.pc and the omx-domain command: the package of the C
# loader (an arch-dependent package, its -devel beside it), apart from `install`, which installs what needs no compiler.
# CONTRACTDIR is compiled into the library: the installed directory omx_domain_open reads. CFLAGS and LDFLAGS are the
# package build's own.
DOMAIN_HEADERS = include/omxcontract/omx_domain.h include/omxcontract/omx_contract_codes.h
CPKGCONFIGDIR ?= $(LIBDIR)/pkgconfig
install-c: build-c
	install -d $(DESTDIR)$(LIBDIR) $(DESTDIR)$(BINDIR) $(DESTDIR)$(INCLUDEDIR)/omxcontract $(DESTDIR)$(CPKGCONFIGDIR) $(DESTDIR)$(DATADIR)/omx-contract/abi $(DESTDIR)$(MANDIR)/man1
	install -m 0755 $(CBUILD)/$(DOMAIN_SO) $(DESTDIR)$(LIBDIR)/
	ln -sf $(DOMAIN_SO) $(DESTDIR)$(LIBDIR)/libomx-domain.so
	install -m 0755 $(CBUILD)/omx-domain $(DESTDIR)$(BINDIR)/
	install -m 0644 man/omx-domain.1 $(DESTDIR)$(MANDIR)/man1/
	install -m 0644 $(DOMAIN_HEADERS) $(DESTDIR)$(INCLUDEDIR)/omxcontract/
	install -m 0644 abi/libomx-domain.abi $(DESTDIR)$(DATADIR)/omx-contract/abi/
	sed -e 's|@PREFIX@|$(PREFIX)|' -e 's|@LIBDIR@|$(LIBDIR)|' -e 's|@INCLUDEDIR@|$(INCLUDEDIR)|' -e 's|@DATADIR@|$(DATADIR)|' \
	  -e 's|@CONTRACTDIR@|$(CONTRACTDIR)|' -e 's|@VERSION@|$(VERSION)|' libomx-domain.pc.in > $(DESTDIR)$(CPKGCONFIGDIR)/libomx-domain.pc
	chmod 0644 $(DESTDIR)$(CPKGCONFIGDIR)/libomx-domain.pc

# Every exported symbol, a function (T, W) or a global variable (D, B, R, V): a data export is ABI as much as a function.
check-abi: $(CBUILD)/$(DOMAIN_SO)
	nm -D --defined-only $(CBUILD)/$(DOMAIN_SO) | awk '$$2 ~ /^[TWDBRV]$$/ { sub(/@@.*/, "", $$3); print $$3 }' | LC_ALL=C sort | diff -u abi/libomx-domain.abi -

TESTC = build/test-c
# -fno-sanitize-recover=all: a UBSan finding stops the program (and so fails the suite) instead of printing and going on.
SANFLAGS = -g -fsanitize=address,undefined -fno-sanitize-recover=all -fno-omit-frame-pointer
test-c:
	rm -rf $(TESTC) && mkdir -p $(TESTC)
	$(MAKE) CBUILD=$(TESTC) CONTRACTDIR=$(CURDIR)/test/fixtures/domain CFLAGS='$(SANFLAGS)' check-abi
	sh test/c/abi_selftest.sh
	$(MAKE) CBUILD=$(TESTC) CONTRACTDIR=$(CURDIR)/test/fixtures/domain CFLAGS='$(SANFLAGS)' CLI_RPATH=-Wl,-rpath,$(CURDIR)/$(TESTC) build-c
	$(CC) $(DOMAIN_CFLAGS) $(SANFLAGS) -DFIXTURES='"$(CURDIR)/test/fixtures/domain"' \
	  -DCODES_JSON='"$(CURDIR)/contract.d/contract/contract.json"' -DCODES_GOLDEN='"$(CURDIR)/test/golden/contract-codes.tsv"' test/c/domain_test.c -o $(TESTC)/domain_test -L$(TESTC) -Wl,-rpath,$(CURDIR)/$(TESTC) \
	  $(TESTC)/$(DOMAIN_SO) $(JANSSON_LIBS) -ldl
	$(TESTC)/domain_test
	$(CC) $(DOMAIN_CFLAGS) $(SANFLAGS) -DCONFORMANCE='"$(CURDIR)/test/fixtures/conformance"' test/c/conformance_test.c -o $(TESTC)/conformance_test -L$(TESTC) \
	  -Wl,-rpath,$(CURDIR)/$(TESTC) $(TESTC)/$(DOMAIN_SO) $(JANSSON_LIBS)
	$(TESTC)/conformance_test
	sh test/c/cli_test.sh $(TESTC)/omx-domain $(CURDIR)/test/fixtures/domain
	sh test/c/install_domain_test.sh $(TESTC)/omx-domain $(CURDIR)/test/fixtures/domain $(CURDIR)/tools/install-contract-dir.sh
	$(MAKE) TESTC=$(TESTC) fuzz-replay

# The fuzz target of the loader (test/c/fuzz/): `fuzz-replay` replays every file of test/c/fuzz/corpus/ under the
# sanitizers with any C compiler (it is part of `test-c`, so CI runs it); `fuzz` is the libFuzzer run, needs clang
# (FUZZ_SECONDS bounds it, 30 by default). A crash input found is committed to the corpus with the fix.
FUZZ_SECONDS ?= 30
FUZZ_SRC = test/c/fuzz/fuzz_domain.c
FUZZ_DEFS = -DDEMO_DOC='"$(CURDIR)/test/fixtures/domain/demo/demo.json"'
fuzz-replay: $(TESTC)/$(DOMAIN_SO)
	$(CC) $(DOMAIN_CFLAGS) $(SANFLAGS) -DFUZZ_REPLAY $(FUZZ_DEFS) $(FUZZ_SRC) -o $(TESTC)/fuzz_domain_replay -L$(TESTC) \
	  -Wl,-rpath,$(CURDIR)/$(TESTC) $(TESTC)/$(DOMAIN_SO) $(JANSSON_LIBS)
	$(TESTC)/fuzz_domain_replay test/c/fuzz/corpus/*

fuzz:
	@command -v clang >/dev/null || { echo "make fuzz needs clang (libFuzzer); make fuzz-replay runs the corpus with any compiler" >&2; exit 2; }
	rm -rf build/fuzz && mkdir -p build/fuzz/work
	clang -std=c11 -g -O1 -fno-omit-frame-pointer -fsanitize=fuzzer,address,undefined -fno-sanitize-recover=all -Iinclude $(JANSSON_CFLAGS) \
	  -DOMX_CONTRACTDIR='"/nonexistent"' $(FUZZ_DEFS) $(FUZZ_SRC) src/c/omx_domain.c -o build/fuzz/fuzz_domain $(JANSSON_LIBS)
	cp test/c/fuzz/corpus/* build/fuzz/work/
	build/fuzz/fuzz_domain -dict=test/c/fuzz/domain.dict -max_total_time=$(FUZZ_SECONDS) -artifact_prefix=build/fuzz/ build/fuzz/work

# Every public declaration of the installed headers documented (docs/render.md "Documentation", omx-contract#64):
# doxygen's undocumented-member warnings held to docs/doxygen-baseline.txt, red on a new one and on a stale line. With
# The baseline is also held to DOXYGEN_BASE's (origin/main unless named): it only shrinks. An empty DOXYGEN_BASE is a
# refusal (no shrink check is never silent); a ref that is a commit here with no baseline yet (the commit that
# introduced the gate) holds it to nothing and says so; a ref git cannot read (not fetched, no checkout) is a refusal.
# make exits 2 on any failure, as it does for every recipe; the script's own exit tells a finding (1) from a gate that
# could not run (2).
DOXYGEN_BASE ?= origin/main
doxygen-check:
	@if [ -z "$(DOXYGEN_BASE)" ]; then echo "doxygen-check: set DOXYGEN_BASE to the ref the baseline is held to (origin/main)" >&2; exit 2; \
	elif git cat-file -e "$(DOXYGEN_BASE):docs/doxygen-baseline.txt" 2>/dev/null; then \
	  git show "$(DOXYGEN_BASE):docs/doxygen-baseline.txt" > doxygen-baseline.base && sh tools/doxygen-gate.sh --base-baseline doxygen-baseline.base; s=$$?; rm -f doxygen-baseline.base; exit $$s; \
	elif git rev-parse --verify -q "$(DOXYGEN_BASE)^{commit}" >/dev/null 2>&1; then \
	  echo "doxygen-check: $(DOXYGEN_BASE) carries no docs/doxygen-baseline.txt; the shrink check starts at the next change"; sh tools/doxygen-gate.sh; \
	else echo "doxygen-check: $(DOXYGEN_BASE) is no commit git can read here; fetch it, the shrink check needs it" >&2; exit 2; fi

# Every word of data/ in the file its rule places it, and every LV2 and CLAP term of inventory/ mapped with a status
# (docs/data-layout.md).
layout:
	node tools/data-layout.mjs

# Every item and word of data/ and the schemas owned here or moving out, what moves out only shrinking against
# OWNERSHIP_BASE (docs/contract-dir.md "What omx-contract owns"). The base is fetched first: a fetch that fails or a ref
# git cannot read is a refusal by name (exit 2), never a pass.
OWNERSHIP_REMOTE ?= origin
OWNERSHIP_BRANCH ?= main
OWNERSHIP_BASE ?= $(OWNERSHIP_REMOTE)/$(OWNERSHIP_BRANCH)
ownership:
	@git fetch --no-tags $(OWNERSHIP_REMOTE) $(OWNERSHIP_BRANCH) >/dev/null 2>&1 || { echo "ownership: fetching the base from $(OWNERSHIP_REMOTE) $(OWNERSHIP_BRANCH) failed; the shrink check needs it" >&2; exit 2; }
	node tools/check-ownership.mjs --base $(OWNERSHIP_BASE)

# inventory/ is the LV2 and CLAP installed here (needs serdi, the LV2 bundles and the CLAP headers).
inventory-check:
	node tools/format-inventory.mjs --check

# No tracked file points into a private repository, branch, issue or path, with no exemption.
public-sources: private-refs

# Open-Mixer/.github's private-refs check, from a checkout of it (OPENMIXER_DOTGITHUB); CI
# runs it through the public-sources-check workflow.
OPENMIXER_DOTGITHUB ?=
.PHONY: private-refs
private-refs:
	@test -n "$(OPENMIXER_DOTGITHUB)" || { echo 'private-refs: set OPENMIXER_DOTGITHUB to a checkout of Open-Mixer/.github' >&2; exit 1; }
	$(OPENMIXER_DOTGITHUB)/.github/actions/private-refs-check/check.sh .
