# P3.7 — Teo's review round 2

Mobile header, voseo, personal tone, meta labels, the Socra table and the footer badge.
Branch `p3-layout` (not merged). Both languages change together; Spanish stays flagged BORRADOR.

## Specs

- S1 (L2): "Check that the mobile version is not very responsive". With L3, L4 ("I still don't like how de upper part buttons look, specially the email one" / "The problem where not the buttons, I liked them... The thing is that middle row with only the email in it"): the header buttons keep their look; on phones no row holds only the Copy email button, and on tablets no row holds only the theme and language buttons; no page scrolls sideways at 360 px.
- S2 (L5.1): "I want the Spanish version to use \"voseo\" instead of \"tuteo\". Check the sub routes too." Every Spanish string the site renders (UI dictionary, `content/i18n/es/site.json`, `content/projects-es/*.md`, `content/resume.es.json`, figures, 404, every `/es/` route) uses voseo (vos tenés, mirá, escribime) and never tuteo (tú tienes, mira, escríbeme). Usted is not used either.
- S3 (L5.2): "I believe that \"TAGS\" and \"STACK\" keywords would look better if they are slightly different from the rest." The project meta labels (TAGS, STACK, TEAM, REPO and their Spanish versions) are visually distinct from their values, on cards and case-study pages, in both themes.
- S4 (L5.3): "I want the tone to be more personal: I changed the /projects/socra/ page, make fixes if necessary and implement the same semi-formal style/tone to the rest of the pages." Teo's Socra edits stay; only their grammar and spelling are fixed. Every other page (home, the other case studies, how-I-build, about, writing, colophon, build-session, decoration, 404, resume intro text) moves to the same semi-formal first-person tone, in both languages. Facts, numbers and `TODO(owner)` markers do not change, and no claim is added.
- S5 (L5.4): "Check the table inside the \"Result\" in /projects/socra/, it isn't rendered correctly". Markdown tables in case studies render as styled tables (header row, rules, padding) and scroll sideways inside the text column on phones instead of overflowing.
- S6 (L5.5): "Remove the built with Gentle-AI badge, leave only the mention in the line \"Built with the gentle-ai harness and AI Hero skills\"". The footer no longer shows the badge image or its link; the credits line stays, in both languages.
- S7: P3 rules keep holding (no full email/phone in HTML, works without JS, one h1, tests, check and build pass).

## Tasks

| ID | Task | Specs | Route | Commit |
|---|---|---|---|---|
| T1 | Mobile/tablet header row order, swipeable phone nav, spacing fixes | S1, S7 | inline | |
| T2 | Footer badge removed | S6 | inline | |
| T3 | Distinct meta labels | S3 | inline | |
| T4 | Styled, scrollable case-study tables | S5 | inline | |
| T5 | Personal semi-formal tone, EN + ES, and voseo across every Spanish surface | S2, S4, S7 | worker | |
| T6 | Verify both languages (build, tests, screenshots, tuteo scan) | S1–S7 | inline | |

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
