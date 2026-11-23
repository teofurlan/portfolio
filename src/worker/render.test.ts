import { describe, expect, it } from 'vitest';
import { archiveHtml, escapeHtml, liveSvg, parseIndex, parseRecord } from './render';
import { makePiece } from '../lib/decoration/daily';
import { pickSelection } from '../lib/decoration/prompt';
import { seededRng } from '../lib/decoration/rng';

const piece = (over: Record<string, unknown> = {}) => ({
  ...makePiece({
    date: '2026-11-18',
    plate: 2,
    selection: pickSelection('mechanisms', seededRng(4)),
    params: null,
    titles: { title_en: 'Pivot at rest', title_es: 'Pivote en reposo' },
    model: '@cf/google/gemma-4-26b-a4b-it',
    rng: seededRng(9),
  }),
  ...over,
});

describe('escapeHtml', () => {
  it('escapes markup characters', () => {
    expect(escapeHtml(`<a href="x">&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
  });
});

describe('parseRecord / parseIndex (stored data is untrusted)', () => {
  it('accepts a real record and re-validates its svg', () => {
    const p = piece();
    expect(parseRecord(JSON.parse(JSON.stringify(p)))?.plate).toBe(2);
  });
  it('rejects junk, missing fields and an invalid svg', () => {
    expect(parseRecord(null)).toBeNull();
    expect(parseRecord('x')).toBeNull();
    expect(parseRecord({ ...piece(), plate: 'two' })).toBeNull();
    expect(parseRecord({ ...piece(), svg: '<svg onload="x()"></svg>' })).toBeNull();
    expect(parseRecord({ ...piece(), source: 'hand' })).toBeNull();
  });
  it('keeps only well-formed index entries', () => {
    const ok = { date: '2026-11-18', plate: 2, theme: 'circuits', title_en: 'a', title_es: 'b' };
    expect(parseIndex([ok, { date: 5 }, null])).toEqual([ok]);
    expect(parseIndex('nope')).toBeNull();
  });
});

describe('liveSvg (S1: only the validated svg goes in as HTML)', () => {
  it('adds the hooks and an escaped accessible label', () => {
    const html = liveSvg(piece({ title_en: 'He said "hi"' }) as never, 'en')!;
    expect(html.startsWith('<svg ')).toBe(true);
    expect(html).toContain('data-piece-svg');
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Plate 2 · He said &quot;hi&quot;"');
  });
  it('returns null for an invalid svg', () => {
    expect(liveSvg(piece({ svg: '<svg><script>x</script></svg>' }) as never, 'en')).toBeNull();
  });
});

describe('archiveHtml (S11)', () => {
  it('lists pieces with label, date, provenance and the collapsed prompt, escaped', () => {
    const a = piece({ title_en: '<img src=x onerror=alert(1)>', prompt: '[user]\n<script>', source: 'model-params' }) as never;
    const html = archiveHtml([a, piece({ plate: 1, source: 'code-random', date: '2026-11-17' }) as never], 'en', 'Prompt');
    expect(html).toContain('<details>');
    expect(html).toContain('<summary>Prompt</summary>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<script>');
    expect(html).toContain('Parameters and title by gemma-4-26b-a4b-it, drawn by code');
    expect(html).toContain('Drawn by code');
    expect(html).toContain('2026-11-18');
    expect(html.indexOf('Plate 2')).toBeLessThan(html.indexOf('Plate 1'));
  });
  it('uses Spanish labels', () => {
    expect(archiveHtml([piece() as never], 'es', 'Prompt')).toContain('Lámina 2 · Pivote en reposo');
  });
});
