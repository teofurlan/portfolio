# P3 — layout and all sections

Phase P3 of `PLAN.md` / `BRIEF.md` §8. Turns the chosen artboard
`design/portfolio-directions/08-exploded-index.html` into the real Astro site.
No deploy. Branch `p3-layout`.

## Specs

- S1 (PLAN P3 row 1): "Hero (Teo's line), featured cards, case-study pages, media gallery, Hardware filter (≥ 2 hardware projects)"
- S2 (PLAN P3 row 2): "How I work with AI essay + diagram; Writing + RSS; About + timeline; CV page; Contact"
- S3 (PLAN P3 row 3): "Footer/colophon: obfuscated email, self-hosted gentle-ai badge, AI Hero text credit, LLM copy-edit note"
- S4 (design source): the layout, tokens (both themes), type scale, rail, sheets, figures, footer and behaviours come from artboard 08 as polished. Carry over the P2 rules verbatim from `odd/tasks/p2-design.md`: "Theme rules", "Scroll fix rules"/scroll rules, "Interactive background rules" (S17 there). The artboard is the visual contract; do not redesign.
- S5 (L2, font): "IBM Plex Sans + Plex Mono" — self-hosted woff2 (no Google Fonts hotlink), `font-display: swap`, only the weights used, preload the main text face. System stacks stay as fallbacks.
- S6 (L2, RSS): "@astrojs/rss package" for the Writing feed (`/rss.xml`), items from `content/writing.json`, linked with `<link rel="alternate" type="application/rss+xml">`.
- S7 (BRIEF): "Links shown in hero and footer: **GitHub** (`github.com/teofurlan`), **LinkedIn** (`https://www.linkedin.com/in/teo-furlan`), **email** (`teofurlan03@gmail.com`, as `mailto:`, lightly obfuscated against scrapers), **DEV** (`dev.to/teo_furlan`), and **CV PDF**." Single source `src/data/site.ts`. "Contact one click away on every page."
- S8 (BRIEF): "Projects as **case studies**, 3–5 featured: problem, constraints, the decision and why, what Teo personally owned in team projects, result, what he would change." Featured = Socra, MTDS, bloobert by `status`/`order`; hidden projects never render or get a route. "**Never invent metrics.**"
- S9 (BRIEF): "Hardware presentation: project pages support a media gallery (photo, video, render, diagram) with captions; a 'Hardware' filter or tag appears automatically once two or more hardware projects exist." With today's content (1 hardware project) the filter must NOT render; tested by a pure function.
- S10 (BRIEF): "his harness (ODD workflow, learning vault, project exams, memory) as a short essay + diagram, linking the DEV post."
- S11 (BRIEF): "About = two short paragraphs." "two paragraphs + a short timeline of 4–6 milestones (from `resume.json`). **One** personal photo: childhood at the computer, as the origin anchor of the timeline. The other milestones (...) are text-only". Photo through the image pipeline (metadata stripped), shown ~280–360 px, no feathered edges.
- S12 (BRIEF): CV "rendered from `resume.json` + downloadable PDF generated at build." The PDF itself is P6; P3 renders the page and links the PDF path. "Never publish the phone number."
- S13 (BRIEF): badge "self-host the PNG instead of hotlinking, keep its aspect ratio, size it to fit the footer (it may be smaller than 220 px) ... AI Hero has no badge: credit it as a text link next to it." LLM note: "Copy edited with an LLM. The raw build conversation is below, in Spanish."
- S14 (BRIEF): "Lighthouse ≥ 95 in all categories on mobile, works without JS for all core content, `prefers-reduced-motion` respected, keyboard accessible, WCAG AA."
- S15 (owner input): Hero line and About paragraphs keep the artboard drafts with a visible DRAFT flag until Teo rewrites them; certificates stay empty (section hidden when empty); media stays `[]`. No placeholders invented.

## Tasks

| ID | Task | Specs | Route | Commit |
|---|---|---|---|---|
| T1 | Foundation: Plex fonts self-hosted, global tokens/CSS from 08, Base layout (head theme script, top bar, rail-capable shell, footer, drafting-grid fx, theme toggle, email obfuscation), `@astrojs/rss` added | S3–S7, S13, S14 | inline (single dependency unit) | |
| T2 | Home + work: hero (draft line), two legs, parts list, featured sheets with figures, build/ai/writing/about teasers, rail; `/work/[slug]/` case-study page with media gallery component; hardware-filter function + test | S1, S4, S8, S9, S15 | worker (after T1) | |
| T3 | Sections: `/how-i-work/` essay + diagram, `/writing/` + `/rss.xml`, `/about/` + timeline + photo, `/cv/` from resume.json, contact, `/colophon/` | S2, S6, S10–S13, S15 | worker (after T1, parallel with T2) | |
| T4 | Verify: build, tests, no-JS, reduced motion, contrast, keyboard, hidden projects absent, phone absent | S1–S15 | verify | |
| T5 | PLAN.md P3 rows updated | — | inline | |

## Log

- L1 (Teo, 2026-11-12): "I want to continue with P3"
- L2 (Teo, 2026-11-12): display font "IBM Plex Sans + Plex Mono (Recommended)"; RSS "@astrojs/rss package (Recommended)".
- L3: Exploration (subagent) confirmed: only `mtds` is tagged hardware; certificates `[]`; all project `media: []`; neither `@astrojs/rss` nor font packages installed; 8 vitest tests pass via `pnpm test`.
