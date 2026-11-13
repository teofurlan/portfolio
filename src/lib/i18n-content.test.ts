import { describe, expect, it } from 'vitest';
import { fill, mergeProject, siteContent, translatableProjectFields } from './i18n-content';

/** Every key path (arrays as []) with array lengths, so both languages must have the same shape. */
function shape(value: unknown, path = ''): string[] {
  if (Array.isArray(value)) {
    return [`${path}[${value.length}]`, ...value.flatMap((v) => shape(v, `${path}[]`))];
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => shape(v, path ? `${path}.${k}` : k));
  }
  return [path];
}

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('page content files (content/i18n)', () => {
  it('have the same structure in English and Spanish', () => {
    expect(shape(siteContent.es)).toEqual(shape(siteContent.en));
  });

  it('have no empty text', () => {
    for (const lang of ['en', 'es'] as const) {
      for (const text of strings(siteContent[lang])) expect(text.trim(), lang).not.toBe('');
    }
  });

  it('keep the same {slots} and external links in both languages', () => {
    const slotsOf = (t: string) => [...t.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    const external = (t: string) => [...t.matchAll(/href="(http[^"]+)"/g)].map((m) => m[1]);
    const en = strings(siteContent.en);
    const es = strings(siteContent.es);
    expect(es.map(slotsOf)).toEqual(en.map(slotsOf));
    expect(es.map(external)).toEqual(en.map(external));
  });

  it('points Spanish internal links inside /es/ (or to the English-only RSS feed)', () => {
    for (const text of strings(siteContent.es)) {
      for (const [, href] of text.matchAll(/href="(\/[^"]*)"/g)) {
        expect(href === '/rss.xml' || href?.startsWith('/es/'), href).toBe(true);
      }
    }
  });

  it('fills slots and leaves unknown ones alone', () => {
    expect(fill('{count} posts, {x}', { count: 4 })).toBe('4 posts, {x}');
  });
});

/** slug -> raw Markdown (CRLF-normalised), read through Vite so no Node APIs are needed. */
const bySlug = (files: Record<string, unknown>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(files).map(([path, text]) => [
      path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/, ''),
      String(text).split('\r\n').join('\n'),
    ]),
  );
const projectsEn = bySlug(import.meta.glob('../../content/projects/*.md', { query: '?raw', import: 'default', eager: true }));
const projectsEs = bySlug(import.meta.glob('../../content/projects-es/*.md', { query: '?raw', import: 'default', eager: true }));

/** Top-level frontmatter keys of a Markdown file, and a reader for one scalar value. */
function frontmatter(text: string): { keys: string[]; get: (key: string) => string | undefined } {
  const block = text.split('\n---')[0]?.replace(/^---\n/, '') ?? '';
  const lines = block.split('\n');
  const keys = lines.map((l) => /^([A-Za-z]\w*):/.exec(l)?.[1]).filter((k): k is string => Boolean(k));
  return { keys, get: (key) => lines.find((l) => l.startsWith(`${key}:`))?.slice(key.length + 1).trim() };
}

const headings = (text: string) => text.split('\n').filter((l) => l.startsWith('## '));

describe('Spanish case studies (content/projects-es)', () => {
  const visible = Object.keys(projectsEn)
    .filter((slug) => frontmatter(projectsEn[slug] ?? '').get('status') !== 'hidden')
    .sort();
  const translated = Object.keys(projectsEs).sort();

  it('exist for every visible English project', () => {
    expect(visible.length).toBeGreaterThan(0);
    for (const slug of visible) expect(translated, `missing content/projects-es/${slug}.md`).toContain(slug);
  });

  it('do not exist for hidden projects (no Spanish route)', () => {
    expect(translated.filter((slug) => !visible.includes(slug))).toEqual([]);
  });

  it('only carry translated fields, never a copy of the shared ones', () => {
    for (const slug of translated) {
      expect([...frontmatter(projectsEs[slug] ?? '').keys].sort(), slug).toEqual([...translatableProjectFields].sort());
    }
  });

  it('have a translated body with the same number of sections as the English one', () => {
    for (const slug of translated) {
      const en = projectsEn[slug] ?? '';
      const es = projectsEs[slug] ?? '';
      expect(es.length, slug).toBeGreaterThan(500);
      expect(headings(es).length, slug).toBe(headings(en).length);
      expect(headings(es), slug).not.toContain('## Problem');
    }
  });
});

describe('mergeProject', () => {
  const en = { id: 'x', data: { title: 'T', status: 'featured', order: 1, tags: ['ai'], year: 2026, summary: 'S', role: 'R' } };
  const es = { id: 'x', data: { title: 'T', summary: 'Resumen', role: 'Rol' } };

  it('takes translated fields from Spanish and everything else from English', () => {
    const merged = mergeProject(en, es);
    expect(merged.data.summary).toBe('Resumen');
    expect(merged.data.role).toBe('Rol');
    expect(merged.data.status).toBe('featured');
    expect(merged.data.order).toBe(1);
    expect(merged.data.tags).toEqual(['ai']);
    expect(merged.data.year).toBe(2026);
  });

  it('does not mutate the English entry', () => {
    mergeProject(en, es);
    expect(en.data.summary).toBe('S');
  });
});
