# PLAN — teofurlan.com

Resume point for any agent. Read `BRIEF.md` first, then this file. Update it
after every task (status + commit). Phases stop at their **Gate** until Teo
decides. Per-phase ODD specs live in `odd/tasks/`.

**Current state:** P3 done on branch `p3-layout` (not merged, no deploy): the real site
follows artboard 08 with IBM Plex self-hosted. Waiting on Teo: hero line, About paragraphs,
How I work essay (all flagged DRAFT), certificates, project media. Next: P4 session replay.

## Environment notes

- Astro 7 needs Node `>=22.23.4`. The global Node was upgraded to 22.23.4 on
  2026-11-11; plain `pnpm` works.
- Research of sibling repos (read-only) lives in `odd/evidence/<slug>.md`;
  case studies cite it. Sibling repos are never modified.
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
| `content/resume.json` from `resume.tex` (no phone, GitHub added) + 5-item timeline + photo caption "2004. Where it started." | done | `4581853` |
| `content/writing.json`: 4 DEV posts, checked against the DEV API | done | `5f3dd6f` |
| Hidden stubs from verified sources: emprender (CV), pricor and dogear (DEV posts) | done | `6e35c8b` |
| Research evidence for socra, mtds, bloobert (`odd/evidence/`) | done | `a467b07` |
| Featured case studies: mtds (1), socra (2), bloobert (3), `TODO(owner)` gaps, DRAFT "What I'd change" | done | `e32d8dc` |
| Gate answers applied: CV wording for MTDS (repo out of date), team-wide ownership, Socra/bloobert solo, repo links removed (repos private), order Socra 1, MTDS 2, bloobert 3 | done | see git log |
| Alethea and UAP analyzer | dropped for now (Teo, 2026-11-11) | |
| Certificates (3–5) in `resume.json` | blocked: Teo | |

### P2 — Design directions · **Gate:** Teo picks one

| Task | Status | Commit |
|---|---|---|
| Gate answers: Socra repo public and linked, English-first reason, congress dropped | done | `c31c199` |
| Self-hosted gentle-ai badge (`src/assets/badges/`), P2 spec `odd/tasks/p2-design.md` | done | `42f7655` |
| 3 artboards: 01 drafting sheet, 02 lab notebook, 03 two legs (`design/portfolio-directions/`) | done | `b1c02f1` |
| Round 2 (Teo: 01 gave the arm too much weight; 02/03 too simple; wants scroll interaction): 04 drawing set, 05 exploded view, 06 signal path | done | `99ee9fe` |
| Round 3 (Teo: too bright/washed out; combine 04 + 05; themes follow system + toggle): 07 cover-and-sheets, 08 exploded-index | done | `d7faec6` |
| Teo kept only 07 and 08; removed 01–06 | done | `6c717b2` |
| Scroll effects fixed (they ran but finished off-screen; now script-driven, measured with CDP) and interactive drafting grid added to 07 and 08 | done | `fe76a11` |
| Teo picks a direction: **08 Exploded index** | done (gate passed) | |
| impeccable polish of 08 | done | see git log |

### P3 — Layout + all sections ✅ (branch `p3-layout`, spec `odd/tasks/p3-layout.md`)

| Task | Status | Commit |
|---|---|---|
| Shell from artboard 08: tokens, themes, drafting grid, header/footer, IBM Plex Sans/Mono self-hosted, `@astrojs/rss` | done | `203d69f` |
| Hero (DRAFT line until Teo rewrites), featured sheets with FIG 1.1–1.3, case-study pages, media gallery, Hardware filter rule (hidden until ≥ 2 hardware projects; tested) | done | `c88e4d3` |
| How I work with AI essay (DRAFT) + FIG 3.1; Writing + `/rss.xml`; About + timeline + 2004 photo; CV from `resume.json` + `#contact`; colophon | done | `1b34b63` |
| Verify (all pages × 390/1280 px × themes × JS on/off/reduced motion) + a11y fixes | done | `147272b` |
| Lighthouse | moved to P6 | |

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

## Open questions for Teo (P1 gate)

Answered 2026-11-11: MTDS repo is out of date (CV wins); MTDS built as a team
with no task split; Socra and bloobert solo; repos private (no repo links);
order Socra, MTDS, bloobert; Alethea/UAP left out.

Still open:

- **Socra:** blind A/B voice test result (optional).
- **Private repos:** recruiters check repo/README; consider publishing one
  repo or a public README later (BRIEF §2).
- **Timeline** (`meta.timeline`) and every CV entry in `resume.json`: confirm.
- **Certificates:** which 3–5, with verification links (CV has none).
- **Media:** copy chosen files into `media/projects/<slug>/` (candidates in
  each case study's source comment).
- Hero positioning line (drafts come in P3; his text wins).
