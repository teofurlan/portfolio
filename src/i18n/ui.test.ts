import { describe, expect, it } from 'vitest';
import { defaultLang, langs, t, ui } from './ui';

describe('ui dictionaries', () => {
  it('have exactly the same keys in every language', () => {
    const en = Object.keys(ui.en).sort();
    const es = Object.keys(ui.es).sort();
    expect(es).toEqual(en);
  });

  it('have no empty values', () => {
    for (const lang of langs) {
      for (const [key, value] of Object.entries(ui[lang])) {
        expect(value.trim(), `${lang}.${key}`).not.toBe('');
      }
    }
  });

  it('names the resume page Resume in English and CV in Spanish', () => {
    expect(ui.en['nav.resume']).toBe('Resume');
    expect(ui.es['nav.resume']).toBe('CV');
  });

  it('t(lang) reads from the right dictionary and defaults to English', () => {
    expect(t('es')('nav.work')).toBe(ui.es['nav.work']);
    expect(t()('nav.work')).toBe(ui.en['nav.work']);
    expect(defaultLang).toBe('en');
  });
});
