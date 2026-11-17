// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
#ifndef OMX_FORMATS_H
#define OMX_FORMATS_H
/*
 * GENERATED: DO NOT EDIT BY HAND.
 * Produced by `omx-contract render --target c` from Open-Mixer/omx-contract's data/formats/: the identifiers and
 * numbers the CLAP headers declare and the namespaces of the LV2 specifications (docs/data-layout.md). A consumer
 * writes and compares these, never a literal of its own.
 */

/** @file
 * @brief The identifiers and numbers of the plugin formats: the CLAP extension, factory, feature and window ids and
 * the numbers the CLAP headers declare, and the LV2 specifications' URIs and namespaces. */

/* CLAP identifiers: an extension id as get_extension is asked for it, a factory id, a plugin feature, a window API */
/** The CLAP port-type CLAP_PORT_AMBISONIC of clap/ext/ambisonic.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_PORT_AMBISONIC "ambisonic"
/** The CLAP extension CLAP_EXT_AMBISONIC_COMPAT of clap/ext/ambisonic.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_AMBISONIC_COMPAT "clap.ambisonic.draft/3"
/** The CLAP extension CLAP_EXT_AMBISONIC of clap/ext/ambisonic.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_AMBISONIC "clap.ambisonic/3"
/** The CLAP extension CLAP_EXT_AUDIO_PORTS_ACTIVATION of clap/ext/audio-ports-activation.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_AUDIO_PORTS_ACTIVATION "clap.audio-ports-activation/2"
/** The CLAP extension CLAP_EXT_AUDIO_PORTS_ACTIVATION_COMPAT of clap/ext/audio-ports-activation.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_AUDIO_PORTS_ACTIVATION_COMPAT "clap.audio-ports-activation/draft-2"
/** The CLAP extension CLAP_EXT_AUDIO_PORTS_CONFIG of clap/ext/audio-ports-config.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_AUDIO_PORTS_CONFIG "clap.audio-ports-config"
/** The CLAP extension CLAP_EXT_AUDIO_PORTS_CONFIG_INFO of clap/ext/audio-ports-config.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_AUDIO_PORTS_CONFIG_INFO "clap.audio-ports-config-info/1"
/** The CLAP extension CLAP_EXT_AUDIO_PORTS_CONFIG_INFO_COMPAT of clap/ext/audio-ports-config.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_AUDIO_PORTS_CONFIG_INFO_COMPAT "clap.audio-ports-config-info/draft-0"
/** The CLAP extension CLAP_EXT_AUDIO_PORTS of clap/ext/audio-ports.h (clap 1.2.10); status used. */
#define OMX_CLAP_EXT_AUDIO_PORTS "clap.audio-ports"
/** The CLAP port-type CLAP_PORT_MONO of clap/ext/audio-ports.h (clap 1.2.10); status used. */
#define OMX_CLAP_PORT_MONO "mono"
/** The CLAP port-type CLAP_PORT_STEREO of clap/ext/audio-ports.h (clap 1.2.10); status used. */
#define OMX_CLAP_PORT_STEREO "stereo"
/** The CLAP extension CLAP_EXT_CONFIGURABLE_AUDIO_PORTS_COMPAT of clap/ext/configurable-audio-ports.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_CONFIGURABLE_AUDIO_PORTS_COMPAT "clap.configurable-audio-ports.draft1"
/** The CLAP extension CLAP_EXT_CONFIGURABLE_AUDIO_PORTS of clap/ext/configurable-audio-ports.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_CONFIGURABLE_AUDIO_PORTS "clap.configurable-audio-ports/1"
/** The CLAP extension CLAP_EXT_CONTEXT_MENU_COMPAT of clap/ext/context-menu.h (clap 1.2.10); status out-of-scope. */
#define OMX_CLAP_EXT_CONTEXT_MENU_COMPAT "clap.context-menu.draft/0"
/** The CLAP extension CLAP_EXT_CONTEXT_MENU of clap/ext/context-menu.h (clap 1.2.10); status out-of-scope. */
#define OMX_CLAP_EXT_CONTEXT_MENU "clap.context-menu/1"
/** The CLAP extension CLAP_EXT_BACKGROUND_ACTIVATION of clap/ext/draft/background-activation.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_BACKGROUND_ACTIVATION "clap.background-activation/1"
/** The CLAP extension CLAP_EXT_BACKGROUND_PROGRESS of clap/ext/draft/background-progress.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_BACKGROUND_PROGRESS "clap.background-progress/1"
/** The CLAP extension CLAP_EXT_BACKGROUND_STATE_CONTEXT of clap/ext/draft/background-state-context.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_BACKGROUND_STATE_CONTEXT "clap.background-state-context/1"
/** The CLAP extension CLAP_EXT_EXTENSIBLE_AUDIO_PORTS of clap/ext/draft/extensible-audio-ports.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_EXTENSIBLE_AUDIO_PORTS "clap.extensible-audio-ports/1"
/** The CLAP extension CLAP_EXT_FLUSH_EVENTS of clap/ext/draft/flush-events.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_FLUSH_EVENTS "clap.flush-events/1"
/** The CLAP extension CLAP_EXT_GAIN_ADJUSTMENT_METERING of clap/ext/draft/gain-adjustment-metering.h (clap 1.2.10); status used. */
#define OMX_CLAP_EXT_GAIN_ADJUSTMENT_METERING "clap.gain-adjustment-metering/0"
/** The CLAP extension CLAP_EXT_MINI_CURVE_DISPLAY of clap/ext/draft/mini-curve-display.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_MINI_CURVE_DISPLAY "clap.mini-curve-display/3"
/** The CLAP extension CLAP_EXT_OCTAVE_NUMBER of clap/ext/draft/octave-number.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_OCTAVE_NUMBER "clap.octave-number/1"
/** The CLAP extension CLAP_EXT_PARAM_HOVERED of clap/ext/draft/param-hovered.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_PARAM_HOVERED "clap.param-hovered/1"
/** The CLAP extension CLAP_EXT_PARAMS_ORIGIN of clap/ext/draft/params-origin.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_PARAMS_ORIGIN "clap.params-origin/1"
/** The CLAP extension CLAP_EXT_PROJECT_LOCATION of clap/ext/draft/project-location.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_PROJECT_LOCATION "clap.project-location/2"
/** The CLAP extension CLAP_EXT_RESOURCE_DIRECTORY of clap/ext/draft/resource-directory.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_RESOURCE_DIRECTORY "clap.resource-directory/1"
/** The CLAP extension CLAP_EXT_SCRATCH_MEMORY of clap/ext/draft/scratch-memory.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_SCRATCH_MEMORY "clap.scratch-memory/1"
/** The CLAP extension CLAP_EXT_TRANSPORT_CONTROL of clap/ext/draft/transport-control.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_TRANSPORT_CONTROL "clap.transport-control/2"
/** The CLAP extension CLAP_EXT_TRIGGERS of clap/ext/draft/triggers.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_TRIGGERS "clap.triggers/1"
/** The CLAP extension CLAP_EXT_TUNING of clap/ext/draft/tuning.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_TUNING "clap.tuning/2"
/** The CLAP extension CLAP_EXT_UNDO of clap/ext/draft/undo.h (clap 1.2.10); status out-of-scope. */
#define OMX_CLAP_EXT_UNDO "clap.undo/4"
/** The CLAP extension CLAP_EXT_UNDO_CONTEXT of clap/ext/draft/undo.h (clap 1.2.10); status out-of-scope. */
#define OMX_CLAP_EXT_UNDO_CONTEXT "clap.undo_context/4"
/** The CLAP extension CLAP_EXT_UNDO_DELTA of clap/ext/draft/undo.h (clap 1.2.10); status out-of-scope. */
#define OMX_CLAP_EXT_UNDO_DELTA "clap.undo_delta/4"
/** The CLAP window-api CLAP_WINDOW_API_WEBVIEW of clap/ext/draft/webview.h (clap 1.2.10); status out-of-scope. */
#define OMX_CLAP_WINDOW_API_WEBVIEW "webview"
/** The CLAP extension CLAP_EXT_WEBVIEW of clap/ext/draft/webview.h (clap 1.2.10); status out-of-scope. */
#define OMX_CLAP_EXT_WEBVIEW "clap.webview/3"
/** The CLAP extension CLAP_EXT_EVENT_REGISTRY of clap/ext/event-registry.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_EVENT_REGISTRY "clap.event-registry"
/** The CLAP window-api CLAP_WINDOW_API_COCOA of clap/ext/gui.h (clap 1.2.10); status out-of-scope. */
#define OMX_CLAP_WINDOW_API_COCOA "cocoa"
/** The CLAP extension CLAP_EXT_GUI of clap/ext/gui.h (clap 1.2.10); status out-of-scope. */
#define OMX_CLAP_EXT_GUI "clap.gui"
/** The CLAP window-api CLAP_WINDOW_API_UIKIT of clap/ext/gui.h (clap 1.2.10); status out-of-scope. */
#define OMX_CLAP_WINDOW_API_UIKIT "uikit"
/** The CLAP window-api CLAP_WINDOW_API_WAYLAND of clap/ext/gui.h (clap 1.2.10); status out-of-scope. */
#define OMX_CLAP_WINDOW_API_WAYLAND "wayland"
/** The CLAP window-api CLAP_WINDOW_API_WIN32 of clap/ext/gui.h (clap 1.2.10); status out-of-scope. */
#define OMX_CLAP_WINDOW_API_WIN32 "win32"
/** The CLAP window-api CLAP_WINDOW_API_X11 of clap/ext/gui.h (clap 1.2.10); status out-of-scope. */
#define OMX_CLAP_WINDOW_API_X11 "x11"
/** The CLAP extension CLAP_EXT_LATENCY of clap/ext/latency.h (clap 1.2.10); status used. */
#define OMX_CLAP_EXT_LATENCY "clap.latency"
/** The CLAP extension CLAP_EXT_LOG of clap/ext/log.h (clap 1.2.10); status used. */
#define OMX_CLAP_EXT_LOG "clap.log"
/** The CLAP extension CLAP_EXT_NOTE_NAME of clap/ext/note-name.h (clap 1.2.10); status used. */
#define OMX_CLAP_EXT_NOTE_NAME "clap.note-name"
/** The CLAP extension CLAP_EXT_NOTE_PORTS of clap/ext/note-ports.h (clap 1.2.10); status used. */
#define OMX_CLAP_EXT_NOTE_PORTS "clap.note-ports"
/** The CLAP extension CLAP_EXT_PARAM_INDICATION_COMPAT of clap/ext/param-indication.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_PARAM_INDICATION_COMPAT "clap.param-indication.draft/4"
/** The CLAP extension CLAP_EXT_PARAM_INDICATION of clap/ext/param-indication.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_PARAM_INDICATION "clap.param-indication/4"
/** The CLAP extension CLAP_EXT_PARAMS of clap/ext/params.h (clap 1.2.10); status used. */
#define OMX_CLAP_EXT_PARAMS "clap.params"
/** The CLAP extension CLAP_EXT_POSIX_FD_SUPPORT of clap/ext/posix-fd-support.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_POSIX_FD_SUPPORT "clap.posix-fd-support"
/** The CLAP extension CLAP_EXT_PRESET_LOAD_COMPAT of clap/ext/preset-load.h (clap 1.2.10); status used. */
#define OMX_CLAP_EXT_PRESET_LOAD_COMPAT "clap.preset-load.draft/2"
/** The CLAP extension CLAP_EXT_PRESET_LOAD of clap/ext/preset-load.h (clap 1.2.10); status used. */
#define OMX_CLAP_EXT_PRESET_LOAD "clap.preset-load/2"
/** The CLAP extension CLAP_EXT_REMOTE_CONTROLS_COMPAT of clap/ext/remote-controls.h (clap 1.2.10); status used. */
#define OMX_CLAP_EXT_REMOTE_CONTROLS_COMPAT "clap.remote-controls.draft/2"
/** The CLAP extension CLAP_EXT_REMOTE_CONTROLS of clap/ext/remote-controls.h (clap 1.2.10); status used. */
#define OMX_CLAP_EXT_REMOTE_CONTROLS "clap.remote-controls/2"
/** The CLAP extension CLAP_EXT_RENDER of clap/ext/render.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_RENDER "clap.render"
/** The CLAP extension CLAP_EXT_STATE_CONTEXT of clap/ext/state-context.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_STATE_CONTEXT "clap.state-context/2"
/** The CLAP extension CLAP_EXT_STATE of clap/ext/state.h (clap 1.2.10); status used. */
#define OMX_CLAP_EXT_STATE "clap.state"
/** The CLAP port-type CLAP_PORT_SURROUND of clap/ext/surround.h (clap 1.2.10); status used. */
#define OMX_CLAP_PORT_SURROUND "surround"
/** The CLAP extension CLAP_EXT_SURROUND_COMPAT of clap/ext/surround.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_SURROUND_COMPAT "clap.surround.draft/4"
/** The CLAP extension CLAP_EXT_SURROUND of clap/ext/surround.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_SURROUND "clap.surround/4"
/** The CLAP extension CLAP_EXT_TAIL of clap/ext/tail.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_TAIL "clap.tail"
/** The CLAP extension CLAP_EXT_THREAD_CHECK of clap/ext/thread-check.h (clap 1.2.10); status used. */
#define OMX_CLAP_EXT_THREAD_CHECK "clap.thread-check"
/** The CLAP extension CLAP_EXT_THREAD_POOL of clap/ext/thread-pool.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_THREAD_POOL "clap.thread-pool"
/** The CLAP extension CLAP_EXT_TIMER_SUPPORT of clap/ext/timer-support.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_EXT_TIMER_SUPPORT "clap.timer-support"
/** The CLAP extension CLAP_EXT_TRACK_INFO_COMPAT of clap/ext/track-info.h (clap 1.2.10); status used. */
#define OMX_CLAP_EXT_TRACK_INFO_COMPAT "clap.track-info.draft/1"
/** The CLAP extension CLAP_EXT_TRACK_INFO of clap/ext/track-info.h (clap 1.2.10); status used. */
#define OMX_CLAP_EXT_TRACK_INFO "clap.track-info/1"
/** The CLAP extension CLAP_EXT_VOICE_INFO of clap/ext/voice-info.h (clap 1.2.10); status used. */
#define OMX_CLAP_EXT_VOICE_INFO "clap.voice-info"
/** The CLAP factory CLAP_PLUGIN_INVALIDATION_FACTORY_ID of clap/factory/draft/plugin-invalidation.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_PLUGIN_INVALIDATION_FACTORY_ID "clap.plugin-invalidation-factory/1"
/** The CLAP factory CLAP_PLUGIN_STATE_CONVERTER_FACTORY_ID of clap/factory/draft/plugin-state-converter.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_PLUGIN_STATE_CONVERTER_FACTORY_ID "clap.plugin-state-converter-factory/1"
/** The CLAP factory CLAP_PLUGIN_FACTORY_ID of clap/factory/plugin-factory.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FACTORY_ID "clap.plugin-factory"
/** The CLAP factory CLAP_PRESET_DISCOVERY_FACTORY_ID of clap/factory/preset-discovery.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_PRESET_DISCOVERY_FACTORY_ID "clap.preset-discovery-factory/2"
/** The CLAP factory CLAP_PRESET_DISCOVERY_FACTORY_ID_COMPAT of clap/factory/preset-discovery.h (clap 1.2.10); status supported-later. */
#define OMX_CLAP_PRESET_DISCOVERY_FACTORY_ID_COMPAT "clap.preset-discovery-factory/draft-2"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_AMBISONIC of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_AMBISONIC "ambisonic"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_ANALYZER of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_ANALYZER "analyzer"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_AUDIO_EFFECT of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_AUDIO_EFFECT "audio-effect"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_CHORUS of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_CHORUS "chorus"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_COMPRESSOR of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_COMPRESSOR "compressor"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_DEESSER of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_DEESSER "de-esser"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_DELAY of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_DELAY "delay"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_DISTORTION of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_DISTORTION "distortion"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_DRUM of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_DRUM "drum"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_DRUM_MACHINE of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_DRUM_MACHINE "drum-machine"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_EQUALIZER of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_EQUALIZER "equalizer"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_EXPANDER of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_EXPANDER "expander"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_FILTER of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_FILTER "filter"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_FLANGER of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_FLANGER "flanger"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_FREQUENCY_SHIFTER of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_FREQUENCY_SHIFTER "frequency-shifter"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_GATE of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_GATE "gate"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_GLITCH of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_GLITCH "glitch"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_GRANULAR of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_GRANULAR "granular"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_INSTRUMENT of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_INSTRUMENT "instrument"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_LIMITER of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_LIMITER "limiter"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_MASTERING of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_MASTERING "mastering"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_MIXING of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_MIXING "mixing"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_MONO of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_MONO "mono"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_MULTI_EFFECTS of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_MULTI_EFFECTS "multi-effects"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_NOTE_DETECTOR of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_NOTE_DETECTOR "note-detector"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_NOTE_EFFECT of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_NOTE_EFFECT "note-effect"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_PHASE_VOCODER of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_PHASE_VOCODER "phase-vocoder"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_PHASER of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_PHASER "phaser"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_PITCH_CORRECTION of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_PITCH_CORRECTION "pitch-correction"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_PITCH_SHIFTER of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_PITCH_SHIFTER "pitch-shifter"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_RESTORATION of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_RESTORATION "restoration"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_REVERB of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_REVERB "reverb"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_SAMPLER of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_SAMPLER "sampler"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_STEREO of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_STEREO "stereo"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_SURROUND of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_SURROUND "surround"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_SYNTHESIZER of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_SYNTHESIZER "synthesizer"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_TRANSIENT_SHAPER of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_TRANSIENT_SHAPER "transient-shaper"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_TREMOLO of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_TREMOLO "tremolo"
/** The CLAP plugin-feature CLAP_PLUGIN_FEATURE_UTILITY of clap/plugin-features.h (clap 1.2.10); status used. */
#define OMX_CLAP_PLUGIN_FEATURE_UTILITY "utility"

/* CLAP numbers the headers declare */
/** The CLAP enum-value CLAP_REMOTE_CONTROLS_COUNT of clap/ext/remote-controls.h (clap 1.2.10); status used. */
#define OMX_CLAP_REMOTE_CONTROLS_COUNT 8u

/* The same identifiers as one list, for a reader that walks them: X(<identifier>, <string>) */
/** Every CLAP identifier above as X(<identifier>, <string>), in the same order, for a reader that walks them without typing the list again. */
#define OMX_CLAP_IDS(X) \
  X("CLAP_PORT_AMBISONIC", "ambisonic") \
  X("CLAP_EXT_AMBISONIC_COMPAT", "clap.ambisonic.draft/3") \
  X("CLAP_EXT_AMBISONIC", "clap.ambisonic/3") \
  X("CLAP_EXT_AUDIO_PORTS_ACTIVATION", "clap.audio-ports-activation/2") \
  X("CLAP_EXT_AUDIO_PORTS_ACTIVATION_COMPAT", "clap.audio-ports-activation/draft-2") \
  X("CLAP_EXT_AUDIO_PORTS_CONFIG", "clap.audio-ports-config") \
  X("CLAP_EXT_AUDIO_PORTS_CONFIG_INFO", "clap.audio-ports-config-info/1") \
  X("CLAP_EXT_AUDIO_PORTS_CONFIG_INFO_COMPAT", "clap.audio-ports-config-info/draft-0") \
  X("CLAP_EXT_AUDIO_PORTS", "clap.audio-ports") \
  X("CLAP_PORT_MONO", "mono") \
  X("CLAP_PORT_STEREO", "stereo") \
  X("CLAP_EXT_CONFIGURABLE_AUDIO_PORTS_COMPAT", "clap.configurable-audio-ports.draft1") \
  X("CLAP_EXT_CONFIGURABLE_AUDIO_PORTS", "clap.configurable-audio-ports/1") \
  X("CLAP_EXT_CONTEXT_MENU_COMPAT", "clap.context-menu.draft/0") \
  X("CLAP_EXT_CONTEXT_MENU", "clap.context-menu/1") \
  X("CLAP_EXT_BACKGROUND_ACTIVATION", "clap.background-activation/1") \
  X("CLAP_EXT_BACKGROUND_PROGRESS", "clap.background-progress/1") \
  X("CLAP_EXT_BACKGROUND_STATE_CONTEXT", "clap.background-state-context/1") \
  X("CLAP_EXT_EXTENSIBLE_AUDIO_PORTS", "clap.extensible-audio-ports/1") \
  X("CLAP_EXT_FLUSH_EVENTS", "clap.flush-events/1") \
  X("CLAP_EXT_GAIN_ADJUSTMENT_METERING", "clap.gain-adjustment-metering/0") \
  X("CLAP_EXT_MINI_CURVE_DISPLAY", "clap.mini-curve-display/3") \
  X("CLAP_EXT_OCTAVE_NUMBER", "clap.octave-number/1") \
  X("CLAP_EXT_PARAM_HOVERED", "clap.param-hovered/1") \
  X("CLAP_EXT_PARAMS_ORIGIN", "clap.params-origin/1") \
  X("CLAP_EXT_PROJECT_LOCATION", "clap.project-location/2") \
  X("CLAP_EXT_RESOURCE_DIRECTORY", "clap.resource-directory/1") \
  X("CLAP_EXT_SCRATCH_MEMORY", "clap.scratch-memory/1") \
  X("CLAP_EXT_TRANSPORT_CONTROL", "clap.transport-control/2") \
  X("CLAP_EXT_TRIGGERS", "clap.triggers/1") \
  X("CLAP_EXT_TUNING", "clap.tuning/2") \
  X("CLAP_EXT_UNDO", "clap.undo/4") \
  X("CLAP_EXT_UNDO_CONTEXT", "clap.undo_context/4") \
  X("CLAP_EXT_UNDO_DELTA", "clap.undo_delta/4") \
  X("CLAP_WINDOW_API_WEBVIEW", "webview") \
  X("CLAP_EXT_WEBVIEW", "clap.webview/3") \
  X("CLAP_EXT_EVENT_REGISTRY", "clap.event-registry") \
  X("CLAP_WINDOW_API_COCOA", "cocoa") \
  X("CLAP_EXT_GUI", "clap.gui") \
  X("CLAP_WINDOW_API_UIKIT", "uikit") \
  X("CLAP_WINDOW_API_WAYLAND", "wayland") \
  X("CLAP_WINDOW_API_WIN32", "win32") \
  X("CLAP_WINDOW_API_X11", "x11") \
  X("CLAP_EXT_LATENCY", "clap.latency") \
  X("CLAP_EXT_LOG", "clap.log") \
  X("CLAP_EXT_NOTE_NAME", "clap.note-name") \
  X("CLAP_EXT_NOTE_PORTS", "clap.note-ports") \
  X("CLAP_EXT_PARAM_INDICATION_COMPAT", "clap.param-indication.draft/4") \
  X("CLAP_EXT_PARAM_INDICATION", "clap.param-indication/4") \
  X("CLAP_EXT_PARAMS", "clap.params") \
  X("CLAP_EXT_POSIX_FD_SUPPORT", "clap.posix-fd-support") \
  X("CLAP_EXT_PRESET_LOAD_COMPAT", "clap.preset-load.draft/2") \
  X("CLAP_EXT_PRESET_LOAD", "clap.preset-load/2") \
  X("CLAP_EXT_REMOTE_CONTROLS_COMPAT", "clap.remote-controls.draft/2") \
  X("CLAP_EXT_REMOTE_CONTROLS", "clap.remote-controls/2") \
  X("CLAP_EXT_RENDER", "clap.render") \
  X("CLAP_EXT_STATE_CONTEXT", "clap.state-context/2") \
  X("CLAP_EXT_STATE", "clap.state") \
  X("CLAP_PORT_SURROUND", "surround") \
  X("CLAP_EXT_SURROUND_COMPAT", "clap.surround.draft/4") \
  X("CLAP_EXT_SURROUND", "clap.surround/4") \
  X("CLAP_EXT_TAIL", "clap.tail") \
  X("CLAP_EXT_THREAD_CHECK", "clap.thread-check") \
  X("CLAP_EXT_THREAD_POOL", "clap.thread-pool") \
  X("CLAP_EXT_TIMER_SUPPORT", "clap.timer-support") \
  X("CLAP_EXT_TRACK_INFO_COMPAT", "clap.track-info.draft/1") \
  X("CLAP_EXT_TRACK_INFO", "clap.track-info/1") \
  X("CLAP_EXT_VOICE_INFO", "clap.voice-info") \
  X("CLAP_PLUGIN_INVALIDATION_FACTORY_ID", "clap.plugin-invalidation-factory/1") \
  X("CLAP_PLUGIN_STATE_CONVERTER_FACTORY_ID", "clap.plugin-state-converter-factory/1") \
  X("CLAP_PLUGIN_FACTORY_ID", "clap.plugin-factory") \
  X("CLAP_PRESET_DISCOVERY_FACTORY_ID", "clap.preset-discovery-factory/2") \
  X("CLAP_PRESET_DISCOVERY_FACTORY_ID_COMPAT", "clap.preset-discovery-factory/draft-2") \
  X("CLAP_PLUGIN_FEATURE_AMBISONIC", "ambisonic") \
  X("CLAP_PLUGIN_FEATURE_ANALYZER", "analyzer") \
  X("CLAP_PLUGIN_FEATURE_AUDIO_EFFECT", "audio-effect") \
  X("CLAP_PLUGIN_FEATURE_CHORUS", "chorus") \
  X("CLAP_PLUGIN_FEATURE_COMPRESSOR", "compressor") \
  X("CLAP_PLUGIN_FEATURE_DEESSER", "de-esser") \
  X("CLAP_PLUGIN_FEATURE_DELAY", "delay") \
  X("CLAP_PLUGIN_FEATURE_DISTORTION", "distortion") \
  X("CLAP_PLUGIN_FEATURE_DRUM", "drum") \
  X("CLAP_PLUGIN_FEATURE_DRUM_MACHINE", "drum-machine") \
  X("CLAP_PLUGIN_FEATURE_EQUALIZER", "equalizer") \
  X("CLAP_PLUGIN_FEATURE_EXPANDER", "expander") \
  X("CLAP_PLUGIN_FEATURE_FILTER", "filter") \
  X("CLAP_PLUGIN_FEATURE_FLANGER", "flanger") \
  X("CLAP_PLUGIN_FEATURE_FREQUENCY_SHIFTER", "frequency-shifter") \
  X("CLAP_PLUGIN_FEATURE_GATE", "gate") \
  X("CLAP_PLUGIN_FEATURE_GLITCH", "glitch") \
  X("CLAP_PLUGIN_FEATURE_GRANULAR", "granular") \
  X("CLAP_PLUGIN_FEATURE_INSTRUMENT", "instrument") \
  X("CLAP_PLUGIN_FEATURE_LIMITER", "limiter") \
  X("CLAP_PLUGIN_FEATURE_MASTERING", "mastering") \
  X("CLAP_PLUGIN_FEATURE_MIXING", "mixing") \
  X("CLAP_PLUGIN_FEATURE_MONO", "mono") \
  X("CLAP_PLUGIN_FEATURE_MULTI_EFFECTS", "multi-effects") \
  X("CLAP_PLUGIN_FEATURE_NOTE_DETECTOR", "note-detector") \
  X("CLAP_PLUGIN_FEATURE_NOTE_EFFECT", "note-effect") \
  X("CLAP_PLUGIN_FEATURE_PHASE_VOCODER", "phase-vocoder") \
  X("CLAP_PLUGIN_FEATURE_PHASER", "phaser") \
  X("CLAP_PLUGIN_FEATURE_PITCH_CORRECTION", "pitch-correction") \
  X("CLAP_PLUGIN_FEATURE_PITCH_SHIFTER", "pitch-shifter") \
  X("CLAP_PLUGIN_FEATURE_RESTORATION", "restoration") \
  X("CLAP_PLUGIN_FEATURE_REVERB", "reverb") \
  X("CLAP_PLUGIN_FEATURE_SAMPLER", "sampler") \
  X("CLAP_PLUGIN_FEATURE_STEREO", "stereo") \
  X("CLAP_PLUGIN_FEATURE_SURROUND", "surround") \
  X("CLAP_PLUGIN_FEATURE_SYNTHESIZER", "synthesizer") \
  X("CLAP_PLUGIN_FEATURE_TRANSIENT_SHAPER", "transient-shaper") \
  X("CLAP_PLUGIN_FEATURE_TREMOLO", "tremolo") \
  X("CLAP_PLUGIN_FEATURE_UTILITY", "utility")

/* LV2 specifications: the URI, and the namespace every term of it is written after (the URI and a #) */
/** The URI of the LV2 specification ATOM (http://lv2plug.in/ns/ext/atom 2.4): what a bundle's manifest names. */
#define OMX_LV2_SPEC_ATOM "http://lv2plug.in/ns/ext/atom"
/** The namespace of ATOM: its URI and a #, every term of it written after. */
#define OMX_LV2_NS_ATOM "http://lv2plug.in/ns/ext/atom#"
/** The URI of the LV2 specification BUF_SIZE (http://lv2plug.in/ns/ext/buf-size 1.4): what a bundle's manifest names. */
#define OMX_LV2_SPEC_BUF_SIZE "http://lv2plug.in/ns/ext/buf-size"
/** The namespace of BUF_SIZE: its URI and a #, every term of it written after. */
#define OMX_LV2_NS_BUF_SIZE "http://lv2plug.in/ns/ext/buf-size#"
/** The URI of the LV2 specification CORE (http://lv2plug.in/ns/lv2core 18.6): what a bundle's manifest names. */
#define OMX_LV2_SPEC_CORE "http://lv2plug.in/ns/lv2core"
/** The namespace of CORE: its URI and a #, every term of it written after. */
#define OMX_LV2_NS_CORE "http://lv2plug.in/ns/lv2core#"
/** The URI of the LV2 specification DATA_ACCESS (http://lv2plug.in/ns/ext/data-access 1.6): what a bundle's manifest names. */
#define OMX_LV2_SPEC_DATA_ACCESS "http://lv2plug.in/ns/ext/data-access"
/** The namespace of DATA_ACCESS: its URI and a #, every term of it written after. */
#define OMX_LV2_NS_DATA_ACCESS "http://lv2plug.in/ns/ext/data-access#"
/** The URI of the LV2 specification DYNMANIFEST (http://lv2plug.in/ns/ext/dynmanifest 1.6): what a bundle's manifest names. */
#define OMX_LV2_SPEC_DYNMANIFEST "http://lv2plug.in/ns/ext/dynmanifest"
/** The namespace of DYNMANIFEST: its URI and a #, every term of it written after. */
#define OMX_LV2_NS_DYNMANIFEST "http://lv2plug.in/ns/ext/dynmanifest#"
/** The URI of the LV2 specification EVENT (http://lv2plug.in/ns/ext/event 1.14): what a bundle's manifest names. */
#define OMX_LV2_SPEC_EVENT "http://lv2plug.in/ns/ext/event"
/** The namespace of EVENT: its URI and a #, every term of it written after. */
#define OMX_LV2_NS_EVENT "http://lv2plug.in/ns/ext/event#"
/** The URI of the LV2 specification INSTANCE_ACCESS (http://lv2plug.in/ns/ext/instance-access 1.6): what a bundle's manifest names. */
#define OMX_LV2_SPEC_INSTANCE_ACCESS "http://lv2plug.in/ns/ext/instance-access"
/** The namespace of INSTANCE_ACCESS: its URI and a #, every term of it written after. */
#define OMX_LV2_NS_INSTANCE_ACCESS "http://lv2plug.in/ns/ext/instance-access#"
/** The URI of the LV2 specification LOG (http://lv2plug.in/ns/ext/log 2.4): what a bundle's manifest names. */
#define OMX_LV2_SPEC_LOG "http://lv2plug.in/ns/ext/log"
/** The namespace of LOG: its URI and a #, every term of it written after. */
#define OMX_LV2_NS_LOG "http://lv2plug.in/ns/ext/log#"
/** The URI of the LV2 specification MIDI (http://lv2plug.in/ns/ext/midi 1.10): what a bundle's manifest names. */
#define OMX_LV2_SPEC_MIDI "http://lv2plug.in/ns/ext/midi"
/** The namespace of MIDI: its URI and a #, every term of it written after. */
#define OMX_LV2_NS_MIDI "http://lv2plug.in/ns/ext/midi#"
/** The URI of the LV2 specification MORPH (http://lv2plug.in/ns/ext/morph 1.0): what a bundle's manifest names. */
#define OMX_LV2_SPEC_MORPH "http://lv2plug.in/ns/ext/morph"
/** The namespace of MORPH: its URI and a #, every term of it written after. */
#define OMX_LV2_NS_MORPH "http://lv2plug.in/ns/ext/morph#"
/** The URI of the LV2 specification OPTIONS (http://lv2plug.in/ns/ext/options 1.4): what a bundle's manifest names. */
#define OMX_LV2_SPEC_OPTIONS "http://lv2plug.in/ns/ext/options"
/** The namespace of OPTIONS: its URI and a #, every term of it written after. */
#define OMX_LV2_NS_OPTIONS "http://lv2plug.in/ns/ext/options#"
/** The URI of the LV2 specification PARAMETERS (http://lv2plug.in/ns/ext/parameters 1.4): what a bundle's manifest names. */
#define OMX_LV2_SPEC_PARAMETERS "http://lv2plug.in/ns/ext/parameters"
/** The namespace of PARAMETERS: its URI and a #, every term of it written after. */
#define OMX_LV2_NS_PARAMETERS "http://lv2plug.in/ns/ext/parameters#"
/** The URI of the LV2 specification PATCH (http://lv2plug.in/ns/ext/patch 2.10): what a bundle's manifest names. */
#define OMX_LV2_SPEC_PATCH "http://lv2plug.in/ns/ext/patch"
/** The namespace of PATCH: its URI and a #, every term of it written after. */
#define OMX_LV2_NS_PATCH "http://lv2plug.in/ns/ext/patch#"
/** The URI of the LV2 specification PORT_GROUPS (http://lv2plug.in/ns/ext/port-groups 1.4): what a bundle's manifest names. */
#define OMX_LV2_SPEC_PORT_GROUPS "http://lv2plug.in/ns/ext/port-groups"
/** The namespace of PORT_GROUPS: its URI and a #, every term of it written after. */
#define OMX_LV2_NS_PORT_GROUPS "http://lv2plug.in/ns/ext/port-groups#"
/** The URI of the LV2 specification PORT_PROPS (http://lv2plug.in/ns/ext/port-props 1.2): what a bundle's manifest names. */
#define OMX_LV2_SPEC_PORT_PROPS "http://lv2plug.in/ns/ext/port-props"
/** The namespace of PORT_PROPS: its URI and a #, every term of it written after. */
#define OMX_LV2_NS_PORT_PROPS "http://lv2plug.in/ns/ext/port-props#"
/** The URI of the LV2 specification PRESETS (http://lv2plug.in/ns/ext/presets 2.8): what a bundle's manifest names. */
#define OMX_LV2_SPEC_PRESETS "http://lv2plug.in/ns/ext/presets"
/** The namespace of PRESETS: its URI and a #, every term of it written after. */
#define OMX_LV2_NS_PRESETS "http://lv2plug.in/ns/ext/presets#"
/** The URI of the LV2 specification RESIZE_PORT (http://lv2plug.in/ns/ext/resize-port 1.0): what a bundle's manifest names. */
#define OMX_LV2_SPEC_RESIZE_PORT "http://lv2plug.in/ns/ext/resize-port"
/** The namespace of RESIZE_PORT: its URI and a #, every term of it written after. */
#define OMX_LV2_NS_RESIZE_PORT "http://lv2plug.in/ns/ext/resize-port#"
/** The URI of the LV2 specification STATE (http://lv2plug.in/ns/ext/state 2.10): what a bundle's manifest names. */
#define OMX_LV2_SPEC_STATE "http://lv2plug.in/ns/ext/state"
/** The namespace of STATE: its URI and a #, every term of it written after. */
#define OMX_LV2_NS_STATE "http://lv2plug.in/ns/ext/state#"
/** The URI of the LV2 specification TIME (http://lv2plug.in/ns/ext/time 1.6): what a bundle's manifest names. */
#define OMX_LV2_SPEC_TIME "http://lv2plug.in/ns/ext/time"
/** The namespace of TIME: its URI and a #, every term of it written after. */
#define OMX_LV2_NS_TIME "http://lv2plug.in/ns/ext/time#"
/** The URI of the LV2 specification UI (http://lv2plug.in/ns/extensions/ui 2.24): what a bundle's manifest names. */
#define OMX_LV2_SPEC_UI "http://lv2plug.in/ns/extensions/ui"
/** The namespace of UI: its URI and a #, every term of it written after. */
#define OMX_LV2_NS_UI "http://lv2plug.in/ns/extensions/ui#"
/** The URI of the LV2 specification UNITS (http://lv2plug.in/ns/extensions/units 5.12): what a bundle's manifest names. */
#define OMX_LV2_SPEC_UNITS "http://lv2plug.in/ns/extensions/units"
/** The namespace of UNITS: its URI and a #, every term of it written after. */
#define OMX_LV2_NS_UNITS "http://lv2plug.in/ns/extensions/units#"
/** The URI of the LV2 specification URI_MAP (http://lv2plug.in/ns/ext/uri-map 1.6): what a bundle's manifest names. */
#define OMX_LV2_SPEC_URI_MAP "http://lv2plug.in/ns/ext/uri-map"
/** The namespace of URI_MAP: its URI and a #, every term of it written after. */
#define OMX_LV2_NS_URI_MAP "http://lv2plug.in/ns/ext/uri-map#"
/** The URI of the LV2 specification URID (http://lv2plug.in/ns/ext/urid 1.4): what a bundle's manifest names. */
#define OMX_LV2_SPEC_URID "http://lv2plug.in/ns/ext/urid"
/** The namespace of URID: its URI and a #, every term of it written after. */
#define OMX_LV2_NS_URID "http://lv2plug.in/ns/ext/urid#"
/** The URI of the LV2 specification WORKER (http://lv2plug.in/ns/ext/worker 1.2): what a bundle's manifest names. */
#define OMX_LV2_SPEC_WORKER "http://lv2plug.in/ns/ext/worker"
/** The namespace of WORKER: its URI and a #, every term of it written after. */
#define OMX_LV2_NS_WORKER "http://lv2plug.in/ns/ext/worker#"

#endif /* OMX_FORMATS_H */
