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
});
