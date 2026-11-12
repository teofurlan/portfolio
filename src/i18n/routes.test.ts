import { describe, expect, it } from 'vitest';
import { alternate, langFromPath } from './routes';

describe('alternate', () => {
  it('maps static pages both ways', () => {
    expect(alternate('/', 'es')).toBe('/es/');
    expect(alternate('/es/', 'en')).toBe('/');
    expect(alternate('/resume/', 'es')).toBe('/es/cv/');
    expect(alternate('/es/cv/', 'en')).toBe('/resume/');
    expect(alternate('/how-i-build/', 'es')).toBe('/es/como-construyo-con-ia/');
    expect(alternate('/writing/', 'es')).toBe('/es/escritos/');
    expect(alternate('/about/', 'es')).toBe('/es/sobre-mi/');
    expect(alternate('/colophon/', 'es')).toBe('/es/colofon/');
    expect(alternate('/build-session/', 'es')).toBe('/es/como-se-construyo/');
    expect(alternate('/decoration/', 'es')).toBe('/es/decoracion/');
    expect(alternate('/es/decoracion/', 'en')).toBe('/decoration/');
  });

  it('maps project pages by slug', () => {
    expect(alternate('/work/socra/', 'es')).toBe('/es/trabajo/socra/');
    expect(alternate('/es/trabajo/mtds/', 'en')).toBe('/work/mtds/');
  });

  it('returns the same path when already in the target language', () => {
    expect(alternate('/about/', 'en')).toBe('/about/');
    expect(alternate('/es/sobre-mi/', 'es')).toBe('/es/sobre-mi/');
  });

  it('falls back to the language home for unknown paths', () => {
    expect(alternate('/nope/', 'es')).toBe('/es/');
    expect(alternate('/es/nope/', 'en')).toBe('/');
    expect(alternate('/work/', 'es')).toBe('/es/');
  });

  it('tolerates missing trailing slash and hash/query', () => {
    expect(alternate('/resume', 'es')).toBe('/es/cv/');
    expect(alternate('/resume/?x=1#contact', 'es')).toBe('/es/cv/');
  });
});

describe('langFromPath', () => {
  it('detects Spanish by the /es/ prefix', () => {
    expect(langFromPath('/es/')).toBe('es');
    expect(langFromPath('/es/cv/')).toBe('es');
    expect(langFromPath('/esto/')).toBe('en');
    expect(langFromPath('/')).toBe('en');
  });
});
