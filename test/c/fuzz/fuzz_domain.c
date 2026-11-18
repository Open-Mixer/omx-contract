/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright (C) 2026 Pau Aliagas */
/* Fuzz target of the C domain loader: `make fuzz` (clang, libFuzzer) and `make fuzz-replay` (any C compiler, the
   corpus of test/c/fuzz/corpus/ replayed under the sanitizers; `make test-c` runs it).
   Byte 0 of an input chooses what the rest is: 'C' -> the rest is the catalog catalogs/ca.json of the demo fixture;
   anything else -> the rest is the domain document itself. Bit 0 of byte 0 also chooses whether a version floor is asked. */
#define _GNU_SOURCE
#include <omxcontract/omx_domain.h>

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <unistd.h>

#ifndef DEMO_DOC
#error "DEMO_DOC names the demo fixture's document (the Makefile's -DDEMO_DOC)"
#endif

static char dir[256];
static char *demo;
static size_t demo_n;

static void put(const char *path, const uint8_t *buf, size_t n) {
  FILE *f = fopen(path, "wb");
  if (!f) abort();
  if (n && fwrite(buf, 1, n, f) != n) abort();
  fclose(f);
}

int LLVMFuzzerInitialize(int *argc, char ***argv) {
  (void)argc;
  (void)argv;
  const char *tmp = getenv("TMPDIR");
  snprintf(dir, sizeof dir, "%s/omx-domain-fuzz-XXXXXX", tmp && *tmp ? tmp : "/tmp");
  if (!mkdtemp(dir)) abort();
  char p[512];
  snprintf(p, sizeof p, "%s/demo", dir);
  mkdir(p, 0700);
  snprintf(p, sizeof p, "%s/demo/catalogs", dir);
  mkdir(p, 0700);
  FILE *f = fopen(DEMO_DOC, "rb");
  if (!f) abort();
  fseek(f, 0, SEEK_END);
  demo_n = (size_t)ftell(f);
  rewind(f);
  demo = malloc(demo_n);
  if (!demo || fread(demo, 1, demo_n, f) != demo_n) abort();
  fclose(f);
  return 0;
}

int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
  if (size < 1) return 0;
  char doc[512], cat[512];
  snprintf(doc, sizeof doc, "%s/demo/demo.json", dir);
  snprintf(cat, sizeof cat, "%s/demo/catalogs/ca.json", dir);
  if (data[0] == 'C') {
    put(doc, (const uint8_t *)demo, demo_n);
    put(cat, data + 1, size - 1);
  } else {
    put(doc, data + 1, size - 1);
    unlink(cat);
  }
  omx_domain *d = NULL;
  omx_domain_error err;
  if (omx_domain_open_at(dir, "demo", (data[0] & 1) ? "1.0.0" : NULL, &d, &err) == 0) {
    const char *items[] = {"DEMO_COLORS", "DEMO_PARAMS", "X", ""};
    for (int i = 0; i < 4; i++) {
      int n = omx_domain_word_count(d, items[i]);
      for (int k = 0; k < n; k++) {
        omx_domain_word_info w;
        if (omx_domain_word_at(d, items[i], k, &w) != 0) continue;
        char key[1024];
        snprintf(key, sizeof key, "%s.%s", items[i], w.word);
        const char *t = omx_domain_text(d, key, "ca");
        if (t) (void)strlen(t);
        (void)strlen(w.title);
        if (w.description) (void)strlen(w.description); /* NULL when the word has none */
      }
      omx_domain_range_info r;
      omx_domain_range(d, items[i], "gain", &r);
    }
    omx_domain_close(d);
  } else {
    if (!err.code) abort();
    (void)strlen(err.message);
  }
  return 0;
}

#ifdef FUZZ_REPLAY
/* Without libFuzzer: every file named on the command line is one input. */
int main(int argc, char **argv) {
  LLVMFuzzerInitialize(&argc, &argv);
  for (int i = 1; i < argc; i++) {
    FILE *f = fopen(argv[i], "rb");
    if (!f) { perror(argv[i]); return 2; }
    uint8_t *buf = malloc(1 << 20);
    size_t n = buf ? fread(buf, 1, 1 << 20, f) : 0;
    fclose(f);
    LLVMFuzzerTestOneInput(buf, n);
    free(buf);
  }
  printf("fuzz-replay: %d input(s) replayed\n", argc - 1);
  return 0;
}
#endif
