// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
#ifndef OMX_CONTRACT_CODES_H
#define OMX_CONTRACT_CODES_H
/*
 * GENERATED: DO NOT EDIT BY HAND.
 * Produced by `omx-contract render --target c` from CONTRACT_CODES (contract.d/contract/contract.json, docs/contract-dir.md): the
 * refusal codes, each as the integer a function returns and the string it prints.
 */

/** @file
 * @brief The refusal codes of the contract directory (CONTRACT_CODES) as integers: a function returns the value, a
 * message prints the string. A value is the code's place in the table, from 1, and is never reused or moved. */

#ifdef __cplusplus
extern "C" {
#endif

/** The value of each CONTRACT_CODES code; 0 is success and no code. */
enum omx_contract_code {
  OMX_CONTRACT_CODE_DIR_ABSENT = 1, ///< `contract.dir.absent`: no contract directory was found, or the one named does not exist
  OMX_CONTRACT_CODE_MANIFEST_ABSENT = 2, ///< `contract.manifest.absent`: a package directory holds no MANIFEST.json
  OMX_CONTRACT_CODE_MANIFEST_INVALID = 3, ///< `contract.manifest.invalid`: a manifest is not JSON, lacks a field, or names another package or schema major than its place
  OMX_CONTRACT_CODE_MANIFEST_MISMATCH = 4, ///< `contract.manifest.mismatch`: a listed file is missing, a file is present but not listed, or its hash differs
  OMX_CONTRACT_CODE_SCHEMA_MAJOR = 5, ///< `contract.schema.major`: a file's $schema is not the installed form of the reader's schema major
  OMX_CONTRACT_CODE_SCHEMA_TOO_OLD = 6, ///< `contract.schema.too-old`: a file's requires.omx-contract-schema floor is above the reader's schema
  OMX_CONTRACT_CODE_SCHEMA_FLOOR_ABSENT = 7, ///< `contract.schema.floor-absent`: an installed file of a package other than omx-contract states no schema floor
  OMX_CONTRACT_CODE_FILE_NOT_JSON = 8, ///< `contract.file.not-json`: a file does not parse
  OMX_CONTRACT_CODE_FILE_INVALID = 9, ///< `contract.file.invalid`: a file breaks the schema or the kernel-file shape, an unknown key or word included
  OMX_CONTRACT_CODE_ITEM_DUPLICATE = 10, ///< `contract.item.duplicate`: two files declare one name
  OMX_CONTRACT_CODE_KERNEL_DUPLICATE = 11, ///< `contract.kernel.duplicate`: two packages each declare a file of one kernel
  OMX_CONTRACT_CODE_REF_UNRESOLVED = 12, ///< `contract.ref.unresolved`: a reference names no item
  OMX_CONTRACT_CODE_REF_UNDECLARED = 13, ///< `contract.ref.undeclared`: a reference names an item of a package the file does not require
  OMX_CONTRACT_CODE_VERB_DUPLICATE = 14, ///< `contract.verb.duplicate`: two verbs items, of one package or two, declare one verb: a verb has one owner
  OMX_CONTRACT_CODE_VERB_FORMAT = 15, ///< `contract.verb.format`: a verb's format does not start with the verb it declares
  OMX_CONTRACT_CODE_VERB_HOST_UNKNOWN = 16, ///< `contract.verb.host-unknown`: a verb's implementedBy names a host that is no word of HOSTING_VERB_HOSTS
  OMX_CONTRACT_CODE_VERB_CODE_UNKNOWN = 17, ///< `contract.verb.code-unknown`: a verb's code names an item that is no codes item, or a name that item does not carry
  OMX_CONTRACT_CODE_ROLE_DUPLICATE = 18, ///< `contract.role.duplicate`: two roleMeanings items, of one package or two, declare one role: a role has one owner
  OMX_CONTRACT_CODE_PACKAGE_ABSENT = 19, ///< `contract.package.absent`: a package the consumer or a file requires is not installed
  OMX_CONTRACT_CODE_PACKAGE_TOO_OLD = 20, ///< `contract.package.too-old`: a required package is installed below its floor
  OMX_CONTRACT_CODE_REQUIRES_UNRESOLVED = 21, ///< `contract.requires.unresolved`: translate --owner reads a tree whose files require a package that neither OMX_CONTRACT_PATH nor the installed directory holds (or holds below the floor)
  OMX_CONTRACT_CODE_OWNER_CODES_UNLOCATED = 22, ///< `contract.owner.codes-unlocated`: translate --owner reads a tree whose catalogs hold keys and whose declared code locations hold no code or word
  OMX_CONTRACT_CODE_ORIGIN_MISPLACED = 23, ///< `contract.origin.misplaced`: a scanned plugin descriptor is installed in the contract directory: a scan is never read as a declaration
  OMX_CONTRACT_CODE_DESCRIPTOR_ORIGIN_SOURCE = 24, ///< `contract.descriptor.origin-source`: an authored descriptor with no impl link, or a built or scanned one with a control that has no from link
  OMX_CONTRACT_CODE_DESCRIPTOR_UNKNOWN_AUTHORED = 25, ///< `contract.descriptor.unknown-authored`: an authored descriptor with a unit, a scale or a meaning of unknown
  OMX_CONTRACT_CODE_DESCRIPTOR_CONTROL_DUPLICATE = 26, ///< `contract.descriptor.control-duplicate`: two controls of a descriptor with one id, one name or one symbol
  OMX_CONTRACT_CODE_DESCRIPTOR_EASY = 27, ///< `contract.descriptor.easy`: an easy list that names no control, names one twice or a hidden or read-only one, or stands in a scanned descriptor
  OMX_CONTRACT_CODE_DESCRIPTOR_INTEGRITY = 28, ///< `contract.descriptor.integrity`: an integrity block whose version is not the plugin's own, or on a plugin that states no version
  OMX_CONTRACT_CODE_DESCRIPTOR_METER = 29, ///< `contract.descriptor.meter`: a meter of a descriptor with the id or a symbol of another meter, a symbol a control answers to, a range whose min is not below its max, a scale that is no id of PARAM_SCALES, a unit the kind does not measure in (level: dBFS, dBTP, LUFS, LU; gain-reduction: dB), a measurement in a unit it is not measured in, or a clip word on a gain reduction or a true clip on a loudness
  OMX_CONTRACT_CODE_DESCRIPTOR_PORT_DUPLICATE = 30, ///< `contract.descriptor.port-duplicate`: two ports of a descriptor of one kind and direction with one id
  OMX_CONTRACT_CODE_DESCRIPTOR_RANGE = 31, ///< `contract.descriptor.range`: a travel whose min is above its max, whose step is negative, or whose default lies outside it
  OMX_CONTRACT_CODE_DESCRIPTOR_CHOICE = 32, ///< `contract.descriptor.choice`: a choice whose default is not one of its ids, or whose labels or values are not one per id
  OMX_CONTRACT_CODE_DESCRIPTOR_SCALE = 33, ///< `contract.descriptor.scale-undeclared`: a scale that is neither an id of PARAM_SCALES nor unknown
  OMX_CONTRACT_CODE_DESCRIPTOR_PORT_WORDS = 34, ///< `contract.descriptor.port-words`: a layout word on a port that is not audio, dialects off a note port or missing on one, or a layout its channels contradict
  OMX_CONTRACT_CODE_DESCRIPTOR_INSTRUMENT = 35, ///< `contract.descriptor.instrument`: an instrument block without the instrument feature or the reverse, or an instrument with no note or MIDI input or no audio output
  OMX_CONTRACT_CODE_DESCRIPTOR_WHEN = 36, ///< `contract.descriptor.when-unresolved`: a when that names no choice of the descriptor, or an id that choice does not have
  OMX_CONTRACT_CODE_DESCRIPTOR_FACE_DIFFERS = 37, ///< `contract.descriptor.face-differs`: a plugin's built face, scanned as a host scans it, states other than its authored descriptor; raised by the owner's face check, since the reader compares no faces
  OMX_CONTRACT_CODE_OVERRIDE_PLUGIN_MISMATCH = 38, ///< `contract.override.plugin-mismatch`: an override file whose plugin id or format is not the plugin it is applied to: the file is refused whole
  OMX_CONTRACT_CODE_OVERRIDE_CONTROL_ABSENT = 39, ///< `contract.override.control-absent`: an override entry that names a control the descriptor does not have: the entry is dropped
  OMX_CONTRACT_CODE_OVERRIDE_WIDENS = 40, ///< `contract.override.widens`: an override entry whose travel end lies outside the plugin's ends, or whose default lies outside the travel: the entry is dropped
  OMX_CONTRACT_CODE_OVERRIDE_KIND_MISMATCH = 41, ///< `contract.override.kind-mismatch`: an override entry with a word that does not fit the control's kind (a travel or a map on a choice) or its family (a band without family eq and an EQ meaning): the entry is dropped
  OMX_CONTRACT_CODE_OVERRIDE_SCALE_FLOOR = 42, ///< `contract.override.scale-floor`: an override entry with a log scale over a floor that is not positive: the entry is dropped
  OMX_CONTRACT_CODE_OVERRIDE_MAP_INVALID = 43, ///< `contract.override.map-invalid`: an override map that is not strictly monotonic, does not cover the plugin's ends or lies outside them: the entry is dropped
  OMX_CONTRACT_CODE_OVERRIDE_BASIS_EVIDENCE = 44, ///< `contract.override.basis-evidence`: an override entry with basis measured and no evidence, or evidence with another basis: the entry is dropped
  OMX_CONTRACT_CODE_OVERRIDE_FINGERPRINT_DIFFERS = 45, ///< `contract.override.fingerprint-differs`: an override file written against another control list than the descriptor's: a warning, the entries that still hold are applied
  OMX_CONTRACT_CODE_SOURCE_ABSENT = 46, ///< `contract.source.absent`: a link's path does not exist
  OMX_CONTRACT_CODE_SOURCE_SYMBOL_ABSENT = 47, ///< `contract.source.symbol-absent`: the path holds no definition of the link's symbol
  OMX_CONTRACT_CODE_SOURCE_AMBIGUOUS = 48, ///< `contract.source.ambiguous`: the path defines the link's symbol more than once
  OMX_CONTRACT_CODE_SOURCE_DIFFERS = 49, ///< `contract.source.differs`: the value at a from link is not the declared value
  OMX_CONTRACT_CODE_SOURCE_UNEVALUABLE = 50, ///< `contract.source.unevaluable`: a from link whose value the tool cannot read
  OMX_CONTRACT_CODE_SOURCE_UNREAD = 51, ///< `contract.source.unread`: an impl link whose definition does not name the item
  OMX_CONTRACT_CODE_SOURCE_NONE = 52, ///< `contract.source.none`: an item with no impl link, where every item must carry one
  OMX_CONTRACT_CODE_ITEM_UNKNOWN = 53, ///< `contract.item.unknown`: a domain function was asked for an item the domain does not declare
  OMX_CONTRACT_CODE_WORD_UNKNOWN = 54, ///< `contract.word.unknown`: a domain function was asked for a word, or a range name, the item does not declare
  OMX_CONTRACT_CODE_INDEX_RANGE = 55, ///< `contract.index.range`: a domain function was asked for a word at an index past the item's count
  OMX_CONTRACT_CODE_ITEM_PREFIX = 56, ///< `contract.item.prefix`: an item of a domain does not start with its domain's name, or starts with the name of a longer domain
  OMX_CONTRACT_CODE_CATALOG_INVALID = 57, ///< `contract.catalog.invalid`: a domain's catalog is not a regular file named by a language tag, or is not an object of {text, by} entries
  OMX_CONTRACT_CODE_DESCRIPTOR_LATENCY = 58, ///< `contract.descriptor.latency`: a latency sweep whose min is above its max, or a latency ref to an item that is no scalar in frames or ms
  OMX_CONTRACT_CODE_LAST = 58 ///< the last value: every value from 1 to this one is a code
};

/** The table as an X-macro: `X(NAME, value, "code string")` once per code, in value order. */
#define OMX_CONTRACT_CODES(X) \
  X(DIR_ABSENT, 1, "contract.dir.absent") \
  X(MANIFEST_ABSENT, 2, "contract.manifest.absent") \
  X(MANIFEST_INVALID, 3, "contract.manifest.invalid") \
  X(MANIFEST_MISMATCH, 4, "contract.manifest.mismatch") \
  X(SCHEMA_MAJOR, 5, "contract.schema.major") \
  X(SCHEMA_TOO_OLD, 6, "contract.schema.too-old") \
  X(SCHEMA_FLOOR_ABSENT, 7, "contract.schema.floor-absent") \
  X(FILE_NOT_JSON, 8, "contract.file.not-json") \
  X(FILE_INVALID, 9, "contract.file.invalid") \
  X(ITEM_DUPLICATE, 10, "contract.item.duplicate") \
  X(KERNEL_DUPLICATE, 11, "contract.kernel.duplicate") \
  X(REF_UNRESOLVED, 12, "contract.ref.unresolved") \
  X(REF_UNDECLARED, 13, "contract.ref.undeclared") \
  X(VERB_DUPLICATE, 14, "contract.verb.duplicate") \
  X(VERB_FORMAT, 15, "contract.verb.format") \
  X(VERB_HOST_UNKNOWN, 16, "contract.verb.host-unknown") \
  X(VERB_CODE_UNKNOWN, 17, "contract.verb.code-unknown") \
  X(ROLE_DUPLICATE, 18, "contract.role.duplicate") \
  X(PACKAGE_ABSENT, 19, "contract.package.absent") \
  X(PACKAGE_TOO_OLD, 20, "contract.package.too-old") \
  X(REQUIRES_UNRESOLVED, 21, "contract.requires.unresolved") \
  X(OWNER_CODES_UNLOCATED, 22, "contract.owner.codes-unlocated") \
  X(ORIGIN_MISPLACED, 23, "contract.origin.misplaced") \
  X(DESCRIPTOR_ORIGIN_SOURCE, 24, "contract.descriptor.origin-source") \
  X(DESCRIPTOR_UNKNOWN_AUTHORED, 25, "contract.descriptor.unknown-authored") \
  X(DESCRIPTOR_CONTROL_DUPLICATE, 26, "contract.descriptor.control-duplicate") \
  X(DESCRIPTOR_EASY, 27, "contract.descriptor.easy") \
  X(DESCRIPTOR_INTEGRITY, 28, "contract.descriptor.integrity") \
  X(DESCRIPTOR_METER, 29, "contract.descriptor.meter") \
  X(DESCRIPTOR_PORT_DUPLICATE, 30, "contract.descriptor.port-duplicate") \
  X(DESCRIPTOR_RANGE, 31, "contract.descriptor.range") \
  X(DESCRIPTOR_CHOICE, 32, "contract.descriptor.choice") \
  X(DESCRIPTOR_SCALE, 33, "contract.descriptor.scale-undeclared") \
  X(DESCRIPTOR_PORT_WORDS, 34, "contract.descriptor.port-words") \
  X(DESCRIPTOR_INSTRUMENT, 35, "contract.descriptor.instrument") \
  X(DESCRIPTOR_WHEN, 36, "contract.descriptor.when-unresolved") \
  X(DESCRIPTOR_FACE_DIFFERS, 37, "contract.descriptor.face-differs") \
  X(OVERRIDE_PLUGIN_MISMATCH, 38, "contract.override.plugin-mismatch") \
  X(OVERRIDE_CONTROL_ABSENT, 39, "contract.override.control-absent") \
  X(OVERRIDE_WIDENS, 40, "contract.override.widens") \
  X(OVERRIDE_KIND_MISMATCH, 41, "contract.override.kind-mismatch") \
  X(OVERRIDE_SCALE_FLOOR, 42, "contract.override.scale-floor") \
  X(OVERRIDE_MAP_INVALID, 43, "contract.override.map-invalid") \
  X(OVERRIDE_BASIS_EVIDENCE, 44, "contract.override.basis-evidence") \
  X(OVERRIDE_FINGERPRINT_DIFFERS, 45, "contract.override.fingerprint-differs") \
  X(SOURCE_ABSENT, 46, "contract.source.absent") \
  X(SOURCE_SYMBOL_ABSENT, 47, "contract.source.symbol-absent") \
  X(SOURCE_AMBIGUOUS, 48, "contract.source.ambiguous") \
  X(SOURCE_DIFFERS, 49, "contract.source.differs") \
  X(SOURCE_UNEVALUABLE, 50, "contract.source.unevaluable") \
  X(SOURCE_UNREAD, 51, "contract.source.unread") \
  X(SOURCE_NONE, 52, "contract.source.none") \
  X(ITEM_UNKNOWN, 53, "contract.item.unknown") \
  X(WORD_UNKNOWN, 54, "contract.word.unknown") \
  X(INDEX_RANGE, 55, "contract.index.range") \
  X(ITEM_PREFIX, 56, "contract.item.prefix") \
  X(CATALOG_INVALID, 57, "contract.catalog.invalid") \
  X(DESCRIPTOR_LATENCY, 58, "contract.descriptor.latency")

#ifdef __cplusplus
}
#endif

#endif /* OMX_CONTRACT_CODES_H */
