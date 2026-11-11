# PLAN — teofurlan.com

Resume point for any agent. Read `BRIEF.md` first, then this file. Update it
after every task (status + commit). Phases stop at their **Gate** until Teo
decides. Per-phase ODD specs live in `odd/tasks/`.

**Current state:** P0 done. Next: P1 (content import). No deploy yet.

## Environment notes

- Astro 7 needs Node `>=22.23.4`. On Teo's machine `C:\Program Files\nodejs`
  (Node 22.17) comes first on PATH; the nvm-managed Node 26 lives in
  `%LOCALAPPDATA%\Author Software\nvm\.nodejs`. Put that directory first on
  PATH (or fix the system PATH) before running `pnpm`.
- pnpm 11 enforces a minimum release age: do not add `minimumReleaseAgeExclude`
  entries to bypass it. Build scripts allowed: `esbuild`, `workerd`, `sharp`
  (`pnpm-workspace.yaml`).
- Wrangler runs as `pnpm wrangler …`. `pnpm wrangler deploy --dry-run` works
  after `pnpm build`. **Ask Teo before any real deploy or DNS change.**

## Architecture (as built)

- `astro.config.mjs`: `output: 'static'`, `@astrojs/cloudflare` adapter with
  `imageService: 'compile'` (Sharp at build, strips metadata), `session: false`.
- `wrangler.jsonc`: Worker `teofurlan`, entry
  `@astrojs/cloudflare/entrypoints/server`. Astro writes the deploy config to
  `dist/client/wrangler.json`. P5 adds cron, Workers AI and KV here.
- Content model (`src/content.config.ts`):
  - `projects` ← `content/projects/<slug>.md`. `status` alone publishes/hides
    (`src/lib/projects.ts`, tested). Media paths are relative to the `.md` file
    (`../../media/projects/<slug>/…`); images go through the image pipeline,
    videos are a separate `kind: video` entry.
  - `writing` ← `content/writing.json` (DEV posts; currently `[]`).
  - Resume: `content/resume.json` validated by `src/lib/resume.ts` (JSON
    Resume subset; `basics` is strict so a `phone` key fails the build, tested).
- Site links: `src/data/site.ts` (single source for hero + footer).
- Pages: `/`, `/work/[slug]/`, `/build-session/`, `/how-i-work/`, `/writing/`,
  `/about/`, `/cv/`, `/colophon/`, `/decoration/`, `404`. All are unstyled
  stubs until P2/P3.

## Phases

### P0 — Scaffold ✅

| Task | Status | Commit |
|---|---|---|
| git init, `.gitattributes`, commit brief/inputs/media (photo checked: no EXIF) | done | `0fa356c` |
| Astro 7 + Cloudflare adapter + Wrangler dev dep, `wrangler.jsonc`, README/.gitignore merged | done | `dc568a7` |
| Content model: projects, writing, resume schema + tests (status rule, phone refusal) | done | `feebd33` |
| Base layout + empty pages for every IA section | done | `76e2f40` |
| `PLAN.md` | done | this commit |

### P1 — Content · **Gate:** Teo reviews facts and statuses

| Task | Status | Commit |
|---|---|---|
| `content/resume.json` from `inputs/cv/resume.tex` (no phone; CV is authoritative) | todo | |
| Project files: socra, mtds, bloobert (featured); others `hidden`, each fact verified against its repo, sources in a hidden comment, gaps as `TODO(owner)` | todo | |
| `content/writing.json`: the 4 DEV posts with verified titles and dates | todo | |
| Timeline milestones (4–6) in `resume.json` `meta.timeline` | todo | |
| Photo caption (`media/photos/photos.yaml`, still `TODO(owner)`) | blocked: Teo | |

### P2 — Design directions · **Gate:** Teo picks one

| Task | Status | Commit |
|---|---|---|
| 2–3 static artboards (personal story; engineering drawings / kinematic diagrams) | todo | |

### P3 — Layout + all sections

| Task | Status | Commit |
|---|---|---|
| Hero (Teo's line), featured cards, case-study pages, media gallery, Hardware filter (≥ 2 hardware projects) | todo | |
| How I work with AI essay + diagram; Writing + RSS; About + timeline; CV page; Contact | todo | |
| Footer/colophon: obfuscated email, self-hosted gentle-ai badge, AI Hero text credit, LLM copy-edit note | todo | |

### P4 — Session replay · **Gate:** Teo reviews redacted transcript

| Task | Status | Commit |
|---|---|---|
| Copy build-session JSONL into `transcripts/raw/` (git-ignored) | todo | |
| `scripts/redact.ts` + tests (must catch secrets; fails build) | todo | |
| Chapters/highlights curation, EN translation precompute | todo | |
| Player island (autoplay, pause → browsable transcript, reduced-motion) | todo | |

### P5 — Daily decoration

| Task | Status | Commit |
|---|---|---|
| Confirm Workers AI free limits/models; cron + KV; SVG/ASCII validator + tests | todo | |
| Provenance line + `/decoration/` archive + static fallback | todo | |

### P6 — Ship · **Gate:** Teo approves publishing

| Task | Status | Commit |
|---|---|---|
| Lighthouse ≥ 95 mobile, a11y pass, no-JS check | todo | |
| Public CV PDF (no phone, GitHub added), OG images | todo | |
| Deploy to workers.dev, then connect teofurlan.com | todo | |

## Open questions for Teo

- Photo caption for `2004_first-computer_01.jpg` (P1).
- Hero positioning line (drafts come in P3; his text wins).
