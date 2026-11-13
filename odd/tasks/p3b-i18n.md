# P3.5 — Spanish version (i18n)

Adds a Spanish version of the whole site before P4. Branch `p3-layout`
(continues P3, not merged). Language policy: `BRIEF.md` §3 (revised 2026-11-12).

## Specs

- S1 (L1): "I'm targeting both markets, that is why I want it to say Resume when the page languaje is English and CV when it's spanish". English UI says "Resume" (nav, page title, h1, "Resume (PDF)" link, URL `/resume/`); Spanish says "CV" (URL `/es/cv/`). `/cv/` must not 404 in English: redirect it to `/resume/`.
- S2 (L1): "I would like to change the policy set in BRIEF.md. I believe we should add a Spanish version of the page". Every English page has a Spanish counterpart under `/es/` (home, project pages, how I build with AI, writing, about, CV, colophon, build-session stub, decoration stub, 404). Hidden projects stay hidden in both languages.
- S3 (L2, "LLM translates, I review"): Spanish text is an LLM translation of the English copy in neutral Spanish (tú forms, no voseo, no regional slang). Every Spanish page shows a visible DRAFT flag ("BORRADOR — traducción a revisar por Teo") until Teo approves; facts and numbers unchanged from English; never invent content.
- S4 (L2, "Automatic redirect"): a visitor requesting `/` whose `Accept-Language` prefers Spanish over English (by q-value/order; `es`, `es-AR`, etc.) is redirected (302) to `/es/`, unless a `lang` cookie exists. The EN/ES switch on every page links to the counterpart page and sets the `lang` cookie (1 year, path `/`, SameSite=Lax) so the choice wins over detection. Only `/` redirects; deep links open as sent. The response carries `Vary: Accept-Language, Cookie`. Without a cookie and with an English or absent `Accept-Language`, `/` serves English (200). The decision is a pure function with tests.
- S5 (L2, URLs "English at /, Spanish at /es/"): English stays unprefixed; Spanish under `/es/` with Spanish slugs where natural (`/es/cv/`, `/es/como-construyo-con-ia/`, `/es/escritos/`, `/es/sobre-mi/`, `/es/colofon/`, `/es/como-se-construyo/`, `/es/decoracion/`, `/es/trabajo/<slug>/`). Each page has `<html lang>` set correctly, `<link rel="alternate" hreflang="en|es|x-default">` pairs, and canonical to itself.
- S6: UI strings live in one dictionary per language with identical keys (tested: no missing key in either language). Spanish project case studies, About, hero, essay, timeline and resume texts live in content files, not hard-coded in pages.
- S7: Everything from P3 still holds in both languages: no full email or phone in HTML, works without JS (the switch is a plain link; the cookie is set by JS when available and by the redirect endpoint otherwise is not required), reduced motion, WCAG AA, one h1, no horizontal overflow at 390 px. RSS stays English only.

## Tasks

| ID | Task | Specs | Route | Commit |
|---|---|---|---|---|
| T1 | i18n foundation: Astro i18n config, `src/i18n/` dictionaries + key-parity test, route map EN↔ES, Base with `lang`, hreflang, EN/ES switch; Resume/CV rename (`/resume/`, `/cv/` → `/resume/` redirect) | S1, S5, S6, S7 | worker | `5de6005` |
| T2 | Spanish pages and content: `/es/` routes for every page reusing components with a `lang` prop; Spanish content files (case studies, about, hero, essay, timeline, resume) translated with DRAFT flags | S2, S3, S6, S7 | worker (after T1) | `ef7d2b6` |
| T3 | Auto redirect on `/`: pure `pickLanguage` function + tests, server-rendered `/` (or middleware) on Cloudflare Workers, cookie from the switch, `Vary` header | S4 | worker (after T1, parallel with T2) | `6ff0b92` |
| T4 | Verify both languages | S1–S7 | verify | fixes `ee46e71` |
| T5 | PLAN.md + BRIEF §3 (BRIEF done in this doc's first commit) | — | inline | this commit |

## Log

- L1 (Teo, 2026-11-12): "- I like "How I build with AI" - I'm targeting both markets, that is why I want it to say Resume when the page languaje is English and CV when it's spanish - I would like to change the policy set in BRIEF.md. I believe we should add a Spanish version of the page"
- L2 (Teo, 2026-11-12): Spanish copy "LLM translates, I review (Recommended)"; language pick "Automatic redirect"; URLs "English at /, Spanish at /es/ (Recommended)"; timing "Now, before P4 (Recommended)".
- L3: Rename done first in `396b914` (`/how-i-build/`). Redirect scope chosen by the agent and told to Teo: home page only, cookie override; Teo may widen it.
- L4: T1 worker also edited src/scripts/rail.ts (outside its surfaces) to read rail labels from data- attributes; accepted.
- L5: T3 design: adapter emits an assets-only deploy config for static output, so an `astro:build:done` integration (astro.config.mjs) adds `main: src/worker/entry.ts` + ASSETS binding to dist/client/wrangler.json; `run_worker_first: ["/"]`. Deploy only after `pnpm build`. Local wrangler dev curl evidence: 200 EN, 302 for es header, cookie override both ways, deep links untouched. `// @ts-check` removed from astro.config.mjs (no @types/node).
- L6: T2 done: copy in content/i18n/{en,es}/site.json, projectsEs collection (translated fields only), resume.es.json overlay re-validated (no phone), shared page components in src/components/pages/. Spanish 404 parked as src/pages/es/_404.astro (Workers assets serve only root 404.html). English visible text diffed identical to the pre-T2 build. 67 tests.
- L7 (T4 verify): S1, S3–S7 pass; S2 partial: no 404 body was served (pre-existing: `not_found_handling` missing) and the rail said "Build" on /es/. Fixed in `ee46e71`: `not_found_handling: "404-page"`, root 404 carries a Spanish line, es/_404 removed, 'Construcción'. Re-checked with wrangler dev: /es/no-existe/ → 404 with the page body; Spanish / → 302. Not verified: Lighthouse, production Cloudflare, native Spanish read (Teo).
