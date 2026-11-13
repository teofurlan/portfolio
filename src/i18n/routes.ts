/** Route map EN↔ES (S5). English is unprefixed, Spanish lives under /es/. */
import type { Lang } from './ui';

/** English path → Spanish path, for pages with a fixed URL. */
export const staticRoutes: Record<string, string> = {
  '/': '/es/',
  '/how-i-build/': '/es/como-construyo-con-ia/',
  '/writing/': '/es/escritos/',
  '/about/': '/es/sobre-mi/',
  '/resume/': '/es/cv/',
  '/colophon/': '/es/colofon/',
  '/build-session/': '/es/como-se-construyo/',
  '/decoration/': '/es/decoracion/',
};

const WORK = { en: '/projects/', es: '/es/proyectos/' } as const;
const home = { en: '/', es: '/es/' } as const;

const esToEn = Object.fromEntries(Object.entries(staticRoutes).map(([en, es]) => [es, en]));

export function langFromPath(path: string): Lang {
  return path === '/es' || path.startsWith('/es/') ? 'es' : 'en';
}

function normalize(path: string): string {
  const clean = path.split(/[?#]/)[0] || '/';
  return clean.endsWith('/') ? clean : `${clean}/`;
}

/** Path of the same page in `toLang`; the language home when there is no counterpart. */
export function alternate(path: string, toLang: Lang): string {
  const p = normalize(path);
  const from = langFromPath(p);
  if (from === toLang) return p in staticRoutes || p in esToEn || p.startsWith(WORK[from]) ? p : home[toLang];
  if (from === 'en') {
    if (p in staticRoutes) return staticRoutes[p];
  } else if (p in esToEn) {
    return esToEn[p];
  }
  const prefix = WORK[from];
  if (p.startsWith(prefix) && p.length > prefix.length) return WORK[toLang] + p.slice(prefix.length);
  return home[toLang];
}
