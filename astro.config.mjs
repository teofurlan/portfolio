// Not @ts-check: uses node:* modules and the repo has no @types/node (no new deps allowed).
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, relative } from 'node:path';

// For `output: 'static'` the Cloudflare adapter emits an assets-only deploy config
// (dist/client/wrangler.json) with no Worker script, which makes `run_worker_first`
// invalid. This integration adds our tiny Worker (language redirect on `/`, see
// src/worker/entry.ts) to that generated config. Pages stay prerendered.
const workerEntry = () => ({
  name: 'worker-entry',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const file = fileURLToPath(new URL('wrangler.json', dir));
      const config = JSON.parse(readFileSync(file, 'utf8'));
      const entry = fileURLToPath(new URL('./src/worker/entry.ts', import.meta.url));
      config.main = relative(dirname(file), entry).replaceAll('\\', '/');
      config.assets = { ...config.assets, binding: 'ASSETS' };
      writeFileSync(file, JSON.stringify(config));
    },
  },
});

// Mostly static site served as Workers static assets. Server code (daily
// decoration cron, P5) is added only where needed.
export default defineConfig({
  site: 'https://teofurlan.com',
  output: 'static',
  adapter: cloudflare({
    // Optimize images with Sharp at build time; no runtime Images binding.
    imageService: 'compile',
  }),
  integrations: [workerEntry()],
  // No sessions: avoids provisioning a SESSION KV namespace.
  session: false,
  // English is unprefixed, Spanish lives under /es/. Browser-language redirect is
  // not Astro's job (see odd/tasks/p3b-i18n.md T3).
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false },
  },
  // The CV page is called Resume in English (S1); keep the old URL alive.
  redirects: { '/cv/': '/resume/' },
});
