/**
 * Plausible random parameters per theme and motif (P5 / S4): the code-random fallback when the model's
 * reply is unusable. Ranges follow the parameter shapes in themes.ts; renderers clamp anyway.
 */
export type Rng = () => number;
export type Gen = Record<string, unknown>;
const F = (r: Rng, lo: number, hi: number): number => Math.round((lo + r() * (hi - lo)) * 100) / 100;
const I = (r: Rng, lo: number, hi: number): number => Math.floor(lo + r() * (hi - lo + 1));
const many = <T>(n: number, make: () => T): T[] => Array.from({ length: n }, make);

/** Plausible random parameters per theme and motif index, inside the ranges the param specs promise. */
export const RANDOM_PARAMS: Record<string, ((r: Rng) => Gen)[]> = {
  mechanisms: [
    (r) => ({ links: many(3, () => F(r, 15, 60)), angles: many(3, () => F(r, -120, 120)), accent: I(r, 0, 2) }),
    (r) => ({ ground: F(r, 40, 100), crank: F(r, 10, 40), coupler: F(r, 30, 90), rocker: F(r, 25, 70), angle: F(r, 0, 360), accent: I(r, 0, 3) }),
    (r) => ({ opening: F(r, 0, 1), finger_length: F(r, 20, 38), object: F(r, 4, 14), accent: I(r, 0, 1) }),
    (r) => ({ pivot: F(r, 60, 140), tilt: F(r, -40, 40), sweep: F(r, 8, 30), tool_length: F(r, 50, 100), accent: I(r, 0, 1) }),
  ],
  'sound-voice': [
    (r) => ({ bars: many(I(r, 14, 40), () => (r() < 0.2 ? F(r, 0.04, 0.12) : F(r, 0.2, 1))), accent: I(r, 0, 13) }),
    (r) => ({ bands: many(I(r, 4, 9), () => F(r, 0.2, 1)), drift: F(r, -1, 1), accent: I(r, 0, 3) }),
    (r) => ({ rings: I(r, 3, 7), spread: F(r, 30, 120), accent: I(r, 0, 5) }),
    (r) => ({ freqs: [F(r, 1, 6), F(r, 1, 6)], amps: [F(r, 0.3, 1), F(r, 0.3, 1)], phase: F(r, 0, 360), accent: I(r, 0, 1) }),
  ],
  circuits: [
    (r) => ({ branches: many(I(r, 3, 8), () => ({ at: F(r, 0, 1), dir: r() < 0.5 ? -1 : 1, len: F(r, 10, 60) })), accent: I(r, 0, 4) }),
    (r) => ({ pins: I(r, 4, 9), size: F(r, 36, 70), traces: I(r, 2, 6), accent: I(r, 0, 9) }),
    (r) => ({ size: F(r, 54, 84), rings: I(r, 0, 3), shaft: F(r, 0.06, 0.14), cable_side: I(r, 0, 3), accent: I(r, 0, 2) }),
    (r) => ({ wires: I(r, 2, 4), sensor_y: F(r, 34, 70), mcu_y: F(r, 34, 86), accent: I(r, 0, 3) }),
  ],
  'old-computers': [
    (r) => ({ rows: I(r, 3, 4), gaps: F(r, 0, 0.4), accent: I(r, 0, 20) }),
    (r) => ({ size: F(r, 60, 100), curve: F(r, 0, 1), knobs: I(r, 0, 3), accent: I(r, 0, 1) }),
    (r) => ({ size: F(r, 70, 100), curve: F(r, 0, 1), lines: I(r, 2, 5), line_lengths: many(5, () => F(r, 0.2, 0.9)) }),
    (r) => ({ cables: I(r, 3, 6), tangle: F(r, 0.2, 1), knots: I(r, 0, 3), accent: I(r, 0, 5) }),
  ],
  'technical-drawing': [
    (r) => ({ gears: many(I(r, 2, 3), () => ({ teeth: I(r, 8, 24), radius: F(r, 10, 40) })), accent: I(r, 0, 2) }),
    (r) => ({ opening: F(r, 20, 44), leg: F(r, 52, 80), sweep: F(r, 40, 270), accent: I(r, 0, 1) }),
    (r) => ({ base: F(r, 60, 120), height: F(r, 36, 74), inner: F(r, 0.3, 0.6), accent: I(r, 0, 2) }),
    (r) => ({
      parts: many(I(r, 3, 5), () => ({ kind: ['bolt', 'washer', 'plate', 'bush', 'nut'][I(r, 0, 4)], length: F(r, 5, 36), diameter: F(r, 8, 28) })),
      gap: F(r, 6, 20),
      accent: I(r, 0, 4),
    }),
  ],
};

/** Seeded random parameters for a theme's motif (index into `theme.motifs`; unknown index uses the first). */
export function randomParams(themeId: string, motifIndex: number, rng: Rng): Gen {
  const makers = RANDOM_PARAMS[themeId];
  const make = makers?.[motifIndex] ?? makers?.[0];
  if (!make) throw new Error(`no random parameters for theme ${themeId}`);
  return { ...make(rng), seed: I(rng, 1, 9999) };
}
