import { describe, expect, it } from 'vitest';
import { staticRoutes } from '../i18n/routes';
import { sitemapXml } from './sitemap';

describe('sitemapXml', () => {
  const xml = sitemapXml('https://teofurlan.com', ['socra', 'mtds']);

  it('produces valid urlset XML with xhtml namespace', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">');
    expect(xml.trimEnd().endsWith('</urlset>')).toBe(true);
  });

  it('includes every static EN and ES route', () => {
    for (const [en, es] of Object.entries(staticRoutes)) {
      expect(xml).toContain(`<loc>https://teofurlan.com${en}</loc>`);
      expect(xml).toContain(`<loc>https://teofurlan.com${es}</loc>`);
    }
  });

  it('includes visible project routes in both languages and omits hidden slugs', () => {
    expect(xml).toContain('<loc>https://teofurlan.com/projects/socra/</loc>');
    expect(xml).toContain('<loc>https://teofurlan.com/es/proyectos/socra/</loc>');
    expect(xml).toContain('<loc>https://teofurlan.com/projects/mtds/</loc>');
    expect(xml).toContain('<loc>https://teofurlan.com/es/proyectos/mtds/</loc>');
    expect(xml).not.toContain('dogear');
    expect(xml).not.toContain('emprender');
  });

  it('adds en, es, and x-default hreflang links for every entry', () => {
    const blocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]!);
    const locs = blocks.map((b) => /<loc>([^<]+)<\/loc>/.exec(b)?.[1]);
    expect(new Set(locs).size).toBe(locs.length);
    for (const block of blocks) {
      expect(block).toContain('rel="alternate" hreflang="en"');
      expect(block).toContain('rel="alternate" hreflang="es"');
      expect(block).toContain('rel="alternate" hreflang="x-default"');
    }
  });

  it('normalizes trailing slash on siteUrl', () => {
    const withSlash = sitemapXml('https://teofurlan.com/', ['socra']);
    expect(withSlash).toContain('<loc>https://teofurlan.com/projects/socra/</loc>');
    expect(withSlash).not.toContain('com//');
  });
});
