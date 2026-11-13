/**
 * Worker entry (T3 / S4): automatic language redirect on `/` only.
 *
 * Every page stays prerendered and served as a static asset. wrangler.jsonc sets
 * `assets.run_worker_first: ["/"]`, so only requests for exactly `/` reach this
 * Worker; everything else (deep links, /es/..., assets) is served by the asset
 * layer without running code.
 *
 * - GET/HEAD `/` with a Spanish preference (valid `lang=es` cookie, or no valid
 *   cookie and Accept-Language preferring Spanish) → 302 to `/es/`.
 * - Otherwise the English home is fetched from the assets binding (200).
 * - Both responses carry `Vary: Accept-Language, Cookie`. The redirect is
 *   `Cache-Control: private, no-store` so a shared cache never replays it.
 * Decision logic is the pure, tested `shouldRedirectHome` in src/lib/lang.ts.
 */
import { shouldRedirectHome } from '../lib/lang';

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

const VARY = 'Accept-Language, Cookie';

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
    response.headers.set('Vary', VARY);
    return response;
  },
};
