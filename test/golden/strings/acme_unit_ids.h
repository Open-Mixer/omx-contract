/* SPDX-License-Identifier: GPL-3.0-or-later */
/*
 * This file is part of acme-core.
 *
 * acme-core is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * acme-core is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with acme-core.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
 */

#ifndef ACME_UNIT_IDS_H
#define ACME_UNIT_IDS_H
/*
 * GENERATED: DO NOT EDIT BY HAND.
 * Rendered from ACME_UNIT_IDS of acme-unit-ids.json: the standard unit id of each acme unit code.
 */

/** @file
 * @brief The standard unit id of each acme unit code, as one X-macro over the ACME_UNIT_ defines of acme_units.h. */

/** every token as X(code define, "token", "standard id"), in the sheet's order */
#define ACME_UNIT_IDS(X) \
    X(ACME_UNIT_NONE, "none", "none") \
    X(ACME_UNIT_DB, "db", "dB") \
    X(ACME_UNIT_PC, "pc", "percent") \
    X(ACME_UNIT_SEMITONE12_TET, "semitone12TET", "st") \
    X(ACME_UNIT_DEGREE, "degree", "deg") \
    X(ACME_UNIT_DB_PER_OCT, "dbPerOct", "dBPerOct")

#endif /* ACME_UNIT_IDS_H */
