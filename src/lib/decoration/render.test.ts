import { describe, expect, it } from 'vitest';
import { THEMES } from './themes';
import { PARAMETER_RENDERERS, seededRng, buildParameterPrompt } from './prompt';
import { ACCENT, validateSvg } from './validate';

type Render = (params: unknown, motif?: string) => string;
const render = (theme: string, params: unknown, motif: string): string => (PARAMETER_RENDERERS[theme] as unknown as Render)(params, motif);

const KEYS = [
  'links', 'angles', 'accent', 'ground', 'crank', 'coupler', 'rocker', 'angle', 'opening', 'finger_length', 'object',
  'pivot', 'tilt', 'sweep', 'tool_length', 'bars', 'bands', 'drift', 'rings', 'spread', 'freqs', 'amps', 'phase',
  'branches', 'pins', 'size', 'traces', 'holes', 'shaft', 'cable_side', 'wires', 'sensor_y', 'mcu_y', 'seed',
  'rows', 'gaps', 'keys', 'curve', 'lines', 'cables', 'knots', 'base', 'height', 'inner', 'dims', 'parts', 'gap', 'gears',
];

/** A random value of a deliberately nasty kind: in range, out of range, extreme, wrong type. */
function value(rng: () => number, depth = 0): unknown {
  const k = Math.floor(rng() * (depth ? 7 : 11));
  switch (k) {
    case 0: return rng();
    case 1: return Math.floor(rng() * 13);
    case 2: return (rng() - 0.5) * 600;
    case 3: return rng() < 0.5 ? 1e9 : -1e9;
    case 4: return NaN;
    case 5: return 'x';
    case 6: return null;
    case 7: case 8: return Array.from({ length: Math.floor(rng() * 46) }, () => value(rng, 1));
    case 9: return Array.from({ length: Math.floor(rng() * 12) }, () => Object.fromEntries(KEYS.slice(0, 8).map((key) => [key, value(rng, 1)])));
    default: return Object.fromEntries(KEYS.map((key) => [key, value(rng, 1)]));
  }
}
const fuzz = (rng: () => number): Record<string, unknown> => Object.fromEntries(KEYS.filter(() => rng() < 0.7).map((k) => [k, value(rng)]));

const EXTREMES: unknown[] = [
  {}, null, 'nope', [], 42,
  Object.fromEntries(KEYS.map((k) => [k, 1e9])),
  Object.fromEntries(KEYS.map((k) => [k, -1e9])),
  Object.fromEntries(KEYS.map((k) => [k, NaN])),
  Object.fromEntries(KEYS.map((k) => [k, Array(100000).fill(1e9)])),
  Object.fromEntries(KEYS.map((k) => [k, Array(60).fill({ x: 1e9, kind: 'bolt', length: -1e9 })])),
  Object.fromEntries(KEYS.map((k) => [k, 0])),
];

describe('motif-aware renderers (S7)', () => {
  it('has 20 motifs across 5 themes', () => {
    expect(THEMES.flatMap((t) => t.motifs)).toHaveLength(20);
  });

  for (const theme of THEMES) {
    describe(theme.id, () => {
      for (const motif of theme.motifs) {
        it(`"${motif}": valid SVG for random and extreme params, thin stroke, one accent group`, () => {
          const rng = seededRng(theme.id.length * 1000 + motif.length);
          const inputs = [...EXTREMES, ...Array.from({ length: 40 }, () => fuzz(rng))];
          for (const params of inputs) {
            const svg = render(theme.id, params, motif);
            const v = validateSvg(svg);
            expect(v.errors, JSON.stringify(params).slice(0, 200)).toEqual([]);
            const width = Number(/<svg[^>]*stroke-width="([\d.]+)"/.exec(svg)?.[1]);
            expect(width).toBeGreaterThanOrEqual(1.2);
            expect(width).toBeLessThanOrEqual(1.6);
            expect(svg.split(ACCENT).length - 1).toBeLessThanOrEqual(1);
            expect(svg).toBe(render(theme.id, params, motif));
          }
        });
      }

      it('different motifs of the same theme draw different SVGs (default and shared random params)', () => {
        const rng = seededRng(99);
        for (const params of [{}, fuzz(rng), fuzz(rng), fuzz(rng)]) {
          const svgs = theme.motifs.map((m) => render(theme.id, params, m));
          expect(new Set(svgs).size).toBe(theme.motifs.length);
        }
      });
    });
  }

  it('asks the model for parameters that fit the motif', () => {
    for (const theme of THEMES) {
      const specs = theme.motifs.map((motif) => buildParameterPrompt({ theme: theme.id, motif, attitude: 'minimal' }).map((m) => m.content).join('\n'));
      // The line with the parameter shape (not the "Motif: ..." line) must differ per motif.
      const shapes = specs.map((s) => s.split('\n').find((l) => l.includes('shaped like'))!);
      expect(new Set(shapes).size).toBe(theme.motifs.length);
      specs.forEach((s, i) => expect(s).toContain(theme.motifs[i]!));
    }
  });
});
