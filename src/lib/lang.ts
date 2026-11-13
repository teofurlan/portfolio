export type Lang = 'en' | 'es';

/** Best q-value per language, with the position of its first appearance. */
function parseAcceptLanguage(header: string): Record<Lang, { q: number; order: number } | null> {
  const best: Record<Lang, { q: number; order: number } | null> = { en: null, es: null };
  header.split(',').forEach((part, order) => {
    const [tag = '', ...params] = part.trim().split(';');
    const primary = tag.trim().toLowerCase().split('-')[0];
    if (primary !== 'en' && primary !== 'es') return;
    let q = 1;
    for (const p of params) {
      const m = /^\s*q\s*=\s*(.*)$/i.exec(p);
      if (m) q = /^(\d+(\.\d*)?|\.\d+)$/.test(m[1]!.trim()) ? Number(m[1]) : 0;
    }
    if (q <= 0) return;
    const cur = best[primary];
    if (!cur || q > cur.q) best[primary] = { q, order };
  });
  return best;
}

function cookieLang(cookie: string | null | undefined): Lang | null {
  for (const part of (cookie ?? '').split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === 'lang') {
      const v = rest.join('=').trim();
      return v === 'en' || v === 'es' ? v : null;
    }
  }
  return null;
}

/** S4: valid `lang` cookie wins; else Spanish only if it beats English by q, or by order at equal q. */
export function pickLanguage(input: { acceptLanguage?: string | null; cookie?: string | null }): Lang {
  const fromCookie = cookieLang(input.cookie);
  if (fromCookie) return fromCookie;
  const { en, es } = parseAcceptLanguage(input.acceptLanguage ?? '');
  if (!es) return 'en';
  if (!en) return 'es';
  if (es.q !== en.q) return es.q > en.q ? 'es' : 'en';
  return es.order < en.order ? 'es' : 'en';
}

/** Target URL when a request for `/` should go to `/es/`; null otherwise (only `/`, GET/HEAD). */
export function shouldRedirectHome(request: {
  url: string;
  method: string;
  headers: { get(name: string): string | null };
}): URL | null {
  if (request.method !== 'GET' && request.method !== 'HEAD') return null;
  const url = new URL(request.url);
  if (url.pathname !== '/') return null;
  const lang = pickLanguage({
    acceptLanguage: request.headers.get('accept-language'),
    cookie: request.headers.get('cookie'),
  });
  if (lang !== 'es') return null;
  return new URL('/es/', url);
}
