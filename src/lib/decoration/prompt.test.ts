import { describe, expect, it } from 'vitest';
import { THEMES, ATTITUDES } from './themes';
import { buildPrompt, buildParameterPrompt, pickSelection, renderMechanisms, renderSoundVoice, renderCircuits, renderOldComputers, renderTechnicalDrawing, PARAMETER_RENDERERS, seededRng } from './prompt';
import { validateSvg } from './validate';

describe('themes', () => {
  it('has the 5 themes with 4-5 motifs and 5 attitudes', () => {
    expect(THEMES.map((t) => t.id)).toEqual(['mechanisms', 'sound-voice', 'circuits', 'old-computers', 'technical-drawing']);
    for (const t of THEMES) expect(t.motifs.length).toBeGreaterThanOrEqual(4);
    expect(ATTITUDES).toHaveLength(5);
  });
});

describe('pickSelection', () => {
  it('spreads 10 consecutive seeds over every motif and attitude (trial 2 only ever drew two attitudes)', () => {
    for (const theme of THEMES) {
      const picks = Array.from({ length: 10 }, (_, i) => pickSelection(theme.id, seededRng(i + 1)));
      expect(new Set(picks.map((p) => p.motif)).size).toBe(theme.motifs.length);
      expect(new Set(picks.map((p) => p.attitude)).size).toBe(ATTITUDES.length);
    }
  });

  it('is deterministic for a seeded rng and uses the injected rng', () => {
    const a = pickSelection('circuits', seededRng(7));
    const b = pickSelection('circuits', seededRng(7));
    expect(a).toEqual(b);
    expect(pickSelection('circuits', () => 0).motif).toBe(THEMES.find((t) => t.id === 'circuits')!.motifs[0]);
    expect(pickSelection('circuits', () => 0.999).attitude).toBe(ATTITUDES[ATTITUDES.length - 1]);
  });
  it('throws on unknown theme', () => expect(() => pickSelection('nope', () => 0)).toThrow());
});

describe('buildPrompt', () => {
  const sel = pickSelection('mechanisms', () => 0);
  const msgs = buildPrompt(sel);
  const text = msgs.map((m) => m.content).join('\n');
  it('injects motif and attitude and states the hard constraints', () => {
    expect(text).toContain(sel.motif);
    expect(text).toContain(sel.attitude);
    for (const needle of ['viewBox="0 0 200 120"', '#1d2c47', '#a62f08', 'title_en', 'title_es', 'no text']) {
      expect(text).toContain(needle);
    }
  });
});

describe('parameter mode', () => {
  it('prompt asks for JSON parameters', () => {
    const text = buildParameterPrompt(pickSelection('mechanisms', () => 0)).map((m) => m.content).join('\n');
    expect(text).toMatch(/JSON/);
    expect(text).toContain('links');
  });
  it('renders a valid, deterministic SVG from mechanisms parameters', () => {
    const params = { links: [40, 30, 20], angles: [30, 60, -20], accent: 2 };
    const a = renderMechanisms(params);
    expect(a).toBe(renderMechanisms(params));
    expect(validateSvg(a).errors).toEqual([]);
  });
  it('clamps absurd parameters into a valid SVG', () => {
    expect(validateSvg(renderMechanisms({ links: [9999, -5, NaN], angles: [1e9] })).ok).toBe(true);
    expect(validateSvg(renderMechanisms({} as never)).ok).toBe(true);
  });
});

describe('parameter renderers for the other four themes', () => {
  const cases: [string, (p: never) => string, unknown, unknown[]][] = [
    ['sound-voice', renderSoundVoice as never, { bars: [0.1, 0.5, 0.9, 0.3, 0.7, 0.2, 0.8, 0.4, 0.6], accent: 2 }, [
      { bars: Array(100000).fill(1e9) }, { bars: [-5, NaN, 'x', null] }, { bars: 'nope', accent: -3 }, { bars: Array(40).fill(0) }, {}, null,
    ]],
    ['circuits', renderCircuits as never, { traces: [{ from: [10, 10], to: [100, 60] }, { from: [20, 90], to: [150, 30] }, { from: [5, 5], to: [190, 110] }], accent: 1 }, [
      { traces: Array(50).fill({ from: [0, 0], to: [0, 0] }) }, { traces: [{ from: [1e9, -1e9], to: [NaN, 'x'] }] }, { traces: 'nope', accent: 99 }, { traces: [null, 3, {}] }, {}, null,
    ]],
    ['old-computers', renderOldComputers as never, { keys: { rows: 4, cols: 10 }, accent: [1, 3] }, [
      { keys: { rows: 1e9, cols: 1e9 }, accent: [1e9, -1e9] }, { keys: { rows: -5, cols: NaN } }, { keys: 'x', accent: 'y' }, {}, null,
    ]],
    ['technical-drawing', renderTechnicalDrawing as never, { gears: [{ teeth: 12, radius: 20 }, { teeth: 16, radius: 28 }], accent: 0 }, [
      { gears: Array(50).fill({ teeth: 1e9, radius: 1e9 }) }, { gears: [{ teeth: -3, radius: -9 }] }, { gears: [null, 'x'], accent: NaN }, { gears: 'nope' }, {}, null,
    ]],
  ];
  for (const [theme, render, good, extremes] of cases) {
    it(`${theme}: valid and deterministic for normal params`, () => {
      const a = render(good as never);
      expect(a).toBe(render(good as never));
      expect(validateSvg(a).errors).toEqual([]);
    });
    it(`${theme}: valid for extreme/garbage params`, () => {
      for (const p of extremes) expect(validateSvg(render(p as never)).errors).toEqual([]);
    });
  }
  it('PARAMETER_RENDERERS covers all five themes', () => {
    expect(Object.keys(PARAMETER_RENDERERS).sort()).toEqual(THEMES.map((t) => t.id).sort());
  });
});
