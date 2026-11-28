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
/** Expands `X(code, "word", NAME)` once per word of RESOURCE_KINDS, in order, the code being its place in the order. Every resource a host plans a plugin for: each measured per machine class, judged per host profile, and unknown, never a pass, when it has no figure. */
#define OMX_RESOURCE_KINDS(X) \
    X(0u, "cpu", CPU) X(1u, "memory", MEMORY) X(2u, "scratch-memory", SCRATCH_MEMORY) X(3u, "latency", LATENCY) \
    X(4u, "tail", TAIL) X(5u, "voices", VOICES) X(6u, "startup", STARTUP) X(7u, "threads", THREADS) \
    X(8u, "worker", WORKER) X(9u, "block-length", BLOCK_LENGTH) X(10u, "open-files", OPEN_FILES) X(11u, "disk-io", DISK_IO) \
    X(12u, "network", NETWORK) X(13u, "state", STATE)

/* RESOURCE_UNITS (data/resource-profile.json) */
#define OMX_RESOURCE_UNITS_NS_PER_SAMPLE "nsPerSample" ///< Nanoseconds per sample.
/** The source sentence (English) of OMX_RESOURCE_UNITS_NS_PER_SAMPLE. */
#define OMX_RESOURCE_UNITS_NS_PER_SAMPLE_TEXT_EN "Nanoseconds per sample."
#define OMX_RESOURCE_UNITS_FRAMES "frames" ///< A count of audio frames.
/** The source sentence (English) of OMX_RESOURCE_UNITS_FRAMES. */
#define OMX_RESOURCE_UNITS_FRAMES_TEXT_EN "A count of audio frames."
#define OMX_RESOURCE_UNITS_MS "ms" ///< Milliseconds.
/** The source sentence (English) of OMX_RESOURCE_UNITS_MS. */
#define OMX_RESOURCE_UNITS_MS_TEXT_EN "Milliseconds."
#define OMX_RESOURCE_UNITS_US "us" ///< Microseconds.
/** The source sentence (English) of OMX_RESOURCE_UNITS_US. */
#define OMX_RESOURCE_UNITS_US_TEXT_EN "Microseconds."
#define OMX_RESOURCE_UNITS_S "s" ///< Seconds.
/** The source sentence (English) of OMX_RESOURCE_UNITS_S. */
#define OMX_RESOURCE_UNITS_S_TEXT_EN "Seconds."
#define OMX_RESOURCE_UNITS_BYTES "bytes" ///< Bytes.
/** The source sentence (English) of OMX_RESOURCE_UNITS_BYTES. */
#define OMX_RESOURCE_UNITS_BYTES_TEXT_EN "Bytes."
#define OMX_RESOURCE_UNITS_PLAIN_COUNT "count" ///< A plain count, with no unit.
/** The source sentence (English) of OMX_RESOURCE_UNITS_PLAIN_COUNT. */
#define OMX_RESOURCE_UNITS_PLAIN_COUNT_TEXT_EN "A plain count, with no unit."
#define OMX_RESOURCE_UNITS_RATIO "ratio" ///< A ratio, with no unit.
/** The source sentence (English) of OMX_RESOURCE_UNITS_RATIO. */
#define OMX_RESOURCE_UNITS_RATIO_TEXT_EN "A ratio, with no unit."
#define OMX_RESOURCE_UNITS_FLAG "flag" ///< A yes or a no: one when the plugin does the thing, zero when it does not.
/** The source sentence (English) of OMX_RESOURCE_UNITS_FLAG. */
#define OMX_RESOURCE_UNITS_FLAG_TEXT_EN "A yes or a no: one when the plugin does the thing, zero when it does not."
/** The number of words of RESOURCE_UNITS. */
#define OMX_RESOURCE_UNITS_COUNT 9u
/** The words of RESOURCE_UNITS in their declared order, as a C initializer list. */
#define OMX_RESOURCE_UNITS_INIT { "nsPerSample", "frames", "ms", "us", "s", "bytes", "count", "ratio", "flag" }
/** Expands `X(code, "word", NAME)` once per word of RESOURCE_UNITS, in order, the code being its place in the order. The units a resource figure is given in; an LV2 unit's name where LV2 has one. */
#define OMX_RESOURCE_UNITS(X) \
    X(0u, "nsPerSample", NS_PER_SAMPLE) X(1u, "frames", FRAMES) X(2u, "ms", MS) X(3u, "us", US) \
    X(4u, "s", S) X(5u, "bytes", BYTES) X(6u, "count", PLAIN_COUNT) X(7u, "ratio", RATIO) \
    X(8u, "flag", FLAG)

/* RESOURCE_BASES (data/resource-profile.json) */
#define OMX_RESOURCE_BASES_DECLARED "declared" ///< What the plugin declares about itself.
/** The source sentence (English) of OMX_RESOURCE_BASES_DECLARED. */
#define OMX_RESOURCE_BASES_DECLARED_TEXT_EN "What the plugin declares about itself."
#define OMX_RESOURCE_BASES_MEASURED "measured" ///< What a run measured.
/** The source sentence (English) of OMX_RESOURCE_BASES_MEASURED. */
#define OMX_RESOURCE_BASES_MEASURED_TEXT_EN "What a run measured."
#define OMX_RESOURCE_BASES_PROBE "probe" ///< A count the caller gave the probe.
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
/** Expands `X(code, "word", NAME)` once per word of RESOURCE_HINTS, in order, the code being its place in the order. What a plugin declares about its own footprint, in openmixer's own hints: each a claim plugin-qualify measures and checks, carried by the extension below, as the CLAP draft and as LV2 properties. A hint a plugin does not state is unknown, never zero. */
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
#define OMX_PARAM_UNITS_NONE "none" ///< No unit: a ratio or a fraction.
/** The source sentence (English) of OMX_PARAM_UNITS_NONE. */
#define OMX_PARAM_UNITS_NONE_TEXT_EN "No unit: a ratio or a fraction."
#define OMX_PARAM_UNITS_DB_PER_OCT "dBPerOct" ///< A slope in dB per octave (a tilt).
/** The source sentence (English) of OMX_PARAM_UNITS_DB_PER_OCT. */
#define OMX_PARAM_UNITS_DB_PER_OCT_TEXT_EN "A slope in dB per octave (a tilt)."
#define OMX_PARAM_UNITS_LUFS "LUFS" ///< A loudness (ITU-R BS.1770).
/** The source sentence (English) of OMX_PARAM_UNITS_LUFS. */
#define OMX_PARAM_UNITS_LUFS_TEXT_EN "A loudness (ITU-R BS.1770)."
#define OMX_PARAM_UNITS_DB_PER_S "dBPerS" ///< A gain change per second.
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
#define OMX_PARAM_UNITS_COUNT 38u
/** The words of PARAM_UNITS in their declared order, as a C initializer list. */
#define OMX_PARAM_UNITS_INIT { "dB", "dBFS", "ms", "s", "min", "Hz", "oct", "cents", "st", "percent", "none", "dBPerOct", "LUFS", "dBPerS", "dBTP", "dBu", "LU", "kHz", "MHz", "frames", "bpm", "bar", "beat", "m", "cm", "mm", "km", "inch", "mile", "deg", "midiNote", "ratio", "coef", "us", "bytes", "nsPerSample", "plainCount", "flag" }
/** Expands `X(code, "word", NAME)` once per word of PARAM_UNITS, in order, the code being its place in the order. The one list of standard units (the owner's ruling of 2026-11-20, standard vocabulary in one place; docs/units.md): each word's `x-symbol` is its symbol as written (`%`, `""`, `dB/oct`), the word a name the wire can carry, its `x-dimension` what it measures (a word of PARAM_UNIT_DIMENSIONS) and its group its scope (a word of PARAM_UNIT_SCOPES). The schema's $defs.unit enum is the ids (consts) of the `param` units and $defs.descriptorUnit those of the `descriptor` units and `unknown`, in this order (tools/unit-enum.mjs): the id is the wire word, the `x-symbol` its display rendering only (C2, plugin-hostd#215 D1/D2). A word's code is its position in the list, not a wire number (the wire codes are omx-clap's, the unit codes of org.openmixer.param-contract/1): a reader takes the words, so a unit removed shifts the codes after it (omx-contract#167: `x` went, `coef` is the plain multiplier). A level's own spellings (an LV2 unit, a CLAP unit code) map onto these ids at that level. */
#define OMX_PARAM_UNITS_WORDS(X) \
    X(0u, "dB", DB) X(1u, "dBFS", DBFS) X(2u, "ms", MS) X(3u, "s", S) \
    X(4u, "min", MIN) X(5u, "Hz", HZ) X(6u, "oct", OCT) X(7u, "cents", CENTS) \
    X(8u, "st", ST) X(9u, "percent", PERCENT) X(10u, "none", NONE) X(11u, "dBPerOct", DB_PER_OCT) \
    X(12u, "LUFS", LUFS) X(13u, "dBPerS", DB_PER_S) X(14u, "dBTP", DBTP) X(15u, "dBu", DBU) \
    X(16u, "LU", LU) X(17u, "kHz", KHZ) X(18u, "MHz", MHZ) X(19u, "frames", FRAMES) \
    X(20u, "bpm", BPM) X(21u, "bar", BAR) X(22u, "beat", BEAT) X(23u, "m", M) \
    X(24u, "cm", CM) X(25u, "mm", MM) X(26u, "km", KM) X(27u, "inch", INCH) \
    X(28u, "mile", MILE) X(29u, "deg", DEGREE) X(30u, "midiNote", MIDI_NOTE) X(31u, "ratio", RATIO) \
    X(32u, "coef", COEF) X(33u, "us", US) X(34u, "bytes", BYTES) X(35u, "nsPerSample", NS_PER_SAMPLE) \
    X(36u, "plainCount", PLAIN_COUNT) X(37u, "flag", FLAG)

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

/* PARAM_UNITS_CLAP_ENCODED (contract.d/param/param.json) */
#define OMX_PARAM_UNITS_CLAP_ENCODED_DB "dB" ///< Decibels, a gain or a level relative to unity.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_DB. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_DB_TEXT_EN "Decibels, a gain or a level relative to unity."
#define OMX_PARAM_UNITS_CLAP_ENCODED_DBFS "dBFS" ///< Decibels relative to digital full scale.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_DBFS. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_DBFS_TEXT_EN "Decibels relative to digital full scale."
#define OMX_PARAM_UNITS_CLAP_ENCODED_MS "ms" ///< Milliseconds.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_MS. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_MS_TEXT_EN "Milliseconds."
#define OMX_PARAM_UNITS_CLAP_ENCODED_S "s" ///< Seconds.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_S. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_S_TEXT_EN "Seconds."
#define OMX_PARAM_UNITS_CLAP_ENCODED_MIN "min" ///< Minutes.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_MIN. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_MIN_TEXT_EN "Minutes."
#define OMX_PARAM_UNITS_CLAP_ENCODED_HZ "Hz" ///< Hertz, a frequency.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_HZ. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_HZ_TEXT_EN "Hertz, a frequency."
#define OMX_PARAM_UNITS_CLAP_ENCODED_OCT "oct" ///< Octaves, a bandwidth or an interval.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_OCT. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_OCT_TEXT_EN "Octaves, a bandwidth or an interval."
#define OMX_PARAM_UNITS_CLAP_ENCODED_CENTS "cents" ///< Cents, a hundredth of a semitone.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_CENTS. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_CENTS_TEXT_EN "Cents, a hundredth of a semitone."
#define OMX_PARAM_UNITS_CLAP_ENCODED_ST "st" ///< Semitones.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_ST. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_ST_TEXT_EN "Semitones."
#define OMX_PARAM_UNITS_CLAP_ENCODED_PERCENT "percent" ///< Percent.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_PERCENT. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_PERCENT_TEXT_EN "Percent."
#define OMX_PARAM_UNITS_CLAP_ENCODED_NONE "none" ///< No unit: a ratio or a fraction.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_NONE. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_NONE_TEXT_EN "No unit: a ratio or a fraction."
#define OMX_PARAM_UNITS_CLAP_ENCODED_DB_PER_OCT "dBPerOct" ///< A slope in dB per octave (a tilt).
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_DB_PER_OCT. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_DB_PER_OCT_TEXT_EN "A slope in dB per octave (a tilt)."
#define OMX_PARAM_UNITS_CLAP_ENCODED_LUFS "LUFS" ///< A loudness (ITU-R BS.1770).
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_LUFS. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_LUFS_TEXT_EN "A loudness (ITU-R BS.1770)."
#define OMX_PARAM_UNITS_CLAP_ENCODED_DB_PER_S "dBPerS" ///< A gain change per second.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_DB_PER_S. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_DB_PER_S_TEXT_EN "A gain change per second."
#define OMX_PARAM_UNITS_CLAP_ENCODED_DBTP "dBTP" ///< Decibels true peak, a level measured between the samples (ITU-R BS.1770).
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_DBTP. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_DBTP_TEXT_EN "Decibels true peak, a level measured between the samples (ITU-R BS.1770)."
#define OMX_PARAM_UNITS_CLAP_ENCODED_DBU "dBu" ///< Decibels relative to 0.7746 volts RMS, an analogue level.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_DBU. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_DBU_TEXT_EN "Decibels relative to 0.7746 volts RMS, an analogue level."
#define OMX_PARAM_UNITS_CLAP_ENCODED_LU "LU" ///< Loudness units, a loudness difference or range (EBU R 128).
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_LU. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_LU_TEXT_EN "Loudness units, a loudness difference or range (EBU R 128)."
#define OMX_PARAM_UNITS_CLAP_ENCODED_KHZ "kHz" ///< Kilohertz, a frequency.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_KHZ. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_KHZ_TEXT_EN "Kilohertz, a frequency."
#define OMX_PARAM_UNITS_CLAP_ENCODED_MHZ "MHz" ///< Megahertz, a frequency.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_MHZ. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_MHZ_TEXT_EN "Megahertz, a frequency."
#define OMX_PARAM_UNITS_CLAP_ENCODED_FRAMES "frames" ///< Audio frames, one sample on each channel.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_FRAMES. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_FRAMES_TEXT_EN "Audio frames, one sample on each channel."
#define OMX_PARAM_UNITS_CLAP_ENCODED_BPM "bpm" ///< Beats per minute, a tempo.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_BPM. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_BPM_TEXT_EN "Beats per minute, a tempo."
#define OMX_PARAM_UNITS_CLAP_ENCODED_BAR "bar" ///< Bars, a musical length.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_BAR. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_BAR_TEXT_EN "Bars, a musical length."
#define OMX_PARAM_UNITS_CLAP_ENCODED_BEAT "beat" ///< Beats, a musical length.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_BEAT. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_BEAT_TEXT_EN "Beats, a musical length."
#define OMX_PARAM_UNITS_CLAP_ENCODED_M "m" ///< Metres, a length.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_M. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_M_TEXT_EN "Metres, a length."
#define OMX_PARAM_UNITS_CLAP_ENCODED_CM "cm" ///< Centimetres, a length.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_CM. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_CM_TEXT_EN "Centimetres, a length."
#define OMX_PARAM_UNITS_CLAP_ENCODED_MM "mm" ///< Millimetres, a length.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_MM. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_MM_TEXT_EN "Millimetres, a length."
#define OMX_PARAM_UNITS_CLAP_ENCODED_KM "km" ///< Kilometres, a length.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_KM. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_KM_TEXT_EN "Kilometres, a length."
#define OMX_PARAM_UNITS_CLAP_ENCODED_INCH "inch" ///< Inches, a length.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_INCH. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_INCH_TEXT_EN "Inches, a length."
#define OMX_PARAM_UNITS_CLAP_ENCODED_MILE "mile" ///< Miles, a length.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_MILE. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_MILE_TEXT_EN "Miles, a length."
#define OMX_PARAM_UNITS_CLAP_ENCODED_DEGREE "deg" ///< Degrees, an angle.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_DEGREE. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_DEGREE_TEXT_EN "Degrees, an angle."
#define OMX_PARAM_UNITS_CLAP_ENCODED_MIDI_NOTE "midiNote" ///< A MIDI note number.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_MIDI_NOTE. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_MIDI_NOTE_TEXT_EN "A MIDI note number."
#define OMX_PARAM_UNITS_CLAP_ENCODED_RATIO "ratio" ///< A ratio n:1, a compressor's or an expander's.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_RATIO. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_RATIO_TEXT_EN "A ratio n:1, a compressor's or an expander's."
#define OMX_PARAM_UNITS_CLAP_ENCODED_COEF "coef" ///< A coefficient, a plain multiplier with no unit of its own.
/** The source sentence (English) of OMX_PARAM_UNITS_CLAP_ENCODED_COEF. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_COEF_TEXT_EN "A coefficient, a plain multiplier with no unit of its own."
/** The number of words of PARAM_UNITS_CLAP_ENCODED. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_COUNT 33u
/** The words of PARAM_UNITS_CLAP_ENCODED in their declared order, as a C initializer list. */
#define OMX_PARAM_UNITS_CLAP_ENCODED_INIT { "dB", "dBFS", "ms", "s", "min", "Hz", "oct", "cents", "st", "percent", "none", "dBPerOct", "LUFS", "dBPerS", "dBTP", "dBu", "LU", "kHz", "MHz", "frames", "bpm", "bar", "beat", "m", "cm", "mm", "km", "inch", "mile", "deg", "midiNote", "ratio", "coef" }
/** Expands `X(code, "word", NAME)` once per word of PARAM_UNITS_CLAP_ENCODED, in order, the code being its place in the order. The standard units the CLAP extension org.openmixer.param-contract/1 encodes (docs/units.md, V23d B2): the ids that have a unit code at the CLAP level, each a word of PARAM_UNITS taken from it, in its order. omx-panel reads it to know whether a unit can be served; omx-clap's map check holds its code-to-id mapping onto it. The codes are omx-clap's; this item names none. */
#define OMX_PARAM_UNITS_CLAP_ENCODED(X) \
    X(0u, "dB", DB) X(1u, "dBFS", DBFS) X(2u, "ms", MS) X(3u, "s", S) \
    X(4u, "min", MIN) X(5u, "Hz", HZ) X(6u, "oct", OCT) X(7u, "cents", CENTS) \
    X(8u, "st", ST) X(9u, "percent", PERCENT) X(10u, "none", NONE) X(11u, "dBPerOct", DB_PER_OCT) \
    X(12u, "LUFS", LUFS) X(13u, "dBPerS", DB_PER_S) X(14u, "dBTP", DBTP) X(15u, "dBu", DBU) \
    X(16u, "LU", LU) X(17u, "kHz", KHZ) X(18u, "MHz", MHZ) X(19u, "frames", FRAMES) \
    X(20u, "bpm", BPM) X(21u, "bar", BAR) X(22u, "beat", BEAT) X(23u, "m", M) \
    X(24u, "cm", CM) X(25u, "mm", MM) X(26u, "km", KM) X(27u, "inch", INCH) \
    X(28u, "mile", MILE) X(29u, "deg", DEGREE) X(30u, "midiNote", MIDI_NOTE) X(31u, "ratio", RATIO) \
    X(32u, "coef", COEF)

/* PARAM_MEANINGS (contract.d/param/param.json) */
#define OMX_PARAM_MEANINGS_GAIN "gain" ///< A gain, a level change in dB or as a factor (LV2 param:gain).
/** The source sentence (English) of OMX_PARAM_MEANINGS_GAIN. */
#define OMX_PARAM_MEANINGS_GAIN_TEXT_EN "A gain."
#define OMX_PARAM_MEANINGS_THRESHOLD "threshold" ///< The level a dynamics process acts above or below (LV2 param:threshold).
/** The source sentence (English) of OMX_PARAM_MEANINGS_THRESHOLD. */
#define OMX_PARAM_MEANINGS_THRESHOLD_TEXT_EN "A threshold."
#define OMX_PARAM_MEANINGS_RATIO "ratio" ///< A dynamics ratio, n:1 (LV2 param:ratio).
/** The source sentence (English) of OMX_PARAM_MEANINGS_RATIO. */
#define OMX_PARAM_MEANINGS_RATIO_TEXT_EN "A dynamics ratio."
#define OMX_PARAM_MEANINGS_ATTACK "attack" ///< How fast a process engages (LV2 param:attack).
/** The source sentence (English) of OMX_PARAM_MEANINGS_ATTACK. */
#define OMX_PARAM_MEANINGS_ATTACK_TEXT_EN "An attack time."
#define OMX_PARAM_MEANINGS_RELEASE "release" ///< How fast a process lets go (LV2 param:release).
/** The source sentence (English) of OMX_PARAM_MEANINGS_RELEASE. */
#define OMX_PARAM_MEANINGS_RELEASE_TEXT_EN "A release time."
#define OMX_PARAM_MEANINGS_HOLD "hold" ///< How long a process holds before it releases (LV2 param:hold).
/** The source sentence (English) of OMX_PARAM_MEANINGS_HOLD. */
#define OMX_PARAM_MEANINGS_HOLD_TEXT_EN "A hold time."
#define OMX_PARAM_MEANINGS_DECAY "decay" ///< How fast a sound or an envelope dies away (LV2 param:decay).
/** The source sentence (English) of OMX_PARAM_MEANINGS_DECAY. */
#define OMX_PARAM_MEANINGS_DECAY_TEXT_EN "A decay time."
#define OMX_PARAM_MEANINGS_FREQUENCY "frequency" ///< A frequency: an EQ band's centre, an oscillator's pitch (LV2 param:frequency).
/** The source sentence (English) of OMX_PARAM_MEANINGS_FREQUENCY. */
#define OMX_PARAM_MEANINGS_FREQUENCY_TEXT_EN "A frequency."
#define OMX_PARAM_MEANINGS_CUTOFF_FREQUENCY "cutoffFrequency" ///< A filter's cutoff frequency (LV2 param:cutoffFrequency).
/** The source sentence (English) of OMX_PARAM_MEANINGS_CUTOFF_FREQUENCY. */
#define OMX_PARAM_MEANINGS_CUTOFF_FREQUENCY_TEXT_EN "A filter's cutoff frequency."
#define OMX_PARAM_MEANINGS_RESONANCE "resonance" ///< A filter's resonance (LV2 param:resonance).
/** The source sentence (English) of OMX_PARAM_MEANINGS_RESONANCE. */
#define OMX_PARAM_MEANINGS_RESONANCE_TEXT_EN "A filter's resonance."
#define OMX_PARAM_MEANINGS_BYPASS "bypass" ///< On when the process is bypassed (LV2 param:bypass); the inverse of enabled.
/** The source sentence (English) of OMX_PARAM_MEANINGS_BYPASS. */
#define OMX_PARAM_MEANINGS_BYPASS_TEXT_EN "On when the process is bypassed."
#define OMX_PARAM_MEANINGS_WET_DRY_RATIO "wetDryRatio" ///< The mix of a wet and a dry signal (LV2 param:wetDryRatio).
/** The source sentence (English) of OMX_PARAM_MEANINGS_WET_DRY_RATIO. */
#define OMX_PARAM_MEANINGS_WET_DRY_RATIO_TEXT_EN "The mix of a wet and a dry signal."
#define OMX_PARAM_MEANINGS_DELAY "delay" ///< A delay time (LV2 param:delay).
/** The source sentence (English) of OMX_PARAM_MEANINGS_DELAY. */
#define OMX_PARAM_MEANINGS_DELAY_TEXT_EN "A delay time."
#define OMX_PARAM_MEANINGS_ENABLED "enabled" ///< On when the process is on (LV2 lv2:enabled); the inverse of bypass.
/** The source sentence (English) of OMX_PARAM_MEANINGS_ENABLED. */
#define OMX_PARAM_MEANINGS_ENABLED_TEXT_EN "On when the process is on."
#define OMX_PARAM_MEANINGS_RANGE "range" ///< How far a process may act: a gate's or an expander's range.
/** The source sentence (English) of OMX_PARAM_MEANINGS_RANGE. */
#define OMX_PARAM_MEANINGS_RANGE_TEXT_EN "A gate's or an expander's range."
#define OMX_PARAM_MEANINGS_KNEE "knee" ///< How gradually a dynamics process engages around its threshold.
/** The source sentence (English) of OMX_PARAM_MEANINGS_KNEE. */
#define OMX_PARAM_MEANINGS_KNEE_TEXT_EN "A dynamics knee."
#define OMX_PARAM_MEANINGS_HYSTERESIS "hysteresis" ///< The gap between a gate's opening and closing levels.
/** The source sentence (English) of OMX_PARAM_MEANINGS_HYSTERESIS. */
#define OMX_PARAM_MEANINGS_HYSTERESIS_TEXT_EN "A gate's hysteresis."
#define OMX_PARAM_MEANINGS_MAKEUP "makeup" ///< The gain applied after a dynamics process.
/** The source sentence (English) of OMX_PARAM_MEANINGS_MAKEUP. */
#define OMX_PARAM_MEANINGS_MAKEUP_TEXT_EN "A makeup gain."
#define OMX_PARAM_MEANINGS_LOOKAHEAD "lookahead" ///< How far ahead a process reads its input.
/** The source sentence (English) of OMX_PARAM_MEANINGS_LOOKAHEAD. */
#define OMX_PARAM_MEANINGS_LOOKAHEAD_TEXT_EN "A lookahead time."
#define OMX_PARAM_MEANINGS_CEILING "ceiling" ///< The level a limiter's output never exceeds.
/** The source sentence (English) of OMX_PARAM_MEANINGS_CEILING. */
#define OMX_PARAM_MEANINGS_CEILING_TEXT_EN "A limiter's ceiling."
#define OMX_PARAM_MEANINGS_OUTPUT "output" ///< The output level of a process.
/** The source sentence (English) of OMX_PARAM_MEANINGS_OUTPUT. */
#define OMX_PARAM_MEANINGS_OUTPUT_TEXT_EN "An output level."
#define OMX_PARAM_MEANINGS_Q "q" ///< An EQ band's or a filter's quality factor.
/** The source sentence (English) of OMX_PARAM_MEANINGS_Q. */
#define OMX_PARAM_MEANINGS_Q_TEXT_EN "A quality factor, Q."
#define OMX_PARAM_MEANINGS_BANDWIDTH "bandwidth" ///< An EQ band's or a filter's width, in octaves; q is its quality factor.
/** The source sentence (English) of OMX_PARAM_MEANINGS_BANDWIDTH. */
#define OMX_PARAM_MEANINGS_BANDWIDTH_TEXT_EN "A bandwidth, in octaves."
#define OMX_PARAM_MEANINGS_SLOPE "slope" ///< How steeply a filter or a shelf rolls off.
/** The source sentence (English) of OMX_PARAM_MEANINGS_SLOPE. */
#define OMX_PARAM_MEANINGS_SLOPE_TEXT_EN "A filter's slope."
#define OMX_PARAM_MEANINGS_WIDTH "width" ///< A stereo width.
/** The source sentence (English) of OMX_PARAM_MEANINGS_WIDTH. */
#define OMX_PARAM_MEANINGS_WIDTH_TEXT_EN "A stereo width."
#define OMX_PARAM_MEANINGS_DRIVE "drive" ///< How hard a saturation or distortion is driven.
/** The source sentence (English) of OMX_PARAM_MEANINGS_DRIVE. */
#define OMX_PARAM_MEANINGS_DRIVE_TEXT_EN "A drive amount."
#define OMX_PARAM_MEANINGS_TONE "tone" ///< A tone control: a brightness or a darkness.
/** The source sentence (English) of OMX_PARAM_MEANINGS_TONE. */
#define OMX_PARAM_MEANINGS_TONE_TEXT_EN "A tone control."
#define OMX_PARAM_MEANINGS_RATE "rate" ///< The rate of a modulation, such as an LFO's speed.
/** The source sentence (English) of OMX_PARAM_MEANINGS_RATE. */
#define OMX_PARAM_MEANINGS_RATE_TEXT_EN "A modulation rate."
#define OMX_PARAM_MEANINGS_DEPTH "depth" ///< The depth of a modulation.
/** The source sentence (English) of OMX_PARAM_MEANINGS_DEPTH. */
#define OMX_PARAM_MEANINGS_DEPTH_TEXT_EN "A modulation depth."
#define OMX_PARAM_MEANINGS_FEEDBACK "feedback" ///< How much of a process's output feeds back into its input.
/** The source sentence (English) of OMX_PARAM_MEANINGS_FEEDBACK. */
#define OMX_PARAM_MEANINGS_FEEDBACK_TEXT_EN "A feedback amount."
#define OMX_PARAM_MEANINGS_SPREAD "spread" ///< How far voices or taps are spread apart.
/** The source sentence (English) of OMX_PARAM_MEANINGS_SPREAD. */
#define OMX_PARAM_MEANINGS_SPREAD_TEXT_EN "A spread."
#define OMX_PARAM_MEANINGS_PREDELAY "predelay" ///< The delay before a reverb's tail.
/** The source sentence (English) of OMX_PARAM_MEANINGS_PREDELAY. */
#define OMX_PARAM_MEANINGS_PREDELAY_TEXT_EN "A reverb's predelay."
#define OMX_PARAM_MEANINGS_SIZE "size" ///< A reverb's room size.
/** The source sentence (English) of OMX_PARAM_MEANINGS_SIZE. */
#define OMX_PARAM_MEANINGS_SIZE_TEXT_EN "A room size."
#define OMX_PARAM_MEANINGS_DAMPING "damping" ///< How fast a reverb's high frequencies die away.
/** The source sentence (English) of OMX_PARAM_MEANINGS_DAMPING. */
#define OMX_PARAM_MEANINGS_DAMPING_TEXT_EN "A reverb's damping."
#define OMX_PARAM_MEANINGS_LOW_CUT "lowCut" ///< A low cut, a high-pass corner.
/** The source sentence (English) of OMX_PARAM_MEANINGS_LOW_CUT. */
#define OMX_PARAM_MEANINGS_LOW_CUT_TEXT_EN "A low cut."
#define OMX_PARAM_MEANINGS_HIGH_CUT "highCut" ///< A high cut, a low-pass corner.
/** The source sentence (English) of OMX_PARAM_MEANINGS_HIGH_CUT. */
#define OMX_PARAM_MEANINGS_HIGH_CUT_TEXT_EN "A high cut."
#define OMX_PARAM_MEANINGS_SHIFT "shift" ///< A pitch or a frequency shift.
/** The source sentence (English) of OMX_PARAM_MEANINGS_SHIFT. */
#define OMX_PARAM_MEANINGS_SHIFT_TEXT_EN "A pitch or frequency shift."
#define OMX_PARAM_MEANINGS_FINE "fine" ///< A fine adjustment of another control.
/** The source sentence (English) of OMX_PARAM_MEANINGS_FINE. */
#define OMX_PARAM_MEANINGS_FINE_TEXT_EN "A fine adjustment."
#define OMX_PARAM_MEANINGS_SYNC "sync" ///< On when a time follows the host's tempo.
/** The source sentence (English) of OMX_PARAM_MEANINGS_SYNC. */
#define OMX_PARAM_MEANINGS_SYNC_TEXT_EN "On when a time follows the tempo."
#define OMX_PARAM_MEANINGS_DIVISION "division" ///< A note division a tempo-synced time takes.
/** The source sentence (English) of OMX_PARAM_MEANINGS_DIVISION. */
#define OMX_PARAM_MEANINGS_DIVISION_TEXT_EN "A note division."
#define OMX_PARAM_MEANINGS_LISTEN "listen" ///< On when the process's side signal is heard alone.
/** The source sentence (English) of OMX_PARAM_MEANINGS_LISTEN. */
#define OMX_PARAM_MEANINGS_LISTEN_TEXT_EN "On when the side signal is heard alone."
#define OMX_PARAM_MEANINGS_SHAPE "shape" ///< A choice of waveform or curve shape.
/** The source sentence (English) of OMX_PARAM_MEANINGS_SHAPE. */
#define OMX_PARAM_MEANINGS_SHAPE_TEXT_EN "A choice of shape."
#define OMX_PARAM_MEANINGS_MODEL "model" ///< A choice of the modelled unit.
/** The source sentence (English) of OMX_PARAM_MEANINGS_MODEL. */
#define OMX_PARAM_MEANINGS_MODEL_TEXT_EN "A choice of model."
#define OMX_PARAM_MEANINGS_ALGORITHM "algorithm" ///< A choice of algorithm.
/** The source sentence (English) of OMX_PARAM_MEANINGS_ALGORITHM. */
#define OMX_PARAM_MEANINGS_ALGORITHM_TEXT_EN "A choice of algorithm."
#define OMX_PARAM_MEANINGS_MODE "mode" ///< A choice of mode.
/** The source sentence (English) of OMX_PARAM_MEANINGS_MODE. */
#define OMX_PARAM_MEANINGS_MODE_TEXT_EN "A choice of mode."
#define OMX_PARAM_MEANINGS_TYPE "type" ///< A choice of type, such as a filter's.
/** The source sentence (English) of OMX_PARAM_MEANINGS_TYPE. */
#define OMX_PARAM_MEANINGS_TYPE_TEXT_EN "A choice of type."
#define OMX_PARAM_MEANINGS_PINGPONG "pingpong" ///< On when a delay bounces between the channels.
/** The source sentence (English) of OMX_PARAM_MEANINGS_PINGPONG. */
#define OMX_PARAM_MEANINGS_PINGPONG_TEXT_EN "On when a delay bounces between the channels."
#define OMX_PARAM_MEANINGS_AMOUNT "amount" ///< How strongly a process acts, from none to all of it: a balancer's pull toward its target.
/** The source sentence (English) of OMX_PARAM_MEANINGS_AMOUNT. */
#define OMX_PARAM_MEANINGS_AMOUNT_TEXT_EN "How strongly a process acts."
#define OMX_PARAM_MEANINGS_NUMBER "number" ///< How many of a repeated part a process runs: voices, delay taps, bands or stages.
/** The source sentence (English) of OMX_PARAM_MEANINGS_NUMBER. */
#define OMX_PARAM_MEANINGS_NUMBER_TEXT_EN "A number of voices, taps, bands or stages."
#define OMX_PARAM_MEANINGS_BALANCE "balance" ///< Where a signal sits between two sides: a pan between the left and right channels, or one part's level against another's.
/** The source sentence (English) of OMX_PARAM_MEANINGS_BALANCE. */
#define OMX_PARAM_MEANINGS_BALANCE_TEXT_EN "A pan or a balance between two sides."
#define OMX_PARAM_MEANINGS_LINK "link" ///< How a process ties its channels together: on when they act as one, or a choice of how they are linked.
/** The source sentence (English) of OMX_PARAM_MEANINGS_LINK. */
#define OMX_PARAM_MEANINGS_LINK_TEXT_EN "A channel link."
#define OMX_PARAM_MEANINGS_SOLO "solo" ///< On when one part of a process is heard alone, the others silent; listen is the side signal heard alone.
/** The source sentence (English) of OMX_PARAM_MEANINGS_SOLO. */
#define OMX_PARAM_MEANINGS_SOLO_TEXT_EN "On when one part is heard alone."
#define OMX_PARAM_MEANINGS_ORDER "order" ///< The order a chain's stages run in.
/** The source sentence (English) of OMX_PARAM_MEANINGS_ORDER. */
#define OMX_PARAM_MEANINGS_ORDER_TEXT_EN "A stage order."
#define OMX_PARAM_MEANINGS_ACCELERATION "acceleration" ///< How fast a moving part changes speed: a rotor's spin-up and slow-down.
/** The source sentence (English) of OMX_PARAM_MEANINGS_ACCELERATION. */
#define OMX_PARAM_MEANINGS_ACCELERATION_TEXT_EN "An acceleration."
#define OMX_PARAM_MEANINGS_DISPERSION "dispersion" ///< How far a process spreads a sound's frequencies apart in time: a spring's chirp.
/** The source sentence (English) of OMX_PARAM_MEANINGS_DISPERSION. */
#define OMX_PARAM_MEANINGS_DISPERSION_TEXT_EN "A dispersion."
#define OMX_PARAM_MEANINGS_WINDOW "window" ///< How long a stretch of signal a process reads or turns at once: a loudness window, a reverse reverb's swell.
/** The source sentence (English) of OMX_PARAM_MEANINGS_WINDOW. */
#define OMX_PARAM_MEANINGS_WINDOW_TEXT_EN "A window length."
#define OMX_PARAM_MEANINGS_UNKNOWN "unknown" ///< The plugin states no meaning: the control has no role and is bound to nothing.
/** The source sentence (English) of OMX_PARAM_MEANINGS_UNKNOWN. */
#define OMX_PARAM_MEANINGS_UNKNOWN_TEXT_EN "The plugin states no meaning."
/** The number of words of PARAM_MEANINGS. */
#define OMX_PARAM_MEANINGS_COUNT 57u
/** The words of PARAM_MEANINGS in their declared order, as a C initializer list. */
#define OMX_PARAM_MEANINGS_INIT { "gain", "threshold", "ratio", "attack", "release", "hold", "decay", "frequency", "cutoffFrequency", "resonance", "bypass", "wetDryRatio", "delay", "enabled", "range", "knee", "hysteresis", "makeup", "lookahead", "ceiling", "output", "q", "bandwidth", "slope", "width", "drive", "tone", "rate", "depth", "feedback", "spread", "predelay", "size", "damping", "lowCut", "highCut", "shift", "fine", "sync", "division", "listen", "shape", "model", "algorithm", "mode", "type", "pingpong", "amount", "number", "balance", "link", "solo", "order", "acceleration", "dispersion", "window", "unknown" }
/** Expands `X(code, "word", NAME)` once per word of PARAM_MEANINGS, in order, the code being its place in the order. What a descriptor control does, its ROLE (docs/descriptors.md, "Meanings"; ruling R1 of 2026-11-24 on omx-contract#61: declare, don't infer): required on every control, a closed list, one word per meaning. Where LV2's param: vocabulary or lv2:designation has the term the word carries its name. The schema's $defs.meaning enum is these words in this order (tools/unit-enum.mjs). `unknown`: the plugin states none, and a consumer binds nothing to it. */
#define OMX_PARAM_MEANINGS(X) \
    X(0u, "gain", GAIN) X(1u, "threshold", THRESHOLD) X(2u, "ratio", RATIO) X(3u, "attack", ATTACK) \
    X(4u, "release", RELEASE) X(5u, "hold", HOLD) X(6u, "decay", DECAY) X(7u, "frequency", FREQUENCY) \
    X(8u, "cutoffFrequency", CUTOFF_FREQUENCY) X(9u, "resonance", RESONANCE) X(10u, "bypass", BYPASS) X(11u, "wetDryRatio", WET_DRY_RATIO) \
    X(12u, "delay", DELAY) X(13u, "enabled", ENABLED) X(14u, "range", RANGE) X(15u, "knee", KNEE) \
    X(16u, "hysteresis", HYSTERESIS) X(17u, "makeup", MAKEUP) X(18u, "lookahead", LOOKAHEAD) X(19u, "ceiling", CEILING) \
    X(20u, "output", OUTPUT) X(21u, "q", Q) X(22u, "bandwidth", BANDWIDTH) X(23u, "slope", SLOPE) \
    X(24u, "width", WIDTH) X(25u, "drive", DRIVE) X(26u, "tone", TONE) X(27u, "rate", RATE) \
    X(28u, "depth", DEPTH) X(29u, "feedback", FEEDBACK) X(30u, "spread", SPREAD) X(31u, "predelay", PREDELAY) \
    X(32u, "size", SIZE) X(33u, "damping", DAMPING) X(34u, "lowCut", LOW_CUT) X(35u, "highCut", HIGH_CUT) \
    X(36u, "shift", SHIFT) X(37u, "fine", FINE) X(38u, "sync", SYNC) X(39u, "division", DIVISION) \
    X(40u, "listen", LISTEN) X(41u, "shape", SHAPE) X(42u, "model", MODEL) X(43u, "algorithm", ALGORITHM) \
    X(44u, "mode", MODE) X(45u, "type", TYPE) X(46u, "pingpong", PINGPONG) X(47u, "amount", AMOUNT) \
    X(48u, "number", NUMBER) X(49u, "balance", BALANCE) X(50u, "link", LINK) X(51u, "solo", SOLO) \
    X(52u, "order", ORDER) X(53u, "acceleration", ACCELERATION) X(54u, "dispersion", DISPERSION) X(55u, "window", WINDOW) \
    X(56u, "unknown", UNKNOWN)

/* PARAM_FILTER_RESPONSES (contract.d/param/param.json) */
#define OMX_PARAM_FILTER_RESPONSES_PEAKING "peaking" ///< A peaking response, a bell: a boost or a cut around a centre frequency.
/** The source sentence (English) of OMX_PARAM_FILTER_RESPONSES_PEAKING. */
#define OMX_PARAM_FILTER_RESPONSES_PEAKING_TEXT_EN "A peaking filter."
#define OMX_PARAM_FILTER_RESPONSES_LOW_SHELF "lowShelf" ///< A low shelf: a boost or a cut of everything below a corner frequency.
/** The source sentence (English) of OMX_PARAM_FILTER_RESPONSES_LOW_SHELF. */
#define OMX_PARAM_FILTER_RESPONSES_LOW_SHELF_TEXT_EN "A low shelf."
#define OMX_PARAM_FILTER_RESPONSES_HIGH_SHELF "highShelf" ///< A high shelf: a boost or a cut of everything above a corner frequency.
/** The source sentence (English) of OMX_PARAM_FILTER_RESPONSES_HIGH_SHELF. */
#define OMX_PARAM_FILTER_RESPONSES_HIGH_SHELF_TEXT_EN "A high shelf."
#define OMX_PARAM_FILTER_RESPONSES_HIGHPASS "highpass" ///< A high-pass: passes what is above its cutoff and cuts what is below it, an EQ's low edge.
/** The source sentence (English) of OMX_PARAM_FILTER_RESPONSES_HIGHPASS. */
#define OMX_PARAM_FILTER_RESPONSES_HIGHPASS_TEXT_EN "A high-pass filter."
#define OMX_PARAM_FILTER_RESPONSES_LOWPASS "lowpass" ///< A low-pass: passes what is below its cutoff and cuts what is above it, an EQ's high edge.
/** The source sentence (English) of OMX_PARAM_FILTER_RESPONSES_LOWPASS. */
#define OMX_PARAM_FILTER_RESPONSES_LOWPASS_TEXT_EN "A low-pass filter."
#define OMX_PARAM_FILTER_RESPONSES_NOTCH "notch" ///< A notch: a narrow null at its centre frequency.
/** The source sentence (English) of OMX_PARAM_FILTER_RESPONSES_NOTCH. */
#define OMX_PARAM_FILTER_RESPONSES_NOTCH_TEXT_EN "A notch filter."
#define OMX_PARAM_FILTER_RESPONSES_BANDPASS "bandpass" ///< A band-pass: passes a band around its centre frequency and cuts either side of it.
/** The source sentence (English) of OMX_PARAM_FILTER_RESPONSES_BANDPASS. */
#define OMX_PARAM_FILTER_RESPONSES_BANDPASS_TEXT_EN "A band-pass filter."
#define OMX_PARAM_FILTER_RESPONSES_ALLPASS1 "allpass1" ///< A first-order all-pass: every frequency at unity gain, its phase turned around a corner frequency.
/** The source sentence (English) of OMX_PARAM_FILTER_RESPONSES_ALLPASS1. */
#define OMX_PARAM_FILTER_RESPONSES_ALLPASS1_TEXT_EN "A first-order all-pass filter."
#define OMX_PARAM_FILTER_RESPONSES_ALLPASS2 "allpass2" ///< A second-order all-pass: every frequency at unity gain, its phase turned around a centre frequency.
/** The source sentence (English) of OMX_PARAM_FILTER_RESPONSES_ALLPASS2. */
#define OMX_PARAM_FILTER_RESPONSES_ALLPASS2_TEXT_EN "A second-order all-pass filter."
/** The number of words of PARAM_FILTER_RESPONSES. */
#define OMX_PARAM_FILTER_RESPONSES_COUNT 9u
/** The words of PARAM_FILTER_RESPONSES in their declared order, as a C initializer list. */
#define OMX_PARAM_FILTER_RESPONSES_INIT { "peaking", "lowShelf", "highShelf", "highpass", "lowpass", "notch", "bandpass", "allpass1", "allpass2" }
/** Expands `X(code, "word", NAME)` once per word of PARAM_FILTER_RESPONSES, in order, the code being its place in the order. The response of the filter a descriptor control sets (docs/descriptors.md, "Filter responses"; omx-contract#208): optional on a control, a closed list, one word per shape. omx-dsp's EQ design reads these words' codes for the section kinds it builds (omx_eq_kind, through this item's render), so a word's code is the integer a kernel reads for it and is never moved. A consumer finds an EQ's edges by these words (highpass, lowpass), never by a word in a control's name. The schema's $defs.filterResponse enum is these words in this order (tools/unit-enum.mjs). */
#define OMX_PARAM_FILTER_RESPONSES(X) \
    X(0u, "peaking", PEAKING) X(1u, "lowShelf", LOW_SHELF) X(2u, "highShelf", HIGH_SHELF) X(3u, "highpass", HIGHPASS) \
    X(4u, "lowpass", LOWPASS) X(5u, "notch", NOTCH) X(6u, "bandpass", BANDPASS) X(7u, "allpass1", ALLPASS1) \
    X(8u, "allpass2", ALLPASS2)

#endif /* OMX_VOCABULARY_H */
