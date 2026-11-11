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

Project status and phases: [`PLAN.md`](PLAN.md).
