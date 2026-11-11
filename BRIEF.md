# Portfolio brief — Teo Furlan

> Build brief for the agent that implements this site. Drafted in a separate
> direction session (research + decisions with the owner). Read it fully before
> writing anything. Everything marked `TODO(owner)` must be asked, never invented.
> Owner-provided data lives in `inputs/` (checklist in `inputs/README.md`) and
> `media/`; read the checklist first and ask for any unchecked item.
>
> The repository is **public**. Never commit private inputs, raw transcripts,
> secrets or photos with GPS metadata; `.gitignore` already covers the known
> cases — keep it when scaffolding (merge, do not overwrite).

## 1. Goal

A personal portfolio + CV site for **Teo Furlan**, positioned on two legs:
**software with AI / agents** and **hardware** (robotics, embedded). The site
must make both visible from the hero onward, not hide hardware as a footnote.
The hardware side will grow (real photos of the robot arm, other hardware
projects later), so its presentation must scale from renders/videos to photos.
It must pass the recruiter "10-second test": who he is, what he builds, proof it
is real, how to reach him. Original and pleasant, but never flashy or
"vende humo": substance first, motion second.

Domain: **teofurlan.com**, registered with Cloudflare Registrar (same account
as hosting). Until connected, use the `*.workers.dev` URL.

## 2. Audience and what they check (research synthesis, 2026 sources)

- Recruiters / hiring managers skim 10–60 s: headline + one featured project +
  its repo/README + recent activity. Any failure filters you out.
- Projects as **case studies**, 3–5 featured: problem, constraints, the decision
  and why, *what Teo personally owned* in team projects, result, what he would
  change. Output without reasoning is the #1 weakness.
- Polished UI is a commodity now; slow or blocking animations count against.
- About = two short paragraphs. Contact one click away on every page.
- Saturated, avoid as the main idea: terminal/ASCII-everything aesthetics and
  "chat with my resume" bots.
- Differentiator aligned with industry: showing a real **coding-agent session**
  (YC S26 applications ask for "a coding agent session you're particularly
  proud of"). This site does that natively (section 5.3).

## 3. Language policy (decided)

- Site copy in **English**. Teo writes drafts; an LLM may fix grammar only,
  keeping his voice. Add a short honest note in the footer or colophon:
  "Copy edited with an LLM. The raw build conversation is below, in Spanish."
- The build transcript is shown **in its original Spanish**, with an optional
  precomputed English translation side by side (toggle). Never rewrite his
  messages; translation is clearly labelled as machine translation.
- Do not build a full bilingual site (out of scope for v1).

## 4. Stack (decided)

- **Astro** (TypeScript, content collections) deployed on **Cloudflare
  Workers** with static assets (mostly static output; only add server code
  where needed). Config in `wrangler.jsonc`; deploy with Wrangler. Check the
  current Astro + Cloudflare adapter docs before scaffolding; do not rely on
  memory for these APIs.
- Interactive pieces as Astro islands (framework of your choice, keep it light).
- Daily decoration: a Worker **Cron Trigger** calls **Workers AI** (a small
  free-tier model; confirm current free limits and which models need the paid
  plan), validates the output and stores it in **KV** (latest + archive index;
  use R2 only if pieces outgrow KV). The page reads the cached piece; a static
  fallback ships with the build.
- Wrangler is authenticated on Teo's machine (`~/.wrangler/config` exists) but
  the binary is not on PATH: install it as a project dev dependency and run it
  through the package manager. Ask before any deploy or DNS change.
- Targets: Lighthouse ≥ 95 in all categories on mobile, works without JS for all
  core content, `prefers-reduced-motion` respected, keyboard accessible, WCAG AA.

## 5. Information architecture

1. **Hero**: name, one-line positioning covering software + AI/agents +
   hardware (draft options, Teo picks and rewrites), primary CTAs. No splash
   screens.
   Links shown in hero and footer: **GitHub** (`github.com/teofurlan`),
   **LinkedIn** (`https://www.linkedin.com/in/teo-furlan`), **email**
   (`teofurlan03@gmail.com`, as `mailto:`, lightly obfuscated against scrapers), **DEV**
   (`dev.to/teo_furlan`), and **CV PDF**. Add an RSS feed for the writing
   section. Do not add other networks unless Teo is active there.
2. **Featured work**: case-study cards → detail pages (section 6).
3. **How this site was built**: the agent-session replay (5.3).
4. **How I work with AI**: his harness (ODD workflow, learning vault, project
   exams, memory) as a short essay + diagram, linking the DEV post.
5. **Writing**: DEV articles (list in section 6).
6. **About**: two paragraphs + a short timeline of 4–6 milestones (from
   `resume.json`). **One** personal photo: childhood at the computer, as the
   origin anchor of the timeline. The other milestones (technical secondary
   school, university in systems engineering, ...) are text-only; do not use
   stock images or placeholders for them. Optional later: a current photo (e.g.
   with the robot arm) as a "now" bookend, if Teo adds one. Originals live in `media/photos/` with
   captions and alt text in `media/photos/photos.yaml`; naming and privacy
   rules in `media/README.md` (strip EXIF/GPS on build). Project media lives in
   `media/projects/<slug>/`. If files are missing, ask Teo.
7. **CV**: rendered from `resume.json` + downloadable PDF generated at build.
   No separate courses section: only 3–5 courses/certificates relevant to the
   positioning go in `resume.json` `certificates` (with a verification link
   when available); everything else stays on LinkedIn.
8. **Contact** + footer/colophon: stack, models used, how the decoration works,
   and credit for the tooling: built with the **gentle-ai** harness and the
   **AI Hero** skills (links in `inputs/credits.yaml`). The colophon links
   to section 3 so the tooling credit and the raw transcript sit together.
   Show the official **"Built with Gentle-AI" badge** (in `credits.yaml`) in
   the footer, linking to the gentle-ai repo: self-host the PNG instead of
   hotlinking, keep its aspect ratio, size it to fit the footer (it may be
   smaller than 220 px), and check it reads well on the chosen palette. AI Hero
   has no badge: credit it as a text link next to it. The badge also lives in
   the repo `README.md`; keep it there when scaffolding (merge, do not
   overwrite the existing README).

### 5.1 Content model

- `content/projects/<slug>.md` with frontmatter:
  `title, summary, status: featured | listed | hidden, order, role, team,
  ownership (what Teo did), stack[], links{repo, demo, post}, media[], year`.
  Changing `status` must be the only step needed to publish or hide a project.
- CV source: `inputs/cv/resume.tex` (git-ignored; Teo's ATS-tuned LaTeX CV;
  read `inputs/cv/README.md`). Its facts (roles, dates, ownership, team sizes)
  are authoritative over the repo summaries in section 6.
- `content/resume.json` in **JSON Resume** schema, derived once from
  `resume.tex`, powers the site's CV section and timeline. Teo confirms every
  entry before publishing. LinkedIn cannot be synced via API, so no LinkedIn
  import script is needed unless something is missing from the CV.
- Downloadable PDF: compile a **public variant** of `resume.tex` with the
  phone number removed and the GitHub link added (the CV omits GitHub because
  the code was private; this public repo changes that). **Never publish the
  phone number.** Keep the LaTeX layout Teo already tuned for ATS.

### 5.2 Visual direction

- Theme: **personal story**. Thread: from a kid at a computer to an engineer
  who builds agents and robots. Let the aesthetic come from his real work
  (engineering drawings, kinematic diagrams, annotated notes), not from generic
  dev clichés.
- Before building UI, propose **2–3 distinct directions** (static HTML artboards
  or screenshots) and stop for Teo to choose. Restraint: one typeface pairing,
  a small palette, motion only where it explains something.

### 5.3 "How this site was built" — session replay (centerpiece)

- Source: the JSONL transcript of the **build session(s)** of this site
  (the session running this brief). Keep every session's transcript; do not
  delete or compact them away. Locate the harness's session files and copy them
  into `transcripts/raw/` (git-ignored).
- `scripts/redact.ts`: removes secrets, tokens, emails, absolute local paths,
  hostnames/IPs; outputs `transcripts/public/*.json`. Fails the build if a
  secret pattern remains. Teo reviews the redacted output before publish.
- Curation without rewriting: group into **chapters** (title + time range),
  collapse tool calls/diffs by default (expandable), mark highlights. User
  messages are never edited; omissions are shown as "[n steps collapsed]".
- Player: autoplays like a video (typing/streaming effect, readable speed),
  progress bar with chapters, play/pause, speed control. Any click, scroll or
  key on the player **pauses it and switches to a full browsable transcript**
  at that point. Reduced-motion → starts paused as a static transcript.
- Show metadata: model(s), dates, number of turns, tool calls, files changed.
- Spanish original; optional English translation column (precomputed at build,
  labelled).
- Reference tools for format ideas (do not depend on them unless useful):
  `claude-replay`, `yoavf/ai-sessions`, ThreadCast, SpecStory.

### 5.4 AI-generated decoration (decided: daily + cached)

- A Cron Trigger runs once a day, asks a cheap model for a decorative piece
  in a **constrained format** (ASCII text grid of fixed size, or SVG validated
  against a strict allowlist of elements/attributes, no scripts, no external
  refs). Validate, sanitize, store; on any failure keep yesterday's piece.
- Visitors never trigger model calls. No per-visit cost, no abuse surface.
- Show provenance next to it: "Generated today by `<model>` · prompt ·
  archive". Keep an archive page of past pieces.
- Seed the prompts from his work (e.g. robot arm silhouettes, kinematic chains,
  book highlights, sound waves) so it relates to the projects.
- Optional, later: in-browser generation with Chrome's Prompt API when
  available, falling back to the daily piece.

## 6. Projects (candidates; Teo confirms the final set)

Verify every claim against the repo before writing it. **Never invent metrics.**
Each case study cites its sources (repo paths, posts) in a hidden comment.

Decided launch set: **three featured projects** — Socra, MTDS, bloobert.
Everything else starts `hidden` and Teo may promote it later by changing
`status` only.

| Project | Path | Status | Why / notes |
|---|---|---|---|
| socra / socra-voice-lab | `../ideaslab/socra`, `../ideaslab/socra-voice-lab` | **featured** | AI/agents leg. Voice AI, benchmarks, blind A/B tests, demo video in `../share/drafts/2026-11-socra/` |
| MTDS robot arm (+ `robot-arm` firmware) | `../mtds-brazo-robot` | **featured** | Hardware leg. IK engine checked against CAD, software RCM controller, demo video, surgery congress. Team of 3: state Teo's ownership. Media slots ready for real photos later |
| bloobert | `../ideaslab/bloobert` | **featured** | Solo. Tauri 2 + Rust desktop app, procedural sound; bridges software craft and playful product |
| Agent harness (ODD, learning vault) | `../odd`, DEV post | section "How I work with AI" | Pairs with the replay; not a project card |
| Dogear | `../ideaslab/dogear` | hidden (appears via its DEV post) | Not published as a project until Teo improves it; a paid domain is not a reason to feature it |
| Pricor | `../ideaslab/pricor` | hidden (appears via its DEV post) | Strong AI case. Teo will polish it first, then promote it to featured |
| Alethea | `../Alethea` | hidden | Production team system (Elixir/OTP). Candidate to promote; if shown, state exactly what Teo owned |
| Loci | DEV post | writing only | Hacktoberfest AI challenge W1 |
| Delphi → PostgreSQL static analyzer | `../UAP` | hidden | If shown: architecture only; **no institutional data, names or schemas** |
| emprender | `../emprender` | hidden | Real municipal client. Per CV: largest of four contributors (353 of 766 commits), sole developer since Mar 2026, closed a server-side admin access-control gap, built the Playwright suite. Candidate to promote |

Hardware presentation: project pages support a media gallery (photo, video,
render, diagram) with captions; a "Hardware" filter or tag appears
automatically once two or more hardware projects exist.

Excluded: `Python/macflood.py`, `scratch_x`, `sherpa-onnx` (third-party clone),
`ai-free-human-social` (idea only), coursework (`Sistemas de Tiempo Real`,
`str-*`) except at most one "coursework" line in the CV.

DEV posts (writing section):
- Loci — https://dev.to/teo_furlan/loci-a-walk-you-have-to-remember-14lf
- Pricor — https://dev.to/teo_furlan/pricor-local-ai-reads-the-supplier-spreadsheet-an-exact-engine-does-the-math-3915
- Dogear — https://dev.to/teo_furlan/i-highlight-paper-books-a-small-open-model-types-my-quotes-while-i-sleep-4197
- Learning system — https://dev.to/teo_furlan/how-i-built-a-learning-system-inside-my-ai-coding-workflow-using-obsidian-fbp

## 7. Non-goals (v1)

- No "chat with my resume" bot. No live per-visit LLM calls.
- No full bilingual site. No CMS. No analytics beyond Cloudflare Web Analytics (cookieless).
- No fake numbers, testimonials or logos.
- Do not modify sibling project repos; read only.

## 8. Working method

The site may be finished across several sessions or models. Make that safe:

- Keep `PLAN.md` with phases, tasks, status and the commit for each task;
  update it after every task so another agent can resume from it alone.
- Work in phases and **stop at each gate** for Teo's decision:
  - P0 `git init`, scaffold Astro + Cloudflare Workers config, `PLAN.md`, content model, empty pages.
  - P1 Content: `resume.json` (import), project files with verified facts and
    `TODO(owner)` gaps. **Gate:** Teo reviews facts and statuses.
  - P2 Design directions (2–3). **Gate:** Teo picks one.
  - P3 Layout + all sections with real content, responsive, accessible.
  - P4 Session replay (redaction → curation → player). **Gate:** Teo reviews
    redacted transcript before it is public.
  - P5 Daily decoration (cron, validation, provenance, archive).
  - P6 Performance/a11y pass, PDF CV, OG images, deploy, domain.
    **Gate:** Teo approves publishing.
- Small reviewable commits (Conventional Commits). Tests for the scripts that
  can break silently: redaction (must catch secrets), LinkedIn import, SVG/ASCII
  validator.
- When something requires Teo's writing (hero line, about, case-study "what I'd
  change"), draft options clearly marked as drafts and ask him to rewrite them in
  his own words; his text wins.

## 9. Acceptance criteria

- A recruiter on mobile understands role, best project and contact in < 10 s.
- Every featured project has problem, ownership, decision, result, links.
- Replay autoplays, pauses on interaction into a browsable transcript, contains
  no secrets or local paths, and shows the original Spanish.
- Daily piece updates without visitor-triggered model calls and degrades to the
  previous piece on failure.
- Lighthouse ≥ 95 mobile; core content readable without JS.
- `PLAN.md` reflects the true state at the end of every session.
