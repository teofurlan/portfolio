import { describe, expect, it } from 'vitest';
import { THEMES, ATTITUDES } from './themes';
import { buildPrompt, buildParameterPrompt, pickSelection, renderMechanisms, seededRng } from './prompt';
import { validateSvg } from './validate';

describe('themes', () => {
  it('has the 5 themes with 4-5 motifs and 5 attitudes', () => {
    expect(THEMES.map((t) => t.id)).toEqual(['mechanisms', 'sound-voice', 'circuits', 'old-computers', 'technical-drawing']);
    for (const t of THEMES) expect(t.motifs.length).toBeGreaterThanOrEqual(4);
    expect(ATTITUDES).toHaveLength(5);
  });
});

describe('pickSelection', () => {
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
