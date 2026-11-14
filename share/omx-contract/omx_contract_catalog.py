# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
"""An owner's catalogs, read by a Python surface such as Zynthian (omx-contract#2, docs/data-layout.md "Catalogs").
The contract holds the source sentence, in English, with its args; a translation is never contract data. An owner
ships catalogs/<lang>.json, installed to /usr/share/<owner>/catalogs/<lang>.json by its rpm and its deb alike:

    { "kind": "catalog", "lang": "ca", "owner": "<package>", "messages": { "<key>": "<sentence with {args}>" } }

An entry is the sentence, or the sentence with how it was made (omx-contract#21): {"text", "by": "human"} is a
person's, {"text", "by": "same", "source"} is the same word as the English source sentence (kept), and {"text", "by": "machine", "model", "source"} was made by a model from the source sentence whose
source_hash is "source". A model's entry whose source sentence no longer hashes to it is stale: sentence_of skips it
and shows the source sentence.

A key is a code of the owner (reply.plugin-hostd.no-param-contract), or a word of the owner as <ITEM>.<word>
(PLUGIN_DB_REASONS.no-cell). This reader does the one lookup a surface makes: load_catalog, sentence_of and fill, the
catalog's sentence for a key, else the source sentence, its placeholders filled. It carries no JSON Schema validator
of its own (lib/catalog.mjs does, for a build that checks its catalogs); a surface only ever reads an installed one.
"""
import hashlib
import json
import os
import re

CATALOG_SHARE_DIR = "/usr/share"


def catalog_dir_of(owner, root=CATALOG_SHARE_DIR):
    """Where an installed owner's catalogs live: /usr/share/<owner>/catalogs."""
    return os.path.join(root, owner, "catalogs")


def catalog_path_of(owner, lang, root=CATALOG_SHARE_DIR):
    return os.path.join(catalog_dir_of(owner, root), "%s.json" % lang)


def code_key(code):
    """The key of a code: the code itself."""
    return code


def word_key(item, word):
    """The key of a word: <ITEM>.<word>, since one word may belong to two items."""
    return "%s.%s" % (item, word)


def load_catalog(owner, lang, root=CATALOG_SHARE_DIR):
    """The catalog of `owner` in `lang`, or None when none is installed or it does not read: a surface then shows
    the source sentence. `root` defaults to the share dir; a test or a build names its own."""
    try:
        with open(catalog_path_of(owner, lang, root), "r", encoding="utf-8") as f:
            catalog = json.load(f)
    except (OSError, ValueError):
        return None
    if not isinstance(catalog, dict):
        return None
    if catalog.get("kind") != "catalog" or catalog.get("owner") != owner or catalog.get("lang") != lang:
        return None
    if not isinstance(catalog.get("messages"), dict):
        return None
    return catalog


def source_hash(sentence):
    """The sha256 of a source sentence, the lowercase hex of its UTF-8 bytes: what a model's entry records as source."""
    return hashlib.sha256(sentence.encode("utf-8")).hexdigest()


def sentence_of(catalog, key, source):
    """The sentence a surface shows for `key`: the catalog's, else `source` (the code's or word's text.en). An entry
    made from another source sentence than `source` is stale and skipped; with no `source` to compare, it is read."""
    messages = catalog.get("messages") if catalog else None
    entry = messages.get(key) if messages else None
    if isinstance(entry, str):
        return entry
    if not isinstance(entry, dict) or not isinstance(entry.get("text"), str):
        return source
    recorded = entry.get("source")
    if source is not None and recorded is not None and recorded != source_hash(source):
        return source
    return entry["text"]


_PLACEHOLDER = re.compile(r"\{([^{}]*)\}")


def fill(sentence, args=None):
    """`sentence` with each `{name}` replaced by `args[name]`; a placeholder with no value is left as written."""
    args = args or {}

    def sub(m):
        name = m.group(1)
        return str(args[name]) if name in args else m.group(0)

    return _PLACEHOLDER.sub(sub, str(sentence))
