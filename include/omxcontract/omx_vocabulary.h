// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
#ifndef OMX_VOCABULARY_H
#define OMX_VOCABULARY_H
/*
 * GENERATED: DO NOT EDIT BY HAND.
 * Produced by `omx-contract render --target c` from Open-Mixer/omx-contract's data/: the vocabulary
 * (docs/data-layout.md). A code is OMX_ and the code in upper snake case, and a reply code that carries a resp has it as that name and _RESP; a word is OMX_<ITEM>_<NAME>, each words
 * item with its _COUNT and an _INIT of its words in their order. A consumer writes and compares these, never a
 * literal of its own.
 */

/** @file
 * @brief The vocabulary of omx-contract: every code and every word as a string define, with its sentence
 * where it carries one. */

/* RESOURCE_KINDS (data/resource-profile.json) */
#define OMX_RESOURCE_KINDS_CPU "cpu" ///< The cost per sample at a rate and quantum, its percentile and its tail (plugin-qualify#115).
/** The source sentence (English) of OMX_RESOURCE_KINDS_CPU. */
#define OMX_RESOURCE_KINDS_CPU_TEXT_EN "The cost per sample at a rate and quantum, its percentile and its tail."
#define OMX_RESOURCE_KINDS_MEMORY "memory" ///< The footprint per instance and its growth over a soak (plugin-qualify#114).
/** The source sentence (English) of OMX_RESOURCE_KINDS_MEMORY. */
#define OMX_RESOURCE_KINDS_MEMORY_TEXT_EN "The footprint per instance and its growth over a soak."
#define OMX_RESOURCE_KINDS_SCRATCH_MEMORY "scratch-memory" ///< The memory a plugin asks of its host for its process call.
/** The source sentence (English) of OMX_RESOURCE_KINDS_SCRATCH_MEMORY. */
#define OMX_RESOURCE_KINDS_SCRATCH_MEMORY_TEXT_EN "The memory a plugin asks of its host for its process call."
#define OMX_RESOURCE_KINDS_LATENCY "latency" ///< The frames a plugin delays its output by, per rate and quantum.
/** The source sentence (English) of OMX_RESOURCE_KINDS_LATENCY. */
#define OMX_RESOURCE_KINDS_LATENCY_TEXT_EN "The frames a plugin delays its output by, per rate and quantum."
#define OMX_RESOURCE_KINDS_TAIL "tail" ///< How long a plugin keeps sounding once its input goes silent.
/** The source sentence (English) of OMX_RESOURCE_KINDS_TAIL. */
#define OMX_RESOURCE_KINDS_TAIL_TEXT_EN "How long a plugin keeps sounding once its input goes silent."
#define OMX_RESOURCE_KINDS_VOICES "voices" ///< The notes an instrument plays at once.
/** The source sentence (English) of OMX_RESOURCE_KINDS_VOICES. */
#define OMX_RESOURCE_KINDS_VOICES_TEXT_EN "The notes an instrument plays at once."
#define OMX_RESOURCE_KINDS_STARTUP "startup" ///< The wall time of instantiate, activate and the first block.
/** The source sentence (English) of OMX_RESOURCE_KINDS_STARTUP. */
#define OMX_RESOURCE_KINDS_STARTUP_TEXT_EN "The wall time of instantiate, activate and the first block."
#define OMX_RESOURCE_KINDS_THREADS "threads" ///< The threads a plugin starts and their scheduling class, or the host thread pool it asks for.
/** The source sentence (English) of OMX_RESOURCE_KINDS_THREADS. */
#define OMX_RESOURCE_KINDS_THREADS_TEXT_EN "The threads a plugin starts and their scheduling class, or the host thread pool it asks for."
#define OMX_RESOURCE_KINDS_WORKER "worker" ///< The work a plugin hands to a non-real-time thread of the host.
/** The source sentence (English) of OMX_RESOURCE_KINDS_WORKER. */
#define OMX_RESOURCE_KINDS_WORKER_TEXT_EN "The work a plugin hands to a non-real-time thread of the host."
#define OMX_RESOURCE_KINDS_BLOCK_LENGTH "block-length" ///< The block lengths a plugin accepts.
/** The source sentence (English) of OMX_RESOURCE_KINDS_BLOCK_LENGTH. */
#define OMX_RESOURCE_KINDS_BLOCK_LENGTH_TEXT_EN "The block lengths a plugin accepts."
#define OMX_RESOURCE_KINDS_OPEN_FILES "open-files" ///< The file descriptors a plugin holds after activate, and their growth.
/** The source sentence (English) of OMX_RESOURCE_KINDS_OPEN_FILES. */
#define OMX_RESOURCE_KINDS_OPEN_FILES_TEXT_EN "The file descriptors a plugin holds after activate, and their growth."
#define OMX_RESOURCE_KINDS_DISK_IO "disk-io" ///< The bytes a plugin reads at load and while it processes.
/** The source sentence (English) of OMX_RESOURCE_KINDS_DISK_IO. */
#define OMX_RESOURCE_KINDS_DISK_IO_TEXT_EN "The bytes a plugin reads at load and while it processes."
#define OMX_RESOURCE_KINDS_NETWORK "network" ///< Any socket a plugin opens.
/** The source sentence (English) of OMX_RESOURCE_KINDS_NETWORK. */
#define OMX_RESOURCE_KINDS_NETWORK_TEXT_EN "Any socket a plugin opens."
#define OMX_RESOURCE_KINDS_STATE "state" ///< The size of a plugin's saved state, its save and restore time, and its round trip.
/** The source sentence (English) of OMX_RESOURCE_KINDS_STATE. */
#define OMX_RESOURCE_KINDS_STATE_TEXT_EN "The size of a plugin's saved state, its save and restore time, and its round trip."
/** The number of words of RESOURCE_KINDS. */
#define OMX_RESOURCE_KINDS_COUNT 14u
/** The words of RESOURCE_KINDS in their declared order, as a C initializer list. */
#define OMX_RESOURCE_KINDS_INIT { "cpu", "memory", "scratch-memory", "latency", "tail", "voices", "startup", "threads", "worker", "block-length", "open-files", "disk-io", "network", "state" }
/** Expands `X(code, "word", NAME)` once per word of RESOURCE_KINDS, in order, the code being its place in the order. Every resource a host plans a plugin for (FreeMixer/plugin-qualify#116): each measured per machine class, judged per host profile, and unknown, never a pass, when it has no figure. */
#define OMX_RESOURCE_KINDS(X) \
    X(0u, "cpu", CPU) X(1u, "memory", MEMORY) X(2u, "scratch-memory", SCRATCH_MEMORY) X(3u, "latency", LATENCY) \
    X(4u, "tail", TAIL) X(5u, "voices", VOICES) X(6u, "startup", STARTUP) X(7u, "threads", THREADS) \
    X(8u, "worker", WORKER) X(9u, "block-length", BLOCK_LENGTH) X(10u, "open-files", OPEN_FILES) X(11u, "disk-io", DISK_IO) \
    X(12u, "network", NETWORK) X(13u, "state", STATE)

/* RESOURCE_UNITS (data/resource-profile.json) */
#define OMX_RESOURCE_UNITS_NS_PER_SAMPLE "ns-per-sample"
/** The source sentence (English) of OMX_RESOURCE_UNITS_NS_PER_SAMPLE. */
#define OMX_RESOURCE_UNITS_NS_PER_SAMPLE_TEXT_EN "Nanoseconds per sample."
#define OMX_RESOURCE_UNITS_FRAMES "frames"
/** The source sentence (English) of OMX_RESOURCE_UNITS_FRAMES. */
#define OMX_RESOURCE_UNITS_FRAMES_TEXT_EN "A count of audio frames."
#define OMX_RESOURCE_UNITS_MS "ms"
/** The source sentence (English) of OMX_RESOURCE_UNITS_MS. */
#define OMX_RESOURCE_UNITS_MS_TEXT_EN "Milliseconds."
#define OMX_RESOURCE_UNITS_US "us"
/** The source sentence (English) of OMX_RESOURCE_UNITS_US. */
#define OMX_RESOURCE_UNITS_US_TEXT_EN "Microseconds."
#define OMX_RESOURCE_UNITS_S "s"
/** The source sentence (English) of OMX_RESOURCE_UNITS_S. */
#define OMX_RESOURCE_UNITS_S_TEXT_EN "Seconds."
#define OMX_RESOURCE_UNITS_BYTES "bytes"
/** The source sentence (English) of OMX_RESOURCE_UNITS_BYTES. */
#define OMX_RESOURCE_UNITS_BYTES_TEXT_EN "Bytes."
#define OMX_RESOURCE_UNITS_PLAIN_COUNT "count"
/** The source sentence (English) of OMX_RESOURCE_UNITS_PLAIN_COUNT. */
#define OMX_RESOURCE_UNITS_PLAIN_COUNT_TEXT_EN "A plain count, with no unit."
#define OMX_RESOURCE_UNITS_RATIO "ratio"
/** The source sentence (English) of OMX_RESOURCE_UNITS_RATIO. */
#define OMX_RESOURCE_UNITS_RATIO_TEXT_EN "A ratio, with no unit."
#define OMX_RESOURCE_UNITS_FLAG "flag" ///< A yes or a no: one when the plugin does the thing, zero when it does not.
/** The source sentence (English) of OMX_RESOURCE_UNITS_FLAG. */
#define OMX_RESOURCE_UNITS_FLAG_TEXT_EN "A yes or a no: one when the plugin does the thing, zero when it does not."
/** The number of words of RESOURCE_UNITS. */
#define OMX_RESOURCE_UNITS_COUNT 9u
/** The words of RESOURCE_UNITS in their declared order, as a C initializer list. */
#define OMX_RESOURCE_UNITS_INIT { "ns-per-sample", "frames", "ms", "us", "s", "bytes", "count", "ratio", "flag" }
/** Expands `X(code, "word", NAME)` once per word of RESOURCE_UNITS, in order, the code being its place in the order. The units a resource figure is given in; an LV2 unit's name where LV2 has one. */
#define OMX_RESOURCE_UNITS(X) \
    X(0u, "ns-per-sample", NS_PER_SAMPLE) X(1u, "frames", FRAMES) X(2u, "ms", MS) X(3u, "us", US) \
    X(4u, "s", S) X(5u, "bytes", BYTES) X(6u, "count", PLAIN_COUNT) X(7u, "ratio", RATIO) \
    X(8u, "flag", FLAG)

/* RESOURCE_BASES (data/resource-profile.json) */
#define OMX_RESOURCE_BASES_DECLARED "declared"
/** The source sentence (English) of OMX_RESOURCE_BASES_DECLARED. */
#define OMX_RESOURCE_BASES_DECLARED_TEXT_EN "What the plugin declares about itself."
#define OMX_RESOURCE_BASES_MEASURED "measured"
/** The source sentence (English) of OMX_RESOURCE_BASES_MEASURED. */
#define OMX_RESOURCE_BASES_MEASURED_TEXT_EN "What a run measured."
#define OMX_RESOURCE_BASES_PROBE "probe"
/** The source sentence (English) of OMX_RESOURCE_BASES_PROBE. */
#define OMX_RESOURCE_BASES_PROBE_TEXT_EN "A count the caller gave the probe."
/** The number of words of RESOURCE_BASES. */
#define OMX_RESOURCE_BASES_COUNT 3u
/** The words of RESOURCE_BASES in their declared order, as a C initializer list. */
#define OMX_RESOURCE_BASES_INIT { "declared", "measured", "probe" }
/** Expands `X(code, "word", NAME)` once per word of RESOURCE_BASES, in order, the code being its place in the order. How a resource figure was known: what the plugin declares, what a run measured, or a count the caller gave the probe. */
#define OMX_RESOURCE_BASES(X) \
    X(0u, "declared", DECLARED) X(1u, "measured", MEASURED) X(2u, "probe", PROBE)

/* RESOURCE_HINTS (data/resource-profile.json) */
#define OMX_RESOURCE_HINTS_FOOTPRINT_AT_REST "footprint-at-rest" ///< The memory one instance holds at rest, once activated and idle, with no note playing.
/** The source sentence (English) of OMX_RESOURCE_HINTS_FOOTPRINT_AT_REST. */
#define OMX_RESOURCE_HINTS_FOOTPRINT_AT_REST_TEXT_EN "The memory one instance holds at rest, once activated and idle, with no note playing."
#define OMX_RESOURCE_HINTS_FOOTPRINT_PER_VOICE "footprint-per-voice" ///< The memory each voice adds while it plays, for an instrument.
/** The source sentence (English) of OMX_RESOURCE_HINTS_FOOTPRINT_PER_VOICE. */
#define OMX_RESOURCE_HINTS_FOOTPRINT_PER_VOICE_TEXT_EN "The memory each voice adds while it plays, for an instrument."
#define OMX_RESOURCE_HINTS_SHARED_LOAD "shared-load" ///< The one-time load every instance of the plugin shares, counted once however many are instantiated.
/** The source sentence (English) of OMX_RESOURCE_HINTS_SHARED_LOAD. */
#define OMX_RESOURCE_HINTS_SHARED_LOAD_TEXT_EN "The one-time load every instance of the plugin shares, counted once however many are instantiated."
#define OMX_RESOURCE_HINTS_THREADS_SPAWNED "threads-spawned" ///< The threads the plugin starts itself, apart from any it asks the host pool for.
/** The source sentence (English) of OMX_RESOURCE_HINTS_THREADS_SPAWNED. */
#define OMX_RESOURCE_HINTS_THREADS_SPAWNED_TEXT_EN "The threads the plugin starts itself, apart from any it asks the host pool for."
#define OMX_RESOURCE_HINTS_STREAMS_FROM_DISK "streams-from-disk" ///< Whether the plugin reads from disk while it processes.
/** The source sentence (English) of OMX_RESOURCE_HINTS_STREAMS_FROM_DISK. */
#define OMX_RESOURCE_HINTS_STREAMS_FROM_DISK_TEXT_EN "Whether the plugin reads from disk while it processes."
#define OMX_RESOURCE_HINTS_OPENS_SOCKETS "opens-sockets" ///< Whether the plugin opens any socket.
/** The source sentence (English) of OMX_RESOURCE_HINTS_OPENS_SOCKETS. */
#define OMX_RESOURCE_HINTS_OPENS_SOCKETS_TEXT_EN "Whether the plugin opens any socket."
#define OMX_RESOURCE_HINTS_ACTIVATE_TIME "activate-time" ///< The wall time of activate and the first block the plugin expects.
/** The source sentence (English) of OMX_RESOURCE_HINTS_ACTIVATE_TIME. */
#define OMX_RESOURCE_HINTS_ACTIVATE_TIME_TEXT_EN "The wall time of activate and the first block the plugin expects."
/** The number of words of RESOURCE_HINTS. */
#define OMX_RESOURCE_HINTS_COUNT 7u
/** The words of RESOURCE_HINTS in their declared order, as a C initializer list. */
#define OMX_RESOURCE_HINTS_INIT { "footprint-at-rest", "footprint-per-voice", "shared-load", "threads-spawned", "streams-from-disk", "opens-sockets", "activate-time" }
/** Expands `X(code, "word", NAME)` once per word of RESOURCE_HINTS, in order, the code being its place in the order. What a plugin declares about its own footprint, in openmixer's own hints (FreeMixer/plugin-qualify#116): each a claim plugin-qualify measures and checks, carried by the extension below, as the CLAP draft and as LV2 properties. A hint a plugin does not state is unknown, never zero. */
#define OMX_RESOURCE_HINTS(X) \
    X(0u, "footprint-at-rest", FOOTPRINT_AT_REST) X(1u, "footprint-per-voice", FOOTPRINT_PER_VOICE) X(2u, "shared-load", SHARED_LOAD) X(3u, "threads-spawned", THREADS_SPAWNED) \
    X(4u, "streams-from-disk", STREAMS_FROM_DISK) X(5u, "opens-sockets", OPENS_SOCKETS) X(6u, "activate-time", ACTIVATE_TIME)

/* PARAM_UNITS (contract.d/param/param.json) */
#define OMX_PARAM_UNITS_DB "dB" ///< Decibels, a gain or a level relative to unity.
/** The source sentence (English) of OMX_PARAM_UNITS_DB. */
#define OMX_PARAM_UNITS_DB_TEXT_EN "Decibels, a gain or a level relative to unity."
#define OMX_PARAM_UNITS_DBFS "dBFS" ///< Decibels relative to digital full scale.
/** The source sentence (English) of OMX_PARAM_UNITS_DBFS. */
#define OMX_PARAM_UNITS_DBFS_TEXT_EN "Decibels relative to digital full scale."
#define OMX_PARAM_UNITS_MS "ms" ///< Milliseconds.
/** The source sentence (English) of OMX_PARAM_UNITS_MS. */
#define OMX_PARAM_UNITS_MS_TEXT_EN "Milliseconds."
#define OMX_PARAM_UNITS_S "s" ///< Seconds.
/** The source sentence (English) of OMX_PARAM_UNITS_S. */
#define OMX_PARAM_UNITS_S_TEXT_EN "Seconds."
#define OMX_PARAM_UNITS_MIN "min" ///< Minutes.
/** The source sentence (English) of OMX_PARAM_UNITS_MIN. */
#define OMX_PARAM_UNITS_MIN_TEXT_EN "Minutes."
#define OMX_PARAM_UNITS_HZ "Hz" ///< Hertz, a frequency.
/** The source sentence (English) of OMX_PARAM_UNITS_HZ. */
#define OMX_PARAM_UNITS_HZ_TEXT_EN "Hertz, a frequency."
#define OMX_PARAM_UNITS_OCT "oct" ///< Octaves, a bandwidth or an interval.
/** The source sentence (English) of OMX_PARAM_UNITS_OCT. */
#define OMX_PARAM_UNITS_OCT_TEXT_EN "Octaves, a bandwidth or an interval."
#define OMX_PARAM_UNITS_CENTS "cents" ///< Cents, a hundredth of a semitone.
/** The source sentence (English) of OMX_PARAM_UNITS_CENTS. */
#define OMX_PARAM_UNITS_CENTS_TEXT_EN "Cents, a hundredth of a semitone."
#define OMX_PARAM_UNITS_ST "st" ///< Semitones.
/** The source sentence (English) of OMX_PARAM_UNITS_ST. */
#define OMX_PARAM_UNITS_ST_TEXT_EN "Semitones."
#define OMX_PARAM_UNITS_PERCENT "percent" ///< Percent.
/** The source sentence (English) of OMX_PARAM_UNITS_PERCENT. */
#define OMX_PARAM_UNITS_PERCENT_TEXT_EN "Percent."
#define OMX_PARAM_UNITS_X "x" ///< A multiplier.
/** The source sentence (English) of OMX_PARAM_UNITS_X. */
#define OMX_PARAM_UNITS_X_TEXT_EN "A multiplier."
#define OMX_PARAM_UNITS_NONE "none" ///< No unit: a ratio or a fraction.
/** The source sentence (English) of OMX_PARAM_UNITS_NONE. */
#define OMX_PARAM_UNITS_NONE_TEXT_EN "No unit: a ratio or a fraction."
#define OMX_PARAM_UNITS_DB_PER_OCT "dB-oct" ///< A slope in dB per octave (a tilt).
/** The source sentence (English) of OMX_PARAM_UNITS_DB_PER_OCT. */
#define OMX_PARAM_UNITS_DB_PER_OCT_TEXT_EN "A slope in dB per octave (a tilt)."
#define OMX_PARAM_UNITS_LUFS "LUFS" ///< A loudness (ITU-R BS.1770).
/** The source sentence (English) of OMX_PARAM_UNITS_LUFS. */
#define OMX_PARAM_UNITS_LUFS_TEXT_EN "A loudness (ITU-R BS.1770)."
#define OMX_PARAM_UNITS_DB_PER_S "dB-s" ///< A gain change per second.
/** The source sentence (English) of OMX_PARAM_UNITS_DB_PER_S. */
#define OMX_PARAM_UNITS_DB_PER_S_TEXT_EN "A gain change per second."
#define OMX_PARAM_UNITS_DBTP "dBTP" ///< Decibels true peak, a level measured between the samples (ITU-R BS.1770).
/** The source sentence (English) of OMX_PARAM_UNITS_DBTP. */
#define OMX_PARAM_UNITS_DBTP_TEXT_EN "Decibels true peak, a level measured between the samples (ITU-R BS.1770)."
#define OMX_PARAM_UNITS_DBU "dBu" ///< Decibels relative to 0.7746 volts RMS, an analogue level.
/** The source sentence (English) of OMX_PARAM_UNITS_DBU. */
#define OMX_PARAM_UNITS_DBU_TEXT_EN "Decibels relative to 0.7746 volts RMS, an analogue level."
#define OMX_PARAM_UNITS_LU "LU" ///< Loudness units, a loudness difference or range (EBU R 128).
/** The source sentence (English) of OMX_PARAM_UNITS_LU. */
#define OMX_PARAM_UNITS_LU_TEXT_EN "Loudness units, a loudness difference or range (EBU R 128)."
#define OMX_PARAM_UNITS_KHZ "kHz" ///< Kilohertz, a frequency.
/** The source sentence (English) of OMX_PARAM_UNITS_KHZ. */
#define OMX_PARAM_UNITS_KHZ_TEXT_EN "Kilohertz, a frequency."
#define OMX_PARAM_UNITS_MHZ "MHz" ///< Megahertz, a frequency.
/** The source sentence (English) of OMX_PARAM_UNITS_MHZ. */
#define OMX_PARAM_UNITS_MHZ_TEXT_EN "Megahertz, a frequency."
#define OMX_PARAM_UNITS_FRAMES "frames" ///< Audio frames, one sample on each channel.
/** The source sentence (English) of OMX_PARAM_UNITS_FRAMES. */
#define OMX_PARAM_UNITS_FRAMES_TEXT_EN "Audio frames, one sample on each channel."
#define OMX_PARAM_UNITS_BPM "bpm" ///< Beats per minute, a tempo.
/** The source sentence (English) of OMX_PARAM_UNITS_BPM. */
#define OMX_PARAM_UNITS_BPM_TEXT_EN "Beats per minute, a tempo."
#define OMX_PARAM_UNITS_BAR "bar" ///< Bars, a musical length.
/** The source sentence (English) of OMX_PARAM_UNITS_BAR. */
#define OMX_PARAM_UNITS_BAR_TEXT_EN "Bars, a musical length."
#define OMX_PARAM_UNITS_BEAT "beat" ///< Beats, a musical length.
/** The source sentence (English) of OMX_PARAM_UNITS_BEAT. */
#define OMX_PARAM_UNITS_BEAT_TEXT_EN "Beats, a musical length."
#define OMX_PARAM_UNITS_M "m" ///< Metres, a length.
/** The source sentence (English) of OMX_PARAM_UNITS_M. */
#define OMX_PARAM_UNITS_M_TEXT_EN "Metres, a length."
#define OMX_PARAM_UNITS_CM "cm" ///< Centimetres, a length.
/** The source sentence (English) of OMX_PARAM_UNITS_CM. */
#define OMX_PARAM_UNITS_CM_TEXT_EN "Centimetres, a length."
#define OMX_PARAM_UNITS_MM "mm" ///< Millimetres, a length.
/** The source sentence (English) of OMX_PARAM_UNITS_MM. */
#define OMX_PARAM_UNITS_MM_TEXT_EN "Millimetres, a length."
#define OMX_PARAM_UNITS_KM "km" ///< Kilometres, a length.
/** The source sentence (English) of OMX_PARAM_UNITS_KM. */
#define OMX_PARAM_UNITS_KM_TEXT_EN "Kilometres, a length."
#define OMX_PARAM_UNITS_INCH "inch" ///< Inches, a length.
/** The source sentence (English) of OMX_PARAM_UNITS_INCH. */
#define OMX_PARAM_UNITS_INCH_TEXT_EN "Inches, a length."
#define OMX_PARAM_UNITS_MILE "mile" ///< Miles, a length.
/** The source sentence (English) of OMX_PARAM_UNITS_MILE. */
#define OMX_PARAM_UNITS_MILE_TEXT_EN "Miles, a length."
#define OMX_PARAM_UNITS_DEGREE "deg" ///< Degrees, an angle.
/** The source sentence (English) of OMX_PARAM_UNITS_DEGREE. */
#define OMX_PARAM_UNITS_DEGREE_TEXT_EN "Degrees, an angle."
#define OMX_PARAM_UNITS_MIDI_NOTE "midiNote" ///< A MIDI note number.
/** The source sentence (English) of OMX_PARAM_UNITS_MIDI_NOTE. */
#define OMX_PARAM_UNITS_MIDI_NOTE_TEXT_EN "A MIDI note number."
#define OMX_PARAM_UNITS_RATIO "ratio" ///< A ratio n:1, a compressor's or an expander's.
/** The source sentence (English) of OMX_PARAM_UNITS_RATIO. */
#define OMX_PARAM_UNITS_RATIO_TEXT_EN "A ratio n:1, a compressor's or an expander's."
#define OMX_PARAM_UNITS_COEF "coef" ///< A coefficient, a plain multiplier with no unit of its own.
/** The source sentence (English) of OMX_PARAM_UNITS_COEF. */
#define OMX_PARAM_UNITS_COEF_TEXT_EN "A coefficient, a plain multiplier with no unit of its own."
#define OMX_PARAM_UNITS_US "us" ///< Microseconds.
/** The source sentence (English) of OMX_PARAM_UNITS_US. */
#define OMX_PARAM_UNITS_US_TEXT_EN "Microseconds."
#define OMX_PARAM_UNITS_BYTES "bytes" ///< Bytes.
/** The source sentence (English) of OMX_PARAM_UNITS_BYTES. */
#define OMX_PARAM_UNITS_BYTES_TEXT_EN "Bytes."
#define OMX_PARAM_UNITS_NS_PER_SAMPLE "nsPerSample" ///< Nanoseconds per sample, a processing cost.
/** The source sentence (English) of OMX_PARAM_UNITS_NS_PER_SAMPLE. */
#define OMX_PARAM_UNITS_NS_PER_SAMPLE_TEXT_EN "Nanoseconds per sample, a processing cost."
#define OMX_PARAM_UNITS_PLAIN_COUNT "plainCount" ///< A plain count, with no unit.
/** The source sentence (English) of OMX_PARAM_UNITS_PLAIN_COUNT. */
#define OMX_PARAM_UNITS_PLAIN_COUNT_TEXT_EN "A plain count, with no unit."
#define OMX_PARAM_UNITS_FLAG "flag" ///< A yes or a no: one when on, zero when off.
/** The source sentence (English) of OMX_PARAM_UNITS_FLAG. */
#define OMX_PARAM_UNITS_FLAG_TEXT_EN "A yes or a no: one when on, zero when off."
/** The number of words of PARAM_UNITS. */
#define OMX_PARAM_UNITS_COUNT 39u
/** The words of PARAM_UNITS in their declared order, as a C initializer list. */
#define OMX_PARAM_UNITS_INIT { "dB", "dBFS", "ms", "s", "min", "Hz", "oct", "cents", "st", "percent", "x", "none", "dB-oct", "LUFS", "dB-s", "dBTP", "dBu", "LU", "kHz", "MHz", "frames", "bpm", "bar", "beat", "m", "cm", "mm", "km", "inch", "mile", "deg", "midiNote", "ratio", "coef", "us", "bytes", "nsPerSample", "plainCount", "flag" }
/** Expands `X(code, "word", NAME)` once per word of PARAM_UNITS, in order, the code being its place in the order. The one list of standard units (the owner's ruling of 2026-11-20, standard vocabulary in one place; docs/units.md): each word's `x-symbol` is its symbol as written (`%`, `""`, `dB/oct`), the word a name the wire can carry, its `x-dimension` what it measures (a word of PARAM_UNIT_DIMENSIONS) and its group its scope (a word of PARAM_UNIT_SCOPES). The schema's $defs.unit enum is the symbols of the `param` units and $defs.descriptorUnit those of the `descriptor` units and `unknown`, in this order (tools/unit-enum.mjs). The list only grows: a unit is appended, never moved or removed. A level's own spellings (an LV2 unit, a CLAP unit code) map onto these ids at that level. */
#define OMX_PARAM_UNITS_WORDS(X) \
    X(0u, "dB", DB) X(1u, "dBFS", DBFS) X(2u, "ms", MS) X(3u, "s", S) \
    X(4u, "min", MIN) X(5u, "Hz", HZ) X(6u, "oct", OCT) X(7u, "cents", CENTS) \
    X(8u, "st", ST) X(9u, "percent", PERCENT) X(10u, "x", X) X(11u, "none", NONE) \
    X(12u, "dB-oct", DB_PER_OCT) X(13u, "LUFS", LUFS) X(14u, "dB-s", DB_PER_S) X(15u, "dBTP", DBTP) \
    X(16u, "dBu", DBU) X(17u, "LU", LU) X(18u, "kHz", KHZ) X(19u, "MHz", MHZ) \
    X(20u, "frames", FRAMES) X(21u, "bpm", BPM) X(22u, "bar", BAR) X(23u, "beat", BEAT) \
    X(24u, "m", M) X(25u, "cm", CM) X(26u, "mm", MM) X(27u, "km", KM) \
    X(28u, "inch", INCH) X(29u, "mile", MILE) X(30u, "deg", DEGREE) X(31u, "midiNote", MIDI_NOTE) \
    X(32u, "ratio", RATIO) X(33u, "coef", COEF) X(34u, "us", US) X(35u, "bytes", BYTES) \
    X(36u, "nsPerSample", NS_PER_SAMPLE) X(37u, "plainCount", PLAIN_COUNT) X(38u, "flag", FLAG)

/* PARAM_UNIT_DIMENSIONS (contract.d/param/param.json) */
#define OMX_PARAM_UNIT_DIMENSIONS_NONE "none" ///< No dimension: a plain number, a multiplier or a yes or a no.
/** The source sentence (English) of OMX_PARAM_UNIT_DIMENSIONS_NONE. */
#define OMX_PARAM_UNIT_DIMENSIONS_NONE_TEXT_EN "No dimension: a plain number, a multiplier or a yes or a no."
#define OMX_PARAM_UNIT_DIMENSIONS_TIME "time" ///< A time.
/** The source sentence (English) of OMX_PARAM_UNIT_DIMENSIONS_TIME. */
#define OMX_PARAM_UNIT_DIMENSIONS_TIME_TEXT_EN "A time."
#define OMX_PARAM_UNIT_DIMENSIONS_FREQUENCY "frequency" ///< A frequency.
/** The source sentence (English) of OMX_PARAM_UNIT_DIMENSIONS_FREQUENCY. */
#define OMX_PARAM_UNIT_DIMENSIONS_FREQUENCY_TEXT_EN "A frequency."
#define OMX_PARAM_UNIT_DIMENSIONS_GAIN "gain" ///< A gain: a level relative to another.
/** The source sentence (English) of OMX_PARAM_UNIT_DIMENSIONS_GAIN. */
#define OMX_PARAM_UNIT_DIMENSIONS_GAIN_TEXT_EN "A gain: a level relative to another."
#define OMX_PARAM_UNIT_DIMENSIONS_LEVEL "level" ///< A level against a fixed reference.
/** The source sentence (English) of OMX_PARAM_UNIT_DIMENSIONS_LEVEL. */
#define OMX_PARAM_UNIT_DIMENSIONS_LEVEL_TEXT_EN "A level against a fixed reference."
#define OMX_PARAM_UNIT_DIMENSIONS_LOUDNESS "loudness" ///< A loudness or a loudness difference.
/** The source sentence (English) of OMX_PARAM_UNIT_DIMENSIONS_LOUDNESS. */
#define OMX_PARAM_UNIT_DIMENSIONS_LOUDNESS_TEXT_EN "A loudness or a loudness difference."
#define OMX_PARAM_UNIT_DIMENSIONS_PITCH "pitch" ///< A pitch or a pitch interval.
/** The source sentence (English) of OMX_PARAM_UNIT_DIMENSIONS_PITCH. */
#define OMX_PARAM_UNIT_DIMENSIONS_PITCH_TEXT_EN "A pitch or a pitch interval."
#define OMX_PARAM_UNIT_DIMENSIONS_ANGLE "angle" ///< An angle.
/** The source sentence (English) of OMX_PARAM_UNIT_DIMENSIONS_ANGLE. */
#define OMX_PARAM_UNIT_DIMENSIONS_ANGLE_TEXT_EN "An angle."
#define OMX_PARAM_UNIT_DIMENSIONS_LENGTH "length" ///< A length in space.
/** The source sentence (English) of OMX_PARAM_UNIT_DIMENSIONS_LENGTH. */
#define OMX_PARAM_UNIT_DIMENSIONS_LENGTH_TEXT_EN "A length in space."
#define OMX_PARAM_UNIT_DIMENSIONS_TEMPO "tempo" ///< A tempo.
/** The source sentence (English) of OMX_PARAM_UNIT_DIMENSIONS_TEMPO. */
#define OMX_PARAM_UNIT_DIMENSIONS_TEMPO_TEXT_EN "A tempo."
#define OMX_PARAM_UNIT_DIMENSIONS_MUSICAL_TIME "musical-time" ///< A length in musical time; it depends on the meter.
/** The source sentence (English) of OMX_PARAM_UNIT_DIMENSIONS_MUSICAL_TIME. */
#define OMX_PARAM_UNIT_DIMENSIONS_MUSICAL_TIME_TEXT_EN "A length in musical time; it depends on the meter."
#define OMX_PARAM_UNIT_DIMENSIONS_COUNTED "count" ///< A number of things (frames, a plain count).
/** The source sentence (English) of OMX_PARAM_UNIT_DIMENSIONS_COUNTED. */
#define OMX_PARAM_UNIT_DIMENSIONS_COUNTED_TEXT_EN "A number of things."
#define OMX_PARAM_UNIT_DIMENSIONS_SLOPE "slope" ///< A change of level per octave.
/** The source sentence (English) of OMX_PARAM_UNIT_DIMENSIONS_SLOPE. */
#define OMX_PARAM_UNIT_DIMENSIONS_SLOPE_TEXT_EN "A change of level per octave."
#define OMX_PARAM_UNIT_DIMENSIONS_RATE "rate" ///< A change of gain per unit of time.
/** The source sentence (English) of OMX_PARAM_UNIT_DIMENSIONS_RATE. */
#define OMX_PARAM_UNIT_DIMENSIONS_RATE_TEXT_EN "A change of gain per unit of time."
#define OMX_PARAM_UNIT_DIMENSIONS_RATIO "ratio" ///< A ratio n:1.
/** The source sentence (English) of OMX_PARAM_UNIT_DIMENSIONS_RATIO. */
#define OMX_PARAM_UNIT_DIMENSIONS_RATIO_TEXT_EN "A ratio n:1."
#define OMX_PARAM_UNIT_DIMENSIONS_INFORMATION "information" ///< An amount of data.
/** The source sentence (English) of OMX_PARAM_UNIT_DIMENSIONS_INFORMATION. */
#define OMX_PARAM_UNIT_DIMENSIONS_INFORMATION_TEXT_EN "An amount of data."
#define OMX_PARAM_UNIT_DIMENSIONS_TIME_PER_SAMPLE "time-per-sample" ///< A processing cost per sample, never a duration.
/** The source sentence (English) of OMX_PARAM_UNIT_DIMENSIONS_TIME_PER_SAMPLE. */
#define OMX_PARAM_UNIT_DIMENSIONS_TIME_PER_SAMPLE_TEXT_EN "A processing cost per sample, never a duration."
/** The number of words of PARAM_UNIT_DIMENSIONS. */
#define OMX_PARAM_UNIT_DIMENSIONS_COUNT 17u
/** The words of PARAM_UNIT_DIMENSIONS in their declared order, as a C initializer list. */
#define OMX_PARAM_UNIT_DIMENSIONS_INIT { "none", "time", "frequency", "gain", "level", "loudness", "pitch", "angle", "length", "tempo", "musical-time", "count", "slope", "rate", "ratio", "information", "time-per-sample" }
/** Expands `X(code, "word", NAME)` once per word of PARAM_UNIT_DIMENSIONS, in order, the code being its place in the order. What a unit of PARAM_UNITS measures (docs/units.md, The dimensions): two units of one dimension measure the same kind of quantity (ms and s, Hz and kHz), so a reader can tell which units a value may be shown in. The word `count` has the key `counted`: OMX_PARAM_UNIT_DIMENSIONS_COUNT is the number of words. */
#define OMX_PARAM_UNIT_DIMENSIONS(X) \
    X(0u, "none", NONE) X(1u, "time", TIME) X(2u, "frequency", FREQUENCY) X(3u, "gain", GAIN) \
    X(4u, "level", LEVEL) X(5u, "loudness", LOUDNESS) X(6u, "pitch", PITCH) X(7u, "angle", ANGLE) \
    X(8u, "length", LENGTH) X(9u, "tempo", TEMPO) X(10u, "musical-time", MUSICAL_TIME) X(11u, "count", COUNTED) \
    X(12u, "slope", SLOPE) X(13u, "rate", RATE) X(14u, "ratio", RATIO) X(15u, "information", INFORMATION) \
    X(16u, "time-per-sample", TIME_PER_SAMPLE)

/* PARAM_UNIT_SCOPES (contract.d/param/param.json) */
#define OMX_PARAM_UNIT_SCOPES_PARAM "param" ///< A unit of the items: the schema's $defs.unit, and a descriptor takes it too.
/** The source sentence (English) of OMX_PARAM_UNIT_SCOPES_PARAM. */
#define OMX_PARAM_UNIT_SCOPES_PARAM_TEXT_EN "A unit of the items, which a descriptor states too."
#define OMX_PARAM_UNIT_SCOPES_DESCRIPTOR "descriptor" ///< A unit only a descriptor's control states: the schema's $defs.descriptorUnit.
/** The source sentence (English) of OMX_PARAM_UNIT_SCOPES_DESCRIPTOR. */
#define OMX_PARAM_UNIT_SCOPES_DESCRIPTOR_TEXT_EN "A unit only a descriptor's control states."
/** The number of words of PARAM_UNIT_SCOPES. */
#define OMX_PARAM_UNIT_SCOPES_COUNT 2u
/** The words of PARAM_UNIT_SCOPES in their declared order, as a C initializer list. */
#define OMX_PARAM_UNIT_SCOPES_INIT { "param", "descriptor" }
/** Expands `X(code, "word", NAME)` once per word of PARAM_UNIT_SCOPES, in order, the code being its place in the order. Where a unit of PARAM_UNITS may be stated (docs/units.md, Q16 ruled: the split is kept): `param`, a unit of the items, the schema's $defs.unit; `descriptor`, a unit only a descriptor's control states, the schema's $defs.descriptorUnit. */
#define OMX_PARAM_UNIT_SCOPES(X) \
    X(0u, "param", PARAM) X(1u, "descriptor", DESCRIPTOR)

#endif /* OMX_VOCABULARY_H */
