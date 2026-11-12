// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// Mostly static site served as Workers static assets. Server code (daily
// decoration cron, P5) is added only where needed.
export default defineConfig({
  site: 'https://teofurlan.com',
  output: 'static',
  adapter: cloudflare({
    // Optimize images with Sharp at build time; no runtime Images binding.
    imageService: 'compile',
  }),
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
