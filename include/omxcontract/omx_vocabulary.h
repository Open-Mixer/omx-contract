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

/* CURVE_AXES (data/curves.json) */
#define OMX_CURVE_AXES_FREQUENCY "frequency" ///< Frequency, on the points of EQ_CURVE_GRID where the curve is a response.
/** The source sentence (English) of OMX_CURVE_AXES_FREQUENCY. */
#define OMX_CURVE_AXES_FREQUENCY_TEXT_EN "Frequency, on the points of EQ_CURVE_GRID where the curve is a response."
#define OMX_CURVE_AXES_MAGNITUDE "magnitude" ///< The magnitude of a response at a frequency: 0 dB is unity, a boost positive, a cut negative.
/** The source sentence (English) of OMX_CURVE_AXES_MAGNITUDE. */
#define OMX_CURVE_AXES_MAGNITUDE_TEXT_EN "The magnitude of a response at a frequency: 0 dB is unity, a boost positive, a cut negative."
#define OMX_CURVE_AXES_INPUT_LEVEL "input-level" ///< The level a gain computer reads, the static law's input.
/** The source sentence (English) of OMX_CURVE_AXES_INPUT_LEVEL. */
#define OMX_CURVE_AXES_INPUT_LEVEL_TEXT_EN "The level a gain computer reads, the static law's input."
#define OMX_CURVE_AXES_OUTPUT_LEVEL "output-level" ///< The level the static law gives for an input level; the diagonal is no gain change.
/** The source sentence (English) of OMX_CURVE_AXES_OUTPUT_LEVEL. */
#define OMX_CURVE_AXES_OUTPUT_LEVEL_TEXT_EN "The level the static law gives for an input level; the diagonal is no gain change."
#define OMX_CURVE_AXES_INPUT_AMPLITUDE "input-amplitude" ///< A memoryless shaper's input sample, linear, -1 to +1 full scale: bipolar, so an even/odd asymmetry shows.
/** The source sentence (English) of OMX_CURVE_AXES_INPUT_AMPLITUDE. */
#define OMX_CURVE_AXES_INPUT_AMPLITUDE_TEXT_EN "A memoryless shaper's input sample, linear, -1 to +1 full scale: bipolar, so an even/odd asymmetry shows."
#define OMX_CURVE_AXES_OUTPUT_AMPLITUDE "output-amplitude" ///< The shaper's output sample for an input amplitude, linear, on the same full scale.
/** The source sentence (English) of OMX_CURVE_AXES_OUTPUT_AMPLITUDE. */
#define OMX_CURVE_AXES_OUTPUT_AMPLITUDE_TEXT_EN "The shaper's output sample for an input amplitude, linear, on the same full scale."
#define OMX_CURVE_AXES_DELAY_TIME "delay-time" ///< The time after the dry sound at which a delay's tap or repeat sounds.
/** The source sentence (English) of OMX_CURVE_AXES_DELAY_TIME. */
#define OMX_CURVE_AXES_DELAY_TIME_TEXT_EN "The time after the dry sound at which a delay's tap or repeat sounds."
#define OMX_CURVE_AXES_DECAY_TIME "decay-time" ///< The time after an impulse over which a reverb's energy decays.
/** The source sentence (English) of OMX_CURVE_AXES_DECAY_TIME. */
#define OMX_CURVE_AXES_DECAY_TIME_TEXT_EN "The time after an impulse over which a reverb's energy decays."
#define OMX_CURVE_AXES_LEVEL "level" ///< A level relative to the dry input: 0 dB is the input's own, a tap or a decay below it negative.
/** The source sentence (English) of OMX_CURVE_AXES_LEVEL. */
#define OMX_CURVE_AXES_LEVEL_TEXT_EN "A level relative to the dry input: 0 dB is the input's own, a tap or a decay below it negative."
#define OMX_CURVE_AXES_PHASE "phase" ///< The position within one period of a modulation source, 0 to 1.
/** The source sentence (English) of OMX_CURVE_AXES_PHASE. */
#define OMX_CURVE_AXES_PHASE_TEXT_EN "The position within one period of a modulation source, 0 to 1."
#define OMX_CURVE_AXES_MODULATION "modulation" ///< A modulation source's output at a phase, -1 to +1, before the depth scales it.
/** The source sentence (English) of OMX_CURVE_AXES_MODULATION. */
#define OMX_CURVE_AXES_MODULATION_TEXT_EN "A modulation source's output at a phase, -1 to +1, before the depth scales it."
#define OMX_CURVE_AXES_INPUT_PITCH "input-pitch" ///< The pitch played into a pitch effect, semitones from an origin the host picks.
/** The source sentence (English) of OMX_CURVE_AXES_INPUT_PITCH. */
#define OMX_CURVE_AXES_INPUT_PITCH_TEXT_EN "The pitch played into a pitch effect, semitones from an origin the host picks."
#define OMX_CURVE_AXES_OUTPUT_PITCH "output-pitch" ///< The pitch the effect sounds for an input pitch, semitones on the same origin: an unshifted map is the diagonal.
/** The source sentence (English) of OMX_CURVE_AXES_OUTPUT_PITCH. */
#define OMX_CURVE_AXES_OUTPUT_PITCH_TEXT_EN "The pitch the effect sounds for an input pitch, semitones on the same origin: an unshifted map is the diagonal."
/** The number of words of CURVE_AXES. */
#define OMX_CURVE_AXES_COUNT 13u
/** The words of CURVE_AXES in their declared order, as a C initializer list. */
#define OMX_CURVE_AXES_INIT { "frequency", "magnitude", "input-level", "output-level", "input-amplitude", "output-amplitude", "delay-time", "decay-time", "level", "phase", "modulation", "input-pitch", "output-pitch" }
/** Expands `X(code, "word", NAME)` once per word of CURVE_AXES, in order, the code being its place in the order. The axes a curve kind is drawn on, each with its unit and how a host draws it (docs/curves.md). A curve's values are in these units, so the drawn values can be held equal to the closed form a kernel's controls give. */
#define OMX_CURVE_AXES(X) \
    X(0u, "frequency", FREQUENCY) X(1u, "magnitude", MAGNITUDE) X(2u, "input-level", INPUT_LEVEL) X(3u, "output-level", OUTPUT_LEVEL) \
    X(4u, "input-amplitude", INPUT_AMPLITUDE) X(5u, "output-amplitude", OUTPUT_AMPLITUDE) X(6u, "delay-time", DELAY_TIME) X(7u, "decay-time", DECAY_TIME) \
    X(8u, "level", LEVEL) X(9u, "phase", PHASE) X(10u, "modulation", MODULATION) X(11u, "input-pitch", INPUT_PITCH) \
    X(12u, "output-pitch", OUTPUT_PITCH)

/* CURVE_KINDS (data/curves.json) */
#define OMX_CURVE_KINDS_EQ_CURVE "eq-curve" ///< An EQ's summed magnitude response over log frequency.
/** The source sentence (English) of OMX_CURVE_KINDS_EQ_CURVE. */
#define OMX_CURVE_KINDS_EQ_CURVE_TEXT_EN "An EQ's summed magnitude response over log frequency."
#define OMX_CURVE_KINDS_DYNAMICS_CURVE "dynamics-curve" ///< A gate's or a compressor's static law, input level to output level, with the live needle.
/** The source sentence (English) of OMX_CURVE_KINDS_DYNAMICS_CURVE. */
#define OMX_CURVE_KINDS_DYNAMICS_CURVE_TEXT_EN "A gate's or a compressor's static law, input level to output level, with the live needle."
#define OMX_CURVE_KINDS_TRANSFER_CURVE "transfer-curve" ///< A memoryless shaper's transfer, input sample to output sample over full scale.
/** The source sentence (English) of OMX_CURVE_KINDS_TRANSFER_CURVE. */
#define OMX_CURVE_KINDS_TRANSFER_CURVE_TEXT_EN "A memoryless shaper's transfer, input sample to output sample over full scale."
#define OMX_CURVE_KINDS_DELAY_TAPS "delay-taps" ///< A delay's taps and repeats, each a line at its time and level.
/** The source sentence (English) of OMX_CURVE_KINDS_DELAY_TAPS. */
#define OMX_CURVE_KINDS_DELAY_TAPS_TEXT_EN "A delay's taps and repeats, each a line at its time and level."
#define OMX_CURVE_KINDS_DECAY_ENVELOPE "decay-envelope" ///< A reverb's decay envelope after an impulse.
/** The source sentence (English) of OMX_CURVE_KINDS_DECAY_ENVELOPE. */
#define OMX_CURVE_KINDS_DECAY_ENVELOPE_TEXT_EN "A reverb's decay envelope after an impulse."
#define OMX_CURVE_KINDS_COMB_RESPONSE "comb-response" ///< The wet path's comb or notch response at the current sweep position (chorus, flanger, phaser, doubler).
/** The source sentence (English) of OMX_CURVE_KINDS_COMB_RESPONSE. */
#define OMX_CURVE_KINDS_COMB_RESPONSE_TEXT_EN "The wet path's comb or notch response at the current sweep position (chorus, flanger, phaser, doubler)."
#define OMX_CURVE_KINDS_MODULATION_SHAPE "modulation-shape" ///< A modulation source over one period (tremolo, rotary).
/** The source sentence (English) of OMX_CURVE_KINDS_MODULATION_SHAPE. */
#define OMX_CURVE_KINDS_MODULATION_SHAPE_TEXT_EN "A modulation source over one period (tremolo, rotary)."
#define OMX_CURVE_KINDS_INTERVAL_MAP "interval-map" ///< A pitch effect's map from the input pitch to the output pitch.
/** The source sentence (English) of OMX_CURVE_KINDS_INTERVAL_MAP. */
#define OMX_CURVE_KINDS_INTERVAL_MAP_TEXT_EN "A pitch effect's map from the input pitch to the output pitch."
/** The number of words of CURVE_KINDS. */
#define OMX_CURVE_KINDS_COUNT 8u
/** The words of CURVE_KINDS in their declared order, as a C initializer list. */
#define OMX_CURVE_KINDS_INIT { "eq-curve", "dynamics-curve", "transfer-curve", "delay-taps", "decay-envelope", "comb-response", "modulation-shape", "interval-map" }
/** Expands `X(code, "word", NAME)` once per word of CURVE_KINDS, in order, the code being its place in the order. The kinds of picture a plugin's panel section draws and a console's card shows, each with the two axes it is drawn on (docs/curves.md). A kernel file and a plugin declaration name a kind by its word; a host keeps only its kind-to-drawing map. Append-only: a kind is never renamed, moved or removed while a reader draws it. */
#define OMX_CURVE_KINDS(X) \
    X(0u, "eq-curve", EQ_CURVE) X(1u, "dynamics-curve", DYNAMICS_CURVE) X(2u, "transfer-curve", TRANSFER_CURVE) X(3u, "delay-taps", DELAY_TAPS) \
    X(4u, "decay-envelope", DECAY_ENVELOPE) X(5u, "comb-response", COMB_RESPONSE) X(6u, "modulation-shape", MODULATION_SHAPE) X(7u, "interval-map", INTERVAL_MAP)

/* PANEL_FAMILIES (data/panel.json) */
#define OMX_PANEL_FAMILIES_NONE "none" ///< a plugin with no family: its panel is laid out from its groups and roles
/** The source sentence (English) of OMX_PANEL_FAMILIES_NONE. */
#define OMX_PANEL_FAMILIES_NONE_TEXT_EN "A plugin with no family: its panel is laid out from its groups and its roles."
#define OMX_PANEL_FAMILIES_GATE "gate" ///< a gate or expander
/** The source sentence (English) of OMX_PANEL_FAMILIES_GATE. */
#define OMX_PANEL_FAMILIES_GATE_TEXT_EN "A gate's or an expander's panel family."
#define OMX_PANEL_FAMILIES_DYNAMICS "dynamics" ///< a compressor
/** The source sentence (English) of OMX_PANEL_FAMILIES_DYNAMICS. */
#define OMX_PANEL_FAMILIES_DYNAMICS_TEXT_EN "A compressor's panel family."
#define OMX_PANEL_FAMILIES_LIMITER "limiter" ///< a limiter
/** The source sentence (English) of OMX_PANEL_FAMILIES_LIMITER. */
#define OMX_PANEL_FAMILIES_LIMITER_TEXT_EN "A limiter's panel family."
#define OMX_PANEL_FAMILIES_DEESSER "deesser" ///< a de-esser
/** The source sentence (English) of OMX_PANEL_FAMILIES_DEESSER. */
#define OMX_PANEL_FAMILIES_DEESSER_TEXT_EN "A de-esser's panel family."
#define OMX_PANEL_FAMILIES_EQ "eq" ///< an equaliser, parametric or graphic
/** The source sentence (English) of OMX_PANEL_FAMILIES_EQ. */
#define OMX_PANEL_FAMILIES_EQ_TEXT_EN "An equaliser's panel family, parametric or graphic."
#define OMX_PANEL_FAMILIES_FILTER "filter" ///< a filter
/** The source sentence (English) of OMX_PANEL_FAMILIES_FILTER. */
#define OMX_PANEL_FAMILIES_FILTER_TEXT_EN "A filter's panel family."
#define OMX_PANEL_FAMILIES_DRIVE "drive" ///< a saturator or distortion
/** The source sentence (English) of OMX_PANEL_FAMILIES_DRIVE. */
#define OMX_PANEL_FAMILIES_DRIVE_TEXT_EN "A saturator's or a distortion's panel family."
#define OMX_PANEL_FAMILIES_MODULATION "modulation" ///< a chorus, flanger, phaser or tremolo
/** The source sentence (English) of OMX_PANEL_FAMILIES_MODULATION. */
#define OMX_PANEL_FAMILIES_MODULATION_TEXT_EN "A chorus's, a flanger's, a phaser's or a tremolo's panel family."
#define OMX_PANEL_FAMILIES_DELAY "delay" ///< a delay
/** The source sentence (English) of OMX_PANEL_FAMILIES_DELAY. */
#define OMX_PANEL_FAMILIES_DELAY_TEXT_EN "A delay's panel family."
#define OMX_PANEL_FAMILIES_REVERB "reverb" ///< a reverb
/** The source sentence (English) of OMX_PANEL_FAMILIES_REVERB. */
#define OMX_PANEL_FAMILIES_REVERB_TEXT_EN "A reverb's panel family."
#define OMX_PANEL_FAMILIES_PITCH "pitch" ///< a pitch shifter
/** The source sentence (English) of OMX_PANEL_FAMILIES_PITCH. */
#define OMX_PANEL_FAMILIES_PITCH_TEXT_EN "A pitch shifter's panel family."
#define OMX_PANEL_FAMILIES_UTILITY "utility" ///< a gain trim, a stereo width control or another utility that shapes a signal without a processor's character
/** The source sentence (English) of OMX_PANEL_FAMILIES_UTILITY. */
#define OMX_PANEL_FAMILIES_UTILITY_TEXT_EN "A utility's panel family: a trim, a width control, a balancer or a clipper."
/** The number of words of PANEL_FAMILIES. */
#define OMX_PANEL_FAMILIES_COUNT 13u
/** The words of PANEL_FAMILIES in their declared order, as a C initializer list. */
#define OMX_PANEL_FAMILIES_INIT { "none", "gate", "dynamics", "limiter", "deesser", "eq", "filter", "drive", "modulation", "delay", "reverb", "pitch", "utility" }
/** Expands `X(code, "word", NAME)` once per word of PANEL_FAMILIES, in order, the code being its place in the order. The panel families of a plugin (omx-panel docs/panel-layout.md): the kind of processor its panel is laid out for. The words and their order are the contract; omx-panel's tools/panel-description.mjs FAMILIES and the skin package schema read them, and keep their code. */
#define OMX_PANEL_FAMILIES(X) \
    X(0u, "none", NONE) X(1u, "gate", GATE) X(2u, "dynamics", DYNAMICS) X(3u, "limiter", LIMITER) \
    X(4u, "deesser", DEESSER) X(5u, "eq", EQ) X(6u, "filter", FILTER) X(7u, "drive", DRIVE) \
    X(8u, "modulation", MODULATION) X(9u, "delay", DELAY) X(10u, "reverb", REVERB) X(11u, "pitch", PITCH) \
    X(12u, "utility", UTILITY)

/* PANEL_STANDARD_WIDGETS (data/panel.json) */
#define OMX_PANEL_STANDARD_WIDGETS_KNOB "knob" ///< a travel
/** The source sentence (English) of OMX_PANEL_STANDARD_WIDGETS_KNOB. */
#define OMX_PANEL_STANDARD_WIDGETS_KNOB_TEXT_EN "A travel, drawn as a knob."
#define OMX_PANEL_STANDARD_WIDGETS_FADER "fader" ///< a travel drawn long
/** The source sentence (English) of OMX_PANEL_STANDARD_WIDGETS_FADER. */
#define OMX_PANEL_STANDARD_WIDGETS_FADER_TEXT_EN "A travel drawn long, as a fader."
#define OMX_PANEL_STANDARD_WIDGETS_SWITCH "switch" ///< a toggle
/** The source sentence (English) of OMX_PANEL_STANDARD_WIDGETS_SWITCH. */
#define OMX_PANEL_STANDARD_WIDGETS_SWITCH_TEXT_EN "A toggle, drawn as a switch."
#define OMX_PANEL_STANDARD_WIDGETS_SELECTOR "selector" ///< an integer travel or labelled values
/** The source sentence (English) of OMX_PANEL_STANDARD_WIDGETS_SELECTOR. */
#define OMX_PANEL_STANDARD_WIDGETS_SELECTOR_TEXT_EN "An integer travel or labelled values, drawn as a selector."
#define OMX_PANEL_STANDARD_WIDGETS_METER "meter" ///< a readout
/** The source sentence (English) of OMX_PANEL_STANDARD_WIDGETS_METER. */
#define OMX_PANEL_STANDARD_WIDGETS_METER_TEXT_EN "A readout, drawn as a meter."
#define OMX_PANEL_STANDARD_WIDGETS_CURVE "curve" ///< a response or transfer curve
/** The source sentence (English) of OMX_PANEL_STANDARD_WIDGETS_CURVE. */
#define OMX_PANEL_STANDARD_WIDGETS_CURVE_TEXT_EN "A response or transfer curve, drawn as a graph."
#define OMX_PANEL_STANDARD_WIDGETS_XY "xy" ///< two controls drawn as one point
/** The source sentence (English) of OMX_PANEL_STANDARD_WIDGETS_XY. */
#define OMX_PANEL_STANDARD_WIDGETS_XY_TEXT_EN "Two controls drawn together as one point on a plane."
#define OMX_PANEL_STANDARD_WIDGETS_DISPLAY "display" ///< a value shown as text
/** The source sentence (English) of OMX_PANEL_STANDARD_WIDGETS_DISPLAY. */
#define OMX_PANEL_STANDARD_WIDGETS_DISPLAY_TEXT_EN "A value shown as text."
/** The number of words of PANEL_STANDARD_WIDGETS. */
#define OMX_PANEL_STANDARD_WIDGETS_COUNT 8u
/** The words of PANEL_STANDARD_WIDGETS in their declared order, as a C initializer list. */
#define OMX_PANEL_STANDARD_WIDGETS_INIT { "knob", "fader", "switch", "selector", "meter", "curve", "xy", "display" }
/** Expands `X(code, "word", NAME)` once per word of PANEL_STANDARD_WIDGETS, in order, the code being its place in the order. The standard widgets a panel picks from a descriptor and a representation (a skin) draws, in the order omx-panel's tools/panel-description.mjs STANDARD_WIDGETS lists them. */
#define OMX_PANEL_STANDARD_WIDGETS(X) \
    X(0u, "knob", KNOB) X(1u, "fader", FADER) X(2u, "switch", SWITCH) X(3u, "selector", SELECTOR) \
    X(4u, "meter", METER) X(5u, "curve", CURVE) X(6u, "xy", XY) X(7u, "display", DISPLAY)

/* PANEL_WIDGETS (data/panel.json) */
#define OMX_PANEL_WIDGETS_AUTO "auto" ///< left out of a panel declaration: the layout picks the widget from the control
/** The source sentence (English) of OMX_PANEL_WIDGETS_AUTO. */
#define OMX_PANEL_WIDGETS_AUTO_TEXT_EN "Left out of a panel declaration: the layout picks the widget from the control."
#define OMX_PANEL_WIDGETS_KNOB "knob" ///< a rotary control
/** The source sentence (English) of OMX_PANEL_WIDGETS_KNOB. */
#define OMX_PANEL_WIDGETS_KNOB_TEXT_EN "A rotary control."
#define OMX_PANEL_WIDGETS_FADER "fader" ///< a linear control
/** The source sentence (English) of OMX_PANEL_WIDGETS_FADER. */
#define OMX_PANEL_WIDGETS_FADER_TEXT_EN "A linear control."
#define OMX_PANEL_WIDGETS_SWITCH "switch" ///< a two-state control
/** The source sentence (English) of OMX_PANEL_WIDGETS_SWITCH. */
#define OMX_PANEL_WIDGETS_SWITCH_TEXT_EN "A two-state control."
#define OMX_PANEL_WIDGETS_SELECTOR "selector" ///< a control that picks one of a few values
/** The source sentence (English) of OMX_PANEL_WIDGETS_SELECTOR. */
#define OMX_PANEL_WIDGETS_SELECTOR_TEXT_EN "A control that picks one of a few values."
/** The number of words of PANEL_WIDGETS. */
#define OMX_PANEL_WIDGETS_COUNT 5u
/** The words of PANEL_WIDGETS in their declared order, as a C initializer list. */
#define OMX_PANEL_WIDGETS_INIT { "auto", "knob", "fader", "switch", "selector" }
/** Expands `X(code, "word", NAME)` once per word of PANEL_WIDGETS, in order, the code being its place in the order. The widgets a declared panel may name for a control, and the extension serves (org.openmixer.panel-description/1): auto leaves the choice to the panel layout. The four others are the shared widgets of omx-panel's schema/panel.schema.json. */
#define OMX_PANEL_WIDGETS(X) \
    X(0u, "auto", AUTO) X(1u, "knob", KNOB) X(2u, "fader", FADER) X(3u, "switch", SWITCH) \
    X(4u, "selector", SELECTOR)

/* PANEL_DISPLAY_KINDS (data/panel.json) */
#define OMX_PANEL_DISPLAY_KINDS_GAIN_REDUCTION_BAR "gain_reduction_bar" ///< a bar of the gain a dynamics processor takes off
/** The source sentence (English) of OMX_PANEL_DISPLAY_KINDS_GAIN_REDUCTION_BAR. */
#define OMX_PANEL_DISPLAY_KINDS_GAIN_REDUCTION_BAR_TEXT_EN "A bar showing the gain reduction."
#define OMX_PANEL_DISPLAY_KINDS_TRANSFER_CURVE "transfer_curve" ///< a dynamics processor's output level against its input level
/** The source sentence (English) of OMX_PANEL_DISPLAY_KINDS_TRANSFER_CURVE. */
#define OMX_PANEL_DISPLAY_KINDS_TRANSFER_CURVE_TEXT_EN "The dynamics transfer curve: output level against input level."
#define OMX_PANEL_DISPLAY_KINDS_EQ_RESPONSE "eq_response" ///< an equaliser's frequency response
/** The source sentence (English) of OMX_PANEL_DISPLAY_KINDS_EQ_RESPONSE. */
#define OMX_PANEL_DISPLAY_KINDS_EQ_RESPONSE_TEXT_EN "The equaliser's frequency response."
#define OMX_PANEL_DISPLAY_KINDS_METER "meter" ///< a level meter
/** The source sentence (English) of OMX_PANEL_DISPLAY_KINDS_METER. */
#define OMX_PANEL_DISPLAY_KINDS_METER_TEXT_EN "A level meter."
#define OMX_PANEL_DISPLAY_KINDS_TIME_RESPONSE "time_response" ///< a response over time: a delay's train of taps or a reverb's decay envelope
/** The source sentence (English) of OMX_PANEL_DISPLAY_KINDS_TIME_RESPONSE. */
#define OMX_PANEL_DISPLAY_KINDS_TIME_RESPONSE_TEXT_EN "The response over time: a delay's taps or a reverb's decay."
/** The number of words of PANEL_DISPLAY_KINDS. */
#define OMX_PANEL_DISPLAY_KINDS_COUNT 5u
/** The words of PANEL_DISPLAY_KINDS in their declared order, as a C initializer list. */
#define OMX_PANEL_DISPLAY_KINDS_INIT { "gain_reduction_bar", "transfer_curve", "eq_response", "meter", "time_response" }
/** Expands `X(code, "word", NAME)` once per word of PANEL_DISPLAY_KINDS, in order, the code being its place in the order. The displays a declared panel may carry, and the extension serves (org.openmixer.panel-description/1), in the order of their codes: a panel description names a display by its place here. omx-panel's tools/panel-description.mjs and omx-clap-core's panel tables read them, and keep their code. */
#define OMX_PANEL_DISPLAY_KINDS(X) \
    X(0u, "gain_reduction_bar", GAIN_REDUCTION_BAR) X(1u, "transfer_curve", TRANSFER_CURVE) X(2u, "eq_response", EQ_RESPONSE) X(3u, "meter", METER) \
    X(4u, "time_response", TIME_RESPONSE)

/* PANEL_DISPLAY_SOURCES (data/panel.json) */
#define OMX_PANEL_DISPLAY_SOURCES_FAMILY "family" ///< the data the panel family itself implies
/** The source sentence (English) of OMX_PANEL_DISPLAY_SOURCES_FAMILY. */
#define OMX_PANEL_DISPLAY_SOURCES_FAMILY_TEXT_EN "The data the panel family implies."
#define OMX_PANEL_DISPLAY_SOURCES_METERS "meters" ///< the plugin's meter readouts
/** The source sentence (English) of OMX_PANEL_DISPLAY_SOURCES_METERS. */
#define OMX_PANEL_DISPLAY_SOURCES_METERS_TEXT_EN "The plugin's meter readouts."
#define OMX_PANEL_DISPLAY_SOURCES_GAIN_ADJUSTMENT "gain_adjustment" ///< the gain the processor applies
/** The source sentence (English) of OMX_PANEL_DISPLAY_SOURCES_GAIN_ADJUSTMENT. */
#define OMX_PANEL_DISPLAY_SOURCES_GAIN_ADJUSTMENT_TEXT_EN "The gain the processor applies."
#define OMX_PANEL_DISPLAY_SOURCES_CURVE "curve" ///< a curve the plugin declares
/** The source sentence (English) of OMX_PANEL_DISPLAY_SOURCES_CURVE. */
#define OMX_PANEL_DISPLAY_SOURCES_CURVE_TEXT_EN "A curve the plugin declares."
/** The number of words of PANEL_DISPLAY_SOURCES. */
#define OMX_PANEL_DISPLAY_SOURCES_COUNT 4u
/** The words of PANEL_DISPLAY_SOURCES in their declared order, as a C initializer list. */
#define OMX_PANEL_DISPLAY_SOURCES_INIT { "family", "meters", "gain_adjustment", "curve" }
/** Expands `X(code, "word", NAME)` once per word of PANEL_DISPLAY_SOURCES, in order, the code being its place in the order. Where a panel description's display takes its data from, in the order of their codes (org.openmixer.panel-description/1). omx-panel's tools/panel-description.mjs and omx-clap-core's panel tables read them, and keep their code. */
#define OMX_PANEL_DISPLAY_SOURCES(X) \
    X(0u, "family", FAMILY) X(1u, "meters", METERS) X(2u, "gain_adjustment", GAIN_ADJUSTMENT) X(3u, "curve", CURVE)

/* PANEL_PLACEMENTS (data/panel.json) */
#define OMX_PANEL_PLACEMENTS_INSERT "insert" ///< an instance on a track's insert chain
/** The source sentence (English) of OMX_PANEL_PLACEMENTS_INSERT. */
#define OMX_PANEL_PLACEMENTS_INSERT_TEXT_EN "An instance on an insert chain."
#define OMX_PANEL_PLACEMENTS_RETURN "return" ///< an instance on a return track
/** The source sentence (English) of OMX_PANEL_PLACEMENTS_RETURN. */
#define OMX_PANEL_PLACEMENTS_RETURN_TEXT_EN "An instance on a return track."
#define OMX_PANEL_PLACEMENTS_BUS "bus" ///< an instance on a bus
/** The source sentence (English) of OMX_PANEL_PLACEMENTS_BUS. */
#define OMX_PANEL_PLACEMENTS_BUS_TEXT_EN "An instance on a bus."
#define OMX_PANEL_PLACEMENTS_MASTER "master" ///< an instance on the master
/** The source sentence (English) of OMX_PANEL_PLACEMENTS_MASTER. */
#define OMX_PANEL_PLACEMENTS_MASTER_TEXT_EN "An instance on the master."
/** The number of words of PANEL_PLACEMENTS. */
#define OMX_PANEL_PLACEMENTS_COUNT 4u
/** The words of PANEL_PLACEMENTS in their declared order, as a C initializer list. */
#define OMX_PANEL_PLACEMENTS_INIT { "insert", "return", "bus", "master" }
/** Expands `X(code, "word", NAME)` once per word of PANEL_PLACEMENTS, in order, the code being its place in the order. Where an instance sits, in the order of their codes: the clap.track-info/1 flags read as one value (org.openmixer.panel-description/1). omx-panel's tools/panel-description.mjs and omx-clap-core's panel tables read them, and keep their code. */
#define OMX_PANEL_PLACEMENTS(X) \
    X(0u, "insert", INSERT) X(1u, "return", RETURN) X(2u, "bus", BUS) X(3u, "master", MASTER)

/* PLUGIN_FEATURE_AUDIO_EFFECT (data/plugin-features.json) */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_AUDIO_EFFECT "clap.audio-effect"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_AUDIO_EFFECT. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_AUDIO_EFFECT_TEXT_EN "The CLAP plugin feature audio-effect: any audio effect with no more specific feature declared."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_CHORUS "clap.chorus"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_CHORUS. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_CHORUS_TEXT_EN "The CLAP plugin feature chorus: an effect that thickens a sound with detuned, delayed copies of it."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_COMPRESSOR "clap.compressor"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_COMPRESSOR. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_COMPRESSOR_TEXT_EN "The CLAP plugin feature compressor: an effect that narrows a sound's dynamic range."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_DE_ESSER "clap.de-esser"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_DE_ESSER. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_DE_ESSER_TEXT_EN "The CLAP plugin feature de-esser: an effect that tames sibilance in a voice."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_DELAY "clap.delay"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_DELAY. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_DELAY_TEXT_EN "The CLAP plugin feature delay: an effect that repeats a sound after a gap."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_DISTORTION "clap.distortion"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_DISTORTION. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_DISTORTION_TEXT_EN "The CLAP plugin feature distortion: an effect that adds harmonics by overdriving a sound."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_EQUALIZER "clap.equalizer"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_EQUALIZER. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_EQUALIZER_TEXT_EN "The CLAP plugin feature equalizer: an effect that shapes a sound's frequency balance."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_EXPANDER "clap.expander"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_EXPANDER. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_EXPANDER_TEXT_EN "The CLAP plugin feature expander: an effect that widens a sound's dynamic range."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_FILTER "clap.filter"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_FILTER. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_FILTER_TEXT_EN "The CLAP plugin feature filter: an effect that removes or shapes a band of frequencies."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_FLANGER "clap.flanger"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_FLANGER. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_FLANGER_TEXT_EN "The CLAP plugin feature flanger: an effect that sweeps a short, modulated delay against the dry sound."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_FREQUENCY_SHIFTER "clap.frequency-shifter"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_FREQUENCY_SHIFTER. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_FREQUENCY_SHIFTER_TEXT_EN "The CLAP plugin feature frequency-shifter: an effect that shifts every frequency of a sound by the same amount."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_GATE "clap.gate"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_GATE. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_GATE_TEXT_EN "The CLAP plugin feature gate: an effect that mutes a sound below a level."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_GLITCH "clap.glitch"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_GLITCH. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_GLITCH_TEXT_EN "The CLAP plugin feature glitch: an effect that cuts, stutters or corrupts a sound on purpose."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_GRANULAR "clap.granular"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_GRANULAR. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_GRANULAR_TEXT_EN "The CLAP plugin feature granular: an effect built from short grains of a sound."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_LIMITER "clap.limiter"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_LIMITER. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_LIMITER_TEXT_EN "The CLAP plugin feature limiter: an effect that holds a sound under a ceiling."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_MASTERING "clap.mastering"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_MASTERING. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_MASTERING_TEXT_EN "The CLAP plugin feature mastering: an effect meant for a mix's final stage."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_MIXING "clap.mixing"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_MIXING. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_MIXING_TEXT_EN "The CLAP plugin feature mixing: an effect meant for use while mixing, such as a channel strip."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_MULTI_EFFECTS "clap.multi-effects"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_MULTI_EFFECTS. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_MULTI_EFFECTS_TEXT_EN "The CLAP plugin feature multi-effects: several effects combined in one plugin."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_PHASE_VOCODER "clap.phase-vocoder"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_PHASE_VOCODER. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_PHASE_VOCODER_TEXT_EN "The CLAP plugin feature phase-vocoder: an effect built on a phase vocoder, typically to stretch or shift a sound independently of pitch and time."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_PHASER "clap.phaser"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_PHASER. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_PHASER_TEXT_EN "The CLAP plugin feature phaser: an effect that sweeps notches through a sound with an all-pass filter chain."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_PITCH_CORRECTION "clap.pitch-correction"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_PITCH_CORRECTION. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_PITCH_CORRECTION_TEXT_EN "The CLAP plugin feature pitch-correction: an effect that pulls a sound's pitch toward a scale."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_PITCH_SHIFTER "clap.pitch-shifter"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_PITCH_SHIFTER. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_PITCH_SHIFTER_TEXT_EN "The CLAP plugin feature pitch-shifter: an effect that changes a sound's pitch without changing its duration."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_RESTORATION "clap.restoration"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_RESTORATION. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_RESTORATION_TEXT_EN "The CLAP plugin feature restoration: an effect that removes noise, clicks or other damage from a recording."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_REVERB "clap.reverb"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_REVERB. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_REVERB_TEXT_EN "The CLAP plugin feature reverb: an effect that adds the reflections of a space to a sound."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_TRANSIENT_SHAPER "clap.transient-shaper"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_TRANSIENT_SHAPER. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_TRANSIENT_SHAPER_TEXT_EN "The CLAP plugin feature transient-shaper: an effect that reshapes a sound's attack and sustain."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_TREMOLO "clap.tremolo"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_TREMOLO. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_TREMOLO_TEXT_EN "The CLAP plugin feature tremolo: an effect that modulates a sound's level over time."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_UTILITY "clap.utility"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_UTILITY. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_CLAP_UTILITY_TEXT_EN "The CLAP plugin feature utility: a plugin that does audio housekeeping rather than a creative effect."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_ALLPASS "lv2.Allpass"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_ALLPASS. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_ALLPASS_TEXT_EN "The LV2 plugin class AllpassPlugin: an all-pass filter, which shifts phase without changing level."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_AMPLIFIER "lv2.Amplifier"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_AMPLIFIER. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_AMPLIFIER_TEXT_EN "The LV2 plugin class AmplifierPlugin: a plugin that changes a sound's level."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_BANDPASS "lv2.Bandpass"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_BANDPASS. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_BANDPASS_TEXT_EN "The LV2 plugin class BandpassPlugin: a filter that passes one band of frequencies."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_CHORUS "lv2.Chorus"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_CHORUS. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_CHORUS_TEXT_EN "The LV2 plugin class ChorusPlugin: an effect that thickens a sound with detuned, delayed copies of it."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_COMB "lv2.Comb"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_COMB. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_COMB_TEXT_EN "The LV2 plugin class CombPlugin: a comb filter, which adds a short delayed copy of a sound to itself."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_COMPRESSOR "lv2.Compressor"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_COMPRESSOR. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_COMPRESSOR_TEXT_EN "The LV2 plugin class CompressorPlugin: an effect that narrows a sound's dynamic range."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_CONVERTER "lv2.Converter"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_CONVERTER. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_CONVERTER_TEXT_EN "The LV2 plugin class ConverterPlugin: a plugin that converts a signal from one representation to another."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_DELAY "lv2.Delay"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_DELAY. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_DELAY_TEXT_EN "The LV2 plugin class DelayPlugin: an effect that repeats a sound after a gap."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_DISTORTION "lv2.Distortion"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_DISTORTION. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_DISTORTION_TEXT_EN "The LV2 plugin class DistortionPlugin: an effect that adds harmonics by overdriving a sound."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_DYNAMICS "lv2.Dynamics"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_DYNAMICS. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_DYNAMICS_TEXT_EN "The LV2 plugin class DynamicsPlugin: an effect that changes a sound's dynamic range."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_EQ "lv2.EQ"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_EQ. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_EQ_TEXT_EN "The LV2 plugin class EQPlugin: an effect that shapes a sound's frequency balance."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_ENVELOPE "lv2.Envelope"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_ENVELOPE. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_ENVELOPE_TEXT_EN "The LV2 plugin class EnvelopePlugin: a plugin that follows or applies an envelope over time."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_EXPANDER "lv2.Expander"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_EXPANDER. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_EXPANDER_TEXT_EN "The LV2 plugin class ExpanderPlugin: an effect that widens a sound's dynamic range."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_FILTER "lv2.Filter"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_FILTER. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_FILTER_TEXT_EN "The LV2 plugin class FilterPlugin: an effect that removes or shapes a band of frequencies."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_FLANGER "lv2.Flanger"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_FLANGER. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_FLANGER_TEXT_EN "The LV2 plugin class FlangerPlugin: an effect that sweeps a short, modulated delay against the dry sound."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_GATE "lv2.Gate"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_GATE. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_GATE_TEXT_EN "The LV2 plugin class GatePlugin: an effect that mutes a sound below a level."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_HIGHPASS "lv2.Highpass"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_HIGHPASS. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_HIGHPASS_TEXT_EN "The LV2 plugin class HighpassPlugin: a filter that passes frequencies above a cutoff."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_LIMITER "lv2.Limiter"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_LIMITER. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_LIMITER_TEXT_EN "The LV2 plugin class LimiterPlugin: an effect that holds a sound under a ceiling."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_LOWPASS "lv2.Lowpass"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_LOWPASS. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_LOWPASS_TEXT_EN "The LV2 plugin class LowpassPlugin: a filter that passes frequencies below a cutoff."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_MIXER "lv2.Mixer"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_MIXER. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_MIXER_TEXT_EN "The LV2 plugin class MixerPlugin: a plugin that combines several signals into one."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_MODULATOR "lv2.Modulator"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_MODULATOR. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_MODULATOR_TEXT_EN "The LV2 plugin class ModulatorPlugin: a plugin that modulates one signal with another."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_MULTI_EQ "lv2.MultiEQ"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_MULTI_EQ. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_MULTI_EQ_TEXT_EN "The LV2 plugin class MultiEQPlugin: a multi-band equaliser."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_PARA_EQ "lv2.ParaEQ"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_PARA_EQ. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_PARA_EQ_TEXT_EN "The LV2 plugin class ParaEQPlugin: a parametric equaliser."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_PHASER "lv2.Phaser"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_PHASER. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_PHASER_TEXT_EN "The LV2 plugin class PhaserPlugin: an effect that sweeps notches through a sound with an all-pass filter chain."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_PITCH "lv2.Pitch"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_PITCH. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_PITCH_TEXT_EN "The LV2 plugin class PitchPlugin: a plugin that changes or tracks a sound's pitch."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_REVERB "lv2.Reverb"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_REVERB. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_REVERB_TEXT_EN "The LV2 plugin class ReverbPlugin: an effect that adds the reflections of a space to a sound."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_SIMULATOR "lv2.Simulator"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_SIMULATOR. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_SIMULATOR_TEXT_EN "The LV2 plugin class SimulatorPlugin: a plugin that models a physical device or space."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_SPATIAL "lv2.Spatial"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_SPATIAL. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_SPATIAL_TEXT_EN "The LV2 plugin class SpatialPlugin: a plugin that places or moves a sound in space."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_SPECTRAL "lv2.Spectral"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_SPECTRAL. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_SPECTRAL_TEXT_EN "The LV2 plugin class SpectralPlugin: a plugin that processes a sound in the frequency domain."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_UTILITY "lv2.Utility"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_UTILITY. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_UTILITY_TEXT_EN "The LV2 plugin class UtilityPlugin: a plugin that does audio housekeeping rather than a creative effect."
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_WAVESHAPER "lv2.Waveshaper"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_WAVESHAPER. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_LV2_WAVESHAPER_TEXT_EN "The LV2 plugin class WaveshaperPlugin: a plugin that reshapes a waveform to add harmonics."
/** The number of words of PLUGIN_FEATURE_AUDIO_EFFECT. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_COUNT 58u
/** The words of PLUGIN_FEATURE_AUDIO_EFFECT in their declared order, as a C initializer list. */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT_INIT { "clap.audio-effect", "clap.chorus", "clap.compressor", "clap.de-esser", "clap.delay", "clap.distortion", "clap.equalizer", "clap.expander", "clap.filter", "clap.flanger", "clap.frequency-shifter", "clap.gate", "clap.glitch", "clap.granular", "clap.limiter", "clap.mastering", "clap.mixing", "clap.multi-effects", "clap.phase-vocoder", "clap.phaser", "clap.pitch-correction", "clap.pitch-shifter", "clap.restoration", "clap.reverb", "clap.transient-shaper", "clap.tremolo", "clap.utility", "lv2.Allpass", "lv2.Amplifier", "lv2.Bandpass", "lv2.Chorus", "lv2.Comb", "lv2.Compressor", "lv2.Converter", "lv2.Delay", "lv2.Distortion", "lv2.Dynamics", "lv2.EQ", "lv2.Envelope", "lv2.Expander", "lv2.Filter", "lv2.Flanger", "lv2.Gate", "lv2.Highpass", "lv2.Limiter", "lv2.Lowpass", "lv2.Mixer", "lv2.Modulator", "lv2.MultiEQ", "lv2.ParaEQ", "lv2.Phaser", "lv2.Pitch", "lv2.Reverb", "lv2.Simulator", "lv2.Spatial", "lv2.Spectral", "lv2.Utility", "lv2.Waveshaper" }
/** Expands `X(code, "word", NAME)` once per word of PLUGIN_FEATURE_AUDIO_EFFECT, in order, the code being its place in the order. The CLAP plugin features and LV2 plugin classes that become the descriptor feature audio-effect: every kind of effect, a filter, a dynamics processor, a modulation or a space, and the channel-less roles of a processor (utility, mixing, mastering). */
#define OMX_PLUGIN_FEATURE_AUDIO_EFFECT(X) \
    X(0u, "clap.audio-effect", CLAP_AUDIO_EFFECT) X(1u, "clap.chorus", CLAP_CHORUS) X(2u, "clap.compressor", CLAP_COMPRESSOR) X(3u, "clap.de-esser", CLAP_DE_ESSER) \
    X(4u, "clap.delay", CLAP_DELAY) X(5u, "clap.distortion", CLAP_DISTORTION) X(6u, "clap.equalizer", CLAP_EQUALIZER) X(7u, "clap.expander", CLAP_EXPANDER) \
    X(8u, "clap.filter", CLAP_FILTER) X(9u, "clap.flanger", CLAP_FLANGER) X(10u, "clap.frequency-shifter", CLAP_FREQUENCY_SHIFTER) X(11u, "clap.gate", CLAP_GATE) \
    X(12u, "clap.glitch", CLAP_GLITCH) X(13u, "clap.granular", CLAP_GRANULAR) X(14u, "clap.limiter", CLAP_LIMITER) X(15u, "clap.mastering", CLAP_MASTERING) \
    X(16u, "clap.mixing", CLAP_MIXING) X(17u, "clap.multi-effects", CLAP_MULTI_EFFECTS) X(18u, "clap.phase-vocoder", CLAP_PHASE_VOCODER) X(19u, "clap.phaser", CLAP_PHASER) \
    X(20u, "clap.pitch-correction", CLAP_PITCH_CORRECTION) X(21u, "clap.pitch-shifter", CLAP_PITCH_SHIFTER) X(22u, "clap.restoration", CLAP_RESTORATION) X(23u, "clap.reverb", CLAP_REVERB) \
    X(24u, "clap.transient-shaper", CLAP_TRANSIENT_SHAPER) X(25u, "clap.tremolo", CLAP_TREMOLO) X(26u, "clap.utility", CLAP_UTILITY) X(27u, "lv2.Allpass", LV2_ALLPASS) \
    X(28u, "lv2.Amplifier", LV2_AMPLIFIER) X(29u, "lv2.Bandpass", LV2_BANDPASS) X(30u, "lv2.Chorus", LV2_CHORUS) X(31u, "lv2.Comb", LV2_COMB) \
    X(32u, "lv2.Compressor", LV2_COMPRESSOR) X(33u, "lv2.Converter", LV2_CONVERTER) X(34u, "lv2.Delay", LV2_DELAY) X(35u, "lv2.Distortion", LV2_DISTORTION) \
    X(36u, "lv2.Dynamics", LV2_DYNAMICS) X(37u, "lv2.EQ", LV2_EQ) X(38u, "lv2.Envelope", LV2_ENVELOPE) X(39u, "lv2.Expander", LV2_EXPANDER) \
    X(40u, "lv2.Filter", LV2_FILTER) X(41u, "lv2.Flanger", LV2_FLANGER) X(42u, "lv2.Gate", LV2_GATE) X(43u, "lv2.Highpass", LV2_HIGHPASS) \
    X(44u, "lv2.Limiter", LV2_LIMITER) X(45u, "lv2.Lowpass", LV2_LOWPASS) X(46u, "lv2.Mixer", LV2_MIXER) X(47u, "lv2.Modulator", LV2_MODULATOR) \
    X(48u, "lv2.MultiEQ", LV2_MULTI_EQ) X(49u, "lv2.ParaEQ", LV2_PARA_EQ) X(50u, "lv2.Phaser", LV2_PHASER) X(51u, "lv2.Pitch", LV2_PITCH) \
    X(52u, "lv2.Reverb", LV2_REVERB) X(53u, "lv2.Simulator", LV2_SIMULATOR) X(54u, "lv2.Spatial", LV2_SPATIAL) X(55u, "lv2.Spectral", LV2_SPECTRAL) \
    X(56u, "lv2.Utility", LV2_UTILITY) X(57u, "lv2.Waveshaper", LV2_WAVESHAPER)

/* PLUGIN_FEATURE_INSTRUMENT (data/plugin-features.json) */
#define OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_DRUM "clap.drum"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_DRUM. */
#define OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_DRUM_TEXT_EN "The CLAP plugin feature drum: an instrument that plays drum sounds."
#define OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_DRUM_MACHINE "clap.drum-machine"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_DRUM_MACHINE. */
#define OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_DRUM_MACHINE_TEXT_EN "The CLAP plugin feature drum-machine: an instrument that sequences and plays drum sounds."
#define OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_INSTRUMENT "clap.instrument"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_INSTRUMENT. */
#define OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_INSTRUMENT_TEXT_EN "The CLAP plugin feature instrument: a plugin played by notes, with no more specific kind declared."
#define OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_SAMPLER "clap.sampler"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_SAMPLER. */
#define OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_SAMPLER_TEXT_EN "The CLAP plugin feature sampler: an instrument that plays recorded samples."
#define OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_SYNTHESIZER "clap.synthesizer"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_SYNTHESIZER. */
#define OMX_PLUGIN_FEATURE_INSTRUMENT_CLAP_SYNTHESIZER_TEXT_EN "The CLAP plugin feature synthesizer: an instrument that generates its own sound rather than playing samples."
#define OMX_PLUGIN_FEATURE_INSTRUMENT_LV2_INSTRUMENT "lv2.Instrument"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_INSTRUMENT_LV2_INSTRUMENT. */
#define OMX_PLUGIN_FEATURE_INSTRUMENT_LV2_INSTRUMENT_TEXT_EN "The LV2 plugin class InstrumentPlugin: a plugin played by notes."
/** The number of words of PLUGIN_FEATURE_INSTRUMENT. */
#define OMX_PLUGIN_FEATURE_INSTRUMENT_COUNT 6u
/** The words of PLUGIN_FEATURE_INSTRUMENT in their declared order, as a C initializer list. */
#define OMX_PLUGIN_FEATURE_INSTRUMENT_INIT { "clap.drum", "clap.drum-machine", "clap.instrument", "clap.sampler", "clap.synthesizer", "lv2.Instrument" }
/** Expands `X(code, "word", NAME)` once per word of PLUGIN_FEATURE_INSTRUMENT, in order, the code being its place in the order. The CLAP plugin features and LV2 plugin classes that become the descriptor feature instrument: notes in, audio out. */
#define OMX_PLUGIN_FEATURE_INSTRUMENT(X) \
    X(0u, "clap.drum", CLAP_DRUM) X(1u, "clap.drum-machine", CLAP_DRUM_MACHINE) X(2u, "clap.instrument", CLAP_INSTRUMENT) X(3u, "clap.sampler", CLAP_SAMPLER) \
    X(4u, "clap.synthesizer", CLAP_SYNTHESIZER) X(5u, "lv2.Instrument", LV2_INSTRUMENT)

/* PLUGIN_FEATURE_NOTE_EFFECT (data/plugin-features.json) */
#define OMX_PLUGIN_FEATURE_NOTE_EFFECT_CLAP_NOTE_EFFECT "clap.note-effect"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_NOTE_EFFECT_CLAP_NOTE_EFFECT. */
#define OMX_PLUGIN_FEATURE_NOTE_EFFECT_CLAP_NOTE_EFFECT_TEXT_EN "The CLAP plugin feature note-effect: a plugin that reads notes and writes notes, such as an arpeggiator."
#define OMX_PLUGIN_FEATURE_NOTE_EFFECT_LV2_MIDI "lv2.MIDI"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_NOTE_EFFECT_LV2_MIDI. */
#define OMX_PLUGIN_FEATURE_NOTE_EFFECT_LV2_MIDI_TEXT_EN "The LV2 plugin class MIDIPlugin: a plugin that processes MIDI, note in to note out."
/** The number of words of PLUGIN_FEATURE_NOTE_EFFECT. */
#define OMX_PLUGIN_FEATURE_NOTE_EFFECT_COUNT 2u
/** The words of PLUGIN_FEATURE_NOTE_EFFECT in their declared order, as a C initializer list. */
#define OMX_PLUGIN_FEATURE_NOTE_EFFECT_INIT { "clap.note-effect", "lv2.MIDI" }
/** Expands `X(code, "word", NAME)` once per word of PLUGIN_FEATURE_NOTE_EFFECT, in order, the code being its place in the order. The CLAP plugin features and LV2 plugin classes that become the descriptor feature note-effect: notes in, notes out. */
#define OMX_PLUGIN_FEATURE_NOTE_EFFECT(X) \
    X(0u, "clap.note-effect", CLAP_NOTE_EFFECT) X(1u, "lv2.MIDI", LV2_MIDI)

/* PLUGIN_FEATURE_ANALYZER (data/plugin-features.json) */
#define OMX_PLUGIN_FEATURE_ANALYZER_CLAP_ANALYZER "clap.analyzer"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_ANALYZER_CLAP_ANALYZER. */
#define OMX_PLUGIN_FEATURE_ANALYZER_CLAP_ANALYZER_TEXT_EN "The CLAP plugin feature analyzer: a plugin that reads audio and reports a measurement, with no further output."
#define OMX_PLUGIN_FEATURE_ANALYZER_CLAP_NOTE_DETECTOR "clap.note-detector"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_ANALYZER_CLAP_NOTE_DETECTOR. */
#define OMX_PLUGIN_FEATURE_ANALYZER_CLAP_NOTE_DETECTOR_TEXT_EN "The CLAP plugin feature note-detector: an analyzer that reads pitch from audio."
#define OMX_PLUGIN_FEATURE_ANALYZER_LV2_ANALYSER "lv2.Analyser"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_ANALYZER_LV2_ANALYSER. */
#define OMX_PLUGIN_FEATURE_ANALYZER_LV2_ANALYSER_TEXT_EN "The LV2 plugin class AnalyserPlugin: a plugin that reads audio and reports a measurement."
/** The number of words of PLUGIN_FEATURE_ANALYZER. */
#define OMX_PLUGIN_FEATURE_ANALYZER_COUNT 3u
/** The words of PLUGIN_FEATURE_ANALYZER in their declared order, as a C initializer list. */
#define OMX_PLUGIN_FEATURE_ANALYZER_INIT { "clap.analyzer", "clap.note-detector", "lv2.Analyser" }
/** Expands `X(code, "word", NAME)` once per word of PLUGIN_FEATURE_ANALYZER, in order, the code being its place in the order. The CLAP plugin features and LV2 plugin classes that become the descriptor feature analyzer: audio in, a reading out (a note detector reads pitch from audio). */
#define OMX_PLUGIN_FEATURE_ANALYZER(X) \
    X(0u, "clap.analyzer", CLAP_ANALYZER) X(1u, "clap.note-detector", CLAP_NOTE_DETECTOR) X(2u, "lv2.Analyser", LV2_ANALYSER)

/* PLUGIN_FEATURE_OTHER (data/plugin-features.json) */
#define OMX_PLUGIN_FEATURE_OTHER_CLAP_AMBISONIC "clap.ambisonic"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_OTHER_CLAP_AMBISONIC. */
#define OMX_PLUGIN_FEATURE_OTHER_CLAP_AMBISONIC_TEXT_EN "The CLAP plugin feature ambisonic: a plugin declared to work in an ambisonic channel layout."
#define OMX_PLUGIN_FEATURE_OTHER_CLAP_MONO "clap.mono"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_OTHER_CLAP_MONO. */
#define OMX_PLUGIN_FEATURE_OTHER_CLAP_MONO_TEXT_EN "The CLAP plugin feature mono: a plugin declared to work in a mono channel layout."
#define OMX_PLUGIN_FEATURE_OTHER_CLAP_STEREO "clap.stereo"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_OTHER_CLAP_STEREO. */
#define OMX_PLUGIN_FEATURE_OTHER_CLAP_STEREO_TEXT_EN "The CLAP plugin feature stereo: a plugin declared to work in a stereo channel layout."
#define OMX_PLUGIN_FEATURE_OTHER_CLAP_SURROUND "clap.surround"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_OTHER_CLAP_SURROUND. */
#define OMX_PLUGIN_FEATURE_OTHER_CLAP_SURROUND_TEXT_EN "The CLAP plugin feature surround: a plugin declared to work in a surround channel layout."
#define OMX_PLUGIN_FEATURE_OTHER_LV2_CONSTANT "lv2.Constant"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_OTHER_LV2_CONSTANT. */
#define OMX_PLUGIN_FEATURE_OTHER_LV2_CONSTANT_TEXT_EN "The LV2 plugin class ConstantPlugin: a plugin with no input that outputs a constant."
#define OMX_PLUGIN_FEATURE_OTHER_LV2_FUNCTION "lv2.Function"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_OTHER_LV2_FUNCTION. */
#define OMX_PLUGIN_FEATURE_OTHER_LV2_FUNCTION_TEXT_EN "The LV2 plugin class FunctionPlugin: a plugin with no audio input or output, used only for its side effects or parameters."
#define OMX_PLUGIN_FEATURE_OTHER_LV2_GENERATOR "lv2.Generator"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_OTHER_LV2_GENERATOR. */
#define OMX_PLUGIN_FEATURE_OTHER_LV2_GENERATOR_TEXT_EN "The LV2 plugin class GeneratorPlugin: a plugin with no audio input that generates a sound."
#define OMX_PLUGIN_FEATURE_OTHER_LV2_OSCILLATOR "lv2.Oscillator"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_OTHER_LV2_OSCILLATOR. */
#define OMX_PLUGIN_FEATURE_OTHER_LV2_OSCILLATOR_TEXT_EN "The LV2 plugin class OscillatorPlugin: a generator that outputs a periodic waveform."
#define OMX_PLUGIN_FEATURE_OTHER_LV2_PLUGIN "lv2.Plugin"
/** The source sentence (English) of OMX_PLUGIN_FEATURE_OTHER_LV2_PLUGIN. */
#define OMX_PLUGIN_FEATURE_OTHER_LV2_PLUGIN_TEXT_EN "The LV2 plugin class Plugin: the base LV2 plugin class, with no more specific class declared."
/** The number of words of PLUGIN_FEATURE_OTHER. */
#define OMX_PLUGIN_FEATURE_OTHER_COUNT 9u
/** The words of PLUGIN_FEATURE_OTHER in their declared order, as a C initializer list. */
#define OMX_PLUGIN_FEATURE_OTHER_INIT { "clap.ambisonic", "clap.mono", "clap.stereo", "clap.surround", "lv2.Constant", "lv2.Function", "lv2.Generator", "lv2.Oscillator", "lv2.Plugin" }
/** Expands `X(code, "word", NAME)` once per word of PLUGIN_FEATURE_OTHER, in order, the code being its place in the order. The CLAP plugin features and LV2 plugin classes that fit none of the four feature words: a channel layout stated as a feature (mono, stereo, surround, ambisonic), and the LV2 classes of a generator, an oscillator, a constant and a function, which take no notes and so are no instrument. A scan carries them in the extension bag. */
#define OMX_PLUGIN_FEATURE_OTHER(X) \
    X(0u, "clap.ambisonic", CLAP_AMBISONIC) X(1u, "clap.mono", CLAP_MONO) X(2u, "clap.stereo", CLAP_STEREO) X(3u, "clap.surround", CLAP_SURROUND) \
    X(4u, "lv2.Constant", LV2_CONSTANT) X(5u, "lv2.Function", LV2_FUNCTION) X(6u, "lv2.Generator", LV2_GENERATOR) X(7u, "lv2.Oscillator", LV2_OSCILLATOR) \
    X(8u, "lv2.Plugin", LV2_PLUGIN)

/* PARAM_UNITS (data/primitives.json) */
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
/** The number of words of PARAM_UNITS. */
#define OMX_PARAM_UNITS_COUNT 15u
/** The words of PARAM_UNITS in their declared order, as a C initializer list. */
#define OMX_PARAM_UNITS_INIT { "dB", "dBFS", "ms", "s", "min", "Hz", "oct", "cents", "st", "percent", "x", "none", "dB-oct", "LUFS", "dB-s" }
/** Expands `X(code, "word", NAME)` once per word of PARAM_UNITS, in order, the code being its place in the order. The closed list of units the items use: each word's `symbol` is its symbol as written (`%`, `""`, `dB/oct`), the word a name the wire can carry. The schema's $defs.unit enum is these symbols in this order (tools/unit-enum.mjs); a descriptor's unit is one of them or a plugin-only unit (descriptorUnit). */
#define OMX_PARAM_UNITS_WORDS(X) \
    X(0u, "dB", DB) X(1u, "dBFS", DBFS) X(2u, "ms", MS) X(3u, "s", S) \
    X(4u, "min", MIN) X(5u, "Hz", HZ) X(6u, "oct", OCT) X(7u, "cents", CENTS) \
    X(8u, "st", ST) X(9u, "percent", PERCENT) X(10u, "x", X) X(11u, "none", NONE) \
    X(12u, "dB-oct", DB_PER_OCT) X(13u, "LUFS", LUFS) X(14u, "dB-s", DB_PER_S)

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

/* VERB_HOSTS (data/verbs.json) */
#define OMX_VERB_HOSTS_PLUGIN_HOSTD "plugin-hostd" ///< The daemon that places plugins in workers and answers the verbs it adds itself.
/** The source sentence (English) of OMX_VERB_HOSTS_PLUGIN_HOSTD. */
#define OMX_VERB_HOSTS_PLUGIN_HOSTD_TEXT_EN "The daemon that places plugins in workers and answers the verbs it adds itself."
#define OMX_VERB_HOSTS_OMX_CLAP_HOST "omx-clap-host" ///< omx-clap-core's worker: a CLAP plugin's host, and an LV2 plugin's through its adapter.
/** The source sentence (English) of OMX_VERB_HOSTS_OMX_CLAP_HOST. */
#define OMX_VERB_HOSTS_OMX_CLAP_HOST_TEXT_EN "omx-clap-core's worker: a CLAP plugin's host, and an LV2 plugin's through its adapter."
#define OMX_VERB_HOSTS_MOD_HOST "mod-host" ///< mod-host, the LV2 host whose protocol the others speak.
/** The source sentence (English) of OMX_VERB_HOSTS_MOD_HOST. */
#define OMX_VERB_HOSTS_MOD_HOST_TEXT_EN "mod-host, the LV2 host whose protocol the others speak."
/** The number of words of VERB_HOSTS. */
#define OMX_VERB_HOSTS_COUNT 3u
/** The words of VERB_HOSTS in their declared order, as a C initializer list. */
#define OMX_VERB_HOSTS_INIT { "plugin-hostd", "omx-clap-host", "mod-host" }
/** Expands `X(code, "word", NAME)` once per word of VERB_HOSTS, in order, the code being its place in the order. The hosts a verb's implementedBy names (docs/contract-dir.md): the programs a controller sends mod-host's protocol to. A verb states what each one owes it; a host the verb leaves out owes it nothing. */
#define OMX_VERB_HOSTS(X) \
    X(0u, "plugin-hostd", PLUGIN_HOSTD) X(1u, "omx-clap-host", OMX_CLAP_HOST) X(2u, "mod-host", MOD_HOST)

#endif /* OMX_VOCABULARY_H */
