# P3.7 — Teo's review round 2

Mobile header, voseo, personal tone, meta labels, the Socra table and the footer badge.
Branch `p3-layout` (not merged). Both languages change together; Spanish stays flagged BORRADOR.

## Specs

- S1 (L2): "Check that the mobile version is not very responsive". With L3, L4 ("I still don't like how de upper part buttons look, specially the email one" / "The problem where not the buttons, I liked them... The thing is that middle row with only the email in it"): the header buttons keep their look; on phones no row holds only the Copy email button, and on tablets no row holds only the theme and language buttons; no page scrolls sideways at 360 px.
- S2 (L5.1): "I want the Spanish version to use \"voseo\" instead of \"tuteo\". Check the sub routes too." Every Spanish string the site renders (UI dictionary, `content/i18n/es/site.json`, `content/projects-es/*.md`, `content/resume.es.json`, figures, 404, every `/es/` route) uses voseo (vos tenés, mirá, escribime) and never tuteo (tú tienes, mira, escríbeme). Usted is not used either.
- S3 (L5.2): "I believe that \"TAGS\" and \"STACK\" keywords would look better if they are slightly different from the rest." The TAGS and STACK rows read differently from the other meta rows (TEAM, REPO, ROLE): their values are keywords, so they render as small mono part labels instead of a comma-separated sentence, on cards and case-study pages, in both themes and languages.
- S4 (L5.3): "I want the tone to be more personal: I changed the /projects/socra/ page, make fixes if necessary and implement the same semi-formal style/tone to the rest of the pages." Teo's Socra edits stay; only their grammar and spelling are fixed. Every other page (home, the other case studies, how-I-build, about, writing, colophon, build-session, decoration, 404, resume intro text) moves to the same semi-formal first-person tone, in both languages. Facts, numbers and `TODO(owner)` markers do not change, and no claim is added.
- S5 (L5.4): "Check the table inside the \"Result\" in /projects/socra/, it isn't rendered correctly". Markdown tables in case studies render as styled tables (header row, rules, padding) and scroll sideways inside the text column on phones instead of overflowing.
- S6 (L5.5): "Remove the built with Gentle-AI badge, leave only the mention in the line \"Built with the gentle-ai harness and AI Hero skills\"". The footer no longer shows the badge image or its link; the credits line stays, in both languages.
- S8 (L11): "If the switch to first person could make those sentences sound like new claims, you can change them, but validate with another agent first". Each L9 sentence is checked by a separate read-only agent against repository evidence (resume, `odd/evidence/`, git history, case-study frontmatter); unsupported first-person claims are reworded in EN and ES so they claim no more than the evidence, keeping the first-person tone where it is supported.
- S9 (L14): "remove all the \"Draft\" text so I can deploy". No rendered page shows DRAFT, BORRADOR or TODO text; the DraftFlag component and the draft strings are gone.
- S7: P3 rules keep holding (no full email/phone in HTML, works without JS, one h1, tests, check and build pass).

## Tasks

| ID | Task | Specs | Route | Commit |
|---|---|---|---|---|
| T1 | Mobile/tablet header row order, swipeable phone nav, spacing fixes | S1, S7 | inline | `7a27f26` |
| T2 | Footer badge removed | S6 | inline | `ae7ff17` |
| T3 | Distinct meta labels | S3 | inline | `ae7ff17` |
| T4 | Styled, scrollable case-study tables | S5 | inline | `ae7ff17` |
| T5 | Personal semi-formal tone, EN + ES, and voseo across every Spanish surface | S2, S4, S7 | worker | `8d94979` |
| T6 | Verify both languages (build, tests, screenshots, tuteo scan) | S1–S7 | inline | verified (no commit) |
| T8 | Remove every DRAFT/BORRADOR flag and visible TODO(owner) text before deploy | S9 | inline | |
| T7 | Reword the L9 sentences that the first person turned into claims, after an independent agent checks each one against the evidence | S4, S8 | verify, then inline | `9bb9b7a` |

## Log

- L1: "Before continuing with P4, I want you to use /impeccable to improve this pages style. Check that the mobile version is not very responsive"
- L2: (same request, mobile part) "Check that the mobile version is not very responsive"
- L3: "I still don't like how de upper part buttons look, specially the email one"
- L4: "The problem where not the buttons, I liked them... The thing is that middle row with only the email in it"
- L5: "- I want the Spanish version to use \"voseo\" instead of \"tuteo\". Check the sub routes too.
- I believe that \"TAGS\" and \"STACK\" keywords would look better if they are slightly different from the rest.
- I want the tone to be more personal: I changed the /projects/socra/ page, make fixes if necessary and implement the same semi-formal style/tone to the rest of the pages.
- Check the table inside the \"Result\" in /projects/socra/, it isn't rendered correctly
- Remove the built with Gentle-AI badge, leave only the mention in the line \"Built with the gentle-ai harness and AI Hero skills\""
- L6: T1 was done and verified before L5 (screenshots at 360/390/768/800/1280, tests 73/73, check 0 errors); Teo moved on without objecting, so it is committed as this feature's first unit.
- L7: `wrangler.jsonc` and `.github/` have uncommitted changes that are not part of this work; they are left untouched and out of every commit.
- L8: S3 reading: "slightly different from the rest" names only TAGS and STACK, so the distinction applies to those two rows' keyword values, not to every label.
- L9: T5 worker notes for Teo (tone could imply facts): Pricor "I built… / I've tried it on public price lists from six distributors" (was impersonal); MTDS "I validated… / I showed… / I found a structural fix / I built a browser simulator" (from CV bullets, team of 3, Problem says "Our plan"); Bloobert "I defined success as using it myself every working day"; colophon/footer "I had an LLM copy edit the text"; decoration/home "I'll add a daily generated piece later" (mild commitment); Spanish Socra Result reading of "make sure I get it right"; Socra "What I'd change" bullets became "I'd measure… / I'd make…".
- L10: T6: tests 73/73, astro check 0 errors, build OK; rendered /es/ pages and 404 scanned for tuteo: only third-person "Elige" (the model picks) and "lee" (reads) remain; no sideways scroll at 360/1280 on /, /es/, /es/proyectos/pricor/, /es/sobre-mi/.
- L11: "If the switch to first person could make those sentences sound like new claims, you can change them, but validate with another agent first"
- L12: "Change the spanish hero line to \"De mis primeras teclas a Ingeniería en Sistemas\"" — ES heroLine set verbatim (no final period, as written).
- L13: T7 verifier (gentle-ai-verify) verdicts: Pricor, MTDS, Bloobert, daily piece and Socra "I'd…" SUPPORTED by odd/evidence and resume.json; OVERCLAIM fixed: LLM line back to "Copy edited with an LLM." (EN) / "Texto editado y traducido con un LLM, pendiente de revisión." (ES), resume 2026 timeline now says "in a team of three"; ES Socra Result realigned with Teo's EN ("bases de código o conceptos"); "El arnés que armé" -> "El arnés que uso" (gentle-ai is not Teo's harness). Left for Teo: "it works well on CPU" (his own edit; evidence says only "CPU works").
- L14: "remove all the \"Draft\" text so I can deploy"
- L15: T8 removed the Socra case-study line "TODO(owner): blind voice A/B result. The ratings sit in browser localStorage and the winner is only in a draft note, so it is not stated here." (and its Spanish twin) from the page; it stays open here for Teo. Unpublished dogear/emprender keep their TODO(owner) markers (never rendered).
