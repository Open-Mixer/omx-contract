/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com> */
/* The C domain loader (docs/runtime-data.md, "The C loader"): every function, every refusal. Run by `make test-c`,
   which builds the library against the fixtures of test/fixtures/domain/ (OMX_CONTRACTDIR is that directory). */
#define _POSIX_C_SOURCE 200809L
#include <omxcontract/omx_contract_codes.h>
#include <omxcontract/omx_domain.h>

#include <jansson.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/wait.h>
#include <unistd.h>

static int failures;
#define CHECK(cond) do { if (!(cond)) { failures++; fprintf(stderr, "%s:%d: FAILED %s\n", __FILE__, __LINE__, #cond); } } while (0)
#define CHECK_STR(got, want) do { const char *g_ = (got); if (!g_ || strcmp(g_, (want)) != 0) { failures++; fprintf(stderr, "%s:%d: got \"%s\", want \"%s\"\n", __FILE__, __LINE__, g_ ? g_ : "(null)", (want)); } } while (0)

static const char *FIX = FIXTURES;

static omx_domain *open_ok(const char *domain, const char *needs) {
  omx_domain *d = NULL;
  omx_domain_error err;
  memset(&err, 0, sizeof err);
  int rc = omx_domain_open_at(FIX, domain, needs, &d, &err);
  CHECK(rc == 0);
  CHECK(d != NULL);
  return d;
}

/* One refusal: the status, the code string it prints, nothing returned, and a message that names the domain. */
static void refused(const char *domain, const char *needs, int want, const char *msg_has) {
  omx_domain *d = (omx_domain *)0x1;
  omx_domain_error err;
  memset(&err, 0, sizeof err);
  int rc = omx_domain_open_at(FIX, domain, needs, &d, &err);
  CHECK(rc != 0);
  CHECK(d == NULL);
  CHECK(rc == want);
  CHECK_STR(err.code, omx_domain_code(want));
  CHECK(strstr(err.message, domain) != NULL);
  CHECK(strstr(err.message, msg_has) != NULL);
}

static void test_words(void) {
  omx_domain *d = open_ok("demo", "1.0.0");
  omx_domain_word_info w;
  CHECK(omx_domain_word_count(d, "DEMO_COLORS") == 3);
  CHECK(omx_domain_word(d, "DEMO_COLORS", "fbs-fixed", &w) == 0);
  CHECK_STR(w.word, "fbs-fixed");
  CHECK_STR(w.title, "fbsFixed");
  CHECK_STR(w.description, "A dashed word.");
  CHECK(w.code == 1);
  CHECK(omx_domain_word_at(d, "DEMO_COLORS", 0, &w) == 0);
  CHECK_STR(w.word, "red");
  CHECK(omx_domain_word_at(d, "DEMO_COLORS", 2, &w) == 0);
  CHECK_STR(w.word, "blue");
  CHECK(w.code == 2);
  omx_domain_close(d);
}

static void test_lookup_refusals(void) {
  omx_domain *d = open_ok("demo", NULL);
  omx_domain_word_info w;
  memset(&w, 0x5a, sizeof w);
  CHECK(omx_domain_word(d, "NO_SUCH", "red", &w) == OMX_CONTRACT_CODE_ITEM_UNKNOWN);
  CHECK(omx_domain_word(d, "DEMO_COLORS", "green", &w) == OMX_CONTRACT_CODE_WORD_UNKNOWN);
  CHECK(omx_domain_word_at(d, "DEMO_COLORS", 3, &w) == OMX_CONTRACT_CODE_INDEX_RANGE);
  CHECK(omx_domain_word_at(d, "DEMO_COLORS", -1, &w) == OMX_CONTRACT_CODE_INDEX_RANGE);
  CHECK(omx_domain_word_at(d, "NO_SUCH", 0, &w) == OMX_CONTRACT_CODE_ITEM_UNKNOWN);
  CHECK(omx_domain_word_count(d, "NO_SUCH") < 0);
  /* a refusal returns no default value: the output is left as it was */
  unsigned char same[sizeof w];
  memset(same, 0x5a, sizeof same);
  CHECK(memcmp(&w, same, sizeof w) == 0);
  omx_domain_range_info r;
  CHECK(omx_domain_range(d, "NO_SUCH", "gain", &r) == OMX_CONTRACT_CODE_ITEM_UNKNOWN);
  CHECK(omx_domain_range(d, "DEMO_PARAMS", "volume", &r) == OMX_CONTRACT_CODE_WORD_UNKNOWN);
  /* an item that is no ranges item has no such name */
  CHECK(omx_domain_range(d, "DEMO_COLORS", "red", &r) == OMX_CONTRACT_CODE_WORD_UNKNOWN);
  CHECK(omx_domain_word(d, "DEMO_PARAMS", "gain", &w) == OMX_CONTRACT_CODE_WORD_UNKNOWN);
  CHECK(omx_domain_word(NULL, "DEMO_COLORS", "red", &w) == OMX_CONTRACT_CODE_ITEM_UNKNOWN);
  omx_domain_close(d);
}

static void test_ranges(void) {
  omx_domain *d = open_ok("demo", NULL);
  omx_domain_range_info r;
  CHECK(omx_domain_range(d, "DEMO_PARAMS", "freq", &r) == 0);
  CHECK(r.min == 20 && r.max == 20000 && r.has_default == 1 && r.def == 1000);
  CHECK_STR(r.unit, "Hz");
  CHECK_STR(r.scale, "log");
  CHECK(omx_domain_range(d, "DEMO_PARAMS", "gain", &r) == 0);
  CHECK(r.min == -60 && r.max == 12 && r.def == 0);
  CHECK(omx_domain_range(d, "DEMO_PARAMS", "pad", &r) == 0);
  CHECK(r.has_default == 0);
  CHECK_STR(r.unit, "");
  CHECK_STR(r.scale, "");
  omx_domain_close(d);
}

static void test_text(void) {
  omx_domain *d = open_ok("demo", NULL);
  CHECK_STR(omx_domain_text(d, "DEMO_COLORS.red", "ca"), "Vermell");
  CHECK_STR(omx_domain_text(d, "DEMO_COLORS.fbs-fixed", "ca"), "Bus fix");
  /* no entry in the language: the English source sentence */
  CHECK_STR(omx_domain_text(d, "DEMO_COLORS.red", "de"), "Red");
  CHECK_STR(omx_domain_text(d, "DEMO_COLORS.red", NULL), "Red");
  CHECK_STR(omx_domain_text(d, "DEMO_COLORS.red", "en"), "Red");
  /* a word with no source sentence, and a key that is no word: NULL */
  CHECK(omx_domain_text(d, "DEMO_COLORS.blue", "ca") == NULL);
  CHECK(omx_domain_text(d, "DEMO_COLORS.green", "ca") == NULL);
  CHECK(omx_domain_text(d, "nothing", "en") == NULL);
  omx_domain_close(d);
}

static void test_open_refusals(void) {
  refused("absent", NULL, OMX_CONTRACT_CODE_DIR_ABSENT, FIX);
  refused("notjson", NULL, OMX_CONTRACT_CODE_FILE_NOT_JSON, "notjson.json");
  refused("badshape", NULL, OMX_CONTRACT_CODE_FILE_INVALID, "title");
  refused("dupword", NULL, OMX_CONTRACT_CODE_FILE_INVALID, "red");
  refused("badid", NULL, OMX_CONTRACT_CODE_MANIFEST_INVALID, "$id");
  refused("demo", "1.3.0", OMX_CONTRACT_CODE_PACKAGE_TOO_OLD, "1.2.0");
  refused("demo", "not-a-version", OMX_CONTRACT_CODE_FILE_INVALID, "not-a-version");
  /* a floor the document meets, and the exact floor */
  omx_domain_close(open_ok("demo", "1.2.0"));
  omx_domain_close(open_ok("demo", "0.9.9"));
  /* a domain name is a name, never a path */
  omx_domain *d = NULL;
  omx_domain_error err;
  CHECK(omx_domain_open_at(FIX, "../demo", NULL, &d, &err) != 0 && d == NULL);
  CHECK(omx_domain_open_at(FIX, "", NULL, &d, &err) != 0 && d == NULL);
  CHECK(omx_domain_open_at(NULL, "demo", NULL, &d, &err) != 0 && d == NULL);
}

/* The handle holds its own copy: after open the files are gone and the answers are the same, at the same address. */
static void test_handle_owns_its_data(void) {
  char tmpl[] = "/tmp/omx-domain-test-XXXXXX";
  CHECK(mkdtemp(tmpl) != NULL);
  char cmd[512];
  snprintf(cmd, sizeof cmd, "cp -r '%s/demo' '%s/demo'", FIX, tmpl);
  CHECK(system(cmd) == 0);
  omx_domain *d = NULL;
  omx_domain_error err;
  CHECK(omx_domain_open_at(tmpl, "demo", NULL, &d, &err) == 0);
  snprintf(cmd, sizeof cmd, "rm -rf '%s'", tmpl);
  CHECK(system(cmd) == 0);
  omx_domain_word_info a, b;
  CHECK(omx_domain_word(d, "DEMO_COLORS", "red", &a) == 0);
  CHECK(omx_domain_word(d, "DEMO_COLORS", "red", &b) == 0);
  CHECK_STR(a.description, "The warm one.");
  CHECK(a.word == b.word && a.description == b.description);
  CHECK_STR(omx_domain_text(d, "DEMO_COLORS.red", "ca"), "Vermell");
  omx_domain_close(d);
  omx_domain_close(NULL);
}

/* The production entry reads the installed directory and never the environment. */
static void test_open_installed(void) {
  omx_domain *d = NULL;
  omx_domain_error err;
  CHECK(setenv("OMX_CONTRACT_PATH", "/nonexistent-omx-path", 1) == 0);
  CHECK(omx_domain_open("demo", "1.0.0", &d, &err) == 0);
  CHECK(d != NULL);
  omx_domain_close(d);
  d = (omx_domain *)0x1;
  CHECK(omx_domain_open("absent", NULL, &d, &err) != 0 && d == NULL);
  CHECK(omx_domain_open("absent", NULL, &d, &err) == OMX_CONTRACT_CODE_DIR_ABSENT);
  CHECK_STR(err.code, "contract.dir.absent");
  unsetenv("OMX_CONTRACT_PATH");
}

/* A refused start-up exits 78 (EX_CONFIG) and prints the code and the reason; an opened one returns the handle. */
static void test_open_or_exit(void) {
  int fds[2];
  CHECK(pipe(fds) == 0);
  pid_t pid = fork();
  if (pid == 0) {
    dup2(fds[1], 2);
    close(fds[0]);
    omx_domain_open_or_exit("absent", NULL);
    _exit(0); /* reached only if it did not exit */
  }
  close(fds[1]);
  char msg[512] = "";
  ssize_t got = read(fds[0], msg, sizeof msg - 1);
  CHECK(got > 0);
  close(fds[0]);
  int st = 0;
  CHECK(waitpid(pid, &st, 0) == pid);
  CHECK(WIFEXITED(st) && WEXITSTATUS(st) == 78);
  CHECK(strstr(msg, "contract.dir.absent") != NULL && strstr(msg, "absent") != NULL);
  omx_domain *d = omx_domain_open_or_exit("demo", "1.0.0");
  CHECK(d != NULL);
  omx_domain_close(d);
}

/* The values the loader returns are the CONTRACT_CODES values of omx_contract_codes.h, and each prints the string of
   data/codes.json at its place; every value of the header has a string. */
static void test_codes_are_contract_codes(void) {
  json_error_t jerr;
  json_t *root = json_load_file(CODES_JSON, 0, &jerr);
  CHECK(root != NULL);
  if (!root) return;
  json_t *codes = json_object_get(json_object_get(root, "CONTRACT_CODES"), "codes");
  CHECK((int)json_object_size(codes) == OMX_CONTRACT_CODE_LAST);
  int place = 0;
  const char *k;
  json_t *c;
  json_object_foreach(codes, k, c) {
    place++;
    const char *want = json_string_value(json_object_get(c, "code"));
    CHECK_STR(omx_domain_code(place), want);
  }
  CHECK(omx_domain_code(0) == NULL);
  CHECK(omx_domain_code(OMX_CONTRACT_CODE_LAST + 1) == NULL);
  CHECK(OMX_CONTRACT_CODE_ITEM_UNKNOWN != OMX_CONTRACT_CODE_WORD_UNKNOWN && OMX_CONTRACT_CODE_WORD_UNKNOWN != OMX_CONTRACT_CODE_INDEX_RANGE);
  json_decref(root);
}

int main(void) {
  test_words();
  test_lookup_refusals();
  test_ranges();
  test_text();
  test_open_refusals();
  test_handle_owns_its_data();
  test_open_installed();
  test_open_or_exit();
  test_codes_are_contract_codes();
  if (failures) { fprintf(stderr, "%d check(s) failed\n", failures); return 1; }
  puts("domain_test: all checks passed");
  return 0;
}
