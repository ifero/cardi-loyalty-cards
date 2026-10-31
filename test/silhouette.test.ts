import { silhouette } from './silhouette';

/** A square image from rows of `#` (ink, alpha 255) and `.` (transparent). */
const image = (...rows: string[]) => {
  const size = rows.length;
  for (const row of rows) expect(row).toHaveLength(size);
  return silhouette(size, (x, y) => (rows[y]?.[x] === '#' ? 255 : 0));
};

describe('silhouette', () => {
  it('reads a ring as one piece with one hole', () => {
    expect(image('.....', '.###.', '.#.#.', '.###.', '.....')).toEqual({ pieces: 1, holes: 1 });
  });

  it('joins ink through corners, so a diagonal line seals a hole', () => {
    // The ink is a diamond whose sides touch only corner to corner. Transparency moves through
    // edges alone, so the centre cannot leak out past those corners.
    expect(
      image('.......', '...#...', '..#.#..', '.#...#.', '..#.#..', '...#...', '.......')
    ).toEqual({ pieces: 1, holes: 1 });
  });

  it('counts two separate blobs as two pieces', () => {
    expect(image('.....', '##...', '##...', '...##', '...##')).toEqual({ pieces: 2, holes: 0 });
  });

  it('does not count transparency that reaches the border as a hole', () => {
    // A cup open at the top: its inside touches the image's edge.
    expect(image('#.#..', '#.#..', '###..', '.....', '.....')).toEqual({ pieces: 1, holes: 0 });
  });

  it('reads a partial alpha as ink', () => {
    expect(silhouette(3, (x, y) => (x === 1 && y === 1 ? 1 : 0))).toEqual({ pieces: 1, holes: 0 });
  });
});
