# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
"""The position law of PARAM_SCALES as a position `p` (0 at a travel's min, 1 at its max), the Python twin of
lib/scale.mjs (docs/scale-position.md, omx-contract#20): a Python surface such as Zynthian
(zyngine/zynthian_position_law.py) calls LAWS, effective_law, scale_position and scale_value instead of restating
the law; both readers are held to the same data/scale-vectors.json.

- linear: p = (v - min) / (max - min).
- log: p = ln(v / min) / ln(max / min), over a positive floor min. A log travel whose floor is not positive has no
  logarithm: it is served linear (the validator drops an override entry that asks for one,
  contract.override.scale-floor is its code).
- stepped: p = k / (n - 1), k the step's index and n the number of steps, n = (max - min) / step + 1.
- map, the override module's table: linear between its points, a list of [plain value, quantity]. The position is
  the plain value's, linear over the first and last point; the value is the quantity.

A word's law is not overridable per control. Nothing is clamped: a value outside the travel has a position outside
0..1, and the ends are exact.
"""
import math

LAWS = ("linear", "log", "stepped", "map")


def _is_num(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x)


def _round(x):
    """Round half away from zero, the way JS Math.round rounds (Python's round() rounds half to even)."""
    return math.floor(x + 0.5) if x >= 0 else -math.floor(-x + 0.5)


def effective_law(travel):
    """The word whose law serves `travel`: log over a floor that is not positive is linear, unknown is linear."""
    if not isinstance(travel, dict):
        raise ValueError("a travel is an object")
    word = travel.get("scale", "linear")
    if word == "unknown":
        return "linear"
    if word not in LAWS:
        raise ValueError("no position law for the scale %r" % (word,))
    if word == "log":
        lo = travel.get("min")
        if not (_is_num(lo) and lo > 0):
            return "linear"
    return word


def _points_of(travel):
    pts = travel.get("points")
    if not isinstance(pts, list) or len(pts) < 2 or not all(
        isinstance(p, (list, tuple)) and len(p) == 2 and _is_num(p[0]) and _is_num(p[1]) for p in pts
    ):
        raise ValueError("a map travel carries at least two [plain value, quantity] points")
    return pts


def _ends_of(travel, law):
    if law == "map":
        pts = _points_of(travel)
        lo, hi = pts[0][0], pts[-1][0]
    else:
        lo, hi = travel.get("min"), travel.get("max")
    if not _is_num(lo) or not _is_num(hi) or not (hi > lo):
        raise ValueError("a travel runs upward from its min to its max, not %r to %r" % (lo, hi))
    return lo, hi


def _steps_of(travel, lo, hi):
    step = travel.get("step")
    if not (_is_num(step) and step > 0):
        raise ValueError("a stepped travel states a positive step")
    n = _round((hi - lo) / step) + 1
    if n < 2:
        raise ValueError("a stepped travel has at least two steps")
    return n


def _piece(pts, column, x):
    """The piece of `pts` that holds `x` on its `column` (0 plain, 1 quantity); the end pieces extend outward."""
    direction = 1 if pts[-1][column] > pts[0][column] else -1
    i = 0
    while i < len(pts) - 2 and (x - pts[i + 1][column]) * direction > 0:
        i += 1
    return pts[i], pts[i + 1]


def scale_position(travel, value):
    """The position of `value` on `travel` ({scale, min, max, step?} or {scale: 'map', points})."""
    law = effective_law(travel)
    if law == "map":
        pts = _points_of(travel)
        lo, hi = _ends_of(travel, law)
        a, b = _piece(pts, 1, value)
        plain = a[0] + ((value - a[1]) / (b[1] - a[1])) * (b[0] - a[0])
        return (plain - lo) / (hi - lo)
    lo, hi = _ends_of(travel, law)
    if value == lo:
        return 0
    if value == hi:
        return 1
    if law == "log":
        return math.log(value / lo) / math.log(hi / lo)
    if law == "stepped":
        n = _steps_of(travel, lo, hi)
        k = min(n - 1, max(0, _round((value - lo) / travel["step"])))
        return k / (n - 1)
    return (value - lo) / (hi - lo)


def scale_value(travel, p):
    """The value at position `p` on `travel`: the inverse of scale_position (a stepped one lands on the nearest
    step)."""
    law = effective_law(travel)
    lo, hi = _ends_of(travel, law)
    if law == "map":
        pts = _points_of(travel)
        plain = lo + p * (hi - lo)
        a, b = _piece(pts, 0, plain)
        if plain == lo:
            return a[1]
        if plain == hi:
            return b[1]
        return a[1] + ((plain - a[0]) / (b[0] - a[0])) * (b[1] - a[1])
    if p == 0:
        return lo
    if p == 1:
        return hi
    if law == "log":
        return lo * math.pow(hi / lo, p)
    if law == "stepped":
        n = _steps_of(travel, lo, hi)
        k = min(n - 1, max(0, _round(p * (n - 1))))
        return lo + k * travel["step"]
    return lo + p * (hi - lo)
