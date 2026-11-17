// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
#ifndef SAMPLE_VOCABULARY_H
#define SAMPLE_VOCABULARY_H
/*
 * GENERATED: DO NOT EDIT BY HAND.
 * Produced by `omx-contract render --target c` from Open-Mixer/sample's data/: the vocabulary
 * (docs/data-layout.md). A code is OMX_ and the code in upper snake case, and a reply code that carries a resp has it as that name and _RESP; a word is OMX_<ITEM>_<NAME>, each words
 * item with its _COUNT and an _INIT of its words in their order. A consumer writes and compares these, never a
 * literal of its own.
 */

/** @file
 * @brief The vocabulary of sample: every code and every word as a string define, with its sentence
 * where it carries one. */

/* SAMPLE_KINDS (sample/sample.json) */
#define OMX_SAMPLE_KINDS_ALPHA "alpha" ///< the first kind
/** The source sentence (English) of OMX_SAMPLE_KINDS_ALPHA. */
#define OMX_SAMPLE_KINDS_ALPHA_TEXT_EN "The first kind."
#define OMX_SAMPLE_KINDS_BETA "beta" ///< the second kind
/** The source sentence (English) of OMX_SAMPLE_KINDS_BETA. */
#define OMX_SAMPLE_KINDS_BETA_TEXT_EN "The second kind."
#define OMX_SAMPLE_KINDS_GAMMA_RAY "gamma_ray" ///< the third kind
/** The source sentence (English) of OMX_SAMPLE_KINDS_GAMMA_RAY. */
#define OMX_SAMPLE_KINDS_GAMMA_RAY_TEXT_EN "The third kind."
/** The number of words of SAMPLE_KINDS. */
#define OMX_SAMPLE_KINDS_COUNT 3u
/** The words of SAMPLE_KINDS in their declared order, as a C initializer list. */
#define OMX_SAMPLE_KINDS_INIT { "alpha", "beta", "gamma_ray" }
/** Expands `X(code, "word", NAME)` once per word of SAMPLE_KINDS, in order, the code being its place in the order. The kinds a sample thing has. */
#define OMX_SAMPLE_KINDS(X) \
    X(0u, "alpha", ALPHA) X(1u, "beta", BETA) X(2u, "gamma_ray", GAMMA_RAY)

/* SAMPLE_PLACES (sample/sample.json) */
#define OMX_SAMPLE_PLACES_ONE "one" ///< the one place
/** The source sentence (English) of OMX_SAMPLE_PLACES_ONE. */
#define OMX_SAMPLE_PLACES_ONE_TEXT_EN "The one place."
#define OMX_SAMPLE_PLACES_TWO "two" ///< the second place
/** The source sentence (English) of OMX_SAMPLE_PLACES_TWO. */
#define OMX_SAMPLE_PLACES_TWO_TEXT_EN "The second place."
#define OMX_SAMPLE_PLACES_THREE "three" ///< the third place
/** The source sentence (English) of OMX_SAMPLE_PLACES_THREE. */
#define OMX_SAMPLE_PLACES_THREE_TEXT_EN "The third place."
#define OMX_SAMPLE_PLACES_FOUR "four" ///< the fourth place
/** The source sentence (English) of OMX_SAMPLE_PLACES_FOUR. */
#define OMX_SAMPLE_PLACES_FOUR_TEXT_EN "The fourth place."
/** The number of words of SAMPLE_PLACES. */
#define OMX_SAMPLE_PLACES_COUNT 4u
/** The words of SAMPLE_PLACES in their declared order, as a C initializer list. */
#define OMX_SAMPLE_PLACES_INIT { "one", "two", "three", "four" }
/** Expands `X(code, "word", NAME)` once per word of SAMPLE_PLACES, in order, the code being its place in the order. Where a sample thing sits. */
#define OMX_SAMPLE_PLACES(X) \
    X(0u, "one", ONE) X(1u, "two", TWO) X(2u, "three", THREE) X(3u, "four", FOUR)

#endif /* SAMPLE_VOCABULARY_H */
