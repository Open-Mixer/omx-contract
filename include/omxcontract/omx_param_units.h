/* SPDX-License-Identifier: GPL-3.0-or-later */
/*
 * This file is part of omx-contract.
 *
 * omx-contract is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * omx-contract is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with omx-contract.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
 */

#ifndef OMX_PARAM_UNITS_H
#define OMX_PARAM_UNITS_H
/*
 * GENERATED: DO NOT EDIT BY HAND.
 * Rendered from OMX_PARAM_CONTRACT_UNITS of data/param-contract.json: the unit codes of org.openmixer.param-contract/1.
 * A plugin includes this header for the codes its get() reports; omx-panel and plugin-hostd read the same item as data.
 */

/** @file
 * @brief The unit codes of the parameter contract extension, one OMX_CLAP_UNIT_ define per token. */

/** the unit of a parameter's plain value: 0..24 the LV2 units one to one, 0x100 and up the vendor block */
#define OMX_CLAP_UNIT_NONE 0u ///< no unit: a plain number, a switch, an index
#define OMX_CLAP_UNIT_S 1u ///< seconds
#define OMX_CLAP_UNIT_MS 2u ///< milliseconds
#define OMX_CLAP_UNIT_MIN 3u ///< minutes
#define OMX_CLAP_UNIT_BAR 4u ///< bars of the transport
#define OMX_CLAP_UNIT_BEAT 5u ///< beats of the transport
#define OMX_CLAP_UNIT_FRAME 6u ///< audio frames (samples) at the running rate
#define OMX_CLAP_UNIT_M 7u ///< metres
#define OMX_CLAP_UNIT_CM 8u ///< centimetres
#define OMX_CLAP_UNIT_MM 9u ///< millimetres
#define OMX_CLAP_UNIT_KM 10u ///< kilometres
#define OMX_CLAP_UNIT_INCH 11u ///< inches
#define OMX_CLAP_UNIT_MILE 12u ///< miles
#define OMX_CLAP_UNIT_DB 13u ///< decibels, a relative level or a gain
#define OMX_CLAP_UNIT_PC 14u ///< percent
#define OMX_CLAP_UNIT_COEF 15u ///< a coefficient, a plain multiplier (1 is unity)
#define OMX_CLAP_UNIT_HZ 16u ///< hertz
#define OMX_CLAP_UNIT_KHZ 17u ///< kilohertz
#define OMX_CLAP_UNIT_MHZ 18u ///< megahertz
#define OMX_CLAP_UNIT_BPM 19u ///< beats per minute
#define OMX_CLAP_UNIT_OCT 20u ///< octaves
#define OMX_CLAP_UNIT_CENT 21u ///< cents, hundredths of a semitone
#define OMX_CLAP_UNIT_SEMITONE12_TET 22u ///< semitones of twelve-tone equal temperament
#define OMX_CLAP_UNIT_DEGREE 23u ///< degrees of arc or of phase
#define OMX_CLAP_UNIT_MIDI_NOTE 24u ///< a MIDI note number, 0 to 127
#define OMX_CLAP_UNIT_DBFS 256u ///< decibels relative to full scale, 0 the largest sample, a level (vendor block)
#define OMX_CLAP_UNIT_DBU 257u ///< decibels relative to 0.775 V RMS, an analogue level (vendor block)
#define OMX_CLAP_UNIT_RATIO 258u ///< a ratio, n to 1, as a compressor states it (vendor block)
#define OMX_CLAP_UNIT_LUFS 259u ///< loudness units relative to full scale, ITU-R BS.1770 (vendor block)
#define OMX_CLAP_UNIT_DB_PER_OCT 260u ///< decibels per octave, a filter slope (vendor block)
#define OMX_CLAP_UNIT_DB_PER_S 261u ///< decibels per second, a rate of level change (vendor block)
#define OMX_CLAP_UNIT_DBTP 262u ///< decibels relative to full scale, true peak, ITU-R BS.1770 (vendor block)
#define OMX_CLAP_UNIT_LU 263u ///< loudness units, a loudness difference, ITU-R BS.1770 (vendor block)

/** every field of the sheet as X(value, "field"), in its declared order, for a table a consumer builds at run time */
#define OMX_PARAM_UNITS(X) \
    X(0u, "none") X(1u, "s") X(2u, "ms") X(3u, "min") X(4u, "bar") X(5u, "beat") \
    X(6u, "frame") X(7u, "m") X(8u, "cm") X(9u, "mm") X(10u, "km") X(11u, "inch") \
    X(12u, "mile") X(13u, "db") X(14u, "pc") X(15u, "coef") X(16u, "hz") X(17u, "khz") \
    X(18u, "mhz") X(19u, "bpm") X(20u, "oct") X(21u, "cent") X(22u, "semitone12TET") X(23u, "degree") \
    X(24u, "midiNote") X(256u, "dbfs") X(257u, "dbu") X(258u, "ratio") X(259u, "lufs") X(260u, "dbPerOct") \
    X(261u, "dbPerS") X(262u, "dbtp") X(263u, "lu")

#endif /* OMX_PARAM_UNITS_H */
