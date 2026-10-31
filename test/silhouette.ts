/**
 * The shape of a transparent mark, read from its alpha channel alone (Story 20.6).
 *
 * The surfaces that draw the Cardì mark as a silhouette — the Android themed layer, which is one
 * colour, and the complication's inline glyph, which watchOS reads as a template from its alpha —
 * keep the card's barcode only because its bars are HOLES: alpha-zero pixels enclosed by the card.
 * Painted bars would vanish there. This counts what such a surface can actually show, so a test
 * can assert the shape rather than the colour.
 */
export type Silhouette = {
  /** Separate inked shapes (alpha > 0), joined through edges and corners. */
  pieces: number;
  /** Enclosed alpha-zero regions: transparent areas that do not reach the image's border. */
  holes: number;
};

/**
 * Count the pieces and holes in a square image's alpha channel.
 *
 * Ink is joined through corners and transparency only through edges — the usual pairing, so that a
 * diagonal line of ink seals a hole rather than letting it leak past the corner it shares.
 *
 * @param alphaAt the alpha of the pixel at (x, y), 0–255
 */
export const silhouette = (size: number, alphaAt: (x: number, y: number) => number): Silhouette => {
  const seen = new Uint8Array(size * size);
  const inked = (x: number, y: number) => alphaAt(x, y) > 0;

  /** Flood one region from (x, y); true if it touches the border. */
  const flood = (startX: number, startY: number, ink: boolean): boolean => {
    const steps = ink
      ? [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
          [1, 1],
          [1, -1],
          [-1, 1],
          [-1, -1]
        ]
      : [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1]
        ];
    let border = false;
    const stack = [startY * size + startX];
    seen[startY * size + startX] = 1;
    while (stack.length > 0) {
      const index = stack.pop() ?? 0;
      const x = index % size;
      const y = Math.floor(index / size);
      if (x === 0 || y === 0 || x === size - 1 || y === size - 1) border = true;
      for (const [dx = 0, dy = 0] of steps) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
        const next = ny * size + nx;
        if (seen[next] || inked(nx, ny) !== ink) continue;
        seen[next] = 1;
        stack.push(next);
      }
    }
    return border;
  };

  let pieces = 0;
  let holes = 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (seen[y * size + x]) continue;
      const ink = inked(x, y);
      const border = flood(x, y, ink);
      if (ink) pieces += 1;
      else if (!border) holes += 1;
    }
  }
  return { pieces, holes };
};
