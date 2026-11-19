/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com> */
/* The shared domain conformance suite, C side: test/fixtures/conformance/cases.json lists domain documents, each with
   its expected verdict, and test/domain-conformance.test.mjs runs the same list through the TypeScript reader. Each case
   is a contract directory holding one domain; it is opened with omx_domain_open_at, and the verdict must be the expected
   one: ok, or the contract code and a message that names the member the refusal is about.
     conformance_test [cases-dir]              one line per case, `ok <case>` or `FAIL <case>: wanted ... got ...`; exit 1 on a FAIL
     conformance_test --verdicts [cases-dir]   one line per case, `<case> ok` or `<case> <code> <message>`, for the agreement test */
#include <omxcontract/omx_domain.h>

#include <jansson.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifndef CONFORMANCE
#error "CONFORMANCE names test/fixtures/conformance (the Makefile's -DCONFORMANCE)"
#endif

int main(int argc, char **argv) {
  int verdicts = argc > 1 && strcmp(argv[1], "--verdicts") == 0;
  const char *dir = argc > 1 + verdicts ? argv[1 + verdicts] : CONFORMANCE;
  char list[4096];
  snprintf(list, sizeof list, "%s/cases.json", dir);
  json_error_t jerr;
  json_t *cases = json_load_file(list, JSON_REJECT_DUPLICATES, &jerr);
  if (!json_is_array(cases)) { fprintf(stderr, "conformance_test: %s: %s\n", list, jerr.text); return 2; }
  int failures = 0;
  size_t i, total = json_array_size(cases);
  json_t *c;
  json_array_foreach(cases, i, c) {
    const char *name = json_string_value(json_object_get(c, "case")), *domain = json_string_value(json_object_get(c, "domain"));
    const char *needs = json_string_value(json_object_get(c, "needs")); /* null is no floor */
    json_t *want = json_object_get(c, "verdict");
    if (!name || !domain || !want) { fprintf(stderr, "conformance_test: case %zu of %s is malformed\n", i, list); return 2; }
    char root[4096];
    snprintf(root, sizeof root, "%s/%s", dir, name);
    omx_domain *d = NULL;
    omx_domain_error err;
    memset(&err, 0, sizeof err);
    int rc = omx_domain_open_at(root, domain, needs, &d, &err);
    const char *got = rc == 0 ? "ok" : err.code ? err.code : "(no code)";
    if (verdicts) { printf("%s %s%s%s\n", name, got, rc ? " " : "", rc ? err.message : ""); omx_domain_close(d); continue; }
    char problem[1024] = "";
    if (json_is_string(want)) {
      if (strcmp(json_string_value(want), "ok") != 0) snprintf(problem, sizeof problem, "the verdict %s is not ok or {code, member}", json_string_value(want));
      else if (rc != 0) snprintf(problem, sizeof problem, "wanted ok, got %s: %s", got, err.message);
    } else {
      const char *code = json_string_value(json_object_get(want, "code")), *member = json_string_value(json_object_get(want, "member"));
      if (rc == 0) snprintf(problem, sizeof problem, "wanted %s naming \"%s\", got ok", code, member);
      else if (strcmp(got, code) != 0) snprintf(problem, sizeof problem, "wanted %s naming \"%s\", got %s: %s", code, member, got, err.message);
      else if (!strstr(err.message, member)) snprintf(problem, sizeof problem, "wanted %s naming \"%s\", got %s without it: %s", code, member, got, err.message);
    }
    if (*problem) { printf("FAIL %s: %s\n", name, problem); failures++; }
    else printf("ok %s\n", name);
    omx_domain_close(d);
  }
  json_decref(cases);
  if (failures) fprintf(stderr, "conformance_test: %d of %zu case(s) failed\n", failures, total);
  return failures ? 1 : 0;
}
