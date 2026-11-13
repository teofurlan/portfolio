import { describe, expect, it } from 'vitest';
import { pickLanguage, shouldRedirectHome } from './lang';

const pick = (acceptLanguage?: string | null, cookie?: string | null) =>
  pickLanguage({ acceptLanguage, cookie });

describe('pickLanguage', () => {
  it.each([
    ['es-AR,es;q=0.9,en;q=0.8', 'es'],
    ['es-419,en;q=0.5', 'es'],
    ['en-US,en;q=0.9,es;q=0.8', 'en'],
    ['es', 'es'],
    ['ES-ar', 'es'],
    ['fr', 'en'],
    ['', 'en'],
    ['*', 'en'],
    ['garbage;;;,,q=', 'en'],
    ['es;q=0.8,en;q=0.9', 'en'],
    ['en;q=0.8,es;q=0.9', 'es'],
    ['es,en', 'es'],
    ['en,es', 'en'],
    ['es;q=0,en', 'en'],
    ['fr,es;q=0.5', 'es'],
    ['es;q=abc,en;q=0.5', 'en'],
  ] as const)('Accept-Language %j → %s', (header, expected) => {
    expect(pick(header)).toBe(expected);
  });

  it('defaults to en without a header', () => {
    expect(pick(undefined)).toBe('en');
    expect(pick(null)).toBe('en');
  });

  it('a valid cookie wins over the header', () => {
    expect(pick('es-AR,es', 'lang=en')).toBe('en');
    expect(pick('en-US,en', 'lang=es')).toBe('es');
    expect(pick('en', 'theme=dark; lang=es; x=1')).toBe('es');
  });

  it('ignores an invalid cookie', () => {
    expect(pick('es-AR,es', 'lang=fr')).toBe('es');
    expect(pick('en', 'lang=')).toBe('en');
    expect(pick('es', 'language=en')).toBe('es');
  });
});

describe('shouldRedirectHome', () => {
  const req = (url: string, headers: Record<string, string> = {}, method = 'GET') => ({
    url,
    method,
    headers: new Headers(headers),
  });
  const es = { 'accept-language': 'es-AR,es;q=0.9' };

  it('redirects / to /es/ for Spanish visitors', () => {
    expect(shouldRedirectHome(req('https://teofurlan.com/', es))?.toString()).toBe('https://teofurlan.com/es/');
    expect(shouldRedirectHome(req('https://teofurlan.com/', es, 'HEAD'))?.pathname).toBe('/es/');
  });

  it('keeps the query string out of the redirect', () => {
    expect(shouldRedirectHome(req('https://teofurlan.com/?utm=x', es))?.search).toBe('');
  });

  it('does not redirect English, absent header or cookie en', () => {
    expect(shouldRedirectHome(req('https://teofurlan.com/'))).toBeNull();
    expect(shouldRedirectHome(req('https://teofurlan.com/', { 'accept-language': 'en-US' }))).toBeNull();
    expect(shouldRedirectHome(req('https://teofurlan.com/', { ...es, cookie: 'lang=en' }))).toBeNull();
  });

  it('redirects on cookie es with English header', () => {
    expect(shouldRedirectHome(req('https://teofurlan.com/', { 'accept-language': 'en', cookie: 'lang=es' }))).not.toBeNull();
  });

  it('never redirects other paths', () => {
    for (const p of ['/about/', '/es/', '/es/cv/', '/resume/', '/_astro/x.css', '/rss.xml', '//']) {
      expect(shouldRedirectHome(req(`https://teofurlan.com${p}`, es))).toBeNull();
    }
  });

  it('never redirects non GET/HEAD', () => {
    expect(shouldRedirectHome(req('https://teofurlan.com/', es, 'POST'))).toBeNull();
  });
});
