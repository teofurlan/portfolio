/**
 * Rail progress line (home page map). The line reaches a plate's centre exactly
 * when its section starts and grows toward the next plate while that section is
 * read, so a long section never pushes the line past later plates.
 */
export interface RailInput {
  /** Document offsets where each section starts, in rail order. */
  tops: number[];
  /** Reading-line position at the bottom of the page (scrollHeight - innerHeight + reading offset). */
  end: number;
  /** Plate centres measured from the top of the rail list, in rail order. */
  centres: number[];
  /** Height of the rail list (the line's full length). */
  height: number;
  /** Current reading-line position in the document. */
  y: number;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const frac = (v: number, from: number, to: number) => (to > from ? clamp01((v - from) / (to - from)) : 1);

export function railProgress({ tops, end, centres, height, y }: RailInput): number {
  const n = Math.min(tops.length, centres.length);
  if (n === 0 || height <= 0) return 0;
  let px: number;
  if (y < tops[0]) {
    px = centres[0] * frac(y, 0, tops[0]);
  } else {
    let i = 0;
    while (i + 1 < n && y >= tops[i + 1]) i++;
    const next = i + 1 < n ? centres[i + 1] : height;
    const nextTop = i + 1 < n ? tops[i + 1] : end;
    px = centres[i] + (next - centres[i]) * frac(y, tops[i], nextTop);
  }
  return clamp01(px / height);
}
