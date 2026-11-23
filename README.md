# teofurlan.com

Personal portfolio and CV of Teo Furlan: software with AI agents, and hardware.

<a href="https://github.com/Gentleman-Programming/gentle-ai">
  <img width="220" src="https://raw.githubusercontent.com/Gentleman-Programming/gentle-ai/main/docs/assets/brand/built-with-gentle-ai.png" alt="Built with Gentle-AI" />
</a>

Built with the [gentle-ai](https://github.com/Gentleman-Programming/gentle-ai)
harness and [AI Hero](https://www.aihero.dev) skills. The full build
conversation is published on the site.

- Build brief: [`BRIEF.md`](BRIEF.md)
- Owner inputs checklist: [`inputs/README.md`](inputs/README.md)

## Development

Requires Node.js `>=22.23.4` (see `.nvmrc`) and pnpm.

```sh
pnpm install
pnpm dev       # local dev server (workerd runtime)
pnpm build     # static build + Worker into dist/
pnpm preview   # preview the build in workerd
pnpm test      # unit tests (vitest)
pnpm check     # astro + TypeScript diagnostics
```

Wrangler is a dev dependency; run it as `pnpm wrangler <command>`. Deploys
and DNS changes need the owner's approval (see `BRIEF.md` §4).
D

### Daily decoration (P5)

A Cron Trigger (`0 6 * * *`, 03:00 Argentina) runs `generateDaily` in `src/worker/decoration.ts`: a
Workers AI model (Gemma) picks the parameters and titles, code draws and validates the SVG, and the
piece goes to the `DECORATION` KV namespace. The Worker inserts it into `/` and `/es/` and renders the
archive at `/decoration/` and `/es/decoracion/`; if KV is empty the static pages are served as built.
Local smoke test (local KV, **real** AI binding, so it uses a few neurons; never `--remote`):

```sh
pnpm build
pnpm wrangler dev -c dist/client/wrangler.json --test-scheduled --port 8798 --persist-to .wrangler/smoke
curl "http://127.0.0.1:8798/cdn-cgi/handler/scheduled?cron=0+6+*+*+*"   # run the cron once
```

`pnpm exec node scripts/decoration/preview.ts` previews the code-drawn pieces without any model call.

Project status and phases: [`PLAN.md`](PLAN.md).
