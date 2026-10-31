"""Build the Cardì onboarding animations as Lottie JSON, for lottie-react-native.

    python3 docs/design/cardi/lottie/build-onboarding-lottie.py           write them
    python3 docs/design/cardi/lottie/build-onboarding-lottie.py --check   exit 1 if any is stale

Stdlib only. It lives here and not in `tools/` because `verify.py` runs every script
in `tools/` as a FRAME generator, and this one writes animations.

WHAT IT WRITES, into assets/animations/onboarding/

    onboarding-welcome-{light,dark}.json          280x190   2.70 s
    onboarding-all-your-cards-{light,dark}.json   280x190   2.10 s
    onboarding-scan-or-type-{light,dark}.json     280x190   2.46 s
    onboarding-your-data-{light,dark}.json        280x190   2.22 s
    cardi-mark-intro.json                         100x100   0.84 s, one file for both schemes

  The last is brand moment D on the Tessera mark: the stem alone, a beam as wide as the
  card sweeping it top to bottom and drawing it in, then the card turning past the grave
  and settling on it (Story 20.6). `mark_intro()` has the detail.

WHERE EACH INPUT COMES FROM

  - The drawings: the <template> SVGs in onboarding-illustrations.source.html, the
    markup of the Design canvas the set was adopted on.
  - The motion: that file's CSS keyframes, restated per property in `motion()`. The
    CSS is the reference; change both together.
  - The mark: assets/images/cardi-mark-inline.svg, which `yarn icons:build` writes from
    the one geometry the app icon and the launch screen share. It is READ, never
    transcribed, so the intro cannot drift from the mark the app ships: one stem rect and
    one even-odd card path turned about the card's centre, the card's subpath first and
    then its bars. Anything else raises rather than being approximated.
  - The mark's size in its field: the app icon's, assets/images/cardi-mark.svg, written
    from that same geometry and READ the same way.

THE RULES THE SET WAS ADOPTED WITH

  Every animation plays once and rests on exactly the static drawing, so Reduce Motion
  shows the last frame and loses nothing. The beam never fades: it cuts on, then draws,
  sweeps or scales. A scan beam appears full width and sweeps top to bottom.

RENDERER SUBSET

  Only what lottie-ios and lottie-android both draw: one shape layer per file; groups;
  rect, ellipse and path shapes; solid fills; strokes, dashed or not; trim paths; group
  transforms; eased, linear and hold keyframes. No masks, mattes, expressions, images or
  text.
"""
import argparse
import json
import math
import pathlib
import re
import sys
import xml.etree.ElementTree as ET

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[3]
SOURCE = HERE / "onboarding-illustrations.source.html"
MARK = REPO / "assets" / "images" / "cardi-mark-inline.svg"
ICON = REPO / "assets" / "images" / "cardi-mark.svg"
OUT = REPO / "assets" / "animations" / "onboarding"

FPS = 60
CYCLE_S = 6.0  # the canvas authors every animation in % of one 6 s cycle

# cubic-bezier(.22,.8,.24,1), the canvas's one easing, as Lottie out/in tangents.
EASE_OUT = {"x": [0.22], "y": [0.8]}
EASE_IN = {"x": [0.24], "y": [1]}
# A steady pace, for the scan: the tangents on the straight line from (0, 0) to (1, 1).
LINEAR_OUT = {"x": [0], "y": [0]}
LINEAR_IN = {"x": [1], "y": [1]}

INK, BEAM, CREAM, BLACK = "#181824", "#FCCC0C", "#F0F0E8", "#000000"

LIGHT_WIDTHS = {"base": 3, "t": 2, "m": 2.5, "gl": 2.5, "st": 1.5, "dot": 2.5, "ds5": 2, "bf": 2}

# Dark is the adopted rule, not a second drawing: cream lines on black, the beam
# unchanged, every stroke 0.25 lighter. Ground fills go black, never ink, so a dark
# drawing stays two-tone plus the beam.
THEMES = {
    "light": {"line": INK, "ground": CREAM, "widths": LIGHT_WIDTHS},
    "dark": {"line": CREAM, "ground": BLACK,
             "widths": {k: w - 0.25 for k, w in LIGHT_WIDTHS.items()}},
}

# (template id, file stem, % of the cycle at which the last property settles)
ILLUSTRATIONS = [
    ("w", "onboarding-welcome", 45),
    ("h1", "onboarding-all-your-cards", 35),
    ("h2", "onboarding-scan-or-type", 41),
    ("h3", "onboarding-your-data", 37),
]

# The intro is an ink field 100 across with the mark centred in it at the app icon's
# proportion (Story 22.10, decision 6): the mark's box takes the share of the field
# that it takes of the icon's, 735.70 of 1024 for the Tessera mark, so 71.8 here.
# `icon_share()` reads it from the icon, so it follows the mark. (The adopted intro
# copied the old <BrandedIcon iconSize={34} />, where the mark was a stub in its disc.)
MARK_FIELD = 100
MARK_END = 14

# Brand moment D's scan, in fractions of the card's height (Story 20.6): the beam is 18
# of the card's 166 thick, and reaches 34 of them past each side of the card.
SCAN_WEIGHT = 18 / 166
SCAN_OVERHANG = 34 / 166
# Its keyframes, in % of the 6 s cycle: the beam cuts on above the card, sweeps it at a
# steady pace and cuts off below it; then the card turns past the angle and settles.
SCAN_ON, SCAN_OFF = 2, 8.333
TURN_FROM, TURN_TO, OVERSHOOT = 9, 12.333, 3.5


# ---- keyframes ---------------------------------------------------------------

def frame(pct):
    """% of the 6 s cycle -> frame number."""
    return round(pct / 100 * CYCLE_S * FPS, 2)


def color(hex_color):
    h = hex_color.lstrip("#")
    return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)] + [1]


def static(value):
    return {"a": 0, "k": value}


def animated(points, hold=False, linear=False):
    """[(pct, value), ...] -> an animated property, eased like the canvas, linear or held."""
    keys = []
    for n, (pct, value) in enumerate(points):
        key = {"t": frame(pct), "s": value if isinstance(value, list) else [value]}
        if n < len(points) - 1:
            if hold:
                key["h"] = 1
            elif linear:
                key["o"], key["i"] = LINEAR_OUT, LINEAR_IN
            else:
                key["o"], key["i"] = EASE_OUT, EASE_IN
        keys.append(key)
    return {"a": 1, "k": keys}


def transform(p=(0, 0), a=(0, 0), s=(100, 100), r=0, o=100):
    def prop(v):
        return v if isinstance(v, dict) else static(list(v) if isinstance(v, tuple) else v)
    return {"ty": "tr", "p": prop(p), "a": prop(a), "s": prop(s), "r": prop(r),
            "o": prop(o), "sk": static(0), "sa": static(0), "nm": "Transform"}


def group(name, items):
    return {"ty": "gr", "nm": name, "it": items}


# ---- SVG geometry -> Lottie shapes -------------------------------------------

TOKEN = re.compile(r"[MmLlHhVvCcAaZz]|-?\d*\.?\d+(?:e-?\d+)?")


def arc_segments(start, r, large, sweep, end):
    """A CIRCULAR SVG arc -> cubic Béziers [(handle out, handle in, end point), ...].

    The centre comes from SVG 1.1's endpoint parameterisation (F.6.5) with one radius and
    no rotation, and a radius too short to span the endpoints grows until it does (F.6.6).
    The arc is cut into pieces of at most 90°, each the standard cubic for a circular arc:
    handles 4/3 tan(θ/4) of the radius long, along the tangents. Handles are rounded to
    four places, so the trigonometry's last bits never reach the committed JSON.
    """
    (x0, y0), (x, y) = start, end
    if math.dist(start, end) < 1e-9:
        return []
    if r == 0:
        return [(start, end, end)]  # SVG draws a zero-radius arc as a straight line
    hx, hy = (x0 - x) / 2, (y0 - y) / 2
    half = hx * hx + hy * hy
    r = max(abs(r), math.sqrt(half))
    k = math.sqrt(max(0.0, r * r - half) / half) * (-1 if large == sweep else 1)
    cx, cy = k * hy + (x0 + x) / 2, -k * hx + (y0 + y) / 2
    a0 = math.atan2(y0 - cy, x0 - cx)
    turn = math.atan2(y - cy, x - cx) - a0
    if sweep and turn < 0:
        turn += 2 * math.pi
    elif not sweep and turn > 0:
        turn -= 2 * math.pi
    pieces = max(1, math.ceil(abs(turn) / (math.pi / 2) - 1e-9))
    step = turn / pieces
    h = 4 / 3 * math.tan(step / 4) * r
    out = []
    for n in range(pieces):
        a1, a2 = a0 + step * n, a0 + step * (n + 1)
        p1 = (cx + r * math.cos(a1), cy + r * math.sin(a1)) if n else start
        p2 = (cx + r * math.cos(a2), cy + r * math.sin(a2)) if n < pieces - 1 else end
        c1 = (p1[0] - h * math.sin(a1), p1[1] + h * math.cos(a1))
        c2 = (p2[0] + h * math.sin(a2), p2[1] - h * math.cos(a2))
        out.append((tuple(round(v, 4) for v in c1), tuple(round(v, 4) for v in c2),
                    tuple(round(v, 4) for v in p2) if n < pieces - 1 else end))
    return out


def parse_path(d):
    """An SVG path (M L H V C A Z, absolute or relative) -> Lottie `sh` shapes, one per subpath.

    Arcs must be circular: an `A` whose two radii differ raises rather than being drawn as a
    circle it is not.
    """
    tokens = TOKEN.findall(d)
    i, cmd = 0, None
    subpaths, cur = [], None
    x = y = sx = sy = 0.0

    def num():
        nonlocal i
        i += 1
        return float(tokens[i - 1])

    while i < len(tokens):
        if re.match(r"[A-Za-z]", tokens[i]):
            cmd = tokens[i]
            i += 1
            if cmd in "Zz":
                if cur:
                    cur["closed"] = True
                x, y = sx, sy
                continue
        if cmd in "Mm":
            nx, ny = num(), num()
            if cmd == "m":
                nx, ny = nx + x, ny + y
            x, y = sx, sy = nx, ny
            cur = {"v": [[x, y]], "i": [[0, 0]], "o": [[0, 0]], "closed": False}
            subpaths.append(cur)
            cmd = "L" if cmd == "M" else "l"  # coordinates after a moveto are linetos
        elif cmd in "LlHhVv":
            if cmd == "L":
                x, y = num(), num()
            elif cmd == "l":
                x, y = x + num(), y + num()
            elif cmd == "H":
                x = num()
            elif cmd == "h":
                x += num()
            elif cmd == "V":
                y = num()
            else:
                y += num()
            cur["v"].append([x, y])
            cur["i"].append([0, 0])
            cur["o"].append([0, 0])
        elif cmd in "Cc":
            c = [num() for _ in range(6)]
            if cmd == "c":
                c = [c[0] + x, c[1] + y, c[2] + x, c[3] + y, c[4] + x, c[5] + y]
            cur["o"][-1] = [c[0] - x, c[1] - y]
            x, y = c[4], c[5]
            cur["v"].append([x, y])
            cur["i"].append([c[2] - x, c[3] - y])
            cur["o"].append([0, 0])
        elif cmd in "Aa":
            rx, ry, _rotation, large, sweep, ex, ey = (num() for _ in range(7))
            if abs(rx - ry) > 1e-9:
                raise ValueError(f"unsupported elliptical arc: radii {rx} and {ry} differ")
            if large not in (0, 1) or sweep not in (0, 1):
                raise ValueError(f"arc flags must be 0 or 1, got {large:g} and {sweep:g}")
            if cmd == "a":
                ex, ey = ex + x, ey + y
            for c1, c2, end in arc_segments((x, y), rx, int(large), int(sweep), (ex, ey)):
                cur["o"][-1] = [round(c1[0] - x, 4), round(c1[1] - y, 4)]
                x, y = end
                cur["v"].append([x, y])
                cur["i"].append([round(c2[0] - x, 4), round(c2[1] - y, 4)])
                cur["o"].append([0, 0])
        else:
            raise ValueError(f"unsupported path command {cmd}")

    shapes = []
    for sp in subpaths:
        v, ins, outs = sp["v"], sp["i"], sp["o"]
        # A closed path that returns to its start point: Lottie closes it itself.
        if sp["closed"] and len(v) > 1 and math.dist(v[-1], v[0]) < 1e-6:
            ins[0] = ins[-1]
            v, ins, outs = v[:-1], ins[:-1], outs[:-1]
        shapes.append({"ty": "sh", "nm": "Path",
                       "ks": static({"c": sp["closed"], "v": v, "i": ins, "o": outs})})
    return shapes


def path_length(d):
    """Arc length of a single-subpath `d`, for trim maths."""
    sh = parse_path(d)[0]["ks"]["k"]
    v, ins, outs = sh["v"], sh["i"], sh["o"]
    length = 0.0
    for k in range(len(v) - 1):
        p0, p3 = v[k], v[k + 1]
        p1 = [p0[0] + outs[k][0], p0[1] + outs[k][1]]
        p2 = [p3[0] + ins[k + 1][0], p3[1] + ins[k + 1][1]]
        prev = p0
        for n in range(1, 400):
            t = n / 399
            u = 1 - t
            pt = [u ** 3 * p0[j] + 3 * u * u * t * p1[j] + 3 * u * t * t * p2[j] + t ** 3 * p3[j]
                  for j in (0, 1)]
            length += math.dist(prev, pt)
            prev = pt
    return length


def rounded_rect(x, y, w, h, rx):
    return {"ty": "rc", "nm": "Rect", "p": static([x + w / 2, y + h / 2]),
            "s": static([w, h]), "r": static(rx)}


def stroke(hex_color, width, dash=None):
    s = {"ty": "st", "nm": "Stroke", "c": static(color(hex_color)), "o": static(100),
         "w": static(width), "lc": 2, "lj": 2, "ml": 4}
    if dash:
        s["d"] = [{"n": "d", "nm": "dash", "v": static(dash[0])},
                  {"n": "g", "nm": "gap", "v": static(dash[1])},
                  {"n": "o", "nm": "offset", "v": static(0)}]
    return s


def fill(hex_color):
    return {"ty": "fl", "nm": "Fill", "c": static(color(hex_color)), "o": static(100), "r": 1}


# ---- the illustrations' style classes ----------------------------------------

def style_for(classes, theme):
    """The source file's class cascade (ancestors first), resolved for one scheme."""
    t = THEMES[theme]
    w = t["widths"]
    style = {"stroke": t["line"], "width": w["base"], "fill": None, "dash": None}
    for c in classes:
        if c == "g":                   # ground: hides what is behind
            style["fill"] = t["ground"]
        elif c == "k":                 # barcode bars
            style["fill"], style["stroke"] = t["line"], None
        elif c in ("t", "m", "gl"):    # detail, small object, ground line
            style["width"] = w[c]
        elif c == "st":                # stitching
            style["width"], style["dash"] = w["st"], (3, 4)
        elif c == "bm":                # the beam as a stroke
            style["stroke"], style["width"] = BEAM, 4
        elif c == "bf":                # the beam as a fill
            style["fill"], style["width"] = BEAM, w["bf"]
        elif c == "dt":
            style["width"], style["dash"] = w["dot"], (0.1, 7)
        elif c == "dt6":
            style["width"], style["dash"] = w["dot"], (0.1, 6)
        elif c == "ds":
            style["width"], style["dash"] = w["dot"], (7, 6)
        elif c == "ds5":
            style["width"], style["dash"] = w["ds5"], (5, 5)
    return style


# ---- motion: the source file's keyframes, per animated class -------------------

def motion(cls, el):
    """(transform, extra shape items) for an element carrying motion class `cls`."""
    # Welcome waits for the mark. Brand moment D owns the first 0.84 s, the fan opens
    # at 0.9 s, and the beam cuts on only once the grip is set.
    if cls == "w-back":
        return transform(p=(140, 150), a=(140, 150),
                         r=animated([(0, -2), (15, -2), (28, -19)])), []
    if cls == "w-front":
        return transform(p=(140, 150), a=(140, 150),
                         r=animated([(0, -2), (15, -2), (28, 15)])), []
    if cls == "w-beam":
        return transform(p=animated([(0, [0, -9]), (32, [0, -9]), (40, [0, 9]), (45, [0, 0])]),
                         o=animated([(0, 0), (32, 100)], hold=True)), []

    if cls in ("h1-c1", "h1-c2", "h1-c3"):
        delay = {"h1-c1": 0, "h1-c2": 2, "h1-c3": 4}[cls]
        points = [(0, [0, 18])] + ([(delay, [0, 18])] if delay else []) + [(delay + 8, [0, 0])]
        return transform(p=animated(points)), []
    if cls == "h1-arc":
        return transform(o=animated([(0, 0), (8, 0), (20, 100)])), []
    if cls == "h1-fly":
        return transform(p=animated([(0, [-48, 36]), (9, [-48, 36]), (19, [-24, -4]), (27, [0, 0])]),
                         o=animated([(0, 0), (9, 0), (12, 100)])), []
    if cls == "h1-tile":
        cx = float(el.get("x")) + float(el.get("width")) / 2
        cy = float(el.get("y")) + float(el.get("height")) / 2
        return transform(p=(cx, cy), a=(cx, cy),
                         s=animated([(0, [0, 0]), (26, [0, 0]), (31, [110, 110]), (35, [100, 100])])), []

    if cls == "h2-phone":
        return transform(p=animated([(0, [110, 48]), (12, [110, 54])]), a=(110, 54),
                         r=animated([(0, -6), (12, 0)])), []
    if cls == "h2-sight":
        return transform(o=animated([(0, 0), (9, 0), (15, 100)])), []
    if cls == "h2-beam":
        return transform(p=animated([(0, [0, -9]), (15, [0, -9]), (26, [0, 9]), (32, [0, 0])]),
                         o=animated([(0, 0), (12, 100)], hold=True)), []
    if cls == "h2-hand":
        return transform(p=animated([(0, [0, 0]), (34, [0, 0]), (37, [0, 3]), (41, [0, 0])])), []

    if cls == "h3-arc":
        # The CSS draws the arc with a 224 dash and steps its offset so the line's
        # head stays with the card; a trim path does the same with lengths.
        length = path_length(el.get("d"))
        drawn = [(0, 0), (4, 0), (6, 224 - 195), (12, 224 - 157), (17, 224 - 123),
                 (22, 224 - 92), (30, length)]
        trim = {"ty": "tm", "nm": "Trim", "s": static(0), "o": static(0), "m": 1,
                "e": animated([(p, min(100, v / length * 100)) for p, v in drawn])}
        return transform(), [trim]
    if cls == "h3-card":
        return transform(p=animated([(0, [66, 114]), (4, [66, 114]), (12, [84, 81]),
                                     (17, [110, 59]), (22, [138, 44])]),
                         a=(138, 44),
                         r=animated([(0, -30), (4, -30), (12, -18), (17, -8), (22, 0)]),
                         o=animated([(0, 0), (4, 0), (6, 100)])), []
    if cls == "h3-ticks":
        return transform(o=animated([(0, 0), (21, 0), (27, 100)])), []
    if cls == "h3-slot":
        cx = float(el.get("x")) + float(el.get("width")) / 2
        cy = float(el.get("y")) + float(el.get("height")) / 2
        return transform(p=(cx, cy), a=(cx, cy),
                         s=animated([(0, [100, 100]), (29, [100, 100]), (32, [114, 114]),
                                     (37, [100, 100])])), []
    raise ValueError(f"no motion for {cls}")


MOTION_CLASSES = {"w-back", "w-front", "w-beam", "h1-c1", "h1-c2", "h1-c3", "h1-arc", "h1-fly",
                  "h1-tile", "h2-phone", "h2-sight", "h2-beam", "h2-hand", "h3-arc", "h3-card",
                  "h3-ticks", "h3-slot"}


def static_transform(el):
    t = el.get("transform")
    if not t:
        return transform()
    m = re.fullmatch(r"rotate\(([-\d.]+) ([-\d.]+) ([-\d.]+)\)", t)
    if m:
        angle, cx, cy = map(float, m.groups())
        return transform(p=(cx, cy), a=(cx, cy), r=angle)
    m = re.fullmatch(r"translate\(([-\d.]+) ([-\d.]+)\)", t)
    if m:
        return transform(p=tuple(map(float, m.groups())))
    raise ValueError(f"unsupported transform {t}")


def convert(el, theme, inherited, counter):
    """One SVG element -> one Lottie group, recursively."""
    tag = el.tag.rsplit("}", 1)[-1]
    classes = (el.get("class") or "").split()
    styles = inherited + [c for c in classes if c not in MOTION_CLASSES and c not in ("an", "il")]
    moving = [c for c in classes if c in MOTION_CLASSES]
    counter[0] += 1
    name = f"{moving[0] if moving else tag}#{counter[0]}"

    if moving and el.get("transform"):
        # The CSS would replace the attribute's transform, so the drawing would lie.
        raise ValueError("an animated element must not carry its own transform attribute")
    tr, extras = motion(moving[0], el) if moving else (static_transform(el), [])

    if tag == "g":
        kids = [convert(c, theme, styles, counter) for c in el]
        # Lottie paints earlier items on top; SVG paints later elements on top.
        return group(name, list(reversed(kids)) + [tr])

    if tag == "rect":
        x, y, w, h = (float(el.get(k, 0)) for k in ("x", "y", "width", "height"))
        shapes = [rounded_rect(x, y, w, h, float(el.get("rx", 0)))]
    elif tag == "circle":
        cx, cy, r = (float(el.get(k)) for k in ("cx", "cy", "r"))
        shapes = [{"ty": "el", "nm": "Ellipse", "p": static([cx, cy]), "s": static([2 * r, 2 * r])}]
    elif tag == "path":
        shapes = parse_path(el.get("d"))
    else:
        raise ValueError(f"unsupported element <{tag}>")

    style = style_for(styles, theme)
    paint = []
    if style["stroke"]:
        paint.append(stroke(style["stroke"], style["width"], style["dash"]))
    if style["fill"]:
        paint.append(fill(style["fill"]))
    # Stroke listed before fill, so the outline lies over the fill as it does in SVG.
    return group(name, shapes + extras + paint + [tr])


def composition(name, size, shapes, end_pct):
    """One shape layer that plays once and holds its last frame, the rest drawing."""
    out_frame = int(frame(end_pct)) + 2
    layer = {"ddd": 0, "ind": 1, "ty": 4, "nm": name, "sr": 1, "ao": 0, "bm": 0,
             "ks": {"o": static(100), "r": static(0), "p": static([0, 0, 0]),
                    "a": static([0, 0, 0]), "s": static([100, 100, 100])},
             "shapes": shapes, "ip": 0, "op": out_frame, "st": 0}
    return {"v": "5.7.4", "fr": FPS, "ip": 0, "op": out_frame, "w": size[0], "h": size[1],
            "nm": name, "ddd": 0, "assets": [], "layers": [layer], "markers": []}


def illustration(name, svg, theme, end_pct):
    counter = [0]
    shapes = [convert(el, theme, [], counter) for el in svg]
    return composition(name, (280, 190), list(reversed(shapes)), end_pct)


# ---- the mark -----------------------------------------------------------------

def read_rect(el):
    return {"x": float(el.get("x")), "y": float(el.get("y")), "w": float(el.get("width")),
            "h": float(el.get("height")), "rx": float(el.get("rx", 0)), "fill": el.get("fill")}


ROTATE = re.compile(r"rotate\(([-\d.]+) ([-\d.]+) ([-\d.]+)\)")


def read_mark(path):
    """The shipped mark's stem and card, in its own viewBox units: see `mark_from_svg`."""
    return mark_from_svg(ET.parse(path).getroot(), path.name)


def mark_from_svg(root, name):
    """((viewBox width, height), stem, card) from the root of a generated mark SVG.

    Strict on purpose, like build-brand-icons.mjs: ONE bare rounded rect for the stem, and
    ONE group turned about the card's centre holding ONE even-odd path, whose first subpath
    is the card and whose others are its bars, cut through it. Any other shape fails the
    build instead of being approximated.
    """
    _, _, vb_w, vb_h = (float(v) for v in root.get("viewBox").split())
    stems, cards = [], []
    for el in root:
        tag = el.tag.rsplit("}", 1)[-1]
        if tag == "rect":
            stems.append(read_rect(el))
            continue
        m = ROTATE.fullmatch(el.get("transform", ""))
        if tag != "g" or len(el) != 1 or not m or el[0].tag.rsplit("}", 1)[-1] != "path":
            raise ValueError(f"{name}: unexpected <{tag}>; the mark is a stem rect and one turned card path")
        path = el[0]
        if path.get("fill-rule") != "evenodd":
            raise ValueError(f'{name}: the card\'s bars must be holes, cut with fill-rule="evenodd"')
        shapes = parse_path(path.get("d"))
        if len(shapes) < 2 or not all(sh["ks"]["k"]["c"] for sh in shapes):
            raise ValueError(f"{name}: the card path must be closed subpaths, the card and then its bars")
        # The card's level box. Its subpath starts and ends every corner arc on an edge, so
        # its vertices span the box exactly.
        xs = [v[0] for v in shapes[0]["ks"]["k"]["v"]]
        ys = [v[1] for v in shapes[0]["ks"]["k"]["v"]]
        x, y, w, h = min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)
        angle, px, py = map(float, m.groups())
        # The vertices and the pivot are each rounded to 3 places, so their centres can
        # disagree by up to about 1.4e-3 on a correct card.
        if math.dist((x + w / 2, y + h / 2), (px, py)) > 2e-3:
            raise ValueError(f"{name}: the card must turn about its own centre")
        cards.append({"x": x, "y": y, "w": w, "h": h, "angle": angle, "pivot": (px, py),
                      "body": shapes[0], "bars": shapes[1:], "fill": path.get("fill")})
    if len(stems) != 1 or len(cards) != 1:
        raise ValueError(f"{name}: expected one stem and one card, got {len(stems)} and {len(cards)}")
    return (vb_w, vb_h), stems[0], cards[0]


def mark_box(stem, card):
    """The mark's bounding box, (width, height), in its own units.

    The stem, and the corners of the card's sharp rectangle turned about its centre: the
    extents build-brand-icons.mjs crops the inline mark's viewBox to.
    """
    xs = [stem["x"], stem["x"] + stem["w"]]
    ys = [stem["y"], stem["y"] + stem["h"]]
    a = math.radians(card["angle"])
    px, py = card["pivot"]
    for cx in (card["x"], card["x"] + card["w"]):
        for cy in (card["y"], card["y"] + card["h"]):
            dx, dy = cx - px, cy - py
            xs.append(px + dx * math.cos(a) - dy * math.sin(a))
            ys.append(py + dx * math.sin(a) + dy * math.cos(a))
    return max(xs) - min(xs), max(ys) - min(ys)


def icon_share(path):
    """The share of the app icon's field the mark's box takes along its longer side."""
    (vb_w, vb_h), stem, card = read_mark(path)
    return max(mark_box(stem, card)) / max(vb_w, vb_h)


def mark_intro(path, icon):
    """Brand moment D, "scan, then settle", drawn on the real mark (Story 20.6).

    The mark opens as the stem alone. A scan beam, as wide as the card and a little more,
    cuts on just above where the card lies LEVEL and sweeps down over it at a steady pace,
    drawing the card in behind it; it cuts off just below. Then the card turns past the
    grave's angle and settles on it. The last frame is the static mark.

    The card is drawn whole from frame 0, its bars painted ink because the disc behind them
    is always ink, and an ink cover hides it: the cover's top edge rides the beam's centre
    line down, so the card appears exactly where the beam has been. It is the subset's way to
    reveal a shape without a mask or a matte, and on the ink disc the cover cannot be seen.
    """
    (vb_w, vb_h), stem, card = read_mark(path)
    # The inline mark's viewBox is its box, so the box fills the icon's share of the field.
    k = icon_share(icon) * MARK_FIELD / max(vb_w, vb_h)
    offset = ((MARK_FIELD - vb_w * k) / 2, (MARK_FIELD - vb_h * k) / 2)

    px, py = card["pivot"]
    weight = card["h"] * SCAN_WEIGHT
    width = card["w"] + 2 * card["h"] * SCAN_OVERHANG
    above = card["y"] - weight / 2               # its lower edge on the card's top edge
    below = card["y"] + card["h"] + weight / 2   # its upper edge on the card's bottom edge
    sweep = [(0, above), (SCAN_ON, above), (SCAN_OFF, below)]

    beam = group("beam", [
        rounded_rect(-width / 2, -weight / 2, width, weight, weight / 2), fill(BEAM),
        transform(p=animated([(t, [px, y]) for t, y in sweep], linear=True),
                  o=animated([(0, 0), (SCAN_ON, 100), (SCAN_OFF, 0)], hold=True))])
    cover = group("cover", [
        {"ty": "rc", "nm": "Rect", "r": static(0),
         "p": animated([(t, [px, (y + below) / 2]) for t, y in sweep], linear=True),
         "s": animated([(t, [width, below - y]) for t, y in sweep], linear=True)},
        fill(INK), transform()])
    turned = group("card", [
        group("bars", card["bars"] + [fill(INK), transform()]),
        group("body", [card["body"], fill(card["fill"]), transform()]),
        transform(p=(px, py), a=(px, py),
                  r=animated([(0, 0), (TURN_FROM, 0), (TURN_TO, card["angle"] + OVERSHOOT),
                              (MARK_END, card["angle"])]))])
    stem_group = group("stem", [rounded_rect(stem["x"], stem["y"], stem["w"], stem["h"], stem["rx"]),
                                fill(stem["fill"]), transform()])
    # Lottie paints earlier items on top: the beam over the cover over the card.
    mark = group("mark", [beam, cover, turned, stem_group,
                          transform(p=offset, s=(k * 100, k * 100))])
    field = group("field", [{"ty": "el", "nm": "Ellipse", "p": static([MARK_FIELD / 2] * 2),
                             "s": static([MARK_FIELD] * 2)}, fill(INK), transform()])
    return composition("cardi-mark-intro", (MARK_FIELD, MARK_FIELD), [mark, field], MARK_END)


# ---- build ----------------------------------------------------------------------

def templates(html):
    # Prettier keeps the source's whitespace-sensitive layout by breaking tags before
    # their `>` (`<template id="w"\n  ><svg`), so allow whitespace there.
    return {tid: ET.fromstring(body.strip())
            for tid, body in re.findall(r'<template id="(\w+)"\s*>(.*?)</template\s*>', html, re.S)}


def dump(animation):
    return json.dumps(animation, separators=(",", ":")) + "\n"


def build():
    """Every file this script owns, as {file name: contents}."""
    drawings = templates(SOURCE.read_text(encoding="utf-8"))
    files = {}
    for tid, stem, end in ILLUSTRATIONS:
        for theme in THEMES:
            name = f"{stem}-{theme}"
            files[f"{name}.json"] = dump(illustration(name, drawings[tid], theme, end))
    files["cardi-mark-intro.json"] = dump(mark_intro(MARK, ICON))
    return files


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", action="store_true",
                        help="write nothing; exit 1 if a committed file differs from a fresh build")
    args = parser.parse_args()
    files = build()

    if args.check:
        stale = [name for name, text in files.items()
                 if not (OUT / name).is_file() or (OUT / name).read_text(encoding="utf-8") != text]
        extra = [p.name for p in sorted(OUT.glob("*.json")) if p.name not in files]
        for name in stale:
            print(f"STALE  {name}")
        for name in extra:
            print(f"EXTRA  {name}  (not built by this script)")
        print(f"{len(files) - len(stale)}/{len(files)} up to date")
        return 1 if stale or extra else 0

    OUT.mkdir(parents=True, exist_ok=True)
    for name, text in files.items():
        (OUT / name).write_text(text, encoding="utf-8")
        print(f"{OUT.relative_to(REPO) / name}  {len(text.encode()):>6} bytes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
