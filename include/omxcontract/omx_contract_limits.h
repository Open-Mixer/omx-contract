// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
#ifndef OMX_CONTRACT_LIMITS_H
#define OMX_CONTRACT_LIMITS_H
#include <math.h>
/*
 * GENERATED: DO NOT EDIT BY HAND.
 * Produced by `omx-contract render --target c` from Open-Mixer/omx-contract's data/, the declaration
 * as data (each item's reason is its `doc`). Change the data, never this file: a consumer builds
 * against the render of the omx-contract version it pins and commits none.
 *
 * A C contract (OMX_PRE/OMX_POST/OMX_INVARIANT) reads a limit from HERE, never a literal.
 */

/** @file
 * @brief The numbers of the contract: every declared limit, scalar, list and set as an OMX_ define or enum, and the
 * declared sample rates. */

/* Every scalar, sheet leaf and single travel's numbers, one block sorted by macro. An integer value
 * is an integer literal, any other a float literal AND its OMX_<macro>_DOUBLE spelling. */
/**
 * @name OMX_PARAM_CONTRACT_UNITS
 * The units of org.openmixer.param-contract/1, the code its get() reports for a parameter's plain value, by token: the LV2 unit a face writes for a descriptor unit (units:db is db), 0..24 the LV2 units one to one, 0x100 and up the vendor block of units LV2 has none for, append-only. A token is served when it has a code here; none is 0. (since 3.6.0)
 */
/// @{
/** bars of the transport */
#define OMX_PARAM_CONTRACT_UNITS_BAR 4
/** beats of the transport */
#define OMX_PARAM_CONTRACT_UNITS_BEAT 5
/** beats per minute */
#define OMX_PARAM_CONTRACT_UNITS_BPM 19
/** cents, hundredths of a semitone */
#define OMX_PARAM_CONTRACT_UNITS_CENT 21
/** centimetres */
#define OMX_PARAM_CONTRACT_UNITS_CM 8
/** a coefficient, a plain multiplier (1 is unity) */
#define OMX_PARAM_CONTRACT_UNITS_COEF 15
/** decibels, a relative level or a gain */
#define OMX_PARAM_CONTRACT_UNITS_DB 13
/** decibels relative to full scale, 0 the largest sample, a level (vendor block) */
#define OMX_PARAM_CONTRACT_UNITS_DBFS 256
/** decibels relative to 0.775 V RMS, an analogue level (vendor block) */
#define OMX_PARAM_CONTRACT_UNITS_DBU 257
/** degrees of arc or of phase */
#define OMX_PARAM_CONTRACT_UNITS_DEGREE 23
/** audio frames (samples) at the running rate */
#define OMX_PARAM_CONTRACT_UNITS_FRAME 6
/** hertz */
#define OMX_PARAM_CONTRACT_UNITS_HZ 16
/** inches */
#define OMX_PARAM_CONTRACT_UNITS_INCH 11
/** kilohertz */
#define OMX_PARAM_CONTRACT_UNITS_KHZ 17
/** kilometres */
#define OMX_PARAM_CONTRACT_UNITS_KM 10
/** loudness units relative to full scale, ITU-R BS.1770 (vendor block) */
#define OMX_PARAM_CONTRACT_UNITS_LUFS 259
/** metres */
#define OMX_PARAM_CONTRACT_UNITS_M 7
/** megahertz */
#define OMX_PARAM_CONTRACT_UNITS_MHZ 18
/** a MIDI note number, 0 to 127 */
#define OMX_PARAM_CONTRACT_UNITS_MIDI_NOTE 24
/** miles */
#define OMX_PARAM_CONTRACT_UNITS_MILE 12
/** minutes */
#define OMX_PARAM_CONTRACT_UNITS_MIN 3
/** millimetres */
#define OMX_PARAM_CONTRACT_UNITS_MM 9
/** milliseconds */
#define OMX_PARAM_CONTRACT_UNITS_MS 2
/** no unit: a plain number, a switch, an index */
#define OMX_PARAM_CONTRACT_UNITS_NONE 0
/** octaves */
#define OMX_PARAM_CONTRACT_UNITS_OCT 20
/** percent */
#define OMX_PARAM_CONTRACT_UNITS_PC 14
/** a ratio, n to 1, as a compressor states it (vendor block) */
#define OMX_PARAM_CONTRACT_UNITS_RATIO 258
/** seconds */
#define OMX_PARAM_CONTRACT_UNITS_S 1
/** semitones of twelve-tone equal temperament */
#define OMX_PARAM_CONTRACT_UNITS_SEMITONE12_TET 22
/// @}
/** How often a readout's value is published: 50 Hz, one value every 20 ms, the rate a host sends a moving meter at. Every readout reads it as its `rateHz` (docs/readouts.md). (Hz; since 2.4.0) */
#define OMX_READOUT_RATE_HZ 50
/**
 * @name RT_HARD_TARGET
 * THE declaration: 192 kHz at quantum 128.
 */
/// @{
/** The `quantum` of RT_HARD_TARGET. */
#define OMX_RT_HARD_TARGET_QUANTUM 128
/** The `rate` of RT_HARD_TARGET. */
#define OMX_RT_HARD_TARGET_RATE 192000
/// @}

/* Every list rendered to C, sorted by list: OMX_<LIST>_COUNT and OMX_<LIST>_INIT { a, b, … }. */
/** The number of values of ORACLE_FLOOR_RATES, the length of OMX_ORACLE_FLOOR_RATES_INIT. */
#define OMX_ORACLE_FLOOR_RATES_COUNT 4u
/** The four rates every kernel oracle runs at, whatever STANDARD_SAMPLE_RATES says: a declared list missing one of them stops a suite instead of testing less (omx-dsp, omx-plugins and omx-clap-host run their oracles at these). The values in declaration order, an initialiser. (Hz; since 1.3.0) */
#define OMX_ORACLE_FLOOR_RATES_INIT { 44100, 48000, 96000, 192000 }
/** The number of values of ORACLE_FULL_RATES, the length of OMX_ORACLE_FULL_RATES_INIT. */
#define OMX_ORACLE_FULL_RATES_COUNT 9u
/** The full grid of rates a professional interface can clock at, nine of them from 32 to 192 kHz: where ORACLE_FLOOR_RATES is the four rates every kernel oracle must run at, this is the whole grid an oracle runs at when it runs at all of them. STANDARD_SAMPLE_RATES is a subset of it; an oracle that runs here also covers 32, 64 and 128 kHz, where a kernel still has to meet its closed form even though the console never asks for them. The values in declaration order, an initialiser. (Hz; since 1.3.0) */
#define OMX_ORACLE_FULL_RATES_INIT { 32000, 44100, 48000, 64000, 88200, 96000, 128000, 176400, 192000 }
/** The number of values of STANDARD_QUANTA, the length of OMX_STANDARD_QUANTA_INIT. */
#define OMX_STANDARD_QUANTA_COUNT 6u
/** The quanta (buffer sizes, in frames, a count with no unit of its own) the console offers: the set a measurement grid or a probe takes its quanta from, beside the rates STANDARD_SAMPLE_RATES lists. A consumer that measures at fewer quanta takes a subset of this list and states it; it never keeps a list of its own. What the operator is OFFERED is still the engine's own choice, this is the ceiling a request is refused by. The values in declaration order, an initialiser. (unitless; since 3.5.0) */
#define OMX_STANDARD_QUANTA_INIT { 32, 64, 128, 256, 512, 1024 }
/** The number of values of STANDARD_SAMPLE_RATES, the length of OMX_STANDARD_SAMPLE_RATES_INIT. */
#define OMX_STANDARD_SAMPLE_RATES_COUNT 6u
/** The standard sample rates (Hz) the desk recognises, the pro-audio superset. One source of truth for the clock controller's `clock.allowed-rates` seed, the force row's validation ceiling and the device-rate probe fallback. What the operator is OFFERED is always the DEVICE's own `supportedRates`; this is the ceiling a write is refused by, never a menu. The values in declaration order, an initialiser. (Hz) */
#define OMX_STANDARD_SAMPLE_RATES_INIT { 44100, 48000, 88200, 96000, 176400, 192000 }

/* Every set rendered to C, sorted by set: an enum of the ids (a named id's position, or a numeric id's number), `OMX_<SET>_COUNT` and,
 * where the set names a default, `OMX_<SET>_DEFAULT`. */
/** How a host draws a parameter: linear, logarithmic (a frequency, a time) or in discrete steps. The words omx-plugins' declarations and plugin-hostd's protocol use; a travel names its own with `scale`. (since 1.3.0) A named id's value is its position. */
enum omx_param_scales {
  OMX_PARAM_SCALES_LINEAR = 0, ///< The id `linear`.
  OMX_PARAM_SCALES_LOG = 1, ///< The id `log`.
  OMX_PARAM_SCALES_STEPPED = 2, ///< The id `stepped`.
};
/** The number of ids of PARAM_SCALES. */
#define OMX_PARAM_SCALES_COUNT 3u
/** The id PARAM_SCALES names as its default. */
#define OMX_PARAM_SCALES_DEFAULT OMX_PARAM_SCALES_LINEAR

#endif /* OMX_CONTRACT_LIMITS_H */

/* The standard sample rates (STANDARD_SAMPLE_RATES, declared in omx-contract's rates.json): the set
 * a rate is checked against and the grid a native tool iterates. Guarded on its own, outside the
 * include guard, so a tool built against an older copy of this header can include this one after
 * it and gain the rates without mixing the two copies' limits. */
#ifndef OMX_DECLARED_RATE_COUNT
/** The number of declared sample rates, the length of OMX_DECLARED_RATES. */
#define OMX_DECLARED_RATE_COUNT 6u
/** The declared sample rates (Hz) in declaration order, as floats: the set a rate is checked against and the grid a tool iterates. */
static const float OMX_DECLARED_RATES[OMX_DECLARED_RATE_COUNT] = { 44100.0f, 48000.0f, 88200.0f, 96000.0f, 176400.0f, 192000.0f };
/**
 * The declared rates that are whole multiples of `base` (a tool's default grid: the 48 kHz family), in declaration
 * order, at most `cap` of them.
 * @param base the rate (Hz) every written rate is a whole multiple of; 0 is undefined behaviour (a division by zero)
 * @param out the caller's array of at least `cap` ints, filled from its start; the caller owns it
 * @param cap the most rates written; 0 or less writes none
 * @return how many rates were written to `out`, 0 to `cap`
 */
static inline int omx_declared_rates_multiple_of(unsigned base, int *out, int cap) {
  int n = 0;
  for (unsigned k = 0; k < OMX_DECLARED_RATE_COUNT && n < cap; k++)
    if ((unsigned)OMX_DECLARED_RATES[k] % base == 0) out[n++] = (int)OMX_DECLARED_RATES[k];
  return n;
}
#endif
