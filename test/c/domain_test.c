/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com> */
/* The C domain loader (docs/runtime-data.md, "The C loader"): every function, every refusal. Run by `make test-c`,
   which builds the library against the fixtures of test/fixtures/domain/ (OMX_CONTRACTDIR is that directory). */
#define _GNU_SOURCE /* RTLD_NEXT: the rewinddir hook of test_catalog_gains_a_file */
#include <omxcontract/omx_contract_codes.h>
#include <omxcontract/omx_domain.h>

#include <dirent.h>
#include <dlfcn.h>
#include <jansson.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
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

/* A domain name is a slash-separated path (docs/contract-dir.md): `dsp/kernels` is dsp/kernels/kernels.json, its $id names
   the whole path; a name with an empty, `.` or `..` segment, or a leading or trailing slash, is refused by name. */
static void test_nested_domains(void) {
  omx_domain *d = open_ok("dsp/kernels", "1.0.0");
  omx_domain_word_info w;
  CHECK(omx_domain_word(d, "KERNEL_COLORS", "red", &w) == 0);
  CHECK(omx_domain_range(d, "KERNEL_PARAMS", "gain", &(omx_domain_range_info){0}) == 0);
  omx_domain_close(d);
  d = open_ok("formats/clap", NULL);
  CHECK(omx_domain_word_count(d, "CLAP_COLORS") == 3);
  omx_domain_close(d);
  /* the $id must name the same path as the place */
  refused("dsp/mismatch", NULL, OMX_CONTRACT_CODE_MANIFEST_INVALID, "$id");
  /* a path that is a valid name but holds no document: absent, naming the path */
  refused("dsp/none", NULL, OMX_CONTRACT_CODE_DIR_ABSENT, "dsp/none");
  const char *bad[] = { "dsp/../demo", "/demo", "dsp//kernels", "dsp/", "./demo", "dsp/./kernels", "..", "a/b/../c", "dsp\\kernels", "dsp/ker nels" };
  for (size_t i = 0; i < sizeof bad / sizeof bad[0]; i++) {
    omx_domain *x = (omx_domain *)0x1;
    omx_domain_error err;
    memset(&err, 0, sizeof err);
    int rc = omx_domain_open_at(FIX, bad[i], NULL, &x, &err);
    if (rc != OMX_CONTRACT_CODE_FILE_INVALID || x != NULL || strstr(err.message, bad[i]) == NULL) {
      failures++;
      fprintf(stderr, "%s:%d: \"%s\" was not refused by name (rc %d)\n", __FILE__, __LINE__, bad[i], rc);
    }
  }
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

/* ---- memory safety of the loader on hostile directories: each test builds its own contract directory ---- */

static char scratch[256];

static void put_file(const char *path, const char *text) {
  FILE *f = fopen(path, "wb");
  if (!f) { failures++; fprintf(stderr, "%s:%d: cannot write %s\n", __FILE__, __LINE__, path); return; }
  fputs(text, f);
  fclose(f);
}

static void make_scratch(void) {
  const char *tmp = getenv("TMPDIR");
  snprintf(scratch, sizeof scratch, "%s/omx-domain-test-XXXXXX", tmp && *tmp ? tmp : "/tmp");
  if (!mkdtemp(scratch)) { perror("mkdtemp"); exit(2); }
}

static void drop_scratch(void) {
  char cmd[300];
  snprintf(cmd, sizeof cmd, "rm -rf '%s'", scratch);
  if (system(cmd) != 0) failures++;
}

/* A domain `name` in the scratch directory whose document is `$id` `id`, version `version`; one word item DOM_W. */
static void make_domain(const char *name, const char *id, const char *version) {
  char path[4096], doc[1024];
  snprintf(path, sizeof path, "%s/%s", scratch, name);
  for (char *p = path + strlen(scratch) + 1; *p; p++) {
    if (*p == '/') { *p = '\0'; mkdir(path, 0700); *p = '/'; }
  }
  mkdir(path, 0700);
  const char *stem = strrchr(name, '/') ? strrchr(name, '/') + 1 : name;
  snprintf(doc, sizeof doc, "{\"$id\":\"%s\",\"info\":{\"version\":\"%s\",\"x-owner\":\"o\"},\"components\":{\"schemas\":{\"DOM_W\":{\"oneOf\":[{\"const\":\"a\",\"title\":\"A\",\"description\":\"d\",\"x-code\":0}]}}}}", id, version);
  snprintf(path, sizeof path, "%s/%s/%s.json", scratch, name, stem);
  put_file(path, doc);
}

static int open_scratch(const char *name, const char *needs, omx_domain **d, omx_domain_error *err) {
  memset(err, 0, sizeof *err);
  *d = (omx_domain *)0x1;
  int rc = omx_domain_open_at(scratch, name, needs, d, err);
  if (rc) CHECK(*d == NULL);
  return rc;
}

/* A catalog entry with no string "text": refused, naming the entry (the name used to be read after the JSON that owns it was freed). */
static void test_catalog_entry_without_text(void) {
  make_scratch();
  make_domain("dom", "https://openmixer.org/contract/dom", "1.0.0");
  char path[512];
  snprintf(path, sizeof path, "%s/dom/catalogs", scratch);
  mkdir(path, 0700);
  snprintf(path, sizeof path, "%s/dom/catalogs/es.json", scratch);
  put_file(path, "{\"messages\":{\"DOM_W.a\":{\"nottext\":1}}}");
  omx_domain *d;
  omx_domain_error err;
  CHECK(open_scratch("dom", NULL, &d, &err) == OMX_CONTRACT_CODE_FILE_INVALID);
  CHECK(strstr(err.message, "\"DOM_W.a\"") != NULL);
  drop_scratch();
}

/* A name longer than OMX_DOMAIN_NAME_MAX is refused as an invalid manifest, never opened through a truncated $id. */
static void test_long_name(void) {
  make_scratch();
  char name[1024] = "", id[1200] = "https://openmixer.org/contract/", trunc_id[600];
  for (int i = 0; i < 60; i++) strcat(name, i ? "/abcdefghij" : "abcdefghij");
  strcat(id, name);
  snprintf(trunc_id, sizeof trunc_id, "%.511s", id); /* what a 512-byte buffer used to hold of it */
  make_domain(name, trunc_id, "1.0.0");
  omx_domain *d;
  omx_domain_error err;
  CHECK(open_scratch(name, NULL, &d, &err) == OMX_CONTRACT_CODE_MANIFEST_INVALID);
  CHECK(strstr(err.message, "OMX_DOMAIN_NAME_MAX") != NULL);
  /* a name at the limit is a name (and is then judged on its $id as any) */
  char at_limit[OMX_DOMAIN_NAME_MAX + 1];
  memset(at_limit, 'a', OMX_DOMAIN_NAME_MAX);
  at_limit[OMX_DOMAIN_NAME_MAX / 2] = '/'; /* two segments: a file name is itself limited to 255 bytes */
  at_limit[OMX_DOMAIN_NAME_MAX] = '\0';
  snprintf(id, sizeof id, "https://openmixer.org/contract/%s", at_limit);
  make_domain(at_limit, id, "1.0.0");
  CHECK(open_scratch(at_limit, NULL, &d, &err) == 0);
  if (d) omx_domain_close(d);
  drop_scratch();
}

/* A directory too long for the path buffer is refused by name, not opened as a truncated path. */
static void test_long_dir(void) {
  static char dir[5000];
  memset(dir, 'd', sizeof dir - 1);
  dir[0] = '/';
  dir[sizeof dir - 1] = '\0';
  omx_domain *d = NULL;
  omx_domain_error err;
  memset(&err, 0, sizeof err);
  CHECK(omx_domain_open_at(dir, "demo", NULL, &d, &err) != 0 && d == NULL);
  CHECK(strstr(err.message, "too long") != NULL);
}

/* The version of a document and the floor a program asks are plain x.y.z: no leading zero, no overflow. */
static void test_version_strictness(void) {
  make_scratch();
  omx_domain *d;
  omx_domain_error err;
  make_domain("v1", "https://openmixer.org/contract/v1", "01.2.0");
  CHECK(open_scratch("v1", NULL, &d, &err) == OMX_CONTRACT_CODE_FILE_INVALID);
  make_domain("v2", "https://openmixer.org/contract/v2", "1.2.0");
  CHECK(open_scratch("v2", "1.02.0", &d, &err) == OMX_CONTRACT_CODE_FILE_INVALID);
  make_domain("v3", "https://openmixer.org/contract/v3", "99999999999999999999999.0.0");
  CHECK(open_scratch("v3", NULL, &d, &err) == OMX_CONTRACT_CODE_FILE_INVALID);
  CHECK(open_scratch("v2", "99999999999999999999999.0.0", &d, &err) == OMX_CONTRACT_CODE_FILE_INVALID);
  make_domain("v4", "https://openmixer.org/contract/v4", "0.10.100");
  CHECK(open_scratch("v4", "0.0.0", &d, &err) == 0);
  if (d) omx_domain_close(d);
  drop_scratch();
}

/* A file that appears in catalogs/ between the loader's counting pass and its reading pass: the hook below creates
   some right after the loader's rewinddir. It must be refused, never written past the array counted for. */
static const char *gain_dir;
void rewinddir(DIR *dh) {
  static void (*real)(DIR *);
  if (!real) *(void **)&real = dlsym(RTLD_NEXT, "rewinddir");
  real(dh);
  if (gain_dir) {
    char path[600];
    for (int i = 0; i < 40; i++) {
      snprintf(path, sizeof path, "%s/gain%d.json", gain_dir, i);
      put_file(path, "{\"messages\":{}}");
    }
    gain_dir = NULL;
  }
}

static void test_catalog_gains_a_file(void) {
  make_scratch();
  make_domain("dom", "https://openmixer.org/contract/dom", "1.0.0");
  static char dir[512];
  char path[600];
  snprintf(dir, sizeof dir, "%s/dom/catalogs", scratch);
  mkdir(dir, 0700);
  snprintf(path, sizeof path, "%s/es.json", dir);
  put_file(path, "{\"messages\":{}}");
  gain_dir = dir;
  omx_domain *d;
  omx_domain_error err;
  CHECK(open_scratch("dom", NULL, &d, &err) == OMX_CONTRACT_CODE_FILE_INVALID);
  CHECK(strstr(err.message, "changed") != NULL);
  gain_dir = NULL;
  drop_scratch();
}

/* DOMAIN_TEST_ONLY=<name> runs just that one of the hostile-directory tests (an ASan abort ends the process). */
#define RUN(fn) do { const char *only_ = getenv("DOMAIN_TEST_ONLY"); if (!only_ || strcmp(only_, #fn) == 0) fn(); } while (0)

int main(void) {
  test_words();
  test_lookup_refusals();
  test_ranges();
  test_text();
  test_open_refusals();
  test_nested_domains();
  test_handle_owns_its_data();
  test_open_installed();
  test_open_or_exit();
  test_codes_are_contract_codes();
  RUN(test_catalog_entry_without_text);
  RUN(test_long_name);
  RUN(test_long_dir);
  RUN(test_version_strictness);
  RUN(test_catalog_gains_a_file);
  if (failures) { fprintf(stderr, "%d check(s) failed\n", failures); return 1; }
  puts("domain_test: all checks passed");
  return 0;
}
