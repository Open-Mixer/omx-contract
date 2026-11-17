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

/**
 * @name CURVE_AXES (data/curves.json)
 * The axes a curve kind is drawn on, each with its unit and how a host draws it (docs/curves.md). A curve's values are in these units, so the drawn values can be held equal to the closed form a kernel's controls give. (since 3.1.0)
 */
/// @{
#define OMX_CURVE_AXES_FREQUENCY "frequency" ///< Frequency, on the points of EQ_CURVE_GRID where the curve is a response.
/** The English sentence of OMX_CURVE_AXES_FREQUENCY, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_CURVE_AXES_FREQUENCY_TEXT_EN "Frequency, on the points of EQ_CURVE_GRID where the curve is a response."
#define OMX_CURVE_AXES_MAGNITUDE "magnitude" ///< The magnitude of a response at a frequency: 0 dB is unity, a boost positive, a cut negative.
/** The English sentence of OMX_CURVE_AXES_MAGNITUDE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_CURVE_AXES_MAGNITUDE_TEXT_EN "The magnitude of a response at a frequency: 0 dB is unity, a boost positive, a cut negative."
#define OMX_CURVE_AXES_INPUT_LEVEL "input-level" ///< The level a gain computer reads, the static law's input.
/** The English sentence of OMX_CURVE_AXES_INPUT_LEVEL, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_CURVE_AXES_INPUT_LEVEL_TEXT_EN "The level a gain computer reads, the static law's input."
#define OMX_CURVE_AXES_OUTPUT_LEVEL "output-level" ///< The level the static law gives for an input level; the diagonal is no gain change.
/** The English sentence of OMX_CURVE_AXES_OUTPUT_LEVEL, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_CURVE_AXES_OUTPUT_LEVEL_TEXT_EN "The level the static law gives for an input level; the diagonal is no gain change."
#define OMX_CURVE_AXES_INPUT_AMPLITUDE "input-amplitude" ///< A memoryless shaper's input sample, linear, -1 to +1 full scale: bipolar, so an even/odd asymmetry shows.
/** The English sentence of OMX_CURVE_AXES_INPUT_AMPLITUDE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_CURVE_AXES_INPUT_AMPLITUDE_TEXT_EN "A memoryless shaper's input sample, linear, -1 to +1 full scale: bipolar, so an even/odd asymmetry shows."
#define OMX_CURVE_AXES_OUTPUT_AMPLITUDE "output-amplitude" ///< The shaper's output sample for an input amplitude, linear, on the same full scale.
/** The English sentence of OMX_CURVE_AXES_OUTPUT_AMPLITUDE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_CURVE_AXES_OUTPUT_AMPLITUDE_TEXT_EN "The shaper's output sample for an input amplitude, linear, on the same full scale."
#define OMX_CURVE_AXES_DELAY_TIME "delay-time" ///< The time after the dry sound at which a delay's tap or repeat sounds.
/** The English sentence of OMX_CURVE_AXES_DELAY_TIME, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_CURVE_AXES_DELAY_TIME_TEXT_EN "The time after the dry sound at which a delay's tap or repeat sounds."
#define OMX_CURVE_AXES_DECAY_TIME "decay-time" ///< The time after an impulse over which a reverb's energy decays.
/** The English sentence of OMX_CURVE_AXES_DECAY_TIME, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_CURVE_AXES_DECAY_TIME_TEXT_EN "The time after an impulse over which a reverb's energy decays."
#define OMX_CURVE_AXES_LEVEL "level" ///< A level relative to the dry input: 0 dB is the input's own, a tap or a decay below it negative.
/** The English sentence of OMX_CURVE_AXES_LEVEL, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_CURVE_AXES_LEVEL_TEXT_EN "A level relative to the dry input: 0 dB is the input's own, a tap or a decay below it negative."
#define OMX_CURVE_AXES_PHASE "phase" ///< The position within one period of a modulation source, 0 to 1.
/** The English sentence of OMX_CURVE_AXES_PHASE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_CURVE_AXES_PHASE_TEXT_EN "The position within one period of a modulation source, 0 to 1."
#define OMX_CURVE_AXES_MODULATION "modulation" ///< A modulation source's output at a phase, -1 to +1, before the depth scales it.
/** The English sentence of OMX_CURVE_AXES_MODULATION, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_CURVE_AXES_MODULATION_TEXT_EN "A modulation source's output at a phase, -1 to +1, before the depth scales it."
#define OMX_CURVE_AXES_INPUT_PITCH "input-pitch" ///< The pitch played into a pitch effect, semitones from an origin the host picks.
/** The English sentence of OMX_CURVE_AXES_INPUT_PITCH, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_CURVE_AXES_INPUT_PITCH_TEXT_EN "The pitch played into a pitch effect, semitones from an origin the host picks."
#define OMX_CURVE_AXES_OUTPUT_PITCH "output-pitch" ///< The pitch the effect sounds for an input pitch, semitones on the same origin: an unshifted map is the diagonal.
/** The English sentence of OMX_CURVE_AXES_OUTPUT_PITCH, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_CURVE_AXES_OUTPUT_PITCH_TEXT_EN "The pitch the effect sounds for an input pitch, semitones on the same origin: an unshifted map is the diagonal."
/** The number of words of CURVE_AXES, the length of OMX_CURVE_AXES_INIT. */
#define OMX_CURVE_AXES_COUNT 13u
/** The words of CURVE_AXES in declaration order, an initialiser of const char *. */
#define OMX_CURVE_AXES_INIT { "frequency", "magnitude", "input-level", "output-level", "input-amplitude", "output-amplitude", "delay-time", "decay-time", "level", "phase", "modulation", "input-pitch", "output-pitch" }
/// @}

/**
 * @name CURVE_KINDS (data/curves.json)
 * The kinds of picture a plugin's panel section draws and a console's card shows, each with the two axes it is drawn on (docs/curves.md). A kernel file and a plugin declaration name a kind by its word; a host keeps only its kind-to-drawing map. Append-only: a kind is never renamed, moved or removed while a reader draws it. (since 3.1.0)
 */
/// @{
#define OMX_CURVE_KINDS_EQ_CURVE "eq-curve" ///< An EQ's summed magnitude response over log frequency.
/** The English sentence of OMX_CURVE_KINDS_EQ_CURVE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_CURVE_KINDS_EQ_CURVE_TEXT_EN "An EQ's summed magnitude response over log frequency."
#define OMX_CURVE_KINDS_DYNAMICS_CURVE "dynamics-curve" ///< A gate's or a compressor's static law, input level to output level, with the live needle.
/** The English sentence of OMX_CURVE_KINDS_DYNAMICS_CURVE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_CURVE_KINDS_DYNAMICS_CURVE_TEXT_EN "A gate's or a compressor's static law, input level to output level, with the live needle."
#define OMX_CURVE_KINDS_TRANSFER_CURVE "transfer-curve" ///< A memoryless shaper's transfer, input sample to output sample over full scale.
/** The English sentence of OMX_CURVE_KINDS_TRANSFER_CURVE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_CURVE_KINDS_TRANSFER_CURVE_TEXT_EN "A memoryless shaper's transfer, input sample to output sample over full scale."
#define OMX_CURVE_KINDS_DELAY_TAPS "delay-taps" ///< A delay's taps and repeats, each a line at its time and level.
/** The English sentence of OMX_CURVE_KINDS_DELAY_TAPS, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_CURVE_KINDS_DELAY_TAPS_TEXT_EN "A delay's taps and repeats, each a line at its time and level."
#define OMX_CURVE_KINDS_DECAY_ENVELOPE "decay-envelope" ///< A reverb's decay envelope after an impulse.
/** The English sentence of OMX_CURVE_KINDS_DECAY_ENVELOPE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_CURVE_KINDS_DECAY_ENVELOPE_TEXT_EN "A reverb's decay envelope after an impulse."
#define OMX_CURVE_KINDS_COMB_RESPONSE "comb-response" ///< The wet path's comb or notch response at the current sweep position (chorus, flanger, phaser, doubler).
/** The English sentence of OMX_CURVE_KINDS_COMB_RESPONSE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_CURVE_KINDS_COMB_RESPONSE_TEXT_EN "The wet path's comb or notch response at the current sweep position (chorus, flanger, phaser, doubler)."
#define OMX_CURVE_KINDS_MODULATION_SHAPE "modulation-shape" ///< A modulation source over one period (tremolo, rotary).
/** The English sentence of OMX_CURVE_KINDS_MODULATION_SHAPE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_CURVE_KINDS_MODULATION_SHAPE_TEXT_EN "A modulation source over one period (tremolo, rotary)."
#define OMX_CURVE_KINDS_INTERVAL_MAP "interval-map" ///< A pitch effect's map from the input pitch to the output pitch.
/** The English sentence of OMX_CURVE_KINDS_INTERVAL_MAP, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_CURVE_KINDS_INTERVAL_MAP_TEXT_EN "A pitch effect's map from the input pitch to the output pitch."
/** The number of words of CURVE_KINDS, the length of OMX_CURVE_KINDS_INIT. */
#define OMX_CURVE_KINDS_COUNT 8u
/** The words of CURVE_KINDS in declaration order, an initialiser of const char *. */
#define OMX_CURVE_KINDS_INIT { "eq-curve", "dynamics-curve", "transfer-curve", "delay-taps", "decay-envelope", "comb-response", "modulation-shape", "interval-map" }
/// @}

/**
 * @name MACHINE_CLASS_FIELDS (data/machine-class.json)
 * What identifies the machine a figure was taken on (plugin-qualify#115): a verdict for a host profile reads only figures of the class it names. (since 2.18.0)
 */
/// @{
#define OMX_MACHINE_CLASS_FIELDS_ARCH "arch" ///< The machine architecture as uname -m names it.
/** The English sentence of OMX_MACHINE_CLASS_FIELDS_ARCH, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_CLASS_FIELDS_ARCH_TEXT_EN "The machine architecture, as uname -m names it."
#define OMX_MACHINE_CLASS_FIELDS_FAMILY "family" ///< The CPU family and model.
/** The English sentence of OMX_MACHINE_CLASS_FIELDS_FAMILY, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_CLASS_FIELDS_FAMILY_TEXT_EN "The CPU family and model."
#define OMX_MACHINE_CLASS_FIELDS_CORE_BAND "coreBand" ///< The cores, as a band of MACHINE_CORE_BANDS.
/** The English sentence of OMX_MACHINE_CLASS_FIELDS_CORE_BAND, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_CLASS_FIELDS_CORE_BAND_TEXT_EN "The core count, as a band of MACHINE_CORE_BANDS."
#define OMX_MACHINE_CLASS_FIELDS_CLOCK_BAND "clockBand" ///< The clock, as a band of MACHINE_CLOCK_BANDS.
/** The English sentence of OMX_MACHINE_CLASS_FIELDS_CLOCK_BAND, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_CLASS_FIELDS_CLOCK_BAND_TEXT_EN "The clock, as a band of MACHINE_CLOCK_BANDS."
#define OMX_MACHINE_CLASS_FIELDS_PREEMPT_RT "preemptRt" ///< Whether the kernel is PREEMPT_RT.
/** The English sentence of OMX_MACHINE_CLASS_FIELDS_PREEMPT_RT, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_CLASS_FIELDS_PREEMPT_RT_TEXT_EN "Whether the kernel is PREEMPT_RT."
#define OMX_MACHINE_CLASS_FIELDS_CSTATES_LIMITED "cstatesLimited" ///< Whether the deep idle states are limited.
/** The English sentence of OMX_MACHINE_CLASS_FIELDS_CSTATES_LIMITED, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_CLASS_FIELDS_CSTATES_LIMITED_TEXT_EN "Whether the deep idle states are limited."
/** The number of words of MACHINE_CLASS_FIELDS, the length of OMX_MACHINE_CLASS_FIELDS_INIT. */
#define OMX_MACHINE_CLASS_FIELDS_COUNT 6u
/** The words of MACHINE_CLASS_FIELDS in declaration order, an initialiser of const char *. */
#define OMX_MACHINE_CLASS_FIELDS_INIT { "arch", "family", "coreBand", "clockBand", "preemptRt", "cstatesLimited" }
/// @}

/**
 * @name MACHINE_PROFILE_FIELDS (data/machine-class.json)
 * How the machine was set when a figure was taken: the frequency policy and isolation a figure depends on. (since 2.18.0)
 */
/// @{
#define OMX_MACHINE_PROFILE_FIELDS_GOVERNOR "governor" ///< The CPU frequency governor in effect when the figure was taken.
/** The English sentence of OMX_MACHINE_PROFILE_FIELDS_GOVERNOR, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_PROFILE_FIELDS_GOVERNOR_TEXT_EN "The CPU frequency governor in effect when the figure was taken."
#define OMX_MACHINE_PROFILE_FIELDS_TURBO "turbo" ///< Whether turbo or boost clocking was enabled when the figure was taken.
/** The English sentence of OMX_MACHINE_PROFILE_FIELDS_TURBO, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_PROFILE_FIELDS_TURBO_TEXT_EN "Whether turbo or boost clocking was enabled when the figure was taken."
#define OMX_MACHINE_PROFILE_FIELDS_SMT "smt" ///< Whether simultaneous multithreading was enabled when the figure was taken.
/** The English sentence of OMX_MACHINE_PROFILE_FIELDS_SMT, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_PROFILE_FIELDS_SMT_TEXT_EN "Whether simultaneous multithreading was enabled when the figure was taken."
#define OMX_MACHINE_PROFILE_FIELDS_PREEMPT "preempt" ///< Whether the measuring thread ran under real-time preemption, or scheduled as any other thread.
/** The English sentence of OMX_MACHINE_PROFILE_FIELDS_PREEMPT, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_PROFILE_FIELDS_PREEMPT_TEXT_EN "Whether the measuring thread ran under real-time preemption, or scheduled as any other thread."
#define OMX_MACHINE_PROFILE_FIELDS_CPUIDLE "cpuidle" ///< The CPU idle driver or policy in effect when the figure was taken.
/** The English sentence of OMX_MACHINE_PROFILE_FIELDS_CPUIDLE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_PROFILE_FIELDS_CPUIDLE_TEXT_EN "The CPU idle driver or policy in effect when the figure was taken."
/** The number of words of MACHINE_PROFILE_FIELDS, the length of OMX_MACHINE_PROFILE_FIELDS_INIT. */
#define OMX_MACHINE_PROFILE_FIELDS_COUNT 5u
/** The words of MACHINE_PROFILE_FIELDS in declaration order, an initialiser of const char *. */
#define OMX_MACHINE_PROFILE_FIELDS_INIT { "governor", "turbo", "smt", "preempt", "cpuidle" }
/// @}

/**
 * @name MACHINE_CORE_BANDS (data/machine-class.json)
 * The bands a machine's core count falls in, ascending. (since 2.18.0)
 */
/// @{
#define OMX_MACHINE_CORE_BANDS_CORES1_TO2 "1-2" ///< A machine with 1 to 2 cores.
/** The English sentence of OMX_MACHINE_CORE_BANDS_CORES1_TO2, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_CORE_BANDS_CORES1_TO2_TEXT_EN "A machine with 1 to 2 cores."
#define OMX_MACHINE_CORE_BANDS_CORES3_TO4 "3-4" ///< A machine with 3 to 4 cores.
/** The English sentence of OMX_MACHINE_CORE_BANDS_CORES3_TO4, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_CORE_BANDS_CORES3_TO4_TEXT_EN "A machine with 3 to 4 cores."
#define OMX_MACHINE_CORE_BANDS_CORES5_TO8 "5-8" ///< A machine with 5 to 8 cores.
/** The English sentence of OMX_MACHINE_CORE_BANDS_CORES5_TO8, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_CORE_BANDS_CORES5_TO8_TEXT_EN "A machine with 5 to 8 cores."
#define OMX_MACHINE_CORE_BANDS_CORES9_TO16 "9-16" ///< A machine with 9 to 16 cores.
/** The English sentence of OMX_MACHINE_CORE_BANDS_CORES9_TO16, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_CORE_BANDS_CORES9_TO16_TEXT_EN "A machine with 9 to 16 cores."
#define OMX_MACHINE_CORE_BANDS_CORES17_TO32 "17-32" ///< A machine with 17 to 32 cores.
/** The English sentence of OMX_MACHINE_CORE_BANDS_CORES17_TO32, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_CORE_BANDS_CORES17_TO32_TEXT_EN "A machine with 17 to 32 cores."
#define OMX_MACHINE_CORE_BANDS_CORES33_UP "33+" ///< A machine with 33 or more cores.
/** The English sentence of OMX_MACHINE_CORE_BANDS_CORES33_UP, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_CORE_BANDS_CORES33_UP_TEXT_EN "A machine with 33 or more cores."
/** The number of words of MACHINE_CORE_BANDS, the length of OMX_MACHINE_CORE_BANDS_INIT. */
#define OMX_MACHINE_CORE_BANDS_COUNT 6u
/** The words of MACHINE_CORE_BANDS in declaration order, an initialiser of const char *. */
#define OMX_MACHINE_CORE_BANDS_INIT { "1-2", "3-4", "5-8", "9-16", "17-32", "33+" }
/// @}

/**
 * @name MACHINE_CLOCK_BANDS (data/machine-class.json)
 * The bands a machine's clock falls in, ascending. (since 2.18.0)
 */
/// @{
#define OMX_MACHINE_CLOCK_BANDS_UNDER1500_MHZ "<1.5GHz" ///< A machine clocked under 1.5 GHz.
/** The English sentence of OMX_MACHINE_CLOCK_BANDS_UNDER1500_MHZ, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_CLOCK_BANDS_UNDER1500_MHZ_TEXT_EN "A machine clocked under 1.5 GHz."
#define OMX_MACHINE_CLOCK_BANDS_FROM1500_TO2500_MHZ "1.5-2.5GHz" ///< A machine clocked from 1.5 to 2.5 GHz.
/** The English sentence of OMX_MACHINE_CLOCK_BANDS_FROM1500_TO2500_MHZ, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_CLOCK_BANDS_FROM1500_TO2500_MHZ_TEXT_EN "A machine clocked from 1.5 to 2.5 GHz."
#define OMX_MACHINE_CLOCK_BANDS_FROM2500_TO3500_MHZ "2.5-3.5GHz" ///< A machine clocked from 2.5 to 3.5 GHz.
/** The English sentence of OMX_MACHINE_CLOCK_BANDS_FROM2500_TO3500_MHZ, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_CLOCK_BANDS_FROM2500_TO3500_MHZ_TEXT_EN "A machine clocked from 2.5 to 3.5 GHz."
#define OMX_MACHINE_CLOCK_BANDS_FROM3500_TO4500_MHZ "3.5-4.5GHz" ///< A machine clocked from 3.5 to 4.5 GHz.
/** The English sentence of OMX_MACHINE_CLOCK_BANDS_FROM3500_TO4500_MHZ, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_CLOCK_BANDS_FROM3500_TO4500_MHZ_TEXT_EN "A machine clocked from 3.5 to 4.5 GHz."
#define OMX_MACHINE_CLOCK_BANDS_FROM4500_MHZ "4.5GHz+" ///< A machine clocked at 4.5 GHz or more.
/** The English sentence of OMX_MACHINE_CLOCK_BANDS_FROM4500_MHZ, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_CLOCK_BANDS_FROM4500_MHZ_TEXT_EN "A machine clocked at 4.5 GHz or more."
/** The number of words of MACHINE_CLOCK_BANDS, the length of OMX_MACHINE_CLOCK_BANDS_INIT. */
#define OMX_MACHINE_CLOCK_BANDS_COUNT 5u
/** The words of MACHINE_CLOCK_BANDS in declaration order, an initialiser of const char *. */
#define OMX_MACHINE_CLOCK_BANDS_INIT { "<1.5GHz", "1.5-2.5GHz", "2.5-3.5GHz", "3.5-4.5GHz", "4.5GHz+" }
/// @}

/**
 * @name MACHINE_ARCHES (data/machine-class.json)
 * The architectures a host profile names, as uname -m spells them. (since 2.18.0)
 */
/// @{
#define OMX_MACHINE_ARCHES_X8664 "x86_64" ///< An x86-64 machine, as uname -m spells it.
/** The English sentence of OMX_MACHINE_ARCHES_X8664, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_ARCHES_X8664_TEXT_EN "An x86-64 machine, as uname -m spells it."
#define OMX_MACHINE_ARCHES_AARCH64 "aarch64" ///< An AArch64 machine, as uname -m spells it.
/** The English sentence of OMX_MACHINE_ARCHES_AARCH64, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_ARCHES_AARCH64_TEXT_EN "An AArch64 machine, as uname -m spells it."
/** The number of words of MACHINE_ARCHES, the length of OMX_MACHINE_ARCHES_INIT. */
#define OMX_MACHINE_ARCHES_COUNT 2u
/** The words of MACHINE_ARCHES in declaration order, an initialiser of const char *. */
#define OMX_MACHINE_ARCHES_INIT { "x86_64", "aarch64" }
/// @}

/**
 * @name MACHINE_CLASSES (data/machine-class.json)
 * The machine classes a host profile budgets for (plugin-qualify#114, #115): the desk, and the Raspberry Pi 4 and 5 a small console runs on. (since 2.18.0)
 */
/// @{
#define OMX_MACHINE_CLASSES_DESK "desk" ///< An x86-64 desk.
/** The English sentence of OMX_MACHINE_CLASSES_DESK, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_CLASSES_DESK_TEXT_EN "An x86-64 desk."
#define OMX_MACHINE_CLASSES_RASPBERRY_PI4 "raspberry-pi-4" ///< A Raspberry Pi 4, aarch64.
/** The English sentence of OMX_MACHINE_CLASSES_RASPBERRY_PI4, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_CLASSES_RASPBERRY_PI4_TEXT_EN "A Raspberry Pi 4, aarch64."
#define OMX_MACHINE_CLASSES_RASPBERRY_PI5 "raspberry-pi-5" ///< A Raspberry Pi 5, aarch64.
/** The English sentence of OMX_MACHINE_CLASSES_RASPBERRY_PI5, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MACHINE_CLASSES_RASPBERRY_PI5_TEXT_EN "A Raspberry Pi 5, aarch64."
/** The number of words of MACHINE_CLASSES, the length of OMX_MACHINE_CLASSES_INIT. */
#define OMX_MACHINE_CLASSES_COUNT 3u
/** The words of MACHINE_CLASSES in declaration order, an initialiser of const char *. */
#define OMX_MACHINE_CLASSES_INIT { "desk", "raspberry-pi-4", "raspberry-pi-5" }
/// @}

/**
 * @name MEASUREMENT_DIMENSIONS (data/measurement.json)
 * The measurable dimensions a measurement document declares it covers: latency and cost since the format's 1.0, stability, RT safety and features since 1.1, for the hosting verdict. (since 2.18.0)
 */
/// @{
#define OMX_MEASUREMENT_DIMENSIONS_LATENCY "latency" ///< How long a plugin takes to produce its first sound after it is driven or played.
/** The English sentence of OMX_MEASUREMENT_DIMENSIONS_LATENCY, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_DIMENSIONS_LATENCY_TEXT_EN "How long a plugin takes to produce its first sound after it is driven or played."
#define OMX_MEASUREMENT_DIMENSIONS_COST "cost" ///< How much CPU time a plugin spends per block under a sustained stimulus.
/** The English sentence of OMX_MEASUREMENT_DIMENSIONS_COST, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_DIMENSIONS_COST_TEXT_EN "How much CPU time a plugin spends per block under a sustained stimulus."
#define OMX_MEASUREMENT_DIMENSIONS_STABILITY "stability" ///< Whether a plugin instantiates, processes and tears down without crashing or producing non-finite output.
/** The English sentence of OMX_MEASUREMENT_DIMENSIONS_STABILITY, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_DIMENSIONS_STABILITY_TEXT_EN "Whether a plugin instantiates, processes and tears down without crashing or producing non-finite output."
#define OMX_MEASUREMENT_DIMENSIONS_RT_SAFETY "rtSafety" ///< Whether a plugin's audio thread avoids locks, allocation and other calls a real-time thread must not make.
/** The English sentence of OMX_MEASUREMENT_DIMENSIONS_RT_SAFETY, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_DIMENSIONS_RT_SAFETY_TEXT_EN "Whether a plugin's audio thread avoids locks, allocation and other calls a real-time thread must not make."
#define OMX_MEASUREMENT_DIMENSIONS_FEATURES "features" ///< What capabilities a plugin declares and a prober can confirm, beside latency, cost, stability and RT safety.
/** The English sentence of OMX_MEASUREMENT_DIMENSIONS_FEATURES, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_DIMENSIONS_FEATURES_TEXT_EN "What capabilities a plugin declares and a prober can confirm, beside latency, cost, stability and RT safety."
/** The number of words of MEASUREMENT_DIMENSIONS, the length of OMX_MEASUREMENT_DIMENSIONS_INIT. */
#define OMX_MEASUREMENT_DIMENSIONS_COUNT 5u
/** The words of MEASUREMENT_DIMENSIONS in declaration order, an initialiser of const char *. */
#define OMX_MEASUREMENT_DIMENSIONS_INIT { "latency", "cost", "stability", "rtSafety", "features" }
/// @}

/**
 * @name MEASUREMENT_UNMEASURED_KINDS (data/measurement.json)
 * What an absent figure means for a merge, the one distinction that changes behaviour: a property of the plugin, a failure of this run, or a dimension the run did not cover. (since 2.18.0)
 */
/// @{
#define OMX_MEASUREMENT_UNMEASURED_KINDS_NOTHING_TO_MEASURE "nothing-to-measure" ///< A property of the plugin: any prober on any machine reaches it, so it may override a figure.
/** The English sentence of OMX_MEASUREMENT_UNMEASURED_KINDS_NOTHING_TO_MEASURE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_UNMEASURED_KINDS_NOTHING_TO_MEASURE_TEXT_EN "A property of the plugin: any prober on any machine reaches it, so it may override a figure."
#define OMX_MEASUREMENT_UNMEASURED_KINDS_PROBE_FAILED "probe-failed" ///< A property of this run: it says nothing about the plugin and never overrides a figure.
/** The English sentence of OMX_MEASUREMENT_UNMEASURED_KINDS_PROBE_FAILED, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_UNMEASURED_KINDS_PROBE_FAILED_TEXT_EN "A property of this run: it says nothing about the plugin and never overrides a figure."
#define OMX_MEASUREMENT_UNMEASURED_KINDS_NOT_ATTEMPTED "not-attempted" ///< The run did not cover this plugin or this dimension: a partial run, not a finding.
/** The English sentence of OMX_MEASUREMENT_UNMEASURED_KINDS_NOT_ATTEMPTED, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_UNMEASURED_KINDS_NOT_ATTEMPTED_TEXT_EN "The run did not cover this plugin or this dimension: a partial run, not a finding."
/** The number of words of MEASUREMENT_UNMEASURED_KINDS, the length of OMX_MEASUREMENT_UNMEASURED_KINDS_INIT. */
#define OMX_MEASUREMENT_UNMEASURED_KINDS_COUNT 3u
/** The words of MEASUREMENT_UNMEASURED_KINDS in declaration order, an initialiser of const char *. */
#define OMX_MEASUREMENT_UNMEASURED_KINDS_INIT { "nothing-to-measure", "probe-failed", "not-attempted" }
/// @}

/**
 * @name MEASUREMENT_UNMEASURED_REASONS (data/measurement.json)
 * Every reason a figure may be absent, each of its kind: an outcome a sweep produced, never a hypothetical. A reader that meets a reason it does not know treats it as probe-failed. (since 2.18.0)
 */
/// @{
#define OMX_MEASUREMENT_UNMEASURED_REASONS_NO_AUDIO_IN "no-audio-in" ///< No audio input port: nothing to drive.
/** The English sentence of OMX_MEASUREMENT_UNMEASURED_REASONS_NO_AUDIO_IN, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_UNMEASURED_REASONS_NO_AUDIO_IN_TEXT_EN "No audio input port: nothing to drive."
#define OMX_MEASUREMENT_UNMEASURED_REASONS_NO_AUDIO_OUT "no-audio-out" ///< No audio output port: nothing to read.
/** The English sentence of OMX_MEASUREMENT_UNMEASURED_REASONS_NO_AUDIO_OUT, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_UNMEASURED_REASONS_NO_AUDIO_OUT_TEXT_EN "No audio output port: nothing to read."
#define OMX_MEASUREMENT_UNMEASURED_REASONS_SILENT_OUTPUT "silent-output" ///< Driven, and silent under a stimulus that should have passed.
/** The English sentence of OMX_MEASUREMENT_UNMEASURED_REASONS_SILENT_OUTPUT, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_UNMEASURED_REASONS_SILENT_OUTPUT_TEXT_EN "Driven, and silent under a stimulus that should have passed."
#define OMX_MEASUREMENT_UNMEASURED_REASONS_NEEDS_CARRIER "needs-carrier" ///< Needs a second audio input the prober did not supply.
/** The English sentence of OMX_MEASUREMENT_UNMEASURED_REASONS_NEEDS_CARRIER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_UNMEASURED_REASONS_NEEDS_CARRIER_TEXT_EN "Needs a second audio input the prober did not supply."
#define OMX_MEASUREMENT_UNMEASURED_REASONS_NEEDS_IMPULSE_RESPONSE "needs-impulse-response" ///< A convolver needing an impulse response the prober did not load.
/** The English sentence of OMX_MEASUREMENT_UNMEASURED_REASONS_NEEDS_IMPULSE_RESPONSE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_UNMEASURED_REASONS_NEEDS_IMPULSE_RESPONSE_TEXT_EN "A convolver needing an impulse response the prober did not load."
#define OMX_MEASUREMENT_UNMEASURED_REASONS_NEEDS_CONTENT "needs-content" ///< An instrument that is silent under notes until a sample, a sound font or an instrument file is loaded, which the prober did not load.
/** The English sentence of OMX_MEASUREMENT_UNMEASURED_REASONS_NEEDS_CONTENT, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_UNMEASURED_REASONS_NEEDS_CONTENT_TEXT_EN "An instrument that is silent under notes until a sample, a sound font or an instrument file is loaded, which the prober did not load."
#define OMX_MEASUREMENT_UNMEASURED_REASONS_UNPINNABLE "unpinnable" ///< The files the host loads cannot be pinned.
/** The English sentence of OMX_MEASUREMENT_UNMEASURED_REASONS_UNPINNABLE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_UNMEASURED_REASONS_UNPINNABLE_TEXT_EN "The files the host loads cannot be pinned."
#define OMX_MEASUREMENT_UNMEASURED_REASONS_NO_VOICES "no-voices" ///< An instrument whose voice-info declares a capacity of 0.
/** The English sentence of OMX_MEASUREMENT_UNMEASURED_REASONS_NO_VOICES, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_UNMEASURED_REASONS_NO_VOICES_TEXT_EN "An instrument whose voice-info declares a capacity of 0."
#define OMX_MEASUREMENT_UNMEASURED_REASONS_NOTES_UNPLAYABLE "notes-unplayable" ///< An instrument whose note input reads no dialect the prober speaks.
/** The English sentence of OMX_MEASUREMENT_UNMEASURED_REASONS_NOTES_UNPLAYABLE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_UNMEASURED_REASONS_NOTES_UNPLAYABLE_TEXT_EN "An instrument whose note input reads no dialect the prober speaks."
#define OMX_MEASUREMENT_UNMEASURED_REASONS_VOICES_UNKNOWN "voices-unknown" ///< An instrument that declares no voice capacity, run with no probe count.
/** The English sentence of OMX_MEASUREMENT_UNMEASURED_REASONS_VOICES_UNKNOWN, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_UNMEASURED_REASONS_VOICES_UNKNOWN_TEXT_EN "An instrument that declares no voice capacity, run with no probe count."
#define OMX_MEASUREMENT_UNMEASURED_REASONS_REFUSED_INSTANTIATION "refused-instantiation" ///< The plugin would not instantiate at this rate or block size.
/** The English sentence of OMX_MEASUREMENT_UNMEASURED_REASONS_REFUSED_INSTANTIATION, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_UNMEASURED_REASONS_REFUSED_INSTANTIATION_TEXT_EN "The plugin would not instantiate at this rate or block size."
#define OMX_MEASUREMENT_UNMEASURED_REASONS_PROBE_CRASHED "probe-crashed" ///< The probe worker died while hosting the plugin.
/** The English sentence of OMX_MEASUREMENT_UNMEASURED_REASONS_PROBE_CRASHED, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_UNMEASURED_REASONS_PROBE_CRASHED_TEXT_EN "The probe worker died while hosting the plugin."
#define OMX_MEASUREMENT_UNMEASURED_REASONS_PROBE_TIMEOUT "probe-timeout" ///< The probe passed its per-plugin time limit.
/** The English sentence of OMX_MEASUREMENT_UNMEASURED_REASONS_PROBE_TIMEOUT, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_UNMEASURED_REASONS_PROBE_TIMEOUT_TEXT_EN "The probe passed its per-plugin time limit."
#define OMX_MEASUREMENT_UNMEASURED_REASONS_NON_FINITE_OUTPUT "non-finite-output" ///< The output held NaN or infinity.
/** The English sentence of OMX_MEASUREMENT_UNMEASURED_REASONS_NON_FINITE_OUTPUT, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_UNMEASURED_REASONS_NON_FINITE_OUTPUT_TEXT_EN "The output held NaN or infinity."
#define OMX_MEASUREMENT_UNMEASURED_REASONS_NOT_INSTALLED "not-installed" ///< The plugin is not installed on this machine.
/** The English sentence of OMX_MEASUREMENT_UNMEASURED_REASONS_NOT_INSTALLED, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_UNMEASURED_REASONS_NOT_INSTALLED_TEXT_EN "The plugin is not installed on this machine."
#define OMX_MEASUREMENT_UNMEASURED_REASONS_WORKER_NONCONFORMING "worker-nonconforming" ///< An LV2 worker interface with work or work_response NULL.
/** The English sentence of OMX_MEASUREMENT_UNMEASURED_REASONS_WORKER_NONCONFORMING, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_UNMEASURED_REASONS_WORKER_NONCONFORMING_TEXT_EN "An LV2 worker interface with work or work_response NULL."
#define OMX_MEASUREMENT_UNMEASURED_REASONS_PROBE_ERROR "probe-error" ///< A failure with no more specific reason; its own words are kept beside it.
/** The English sentence of OMX_MEASUREMENT_UNMEASURED_REASONS_PROBE_ERROR, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_UNMEASURED_REASONS_PROBE_ERROR_TEXT_EN "A failure with no more specific reason; its own words are kept beside it."
#define OMX_MEASUREMENT_UNMEASURED_REASONS_NOT_ATTEMPTED "not-attempted" ///< The run did not cover this plugin for this dimension.
/** The English sentence of OMX_MEASUREMENT_UNMEASURED_REASONS_NOT_ATTEMPTED, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_UNMEASURED_REASONS_NOT_ATTEMPTED_TEXT_EN "The run did not cover this plugin for this dimension."
/** The number of words of MEASUREMENT_UNMEASURED_REASONS, the length of OMX_MEASUREMENT_UNMEASURED_REASONS_INIT. */
#define OMX_MEASUREMENT_UNMEASURED_REASONS_COUNT 18u
/** The words of MEASUREMENT_UNMEASURED_REASONS in declaration order, an initialiser of const char *. */
#define OMX_MEASUREMENT_UNMEASURED_REASONS_INIT { "no-audio-in", "no-audio-out", "silent-output", "needs-carrier", "needs-impulse-response", "needs-content", "unpinnable", "no-voices", "notes-unplayable", "voices-unknown", "refused-instantiation", "probe-crashed", "probe-timeout", "non-finite-output", "not-installed", "worker-nonconforming", "probe-error", "not-attempted" }
/// @}

/**
 * @name MEASUREMENT_LATENCY_METHODS (data/measurement.json)
 * How a latency figure was taken. note-onset is an instrument's: a held note's first sound. (since 2.18.0)
 */
/// @{
#define OMX_MEASUREMENT_LATENCY_METHODS_IMPULSE_ONSET "impulse-onset" ///< The delay from a unit impulse to the first output sample above the residual floor: what the plugin does. (from LV2_CORE_TERMS#latency, CLAP_EXT_LATENCY_TERMS#latency)
/** The English sentence of OMX_MEASUREMENT_LATENCY_METHODS_IMPULSE_ONSET, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_LATENCY_METHODS_IMPULSE_ONSET_TEXT_EN "The delay from a unit impulse to the first output sample above the residual floor: what the plugin does."
#define OMX_MEASUREMENT_LATENCY_METHODS_DECLARED_PORT "declared-port" ///< Read from the plugin's own latency report: what it claims. (from LV2_CORE_TERMS#latency, CLAP_EXT_LATENCY_TERMS#latency)
/** The English sentence of OMX_MEASUREMENT_LATENCY_METHODS_DECLARED_PORT, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_LATENCY_METHODS_DECLARED_PORT_TEXT_EN "Read from the plugin's own latency report: what it claims."
#define OMX_MEASUREMENT_LATENCY_METHODS_NOTE_ONSET "note-onset" ///< The delay from a note on to the first output sample above the floor.
/** The English sentence of OMX_MEASUREMENT_LATENCY_METHODS_NOTE_ONSET, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_LATENCY_METHODS_NOTE_ONSET_TEXT_EN "The delay from a note on to the first output sample above the floor."
/** The number of words of MEASUREMENT_LATENCY_METHODS, the length of OMX_MEASUREMENT_LATENCY_METHODS_INIT. */
#define OMX_MEASUREMENT_LATENCY_METHODS_COUNT 3u
/** The words of MEASUREMENT_LATENCY_METHODS in declaration order, an initialiser of const char *. */
#define OMX_MEASUREMENT_LATENCY_METHODS_INIT { "impulse-onset", "declared-port", "note-onset" }
/// @}

/**
 * @name MEASUREMENT_COST_METHODS (data/measurement.json)
 * How a cost figure was taken. (since 2.18.0)
 */
/// @{
#define OMX_MEASUREMENT_COST_METHODS_BLOCK_TIME_PERCENTILE "block-time-percentile" ///< A percentile of per-block wall time under a sustained stimulus, warm-up discarded, in nanoseconds per sample.
/** The English sentence of OMX_MEASUREMENT_COST_METHODS_BLOCK_TIME_PERCENTILE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_COST_METHODS_BLOCK_TIME_PERCENTILE_TEXT_EN "A percentile of per-block wall time under a sustained stimulus, warm-up discarded, in nanoseconds per sample."
/** The number of words of MEASUREMENT_COST_METHODS, the length of OMX_MEASUREMENT_COST_METHODS_INIT. */
#define OMX_MEASUREMENT_COST_METHODS_COUNT 1u
/** The words of MEASUREMENT_COST_METHODS in declaration order, an initialiser of const char *. */
#define OMX_MEASUREMENT_COST_METHODS_INIT { "block-time-percentile" }
/// @}

/**
 * @name MEASUREMENT_LATENCY_SCALING (data/measurement.json)
 * How latency moves with the sample rate, derived from readings at several rates, never assumed from a plugin's name. (since 2.18.0)
 */
/// @{
#define OMX_MEASUREMENT_LATENCY_SCALING_FIXED_FRAME "fixed-frame" ///< The same frame count at every rate.
/** The English sentence of OMX_MEASUREMENT_LATENCY_SCALING_FIXED_FRAME, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_LATENCY_SCALING_FIXED_FRAME_TEXT_EN "The same frame count at every rate."
#define OMX_MEASUREMENT_LATENCY_SCALING_FIXED_TIME "fixed-time" ///< The same milliseconds at every rate.
/** The English sentence of OMX_MEASUREMENT_LATENCY_SCALING_FIXED_TIME, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_LATENCY_SCALING_FIXED_TIME_TEXT_EN "The same milliseconds at every rate."
#define OMX_MEASUREMENT_LATENCY_SCALING_ZERO "zero" ///< No latency a mix can notice at any measured rate.
/** The English sentence of OMX_MEASUREMENT_LATENCY_SCALING_ZERO, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_LATENCY_SCALING_ZERO_TEXT_EN "No latency a mix can notice at any measured rate."
#define OMX_MEASUREMENT_LATENCY_SCALING_NONCONFORMING "nonconforming" ///< Fits neither law at a magnitude that reaches a mix: flagged, never averaged.
/** The English sentence of OMX_MEASUREMENT_LATENCY_SCALING_NONCONFORMING, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_LATENCY_SCALING_NONCONFORMING_TEXT_EN "Fits neither law at a magnitude that reaches a mix: flagged, never averaged."
#define OMX_MEASUREMENT_LATENCY_SCALING_SINGLE_RATE "single-rate" ///< One usable reading: no law can be fitted.
/** The English sentence of OMX_MEASUREMENT_LATENCY_SCALING_SINGLE_RATE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_LATENCY_SCALING_SINGLE_RATE_TEXT_EN "One usable reading: no law can be fitted."
#define OMX_MEASUREMENT_LATENCY_SCALING_UNMEASURED "unmeasured" ///< No rate produced a figure.
/** The English sentence of OMX_MEASUREMENT_LATENCY_SCALING_UNMEASURED, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_LATENCY_SCALING_UNMEASURED_TEXT_EN "No rate produced a figure."
/** The number of words of MEASUREMENT_LATENCY_SCALING, the length of OMX_MEASUREMENT_LATENCY_SCALING_INIT. */
#define OMX_MEASUREMENT_LATENCY_SCALING_COUNT 6u
/** The words of MEASUREMENT_LATENCY_SCALING in declaration order, an initialiser of const char *. */
#define OMX_MEASUREMENT_LATENCY_SCALING_INIT { "fixed-frame", "fixed-time", "zero", "nonconforming", "single-rate", "unmeasured" }
/// @}

/**
 * @name MEASUREMENT_LATENCY_SCALING_NOTES (data/measurement.json)
 * Why a derived scaling class is not the naive fit over every reading. (since 2.18.0)
 */
/// @{
#define OMX_MEASUREMENT_LATENCY_SCALING_NOTES_BELOW_BUDGET "below-budget" ///< The readings fit no law but every one is inside the latency budget: the detector's noise.
/** The English sentence of OMX_MEASUREMENT_LATENCY_SCALING_NOTES_BELOW_BUDGET, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_LATENCY_SCALING_NOTES_BELOW_BUDGET_TEXT_EN "The readings fit no law but every one is inside the latency budget: the detector's noise."
#define OMX_MEASUREMENT_LATENCY_SCALING_NOTES_INFORMATIONAL_RATE "informational-rate" ///< Only a reading below the operational rates breaks the law; it stays as information.
/** The English sentence of OMX_MEASUREMENT_LATENCY_SCALING_NOTES_INFORMATIONAL_RATE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_LATENCY_SCALING_NOTES_INFORMATIONAL_RATE_TEXT_EN "Only a reading below the operational rates breaks the law; it stays as information."
/** The number of words of MEASUREMENT_LATENCY_SCALING_NOTES, the length of OMX_MEASUREMENT_LATENCY_SCALING_NOTES_INIT. */
#define OMX_MEASUREMENT_LATENCY_SCALING_NOTES_COUNT 2u
/** The words of MEASUREMENT_LATENCY_SCALING_NOTES in declaration order, an initialiser of const char *. */
#define OMX_MEASUREMENT_LATENCY_SCALING_NOTES_INIT { "below-budget", "informational-rate" }
/// @}

/**
 * @name MEASUREMENT_LATENCY_EXCLUSIONS (data/measurement.json)
 * Why one rate's reading was left out of the fit and of every rate resolution. (since 2.18.0)
 */
/// @{
#define OMX_MEASUREMENT_LATENCY_EXCLUSIONS_IMPOSSIBLE_ZERO "impossible-zero" ///< Zero frames at this rate while another rate measured non-zero.
/** The English sentence of OMX_MEASUREMENT_LATENCY_EXCLUSIONS_IMPOSSIBLE_ZERO, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_LATENCY_EXCLUSIONS_IMPOSSIBLE_ZERO_TEXT_EN "Zero frames at this rate while another rate measured non-zero."
/** The number of words of MEASUREMENT_LATENCY_EXCLUSIONS, the length of OMX_MEASUREMENT_LATENCY_EXCLUSIONS_INIT. */
#define OMX_MEASUREMENT_LATENCY_EXCLUSIONS_COUNT 1u
/** The words of MEASUREMENT_LATENCY_EXCLUSIONS in declaration order, an initialiser of const char *. */
#define OMX_MEASUREMENT_LATENCY_EXCLUSIONS_INIT { "impossible-zero" }
/// @}

/**
 * @name MEASUREMENT_VOICE_BASES (data/measurement.json)
 * Where the number of notes an instrument's cost was measured with came from: the voice capacity the plugin declares (CLAP voice-info), or a count the caller gave. (since 2.18.0)
 */
/// @{
#define OMX_MEASUREMENT_VOICE_BASES_DECLARED "declared" ///< The voice capacity the plugin declares through CLAP's voice-info extension. (from CLAP_EXT_VOICE_INFO_TERMS#voice-info)
/** The English sentence of OMX_MEASUREMENT_VOICE_BASES_DECLARED, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_VOICE_BASES_DECLARED_TEXT_EN "The voice capacity the plugin declares through CLAP's voice-info extension."
#define OMX_MEASUREMENT_VOICE_BASES_PROBE "probe" ///< A note count the caller gave the prober, not read from the plugin.
/** The English sentence of OMX_MEASUREMENT_VOICE_BASES_PROBE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_VOICE_BASES_PROBE_TEXT_EN "A note count the caller gave the prober, not read from the plugin."
/** The number of words of MEASUREMENT_VOICE_BASES, the length of OMX_MEASUREMENT_VOICE_BASES_INIT. */
#define OMX_MEASUREMENT_VOICE_BASES_COUNT 2u
/** The words of MEASUREMENT_VOICE_BASES in declaration order, an initialiser of const char *. */
#define OMX_MEASUREMENT_VOICE_BASES_INIT { "declared", "probe" }
/// @}

/**
 * @name MEASUREMENT_VERDICT_RATINGS (data/measurement.json)
 * The four ratings a verdict speaks, in order from the best. (since 2.18.0)
 */
/// @{
#define OMX_MEASUREMENT_VERDICT_RATINGS_SUITABLE "suitable" ///< The plugin meets the host profile's budget on every measured dimension.
/** The English sentence of OMX_MEASUREMENT_VERDICT_RATINGS_SUITABLE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_VERDICT_RATINGS_SUITABLE_TEXT_EN "The plugin meets the host profile's budget on every measured dimension."
#define OMX_MEASUREMENT_VERDICT_RATINGS_CONDITIONAL "conditional" ///< The plugin meets the host profile's budget only under a stated condition.
/** The English sentence of OMX_MEASUREMENT_VERDICT_RATINGS_CONDITIONAL, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_VERDICT_RATINGS_CONDITIONAL_TEXT_EN "The plugin meets the host profile's budget only under a stated condition."
#define OMX_MEASUREMENT_VERDICT_RATINGS_UNKNOWN "unknown" ///< Not enough was measured to rate the plugin against the host profile.
/** The English sentence of OMX_MEASUREMENT_VERDICT_RATINGS_UNKNOWN, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_VERDICT_RATINGS_UNKNOWN_TEXT_EN "Not enough was measured to rate the plugin against the host profile."
#define OMX_MEASUREMENT_VERDICT_RATINGS_UNSUITABLE "unsuitable" ///< The plugin does not meet the host profile's budget on at least one measured dimension.
/** The English sentence of OMX_MEASUREMENT_VERDICT_RATINGS_UNSUITABLE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_MEASUREMENT_VERDICT_RATINGS_UNSUITABLE_TEXT_EN "The plugin does not meet the host profile's budget on at least one measured dimension."
/** The number of words of MEASUREMENT_VERDICT_RATINGS, the length of OMX_MEASUREMENT_VERDICT_RATINGS_INIT. */
#define OMX_MEASUREMENT_VERDICT_RATINGS_COUNT 4u
/** The words of MEASUREMENT_VERDICT_RATINGS in declaration order, an initialiser of const char *. */
#define OMX_MEASUREMENT_VERDICT_RATINGS_INIT { "suitable", "conditional", "unknown", "unsuitable" }
/// @}

/**
 * @name PANEL_FAMILIES (data/panel.json)
 * The panel families of a plugin (omx-panel docs/panel-layout.md): the kind of processor its panel is laid out for. The words and their order are the contract; omx-panel's tools/panel-description.mjs FAMILIES and the skin package schema read them, and keep their code. (since 3.7.0)
 */
/// @{
#define OMX_PANEL_FAMILIES_NONE "none" ///< a plugin with no family: its panel is laid out from its groups and roles
/** The English sentence of OMX_PANEL_FAMILIES_NONE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_FAMILIES_NONE_TEXT_EN "A plugin with no family: its panel is laid out from its groups and its roles."
#define OMX_PANEL_FAMILIES_GATE "gate" ///< a gate or expander
/** The English sentence of OMX_PANEL_FAMILIES_GATE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_FAMILIES_GATE_TEXT_EN "A gate's or an expander's panel family."
#define OMX_PANEL_FAMILIES_DYNAMICS "dynamics" ///< a compressor
/** The English sentence of OMX_PANEL_FAMILIES_DYNAMICS, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_FAMILIES_DYNAMICS_TEXT_EN "A compressor's panel family."
#define OMX_PANEL_FAMILIES_LIMITER "limiter" ///< a limiter
/** The English sentence of OMX_PANEL_FAMILIES_LIMITER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_FAMILIES_LIMITER_TEXT_EN "A limiter's panel family."
#define OMX_PANEL_FAMILIES_DEESSER "deesser" ///< a de-esser
/** The English sentence of OMX_PANEL_FAMILIES_DEESSER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_FAMILIES_DEESSER_TEXT_EN "A de-esser's panel family."
#define OMX_PANEL_FAMILIES_EQ "eq" ///< an equaliser, parametric or graphic
/** The English sentence of OMX_PANEL_FAMILIES_EQ, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_FAMILIES_EQ_TEXT_EN "An equaliser's panel family, parametric or graphic."
#define OMX_PANEL_FAMILIES_FILTER "filter" ///< a filter
/** The English sentence of OMX_PANEL_FAMILIES_FILTER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_FAMILIES_FILTER_TEXT_EN "A filter's panel family."
#define OMX_PANEL_FAMILIES_DRIVE "drive" ///< a saturator or distortion
/** The English sentence of OMX_PANEL_FAMILIES_DRIVE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_FAMILIES_DRIVE_TEXT_EN "A saturator's or a distortion's panel family."
#define OMX_PANEL_FAMILIES_MODULATION "modulation" ///< a chorus, flanger, phaser or tremolo
/** The English sentence of OMX_PANEL_FAMILIES_MODULATION, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_FAMILIES_MODULATION_TEXT_EN "A chorus's, a flanger's, a phaser's or a tremolo's panel family."
#define OMX_PANEL_FAMILIES_DELAY "delay" ///< a delay
/** The English sentence of OMX_PANEL_FAMILIES_DELAY, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_FAMILIES_DELAY_TEXT_EN "A delay's panel family."
#define OMX_PANEL_FAMILIES_REVERB "reverb" ///< a reverb
/** The English sentence of OMX_PANEL_FAMILIES_REVERB, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_FAMILIES_REVERB_TEXT_EN "A reverb's panel family."
#define OMX_PANEL_FAMILIES_PITCH "pitch" ///< a pitch shifter
/** The English sentence of OMX_PANEL_FAMILIES_PITCH, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_FAMILIES_PITCH_TEXT_EN "A pitch shifter's panel family."
#define OMX_PANEL_FAMILIES_UTILITY "utility" ///< a gain trim, a stereo width control or another utility that shapes a signal without a processor's character
/** The English sentence of OMX_PANEL_FAMILIES_UTILITY, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_FAMILIES_UTILITY_TEXT_EN "A utility's panel family: a trim, a width control, a balancer or a clipper."
/** The number of words of PANEL_FAMILIES, the length of OMX_PANEL_FAMILIES_INIT. */
#define OMX_PANEL_FAMILIES_COUNT 13u
/** The words of PANEL_FAMILIES in declaration order, an initialiser of const char *. */
#define OMX_PANEL_FAMILIES_INIT { "none", "gate", "dynamics", "limiter", "deesser", "eq", "filter", "drive", "modulation", "delay", "reverb", "pitch", "utility" }
/// @}

/**
 * @name PANEL_STANDARD_WIDGETS (data/panel.json)
 * The standard widgets a panel picks from a descriptor and a representation (a skin) draws, in the order omx-panel's tools/panel-description.mjs STANDARD_WIDGETS lists them. (since 3.7.0)
 */
/// @{
#define OMX_PANEL_STANDARD_WIDGETS_KNOB "knob" ///< a travel
/** The English sentence of OMX_PANEL_STANDARD_WIDGETS_KNOB, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_STANDARD_WIDGETS_KNOB_TEXT_EN "A travel, drawn as a knob."
#define OMX_PANEL_STANDARD_WIDGETS_FADER "fader" ///< a travel drawn long
/** The English sentence of OMX_PANEL_STANDARD_WIDGETS_FADER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_STANDARD_WIDGETS_FADER_TEXT_EN "A travel drawn long, as a fader."
#define OMX_PANEL_STANDARD_WIDGETS_SWITCH "switch" ///< a toggle
/** The English sentence of OMX_PANEL_STANDARD_WIDGETS_SWITCH, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_STANDARD_WIDGETS_SWITCH_TEXT_EN "A toggle, drawn as a switch."
#define OMX_PANEL_STANDARD_WIDGETS_SELECTOR "selector" ///< an integer travel or labelled values
/** The English sentence of OMX_PANEL_STANDARD_WIDGETS_SELECTOR, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_STANDARD_WIDGETS_SELECTOR_TEXT_EN "An integer travel or labelled values, drawn as a selector."
#define OMX_PANEL_STANDARD_WIDGETS_METER "meter" ///< a readout
/** The English sentence of OMX_PANEL_STANDARD_WIDGETS_METER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_STANDARD_WIDGETS_METER_TEXT_EN "A readout, drawn as a meter."
#define OMX_PANEL_STANDARD_WIDGETS_CURVE "curve" ///< a response or transfer curve
/** The English sentence of OMX_PANEL_STANDARD_WIDGETS_CURVE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_STANDARD_WIDGETS_CURVE_TEXT_EN "A response or transfer curve, drawn as a graph."
#define OMX_PANEL_STANDARD_WIDGETS_XY "xy" ///< two controls drawn as one point
/** The English sentence of OMX_PANEL_STANDARD_WIDGETS_XY, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_STANDARD_WIDGETS_XY_TEXT_EN "Two controls drawn together as one point on a plane."
#define OMX_PANEL_STANDARD_WIDGETS_DISPLAY "display" ///< a value shown as text
/** The English sentence of OMX_PANEL_STANDARD_WIDGETS_DISPLAY, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_STANDARD_WIDGETS_DISPLAY_TEXT_EN "A value shown as text."
/** The number of words of PANEL_STANDARD_WIDGETS, the length of OMX_PANEL_STANDARD_WIDGETS_INIT. */
#define OMX_PANEL_STANDARD_WIDGETS_COUNT 8u
/** The words of PANEL_STANDARD_WIDGETS in declaration order, an initialiser of const char *. */
#define OMX_PANEL_STANDARD_WIDGETS_INIT { "knob", "fader", "switch", "selector", "meter", "curve", "xy", "display" }
/// @}

/**
 * @name PANEL_WIDGETS (data/panel.json)
 * The widgets a declared panel may name for a control, and the extension serves (org.openmixer.panel-description/1): auto leaves the choice to the panel layout. The four others are the shared widgets of omx-panel's schema/panel.schema.json. (since 3.7.0)
 */
/// @{
#define OMX_PANEL_WIDGETS_AUTO "auto" ///< left out of a panel declaration: the layout picks the widget from the control
/** The English sentence of OMX_PANEL_WIDGETS_AUTO, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_WIDGETS_AUTO_TEXT_EN "Left out of a panel declaration: the layout picks the widget from the control."
#define OMX_PANEL_WIDGETS_KNOB "knob" ///< a rotary control
/** The English sentence of OMX_PANEL_WIDGETS_KNOB, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_WIDGETS_KNOB_TEXT_EN "A rotary control."
#define OMX_PANEL_WIDGETS_FADER "fader" ///< a linear control
/** The English sentence of OMX_PANEL_WIDGETS_FADER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_WIDGETS_FADER_TEXT_EN "A linear control."
#define OMX_PANEL_WIDGETS_SWITCH "switch" ///< a two-state control
/** The English sentence of OMX_PANEL_WIDGETS_SWITCH, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_WIDGETS_SWITCH_TEXT_EN "A two-state control."
#define OMX_PANEL_WIDGETS_SELECTOR "selector" ///< a control that picks one of a few values
/** The English sentence of OMX_PANEL_WIDGETS_SELECTOR, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PANEL_WIDGETS_SELECTOR_TEXT_EN "A control that picks one of a few values."
/** The number of words of PANEL_WIDGETS, the length of OMX_PANEL_WIDGETS_INIT. */
#define OMX_PANEL_WIDGETS_COUNT 5u
/** The words of PANEL_WIDGETS in declaration order, an initialiser of const char *. */
#define OMX_PANEL_WIDGETS_INIT { "auto", "knob", "fader", "switch", "selector" }
/// @}

/**
 * @name PLUGIN_FEATURE_AUDIO_EFFECT (data/plugin-features.json)
 * The CLAP plugin features and LV2 plugin classes that become the descriptor feature audio-effect: every kind of effect, a filter, a dynamics processor, a modulation or a space, and the channel-less roles of a processor (utility, mixing, mastering). (since 3.7.0)
 */
/// @{
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_AUDIO_EFFECT "clap.audio-effect" ///< The CLAP plugin feature audio-effect: any audio effect with no more specific feature declared. (from CLAP_PLUGIN_FEATURES_TERMS#audio-effect)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_AUDIO_EFFECT, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_AUDIO_EFFECT_TEXT_EN "The CLAP plugin feature audio-effect: any audio effect with no more specific feature declared."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_CHORUS "clap.chorus" ///< The CLAP plugin feature chorus: an effect that thickens a sound with detuned, delayed copies of it. (from CLAP_PLUGIN_FEATURES_TERMS#chorus)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_CHORUS, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_CHORUS_TEXT_EN "The CLAP plugin feature chorus: an effect that thickens a sound with detuned, delayed copies of it."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_COMPRESSOR "clap.compressor" ///< The CLAP plugin feature compressor: an effect that narrows a sound's dynamic range. (from CLAP_PLUGIN_FEATURES_TERMS#compressor)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_COMPRESSOR, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_COMPRESSOR_TEXT_EN "The CLAP plugin feature compressor: an effect that narrows a sound's dynamic range."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_DE_ESSER "clap.de-esser" ///< The CLAP plugin feature de-esser: an effect that tames sibilance in a voice. (from CLAP_PLUGIN_FEATURES_TERMS#de-esser)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_DE_ESSER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_DE_ESSER_TEXT_EN "The CLAP plugin feature de-esser: an effect that tames sibilance in a voice."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_DELAY "clap.delay" ///< The CLAP plugin feature delay: an effect that repeats a sound after a gap. (from CLAP_PLUGIN_FEATURES_TERMS#delay)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_DELAY, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_DELAY_TEXT_EN "The CLAP plugin feature delay: an effect that repeats a sound after a gap."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_DISTORTION "clap.distortion" ///< The CLAP plugin feature distortion: an effect that adds harmonics by overdriving a sound. (from CLAP_PLUGIN_FEATURES_TERMS#distortion)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_DISTORTION, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_DISTORTION_TEXT_EN "The CLAP plugin feature distortion: an effect that adds harmonics by overdriving a sound."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_EQUALIZER "clap.equalizer" ///< The CLAP plugin feature equalizer: an effect that shapes a sound's frequency balance. (from CLAP_PLUGIN_FEATURES_TERMS#equalizer)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_EQUALIZER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_EQUALIZER_TEXT_EN "The CLAP plugin feature equalizer: an effect that shapes a sound's frequency balance."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_EXPANDER "clap.expander" ///< The CLAP plugin feature expander: an effect that widens a sound's dynamic range. (from CLAP_PLUGIN_FEATURES_TERMS#expander)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_EXPANDER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_EXPANDER_TEXT_EN "The CLAP plugin feature expander: an effect that widens a sound's dynamic range."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_FILTER "clap.filter" ///< The CLAP plugin feature filter: an effect that removes or shapes a band of frequencies. (from CLAP_PLUGIN_FEATURES_TERMS#filter)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_FILTER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_FILTER_TEXT_EN "The CLAP plugin feature filter: an effect that removes or shapes a band of frequencies."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_FLANGER "clap.flanger" ///< The CLAP plugin feature flanger: an effect that sweeps a short, modulated delay against the dry sound. (from CLAP_PLUGIN_FEATURES_TERMS#flanger)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_FLANGER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_FLANGER_TEXT_EN "The CLAP plugin feature flanger: an effect that sweeps a short, modulated delay against the dry sound."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_FREQUENCY_SHIFTER "clap.frequency-shifter" ///< The CLAP plugin feature frequency-shifter: an effect that shifts every frequency of a sound by the same amount. (from CLAP_PLUGIN_FEATURES_TERMS#frequency-shifter)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_FREQUENCY_SHIFTER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_FREQUENCY_SHIFTER_TEXT_EN "The CLAP plugin feature frequency-shifter: an effect that shifts every frequency of a sound by the same amount."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_GATE "clap.gate" ///< The CLAP plugin feature gate: an effect that mutes a sound below a level. (from CLAP_PLUGIN_FEATURES_TERMS#gate)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_GATE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_GATE_TEXT_EN "The CLAP plugin feature gate: an effect that mutes a sound below a level."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_GLITCH "clap.glitch" ///< The CLAP plugin feature glitch: an effect that cuts, stutters or corrupts a sound on purpose. (from CLAP_PLUGIN_FEATURES_TERMS#glitch)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_GLITCH, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_GLITCH_TEXT_EN "The CLAP plugin feature glitch: an effect that cuts, stutters or corrupts a sound on purpose."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_GRANULAR "clap.granular" ///< The CLAP plugin feature granular: an effect built from short grains of a sound. (from CLAP_PLUGIN_FEATURES_TERMS#granular)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_GRANULAR, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_GRANULAR_TEXT_EN "The CLAP plugin feature granular: an effect built from short grains of a sound."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_LIMITER "clap.limiter" ///< The CLAP plugin feature limiter: an effect that holds a sound under a ceiling. (from CLAP_PLUGIN_FEATURES_TERMS#limiter)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_LIMITER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_LIMITER_TEXT_EN "The CLAP plugin feature limiter: an effect that holds a sound under a ceiling."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_MASTERING "clap.mastering" ///< The CLAP plugin feature mastering: an effect meant for a mix's final stage. (from CLAP_PLUGIN_FEATURES_TERMS#mastering)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_MASTERING, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_MASTERING_TEXT_EN "The CLAP plugin feature mastering: an effect meant for a mix's final stage."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_MIXING "clap.mixing" ///< The CLAP plugin feature mixing: an effect meant for use while mixing, such as a channel strip. (from CLAP_PLUGIN_FEATURES_TERMS#mixing)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_MIXING, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_MIXING_TEXT_EN "The CLAP plugin feature mixing: an effect meant for use while mixing, such as a channel strip."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_MULTI_EFFECTS "clap.multi-effects" ///< The CLAP plugin feature multi-effects: several effects combined in one plugin. (from CLAP_PLUGIN_FEATURES_TERMS#multi-effects)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_MULTI_EFFECTS, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_MULTI_EFFECTS_TEXT_EN "The CLAP plugin feature multi-effects: several effects combined in one plugin."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_PHASE_VOCODER "clap.phase-vocoder" ///< The CLAP plugin feature phase-vocoder: an effect built on a phase vocoder, typically to stretch or shift a sound independently of pitch and time. (from CLAP_PLUGIN_FEATURES_TERMS#phase-vocoder)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_PHASE_VOCODER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_PHASE_VOCODER_TEXT_EN "The CLAP plugin feature phase-vocoder: an effect built on a phase vocoder, typically to stretch or shift a sound independently of pitch and time."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_PHASER "clap.phaser" ///< The CLAP plugin feature phaser: an effect that sweeps notches through a sound with an all-pass filter chain. (from CLAP_PLUGIN_FEATURES_TERMS#phaser)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_PHASER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_PHASER_TEXT_EN "The CLAP plugin feature phaser: an effect that sweeps notches through a sound with an all-pass filter chain."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_PITCH_CORRECTION "clap.pitch-correction" ///< The CLAP plugin feature pitch-correction: an effect that pulls a sound's pitch toward a scale. (from CLAP_PLUGIN_FEATURES_TERMS#pitch-correction)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_PITCH_CORRECTION, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_PITCH_CORRECTION_TEXT_EN "The CLAP plugin feature pitch-correction: an effect that pulls a sound's pitch toward a scale."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_PITCH_SHIFTER "clap.pitch-shifter" ///< The CLAP plugin feature pitch-shifter: an effect that changes a sound's pitch without changing its duration. (from CLAP_PLUGIN_FEATURES_TERMS#pitch-shifter)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_PITCH_SHIFTER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_PITCH_SHIFTER_TEXT_EN "The CLAP plugin feature pitch-shifter: an effect that changes a sound's pitch without changing its duration."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_RESTORATION "clap.restoration" ///< The CLAP plugin feature restoration: an effect that removes noise, clicks or other damage from a recording. (from CLAP_PLUGIN_FEATURES_TERMS#restoration)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_RESTORATION, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_RESTORATION_TEXT_EN "The CLAP plugin feature restoration: an effect that removes noise, clicks or other damage from a recording."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_REVERB "clap.reverb" ///< The CLAP plugin feature reverb: an effect that adds the reflections of a space to a sound. (from CLAP_PLUGIN_FEATURES_TERMS#reverb)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_REVERB, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_REVERB_TEXT_EN "The CLAP plugin feature reverb: an effect that adds the reflections of a space to a sound."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_TRANSIENT_SHAPER "clap.transient-shaper" ///< The CLAP plugin feature transient-shaper: an effect that reshapes a sound's attack and sustain. (from CLAP_PLUGIN_FEATURES_TERMS#transient-shaper)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_TRANSIENT_SHAPER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_TRANSIENT_SHAPER_TEXT_EN "The CLAP plugin feature transient-shaper: an effect that reshapes a sound's attack and sustain."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_TREMOLO "clap.tremolo" ///< The CLAP plugin feature tremolo: an effect that modulates a sound's level over time. (from CLAP_PLUGIN_FEATURES_TERMS#tremolo)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_TREMOLO, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_TREMOLO_TEXT_EN "The CLAP plugin feature tremolo: an effect that modulates a sound's level over time."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_UTILITY "clap.utility" ///< The CLAP plugin feature utility: a plugin that does audio housekeeping rather than a creative effect. (from CLAP_PLUGIN_FEATURES_TERMS#utility)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_UTILITY, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_UTILITY_TEXT_EN "The CLAP plugin feature utility: a plugin that does audio housekeeping rather than a creative effect."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_ALLPASS "lv2.Allpass" ///< The LV2 plugin class AllpassPlugin: an all-pass filter, which shifts phase without changing level. (from LV2_CORE_TERMS#AllpassPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_ALLPASS, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_ALLPASS_TEXT_EN "The LV2 plugin class AllpassPlugin: an all-pass filter, which shifts phase without changing level."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_AMPLIFIER "lv2.Amplifier" ///< The LV2 plugin class AmplifierPlugin: a plugin that changes a sound's level. (from LV2_CORE_TERMS#AmplifierPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_AMPLIFIER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_AMPLIFIER_TEXT_EN "The LV2 plugin class AmplifierPlugin: a plugin that changes a sound's level."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_BANDPASS "lv2.Bandpass" ///< The LV2 plugin class BandpassPlugin: a filter that passes one band of frequencies. (from LV2_CORE_TERMS#BandpassPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_BANDPASS, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_BANDPASS_TEXT_EN "The LV2 plugin class BandpassPlugin: a filter that passes one band of frequencies."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_CHORUS "lv2.Chorus" ///< The LV2 plugin class ChorusPlugin: an effect that thickens a sound with detuned, delayed copies of it. (from LV2_CORE_TERMS#ChorusPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_CHORUS, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_CHORUS_TEXT_EN "The LV2 plugin class ChorusPlugin: an effect that thickens a sound with detuned, delayed copies of it."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_COMB "lv2.Comb" ///< The LV2 plugin class CombPlugin: a comb filter, which adds a short delayed copy of a sound to itself. (from LV2_CORE_TERMS#CombPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_COMB, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_COMB_TEXT_EN "The LV2 plugin class CombPlugin: a comb filter, which adds a short delayed copy of a sound to itself."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_COMPRESSOR "lv2.Compressor" ///< The LV2 plugin class CompressorPlugin: an effect that narrows a sound's dynamic range. (from LV2_CORE_TERMS#CompressorPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_COMPRESSOR, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_COMPRESSOR_TEXT_EN "The LV2 plugin class CompressorPlugin: an effect that narrows a sound's dynamic range."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_CONVERTER "lv2.Converter" ///< The LV2 plugin class ConverterPlugin: a plugin that converts a signal from one representation to another. (from LV2_CORE_TERMS#ConverterPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_CONVERTER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_CONVERTER_TEXT_EN "The LV2 plugin class ConverterPlugin: a plugin that converts a signal from one representation to another."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_DELAY "lv2.Delay" ///< The LV2 plugin class DelayPlugin: an effect that repeats a sound after a gap. (from LV2_CORE_TERMS#DelayPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_DELAY, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_DELAY_TEXT_EN "The LV2 plugin class DelayPlugin: an effect that repeats a sound after a gap."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_DISTORTION "lv2.Distortion" ///< The LV2 plugin class DistortionPlugin: an effect that adds harmonics by overdriving a sound. (from LV2_CORE_TERMS#DistortionPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_DISTORTION, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_DISTORTION_TEXT_EN "The LV2 plugin class DistortionPlugin: an effect that adds harmonics by overdriving a sound."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_DYNAMICS "lv2.Dynamics" ///< The LV2 plugin class DynamicsPlugin: an effect that changes a sound's dynamic range. (from LV2_CORE_TERMS#DynamicsPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_DYNAMICS, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_DYNAMICS_TEXT_EN "The LV2 plugin class DynamicsPlugin: an effect that changes a sound's dynamic range."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_EQ "lv2.EQ" ///< The LV2 plugin class EQPlugin: an effect that shapes a sound's frequency balance. (from LV2_CORE_TERMS#EQPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_EQ, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_EQ_TEXT_EN "The LV2 plugin class EQPlugin: an effect that shapes a sound's frequency balance."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_ENVELOPE "lv2.Envelope" ///< The LV2 plugin class EnvelopePlugin: a plugin that follows or applies an envelope over time. (from LV2_CORE_TERMS#EnvelopePlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_ENVELOPE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_ENVELOPE_TEXT_EN "The LV2 plugin class EnvelopePlugin: a plugin that follows or applies an envelope over time."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_EXPANDER "lv2.Expander" ///< The LV2 plugin class ExpanderPlugin: an effect that widens a sound's dynamic range. (from LV2_CORE_TERMS#ExpanderPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_EXPANDER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_EXPANDER_TEXT_EN "The LV2 plugin class ExpanderPlugin: an effect that widens a sound's dynamic range."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_FILTER "lv2.Filter" ///< The LV2 plugin class FilterPlugin: an effect that removes or shapes a band of frequencies. (from LV2_CORE_TERMS#FilterPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_FILTER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_FILTER_TEXT_EN "The LV2 plugin class FilterPlugin: an effect that removes or shapes a band of frequencies."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_FLANGER "lv2.Flanger" ///< The LV2 plugin class FlangerPlugin: an effect that sweeps a short, modulated delay against the dry sound. (from LV2_CORE_TERMS#FlangerPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_FLANGER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_FLANGER_TEXT_EN "The LV2 plugin class FlangerPlugin: an effect that sweeps a short, modulated delay against the dry sound."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_GATE "lv2.Gate" ///< The LV2 plugin class GatePlugin: an effect that mutes a sound below a level. (from LV2_CORE_TERMS#GatePlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_GATE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_GATE_TEXT_EN "The LV2 plugin class GatePlugin: an effect that mutes a sound below a level."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_HIGHPASS "lv2.Highpass" ///< The LV2 plugin class HighpassPlugin: a filter that passes frequencies above a cutoff. (from LV2_CORE_TERMS#HighpassPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_HIGHPASS, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_HIGHPASS_TEXT_EN "The LV2 plugin class HighpassPlugin: a filter that passes frequencies above a cutoff."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_LIMITER "lv2.Limiter" ///< The LV2 plugin class LimiterPlugin: an effect that holds a sound under a ceiling. (from LV2_CORE_TERMS#LimiterPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_LIMITER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_LIMITER_TEXT_EN "The LV2 plugin class LimiterPlugin: an effect that holds a sound under a ceiling."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_LOWPASS "lv2.Lowpass" ///< The LV2 plugin class LowpassPlugin: a filter that passes frequencies below a cutoff. (from LV2_CORE_TERMS#LowpassPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_LOWPASS, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_LOWPASS_TEXT_EN "The LV2 plugin class LowpassPlugin: a filter that passes frequencies below a cutoff."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_MIXER "lv2.Mixer" ///< The LV2 plugin class MixerPlugin: a plugin that combines several signals into one. (from LV2_CORE_TERMS#MixerPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_MIXER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_MIXER_TEXT_EN "The LV2 plugin class MixerPlugin: a plugin that combines several signals into one."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_MODULATOR "lv2.Modulator" ///< The LV2 plugin class ModulatorPlugin: a plugin that modulates one signal with another. (from LV2_CORE_TERMS#ModulatorPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_MODULATOR, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_MODULATOR_TEXT_EN "The LV2 plugin class ModulatorPlugin: a plugin that modulates one signal with another."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_MULTI_EQ "lv2.MultiEQ" ///< The LV2 plugin class MultiEQPlugin: a multi-band equaliser. (from LV2_CORE_TERMS#MultiEQPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_MULTI_EQ, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_MULTI_EQ_TEXT_EN "The LV2 plugin class MultiEQPlugin: a multi-band equaliser."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_PARA_EQ "lv2.ParaEQ" ///< The LV2 plugin class ParaEQPlugin: a parametric equaliser. (from LV2_CORE_TERMS#ParaEQPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_PARA_EQ, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_PARA_EQ_TEXT_EN "The LV2 plugin class ParaEQPlugin: a parametric equaliser."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_PHASER "lv2.Phaser" ///< The LV2 plugin class PhaserPlugin: an effect that sweeps notches through a sound with an all-pass filter chain. (from LV2_CORE_TERMS#PhaserPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_PHASER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_PHASER_TEXT_EN "The LV2 plugin class PhaserPlugin: an effect that sweeps notches through a sound with an all-pass filter chain."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_PITCH "lv2.Pitch" ///< The LV2 plugin class PitchPlugin: a plugin that changes or tracks a sound's pitch. (from LV2_CORE_TERMS#PitchPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_PITCH, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_PITCH_TEXT_EN "The LV2 plugin class PitchPlugin: a plugin that changes or tracks a sound's pitch."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_REVERB "lv2.Reverb" ///< The LV2 plugin class ReverbPlugin: an effect that adds the reflections of a space to a sound. (from LV2_CORE_TERMS#ReverbPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_REVERB, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_REVERB_TEXT_EN "The LV2 plugin class ReverbPlugin: an effect that adds the reflections of a space to a sound."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_SIMULATOR "lv2.Simulator" ///< The LV2 plugin class SimulatorPlugin: a plugin that models a physical device or space. (from LV2_CORE_TERMS#SimulatorPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_SIMULATOR, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_SIMULATOR_TEXT_EN "The LV2 plugin class SimulatorPlugin: a plugin that models a physical device or space."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_SPATIAL "lv2.Spatial" ///< The LV2 plugin class SpatialPlugin: a plugin that places or moves a sound in space. (from LV2_CORE_TERMS#SpatialPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_SPATIAL, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_SPATIAL_TEXT_EN "The LV2 plugin class SpatialPlugin: a plugin that places or moves a sound in space."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_SPECTRAL "lv2.Spectral" ///< The LV2 plugin class SpectralPlugin: a plugin that processes a sound in the frequency domain. (from LV2_CORE_TERMS#SpectralPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_SPECTRAL, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_SPECTRAL_TEXT_EN "The LV2 plugin class SpectralPlugin: a plugin that processes a sound in the frequency domain."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_UTILITY "lv2.Utility" ///< The LV2 plugin class UtilityPlugin: a plugin that does audio housekeeping rather than a creative effect. (from LV2_CORE_TERMS#UtilityPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_UTILITY, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_UTILITY_TEXT_EN "The LV2 plugin class UtilityPlugin: a plugin that does audio housekeeping rather than a creative effect."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_WAVESHAPER "lv2.Waveshaper" ///< The LV2 plugin class WaveshaperPlugin: a plugin that reshapes a waveform to add harmonics. (from LV2_CORE_TERMS#WaveshaperPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_WAVESHAPER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_WAVESHAPER_TEXT_EN "The LV2 plugin class WaveshaperPlugin: a plugin that reshapes a waveform to add harmonics."
/** The number of words of PLUGIN_FEATURE_AUDIO_EFFECT, the length of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_INIT. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_COUNT 58u
/** The words of PLUGIN_FEATURE_AUDIO_EFFECT in declaration order, an initialiser of const char *. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_INIT { "clap.audio-effect", "clap.chorus", "clap.compressor", "clap.de-esser", "clap.delay", "clap.distortion", "clap.equalizer", "clap.expander", "clap.filter", "clap.flanger", "clap.frequency-shifter", "clap.gate", "clap.glitch", "clap.granular", "clap.limiter", "clap.mastering", "clap.mixing", "clap.multi-effects", "clap.phase-vocoder", "clap.phaser", "clap.pitch-correction", "clap.pitch-shifter", "clap.restoration", "clap.reverb", "clap.transient-shaper", "clap.tremolo", "clap.utility", "lv2.Allpass", "lv2.Amplifier", "lv2.Bandpass", "lv2.Chorus", "lv2.Comb", "lv2.Compressor", "lv2.Converter", "lv2.Delay", "lv2.Distortion", "lv2.Dynamics", "lv2.EQ", "lv2.Envelope", "lv2.Expander", "lv2.Filter", "lv2.Flanger", "lv2.Gate", "lv2.Highpass", "lv2.Limiter", "lv2.Lowpass", "lv2.Mixer", "lv2.Modulator", "lv2.MultiEQ", "lv2.ParaEQ", "lv2.Phaser", "lv2.Pitch", "lv2.Reverb", "lv2.Simulator", "lv2.Spatial", "lv2.Spectral", "lv2.Utility", "lv2.Waveshaper" }
/// @}

/**
 * @name PLUGIN_FEATURE_INSTRUMENT (data/plugin-features.json)
 * The CLAP plugin features and LV2 plugin classes that become the descriptor feature instrument: notes in, audio out. (since 3.7.0)
 */
/// @{
#define OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_DRUM "clap.drum" ///< The CLAP plugin feature drum: an instrument that plays drum sounds. (from CLAP_PLUGIN_FEATURES_TERMS#drum)
/** The English sentence of OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_DRUM, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_DRUM_TEXT_EN "The CLAP plugin feature drum: an instrument that plays drum sounds."
#define OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_DRUM_MACHINE "clap.drum-machine" ///< The CLAP plugin feature drum-machine: an instrument that sequences and plays drum sounds. (from CLAP_PLUGIN_FEATURES_TERMS#drum-machine)
/** The English sentence of OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_DRUM_MACHINE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_DRUM_MACHINE_TEXT_EN "The CLAP plugin feature drum-machine: an instrument that sequences and plays drum sounds."
#define OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_INSTRUMENT "clap.instrument" ///< The CLAP plugin feature instrument: a plugin played by notes, with no more specific kind declared. (from CLAP_PLUGIN_FEATURES_TERMS#instrument)
/** The English sentence of OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_INSTRUMENT, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_INSTRUMENT_TEXT_EN "The CLAP plugin feature instrument: a plugin played by notes, with no more specific kind declared."
#define OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_SAMPLER "clap.sampler" ///< The CLAP plugin feature sampler: an instrument that plays recorded samples. (from CLAP_PLUGIN_FEATURES_TERMS#sampler)
/** The English sentence of OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_SAMPLER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_SAMPLER_TEXT_EN "The CLAP plugin feature sampler: an instrument that plays recorded samples."
#define OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_SYNTHESIZER "clap.synthesizer" ///< The CLAP plugin feature synthesizer: an instrument that generates its own sound rather than playing samples. (from CLAP_PLUGIN_FEATURES_TERMS#synthesizer)
/** The English sentence of OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_SYNTHESIZER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_SYNTHESIZER_TEXT_EN "The CLAP plugin feature synthesizer: an instrument that generates its own sound rather than playing samples."
#define OMX_PLUGIN_FEATURE_INSTRUMENT_LV2_INSTRUMENT "lv2.Instrument" ///< The LV2 plugin class InstrumentPlugin: a plugin played by notes. (from LV2_CORE_TERMS#InstrumentPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_INSTRUMENT_LV2_INSTRUMENT, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_INSTRUMENT_LV2_INSTRUMENT_TEXT_EN "The LV2 plugin class InstrumentPlugin: a plugin played by notes."
/** The number of words of PLUGIN_FEATURE_INSTRUMENT, the length of OMX_PLUGIN_FEATURE_INSTRUMENT_INIT. */
#define OMX_PLUGIN_FEATURE_INSTRUMENT_COUNT 6u
/** The words of PLUGIN_FEATURE_INSTRUMENT in declaration order, an initialiser of const char *. */
#define OMX_PLUGIN_FEATURE_INSTRUMENT_INIT { "clap.drum", "clap.drum-machine", "clap.instrument", "clap.sampler", "clap.synthesizer", "lv2.Instrument" }
/// @}

/**
 * @name PLUGIN_FEATURE_NOTE_EFFECT (data/plugin-features.json)
 * The CLAP plugin features and LV2 plugin classes that become the descriptor feature note-effect: notes in, notes out. (since 3.7.0)
 */
/// @{
#define OMX_PLUGIN_FEATURE_NOTE_EFFECT_CLAP_NOTE_EFFECT "clap.note-effect" ///< The CLAP plugin feature note-effect: a plugin that reads notes and writes notes, such as an arpeggiator. (from CLAP_PLUGIN_FEATURES_TERMS#note-effect)
/** The English sentence of OMX_PLUGIN_FEATURE_NOTE_EFFECT_CLAP_NOTE_EFFECT, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_NOTE_EFFECT_CLAP_NOTE_EFFECT_TEXT_EN "The CLAP plugin feature note-effect: a plugin that reads notes and writes notes, such as an arpeggiator."
#define OMX_PLUGIN_FEATURE_NOTE_EFFECT_LV2_MIDI "lv2.MIDI" ///< The LV2 plugin class MIDIPlugin: a plugin that processes MIDI, note in to note out. (from LV2_CORE_TERMS#MIDIPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_NOTE_EFFECT_LV2_MIDI, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_NOTE_EFFECT_LV2_MIDI_TEXT_EN "The LV2 plugin class MIDIPlugin: a plugin that processes MIDI, note in to note out."
/** The number of words of PLUGIN_FEATURE_NOTE_EFFECT, the length of OMX_PLUGIN_FEATURE_NOTE_EFFECT_INIT. */
#define OMX_PLUGIN_FEATURE_NOTE_EFFECT_COUNT 2u
/** The words of PLUGIN_FEATURE_NOTE_EFFECT in declaration order, an initialiser of const char *. */
#define OMX_PLUGIN_FEATURE_NOTE_EFFECT_INIT { "clap.note-effect", "lv2.MIDI" }
/// @}

/**
 * @name PLUGIN_FEATURE_ANALYZER (data/plugin-features.json)
 * The CLAP plugin features and LV2 plugin classes that become the descriptor feature analyzer: audio in, a reading out (a note detector reads pitch from audio). (since 3.7.0)
 */
/// @{
#define OMX_PLUGIN_FEATURE_ANALYZER_CLAP_ANALYZER "clap.analyzer" ///< The CLAP plugin feature analyzer: a plugin that reads audio and reports a measurement, with no further output. (from CLAP_PLUGIN_FEATURES_TERMS#analyzer)
/** The English sentence of OMX_PLUGIN_FEATURE_ANALYZER_CLAP_ANALYZER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_ANALYZER_CLAP_ANALYZER_TEXT_EN "The CLAP plugin feature analyzer: a plugin that reads audio and reports a measurement, with no further output."
#define OMX_PLUGIN_FEATURE_ANALYZER_CLAP_NOTE_DETECTOR "clap.note-detector" ///< The CLAP plugin feature note-detector: an analyzer that reads pitch from audio. (from CLAP_PLUGIN_FEATURES_TERMS#note-detector)
/** The English sentence of OMX_PLUGIN_FEATURE_ANALYZER_CLAP_NOTE_DETECTOR, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_ANALYZER_CLAP_NOTE_DETECTOR_TEXT_EN "The CLAP plugin feature note-detector: an analyzer that reads pitch from audio."
#define OMX_PLUGIN_FEATURE_ANALYZER_LV2_ANALYSER "lv2.Analyser" ///< The LV2 plugin class AnalyserPlugin: a plugin that reads audio and reports a measurement. (from LV2_CORE_TERMS#AnalyserPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_ANALYZER_LV2_ANALYSER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_ANALYZER_LV2_ANALYSER_TEXT_EN "The LV2 plugin class AnalyserPlugin: a plugin that reads audio and reports a measurement."
/** The number of words of PLUGIN_FEATURE_ANALYZER, the length of OMX_PLUGIN_FEATURE_ANALYZER_INIT. */
#define OMX_PLUGIN_FEATURE_ANALYZER_COUNT 3u
/** The words of PLUGIN_FEATURE_ANALYZER in declaration order, an initialiser of const char *. */
#define OMX_PLUGIN_FEATURE_ANALYZER_INIT { "clap.analyzer", "clap.note-detector", "lv2.Analyser" }
/// @}

/**
 * @name PLUGIN_FEATURE_OTHER (data/plugin-features.json)
 * The CLAP plugin features and LV2 plugin classes that fit none of the four feature words: a channel layout stated as a feature (mono, stereo, surround, ambisonic), and the LV2 classes of a generator, an oscillator, a constant and a function, which take no notes and so are no instrument. A scan carries them in the extension bag. (since 3.7.0)
 */
/// @{
#define OMX_PLUGIN_FEATURE_OTHER_CLAP_AMBISONIC "clap.ambisonic" ///< The CLAP plugin feature ambisonic: a plugin declared to work in an ambisonic channel layout. (from CLAP_PLUGIN_FEATURES_TERMS#ambisonic)
/** The English sentence of OMX_PLUGIN_FEATURE_OTHER_CLAP_AMBISONIC, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_OTHER_CLAP_AMBISONIC_TEXT_EN "The CLAP plugin feature ambisonic: a plugin declared to work in an ambisonic channel layout."
#define OMX_PLUGIN_FEATURE_OTHER_CLAP_MONO "clap.mono" ///< The CLAP plugin feature mono: a plugin declared to work in a mono channel layout. (from CLAP_PLUGIN_FEATURES_TERMS#mono)
/** The English sentence of OMX_PLUGIN_FEATURE_OTHER_CLAP_MONO, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_OTHER_CLAP_MONO_TEXT_EN "The CLAP plugin feature mono: a plugin declared to work in a mono channel layout."
#define OMX_PLUGIN_FEATURE_OTHER_CLAP_STEREO "clap.stereo" ///< The CLAP plugin feature stereo: a plugin declared to work in a stereo channel layout. (from CLAP_PLUGIN_FEATURES_TERMS#stereo)
/** The English sentence of OMX_PLUGIN_FEATURE_OTHER_CLAP_STEREO, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_OTHER_CLAP_STEREO_TEXT_EN "The CLAP plugin feature stereo: a plugin declared to work in a stereo channel layout."
#define OMX_PLUGIN_FEATURE_OTHER_CLAP_SURROUND "clap.surround" ///< The CLAP plugin feature surround: a plugin declared to work in a surround channel layout. (from CLAP_PLUGIN_FEATURES_TERMS#surround)
/** The English sentence of OMX_PLUGIN_FEATURE_OTHER_CLAP_SURROUND, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_OTHER_CLAP_SURROUND_TEXT_EN "The CLAP plugin feature surround: a plugin declared to work in a surround channel layout."
#define OMX_PLUGIN_FEATURE_OTHER_LV2_CONSTANT "lv2.Constant" ///< The LV2 plugin class ConstantPlugin: a plugin with no input that outputs a constant. (from LV2_CORE_TERMS#ConstantPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_OTHER_LV2_CONSTANT, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_OTHER_LV2_CONSTANT_TEXT_EN "The LV2 plugin class ConstantPlugin: a plugin with no input that outputs a constant."
#define OMX_PLUGIN_FEATURE_OTHER_LV2_FUNCTION "lv2.Function" ///< The LV2 plugin class FunctionPlugin: a plugin with no audio input or output, used only for its side effects or parameters. (from LV2_CORE_TERMS#FunctionPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_OTHER_LV2_FUNCTION, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_OTHER_LV2_FUNCTION_TEXT_EN "The LV2 plugin class FunctionPlugin: a plugin with no audio input or output, used only for its side effects or parameters."
#define OMX_PLUGIN_FEATURE_OTHER_LV2_GENERATOR "lv2.Generator" ///< The LV2 plugin class GeneratorPlugin: a plugin with no audio input that generates a sound. (from LV2_CORE_TERMS#GeneratorPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_OTHER_LV2_GENERATOR, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_OTHER_LV2_GENERATOR_TEXT_EN "The LV2 plugin class GeneratorPlugin: a plugin with no audio input that generates a sound."
#define OMX_PLUGIN_FEATURE_OTHER_LV2_OSCILLATOR "lv2.Oscillator" ///< The LV2 plugin class OscillatorPlugin: a generator that outputs a periodic waveform. (from LV2_CORE_TERMS#OscillatorPlugin)
/** The English sentence of OMX_PLUGIN_FEATURE_OTHER_LV2_OSCILLATOR, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_OTHER_LV2_OSCILLATOR_TEXT_EN "The LV2 plugin class OscillatorPlugin: a generator that outputs a periodic waveform."
#define OMX_PLUGIN_FEATURE_OTHER_LV2_PLUGIN "lv2.Plugin" ///< The LV2 plugin class Plugin: the base LV2 plugin class, with no more specific class declared. (from LV2_CORE_TERMS#Plugin)
/** The English sentence of OMX_PLUGIN_FEATURE_OTHER_LV2_PLUGIN, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_PLUGIN_FEATURE_OTHER_LV2_PLUGIN_TEXT_EN "The LV2 plugin class Plugin: the base LV2 plugin class, with no more specific class declared."
/** The number of words of PLUGIN_FEATURE_OTHER, the length of OMX_PLUGIN_FEATURE_OTHER_INIT. */
#define OMX_PLUGIN_FEATURE_OTHER_COUNT 9u
/** The words of PLUGIN_FEATURE_OTHER in declaration order, an initialiser of const char *. */
#define OMX_PLUGIN_FEATURE_OTHER_INIT { "clap.ambisonic", "clap.mono", "clap.stereo", "clap.surround", "lv2.Constant", "lv2.Function", "lv2.Generator", "lv2.Oscillator", "lv2.Plugin" }
/// @}

/**
 * @name RESOURCE_KINDS (data/resource-profile.json)
 * Every resource a host plans a plugin for (FreeMixer/plugin-qualify#116): each measured per machine class, judged per host profile, and unknown, never a pass, when it has no figure. (since 2.18.0)
 */
/// @{
#define OMX_RESOURCE_KINDS_CPU "cpu" ///< The cost per sample at a rate and quantum, its percentile and its tail (plugin-qualify#115).
/** The English sentence of OMX_RESOURCE_KINDS_CPU, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_KINDS_CPU_TEXT_EN "The cost per sample at a rate and quantum, its percentile and its tail."
#define OMX_RESOURCE_KINDS_MEMORY "memory" ///< The footprint per instance and its growth over a soak (plugin-qualify#114).
/** The English sentence of OMX_RESOURCE_KINDS_MEMORY, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_KINDS_MEMORY_TEXT_EN "The footprint per instance and its growth over a soak."
#define OMX_RESOURCE_KINDS_SCRATCH_MEMORY "scratch-memory" ///< The memory a plugin asks of its host for its process call. (from CLAP_EXT_DRAFT_SCRATCH_MEMORY_TERMS#scratch-memory/1)
/** The English sentence of OMX_RESOURCE_KINDS_SCRATCH_MEMORY, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_KINDS_SCRATCH_MEMORY_TEXT_EN "The memory a plugin asks of its host for its process call."
#define OMX_RESOURCE_KINDS_LATENCY "latency" ///< The frames a plugin delays its output by, per rate and quantum. (from LV2_CORE_TERMS#latency, CLAP_EXT_LATENCY_TERMS#latency)
/** The English sentence of OMX_RESOURCE_KINDS_LATENCY, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_KINDS_LATENCY_TEXT_EN "The frames a plugin delays its output by, per rate and quantum."
#define OMX_RESOURCE_KINDS_TAIL "tail" ///< How long a plugin keeps sounding once its input goes silent. (from CLAP_EXT_TAIL_TERMS#tail)
/** The English sentence of OMX_RESOURCE_KINDS_TAIL, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_KINDS_TAIL_TEXT_EN "How long a plugin keeps sounding once its input goes silent."
#define OMX_RESOURCE_KINDS_VOICES "voices" ///< The notes an instrument plays at once. (from CLAP_EXT_VOICE_INFO_TERMS#voice-info)
/** The English sentence of OMX_RESOURCE_KINDS_VOICES, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_KINDS_VOICES_TEXT_EN "The notes an instrument plays at once."
#define OMX_RESOURCE_KINDS_STARTUP "startup" ///< The wall time of instantiate, activate and the first block.
/** The English sentence of OMX_RESOURCE_KINDS_STARTUP, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_KINDS_STARTUP_TEXT_EN "The wall time of instantiate, activate and the first block."
#define OMX_RESOURCE_KINDS_THREADS "threads" ///< The threads a plugin starts and their scheduling class, or the host thread pool it asks for. (from CLAP_EXT_THREAD_POOL_TERMS#thread-pool)
/** The English sentence of OMX_RESOURCE_KINDS_THREADS, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_KINDS_THREADS_TEXT_EN "The threads a plugin starts and their scheduling class, or the host thread pool it asks for."
#define OMX_RESOURCE_KINDS_WORKER "worker" ///< The work a plugin hands to a non-real-time thread of the host. (from LV2_WORKER_TERMS#schedule, LV2_WORKER_TERMS#interface)
/** The English sentence of OMX_RESOURCE_KINDS_WORKER, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_KINDS_WORKER_TEXT_EN "The work a plugin hands to a non-real-time thread of the host."
#define OMX_RESOURCE_KINDS_BLOCK_LENGTH "block-length" ///< The block lengths a plugin accepts. (from LV2_BUF_SIZE_TERMS#boundedBlockLength, LV2_BUF_SIZE_TERMS#maxBlockLength, LV2_BUF_SIZE_TERMS#minBlockLength, LV2_BUF_SIZE_TERMS#nominalBlockLength, LV2_OPTIONS_TERMS#options)
/** The English sentence of OMX_RESOURCE_KINDS_BLOCK_LENGTH, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_KINDS_BLOCK_LENGTH_TEXT_EN "The block lengths a plugin accepts."
#define OMX_RESOURCE_KINDS_OPEN_FILES "open-files" ///< The file descriptors a plugin holds after activate, and their growth.
/** The English sentence of OMX_RESOURCE_KINDS_OPEN_FILES, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_KINDS_OPEN_FILES_TEXT_EN "The file descriptors a plugin holds after activate, and their growth."
#define OMX_RESOURCE_KINDS_DISK_IO "disk-io" ///< The bytes a plugin reads at load and while it processes.
/** The English sentence of OMX_RESOURCE_KINDS_DISK_IO, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_KINDS_DISK_IO_TEXT_EN "The bytes a plugin reads at load and while it processes."
#define OMX_RESOURCE_KINDS_NETWORK "network" ///< Any socket a plugin opens.
/** The English sentence of OMX_RESOURCE_KINDS_NETWORK, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_KINDS_NETWORK_TEXT_EN "Any socket a plugin opens."
#define OMX_RESOURCE_KINDS_STATE "state" ///< The size of a plugin's saved state, its save and restore time, and its round trip. (from LV2_STATE_TERMS#interface, CLAP_EXT_STATE_TERMS#state)
/** The English sentence of OMX_RESOURCE_KINDS_STATE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_KINDS_STATE_TEXT_EN "The size of a plugin's saved state, its save and restore time, and its round trip."
/** The number of words of RESOURCE_KINDS, the length of OMX_RESOURCE_KINDS_INIT. */
#define OMX_RESOURCE_KINDS_COUNT 14u
/** The words of RESOURCE_KINDS in declaration order, an initialiser of const char *. */
#define OMX_RESOURCE_KINDS_INIT { "cpu", "memory", "scratch-memory", "latency", "tail", "voices", "startup", "threads", "worker", "block-length", "open-files", "disk-io", "network", "state" }
/// @}

/**
 * @name RESOURCE_UNITS (data/resource-profile.json)
 * The units a resource figure is given in; an LV2 unit's name where LV2 has one. (since 2.18.0)
 */
/// @{
#define OMX_RESOURCE_UNITS_NS_PER_SAMPLE "ns-per-sample" ///< Nanoseconds per sample.
/** The English sentence of OMX_RESOURCE_UNITS_NS_PER_SAMPLE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_UNITS_NS_PER_SAMPLE_TEXT_EN "Nanoseconds per sample."
#define OMX_RESOURCE_UNITS_FRAMES "frames" ///< A count of audio frames. (from LV2_UNITS_TERMS#frame)
/** The English sentence of OMX_RESOURCE_UNITS_FRAMES, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_UNITS_FRAMES_TEXT_EN "A count of audio frames."
#define OMX_RESOURCE_UNITS_MS "ms" ///< Milliseconds. (from LV2_UNITS_TERMS#ms)
/** The English sentence of OMX_RESOURCE_UNITS_MS, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_UNITS_MS_TEXT_EN "Milliseconds."
#define OMX_RESOURCE_UNITS_US "us" ///< Microseconds.
/** The English sentence of OMX_RESOURCE_UNITS_US, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_UNITS_US_TEXT_EN "Microseconds."
#define OMX_RESOURCE_UNITS_S "s" ///< Seconds. (from LV2_UNITS_TERMS#s)
/** The English sentence of OMX_RESOURCE_UNITS_S, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_UNITS_S_TEXT_EN "Seconds."
#define OMX_RESOURCE_UNITS_BYTES "bytes" ///< Bytes.
/** The English sentence of OMX_RESOURCE_UNITS_BYTES, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_UNITS_BYTES_TEXT_EN "Bytes."
#define OMX_RESOURCE_UNITS_PLAIN_COUNT "count" ///< A plain count, with no unit.
/** The English sentence of OMX_RESOURCE_UNITS_PLAIN_COUNT, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_UNITS_PLAIN_COUNT_TEXT_EN "A plain count, with no unit."
#define OMX_RESOURCE_UNITS_RATIO "ratio" ///< A ratio, with no unit.
/** The English sentence of OMX_RESOURCE_UNITS_RATIO, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_UNITS_RATIO_TEXT_EN "A ratio, with no unit."
#define OMX_RESOURCE_UNITS_FLAG "flag" ///< A yes or a no: one when the plugin does the thing, zero when it does not.
/** The English sentence of OMX_RESOURCE_UNITS_FLAG, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_UNITS_FLAG_TEXT_EN "A yes or a no: one when the plugin does the thing, zero when it does not."
/** The number of words of RESOURCE_UNITS, the length of OMX_RESOURCE_UNITS_INIT. */
#define OMX_RESOURCE_UNITS_COUNT 9u
/** The words of RESOURCE_UNITS in declaration order, an initialiser of const char *. */
#define OMX_RESOURCE_UNITS_INIT { "ns-per-sample", "frames", "ms", "us", "s", "bytes", "count", "ratio", "flag" }
/// @}

/**
 * @name RESOURCE_BASES (data/resource-profile.json)
 * How a resource figure was known: what the plugin declares, what a run measured, or a count the caller gave the probe. (since 2.18.0)
 */
/// @{
#define OMX_RESOURCE_BASES_DECLARED "declared" ///< What the plugin declares about itself.
/** The English sentence of OMX_RESOURCE_BASES_DECLARED, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_BASES_DECLARED_TEXT_EN "What the plugin declares about itself."
#define OMX_RESOURCE_BASES_MEASURED "measured" ///< What a run measured.
/** The English sentence of OMX_RESOURCE_BASES_MEASURED, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_BASES_MEASURED_TEXT_EN "What a run measured."
#define OMX_RESOURCE_BASES_PROBE "probe" ///< A count the caller gave the probe.
/** The English sentence of OMX_RESOURCE_BASES_PROBE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_BASES_PROBE_TEXT_EN "A count the caller gave the probe."
/** The number of words of RESOURCE_BASES, the length of OMX_RESOURCE_BASES_INIT. */
#define OMX_RESOURCE_BASES_COUNT 3u
/** The words of RESOURCE_BASES in declaration order, an initialiser of const char *. */
#define OMX_RESOURCE_BASES_INIT { "declared", "measured", "probe" }
/// @}

/**
 * @name RESOURCE_MEMORY_PHASES (data/resource-profile.json)
 * When a plugin's memory is read, per instance (plugin-qualify#114): after instantiate, after activate, at rest after processing, with notes held, and for a second instance, so a shared one-time load is told apart from the per-instance cost. (since 2.18.0)
 */
/// @{
#define OMX_RESOURCE_MEMORY_PHASES_AFTER_INSTANTIATE "after-instantiate" ///< Memory read right after the plugin instantiates.
/** The English sentence of OMX_RESOURCE_MEMORY_PHASES_AFTER_INSTANTIATE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_MEMORY_PHASES_AFTER_INSTANTIATE_TEXT_EN "Memory read right after the plugin instantiates."
#define OMX_RESOURCE_MEMORY_PHASES_AFTER_ACTIVATE "after-activate" ///< Memory read right after the plugin activates.
/** The English sentence of OMX_RESOURCE_MEMORY_PHASES_AFTER_ACTIVATE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_MEMORY_PHASES_AFTER_ACTIVATE_TEXT_EN "Memory read right after the plugin activates."
#define OMX_RESOURCE_MEMORY_PHASES_AT_REST "at-rest" ///< Memory read at rest, after processing, with no note playing.
/** The English sentence of OMX_RESOURCE_MEMORY_PHASES_AT_REST, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_MEMORY_PHASES_AT_REST_TEXT_EN "Memory read at rest, after processing, with no note playing."
#define OMX_RESOURCE_MEMORY_PHASES_NOTES_HELD "notes-held" ///< Memory read while notes are held.
/** The English sentence of OMX_RESOURCE_MEMORY_PHASES_NOTES_HELD, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_MEMORY_PHASES_NOTES_HELD_TEXT_EN "Memory read while notes are held."
#define OMX_RESOURCE_MEMORY_PHASES_SECOND_INSTANCE "second-instance" ///< Memory read for a second instance, so a shared one-time load is told apart from the per-instance cost.
/** The English sentence of OMX_RESOURCE_MEMORY_PHASES_SECOND_INSTANCE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_MEMORY_PHASES_SECOND_INSTANCE_TEXT_EN "Memory read for a second instance, so a shared one-time load is told apart from the per-instance cost."
/** The number of words of RESOURCE_MEMORY_PHASES, the length of OMX_RESOURCE_MEMORY_PHASES_INIT. */
#define OMX_RESOURCE_MEMORY_PHASES_COUNT 5u
/** The words of RESOURCE_MEMORY_PHASES in declaration order, an initialiser of const char *. */
#define OMX_RESOURCE_MEMORY_PHASES_INIT { "after-instantiate", "after-activate", "at-rest", "notes-held", "second-instance" }
/// @}

/**
 * @name RESOURCE_UNMEASURED_REASONS (data/resource-profile.json)
 * Why a resource has no figure a host profile can read, beside the measurement's own reasons (MEASUREMENT_UNMEASURED_REASONS). (since 2.18.0)
 */
/// @{
#define OMX_RESOURCE_UNMEASURED_REASONS_UNMEASURED_ON_CLASS "unmeasured-on-class" ///< The only figure was taken on another machine class: never read as a pass, never scaled.
/** The English sentence of OMX_RESOURCE_UNMEASURED_REASONS_UNMEASURED_ON_CLASS, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_UNMEASURED_REASONS_UNMEASURED_ON_CLASS_TEXT_EN "The only figure was taken on another machine class: never read as a pass, never scaled."
#define OMX_RESOURCE_UNMEASURED_REASONS_LIMIT_EXCEEDED "limit-exceeded" ///< The run hit the limit probe isolation set for the resource; the limit is recorded beside it.
/** The English sentence of OMX_RESOURCE_UNMEASURED_REASONS_LIMIT_EXCEEDED, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_UNMEASURED_REASONS_LIMIT_EXCEEDED_TEXT_EN "The run hit the limit probe isolation set for the resource; the limit is recorded beside it."
/** The number of words of RESOURCE_UNMEASURED_REASONS, the length of OMX_RESOURCE_UNMEASURED_REASONS_INIT. */
#define OMX_RESOURCE_UNMEASURED_REASONS_COUNT 2u
/** The words of RESOURCE_UNMEASURED_REASONS in declaration order, an initialiser of const char *. */
#define OMX_RESOURCE_UNMEASURED_REASONS_INIT { "unmeasured-on-class", "limit-exceeded" }
/// @}

/**
 * @name RESOURCE_BUDGET_SCOPES (data/resource-profile.json)
 * What a host profile's budget for a resource is counted over (plugin-qualify#114, #115): one plugin instance, or the whole console. (since 2.18.0)
 */
/// @{
#define OMX_RESOURCE_BUDGET_SCOPES_PER_INSTANCE "per-instance" ///< Counted over one plugin instance.
/** The English sentence of OMX_RESOURCE_BUDGET_SCOPES_PER_INSTANCE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_BUDGET_SCOPES_PER_INSTANCE_TEXT_EN "Counted over one plugin instance."
#define OMX_RESOURCE_BUDGET_SCOPES_PER_CONSOLE "per-console" ///< Counted over the whole console.
/** The English sentence of OMX_RESOURCE_BUDGET_SCOPES_PER_CONSOLE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_BUDGET_SCOPES_PER_CONSOLE_TEXT_EN "Counted over the whole console."
/** The number of words of RESOURCE_BUDGET_SCOPES, the length of OMX_RESOURCE_BUDGET_SCOPES_INIT. */
#define OMX_RESOURCE_BUDGET_SCOPES_COUNT 2u
/** The words of RESOURCE_BUDGET_SCOPES in declaration order, an initialiser of const char *. */
#define OMX_RESOURCE_BUDGET_SCOPES_INIT { "per-instance", "per-console" }
/// @}

/**
 * @name RESOURCE_HOST_ISOLATIONS (data/resource-profile.json)
 * How a host runs its plugins. (since 2.18.0)
 */
/// @{
#define OMX_RESOURCE_HOST_ISOLATIONS_IN_PROCESS "in-process" ///< The host runs its plugins in its own process.
/** The English sentence of OMX_RESOURCE_HOST_ISOLATIONS_IN_PROCESS, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_HOST_ISOLATIONS_IN_PROCESS_TEXT_EN "The host runs its plugins in its own process."
#define OMX_RESOURCE_HOST_ISOLATIONS_PER_PROCESS "per-process" ///< The host runs each plugin in its own process.
/** The English sentence of OMX_RESOURCE_HOST_ISOLATIONS_PER_PROCESS, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_HOST_ISOLATIONS_PER_PROCESS_TEXT_EN "The host runs each plugin in its own process."
#define OMX_RESOURCE_HOST_ISOLATIONS_SHARED_PROCESS "shared-process" ///< The host runs its plugins together in one process apart from its own.
/** The English sentence of OMX_RESOURCE_HOST_ISOLATIONS_SHARED_PROCESS, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_HOST_ISOLATIONS_SHARED_PROCESS_TEXT_EN "The host runs its plugins together in one process apart from its own."
/** The number of words of RESOURCE_HOST_ISOLATIONS, the length of OMX_RESOURCE_HOST_ISOLATIONS_INIT. */
#define OMX_RESOURCE_HOST_ISOLATIONS_COUNT 3u
/** The words of RESOURCE_HOST_ISOLATIONS in declaration order, an initialiser of const char *. */
#define OMX_RESOURCE_HOST_ISOLATIONS_INIT { "in-process", "per-process", "shared-process" }
/// @}

/**
 * @name RESOURCE_HOST_LATENCY_HANDLING (data/resource-profile.json)
 * Whether a host aligns on a plugin's reported latency or only passes it on. (since 2.18.0)
 */
/// @{
#define OMX_RESOURCE_HOST_LATENCY_HANDLING_COMPENSATED "compensated" ///< The host delays every other path to align on this plugin's reported latency.
/** The English sentence of OMX_RESOURCE_HOST_LATENCY_HANDLING_COMPENSATED, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_HOST_LATENCY_HANDLING_COMPENSATED_TEXT_EN "The host delays every other path to align on this plugin's reported latency."
#define OMX_RESOURCE_HOST_LATENCY_HANDLING_UNCOMPENSATED "uncompensated" ///< The host passes the plugin's reported latency on, without aligning other paths to it.
/** The English sentence of OMX_RESOURCE_HOST_LATENCY_HANDLING_UNCOMPENSATED, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_HOST_LATENCY_HANDLING_UNCOMPENSATED_TEXT_EN "The host passes the plugin's reported latency on, without aligning other paths to it."
/** The number of words of RESOURCE_HOST_LATENCY_HANDLING, the length of OMX_RESOURCE_HOST_LATENCY_HANDLING_INIT. */
#define OMX_RESOURCE_HOST_LATENCY_HANDLING_COUNT 2u
/** The words of RESOURCE_HOST_LATENCY_HANDLING in declaration order, an initialiser of const char *. */
#define OMX_RESOURCE_HOST_LATENCY_HANDLING_INIT { "compensated", "uncompensated" }
/// @}

/**
 * @name RESOURCE_THREAD_SCHEDULING (data/resource-profile.json)
 * The scheduling class a host gives its plugin's threads, as the probe output records it. (since 2.18.0)
 */
/// @{
#define OMX_RESOURCE_THREAD_SCHEDULING_NONE "none" ///< No particular scheduling class: the thread runs as any other.
/** The English sentence of OMX_RESOURCE_THREAD_SCHEDULING_NONE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_THREAD_SCHEDULING_NONE_TEXT_EN "No particular scheduling class: the thread runs as any other."
#define OMX_RESOURCE_THREAD_SCHEDULING_FIFO "fifo" ///< The real-time FIFO scheduling class.
/** The English sentence of OMX_RESOURCE_THREAD_SCHEDULING_FIFO, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_THREAD_SCHEDULING_FIFO_TEXT_EN "The real-time FIFO scheduling class."
/** The number of words of RESOURCE_THREAD_SCHEDULING, the length of OMX_RESOURCE_THREAD_SCHEDULING_INIT. */
#define OMX_RESOURCE_THREAD_SCHEDULING_COUNT 2u
/** The words of RESOURCE_THREAD_SCHEDULING in declaration order, an initialiser of const char *. */
#define OMX_RESOURCE_THREAD_SCHEDULING_INIT { "none", "fifo" }
/// @}

/**
 * @name RESOURCE_HINTS (data/resource-profile.json)
 * What a plugin declares about its own footprint, in openmixer's own hints (FreeMixer/plugin-qualify#116): each a claim plugin-qualify measures and checks, carried by the extension below, as the CLAP draft and as LV2 properties. A hint a plugin does not state is unknown, never zero. (since 3.1.0)
 */
/// @{
#define OMX_RESOURCE_HINTS_FOOTPRINT_AT_REST "footprint-at-rest" ///< The memory one instance holds at rest, once activated and idle, with no note playing.
/** The English sentence of OMX_RESOURCE_HINTS_FOOTPRINT_AT_REST, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_HINTS_FOOTPRINT_AT_REST_TEXT_EN "The memory one instance holds at rest, once activated and idle, with no note playing."
#define OMX_RESOURCE_HINTS_FOOTPRINT_PER_VOICE "footprint-per-voice" ///< The memory each voice adds while it plays, for an instrument.
/** The English sentence of OMX_RESOURCE_HINTS_FOOTPRINT_PER_VOICE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_HINTS_FOOTPRINT_PER_VOICE_TEXT_EN "The memory each voice adds while it plays, for an instrument."
#define OMX_RESOURCE_HINTS_SHARED_LOAD "shared-load" ///< The one-time load every instance of the plugin shares, counted once however many are instantiated.
/** The English sentence of OMX_RESOURCE_HINTS_SHARED_LOAD, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_HINTS_SHARED_LOAD_TEXT_EN "The one-time load every instance of the plugin shares, counted once however many are instantiated."
#define OMX_RESOURCE_HINTS_THREADS_SPAWNED "threads-spawned" ///< The threads the plugin starts itself, apart from any it asks the host pool for.
/** The English sentence of OMX_RESOURCE_HINTS_THREADS_SPAWNED, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_HINTS_THREADS_SPAWNED_TEXT_EN "The threads the plugin starts itself, apart from any it asks the host pool for."
#define OMX_RESOURCE_HINTS_STREAMS_FROM_DISK "streams-from-disk" ///< Whether the plugin reads from disk while it processes.
/** The English sentence of OMX_RESOURCE_HINTS_STREAMS_FROM_DISK, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_HINTS_STREAMS_FROM_DISK_TEXT_EN "Whether the plugin reads from disk while it processes."
#define OMX_RESOURCE_HINTS_OPENS_SOCKETS "opens-sockets" ///< Whether the plugin opens any socket.
/** The English sentence of OMX_RESOURCE_HINTS_OPENS_SOCKETS, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_HINTS_OPENS_SOCKETS_TEXT_EN "Whether the plugin opens any socket."
#define OMX_RESOURCE_HINTS_ACTIVATE_TIME "activate-time" ///< The wall time of activate and the first block the plugin expects.
/** The English sentence of OMX_RESOURCE_HINTS_ACTIVATE_TIME, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_RESOURCE_HINTS_ACTIVATE_TIME_TEXT_EN "The wall time of activate and the first block the plugin expects."
/** The number of words of RESOURCE_HINTS, the length of OMX_RESOURCE_HINTS_INIT. */
#define OMX_RESOURCE_HINTS_COUNT 7u
/** The words of RESOURCE_HINTS in declaration order, an initialiser of const char *. */
#define OMX_RESOURCE_HINTS_INIT { "footprint-at-rest", "footprint-per-voice", "shared-load", "threads-spawned", "streams-from-disk", "opens-sockets", "activate-time" }
/// @}

/**
 * @name SCAN_DOCUMENTS (data/scan.json)
 * The documents a plugin scan writes, named here and owned elsewhere: the contract names them so the writers and readers cite one word, and keeps no shape of its own for them. (since 3.7.0)
 */
/// @{
#define OMX_SCAN_DOCUMENTS_CLAP_SCAN_DOCUMENT "CLAP_SCAN_DOCUMENT" ///< The JSON document of omx-clap-scan, one entry per file with its plugins, parameters and ports. Owned by omx-clap-core, which writes it; its shape is omx-clap-core's reference.
/** The English sentence of OMX_SCAN_DOCUMENTS_CLAP_SCAN_DOCUMENT, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_SCAN_DOCUMENTS_CLAP_SCAN_DOCUMENT_TEXT_EN "The JSON document omx-clap-scan writes, one entry per file with its plugins, its parameters and its ports."
#define OMX_SCAN_DOCUMENTS_FIELD_DUMP "FIELD_DUMP" ///< The field dump of omx-clap-scan --fields: the line `# omx-clap-scan --fields 1`, the format's version, then one `<scope> TAB <field> TAB <value>` record per field a plugin states. Its scopes are SCAN_FIELD_SCOPES.
/** The English sentence of OMX_SCAN_DOCUMENTS_FIELD_DUMP, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_SCAN_DOCUMENTS_FIELD_DUMP_TEXT_EN "The field dump omx-clap-scan --fields writes: a version line, then one scope, field and value record per field a plugin states."
/** The number of words of SCAN_DOCUMENTS, the length of OMX_SCAN_DOCUMENTS_INIT. */
#define OMX_SCAN_DOCUMENTS_COUNT 2u
/** The words of SCAN_DOCUMENTS in declaration order, an initialiser of const char *. */
#define OMX_SCAN_DOCUMENTS_INIT { "CLAP_SCAN_DOCUMENT", "FIELD_DUMP" }
/// @}

/**
 * @name SCAN_FIELD_SCOPES (data/scan.json)
 * The scopes of a field dump record, as written before the first TAB; an indexed scope is followed by `:<index>`. Named here, owned by their writers: omx-clap-core's scan (docs/scan.md there) and plugin-hostd's field dump (docs/formats.md there) keep the code that writes them. (since 3.7.0)
 */
/// @{
#define OMX_SCAN_FIELD_SCOPES_PLUGIN "plugin" ///< the plugin as a whole
/** The English sentence of OMX_SCAN_FIELD_SCOPES_PLUGIN, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_SCAN_FIELD_SCOPES_PLUGIN_TEXT_EN "The plugin as a whole."
#define OMX_SCAN_FIELD_SCOPES_PARAM "param" ///< a CLAP parameter, indexed in get_info order
/** The English sentence of OMX_SCAN_FIELD_SCOPES_PARAM, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_SCAN_FIELD_SCOPES_PARAM_TEXT_EN "A CLAP parameter, indexed in get_info order."
#define OMX_SCAN_FIELD_SCOPES_AUDIO_IN "audio_in" ///< an audio input port, indexed
/** The English sentence of OMX_SCAN_FIELD_SCOPES_AUDIO_IN, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_SCAN_FIELD_SCOPES_AUDIO_IN_TEXT_EN "An audio input port, indexed."
#define OMX_SCAN_FIELD_SCOPES_AUDIO_OUT "audio_out" ///< an audio output port, indexed
/** The English sentence of OMX_SCAN_FIELD_SCOPES_AUDIO_OUT, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_SCAN_FIELD_SCOPES_AUDIO_OUT_TEXT_EN "An audio output port, indexed."
#define OMX_SCAN_FIELD_SCOPES_NOTE_IN "note_in" ///< a note input port, indexed
/** The English sentence of OMX_SCAN_FIELD_SCOPES_NOTE_IN, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_SCAN_FIELD_SCOPES_NOTE_IN_TEXT_EN "A note input port, indexed."
#define OMX_SCAN_FIELD_SCOPES_NOTE_OUT "note_out" ///< a note output port, indexed
/** The English sentence of OMX_SCAN_FIELD_SCOPES_NOTE_OUT, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_SCAN_FIELD_SCOPES_NOTE_OUT_TEXT_EN "A note output port, indexed."
#define OMX_SCAN_FIELD_SCOPES_PORT "port" ///< an LV2 port, indexed by lv2:index
/** The English sentence of OMX_SCAN_FIELD_SCOPES_PORT, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_SCAN_FIELD_SCOPES_PORT_TEXT_EN "An LV2 port, indexed by its lv2:index."
#define OMX_SCAN_FIELD_SCOPES_PANEL "panel" ///< the panel description of a plugin that serves org.openmixer.panel-description/1: its family and fingerprint
/** The English sentence of OMX_SCAN_FIELD_SCOPES_PANEL, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_SCAN_FIELD_SCOPES_PANEL_TEXT_EN "The panel description of a plugin that serves org.openmixer.panel-description/1: its family and its fingerprint."
#define OMX_SCAN_FIELD_SCOPES_SECTION "section" ///< a section of the panel description, indexed
/** The English sentence of OMX_SCAN_FIELD_SCOPES_SECTION, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_SCAN_FIELD_SCOPES_SECTION_TEXT_EN "A section of the panel description, indexed."
#define OMX_SCAN_FIELD_SCOPES_CONTROL "control" ///< a control of the panel description, indexed
/** The English sentence of OMX_SCAN_FIELD_SCOPES_CONTROL, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_SCAN_FIELD_SCOPES_CONTROL_TEXT_EN "A control of the panel description, indexed."
#define OMX_SCAN_FIELD_SCOPES_ROLE "role" ///< a role of the panel description, indexed
/** The English sentence of OMX_SCAN_FIELD_SCOPES_ROLE, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_SCAN_FIELD_SCOPES_ROLE_TEXT_EN "A role of the panel description, indexed."
#define OMX_SCAN_FIELD_SCOPES_DISPLAY "display" ///< a display of the panel description, indexed
/** The English sentence of OMX_SCAN_FIELD_SCOPES_DISPLAY, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_SCAN_FIELD_SCOPES_DISPLAY_TEXT_EN "A display of the panel description, indexed."
#define OMX_SCAN_FIELD_SCOPES_PLACEMENT_DEFAULT "placement_default" ///< a per-placement come-up value of the panel description, indexed
/** The English sentence of OMX_SCAN_FIELD_SCOPES_PLACEMENT_DEFAULT, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_SCAN_FIELD_SCOPES_PLACEMENT_DEFAULT_TEXT_EN "A per-placement come-up value of the panel description, indexed."
/** The number of words of SCAN_FIELD_SCOPES, the length of OMX_SCAN_FIELD_SCOPES_INIT. */
#define OMX_SCAN_FIELD_SCOPES_COUNT 13u
/** The words of SCAN_FIELD_SCOPES in declaration order, an initialiser of const char *. */
#define OMX_SCAN_FIELD_SCOPES_INIT { "plugin", "param", "audio_in", "audio_out", "note_in", "note_out", "port", "panel", "section", "control", "role", "display", "placement_default" }
/// @}

/**
 * @name VERB_HOSTS (data/verbs.json)
 * The hosts a verb's implementedBy names (docs/contract-dir.md): the programs a controller sends mod-host's protocol to. A verb states what each one owes it; a host the verb leaves out owes it nothing. (since 3.3.0)
 */
/// @{
#define OMX_VERB_HOSTS_PLUGIN_HOSTD "plugin-hostd" ///< The daemon that places plugins in workers and answers the verbs it adds itself.
/** The English sentence of OMX_VERB_HOSTS_PLUGIN_HOSTD, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_VERB_HOSTS_PLUGIN_HOSTD_TEXT_EN "The daemon that places plugins in workers and answers the verbs it adds itself."
#define OMX_VERB_HOSTS_OMX_CLAP_HOST "omx-clap-host" ///< omx-clap-core's worker: a CLAP plugin's host, and an LV2 plugin's through its adapter.
/** The English sentence of OMX_VERB_HOSTS_OMX_CLAP_HOST, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_VERB_HOSTS_OMX_CLAP_HOST_TEXT_EN "omx-clap-core's worker: a CLAP plugin's host, and an LV2 plugin's through its adapter."
#define OMX_VERB_HOSTS_MOD_HOST "mod-host" ///< mod-host, the LV2 host whose protocol the others speak.
/** The English sentence of OMX_VERB_HOSTS_MOD_HOST, its placeholders in braces; a catalog translates it by this key (docs/data-layout.md). */
#define OMX_VERB_HOSTS_MOD_HOST_TEXT_EN "mod-host, the LV2 host whose protocol the others speak."
/** The number of words of VERB_HOSTS, the length of OMX_VERB_HOSTS_INIT. */
#define OMX_VERB_HOSTS_COUNT 3u
/** The words of VERB_HOSTS in declaration order, an initialiser of const char *. */
#define OMX_VERB_HOSTS_INIT { "plugin-hostd", "omx-clap-host", "mod-host" }
/// @}

#endif /* OMX_VOCABULARY_H */
