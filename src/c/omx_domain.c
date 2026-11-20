/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com> */
/*
 * The C loader of a contract domain (docs/runtime-data.md, "The C loader"; include/omxcontract/omx_domain.h).
 *
 * open reads `<dir>/<domain>/<last segment>.json` and each catalog of `catalogs/` with jansson, checks the shape the lookups read, and
 * copies every string and number a lookup returns into the handle's own arrays; the jansson documents are released
 * before open returns, so a lookup touches no jansson object and the handle is read-only afterwards.
 */
#define _POSIX_C_SOURCE 200809L
#include <omxcontract/omx_domain.h>

#include <dirent.h>
#include <errno.h>
#include <fcntl.h>
#include <jansson.h>
#include <limits.h>
#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <unistd.h>

#ifndef OMX_CONTRACTDIR
#error "OMX_CONTRACTDIR names the installed contract directory (the Makefile's CONTRACTDIR)"
#endif

#define DOMAIN_ID_PREFIX "https://openmixer.org/contract/"

typedef struct { char *word, *title, *description, *text, *group; int code; } word_t;
typedef struct { char *name, *unit, *scale; double min, max, def; int has_default; } param_t;
typedef struct { char *name; int is_words; word_t *words; size_t n_words; param_t *params; size_t n_params; int is_scalar, scalar_is_bool; double scalar_value; char *scalar_unit; } item_t;
typedef struct { char *key, *text; } message_t;
typedef struct { char *lang; message_t *messages; size_t n; } catalog_t;

struct omx_domain {
  item_t *items;
  size_t n_items;
  catalog_t *catalogs;
  size_t n_catalogs;
};

static const char *const CODES[OMX_CONTRACT_CODE_LAST + 1] = {
  NULL,
#define OMX_CODE_ROW(name, value, string) string,
  OMX_CONTRACT_CODES(OMX_CODE_ROW)
#undef OMX_CODE_ROW
};

const char *omx_domain_code(int status) {
  return status > 0 && status <= OMX_CONTRACT_CODE_LAST ? CODES[status] : NULL;
}

/* True when snprintf's result n says the whole text fitted a buffer of size. */
static int fits(int n, size_t size) { return n >= 0 && (size_t)n < size; }

/* A refusal: the status, and its code and message in err. */
static int refuse(omx_domain_error *err, int status, const char *fmt, ...) {
  if (err) {
    va_list ap;
    err->code = omx_domain_code(status);
    va_start(ap, fmt);
    vsnprintf(err->message, sizeof err->message, fmt, ap);
    va_end(ap);
  }
  return status;
}

static int path_too_long(omx_domain_error *err, const char *domain) {
  return refuse(err, OMX_CONTRACT_CODE_MANIFEST_INVALID, "The domain %s: a path of it is too long for the loader.", domain);
}

static char *dup_str(const char *s) {
  size_t n = strlen(s) + 1;
  char *p = malloc(n);
  if (p) memcpy(p, s, n);
  return p;
}

static void free_item(item_t *it) {
  free(it->name);
  for (size_t i = 0; i < it->n_words; i++) {
    free(it->words[i].word);
    free(it->words[i].title);
    free(it->words[i].description);
    free(it->words[i].text);
    free(it->words[i].group);
  }
  free(it->words);
  for (size_t i = 0; i < it->n_params; i++) {
    free(it->params[i].name);
    free(it->params[i].unit);
    free(it->params[i].scale);
  }
  free(it->scalar_unit);
  free(it->params);
}

void omx_domain_close(omx_domain *d) {
  if (!d) return;
  for (size_t i = 0; i < d->n_items; i++) free_item(&d->items[i]);
  free(d->items);
  for (size_t c = 0; c < d->n_catalogs; c++) {
    for (size_t m = 0; m < d->catalogs[c].n; m++) {
      free(d->catalogs[c].messages[m].key);
      free(d->catalogs[c].messages[m].text);
    }
    free(d->catalogs[c].messages);
    free(d->catalogs[c].lang);
  }
  free(d->catalogs);
  free(d);
}

/* "x.y.z" into three numbers; 0 when it is not that: each part plain decimal digits (no sign, no leading zero but "0"
   itself) and small enough for an unsigned long. */
static int parse_version(const char *s, unsigned long v[3]) {
  for (int i = 0; i < 3; i++) {
    if (*s < '0' || *s > '9') return 0;
    if (*s == '0' && s[1] >= '0' && s[1] <= '9') return 0;
    unsigned long n = 0;
    for (; *s >= '0' && *s <= '9'; s++) {
      unsigned long digit = (unsigned long)(*s - '0');
      if (n > (ULONG_MAX - digit) / 10) return 0;
      n = n * 10 + digit;
    }
    v[i] = n;
    if (i < 2) { if (*s != '.') return 0; s++; }
  }
  return *s == '\0';
}

static int version_below(const unsigned long have[3], const unsigned long floor_[3]) {
  for (int i = 0; i < 3; i++) {
    if (have[i] != floor_[i]) return have[i] < floor_[i];
  }
  return 0;
}

static int is_segment_char(char c) {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '-' || c == '_';
}

/* A domain name is a slash-separated path: each segment a name of letters, digits, - and _ (so never empty, "." or
   ".."), no leading or trailing slash. */
static int is_name(const char *s) {
  if (!s || !*s) return 0;
  size_t seg = 0;
  for (; *s; s++) {
    if (*s == '/') { if (seg == 0) return 0; seg = 0; }
    else if (is_segment_char(*s)) seg++;
    else return 0;
  }
  return seg > 0;
}

/* The last segment of a valid name: the document's file stem. */
static const char *last_segment(const char *name) {
  const char *slash = strrchr(name, '/');
  return slash ? slash + 1 : name;
}

/* The whole file parsed, or a refusal naming the path. The domain's document is the file the contract directory names: a
   file that cannot be opened is the domain missing (contract.dir.absent). A catalog is a regular file the domain's
   directory holds, never a symlink or a directory: any other, and one that does not parse, is refused as
   contract.catalog.invalid. */
static int load_json(const char *path, const char *domain, int is_catalog, json_t **out, omx_domain_error *err) {
  FILE *f = NULL;
  if (is_catalog) {
    int fd = open(path, O_RDONLY | O_NOFOLLOW | O_CLOEXEC);
    if (fd < 0) return refuse(err, OMX_CONTRACT_CODE_CATALOG_INVALID, "The catalog %s of the domain %s was not opened (a symlink is refused): %s.", path, domain, strerror(errno));
    struct stat st;
    if (fstat(fd, &st) != 0 || !S_ISREG(st.st_mode)) { close(fd); return refuse(err, OMX_CONTRACT_CODE_CATALOG_INVALID, "The catalog %s of the domain %s is not a regular file.", path, domain); }
    f = fdopen(fd, "rb");
    if (!f) { close(fd); return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The catalog %s of the domain %s was not read: out of memory.", path, domain); }
  } else {
    f = fopen(path, "rb");
    if (!f) return refuse(err, OMX_CONTRACT_CODE_DIR_ABSENT, "The domain %s was not found at %s: %s.", domain, path, strerror(errno));
  }
  char *buf = NULL;
  size_t len = 0, cap = 0;
  for (;;) {
    if (len == cap) {
      char *nb = realloc(buf, cap ? cap * 2 : 4096);
      if (!nb) { free(buf); fclose(f); return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The domain %s at %s was not read: out of memory.", domain, path); }
      buf = nb;
      cap = cap ? cap * 2 : 4096;
    }
    size_t got = fread(buf + len, 1, cap - len, f);
    len += got;
    if (got == 0) break;
  }
  int bad = ferror(f);
  fclose(f);
  if (bad) { free(buf); return refuse(err, is_catalog ? OMX_CONTRACT_CODE_CATALOG_INVALID : OMX_CONTRACT_CODE_DIR_ABSENT, "The domain %s at %s was not read: %s.", domain, path, strerror(errno)); }
  json_error_t jerr;
  json_t *root = json_loadb(buf, len, JSON_REJECT_DUPLICATES, &jerr);
  free(buf);
  if (!root) return refuse(err, is_catalog ? OMX_CONTRACT_CODE_CATALOG_INVALID : OMX_CONTRACT_CODE_FILE_NOT_JSON, "The domain %s at %s does not parse as JSON: %s (line %d).", domain, path, jerr.text, jerr.line);
  *out = root;
  return 0;
}

#define OOM(path, domain) refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The domain %s at %s was not read: out of memory.", (domain), (path))

static const char *str_of(json_t *obj, const char *key) {
  json_t *v = json_object_get(obj, key);
  return json_is_string(v) ? json_string_value(v) : NULL;
}

/* A `$ref` is read nowhere yet: a schema, a word or a parameter that carries one is refused (docs/runtime-data.md, "Validation
   at open"). One under an extension key the loader never reads (`x-kinds`, `x-statuses`) is not looked at. */
static int has_ref(json_t *v) { return json_is_object(v) && json_object_get(v, "$ref") != NULL; }

/* The `{name}` placeholders of a sentence, as the build reads them (src/lib/placeholders.mts, /\{([^{}]*)\}/g): each
   call answers the next one, its name at *name and length *len, and returns the place after it; NULL when none is left. */
static const char *next_placeholder(const char *s, const char **name, size_t *len) {
  for (const char *p = strchr(s, '{'); p; p = strchr(p, '{')) {
    const char *q = p + 1;
    while (*q && *q != '{' && *q != '}') q++;
    if (*q == '}') { *name = p + 1; *len = (size_t)(q - p - 1); return q + 1; }
    if (!*q) return NULL;
    p = q; /* another '{' before any '}': the placeholder starts there */
  }
  return NULL;
}

/* A word's `x-args` (3.21.0): exactly the placeholders of its `x-text`, each once; none when the text names none; never
   without a text. 0 when they agree. */
static int args_agree(json_t *args, const char *text) {
  const char *name;
  size_t len;
  if (!args) {
    return !text || !next_placeholder(text, &name, &len);
  }
  if (!text || !json_is_array(args)) return 0;
  size_t n = json_array_size(args);
  for (size_t i = 0; i < n; i++) {
    const char *a = json_string_value(json_array_get(args, i));
    if (!a || strchr(a, '{') || strchr(a, '}')) return 0;
    for (size_t j = 0; j < i; j++)
      if (strcmp(a, json_string_value(json_array_get(args, j))) == 0) return 0; /* an arg twice */
    size_t al = strlen(a);
    int named = 0;
    for (const char *s = next_placeholder(text, &name, &len); s && !named; s = next_placeholder(s, &name, &len))
      named = len == al && memcmp(name, a, al) == 0;
    if (!named) return 0; /* an arg the text does not name */
  }
  for (const char *s = next_placeholder(text, &name, &len); s; s = next_placeholder(s, &name, &len)) {
    int listed = 0;
    for (size_t i = 0; i < n && !listed; i++) {
      const char *a = json_string_value(json_array_get(args, i));
      listed = strlen(a) == len && memcmp(a, name, len) == 0;
    }
    if (!listed) return 0; /* a placeholder not in x-args */
  }
  return 1;
}

/* A words item: the `oneOf` of const words. */
static int read_words(item_t *it, json_t *one_of, const char *path, const char *domain, omx_domain_error *err) {
  size_t n = json_array_size(one_of), at;
  json_t *w;
  it->is_words = 1;
  it->words = calloc(n ? n : 1, sizeof *it->words);
  if (!it->words) return OOM(path, domain);
  json_array_foreach(one_of, at, w) {
    const char *word = str_of(w, "const"), *title = str_of(w, "title"), *desc = str_of(w, "description"), *text = str_of(w, "x-text"), *group = str_of(w, "x-group");
    json_t *code = json_object_get(w, "x-code");
    if (has_ref(w)) return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The domain %s at %s: %s.oneOf[%zu] has a \"$ref\", which the loader does not read.", domain, path, it->name, at);
    if (!json_is_object(w) || !word) return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The domain %s at %s: %s.oneOf[%zu] has no string \"const\".", domain, path, it->name, at);
    if (!title) return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The domain %s at %s: the word \"%s\" of %s has no string \"title\".", domain, path, word, it->name);
    if (json_object_get(w, "description") && !desc) return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The domain %s at %s: the \"description\" of the word \"%s\" of %s is not a string.", domain, path, word, it->name);
    if (!json_is_integer(code) || json_integer_value(code) < 0 || json_integer_value(code) > 0x7fffffff)
      return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The domain %s at %s: the word \"%s\" of %s has no non-negative integer \"x-code\".", domain, path, word, it->name);
    if (json_object_get(w, "x-text") && !text) return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The domain %s at %s: the \"x-text\" of the word \"%s\" of %s is not a string.", domain, path, word, it->name);
    if (json_object_get(w, "x-group") && !group) return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The domain %s at %s: the \"x-group\" of the word \"%s\" of %s is not a string.", domain, path, word, it->name);
    if (!args_agree(json_object_get(w, "x-args"), text))
      return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The domain %s at %s: the \"x-args\" of the word \"%s\" of %s are not exactly the placeholders of its \"x-text\", each once.", domain, path, word, it->name);
    if (json_integer_value(code) != (json_int_t)at)
      return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The domain %s at %s: the word \"%s\" of %s has x-code %lld, and must have its place in the list, %zu.", domain, path, word, it->name, (long long)json_integer_value(code), at);
    for (size_t k = 0; k < it->n_words; k++) {
      if (strcmp(it->words[k].word, word) == 0) return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The domain %s at %s: %s declares the word \"%s\" twice.", domain, path, it->name, word);
    }
    word_t *o = &it->words[it->n_words];
    o->word = dup_str(word);
    o->title = dup_str(title);
    o->description = desc ? dup_str(desc) : NULL;
    o->text = text ? dup_str(text) : NULL;
    o->group = group ? dup_str(group) : NULL;
    o->code = (int)json_integer_value(code);
    it->n_words++;
    if (!o->word || !o->title || (desc && !o->description) || (text && !o->text) || (group && !o->group)) return OOM(path, domain);
  }
  return 0;
}

/* A range item: `properties`, each a named parameter with minimum and maximum. */
static int read_params(item_t *it, json_t *props, const char *path, const char *domain, omx_domain_error *err) {
  const char *name;
  json_t *p;
  it->params = calloc(json_object_size(props) ? json_object_size(props) : 1, sizeof *it->params);
  if (!it->params) return OOM(path, domain);
  json_object_foreach(props, name, p) {
    json_t *mn = json_object_get(p, "minimum"), *mx = json_object_get(p, "maximum"), *df = json_object_get(p, "default");
    const char *unit = str_of(p, "x-unit"), *scale = str_of(p, "x-scale");
    if (has_ref(p)) return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The domain %s at %s: the parameter \"%s\" of %s has a \"$ref\", which the loader does not read.", domain, path, name, it->name);
    if (!json_is_object(p) || !json_is_number(mn) || !json_is_number(mx))
      return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The domain %s at %s: the parameter \"%s\" of %s has no numeric \"minimum\" and \"maximum\".", domain, path, name, it->name);
    if (df && !json_is_number(df)) return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The domain %s at %s: the \"default\" of the parameter \"%s\" of %s is not a number.", domain, path, name, it->name);
    if (json_number_value(mn) > json_number_value(mx))
      return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The domain %s at %s: the parameter \"%s\" of %s has a minimum above its maximum.", domain, path, name, it->name);
    if (df && (json_number_value(df) < json_number_value(mn) || json_number_value(df) > json_number_value(mx)))
      return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The domain %s at %s: the \"default\" of the parameter \"%s\" of %s is outside its minimum and maximum.", domain, path, name, it->name);
    if ((json_object_get(p, "x-unit") && !unit) || (json_object_get(p, "x-scale") && !scale))
      return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The domain %s at %s: the \"x-unit\" or \"x-scale\" of the parameter \"%s\" of %s is not a string.", domain, path, name, it->name);
    param_t *o = &it->params[it->n_params];
    o->name = dup_str(name);
    o->unit = dup_str(unit ? unit : "");
    o->scale = dup_str(scale ? scale : "");
    o->min = json_number_value(mn);
    o->max = json_number_value(mx);
    o->has_default = df != NULL;
    o->def = df ? json_number_value(df) : 0;
    it->n_params++;
    if (!o->name || !o->unit || !o->scale) return OOM(path, domain);
  }
  return 0;
}

/* A scalar item (3.21.0): `x-kind` "scalar", its `x-value` a number or true or false, its `x-unit` a string. */
static int read_scalar(item_t *it, json_t *s, const char *path, const char *domain, omx_domain_error *err) {
  json_t *v = json_object_get(s, "x-value");
  const char *unit = str_of(s, "x-unit");
  if (!json_is_number(v) && !json_is_boolean(v))
    return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The domain %s at %s: the scalar %s has no number, true or false \"x-value\".", domain, path, it->name);
  if (!unit) return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The domain %s at %s: the scalar %s has no string \"x-unit\".", domain, path, it->name);
  it->is_scalar = 1;
  it->scalar_is_bool = json_is_boolean(v);
  it->scalar_value = json_is_boolean(v) ? (json_is_true(v) ? 1 : 0) : json_number_value(v);
  it->scalar_unit = dup_str(unit);
  return it->scalar_unit ? 0 : OOM(path, domain);
}

static int read_items(omx_domain *d, json_t *root, const char *path, const char *domain, omx_domain_error *err) {
  json_t *schemas = json_object_get(json_object_get(root, "components"), "schemas");
  if (!json_is_object(schemas)) return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The domain %s at %s has no \"components\".\"schemas\" object.", domain, path);
  d->items = calloc(json_object_size(schemas) ? json_object_size(schemas) : 1, sizeof *d->items);
  if (!d->items) return OOM(path, domain);
  const char *name;
  json_t *s;
  json_object_foreach(schemas, name, s) {
    json_t *one_of = json_object_get(s, "oneOf"), *props = json_object_get(s, "properties");
    if (!json_is_object(s)) return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The domain %s at %s: the schema %s is not an object.", domain, path, name);
    if (has_ref(s)) return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The domain %s at %s: the schema %s has a \"$ref\", which the loader does not read.", domain, path, name);
    if (json_is_array(one_of) && json_is_object(props)) return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The domain %s at %s: the schema %s has both \"oneOf\" and \"properties\": it is a words item or a range item, not both.", domain, path, name);
    const char *kind = str_of(s, "x-kind");
    int scalar = !json_is_array(one_of) && !json_is_object(props) && kind && strcmp(kind, "scalar") == 0;
    if (!json_is_array(one_of) && !json_is_object(props) && !scalar) continue; /* a schema that is no words, range or scalar item (a sheet) is not served */
    item_t *it = &d->items[d->n_items++];
    it->name = dup_str(name);
    if (!it->name) return OOM(path, domain);
    int rc = scalar ? read_scalar(it, s, path, domain, err) : json_is_array(one_of) ? read_words(it, one_of, path, domain, err) : read_params(it, props, path, domain, err);
    if (rc) return rc;
  }
  return 0;
}

/* A language tag: letters (2 to 8) then `-`-separated alphanumeric subtags (1 to 8 each): `es`, `pt-BR`, never `..` or `x.y`. */
static int is_lang_tag(const char *s, size_t n) {
  size_t i = 0, part = 0, parts = 0;
  for (; i <= n; i++) {
    char c = i < n ? s[i] : '-';
    if (c == '-') {
      if (part < (parts == 0 ? 2u : 1u) || part > 8) return 0;
      parts++;
      part = 0;
    } else if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (parts > 0 && c >= '0' && c <= '9')) part++;
    else return 0;
  }
  return 1;
}

/* One catalog file: its language is the file's name, and its "lang" must say the same. */
static int read_catalog(omx_domain *d, const char *file, const char *lang, const char *domain, omx_domain_error *err) {
  json_t *root = NULL;
  int rc = load_json(file, domain, 1, &root, err);
  if (rc) return rc;
  json_t *msgs = json_object_get(root, "messages");
  if (!json_is_object(msgs)) { json_decref(root); return refuse(err, OMX_CONTRACT_CODE_CATALOG_INVALID, "The catalog %s of the domain %s has no \"messages\" object.", file, domain); }
  const char *named = str_of(root, "lang");
  if (!named || strcmp(named, lang) != 0) {
    int bad = refuse(err, OMX_CONTRACT_CODE_CATALOG_INVALID, "The catalog %s of the domain %s has \"lang\" %s%s%s, and its file name says \"%s\".", file, domain, named ? "\"" : "", named ? named : "(absent)", named ? "\"" : "", lang);
    json_decref(root);
    return bad;
  }
  catalog_t *c = &d->catalogs[d->n_catalogs++];
  c->lang = dup_str(lang);
  c->messages = calloc(json_object_size(msgs) ? json_object_size(msgs) : 1, sizeof *c->messages);
  if (!c->lang || !c->messages) { json_decref(root); return OOM(file, domain); }
  const char *key;
  json_t *m;
  json_object_foreach(msgs, key, m) {
    const char *text = str_of(m, "text");
    if (!text) {
      /* the message is built before the JSON is released: key belongs to root */
      int bad = refuse(err, OMX_CONTRACT_CODE_CATALOG_INVALID, "The catalog %s of the domain %s: the entry \"%s\" has no string \"text\".", file, domain, key);
      json_decref(root);
      return bad;
    }
    message_t *o = &c->messages[c->n++];
    o->key = dup_str(key);
    o->text = dup_str(text);
    if (!o->key || !o->text) { json_decref(root); return OOM(file, domain); }
  }
  json_decref(root);
  return 0;
}

static int read_catalogs(omx_domain *d, const char *dir, const char *domain, omx_domain_error *err) {
  char path[4096];
  if (!fits(snprintf(path, sizeof path, "%s/%s/catalogs", dir, domain), sizeof path)) return path_too_long(err, domain);
  DIR *dh = opendir(path);
  if (!dh) return 0; /* no catalogs: the source sentences are the only language */
  size_t count = 0;
  struct dirent *e;
  while ((e = readdir(dh))) {
    size_t n = strlen(e->d_name);
    if (n > 5 && strcmp(e->d_name + n - 5, ".json") == 0) count++;
  }
  rewinddir(dh);
  d->catalogs = calloc(count ? count : 1, sizeof *d->catalogs);
  if (!d->catalogs) { closedir(dh); return OOM(path, domain); }
  int rc = 0;
  while (!rc && (e = readdir(dh))) {
    size_t n = strlen(e->d_name);
    if (n <= 5 || strcmp(e->d_name + n - 5, ".json") != 0) continue;
    /* the array holds what the first pass counted: a directory that gained a catalog since is refused, never written past */
    if (d->n_catalogs >= count) { rc = refuse(err, OMX_CONTRACT_CODE_CATALOG_INVALID, "The catalogs of the domain %s at %s changed while they were read.", domain, path); break; }
    char file[4352], lang[64];
    if (n - 5 >= sizeof lang) { rc = refuse(err, OMX_CONTRACT_CODE_CATALOG_INVALID, "The catalog %s/%s of the domain %s has no language name.", path, e->d_name, domain); break; }
    memcpy(lang, e->d_name, n - 5);
    lang[n - 5] = '\0';
    if (!is_lang_tag(lang, n - 5)) { rc = refuse(err, OMX_CONTRACT_CODE_CATALOG_INVALID, "The catalog %s/%s of the domain %s is not named by a language tag (es, pt-BR).", path, e->d_name, domain); break; }
    if (!fits(snprintf(file, sizeof file, "%s/%s", path, e->d_name), sizeof file)) { rc = path_too_long(err, domain); break; }
    rc = read_catalog(d, file, lang, domain, err);
  }
  closedir(dh);
  return rc;
}

/* A package or domain name info.x-requires may name: [a-z][a-z0-9-]* segments joined by '/'. */
static int required_name(const char *k) {
  for (;;) {
    if (*k < 'a' || *k > 'z') return 0;
    for (k++; (*k >= 'a' && *k <= 'z') || (*k >= '0' && *k <= '9') || *k == '-'; k++) {}
    if (*k == '\0') return 1;
    if (*k != '/') return 0;
    k++;
  }
}

/* info.x-requires (docs/contract-dir.md, "Domains"), when present: a map of package or domain name to a floor
 * ">= x.y.z", as the TypeScript reader reads it. The floors are the build's to hold: a loader opens one domain. */
static int check_requires(json_t *req, const char *domain, const char *path, omx_domain_error *err) {
  if (!req) return 0;
  if (!json_is_object(req)) return refuse(err, OMX_CONTRACT_CODE_MANIFEST_INVALID, "The domain %s at %s: info.x-requires is not a map of package to floor \">= x.y.z\".", domain, path);
  const char *k;
  json_t *v;
  unsigned long floor_[3];
  json_object_foreach(req, k, v) {
    if (!required_name(k)) return refuse(err, OMX_CONTRACT_CODE_MANIFEST_INVALID, "The domain %s at %s: info.x-requires names \"%s\", which is no package or domain name.", domain, path, k);
    const char *f = json_string_value(v);
    if (!f || strncmp(f, ">= ", 3) != 0 || !parse_version(f + 3, floor_)) return refuse(err, OMX_CONTRACT_CODE_MANIFEST_INVALID, "The domain %s at %s: info.x-requires of \"%s\" is not a floor \">= x.y.z\".", domain, path, k);
  }
  return 0;
}

int omx_domain_open_at(const char *dir, const char *domain, const char *needs_version, omx_domain **out, omx_domain_error *err) {
  if (out) *out = NULL;
  if (!out) return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "omx_domain_open was given no place to put the handle.");
  if (!is_name(domain)) return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "\"%s\" is no domain name: slash-separated segments of letters, digits, - and _, none empty, \".\" or \"..\".", domain ? domain : "(null)");
  if (strlen(domain) > OMX_DOMAIN_NAME_MAX) return refuse(err, OMX_CONTRACT_CODE_MANIFEST_INVALID, "The domain name is %zu bytes, longer than OMX_DOMAIN_NAME_MAX (%d).", strlen(domain), OMX_DOMAIN_NAME_MAX);
  if (!dir) return refuse(err, OMX_CONTRACT_CODE_DIR_ABSENT, "The domain %s was asked of no contract directory.", domain);
  unsigned long floor_[3] = {0, 0, 0};
  if (needs_version && !parse_version(needs_version, floor_))
    return refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The version floor \"%s\" asked of the domain %s is not x.y.z.", needs_version, domain);

  char path[4096];
  if (!fits(snprintf(path, sizeof path, "%s/%s/%s.json", dir, domain, last_segment(domain)), sizeof path)) return path_too_long(err, domain);
  json_t *root = NULL;
  int rc = load_json(path, domain, 0, &root, err);
  if (rc) return rc;

  omx_domain *d = calloc(1, sizeof *d);
  if (!d) { json_decref(root); return OOM(path, domain); }
  unsigned long have[3];
  const char *id = str_of(root, "$id");
  json_t *info = json_object_get(root, "info");
  const char *version = str_of(info, "version");
  const char *stability = str_of(info, "x-stability");
  char want_id[512];
  int id_fits = fits(snprintf(want_id, sizeof want_id, DOMAIN_ID_PREFIX "%s", domain), sizeof want_id); /* always, for a name within OMX_DOMAIN_NAME_MAX */
  if (!id_fits) rc = refuse(err, OMX_CONTRACT_CODE_MANIFEST_INVALID, "The domain %s: the $id it must carry does not fit.", domain);
  else if (!json_is_object(root)) rc = refuse(err, OMX_CONTRACT_CODE_FILE_INVALID, "The domain %s at %s is not a JSON object.", domain, path);
  else if (!id || strcmp(id, want_id) != 0) rc = refuse(err, OMX_CONTRACT_CODE_MANIFEST_INVALID, "The domain %s at %s: $id is \"%s\", and must be \"%s\".", domain, path, id ? id : "(absent)", want_id);
  else if (!version || !parse_version(version, have)) rc = refuse(err, OMX_CONTRACT_CODE_MANIFEST_INVALID, "The domain %s at %s has no info.version of the form x.y.z.", domain, path);
  else if (!str_of(info, "x-owner") || !*str_of(info, "x-owner")) rc = refuse(err, OMX_CONTRACT_CODE_MANIFEST_INVALID, "The domain %s at %s has no info.x-owner.", domain, path);
  else if (!stability || (strcmp(stability, "experimental") != 0 && strcmp(stability, "stable") != 0)) rc = refuse(err, OMX_CONTRACT_CODE_MANIFEST_INVALID, "The domain %s at %s: info.x-stability is %s%s%s, and must be \"experimental\" or \"stable\".", domain, path, stability ? "\"" : "", stability ? stability : "(absent)", stability ? "\"" : "");
  else if ((rc = check_requires(json_object_get(info, "x-requires"), domain, path, err)) != 0) { /* refused, err filled */ }
  else if (needs_version && version_below(have, floor_)) rc = refuse(err, OMX_CONTRACT_CODE_PACKAGE_TOO_OLD, "The domain %s at %s is version %s, below the floor %s the program needs.", domain, path, version, needs_version);
  else rc = read_items(d, root, path, domain, err);
  json_decref(root); /* the JSON is released here: the handle holds its own copy of all it returns */
  if (!rc) rc = read_catalogs(d, dir, domain, err);
  if (rc) { omx_domain_close(d); return rc; }
  *out = d;
  return 0;
}

int omx_domain_open(const char *domain, const char *needs_version, omx_domain **out, omx_domain_error *err) {
  return omx_domain_open_at(OMX_CONTRACTDIR, domain, needs_version, out, err);
}

omx_domain *omx_domain_open_or_exit(const char *domain, const char *needs_version) {
  omx_domain *d = NULL;
  omx_domain_error err;
  if (omx_domain_open(domain, needs_version, &d, &err) != 0) {
    fprintf(stderr, "%s: %s\n", err.code, err.message);
    exit(78); /* EX_CONFIG: the exit of every refused start-up */
  }
  return d;
}

static const item_t *find_item(const omx_domain *d, const char *name) {
  if (!d || !name) return NULL;
  for (size_t i = 0; i < d->n_items; i++) {
    if (strcmp(d->items[i].name, name) == 0) return &d->items[i];
  }
  return NULL;
}

static void fill_word(const word_t *w, omx_domain_word_info *out) {
  out->word = w->word;
  out->title = w->title;
  out->description = w->description;
  out->code = w->code;
}

int omx_domain_word(const omx_domain *d, const char *item, const char *word, omx_domain_word_info *out) {
  const item_t *it = find_item(d, item);
  if (!it) return OMX_CONTRACT_CODE_ITEM_UNKNOWN;
  if (!word) return OMX_CONTRACT_CODE_WORD_UNKNOWN;
  for (size_t i = 0; i < it->n_words; i++) {
    if (strcmp(it->words[i].word, word) == 0) { if (out) fill_word(&it->words[i], out); return 0; }
  }
  return OMX_CONTRACT_CODE_WORD_UNKNOWN;
}

const char *omx_domain_word_group(const omx_domain *d, const char *item, const char *word) {
  const item_t *it = find_item(d, item);
  if (!it || !word) return NULL;
  for (size_t i = 0; i < it->n_words; i++) {
    if (strcmp(it->words[i].word, word) == 0) return it->words[i].group;
  }
  return NULL;
}

int omx_domain_word_count(const omx_domain *d, const char *item) {
  const item_t *it = find_item(d, item);
  return it ? (int)it->n_words : -1; /* an item with no words has none */
}

int omx_domain_word_at(const omx_domain *d, const char *item, int index, omx_domain_word_info *out) {
  const item_t *it = find_item(d, item);
  if (!it) return OMX_CONTRACT_CODE_ITEM_UNKNOWN;
  if (index < 0 || (size_t)index >= it->n_words) return OMX_CONTRACT_CODE_INDEX_RANGE;
  if (out) fill_word(&it->words[index], out);
  return 0;
}

int omx_domain_range(const omx_domain *d, const char *item, const char *name, omx_domain_range_info *out) {
  const item_t *it = find_item(d, item);
  if (!it) return OMX_CONTRACT_CODE_ITEM_UNKNOWN;
  if (!name) return OMX_CONTRACT_CODE_WORD_UNKNOWN;
  for (size_t i = 0; i < it->n_params; i++) {
    const param_t *p = &it->params[i];
    if (strcmp(p->name, name) != 0) continue;
    if (out) {
      out->min = p->min;
      out->max = p->max;
      out->def = p->def;
      out->has_default = p->has_default;
      out->unit = p->unit;
      out->scale = p->scale;
    }
    return 0;
  }
  return OMX_CONTRACT_CODE_WORD_UNKNOWN;
}

int omx_domain_scalar(const omx_domain *d, const char *item, omx_domain_scalar_info *out) {
  const item_t *it = find_item(d, item);
  if (!it) return OMX_CONTRACT_CODE_ITEM_UNKNOWN;
  if (!it->is_scalar) return OMX_CONTRACT_CODE_WORD_UNKNOWN;
  if (out) {
    out->value = it->scalar_value;
    out->is_bool = it->scalar_is_bool;
    out->unit = it->scalar_unit;
  }
  return 0;
}

const char *omx_domain_text(const omx_domain *d, const char *key, const char *lang) {
  if (!d || !key) return NULL;
  const char *dot = strchr(key, '.');
  if (!dot) return NULL;
  char item[256];
  size_t n = (size_t)(dot - key);
  if (n >= sizeof item) return NULL;
  memcpy(item, key, n);
  item[n] = '\0';
  const item_t *it = find_item(d, item);
  const word_t *w = NULL;
  if (it && it->is_words) {
    for (size_t i = 0; i < it->n_words; i++) {
      if (strcmp(it->words[i].word, dot + 1) == 0) { w = &it->words[i]; break; }
    }
  }
  if (!w) return NULL;
  if (lang && strcmp(lang, "en") != 0) {
    for (size_t c = 0; c < d->n_catalogs; c++) {
      if (strcmp(d->catalogs[c].lang, lang) != 0) continue;
      for (size_t m = 0; m < d->catalogs[c].n; m++) {
        if (strcmp(d->catalogs[c].messages[m].key, key) == 0) return d->catalogs[c].messages[m].text;
      }
    }
  }
  return w->text;
}
