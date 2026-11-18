/* SPDX-License-Identifier: GPL-3.0-or-later */
/*
 * This file is part of omx-contract.
 *
 * omx-contract is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * omx-contract is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with omx-contract.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
 */

#ifndef OMX_DOMAIN_H
#define OMX_DOMAIN_H

/** @file
 * @brief The C loader of a contract domain: data is read at run time by functions (docs/runtime-data.md).
 *
 * A domain is the installed document `<contractdir>/<domain>/<domain>.json` and its `catalogs/<lang>.json`
 * (docs/contract-dir.md, "Domains"). omx_domain_open() reads and checks one, copies everything the lookups return into
 * storage of the handle's own, and releases the JSON library's document before it returns; the lookups then read
 * that storage and nothing else. The JSON is read with the distribution's jansson, the one parser; this header
 * includes none of it.
 *
 * START-UP ONLY. Opening allocates and parses; a lookup searches by string. Nothing here is called from an audio
 * thread, and a value an audio thread needs is copied into a plain struct of the program's before that thread starts.
 *
 * A word item is a `components.schemas` entry of `oneOf` words (`const`, `title`, `description`, `x-code`,
 * `x-text`); a range item is one whose `properties` are named parameters (`minimum`, `maximum`, `default`,
 * `x-unit`, `x-scale`). A translation is the catalog entry keyed `<ITEM>.<word>`.
 *
 * Every function returns 0 or a status; omx_domain_code() turns a status into its code of CONTRACT_CODES
 * (data/codes.json), the string a refusal prints. A refused call returns no default value: its outputs are left as
 * they were.
 */

#ifdef __cplusplus
extern "C" {
#endif

/** An opened, validated domain. Opaque; owns every string a lookup returns until omx_domain_close(). */
typedef struct omx_domain omx_domain;

/**
 * The status a function returns: 0 on success, else one of these, each the value of a code of CONTRACT_CODES.
 * omx_domain_code() gives the code string of each.
 */
typedef enum {
  OMX_DOMAIN_OK = 0,                     /**< success */
  OMX_DOMAIN_DIR_ABSENT = 1,             /**< `contract.dir.absent`: no such directory, or no such domain in it */
  OMX_DOMAIN_FILE_NOT_JSON = 2,          /**< `contract.file.not-json`: a file of the domain does not parse */
  OMX_DOMAIN_FILE_INVALID = 3,           /**< `contract.file.invalid`: a file breaks the shape the loader reads, or an argument is no name or version */
  OMX_DOMAIN_MANIFEST_INVALID = 4,       /**< `contract.manifest.invalid`: `$id` or `info` disagrees with the domain's place */
  OMX_DOMAIN_PACKAGE_TOO_OLD = 5,        /**< `contract.package.too-old`: the document's `info.version` is below the floor */
  OMX_DOMAIN_ITEM_UNKNOWN = 6,           /**< `contract.item.unknown`: no such item in the domain */
  OMX_DOMAIN_WORD_UNKNOWN = 7,           /**< `contract.word.unknown`: no such word or name in the item */
  OMX_DOMAIN_INDEX_RANGE = 8             /**< `contract.index.range`: an index past the item's count */
} omx_domain_status;

/** The last status of omx_domain_status: every value from 1 to this one has a code string. */
#define OMX_DOMAIN_STATUS_LAST OMX_DOMAIN_INDEX_RANGE

/** A refused open: the code, and a message that names the domain, the place looked and the reason. */
typedef struct {
  const char *code;      /**< a code of CONTRACT_CODES, e.g. `contract.dir.absent`; a static string */
  char message[256];     /**< what was found, in English, for the program's own stderr */
} omx_domain_error;

/** A word of a word item. The strings belong to the handle (see omx_domain_open()). */
typedef struct {
  const char *word;         /**< the word as written (`const`), any string */
  const char *title;        /**< its key, the name of the word's macro */
  const char *description;  /**< its one-line description */
  int code;                 /**< its code (`x-code`) */
} omx_domain_word_info;

/** The range of a named parameter of a range item. The strings belong to the handle. */
typedef struct {
  double min;               /**< `minimum` */
  double max;               /**< `maximum` */
  double def;               /**< `default`; 0 when has_default is 0 */
  int has_default;          /**< 1 when the parameter declares a default */
  const char *unit;         /**< `x-unit`; the empty string when none */
  const char *scale;        /**< `x-scale`; the empty string when none */
} omx_domain_range_info;

/**
 * Open a domain from the installed contract directory, the one this library was built for, and check it.
 *
 * Reads `<contractdir>/<domain>/<domain>.json` and the catalogs beside it, checks that the document has the shape the
 * lookups read, that its `$id` and `info` name this domain, and that `info.version` is at least @p needs_version.
 * Reads no environment variable: a stray one in a service's environment cannot change which vocabulary it runs on.
 * A missing or invalid domain is refused, never replaced by a default; a program turns the refusal into its exit
 * (status 78, omx_domain_open_or_exit()).
 *
 * Everything a lookup returns is copied into the handle's own immutable storage, and the JSON document is released,
 * before this function returns.
 *
 * @param domain        the domain's name: letters, digits, `-` and `_`, never a path
 * @param needs_version the floor `"x.y.z"` the consumer needs, or NULL for none
 * @param out           receives the handle on success; set to NULL on failure
 * @param err           receives the code and the message on failure; may be NULL
 * @return 0, or the status of the refusal; omx_domain_code() names its code
 */
int omx_domain_open(const char *domain, const char *needs_version, omx_domain **out, omx_domain_error *err);

/**
 * Open a domain from `<dir>/<domain>/`: omx_domain_open() for a test and the omx-domain command, which pass
 * `OMX_CONTRACT_PATH` here. TEST AND DEVELOPMENT ONLY: a production program does not call it.
 *
 * @param dir           the directory holding `<domain>/<domain>.json`
 * @param domain        the domain's name
 * @param needs_version the floor `"x.y.z"`, or NULL for none
 * @param out           receives the handle on success; set to NULL on failure
 * @param err           receives the code and the message on failure; may be NULL
 * @return 0, or the status of the refusal
 */
int omx_domain_open_at(const char *dir, const char *domain, const char *needs_version, omx_domain **out, omx_domain_error *err);

/**
 * Open a domain or exit: the start-up of a daemon. On a refusal prints the code and the message to stderr and
 * exits with status 78 (EX_CONFIG), the exit of every refused start-up of the project.
 *
 * @param domain        the domain's name
 * @param needs_version the floor `"x.y.z"`, or NULL for none
 * @return the handle; never NULL
 */
omx_domain *omx_domain_open_or_exit(const char *domain, const char *needs_version);

/**
 * Close a handle and free its storage. Every pointer a lookup returned from it is invalid afterwards. NULL is a no-op.
 *
 * @param d the handle, or NULL
 */
void omx_domain_close(omx_domain *d);

/**
 * The code string of a status: the code of CONTRACT_CODES it is the value of.
 *
 * @param status a value of omx_domain_status
 * @return the code string, static; NULL for 0 and for a value that is no status
 */
const char *omx_domain_code(int status);

/**
 * A word of a word item, by the word as written.
 *
 * @param d    the handle
 * @param item the item's name, e.g. `PANEL_FAMILIES`
 * @param word the word as written
 * @param out  receives the word on success; untouched on failure
 * @return 0; OMX_DOMAIN_ITEM_UNKNOWN when the domain has no such item; OMX_DOMAIN_WORD_UNKNOWN when it has no such word (a range item has none)
 */
int omx_domain_word(const omx_domain *d, const char *item, const char *word, omx_domain_word_info *out);

/**
 * How many words a word item declares.
 *
 * @param d    the handle
 * @param item the item's name
 * @return the count, in declared order (0 for a range item); -1 when the domain has no such item
 */
int omx_domain_word_count(const omx_domain *d, const char *item);

/**
 * The word of a word item at an index, in declared order.
 *
 * @param d     the handle
 * @param item  the item's name
 * @param index 0 to the count minus 1
 * @param out   receives the word on success; untouched on failure
 * @return 0; OMX_DOMAIN_ITEM_UNKNOWN; OMX_DOMAIN_INDEX_RANGE for an index below 0 or at the count and above
 */
int omx_domain_word_at(const omx_domain *d, const char *item, int index, omx_domain_word_info *out);

/**
 * The range, unit and default of a named parameter of a range item.
 *
 * @param d    the handle
 * @param item the item's name, e.g. `DEMO_PARAMS`
 * @param name the parameter's name
 * @param out  receives the range on success; untouched on failure
 * @return 0; OMX_DOMAIN_ITEM_UNKNOWN; OMX_DOMAIN_WORD_UNKNOWN when the item has no such parameter (a word item has none)
 */
int omx_domain_range(const omx_domain *d, const char *item, const char *name, omx_domain_range_info *out);

/**
 * The sentence a person sees for a word, in a language, else the English source sentence.
 *
 * @param d    the handle
 * @param key  `<ITEM>.<word>`, the word as written
 * @param lang a language code such as `ca`, or NULL for English
 * @return the sentence, owned by the handle; NULL when the key is no word of the domain or the word has no sentence
 */
const char *omx_domain_text(const omx_domain *d, const char *key, const char *lang);

#ifdef __cplusplus
}
#endif

#endif /* OMX_DOMAIN_H */
