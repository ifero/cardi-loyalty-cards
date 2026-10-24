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

WHERE EACH INPUT COMES FROM

  - The drawings: the <template> SVGs in onboarding-illustrations.source.html, the
    markup of the Design canvas the set was adopted on.
  - The motion: that file's CSS keyframes, restated per property in `motion()`. The
    CSS is the reference; change both together.
  - The mark: assets/images/cardi-mark-inline.svg, which `yarn icons:build` writes from
    the one geometry the app icon and the launch screen share. It is READ, never
    transcribed, so the intro cannot drift from the mark the app ships.

THE RULES THE SET WAS ADOPTED WITH

  Every animation plays once and rests on exactly the static drawing, so Reduce Motion
  shows the last frame and loses nothing. The beam never fades: it cuts on, then draws,
  sweeps or scales. A scan beam appears full width and sweeps top to bottom.

RENDERER SUBSET

  Only what lottie-ios and lottie-android both draw: one shape layer per file; groups;
  rect, ellipse and path shapes; solid fills; strokes, dashed or not; trim paths; group
  transforms; eased and hold keyframes. No masks, mattes, expressions, images or text.
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
OUT = REPO / "assets" / "animations" / "onboarding"

FPS = 60
CYCLE_S = 6.0  # the canvas authors every animation in % of one 6 s cycle

# cubic-bezier(.22,.8,.24,1), the canvas's one easing, as Lottie out/in tangents.
EASE_OUT = {"x": [0.22], "y": [0.8]}
EASE_IN = {"x": [0.24], "y": [1]}

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

# WelcomeScreen draws the mark as <BrandedIcon size={100} iconSize={34} />: an ink
# field 100 across with the mark fitted into a 34 box at its centre. The intro is a
# drop-in for that view.
MARK_FIELD = 100
MARK_ICON_SIZE = 34
MARK_END = 14


# ---- keyframes ---------------------------------------------------------------

def frame(pct):
    """% of the 6 s cycle -> frame number."""
    return round(pct / 100 * CYCLE_S * FPS, 2)


def color(hex_color):
    h = hex_color.lstrip("#")
    return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)] + [1]


def static(value):
    return {"a": 0, "k": value}


def animated(points, hold=False):
    """[(pct, value), ...] -> an animated property, eased like the canvas or held."""
    keys = []
    for n, (pct, value) in enumerate(points):
        key = {"t": frame(pct), "s": value if isinstance(value, list) else [value]}
        if n < len(points) - 1:
            if hold:
                key["h"] = 1
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

TOKEN = re.compile(r"[MmLlHhVvCcZz]|-?\d*\.?\d+(?:e-?\d+)?")


def parse_path(d):
    """An SVG path (M L H V C Z, absolute or relative) -> Lottie `sh` shapes, one per subpath."""
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


def read_mark(path):
    """The shipped mark's bars and beam, in its own viewBox units.

    Strict on purpose, like build-brand-icons.mjs: bare rounded rects for the bars and
    ONE rect turned about its own centre for the beam. Any other shape fails the
    build instead of being approximated.
    """
    root = ET.parse(path).getroot()
    _, _, vb_w, vb_h = (float(v) for v in root.get("viewBox").split())
    bars, beams = [], []
    for el in root:
        tag = el.tag.rsplit("}", 1)[-1]
        if tag == "rect":
            bars.append(read_rect(el))
            continue
        m = re.fullmatch(r"rotate\(([-\d.]+) ([-\d.]+) ([-\d.]+)\)", el.get("transform", ""))
        if tag != "g" or len(el) != 1 or not m:
            raise ValueError(f"{path.name}: unexpected <{tag}>; the mark is rects and one rotated beam")
        angle, px, py = map(float, m.groups())
        beam = read_rect(el[0])
        if math.dist((beam["x"] + beam["w"] / 2, beam["y"] + beam["h"] / 2), (px, py)) > 1e-3:
            raise ValueError(f"{path.name}: the beam must turn about its own centre")
        beams.append({**beam, "angle": angle, "pivot": (px, py)})
    if not bars or len(beams) != 1:
        raise ValueError(f"{path.name}: expected bars and exactly one beam")
    return (vb_w, vb_h), bars, beams[0]


def mark_intro(path):
    """Brand moment D, "scan, then settle", drawn on the real mark.

    The mark opens as a dotless ı of bars. The beam cuts on, full width, just above
    them, sweeps down to their foot, returns to the accent's centre and turns into
    the accent. Turning is all the settle needs: in the shipped mark the accent IS a
    beam laid across the bars, so the scan line and the accent are one shape and
    nothing hands over. The last frame is the static mark.
    """
    (vb_w, vb_h), bars, beam = read_mark(path)
    k = MARK_ICON_SIZE / max(vb_w, vb_h)
    offset = ((MARK_FIELD - vb_w * k) / 2, (MARK_FIELD - vb_h * k) / 2)

    px, py = beam["pivot"]
    above = min(b["y"] for b in bars) - beam["h"] / 2  # its lower edge on the bars' top
    foot = max(b["y"] + b["h"] for b in bars)          # centred on the bars' foot
    scan = transform(
        p=animated([(0, [px, above]), (1.1, [px, above]), (7, [px, foot]), (10, [px, py])]),
        a=(px, py),
        r=animated([(0, 0), (10, 0), (MARK_END, beam["angle"])]),
        o=animated([(0, 0), (1.1, 100)], hold=True))
    beam_group = group("beam", [rounded_rect(beam["x"], beam["y"], beam["w"], beam["h"], beam["rx"]),
                                fill(beam["fill"]), scan])
    bar_groups = [group(f"bar#{n + 1}", [rounded_rect(b["x"], b["y"], b["w"], b["h"], b["rx"]),
                                          fill(b["fill"]), transform()])
                  for n, b in enumerate(bars)]
    mark = group("mark", [beam_group] + list(reversed(bar_groups))
                 + [transform(p=offset, s=(k * 100, k * 100))])
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
    files["cardi-mark-intro.json"] = dump(mark_intro(MARK))
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
