import { describe, expect, it } from 'vitest';
import { railProgress } from './rail-progress';

// Five sections starting at these document offsets; the reading line ends at 5000.
const tops = [1000, 3000, 3400, 3800, 4200];
const end = 5000;
// Plate centres inside the rail list (88 px rows), list height 440.
const centres = [44, 132, 220, 308, 396];
const h = 440;
const at = (y: number) => railProgress({ tops, end, centres, height: h, y });

describe('railProgress', () => {
  it('is 0 at the top of the page and reaches plate 1 when section 1 starts', () => {
    expect(at(0)).toBe(0);
    expect(at(500)).toBeCloseTo(22 / h);
    expect(at(1000)).toBeCloseTo(44 / h);
  });

  it('stays between plate 1 and plate 2 while reading a long section 1 (the reported bug)', () => {
    // Halfway through section 1 the line is halfway between plates 1 and 2, not past plate 3.
    expect(at(2000)).toBeCloseTo(88 / h);
    expect(at(2999) * h).toBeLessThan(132);
  });

  it('reaches each plate centre exactly when its section starts', () => {
    tops.forEach((t, i) => expect(at(t)).toBeCloseTo(centres[i] / h));
  });

  it('grows from the last plate to the end of the list over the last section', () => {
    expect(at(4600)).toBeCloseTo((396 + 22) / h);
    expect(at(end)).toBe(1);
    expect(at(end + 300)).toBe(1);
  });

  it('handles no sections and zero-height lists', () => {
    expect(railProgress({ tops: [], end, centres: [], height: h, y: 100 })).toBe(0);
    expect(railProgress({ tops, end, centres, height: 0, y: 100 })).toBe(0);
  });
});
