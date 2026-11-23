import { describe, expect, it } from 'vitest';
import { THEMES } from './themes';
import { buenosAiresDate, makePiece, nextTheme, plateLabel, provenance, shortModel } from './daily';
import { seededRng } from './rng';
import { pickSelection } from './prompt';
import { validateSvg } from './validate';

const MODEL = '@cf/google/gemma-4-26b-a4b-it';
const ids = THEMES.map((t) => t.id);

describe('nextTheme (S3)', () => {
  it('visits every theme once before repeating any', () => {
    const rng = seededRng(7);
    let state: unknown = null;
    const seen: string[] = [];
    for (let i = 0; i < ids.length; i++) {
      const r = nextTheme(state, rng);
      seen.push(r.theme);
      state = r.state;
    }
    expect([...seen].sort()).toEqual([...ids].sort());
  });

  it('starts a new round without repeating the last theme', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const rng = seededRng(seed);
      let state: unknown = null;
      let last = '';
      for (let i = 0; i < ids.length * 3; i++) {
        const r = nextTheme(state, rng);
        if (i > 0) expect(r.theme).not.toBe(last);
        last = r.theme;
        state = r.state;
      }
    }
  });

  it('tolerates a missing or corrupted state', () => {
    for (const bad of [null, undefined, 'x', 42, { used: 'no' }, { used: ['ghost'] }, { used: ids }]) {
      const r = nextTheme(bad, seededRng(3));
      expect(ids).toContain(r.theme);
      expect(r.state.used).toContain(r.theme);
    }
  });
});

describe('buenosAiresDate', () => {
  it('uses the America/Argentina/Buenos_Aires calendar day', () => {
    expect(buenosAiresDate(new Date('2026-11-18T02:30:00Z'))).toBe('2026-11-17');
    expect(buenosAiresDate(new Date('2026-11-18T03:00:00Z'))).toBe('2026-11-18');
    expect(buenosAiresDate(new Date('2026-11-18T06:00:00Z'))).toBe('2026-11-18');
  });
});

describe('makePiece (S4, S8, S10, S11)', () => {
  const selection = pickSelection('circuits', seededRng(5));
  const base = { date: '2026-11-18', plate: 3, selection, model: MODEL };

  it('draws model parameters with code and records the model path', () => {
    const p = makePiece({
      ...base,
      params: { pins: 6, size: 50, traces: 3, accent: 2, seed: 9 },
      titles: { title_en: 'A quiet board', title_es: 'Una placa tranquila' },
      rng: seededRng(1),
    });
    expect(p).toMatchObject({
      date: '2026-11-18',
      plate: 3,
      theme: 'circuits',
      motif: selection.motif,
      attitude: selection.attitude,
      title_en: 'A quiet board',
      title_es: 'Una placa tranquila',
      model: MODEL,
      source: 'model-params',
    });
    expect(p.prompt).toContain(selection.motif);
    expect(p.params).toMatchObject({ pins: 6 });
    expect(validateSvg(p.svg).ok).toBe(true);
    expect(p.svg).toContain('stroke-width="1.6"'); // L9 marker
  });

  it('falls back to seeded random parameters, deterministically (S4)', () => {
    const a = makePiece({ ...base, params: null, titles: null, rng: seededRng(11) });
    const b = makePiece({ ...base, params: null, titles: null, rng: seededRng(11) });
    const c = makePiece({ ...base, params: null, titles: null, rng: seededRng(12) });
    expect(a.source).toBe('code-random');
    expect(a.params).not.toBeNull();
    expect(validateSvg(a.svg).ok).toBe(true);
    expect(a).toEqual(b);
    expect(c.svg).not.toBe(a.svg);
  });

  it('draws a valid piece for every theme and motif, with and without the model (S10)', () => {
    for (const t of THEMES) {
      for (const motif of t.motifs) {
        for (const params of [null, {}]) {
          const p = makePiece({
            date: '2026-11-18',
            plate: 1,
            selection: { theme: t.id, motif, attitude: 'minimal' },
            params,
            titles: null,
            model: MODEL,
            rng: seededRng(t.id.length + motif.length),
          });
          expect(validateSvg(p.svg).ok, `${t.id} / ${motif}`).toBe(true);
        }
      }
    }
  });

  it('uses the fallback titles when a title fails validation (S8)', () => {
    const p = makePiece({
      ...base,
      params: null,
      titles: { title_en: '<b>bold</b>', title_es: 'x'.repeat(80) },
      rng: seededRng(2),
    });
    expect(p.title_en).toBe("Today's piece");
    expect(p.title_es).toBe('La pieza de hoy');
    const q = makePiece({ ...base, params: null, titles: { title_en: 'Fine', title_es: '' }, rng: seededRng(2) });
    expect(q.title_en).toBe('Fine');
    expect(q.title_es).toBe('La pieza de hoy');
  });

  it('rejects an unknown theme', () => {
    expect(() =>
      makePiece({ ...base, selection: { theme: 'nope', motif: 'm', attitude: 'a' }, params: null, titles: null, rng: seededRng(1) }),
    ).toThrow();
  });
});

describe('labels (S8, S11)', () => {
  const rec = { plate: 4, title_en: 'Gears at rest', title_es: 'Engranajes en reposo', model: MODEL, source: 'model-params' as const };
  it('formats the plate label per language', () => {
    expect(plateLabel(rec, 'en')).toBe('Plate 4 · Gears at rest');
    expect(plateLabel(rec, 'es')).toBe('Lámina 4 · Engranajes en reposo');
  });
  it('shortens the model name', () => {
    expect(shortModel(MODEL)).toBe('gemma-4-26b-a4b-it');
  });
  it('says which path made the piece', () => {
    expect(provenance(rec, 'en')).toBe('Parameters and title by gemma-4-26b-a4b-it, drawn by code');
    expect(provenance(rec, 'es')).toBe('Parámetros y título de gemma-4-26b-a4b-it, dibujo de código');
    const fb = { ...rec, source: 'code-random' as const };
    expect(provenance(fb, 'en')).toBe('Drawn by code');
    expect(provenance(fb, 'es')).toBe('Dibujo de código');
  });
});
