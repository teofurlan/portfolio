/**
 * Page copy per language (S6). UI strings live in src/i18n/ui.ts; everything
 * longer (hero, About, the AI essay, colophon, figure labels) lives in
 * content/i18n/<lang>/site.json. Fields ending in `Html` are trusted
 * markup written by the site owner and rendered with set:html.
 */
import en from '../../content/i18n/en/site.json';
import es from '../../content/i18n/es/site.json';
import type { Lang } from '../i18n/ui';

export type SiteContent = typeof en;

export const siteContent: Record<Lang, SiteContent> = { en, es };

export const getContent = (lang: Lang = 'en'): SiteContent => siteContent[lang];

/** Replace `{name}` slots with values; unknown slots stay as they are. */
export function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
}

/**
 * Overlay the translated fields of a Spanish case study on its English entry.
 * The Spanish entry's schema is strict and only holds translatable fields, so
 * status, order, tags, stack, links, media, team and year always come from the
 * English file (single source).
 */
export function mergeProject<P extends { data: object }, T extends { data: object }>(base: P, translation: T): P {
  return { ...base, data: { ...base.data, ...translation.data } };
}

/** Fields a Spanish case study may translate. Anything else is a duplicate of the English file. */
export const translatableProjectFields = ['title', 'summary', 'role', 'ownership'] as const;
