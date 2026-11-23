/**
 * Worker entry.
 *
 * Every page stays prerendered and served as a static asset. wrangler.jsonc sets
 * `assets.run_worker_first` to the four routes below, so only those reach this Worker;
 * everything else (deep links, assets) is served by the asset layer without running code.
 *
 * - T3 (P3b): GET/HEAD `/` with a Spanish preference (valid `lang=es` cookie, or no valid
 *   cookie and Accept-Language preferring Spanish) → 302 to `/es/`. Otherwise the English home
 *   is fetched from the assets binding (200). Both responses carry `Vary: Accept-Language, Cookie`;
 *   the redirect is `Cache-Control: private, no-store`. Logic is the pure, tested `shouldRedirectHome`.
 * - P5 (S1): the home pages (`/`, `/es/`) get today's piece in the hero back and the archive pages
 *   (`/decoration/`, `/es/decoracion/`) get the grid of past pieces, both read from KV and inserted
 *   with HTMLRewriter (works without JS). If KV is empty or anything throws, the static page is served
 *   untouched. Visitors never trigger model calls.
 * - P5 (S1): `scheduled` runs the daily generation (cron 06:00 UTC = 03:00 Argentina).
 */
import { plateLabel, provenance, type Lang } from '../lib/decoration/daily';
import { shouldRedirectHome } from '../lib/lang';
import { readArchive, readLatest, generateDaily } from './decoration';
import { archiveHtml, liveSvg } from './render';
import type { Env } from './types';

// Minimal HTMLRewriter typing (no @cloudflare/workers-types in this repo).
interface RewriterElement {
  replace(content: string, options?: { html?: boolean }): unknown;
  setInnerContent(content: string, options?: { html?: boolean }): unknown;
  getAttribute(name: string): string | null;
}
interface Rewriter {
  on(selector: string, handlers: { element(el: RewriterElement): void }): Rewriter;
  transform(response: Response): Response;
}
declare const HTMLRewriter: new () => Rewriter;

const VARY = 'Accept-Language, Cookie';

const PAGES: Record<string, { kind: 'home' | 'archive'; lang: Lang }> = {
  '/': { kind: 'home', lang: 'en' },
  '/es/': { kind: 'home', lang: 'es' },
  '/decoration/': { kind: 'archive', lang: 'en' },
  '/es/decoracion/': { kind: 'archive', lang: 'es' },
};

/** Small per-isolate cache so a burst of visits reads KV once (the piece changes once a day). */
const FOUND_TTL_MS = 5 * 60_000;
const EMPTY_TTL_MS = 60_000;
const memo = new Map<string, { until: number; value: unknown }>();
async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = memo.get(key);
  if (hit && hit.until > Date.now()) return hit.value as T;
  const value = await load();
  const empty = value === null || (Array.isArray(value) && value.length === 0);
  memo.set(key, { until: Date.now() + (empty ? EMPTY_TTL_MS : FOUND_TTL_MS), value });
  return value;
}

/** Rewrite an HTML page with KV data; returns null (serve the static page) if there is nothing to add. */
async function decorate(response: Response, env: Env, page: { kind: 'home' | 'archive'; lang: Lang }): Promise<Response | null> {
  const kv = env.DECORATION;
  if (!kv) return null;
  const { lang } = page;
  let rewriter: Rewriter;
  if (page.kind === 'home') {
    const piece = await cached('latest', () => readLatest(kv));
    if (!piece) return null;
    const svg = liveSvg(piece, lang);
    if (!svg) return null;
    const label = plateLabel(piece, lang);
    const note = `${provenance(piece, lang)} · `;
    rewriter = new HTMLRewriter()
      .on('svg[data-piece-svg]', { element: (el) => void el.replace(svg, { html: true }) })
      .on('[data-piece-title]', { element: (el) => void el.setInnerContent(label) })
      .on('[data-piece-note]', { element: (el) => void el.setInnerContent(note) });
  } else {
    const pieces = await cached('archive', () => readArchive(kv));
    if (!pieces.length) return null;
    rewriter = new HTMLRewriter().on('[data-archive]', {
      element(el) {
        const html = archiveHtml(pieces, lang, el.getAttribute('data-prompt-label') ?? 'Prompt');
        if (html) el.setInnerContent(html, { html: true });
      },
    });
  }
  const out = rewriter.transform(response);
  const headers = new Headers(out.headers);
  headers.delete('content-length');
  headers.delete('etag');
  return new Response(out.body, { status: out.status, statusText: out.statusText, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const target = shouldRedirectHome(request);
    if (target) {
      return new Response(null, {
        status: 302,
        headers: { Location: target.toString(), Vary: VARY, 'Cache-Control': 'private, no-store' },
      });
    }
    const asset = await env.ASSETS.fetch(request);
    const response = new Response(asset.body, asset);
    const pathname = new URL(request.url).pathname;
    if (pathname === '/') response.headers.set('Vary', VARY);

    const page = PAGES[pathname];
    if (!page || request.method !== 'GET' || response.status !== 200 || !(response.headers.get('content-type') ?? '').includes('text/html')) {
      return response;
    }
    try {
      // KV is read before the body is touched (transform is lazy): if this throws, `response` is intact.
      const decorated = await decorate(response, env, page);
      return decorated ?? response;
    } catch (e) {
      console.error(`decoration: serving the static page: ${String(e)}`);
      return response;
    }
  },

  /** Cron Trigger (S1): one piece a day; on any failure yesterday's piece stays. */
  async scheduled(event: { scheduledTime: number }, env: Env): Promise<void> {
    if (!env.AI || !env.DECORATION) {
      console.error('decoration: AI or DECORATION binding missing');
      return;
    }
    await generateDaily({ AI: env.AI, DECORATION: env.DECORATION }, new Date(event.scheduledTime));
  },
};
