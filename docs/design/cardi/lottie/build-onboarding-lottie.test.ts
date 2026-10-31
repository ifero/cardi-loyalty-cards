/**
 * @jest-environment node
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { IDENTITY_COLORS } from '@/shared/theme/tokens.generated';

/**
 * `build-onboarding-lottie.py` and the one file of its output that is drawn from the mark:
 * brand moment D, `cardi-mark-intro.json` (Story 20.6).
 *
 * `--check` proves the committed JSON is the builder's output byte for byte. It cannot prove the
 * builder is RIGHT, because it would defend whatever the builder writes. These are the other half:
 * the arc maths the builder needs to read the Tessera mark, the strictness that stops it drawing a
 * shape it does not understand, and the two frames the motion rules pin — the first, before play,
 * and the last, which Reduce Motion shows instead of playing.
 *
 * WHY A SUBPROCESS: the builder is Python, so its functions are called in one `python3` child, the
 * pattern `scripts/lib/path-raster.test.js` uses for its Node module. Nothing below needs XML
 * parsing, so a `python3` whose `pyexpat` is broken still runs them. CI's quality-gates job already
 * needs `python3` for `yarn frames:check`.
 */

const REPO = path.resolve(__dirname, '../../../..');
const BUILDER = path.join(__dirname, 'build-onboarding-lottie.py');
const INTRO = path.join(REPO, 'assets/animations/onboarding/cardi-mark-intro.json');
const MARK = path.join(REPO, 'assets/images/cardi-mark-inline.svg');

/** Run `body` with the builder imported as `builder`; it prints one JSON value. */
const python = <T>(body: string): T => {
  const script = [
    'import importlib.util, json, math, sys',
    'spec = importlib.util.spec_from_file_location("builder", sys.argv[1])',
    'builder = importlib.util.module_from_spec(spec)',
    'spec.loader.exec_module(builder)',
    body
  ].join('\n');
  return JSON.parse(execFileSync('python3', ['-c', script, BUILDER], { encoding: 'utf8' })) as T;
};

type Shape = { v: number[][]; i: number[][]; o: number[][]; c: boolean };

/** One cubic piece of a Lottie path, as absolute control points. */
const piece = (shape: Shape, n: number) => {
  const next = (n + 1) % shape.v.length;
  const p0 = shape.v[n] ?? [0, 0];
  const p3 = shape.v[next] ?? [0, 0];
  const out = shape.o[n] ?? [0, 0];
  const into = shape.i[next] ?? [0, 0];
  return {
    p0,
    p1: [(p0[0] ?? 0) + (out[0] ?? 0), (p0[1] ?? 0) + (out[1] ?? 0)],
    p2: [(p3[0] ?? 0) + (into[0] ?? 0), (p3[1] ?? 0) + (into[1] ?? 0)],
    p3
  };
};

/** The point at `t` on a cubic piece. */
const pointAt = ({ p0, p1, p2, p3 }: ReturnType<typeof piece>, t: number) =>
  [0, 1].map((axis) => {
    const u = 1 - t;
    return (
      u ** 3 * (p0[axis] ?? 0) +
      3 * u * u * t * (p1[axis] ?? 0) +
      3 * u * t * t * (p2[axis] ?? 0) +
      t ** 3 * (p3[axis] ?? 0)
    );
  });

describe('build-onboarding-lottie.py', () => {
  describe('parse_path reads circular arcs (A, a)', () => {
    const paths = python<Record<string, { ks: { k: Shape } }[]>>(
      [
        'print(json.dumps({',
        '  "quarter": builder.parse_path("M0 0 A10 10 0 0 1 10 10"),',
        '  "relative": builder.parse_path("M0 0 a10 10 0 0 1 10 10"),',
        '  "half": builder.parse_path("M0 0 A10 10 0 0 1 20 0"),',
        '  "large": builder.parse_path("M0 0 A10 10 0 1 0 10 10"),',
        '  "card": builder.parse_path("M12 10 H38 A2 2 0 0 1 40 12 V28 A2 2 0 0 1 38 30 H12 ' +
          'A2 2 0 0 1 10 28 V12 A2 2 0 0 1 12 10 Z"),',
        '}))'
      ].join('\n')
    );
    const shape = (name: string): Shape => {
      const parsed = paths[name]?.[0]?.ks.k;
      if (!parsed) throw new Error(`no path parsed for ${name}`);
      return parsed;
    };

    it('draws a quarter arc as one cubic, its handles 4/3·tan(22.5°) of the radius along the tangents', () => {
      const quarter = shape('quarter');
      const handle = (4 / 3) * Math.tan(Math.PI / 8) * 10;
      expect(quarter.v).toEqual([
        [0, 0],
        [10, 10]
      ]);
      // Sweep 1 turns clockwise on screen: from the top of a circle centred on (0, 10), heading
      // right, into its right-hand side, heading down.
      expect(quarter.o[0]?.[0]).toBeCloseTo(handle, 3);
      expect(quarter.o[0]?.[1]).toBeCloseTo(0, 6);
      expect(quarter.i[1]?.[0]).toBeCloseTo(0, 6);
      expect(quarter.i[1]?.[1]).toBeCloseTo(-handle, 3);
    });

    it('reads a relative arc as the same arc', () => {
      expect(shape('relative')).toEqual(shape('quarter'));
    });

    it('cuts a longer arc into pieces of at most 90°, every one on the circle', () => {
      // Half a circle centred on (10, 0), and three quarters of one centred on (0, 10): the
      // large-arc flag with sweep 0 takes the long way round from (0, 0) to (10, 10).
      const cases: [string, number, number[]][] = [
        ['half', 2, [10, 0]],
        ['large', 3, [0, 10]]
      ];
      for (const [name, pieces, [cx = 0, cy = 0]] of cases) {
        const arc = shape(name);
        expect([name, arc.v.length - 1]).toEqual([name, pieces]);
        for (let n = 0; n < pieces; n += 1) {
          const [x = 0, y = 0] = pointAt(piece(arc, n), 0.5);
          expect(Math.hypot(x - cx, y - cy)).toBeCloseTo(10, 2);
        }
      }
    });

    it('closes a rounded rect of quarter arcs into one closed shape of eight vertices', () => {
      // The shape the generator writes for the card and each of its bars. Lottie closes the path
      // itself, so the vertex the last arc returns to is merged into the first.
      const card = shape('card');
      expect(card.c).toBe(true);
      expect(card.v).toHaveLength(8);
      expect(card.v[0]).toEqual([12, 10]);
      // The merged first vertex takes the closing arc's incoming handle.
      expect(card.i[0]?.[0]).toBeCloseTo(-(4 / 3) * Math.tan(Math.PI / 8) * 2, 3);
      // Every corner is a quarter circle of radius 2: its midpoint sits on it.
      const corners: [number, number[]][] = [
        [1, [38, 12]],
        [3, [38, 28]],
        [5, [12, 28]],
        [7, [12, 12]]
      ];
      for (const [n, [cx = 0, cy = 0]] of corners) {
        const [x = 0, y = 0] = pointAt(piece(card, n), 0.5);
        expect(Math.hypot(x - cx, y - cy)).toBeCloseTo(2, 3);
      }
    });

    it('refuses an elliptical arc rather than drawing a circle it is not', () => {
      const outcome = python<string>(
        [
          'try:',
          '    builder.parse_path("M0 0 A10 5 0 0 1 10 10")',
          '    print(json.dumps("drawn"))',
          'except ValueError as error:',
          '    print(json.dumps(str(error)))'
        ].join('\n')
      );
      expect(outcome).toMatch(/elliptical arc/);
    });
  });

  describe('the mark reader is strict', () => {
    // A stem rect and one turned, even-odd card path whose first subpath is the card and whose
    // others are its bars. The card (10..40, 10..30) turns about its own centre, (25, 20).
    const outcomes = python<Record<string, string>>(
      [
        'import xml.etree.ElementTree as ET',
        'CARD = "M12 10 H38 A2 2 0 0 1 40 12 V28 A2 2 0 0 1 38 30 H12 A2 2 0 0 1 10 28 V12 ' +
          'A2 2 0 0 1 12 10 Z M15 20 H17 V26 H15 Z"',
        'STEM = ("rect", {"x": "20", "y": "40", "width": "10", "height": "40", "rx": "5", ' +
          '"fill": "#F0F0E8"}, [])',
        'def card(transform="rotate(35 25 20)", **path):',
        '    attrs = {"fill-rule": "evenodd", "d": CARD, "fill": "#FCCC0C", **path}',
        '    return ("g", {"transform": transform}, [("path", {k: v for k, v in attrs.items() if v is not None})])',
        'def outcome(*children):',
        '    root = ET.Element("svg", viewBox="0 0 100 100")',
        '    for tag, attrs, kids in children:',
        '        el = ET.SubElement(root, tag, attrs)',
        '        for kid_tag, kid_attrs in kids:',
        '            ET.SubElement(el, kid_tag, kid_attrs)',
        '    try:',
        '        (w, h), stem, mark = builder.mark_from_svg(root, "case.svg")',
        "        return f\"ok {mark['x']:g} {mark['y']:g} {mark['w']:g} {mark['h']:g} {len(mark['bars'])} bars\"",
        '    except ValueError as error:',
        '        return f"ValueError: {error}"',
        'print(json.dumps({',
        '    "valid": outcome(STEM, card()),',
        '    "unknown shape": outcome(STEM, card(), ("circle", {"cx": "5", "cy": "5", "r": "5"}, [])),',
        '    "painted bars": outcome(STEM, card(**{"fill-rule": None})),',
        '    "no bars": outcome(STEM, card(d=CARD.split(" M15")[0])),',
        '    "off centre": outcome(STEM, card(transform="rotate(35 30 20)")),',
        '    "not a turn": outcome(STEM, card(transform="scale(2)")),',
        '    "two stems": outcome(STEM, STEM, card()),',
        '    "no card": outcome(STEM),',
        '}))'
      ].join('\n')
    );

    it('reads the card’s level box and its bars from the one path', () => {
      expect(outcomes.valid).toBe('ok 10 10 30 20 1 bars');
    });

    it.each([
      ['unknown shape', /unexpected <circle>/],
      ['painted bars', /must be holes/],
      ['no bars', /the card and then its bars/],
      ['off centre', /turn about its own centre/],
      ['not a turn', /unexpected <g>/],
      ['two stems', /one stem and one card/],
      ['no card', /one stem and one card/]
    ])('raises on %s instead of approximating it', (name, message) => {
      expect(outcomes[name]).toMatch(/^ValueError: /);
      expect(outcomes[name]).toMatch(message);
    });
  });
});

/** The intro, as far as these tests read it. */
type Property = { a: 0; k: number | number[] } | { a: 1; k: Keyframe[] };
type Tangent = { x: number[]; y: number[] };
type Keyframe = { t: number; s: number[]; h?: 1; o?: Tangent; i?: Tangent };
type Item = {
  ty: string;
  nm: string;
  it?: Item[];
  p?: Property;
  s?: Property;
  r?: Property;
  o?: Property;
  a?: Property;
  ks?: { k: Shape };
  c?: { k: number[] };
};

const intro = JSON.parse(fs.readFileSync(INTRO, 'utf8')) as {
  fr: number;
  ip: number;
  op: number;
  layers: { shapes: Item[]; masksProperties?: unknown; tt?: unknown; td?: unknown }[];
};

/** A property's value before play, and at rest. */
const first = (property?: Property): number[] => {
  if (!property) throw new Error('missing property');
  const value = property.a === 1 ? property.k[0]?.s : property.k;
  return Array.isArray(value) ? value : [value ?? NaN];
};
const last = (property?: Property): number[] => {
  if (!property) throw new Error('missing property');
  const value = property.a === 1 ? property.k[property.k.length - 1]?.s : property.k;
  return Array.isArray(value) ? value : [value ?? NaN];
};

const child = (parent: Item | undefined, name: string): Item => {
  const found = parent?.it?.find((item) => item.nm === name);
  if (!found) throw new Error(`no "${name}" in "${parent?.nm}"`);
  return found;
};
const typed = (parent: Item, ty: string): Item => {
  const found = parent.it?.find((item) => item.ty === ty);
  if (!found) throw new Error(`no ${ty} in "${parent.nm}"`);
  return found;
};

/** An animated property's keyframes; a static one has none. */
const keysOf = (property?: Property): Keyframe[] => (property?.a === 1 ? property.k : []);

/** `'#181824'` as a Lottie fill colour. */
const lottieColour = (hex: string) =>
  [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16) / 255).concat(1);

/** The level box a closed subpath's vertices span: every command ends on its edge. */
const boxOf = (points: number[][]) => {
  const xs = points.map(([x = 0]) => x);
  const ys = points.map(([, y = 0]) => y);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
};

/** The static mark, read from the SVG the intro is built from. */
const staticMark = () => {
  const svg = fs.readFileSync(MARK, 'utf8');
  const number = (pattern: RegExp) => Number(svg.match(pattern)?.[1]);
  const turn = svg.match(/rotate\(([\d.]+) ([\d.]+) ([\d.]+)\)/);
  // The card is the first subpath and its bars the rest. Every command in one ends on its
  // edge, so the endpoints span its level box: M and A end on a point, H on an x, V on a y.
  const subpaths = (svg.match(/ d="([^"]*)"/)?.[1] ?? '')
    .split('Z')
    .filter((subpath) => subpath.trim() !== '')
    .map((subpath) => {
      const points: number[][] = [];
      let at = [NaN, NaN];
      for (const [, command, args] of subpath.matchAll(/([MHVA])([^MHVAZ]*)/g)) {
        const values = (args ?? '').trim().split(/\s+/).map(Number);
        if (command === 'H') at = [values[0] ?? NaN, at[1] ?? NaN];
        else if (command === 'V') at = [at[0] ?? NaN, values[0] ?? NaN];
        else at = [values[values.length - 2] ?? NaN, values[values.length - 1] ?? NaN];
        points.push(at);
      }
      return boxOf(points);
    });
  const [card = boxOf([]), ...bars] = subpaths;
  return {
    stem: {
      x: number(/<rect x="([\d.]+)"/),
      y: number(/<rect x="[\d.]+" y="([\d.]+)"/),
      w: number(/<rect [^>]*width="([\d.]+)"/),
      h: number(/<rect [^>]*height="([\d.]+)"/),
      r: number(/<rect [^>]*rx="([\d.]+)"/)
    },
    angle: Number(turn?.[1]),
    pivot: [Number(turn?.[2]), Number(turn?.[3])],
    card,
    bars
  };
};

describe('every committed onboarding Lottie', () => {
  const DIR = path.dirname(INTRO);
  const files = fs.readdirSync(DIR).filter((name) => name.endsWith('.json'));

  /** Every animated property in a Lottie document, with its JSON path. */
  const animatedProperties = (node: unknown, at: string): [string, Keyframe[]][] => {
    if (Array.isArray(node))
      return node.flatMap((item, n) => animatedProperties(item, `${at}[${n}]`));
    if (node === null || typeof node !== 'object') return [];
    const record = node as Record<string, unknown>;
    const own: [string, Keyframe[]][] =
      record.a === 1 && Array.isArray(record.k) ? [[at, record.k as Keyframe[]]] : [];
    return own.concat(
      Object.entries(record).flatMap(([key, value]) => animatedProperties(value, `${at}.${key}`))
    );
  };

  it('ends every held track on a held keyframe', () => {
    // lottie-android drops a last keyframe that is not held (KeyframesParser.setEndFrames), so the
    // hold before it never ends there; lottie-iOS honours it, which hid the bug on iOS.
    expect(files.length).toBeGreaterThan(0);
    const unended = files.flatMap((name) =>
      animatedProperties(JSON.parse(fs.readFileSync(path.join(DIR, name), 'utf8')), name)
        .filter(([, keys]) => keys.some((key) => key.h === 1) && keys[keys.length - 1]?.h !== 1)
        .map(([where]) => where)
    );
    expect(unended).toEqual([]);
  });
});

describe('brand moment D, cardi-mark-intro.json (Story 20.6)', () => {
  const mark = intro.layers[0]?.shapes.find((shape) => shape.nm === 'mark');
  const beam = child(mark, 'beam');
  const cover = child(mark, 'cover');
  const card = child(mark, 'card');
  const stem = child(mark, 'stem');
  const beamPlace = typed(beam, 'tr');
  const coverRect = typed(cover, 'rc');
  const turn = typed(card, 'tr');
  const body = typed(child(card, 'body'), 'sh').ks?.k;
  const truth = staticMark();

  /** The cover's rect, as edges, at a frame. */
  const coverEdges = (at: typeof first) => {
    const [cx = 0, cy = 0] = at(coverRect.p);
    const [w = 0, h = 0] = at(coverRect.s);
    return { x0: cx - w / 2, x1: cx + w / 2, y0: cy - h / 2, y1: cy + h / 2 };
  };

  it('paints the beam over the cover over the card over the stem, and the bars over the card', () => {
    // Lottie paints earlier items on top, so the order of `it` IS the paint order.
    expect(mark?.it?.map((item) => item.nm)).toEqual([
      'beam',
      'cover',
      'card',
      'stem',
      'Transform'
    ]);
    expect(card.it?.map((item) => item.nm)).toEqual(['bars', 'body', 'Transform']);
  });

  it('fills the bars ink, the card beam and the stem cream', () => {
    const fillOf = (item: Item) => typed(item, 'fl').c?.k;
    expect(fillOf(child(card, 'bars'))).toEqual(lottieColour(IDENTITY_COLORS.ink));
    expect(fillOf(child(card, 'body'))).toEqual(lottieColour(IDENTITY_COLORS.beam));
    expect(fillOf(stem)).toEqual(lottieColour(IDENTITY_COLORS.cream));
    expect(fillOf(beam)).toEqual(lottieColour(IDENTITY_COLORS.beam));
  });

  it('draws the five bars the static mark cuts through its card', () => {
    const bars = (child(card, 'bars').it ?? [])
      .filter((item) => item.ty === 'sh')
      .map((item) => boxOf(item.ks?.k.v ?? []));
    expect(truth.bars).toHaveLength(5);
    expect(bars).toEqual(truth.bars);
  });

  it('lasts 0.84 s, and uses no mask or matte', () => {
    const times = JSON.stringify(intro)
      .match(/"t":[\d.]+/g)
      ?.map((key) => Number(key.slice(4)));
    expect(Math.max(...(times ?? [])) / intro.fr).toBeCloseTo(0.84, 3);
    for (const layer of intro.layers) {
      expect([layer.masksProperties, layer.tt, layer.td]).toEqual([
        undefined,
        undefined,
        undefined
      ]);
    }
  });

  describe('at frame 0, the stem stands alone on the ink disc', () => {
    it('has the beam off', () => {
      expect(first(beamPlace.o)).toEqual([0]);
    });

    it('hides the card, level, under an ink cover that spans it with room to spare', () => {
      expect(first(turn.r)).toEqual([0]);
      const edges = coverEdges(first);
      expect(edges.x0).toBeLessThan(truth.card.x0);
      expect(edges.x1).toBeGreaterThan(truth.card.x1);
      expect(edges.y0).toBeLessThan(truth.card.y0);
      expect(edges.y1).toBeGreaterThan(truth.card.y1);
      const fill = typed(cover, 'fl') as Item & { c: { k: number[] } };
      expect(fill.c.k).toEqual(lottieColour(IDENTITY_COLORS.ink));
    });

    it('shows the stem, which neither fades nor sits under the cover', () => {
      // The cover paints above the stem, so "the stem alone" needs both halves: the stem is never
      // animated, and the cover ends above its top.
      const stemPlace = typed(stem, 'tr');
      expect(stemPlace.o).toEqual({ a: 0, k: 100 });
      expect(coverEdges(first).y1).toBeLessThan(truth.stem.y);
    });
  });

  describe('the scan', () => {
    it('cuts the beam on and off, never fading it', () => {
      const keys = beamPlace.o?.a === 1 ? beamPlace.o.k : [];
      expect(keys.map((key) => key.s[0])).toEqual([0, 100, 0]);
      expect(keys.slice(0, -1).every((key) => key.h === 1)).toBe(true);
    });

    it('is horizontal, as wide as the card and a little more, and sweeps it top to bottom', () => {
      const beamRect = typed(beam, 'rc');
      const [width = 0, weight = 0] = first(beamRect.s);
      const cardWidth = truth.card.x1 - truth.card.x0;
      const cardHeight = truth.card.y1 - truth.card.y0;
      expect(width).toBeCloseTo(cardWidth + (2 * 34 * cardHeight) / 166, 3);
      expect(weight).toBeCloseTo((18 * cardHeight) / 166, 3);
      expect(beamPlace.r).toEqual({ a: 0, k: 0 });
      const keys = beamPlace.p?.a === 1 ? beamPlace.p.k : [];
      const ys = keys.map((key) => key.s[1] ?? 0);
      expect(ys[0]).toBeCloseTo(truth.card.y0 - weight / 2, 3);
      expect(ys[ys.length - 1]).toBeCloseTo(truth.card.y1 + weight / 2, 3);
    });

    it('sits over the card, centred on it across the whole sweep', () => {
      // The beam's absolute centre is its rect's own centre moved by the group's position.
      const [rectX = NaN] = first(typed(beam, 'rc').p);
      const keys = keysOf(beamPlace.p);
      expect(keys.length).toBeGreaterThan(1);
      for (const key of keys) {
        expect(rectX + (key.s[0] ?? NaN)).toBeCloseTo(truth.pivot[0] ?? NaN, 6);
      }
    });

    it('rides the cover’s top edge on the beam’s centre line, keyframe for keyframe', () => {
      const beamKeys = keysOf(beamPlace.p);
      const centres = keysOf(coverRect.p);
      const sizes = keysOf(coverRect.s);
      expect(beamKeys.length).toBeGreaterThan(1);
      for (const key of beamKeys) {
        const centre = centres.find((candidate) => candidate.t === key.t);
        const size = sizes.find((candidate) => candidate.t === key.t);
        expect([key.t, centre !== undefined, size !== undefined]).toEqual([key.t, true, true]);
        const top = (centre?.s[1] ?? NaN) - (size?.s[1] ?? NaN) / 2;
        expect(top).toBeCloseTo(key.s[1] ?? NaN, 6);
      }
    });

    it('moves the beam and the cover at a steady pace', () => {
      for (const keys of [keysOf(beamPlace.p), keysOf(coverRect.p), keysOf(coverRect.s)]) {
        expect(keys.length).toBeGreaterThan(1);
        for (const key of keys.slice(0, -1)) {
          expect([key.o, key.i]).toEqual([
            { x: [0], y: [0] },
            { x: [1], y: [1] }
          ]);
        }
      }
    });
  });

  describe('the order: scan, then settle', () => {
    const scanEnd = Math.max(
      ...[keysOf(coverRect.s), keysOf(beamPlace.p)].map((keys) => keys[keys.length - 1]?.t ?? NaN)
    );
    const turnKeys = keysOf(turn.r);

    it('keeps the card level until the scan has ended', () => {
      expect(turnKeys.filter((key) => key.t <= scanEnd).every((key) => key.s[0] === 0)).toBe(true);
      // A turn eases from the last level keyframe to the first turned one, so that level keyframe,
      // where the turn begins, must not come before the scan's end either.
      const firstTurned = turnKeys.findIndex((key) => key.s[0] !== 0);
      expect(firstTurned).toBeGreaterThan(0);
      expect(turnKeys[firstTurned - 1]?.t).toBeGreaterThanOrEqual(scanEnd);
    });

    it('turns past the rest angle, by the 3.5° overshoot, before it settles on it', () => {
      expect(turnKeys.length).toBeGreaterThan(2);
      expect(turnKeys[turnKeys.length - 2]?.s[0]).toBeCloseTo(truth.angle + 3.5, 6);
      expect(turnKeys[turnKeys.length - 1]?.s[0]).toBe(truth.angle);
    });
  });

  describe('at rest, the last frame — what Reduce Motion shows — is the static mark', () => {
    it('has the beam off and the cover gone', () => {
      expect(last(beamPlace.o)).toEqual([0]);
      expect(last(coverRect.s)[1]).toBeCloseTo(0, 6);
    });

    it('turns the card to the static mark’s angle, about its centre', () => {
      expect(last(turn.r)).toEqual([truth.angle]);
      expect(first(turn.p)).toEqual(truth.pivot);
      expect(first(turn.a)).toEqual(truth.pivot);
    });

    it('draws the card and the stem where the static mark does', () => {
      const xs = (body?.v ?? []).map(([x = 0]) => x);
      const ys = (body?.v ?? []).map(([, y = 0]) => y);
      expect([Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]).toEqual([
        truth.card.x0,
        truth.card.x1,
        truth.card.y0,
        truth.card.y1
      ]);
      const stemRect = typed(stem, 'rc');
      const [cx = 0, cy = 0] = first(stemRect.p);
      const [w = 0, h = 0] = first(stemRect.s);
      expect(cx - w / 2).toBeCloseTo(truth.stem.x, 3);
      expect(cy - h / 2).toBeCloseTo(truth.stem.y, 3);
      expect([w, h, ...first(stemRect.r)]).toEqual([truth.stem.w, truth.stem.h, truth.stem.r]);
    });
  });
});
