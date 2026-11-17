import { describe, expect, it } from 'vitest';
import { THEMES } from './themes';
import { PARAMETER_RENDERERS } from './prompt';
import { roughen, roughenDetailed } from './rough';
import { ACCENT, INK, validateSvg } from './validate';

type Render = (params: unknown, motif?: string) => string;
const clean = (theme: string, motif: string): string => {
  const v = validateSvg((PARAMETER_RENDERERS[theme] as unknown as Render)({}, motif));
  expect(v.errors).toEqual([]);
  return v.svg;
};
const colours = (svg: string): Set<string> => new Set(svg.match(/#[0-9a-f]{6}/gi));

describe('roughen (marker stroke)', () => {
  it('uses a 1.6 marker and keeps the full double stroke for every code-drawn motif (L9)', () => {
    for (const theme of THEMES) for (const motif of theme.motifs) {
      const clean = (PARAMETER_RENDERERS[theme.id] as (p: unknown, m?: string) => string)({ seed: 3 }, motif);
      const r = roughenDetailed(clean, { seed: 3, roughness: 1 });
      expect(r.svg).toContain('stroke-width="1.6"');
      expect([theme.id, motif, r.tier]).toEqual([theme.id, motif, 0]);
    }
  });

  const sample = clean('mechanisms', THEMES[0]!.motifs[0]!);

  it('is deterministic for a seed and changes with the seed', () => {
    expect(roughen(sample, { seed: 7, roughness: 1.2 })).toBe(roughen(sample, { seed: 7, roughness: 1.2 }));
    expect(roughen(sample, { seed: 7, roughness: 1.2 })).not.toBe(roughen(sample, { seed: 8, roughness: 1.2 }));
  });

  it('uses a 1.6 marker (thicker than the 1.4 clean stroke) with round caps, stroke only', () => {
    const out = roughen(sample, { seed: 1, roughness: 1 });
    expect(out).not.toBe(sample);
    expect(out).toContain('stroke-linecap="round"');
    expect(out).not.toMatch(/fill="(?!none)/);
    expect(out).toMatch(/<svg[^>]*stroke-width="1.6"/);
  });

  for (const theme of THEMES) {
    for (const motif of theme.motifs) {
      it(`${theme.id} / ${motif}: valid output, colours preserved`, () => {
        const svg = clean(theme.id, motif);
        const out = roughen(svg, { seed: 3, roughness: 1.1 });
        const v = validateSvg(out);
        expect(v.errors).toEqual([]);
        expect(out).not.toBe(svg);
        expect(colours(out)).toEqual(colours(svg));
        expect(out).toBe(roughen(svg, { seed: 3, roughness: 1.1 }));
      });
    }
  }

  it('pulls overshooting curves back into the canvas (smooth Q/T paths imply control points outside it)', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" fill="none" stroke="#1d2c47" stroke-width="1">' +
      '<path d="M10,80 Q30,75 45,95 T75,85 T110,100 T150,80 T190,95"/><path d="M5,90 C25,70 50,115 80,95 C110,75 140,115 180,90"/>' +
      '<rect x="30" y="60" width="40" height="25" rx="6"/><circle cx="40" cy="72" r="2"/><line x1="30" y1="85" x2="10" y2="110"/></svg>';
    const v = validateSvg(svg);
    expect(v.errors).toEqual([]);
    const out = roughen(v.svg, { seed: 100, roughness: 1 });
    expect(out).not.toBe(v.svg);
    expect(validateSvg(out).errors).toEqual([]);
  });

  it('keeps the accent on the same elements', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" fill="none" stroke="#1d2c47" stroke-width="1.4">' +
      '<line x1="10" y1="10" x2="60" y2="20"/><circle cx="100" cy="60" r="20"/><rect x="20" y="70" width="40" height="30"/>' +
      '<polygon points="120,20 160,20 140,50"/><polyline points="10,110 50,100 90,110"/>' +
      `<g stroke="${ACCENT}"><path d="M120 80 C140 60 160 100 180 80"/></g></svg>`;
    const v = validateSvg(svg);
    expect(v.errors).toEqual([]);
    const out = roughen(v.svg, { seed: 5, roughness: 1 });
    expect(validateSvg(out).errors).toEqual([]);
    expect(out.split(ACCENT).length - 1).toBe(1);
    expect(out).toContain(INK);
    expect(out).toMatch(/<g stroke="#a62f08"><path [^>]*\/><\/g><\/svg>$/);
    expect(out.match(/<path /g)).toHaveLength(6);
    expect(out).not.toMatch(/<(line|circle|rect|polygon|polyline)\b/);
  });
});
