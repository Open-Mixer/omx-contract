// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
#ifndef OMXCONTRACT_CONTRACT_H
#define OMXCONTRACT_CONTRACT_H
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

/* Every list rendered to C, sorted by list: OMX_<LIST>_COUNT and OMX_<LIST>_INIT { a, b, … }. */
/** The number of values of STANDARD_QUANTA, the length of OMX_STANDARD_QUANTA_INIT. */
#define OMX_STANDARD_QUANTA_COUNT 6u
/** The quanta (buffer sizes, in frames, a count with no unit of its own) the console offers: the set a measurement grid or a probe takes its quanta from, beside the rates STANDARD_SAMPLE_RATES lists. A consumer that measures at fewer quanta takes a subset of this list and states it; it never keeps a list of its own. What the operator is OFFERED is still the engine's own choice, this is the ceiling a request is refused by. The values in declaration order, an initialiser. (none; since 3.5.0) */
#define OMX_STANDARD_QUANTA_INIT { 32, 64, 128, 256, 512, 1024 }
/** The number of values of STANDARD_SAMPLE_RATES, the length of OMX_STANDARD_SAMPLE_RATES_INIT. */
#define OMX_STANDARD_SAMPLE_RATES_COUNT 6u
/** The standard sample rates (Hz) the desk recognises, the pro-audio superset. One source of truth for the clock controller's `clock.allowed-rates` seed, the force row's validation ceiling and the device-rate probe fallback. What the operator is OFFERED is always the DEVICE's own `supportedRates`; this is the ceiling a write is refused by, never a menu. The values in declaration order, an initialiser. (Hz) */
#define OMX_STANDARD_SAMPLE_RATES_INIT { 44100, 48000, 88200, 96000, 176400, 192000 }

/* Every set rendered to C, sorted by set: an enum of the ids (a named id's position, or a numeric id's number), `OMX_<SET>_COUNT` and,
 * where the set names a default, `OMX_<SET>_DEFAULT`. */
/** How a host draws a parameter: linear, logarithmic (a frequency, a time) or in discrete steps. The words omx-plugins' declarations and plugin-hostd's protocol use; a travel names its own with `scale`. (since 0.1.0) A named id's value is its position. */
enum omx_param_scales {
  OMX_PARAM_SCALES_LINEAR = 0, ///< The id `linear`.
  OMX_PARAM_SCALES_LOG = 1, ///< The id `log`.
  OMX_PARAM_SCALES_STEPPED = 2, ///< The id `stepped`.
};
/** The number of ids of PARAM_SCALES. */
#define OMX_PARAM_SCALES_COUNT 3u
/** The id PARAM_SCALES names as its default. */
#define OMX_PARAM_SCALES_DEFAULT OMX_PARAM_SCALES_LINEAR

#endif /* OMXCONTRACT_CONTRACT_H */

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
