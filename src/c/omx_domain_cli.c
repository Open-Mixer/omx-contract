/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com> */
/*
 * omx-domain <domain> [<needs x.y.z> [<item> [<word or name>]]]
 *
 * Opens a domain and prints what is asked: nothing but the domain's name for the domain alone, the words of an item,
 * or one word or range. The command reads OMX_CONTRACT_PATH (a test and development override, docs/runtime-data.md
 * ruling 2) and passes it to omx_domain_open_at(); without it, it opens the installed directory. A refused domain
 * exits 78 (EX_CONFIG) with the code and the reason on stderr; a lookup that fails exits 1; no domain exits 64.
 */
#include <omxcontract/omx_domain.h>

#include <stdio.h>
#include <stdlib.h>

static void print_word(const omx_domain_word_info *w) {
  printf("word=%s title=%s description=%s code=%d\n", w->word, w->title, w->description, w->code);
}

int main(int argc, char **argv) {
  if (argc < 2) {
    fprintf(stderr, "usage: omx-domain <domain> [<needs x.y.z> [<item> [<word or name>]]]\n");
    return 64;
  }
  const char *needs = argc > 2 && argv[2][0] ? argv[2] : NULL;
  const char *path = getenv("OMX_CONTRACT_PATH");
  omx_domain *d = NULL;
  omx_domain_error err;
  int rc = path && *path ? omx_domain_open_at(path, argv[1], needs, &d, &err) : omx_domain_open(argv[1], needs, &d, &err);
  if (rc != 0) {
    fprintf(stderr, "omx-domain: %s: %s\n", err.code, err.message);
    return 78;
  }
  int status = 0;
  if (argc == 3 || argc == 2) {
    printf("%s\n", argv[1]);
  } else if (argc == 4) {
    int n = omx_domain_word_count(d, argv[3]);
    if (n < 0) {
      fprintf(stderr, "omx-domain: %s: %s is no item of %s\n", omx_domain_code(OMX_CONTRACT_CODE_ITEM_UNKNOWN), argv[3], argv[1]);
      status = 1;
    }
    for (int i = 0; i < n; i++) {
      omx_domain_word_info w;
      if (omx_domain_word_at(d, argv[3], i, &w) == 0) print_word(&w);
    }
  } else {
    omx_domain_word_info w;
    omx_domain_range_info r;
    int rw = omx_domain_word(d, argv[3], argv[4], &w);
    int rr = rw == 0 ? 0 : omx_domain_range(d, argv[3], argv[4], &r);
    if (rw == 0) {
      print_word(&w);
    } else if (rr == 0) {
      printf("min=%g max=%g default=%g unit=%s scale=%s\n", r.min, r.max, r.has_default ? r.def : 0.0, r.unit, r.scale);
    } else {
      /* the item is unknown to both lookups, or the name is unknown to the item */
      fprintf(stderr, "omx-domain: %s: %s %s of %s\n", omx_domain_code(rw == OMX_CONTRACT_CODE_ITEM_UNKNOWN ? rw : rr), argv[3], argv[4], argv[1]);
      status = 1;
    }
  }
  omx_domain_close(d);
  return status;
}
