# P0 — scaffold

Phase P0 of `BRIEF.md` §8. Project-wide phase status lives in `PLAN.md`; this
file is the ODD spec for P0 only.

## Specs

- S1: "P0 `git init`, scaffold Astro + Cloudflare Workers config, `PLAN.md`, content model, empty pages."
- S2: "**Astro** (TypeScript, content collections) deployed on **Cloudflare Workers** with static assets (mostly static output; only add server code where needed). Config in `wrangler.jsonc`; deploy with Wrangler. Check the current Astro + Cloudflare adapter docs before scaffolding; do not rely on memory for these APIs."
- S3: "install it as a project dev dependency and run it through the package manager. Ask before any deploy or DNS change."
- S4: "`content/projects/<slug>.md` with frontmatter: `title, summary, status: featured | listed | hidden, order, role, team, ownership (what Teo did), stack[], links{repo, demo, post}, media[], year`. Changing `status` must be the only step needed to publish or hide a project."
- S5: "`.gitignore` already covers the known cases — keep it when scaffolding (merge, do not overwrite)." / "The badge also lives in the repo `README.md`; keep it there when scaffolding (merge, do not overwrite the existing README)."
- S6: "Keep `PLAN.md` with phases, tasks, status and the commit for each task; update it after every task so another agent can resume from it alone."

## Tasks

- T1 (S1, S5) git init, merge `.gitignore`, commit existing brief/inputs — inline — commit: see PLAN.md
- T2 (S2, S3) Astro 7 + `@astrojs/cloudflare` 14 + Wrangler dev dep, `wrangler.jsonc` — inline
- T3 (S4) content model: projects/writing collections, resume schema, `isPublished` rule + test — inline
- T4 (S1) empty pages for every IA section + base layout — inline
- T5 (S6) `PLAN.md` — inline

## Log

- L1: "I want you to read @BRIEF.md and start implementing P0"
- L2: Learning mode set to `log` (vault folder `Projects/Portfolio`).
- L3: `media/photos/2004_first-computer_01.jpg` has no APP1/Exif segment (checked 2026-11-11), safe to commit.
