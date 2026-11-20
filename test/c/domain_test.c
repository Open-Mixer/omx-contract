/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com> */
/* The C domain loader (docs/runtime-data.md, "The C loader"): every function, every refusal. Run by `make test-c`,
   which builds the library against the fixtures of test/fixtures/domain/ (OMX_CONTRACTDIR is that directory). */
#define _GNU_SOURCE /* RTLD_NEXT: the rewinddir hook of test_catalog_gains_a_file */
#include <omxcontract/omx_contract_codes.h>
#include <omxcontract/omx_domain.h>

#include <dirent.h>
#include <dlfcn.h>
#include <errno.h>
#include <jansson.h>
#include <limits.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/wait.h>
#include <unistd.h>

static int failures;
static int skips; /* tests that could not run here, each named by a skip line */
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

/* a word's group (3.21.0): the x-group of its oneOf entry; NULL for a word with none, an unknown word or item */
static void test_word_group(void) {
  omx_domain *d = open_ok("demo", "1.2.0");
  CHECK_STR(omx_domain_word_group(d, "DEMO_COLORS", "red"), "warm");
  CHECK_STR(omx_domain_word_group(d, "DEMO_COLORS", "blue"), "cool");
  CHECK(omx_domain_word_group(d, "DEMO_COLORS", "fbs-fixed") == NULL);
  CHECK(omx_domain_word_group(d, "DEMO_COLORS", "green") == NULL);
  CHECK(omx_domain_word_group(d, "NO_SUCH", "red") == NULL);
  CHECK(omx_domain_word_group(NULL, "DEMO_COLORS", "red") == NULL);
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

static void test_absent_description(void) {
  omx_domain *d = open_ok("nodesc", NULL);
  omx_domain_word_info w;
  CHECK(omx_domain_word_count(d, "DEMO_COLORS") == 3);
  CHECK(omx_domain_word(d, "DEMO_COLORS", "blue", &w) == 0);
  CHECK_STR(w.word, "blue");
  CHECK(w.description == NULL);
  CHECK(omx_domain_word(d, "DEMO_COLORS", "red", &w) == 0);
  CHECK_STR(w.description, "The warm one.");
  omx_domain_close(d);
}

static void test_open_refusals(void) {
  refused("absent", NULL, OMX_CONTRACT_CODE_DIR_ABSENT, FIX);
  refused("notjson", NULL, OMX_CONTRACT_CODE_FILE_NOT_JSON, "notjson.json");
  refused("badshape", NULL, OMX_CONTRACT_CODE_FILE_INVALID, "title");
  refused("dupword", NULL, OMX_CONTRACT_CODE_FILE_INVALID, "red");
  refused("baddesc", NULL, OMX_CONTRACT_CODE_FILE_INVALID, "description");
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
  /* read to EOF: one read() can return a part of what the child wrote (the code and the message are two writes of stderr) */
  char msg[512] = "";
  size_t got = 0;
  for (;;) {
    ssize_t n = read(fds[0], msg + got, sizeof msg - 1 - got);
    if (n < 0 && errno == EINTR) continue;
    if (n <= 0 || (got += (size_t)n) >= sizeof msg - 1) break;
  }
  msg[got] = '\0';
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
  CHECK(omx_domain_code(-1) == NULL);
  CHECK(omx_domain_code(INT_MIN) == NULL);
  CHECK(omx_domain_code(INT_MAX) == NULL);
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
  snprintf(doc, sizeof doc, "{\"$id\":\"%s\",\"info\":{\"version\":\"%s\",\"x-owner\":\"o\",\"x-stability\":\"experimental\"},\"components\":{\"schemas\":{\"DOM_W\":{\"oneOf\":[{\"const\":\"a\",\"title\":\"A\",\"description\":\"d\",\"x-code\":0}]}}}}", id, version);
  snprintf(path, sizeof path, "%s/%s/%s.json", scratch, name, stem);
  put_file(path, doc);
}

/* A domain `name` whose info is `info` (a JSON object text), for the refusals of info members. */
static void make_domain_info(const char *name, const char *info) {
  char path[4096], doc[1024];
  snprintf(path, sizeof path, "%s/%s", scratch, name);
  mkdir(path, 0700);
  snprintf(doc, sizeof doc, "{\"$id\":\"https://openmixer.org/contract/%s\",\"info\":%s,\"components\":{\"schemas\":{\"DOM_W\":{\"oneOf\":[{\"const\":\"a\",\"title\":\"A\",\"description\":\"d\",\"x-code\":0}]}}}}", name, info);
  snprintf(path, sizeof path, "%s/%s/%s.json", scratch, name, name);
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
  put_file(path, "{\"lang\":\"es\",\"messages\":{\"DOM_W.a\":{\"nottext\":1}}}");
  omx_domain *d;
  omx_domain_error err;
  CHECK(open_scratch("dom", NULL, &d, &err) == OMX_CONTRACT_CODE_CATALOG_INVALID);
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

/* A directory too long for the path buffer is refused as an unusable input (the directory may well exist), by name,
 * not opened as a truncated path. */
static void test_long_dir(void) {
  static char dir[5000];
  memset(dir, 'd', sizeof dir - 1);
  dir[0] = '/';
  dir[sizeof dir - 1] = '\0';
  omx_domain *d = NULL;
  omx_domain_error err;
  memset(&err, 0, sizeof err);
  CHECK(omx_domain_open_at(dir, "demo", NULL, &d, &err) == OMX_CONTRACT_CODE_MANIFEST_INVALID && d == NULL);
  CHECK(strstr(err.message, "too long") != NULL);
}

/* The version of a document and the floor a program asks are plain x.y.z: no leading zero, no overflow. */
static void test_version_strictness(void) {
  make_scratch();
  omx_domain *d;
  omx_domain_error err;
  make_domain("v1", "https://openmixer.org/contract/v1", "01.2.0");
  CHECK(open_scratch("v1", NULL, &d, &err) == OMX_CONTRACT_CODE_MANIFEST_INVALID);
  make_domain("v2", "https://openmixer.org/contract/v2", "1.2.0");
  CHECK(open_scratch("v2", "1.02.0", &d, &err) == OMX_CONTRACT_CODE_FILE_INVALID);
  make_domain("v3", "https://openmixer.org/contract/v3", "99999999999999999999999.0.0");
  CHECK(open_scratch("v3", NULL, &d, &err) == OMX_CONTRACT_CODE_MANIFEST_INVALID);
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
      snprintf(path, sizeof path, "%s/g%c%c.json", gain_dir, 'a' + i / 26, 'a' + i % 26); /* a language tag, or the name check refuses first */
      char body[64];
      snprintf(body, sizeof body, "{\"lang\":\"g%c%c\",\"messages\":{}}", 'a' + i / 26, 'a' + i % 26);
      put_file(path, body);
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
  put_file(path, "{\"lang\":\"es\",\"messages\":{}}");
  gain_dir = dir;
  omx_domain *d;
  omx_domain_error err;
  CHECK(open_scratch("dom", NULL, &d, &err) == OMX_CONTRACT_CODE_CATALOG_INVALID);
  CHECK(strstr(err.message, "changed") != NULL);
  gain_dir = NULL;
  drop_scratch();
}


/* ---- spec gaps of the loader (docs/contract-dir.md, docs/runtime-data.md): what a document must be to open ---- */

/* A domain `dom` in the scratch directory: `info` as the document's info object, `schemas` the body of components.schemas. */
static void make_doc(const char *info, const char *schemas) {
  char path[600], doc[4096];
  snprintf(path, sizeof path, "%s/dom", scratch);
  mkdir(path, 0700);
  snprintf(doc, sizeof doc, "{\"$id\":\"https://openmixer.org/contract/dom\",\"info\":%s,\"components\":{\"schemas\":%s}}", info, schemas);
  snprintf(path, sizeof path, "%s/dom/dom.json", scratch);
  put_file(path, doc);
}

#define INFO_OK "{\"version\":\"1.0.0\",\"x-owner\":\"o\",\"x-stability\":\"experimental\"}"
#define WORD(c, code) "{\"const\":\"" c "\",\"title\":\"T\",\"description\":\"d\",\"x-code\":" code "}"

/* A document and the status it must be refused with (0 when it must open), the message naming `has`. */
static void doc_is(const char *info, const char *schemas, int want, const char *has) {
  make_scratch();
  make_doc(info, schemas);
  omx_domain *d;
  omx_domain_error err;
  int rc = open_scratch("dom", NULL, &d, &err);
  if (rc != want) { failures++; fprintf(stderr, "%s:%d: FAIL got status %d (%s), want %d for %s\n", __FILE__, __LINE__, rc, rc ? err.message : "opened", want, schemas); }
  else if (rc && has && !strstr(err.message, has)) { failures++; fprintf(stderr, "%s:%d: FAIL message \"%s\" lacks \"%s\"\n", __FILE__, __LINE__, err.message, has); }
  if (rc == 0 && d) omx_domain_close(d);
  drop_scratch();
}

/* (5) x-code is the word's place in its list (docs/contract-dir.md): another is refused, naming the word. */
static void test_xcode_is_the_place(void) {
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[" WORD("a", "0") "," WORD("b", "1") "]}}", 0, NULL);
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[" WORD("a", "0") "," WORD("b", "5") "]}}", OMX_CONTRACT_CODE_FILE_INVALID, "x-code");
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[" WORD("a", "1") "," WORD("b", "0") "]}}", OMX_CONTRACT_CODE_FILE_INVALID, "\"a\"");
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[" WORD("a", "0") "," WORD("b", "0") "]}}", OMX_CONTRACT_CODE_FILE_INVALID, "x-code");
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[" WORD("a", "0") "," WORD("a", "1") "]}}", OMX_CONTRACT_CODE_FILE_INVALID, "twice");
}

/* (6) a key written twice is refused as the parse error it is: two items, a word's key twice, info twice, two catalog entries. */
static void test_duplicate_keys_refused(void) {
  const int bad = OMX_CONTRACT_CODE_FILE_NOT_JSON;
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[" WORD("a", "0") "]},\"DOM_W\":{\"oneOf\":[" WORD("b", "0") "]}}", bad, "duplicate");
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[{\"const\":\"a\",\"const\":\"b\",\"title\":\"T\",\"description\":\"d\",\"x-code\":0}]}}", bad, "duplicate");
  doc_is("{\"version\":\"1.0.0\",\"x-owner\":\"o\",\"x-owner\":\"p\"}", "{\"DOM_W\":{\"oneOf\":[" WORD("a", "0") "]}}", bad, "duplicate");
  make_scratch();
  make_domain("dom", "https://openmixer.org/contract/dom", "1.0.0");
  char path[600];
  snprintf(path, sizeof path, "%s/dom/catalogs", scratch);
  mkdir(path, 0700);
  snprintf(path, sizeof path, "%s/dom/catalogs/es.json", scratch);
  put_file(path, "{\"lang\":\"es\",\"messages\":{\"DOM_W.a\":{\"text\":\"x\"},\"DOM_W.a\":{\"text\":\"y\"}}}");
  omx_domain *d;
  omx_domain_error err;
  int rc = open_scratch("dom", NULL, &d, &err);
  if (rc != OMX_CONTRACT_CODE_CATALOG_INVALID) { failures++; fprintf(stderr, "%s:%d: FAIL duplicate catalog key: got status %d, want %d\n", __FILE__, __LINE__, rc, OMX_CONTRACT_CODE_CATALOG_INVALID); }
  drop_scratch();
}

/* (7) what the loader reads must be coherent: no $ref, min <= max, default within, oneOf or properties and not both. */
static void test_incoherent_items_refused(void) {
  const int bad = OMX_CONTRACT_CODE_FILE_INVALID;
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[" WORD("a", "0") "],\"$ref\":\"#/x\"}}", bad, "$ref");
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[{\"const\":\"a\",\"title\":\"T\",\"description\":\"d\",\"x-code\":0,\"$ref\":\"#/x\"}]}}", bad, "$ref");
  doc_is(INFO_OK, "{\"DOM_P\":{\"properties\":{\"g\":{\"minimum\":0,\"maximum\":1,\"$ref\":\"#/x\"}}}}", bad, "$ref");
  doc_is(INFO_OK, "{\"DOM_P\":{\"properties\":{\"g\":{\"$ref\":\"#/x\"}}}}", bad, "$ref");
  doc_is(INFO_OK, "{\"OTHER\":{\"$ref\":\"#/x\"},\"DOM_W\":{\"oneOf\":[" WORD("a", "0") "]}}", bad, "$ref");
  doc_is(INFO_OK, "{\"DOM_P\":{\"properties\":{\"g\":{\"minimum\":0,\"maximum\":1}}}}", 0, NULL);
  /* a $ref under an extension key the loader never reads opens: the formats package's clap and lv2 carry them in x-kinds and x-statuses */
  doc_is(INFO_OK, "{\"DOM_W\":{\"x-kinds\":{\"$ref\":\"https://openmixer.org/contract/formats/common#/x\"},\"oneOf\":[" WORD("a", "0") "]}}", 0, NULL);
  doc_is(INFO_OK, "{\"DOM_P\":{\"properties\":{\"g\":{\"minimum\":1,\"maximum\":0}}}}", bad, "\"g\"");
  doc_is(INFO_OK, "{\"DOM_P\":{\"properties\":{\"g\":{\"minimum\":1,\"maximum\":1,\"default\":1}}}}", 0, NULL);
  doc_is(INFO_OK, "{\"DOM_P\":{\"properties\":{\"g\":{\"minimum\":0,\"maximum\":1,\"default\":2}}}}", bad, "default");
  doc_is(INFO_OK, "{\"DOM_P\":{\"properties\":{\"g\":{\"minimum\":0,\"maximum\":1,\"default\":-1}}}}", bad, "default");
  doc_is(INFO_OK, "{\"DOM_B\":{\"oneOf\":[" WORD("a", "0") "],\"properties\":{\"g\":{\"minimum\":0,\"maximum\":1}}}}", bad, "DOM_B");
}

/* One catalog `name` (a file, a directory or a symlink as `kind` says: 0, 1, 2) in a domain with a valid document. */
static int catalog_opens(const char *name, int kind) {
  make_scratch();
  make_domain("dom", "https://openmixer.org/contract/dom", "1.0.0");
  char path[600], target[600];
  snprintf(path, sizeof path, "%s/dom/catalogs", scratch);
  mkdir(path, 0700);
  snprintf(path, sizeof path, "%s/dom/catalogs/%s", scratch, name);
  snprintf(target, sizeof target, "%s/real.txt", scratch);
  char body[128], lang[64];
  snprintf(lang, sizeof lang, "%.*s", (int)strlen(name) - 5 > 0 ? (int)strlen(name) - 5 : 0, name);
  snprintf(body, sizeof body, "{\"lang\":\"%s\",\"messages\":{}}", lang); /* a catalog's lang is its file name */
  put_file(target, body);
  if (kind == 0) put_file(path, body);
  else if (kind == 1) mkdir(path, 0700);
  else if (symlink(target, path) != 0) failures++;
  omx_domain *d;
  omx_domain_error err;
  int rc = open_scratch("dom", NULL, &d, &err);
  if (rc == 0 && d) omx_domain_close(d);
  if (rc == OMX_CONTRACT_CODE_DIR_ABSENT) { failures++; fprintf(stderr, "%s:%d: FAIL catalog %s refused as contract.dir.absent: %s\n", __FILE__, __LINE__, name, err.message); }
  drop_scratch();
  return rc;
}

/* (8) a bad catalog is contract.catalog.invalid, not "the contract directory is absent"; its name is a language tag; a symlink is not followed. */
static void test_bad_catalogs_refused(void) {
  const int bad = OMX_CONTRACT_CODE_CATALOG_INVALID;
  CHECK(catalog_opens("es.json", 0) == 0);
  CHECK(catalog_opens("pt-BR.json", 0) == 0);
  CHECK(catalog_opens("es.json", 1) == bad);
  CHECK(catalog_opens("..json", 0) == bad);
  CHECK(catalog_opens("a b.json", 0) == bad);
  CHECK(catalog_opens("-x.json", 0) == bad);
  CHECK(catalog_opens("x.y.json", 0) == bad);
  CHECK(catalog_opens("es.json", 2) == bad);
}

/* One catalog es.json holding `content`, in a domain with a valid document: the status of opening it. */
static int catalog_holding(const char *content) {
  make_scratch();
  make_domain("dom", "https://openmixer.org/contract/dom", "1.0.0");
  char path[600];
  snprintf(path, sizeof path, "%s/dom/catalogs", scratch);
  mkdir(path, 0700);
  snprintf(path, sizeof path, "%s/dom/catalogs/es.json", scratch);
  put_file(path, content);
  omx_domain *d;
  omx_domain_error err;
  int rc = open_scratch("dom", NULL, &d, &err);
  if (rc == 0 && d) omx_domain_close(d);
  drop_scratch();
  return rc;
}

/* (8) a catalog that does not parse, or holds no messages object, is a bad catalog: its own code, not the document's. */
static void test_unreadable_catalogs_refused(void) {
  CHECK(catalog_holding("{\"lang\":\"es\",\"messages\":{}}") == 0);
  CHECK(catalog_holding("{\"lang\":\"es\",\"messages\":") == OMX_CONTRACT_CODE_CATALOG_INVALID);
  CHECK(catalog_holding("[]") == OMX_CONTRACT_CODE_CATALOG_INVALID);
  CHECK(catalog_holding("{\"lang\":\"es\",\"messages\":[]}") == OMX_CONTRACT_CODE_CATALOG_INVALID);
}

/* (8) an empty x-owner is no owner. */
static void test_empty_owner_refused(void) {
  doc_is("{\"version\":\"1.0.0\",\"x-owner\":\"\",\"x-stability\":\"experimental\"}", "{\"DOM_W\":{\"oneOf\":[" WORD("a", "0") "]}}", OMX_CONTRACT_CODE_MANIFEST_INVALID, "x-owner");
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[" WORD("a", "0") "]}}", 0, NULL);
}


/* ---- paths of the loader no test reached: shapes, versions, catalogs, ranges (each asserts the code) ---- */

#define ONE_W "{\"DOM_W\":{\"oneOf\":[" WORD("a", "0") "]}}"

/* A catalog `es.json` with `content` in a domain with a valid document: the status of opening, the message in err, the handle in *dp. */
static int catalog_is(const char *content, omx_domain **dp, omx_domain_error *err) {
  make_scratch();
  make_domain("dom", "https://openmixer.org/contract/dom", "1.0.0");
  char path[600];
  snprintf(path, sizeof path, "%s/dom/catalogs", scratch);
  mkdir(path, 0700);
  snprintf(path, sizeof path, "%s/dom/catalogs/es.json", scratch);
  put_file(path, content);
  return open_scratch("dom", NULL, dp, err);
}

static void catalog_refused(const char *content, const char *has) {
  omx_domain *d;
  omx_domain_error err;
  int rc = catalog_is(content, &d, &err);
  if (rc != OMX_CONTRACT_CODE_CATALOG_INVALID) { failures++; fprintf(stderr, "%s:%d: FAIL catalog %s: got status %d, want %d\n", __FILE__, __LINE__, content, rc, OMX_CONTRACT_CODE_CATALOG_INVALID); }
  else {
    CHECK_STR(err.code, omx_domain_code(OMX_CONTRACT_CODE_CATALOG_INVALID));
    if (!strstr(err.message, has)) { failures++; fprintf(stderr, "%s:%d: FAIL message \"%s\" lacks \"%s\"\n", __FILE__, __LINE__, err.message, has); }
    CHECK(strstr(err.message, "es.json") != NULL);
  }
  if (rc == 0 && d) omx_domain_close(d);
  drop_scratch();
}

static void test_catalog_shapes_refused(void) {
  catalog_refused("[]", "messages");                                  /* root not an object */
  catalog_refused("{}", "messages");                                  /* no messages */
  catalog_refused("{\"lang\":\"ca\",\"messages\":{}}", "lang");                  /* a lang that is not the file name */
  catalog_refused("{\"messages\":{}}", "lang");                                  /* no lang */
  catalog_refused("{\"lang\":\"es\",\"messages\":[]}", "messages");                   /* messages not an object */
  catalog_refused("{\"lang\":\"es\",\"messages\":{\"DOM_W.a\":\"Hola\"}}", "DOM_W.a"); /* an entry that is not an object */
  catalog_refused("{\"lang\":\"es\",\"messages\":{\"DOM_W.a\":null}}", "DOM_W.a");
  catalog_refused("{\"lang\":\"es\",\"messages\":{\"DOM_W.a\":[]}}", "DOM_W.a");
  catalog_refused("{\"lang\":\"es\",\"messages\":{\"DOM_W.a\":{}}}", "DOM_W.a");      /* an entry without text */
  catalog_refused("{\"lang\":\"es\",\"messages\":{\"DOM_W.a\":{\"text\":1}}}", "DOM_W.a"); /* text not a string */
  catalog_refused("{\"lang\":\"es\",\"messages\":{\"DOM_W.a\":{\"text\":null}}}", "DOM_W.a");
  catalog_refused("{\"lang\":\"es\",\"messages\":{\"DOM_W.a\":{\"text\":\"ok\"},\"DOM_W.b\":{\"text\":[\"x\"]}}}", "DOM_W.b"); /* the second entry is the bad one */
}

/* A catalog that is not JSON is a bad catalog too, naming the file: never the document's contract.file.not-json. */
static void test_catalog_not_json(void) {
  omx_domain *d;
  omx_domain_error err;
  /* a scalar root is no JSON either: the parser is not asked to accept one */
  const char *bad[] = { "", "{", "{\"lang\":\"es\",\"messages\":{}} x", "not json", "\"messages\"", "7", "null" };
  for (size_t i = 0; i < sizeof bad / sizeof bad[0]; i++) {
    int rc = catalog_is(bad[i], &d, &err);
    if (rc != OMX_CONTRACT_CODE_CATALOG_INVALID) { failures++; fprintf(stderr, "%s:%d: FAIL catalog \"%s\": got status %d, want contract.catalog.invalid\n", __FILE__, __LINE__, bad[i], rc); }
    else { CHECK_STR(err.code, "contract.catalog.invalid"); CHECK(strstr(err.message, "es.json") != NULL); }
    drop_scratch();
  }
}

/* A catalog the process cannot read is refused with the code of a bad catalog (skipped as root, which reads anything). */
static void test_catalog_unreadable(void) {
  if (geteuid() == 0) { skips++; puts("skip test_catalog_unreadable: run as root, which reads a mode-0 file"); return; }
  make_scratch();
  make_domain("dom", "https://openmixer.org/contract/dom", "1.0.0");
  char path[600];
  snprintf(path, sizeof path, "%s/dom/catalogs", scratch);
  mkdir(path, 0700);
  snprintf(path, sizeof path, "%s/dom/catalogs/es.json", scratch);
  put_file(path, "{\"lang\":\"es\",\"messages\":{}}");
  CHECK(chmod(path, 0) == 0);
  omx_domain *d;
  omx_domain_error err;
  CHECK(open_scratch("dom", NULL, &d, &err) == OMX_CONTRACT_CODE_CATALOG_INVALID);
  CHECK_STR(err.code, omx_domain_code(OMX_CONTRACT_CODE_CATALOG_INVALID));
  CHECK(strstr(err.message, "es.json") != NULL);
  drop_scratch();
}

/* What the loader accepts of a catalog: no catalogs/ directory; an empty messages; a "by" of any type (the loader reads only
   "text", so a "by" that is not a string opens); other files of catalogs/ that are not .json. */
static void test_catalog_accepted(void) {
  omx_domain *d;
  omx_domain_error err;
  CHECK(catalog_is("{\"lang\":\"es\",\"messages\":{}}", &d, &err) == 0);
  if (d) { CHECK(omx_domain_text(d, "DOM_W.a", "es") == NULL); omx_domain_close(d); } /* a has no x-text: no sentence in any language */
  drop_scratch();
  CHECK(catalog_is("{\"lang\":\"es\",\"messages\":{\"DOM_W.a\":{\"text\":\"Hola\",\"by\":7}}}", &d, &err) == 0);
  if (d) { CHECK_STR(omx_domain_text(d, "DOM_W.a", "es"), "Hola"); omx_domain_close(d); }
  drop_scratch();
  CHECK(catalog_is("{\"lang\":\"es\",\"messages\":{\"DOM_W.a\":{\"text\":\"Hola\",\"by\":\"me\"}},\"other\":1}", &d, &err) == 0);
  if (d) { CHECK_STR(omx_domain_text(d, "DOM_W.a", "es"), "Hola"); omx_domain_close(d); }
  drop_scratch();
  /* a key that is no word of the domain is kept and never found */
  CHECK(catalog_is("{\"lang\":\"es\",\"messages\":{\"DOM_W.zz\":{\"text\":\"x\"}}}", &d, &err) == 0);
  if (d) { CHECK(omx_domain_text(d, "DOM_W.zz", "es") == NULL); omx_domain_close(d); }
  drop_scratch();
  make_scratch();
  make_domain("dom", "https://openmixer.org/contract/dom", "1.0.0");
  char path[600];
  snprintf(path, sizeof path, "%s/dom/catalogs", scratch);
  mkdir(path, 0700);
  snprintf(path, sizeof path, "%s/dom/catalogs/README.txt", scratch);
  put_file(path, "not a catalog");
  snprintf(path, sizeof path, "%s/dom/catalogs/.json", scratch); /* five bytes or fewer is no catalog name */
  put_file(path, "not json");
  CHECK(open_scratch("dom", NULL, &d, &err) == 0);
  if (d) omx_domain_close(d);
  drop_scratch();
}

/* The document's top shape: root, $id, info, version, owner. */
static void test_document_shape_refused(void) {
  const int bad = OMX_CONTRACT_CODE_FILE_INVALID;
  const int MAN = OMX_CONTRACT_CODE_MANIFEST_INVALID;
  omx_domain *d;
  omx_domain_error err;
  const char *roots[] = { "[]", "[{\"$id\":\"https://openmixer.org/contract/dom\"}]" };
  for (size_t i = 0; i < sizeof roots / sizeof roots[0]; i++) {
    make_scratch();
    make_domain("dom", "https://openmixer.org/contract/dom", "1.0.0");
    char path[600];
    snprintf(path, sizeof path, "%s/dom/dom.json", scratch);
    put_file(path, roots[i]);
    int rc = open_scratch("dom", NULL, &d, &err);
    if (rc != bad) { failures++; fprintf(stderr, "%s:%d: FAIL root %s: got status %d, want %d\n", __FILE__, __LINE__, roots[i], rc, bad); }
    else { CHECK_STR(err.code, "contract.file.invalid"); CHECK(strstr(err.message, "JSON object") != NULL); }
    drop_scratch();
  }
  const char *scalars[] = { "\"dom\"", "7", "null", "true" }; /* the parser takes an object or an array as a root only */
  for (size_t i = 0; i < sizeof scalars / sizeof scalars[0]; i++) {
    make_scratch();
    make_domain("dom", "https://openmixer.org/contract/dom", "1.0.0");
    char path[600];
    snprintf(path, sizeof path, "%s/dom/dom.json", scratch);
    put_file(path, scalars[i]);
    int rc = open_scratch("dom", NULL, &d, &err);
    if (rc != OMX_CONTRACT_CODE_FILE_NOT_JSON) { failures++; fprintf(stderr, "%s:%d: FAIL root %s: got status %d, want not-json\n", __FILE__, __LINE__, scalars[i], rc); }
    drop_scratch();
  }
  doc_is("{\"x-owner\":\"o\"}", ONE_W, MAN, "info.version");                    /* no version */
  doc_is("{\"version\":1,\"x-owner\":\"o\"}", ONE_W, MAN, "info.version");      /* version not a string */
  doc_is("{\"version\":null,\"x-owner\":\"o\"}", ONE_W, MAN, "info.version");
  doc_is("{\"version\":\"1.0\",\"x-owner\":\"o\"}", ONE_W, MAN, "info.version");
  doc_is("{\"version\":\"1.0.0.0\",\"x-owner\":\"o\"}", ONE_W, MAN, "info.version");
  doc_is("{\"version\":\"1.0.0-rc1\",\"x-owner\":\"o\"}", ONE_W, MAN, "info.version");
  doc_is("{\"version\":\"\",\"x-owner\":\"o\"}", ONE_W, MAN, "info.version");
  doc_is("{\"version\":\"1.0.0\"}", ONE_W, MAN, "x-owner");                     /* no owner */
  doc_is("{\"version\":\"1.0.0\",\"x-owner\":7}", ONE_W, MAN, "x-owner");       /* owner not a string */
  doc_is("{\"version\":\"1.0.0\",\"x-owner\":null}", ONE_W, MAN, "x-owner");
  doc_is("[]", ONE_W, MAN, "info.version");                                     /* info not an object */
  doc_is("\"1.0.0\"", ONE_W, MAN, "info.version");
  doc_is("null", ONE_W, MAN, "info.version");
  /* an absent info, and an absent or non-string $id */
  make_scratch();
  make_domain("dom", "https://openmixer.org/contract/dom", "1.0.0");
  char path[600];
  snprintf(path, sizeof path, "%s/dom/dom.json", scratch);
  put_file(path, "{\"$id\":\"https://openmixer.org/contract/dom\",\"components\":{\"schemas\":{}}}");
  CHECK(open_scratch("dom", NULL, &d, &err) == MAN);
  CHECK(strstr(err.message, "info.version") != NULL);
  put_file(path, "{\"info\":" INFO_OK ",\"components\":{\"schemas\":{}}}");
  CHECK(open_scratch("dom", NULL, &d, &err) == OMX_CONTRACT_CODE_MANIFEST_INVALID);
  CHECK(strstr(err.message, "(absent)") != NULL);
  put_file(path, "{\"$id\":7,\"info\":" INFO_OK ",\"components\":{\"schemas\":{}}}");
  CHECK(open_scratch("dom", NULL, &d, &err) == OMX_CONTRACT_CODE_MANIFEST_INVALID);
  put_file(path, "{\"$id\":\"https://openmixer.org/contract/dom\",\"info\":" INFO_OK "}"); /* no components */
  CHECK(open_scratch("dom", NULL, &d, &err) == bad);
  CHECK(strstr(err.message, "schemas") != NULL);
  put_file(path, "{\"$id\":\"https://openmixer.org/contract/dom\",\"info\":" INFO_OK ",\"components\":{\"schemas\":[]}}");
  CHECK(open_scratch("dom", NULL, &d, &err) == bad);
  put_file(path, "{\"$id\":\"https://openmixer.org/contract/dom\",\"info\":" INFO_OK ",\"components\":[]}");
  CHECK(open_scratch("dom", NULL, &d, &err) == bad);
  drop_scratch();
}

/* The floor is compared to the patch: 1.2.3 against 1.2.2 is refused; equal and above open; each part decides in turn. */
static void test_patch_level_floor(void) {
  make_scratch();
  omx_domain *d;
  omx_domain_error err;
  make_domain("p", "https://openmixer.org/contract/p", "1.2.3");
  CHECK(open_scratch("p", "1.2.4", &d, &err) == OMX_CONTRACT_CODE_PACKAGE_TOO_OLD);
  CHECK_STR(err.code, "contract.package.too-old");
  CHECK(strstr(err.message, "1.2.3") != NULL && strstr(err.message, "1.2.4") != NULL);
  CHECK(open_scratch("p", "1.2.3", &d, &err) == 0);
  if (d) omx_domain_close(d);
  CHECK(open_scratch("p", "1.2.2", &d, &err) == 0);
  if (d) omx_domain_close(d);
  CHECK(open_scratch("p", "1.3.0", &d, &err) == OMX_CONTRACT_CODE_PACKAGE_TOO_OLD);
  CHECK(open_scratch("p", "2.0.0", &d, &err) == OMX_CONTRACT_CODE_PACKAGE_TOO_OLD);
  CHECK(open_scratch("p", "1.1.99", &d, &err) == 0);
  if (d) omx_domain_close(d);
  CHECK(open_scratch("p", "0.99.99", &d, &err) == 0);
  if (d) omx_domain_close(d);
  make_domain("q", "https://openmixer.org/contract/q", "1.2.2"); /* the document is the older: floor 1.2.3 refused */
  CHECK(open_scratch("q", "1.2.3", &d, &err) == OMX_CONTRACT_CODE_PACKAGE_TOO_OLD);
  CHECK(open_scratch("q", "1.2.2", &d, &err) == 0);
  if (d) omx_domain_close(d);
  make_domain("r", "https://openmixer.org/contract/r", "1.2.4");
  CHECK(open_scratch("r", "1.2.3", &d, &err) == 0);
  if (d) omx_domain_close(d);
  /* the floor "" is not x.y.z (a program asks NULL for none) */
  CHECK(open_scratch("r", "", &d, &err) == OMX_CONTRACT_CODE_FILE_INVALID);
  drop_scratch();
}

/* A word or a range with a value of the wrong type is refused naming it; a schema that is neither kind is not served. */
static void test_wrong_types_refused(void) {
  const int bad = OMX_CONTRACT_CODE_FILE_INVALID;
  doc_is(INFO_OK, "{\"DOM_W\":1}", bad, "DOM_W");                                  /* a schema not an object */
  doc_is(INFO_OK, "{\"DOM_W\":[]}", bad, "DOM_W");
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[1]}}", bad, "const");                   /* a word not an object */
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[\"a\"]}}", bad, "const");
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[null]}}", bad, "const");
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[[]]}}", bad, "const");
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[{\"const\":1,\"title\":\"T\",\"description\":\"d\",\"x-code\":0}]}}", bad, "const");
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[{\"title\":\"T\",\"description\":\"d\",\"x-code\":0}]}}", bad, "const");
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[{\"const\":\"a\",\"description\":\"d\",\"x-code\":0}]}}", bad, "title");
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[{\"const\":\"a\",\"title\":1,\"description\":\"d\",\"x-code\":0}]}}", bad, "title");
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[{\"const\":\"a\",\"title\":\"T\",\"description\":[],\"x-code\":0}]}}", bad, "description");
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[{\"const\":\"a\",\"title\":\"T\",\"description\":\"d\"}]}}", bad, "x-code");
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[{\"const\":\"a\",\"title\":\"T\",\"description\":\"d\",\"x-code\":\"0\"}]}}", bad, "x-code");
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[{\"const\":\"a\",\"title\":\"T\",\"description\":\"d\",\"x-code\":0.0}]}}", bad, "x-code");
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[{\"const\":\"a\",\"title\":\"T\",\"description\":\"d\",\"x-code\":-1}]}}", bad, "x-code");
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[{\"const\":\"a\",\"title\":\"T\",\"description\":\"d\",\"x-code\":2147483648}]}}", bad, "x-code");
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[{\"const\":\"a\",\"title\":\"T\",\"description\":\"d\",\"x-code\":0,\"x-text\":1}]}}", bad, "x-text");
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[{\"const\":\"a\",\"title\":\"T\",\"description\":\"d\",\"x-code\":0,\"x-text\":\"Hi\"}]}}", 0, NULL);
  /* a range parameter */
  doc_is(INFO_OK, "{\"DOM_P\":{\"properties\":{\"g\":1}}}", bad, "\"g\"");        /* a parameter not an object */
  doc_is(INFO_OK, "{\"DOM_P\":{\"properties\":{\"g\":{\"maximum\":1}}}}", bad, "minimum");
  doc_is(INFO_OK, "{\"DOM_P\":{\"properties\":{\"g\":{\"minimum\":0}}}}", bad, "maximum");
  doc_is(INFO_OK, "{\"DOM_P\":{\"properties\":{\"g\":{\"minimum\":\"0\",\"maximum\":1}}}}", bad, "minimum");
  doc_is(INFO_OK, "{\"DOM_P\":{\"properties\":{\"g\":{\"minimum\":0,\"maximum\":null}}}}", bad, "maximum");
  doc_is(INFO_OK, "{\"DOM_P\":{\"properties\":{\"g\":{\"minimum\":0,\"maximum\":1,\"default\":\"0\"}}}}", bad, "default");
  doc_is(INFO_OK, "{\"DOM_P\":{\"properties\":{\"g\":{\"minimum\":0,\"maximum\":1,\"x-unit\":1}}}}", bad, "x-unit");
  doc_is(INFO_OK, "{\"DOM_P\":{\"properties\":{\"g\":{\"minimum\":0,\"maximum\":1,\"x-scale\":[]}}}}", bad, "x-scale");
  doc_is(INFO_OK, "{\"DOM_P\":{\"properties\":{\"g\":{\"minimum\":0.5,\"maximum\":1.5,\"default\":1,\"x-unit\":\"dB\",\"x-scale\":\"log\"}}}}", 0, NULL);
  /* a schema whose oneOf or properties is the wrong type is neither kind: opened and not served (the loader's documented skip) */
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":\"a\"}}", 0, NULL);
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":{}}}", 0, NULL);
  doc_is(INFO_OK, "{\"DOM_P\":{\"properties\":[]}}", 0, NULL);
  doc_is(INFO_OK, "{\"DOM_P\":{\"properties\":\"g\"}}", 0, NULL);
  doc_is(INFO_OK, "{\"DOM_P\":{\"type\":\"object\"}}", 0, NULL);
  doc_is(INFO_OK, "{}", 0, NULL);
}

/* An open that skipped a schema serves nothing for it. */
static void test_skipped_schema_is_not_served(void) {
  make_scratch();
  make_doc(INFO_OK, "{\"A\":{\"oneOf\":\"a\"},\"B\":{\"properties\":[]},\"C\":{\"type\":\"string\"},\"DOM_W\":{\"oneOf\":[" WORD("a", "0") "]}}");
  omx_domain *d;
  omx_domain_error err;
  CHECK(open_scratch("dom", NULL, &d, &err) == 0);
  if (d) {
    CHECK(omx_domain_word_count(d, "A") == -1 && omx_domain_word_count(d, "B") == -1 && omx_domain_word_count(d, "C") == -1);
    CHECK(omx_domain_word_count(d, "DOM_W") == 1);
    CHECK(omx_domain_word(d, "A", "a", NULL) == OMX_CONTRACT_CODE_ITEM_UNKNOWN);
    omx_domain_close(d);
  }
  drop_scratch();
}

/* A words item with an empty oneOf is a words item with no words: it opens, counts 0, has no word at any index, and
   an empty properties is a range item with no parameter. */
static void test_empty_items(void) {
  make_scratch();
  make_doc(INFO_OK, "{\"DOM_E\":{\"oneOf\":[]},\"DOM_R\":{\"properties\":{}}}");
  omx_domain *d;
  omx_domain_error err;
  CHECK(open_scratch("dom", NULL, &d, &err) == 0);
  if (d) {
    omx_domain_word_info w;
    omx_domain_range_info r;
    CHECK(omx_domain_word_count(d, "DOM_E") == 0);
    CHECK(omx_domain_word_at(d, "DOM_E", 0, &w) == OMX_CONTRACT_CODE_INDEX_RANGE);
    CHECK(omx_domain_word_at(d, "DOM_E", -1, &w) == OMX_CONTRACT_CODE_INDEX_RANGE);
    CHECK(omx_domain_word(d, "DOM_E", "a", &w) == OMX_CONTRACT_CODE_WORD_UNKNOWN);
    CHECK(omx_domain_text(d, "DOM_E.a", "es") == NULL);
    CHECK(omx_domain_word_count(d, "DOM_R") == 0);
    CHECK(omx_domain_range(d, "DOM_R", "g", &r) == OMX_CONTRACT_CODE_WORD_UNKNOWN);
    CHECK(omx_domain_word_at(d, "DOM_R", 0, &w) == OMX_CONTRACT_CODE_INDEX_RANGE);
    omx_domain_close(d);
  }
  drop_scratch();
}

/* Two words with the same const, and a long word, a long item name and an empty const: words are any string. */
static void test_words_are_any_string(void) {
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[" WORD("a", "0") "," WORD("a", "0") "]}}", OMX_CONTRACT_CODE_FILE_INVALID, "x-code"); /* the place comes first */
  doc_is(INFO_OK, "{\"DOM_W\":{\"oneOf\":[" WORD("a", "0") "," WORD("b", "1") "," WORD("a", "2") "]}}", OMX_CONTRACT_CODE_FILE_INVALID, "twice");
  make_scratch();
  char schemas[2200], longw[1100], longitem[400];
  memset(longw, 'w', 1000); longw[1000] = '\0';
  memset(longitem, 'I', 300); longitem[300] = '\0';
  snprintf(schemas, sizeof schemas, "{\"%s\":{\"oneOf\":[" WORD("", "0") "," WORD("%s", "1") "]}}", longitem, longw);
  make_doc(INFO_OK, schemas);
  omx_domain *d;
  omx_domain_error err;
  CHECK(open_scratch("dom", NULL, &d, &err) == 0);
  if (d) {
    omx_domain_word_info w;
    CHECK(omx_domain_word_count(d, longitem) == 2);
    CHECK(omx_domain_word(d, longitem, "", &w) == 0 && w.code == 0);
    CHECK(omx_domain_word(d, longitem, longw, &w) == 0 && w.code == 1);
    CHECK_STR(w.word, longw);
    /* a key whose item part is over the 255 bytes the text lookup holds is no word: NULL, never a truncated item */
    char key[1500];
    snprintf(key, sizeof key, "%s.%s", longitem, longw);
    CHECK(omx_domain_text(d, key, "es") == NULL);
    omx_domain_close(d);
  }
  drop_scratch();
}

/* NULL arguments the header does not forbid. */
static void test_null_arguments(void) {
  omx_domain *d = open_ok("demo", NULL);
  omx_domain_word_info w;
  omx_domain_range_info r;
  CHECK(omx_domain_word(d, NULL, "red", &w) == OMX_CONTRACT_CODE_ITEM_UNKNOWN);
  CHECK(omx_domain_word(d, "DEMO_COLORS", NULL, &w) == OMX_CONTRACT_CODE_WORD_UNKNOWN);
  CHECK(omx_domain_word(d, "DEMO_COLORS", "red", NULL) == 0);
  CHECK(omx_domain_word_at(d, "DEMO_COLORS", 0, NULL) == 0);
  CHECK(omx_domain_word_count(d, NULL) == -1 && omx_domain_word_count(NULL, "DEMO_COLORS") == -1);
  CHECK(omx_domain_range(d, "DEMO_PARAMS", NULL, &r) == OMX_CONTRACT_CODE_WORD_UNKNOWN);
  CHECK(omx_domain_range(d, "DEMO_PARAMS", "gain", NULL) == 0);
  CHECK(omx_domain_range(NULL, "DEMO_PARAMS", "gain", &r) == OMX_CONTRACT_CODE_ITEM_UNKNOWN);
  CHECK(omx_domain_text(NULL, "DEMO_COLORS.red", "ca") == NULL && omx_domain_text(d, NULL, "ca") == NULL);
  omx_domain_close(d);
  /* open with no err, and with no out */
  CHECK(omx_domain_open_at(FIX, "absent", NULL, &d, NULL) == OMX_CONTRACT_CODE_DIR_ABSENT && d == NULL);
  omx_domain_error err;
  CHECK(omx_domain_open_at(FIX, "demo", NULL, NULL, &err) == OMX_CONTRACT_CODE_FILE_INVALID);
}

/* DOMAIN_TEST_ONLY=<name> runs just that one of the hostile-directory tests (an ASan abort ends the process). */
/* A scalar item (3.21.0, docs/contract-dir.md "Domains"): x-kind scalar, x-unit and x-value, served by omx_domain_scalar()
   as the TypeScript reader serves it; a value that is no number or true or false, and a missing unit, are refused by name. */
#define SCALARS "\"DOM_LEN\":{\"description\":\"d\",\"x-kind\":\"scalar\",\"x-unit\":\"\",\"x-value\":64}," \
  "\"DOM_RATE\":{\"description\":\"d\",\"x-kind\":\"scalar\",\"x-unit\":\"Hz\",\"x-value\":50.5}," \
  "\"DOM_ON\":{\"description\":\"d\",\"x-kind\":\"scalar\",\"x-unit\":\"\",\"x-value\":true}"
static void test_scalars(void) {
  make_scratch();
  make_doc(INFO_OK, "{" SCALARS ",\"DOM_W\":{\"oneOf\":[" WORD("a", "0") "]},\"DOM_P\":{\"properties\":{\"g\":{\"minimum\":0,\"maximum\":1}}}}");
  omx_domain *d;
  omx_domain_error err;
  CHECK(open_scratch("dom", NULL, &d, &err) == 0);
  if (d) {
    omx_domain_scalar_info s = { -1, -1, NULL };
    CHECK(omx_domain_scalar(d, "DOM_LEN", &s) == 0);
    CHECK(s.value == 64 && s.is_bool == 0);
    CHECK_STR(s.unit, "");
    CHECK(omx_domain_scalar(d, "DOM_RATE", &s) == 0);
    CHECK(s.value == 50.5 && s.is_bool == 0);
    CHECK_STR(s.unit, "Hz");
    CHECK(omx_domain_scalar(d, "DOM_ON", &s) == 0);
    CHECK(s.value == 1 && s.is_bool == 1);
    omx_domain_scalar_info kept = s;
    CHECK(omx_domain_scalar(d, "NO_SUCH", &s) == OMX_CONTRACT_CODE_ITEM_UNKNOWN);
    CHECK(omx_domain_scalar(d, "DOM_W", &s) == OMX_CONTRACT_CODE_WORD_UNKNOWN);  /* a words item has no value */
    CHECK(omx_domain_scalar(d, "DOM_P", &s) == OMX_CONTRACT_CODE_WORD_UNKNOWN);  /* nor a range item */
    CHECK(s.value == kept.value && s.unit == kept.unit);                          /* a refused call leaves out as it was */
    CHECK(omx_domain_word_count(d, "DOM_LEN") == 0);                              /* a scalar has no words */
    CHECK(omx_domain_scalar(NULL, "DOM_LEN", &s) == OMX_CONTRACT_CODE_ITEM_UNKNOWN);
    CHECK(omx_domain_scalar(d, NULL, &s) == OMX_CONTRACT_CODE_ITEM_UNKNOWN);
    CHECK(omx_domain_scalar(d, "DOM_LEN", NULL) == 0);
    omx_domain_close(d);
  }
  drop_scratch();
  int bad = OMX_CONTRACT_CODE_FILE_INVALID;
  doc_is(INFO_OK, "{\"DOM_S\":{\"description\":\"d\",\"x-kind\":\"scalar\",\"x-unit\":\"\",\"x-value\":\"64\"}}", bad, "x-value");
  doc_is(INFO_OK, "{\"DOM_S\":{\"description\":\"d\",\"x-kind\":\"scalar\",\"x-unit\":\"\",\"x-value\":null}}", bad, "x-value");
  doc_is(INFO_OK, "{\"DOM_S\":{\"description\":\"d\",\"x-kind\":\"scalar\",\"x-unit\":\"\"}}", bad, "x-value");
  doc_is(INFO_OK, "{\"DOM_S\":{\"description\":\"d\",\"x-kind\":\"scalar\",\"x-value\":1}}", bad, "x-unit");
  doc_is(INFO_OK, "{\"DOM_S\":{\"description\":\"d\",\"x-kind\":\"scalar\",\"x-unit\":7,\"x-value\":1}}", bad, "x-unit");
  /* a schema that is no words, range or scalar item is still not served (a sheet, rebuilt at build time only) */
  doc_is(INFO_OK, "{\"DOM_S\":{\"description\":\"d\",\"x-kind\":\"sheet\",\"x-value\":{\"a\":1}},\"DOM_W\":{\"oneOf\":[" WORD("a", "0") "]}}", 0, NULL);
}

/* A word's x-args (3.21.0): exactly the {name} placeholders of its x-text, each once; refused by name otherwise, as the
   TypeScript reader and the build refuse it. A word whose x-text names none carries none. */
#define ARGW(text, args) "{\"DOM_W\":{\"oneOf\":[{\"const\":\"a\",\"title\":\"T\",\"x-code\":0" text args "}]}}"
static void test_word_args(void) {
  int bad = OMX_CONTRACT_CODE_FILE_INVALID;
  doc_is(INFO_OK, ARGW(",\"x-text\":\"{file} says {found}, {want} asked\"", ",\"x-args\":[\"file\",\"want\",\"found\"]"), 0, NULL);
  doc_is(INFO_OK, ARGW(",\"x-text\":\"No placeholder.\"", ""), 0, NULL);
  doc_is(INFO_OK, ARGW("", ""), 0, NULL);
  doc_is(INFO_OK, ARGW(",\"x-text\":\"{{x}} and {y\"", ",\"x-args\":[\"x\"]"), 0, NULL);           /* {name} as the build reads it */
  doc_is(INFO_OK, ARGW(",\"x-text\":\"{file} says {found}\"", ",\"x-args\":[\"file\"]"), bad, "x-args");          /* a placeholder not in x-args */
  doc_is(INFO_OK, ARGW(",\"x-text\":\"{file}\"", ",\"x-args\":[\"file\",\"path\"]"), bad, "x-args");             /* an arg the text does not name */
  doc_is(INFO_OK, ARGW(",\"x-text\":\"{file}\"", ",\"x-args\":[\"file\",\"file\"]"), bad, "x-args");             /* an arg twice */
  doc_is(INFO_OK, ARGW(",\"x-text\":\"{file}\"", ""), bad, "x-args");                                            /* none, and the text names one */
  doc_is(INFO_OK, ARGW("", ",\"x-args\":[\"file\"]"), bad, "x-args");                                            /* args with no text */
  doc_is(INFO_OK, ARGW(",\"x-text\":\"{file}\"", ",\"x-args\":\"file\""), bad, "x-args");                         /* not a list */
  doc_is(INFO_OK, ARGW(",\"x-text\":\"{file}\"", ",\"x-args\":[1]"), bad, "x-args");                              /* not a list of strings */
}

/* info.x-requires (docs/contract-dir.md, "Domains"): a map of package to floor ">= x.y.z", as the TypeScript reader
 * reads it; anything else is refused as MANIFEST_INVALID, naming x-requires. The floors themselves are the build's to
 * check: a loader opens one domain. */
#define INFO_REQ(r) "{\"version\":\"1.0.0\",\"x-owner\":\"o\",\"x-stability\":\"experimental\",\"x-requires\":" r "}"
static void test_requires(void) {
  int bad = OMX_CONTRACT_CODE_MANIFEST_INVALID;
  const char *one = "{\"DOM_W\":{\"oneOf\":[" WORD("a", "0") "]}}";
  doc_is(INFO_REQ("{\"plugin-db\":\">= 1.2.0\",\"dsp/kernels\":\">= 0.25.0\"}"), one, 0, NULL);
  doc_is(INFO_REQ("{}"), one, 0, NULL);
  doc_is(INFO_REQ("\"plugin-db\""), one, bad, "x-requires");                      /* not a map */
  doc_is(INFO_REQ("[\"plugin-db\"]"), one, bad, "x-requires");                    /* a list */
  doc_is(INFO_REQ("{\"plugin-db\":\"1.2.0\"}"), one, bad, "x-requires");          /* no >= */
  doc_is(INFO_REQ("{\"plugin-db\":\">= 1.2\"}"), one, bad, "x-requires");         /* not x.y.z */
  doc_is(INFO_REQ("{\"plugin-db\":\">= 01.2.0\"}"), one, bad, "x-requires");      /* a leading zero */
  doc_is(INFO_REQ("{\"plugin-db\":1}"), one, bad, "x-requires");                  /* not a string */
  doc_is(INFO_REQ("{\"Plugin DB\":\">= 1.2.0\"}"), one, bad, "Plugin DB");        /* not a package name, named */
  doc_is(INFO_REQ("{\"plugin-db/\":\">= 1.2.0\"}"), one, bad, "x-requires");      /* an empty segment */
}

#define RUN(fn) do { const char *only_ = getenv("DOMAIN_TEST_ONLY"); if (!only_ || strcmp(only_, #fn) == 0) fn(); } while (0)

/* info.x-stability is required and is experimental or stable, as the TypeScript reader requires: refused as MANIFEST_INVALID, naming it. */
static void test_stability(void) {
  make_scratch();
  omx_domain *d;
  omx_domain_error err;
  make_domain_info("nostab", "{\"version\":\"1.0.0\",\"x-owner\":\"o\"}");
  CHECK(open_scratch("nostab", NULL, &d, &err) == OMX_CONTRACT_CODE_MANIFEST_INVALID);
  CHECK(strstr(err.message, "x-stability") != NULL);
  make_domain_info("beta", "{\"version\":\"1.0.0\",\"x-owner\":\"o\",\"x-stability\":\"beta\"}");
  CHECK(open_scratch("beta", NULL, &d, &err) == OMX_CONTRACT_CODE_MANIFEST_INVALID);
  CHECK(strstr(err.message, "x-stability") != NULL);
  make_domain_info("stab", "{\"version\":\"1.0.0\",\"x-owner\":\"o\",\"x-stability\":\"stable\"}");
  CHECK(open_scratch("stab", NULL, &d, &err) == 0);
  omx_domain_close(d);
  drop_scratch();
}

int main(void) {
  test_words();
  test_word_group();
  test_lookup_refusals();
  test_ranges();
  test_text();
  test_absent_description();
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
  RUN(test_unreadable_catalogs_refused);
  RUN(test_xcode_is_the_place);
  RUN(test_duplicate_keys_refused);
  RUN(test_incoherent_items_refused);
  RUN(test_bad_catalogs_refused);
  RUN(test_empty_owner_refused);
  RUN(test_catalog_shapes_refused);
  RUN(test_catalog_not_json);
  RUN(test_catalog_unreadable);
  RUN(test_catalog_accepted);
  RUN(test_document_shape_refused);
  RUN(test_patch_level_floor);
  RUN(test_wrong_types_refused);
  RUN(test_skipped_schema_is_not_served);
  RUN(test_empty_items);
  RUN(test_words_are_any_string);
  RUN(test_null_arguments);
  RUN(test_stability);
  RUN(test_scalars);
  RUN(test_word_args);
  RUN(test_requires);
  if (failures) { fprintf(stderr, "%d check(s) failed\n", failures); return 1; }
  if (skips) printf("domain_test: all checks passed, %d test(s) skipped\n", skips);
  else puts("domain_test: all checks passed");
  return 0;
}
