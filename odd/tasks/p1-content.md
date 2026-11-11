# P1 — content

Phase P1 of `BRIEF.md` §8. Ends at a gate: Teo reviews facts and statuses.
Phase status lives in `PLAN.md`; this file is the ODD spec for P1 only.

## Specs

- S1: "P1 Content: `resume.json` (import), project files with verified facts and `TODO(owner)` gaps. **Gate:** Teo reviews facts and statuses."
- S2: "`content/resume.json` in **JSON Resume** schema, derived once from `resume.tex`, powers the site's CV section and timeline. Teo confirms every entry before publishing." / "Its facts (roles, dates, ownership, team sizes) are authoritative over the repo summaries in section 6." / "**Never publish the phone number.**"
- S3: "Verify every claim against the repo before writing it. **Never invent metrics.** Each case study cites its sources (repo paths, posts) in a hidden comment."
- S4: "Decided launch set: **three featured projects** — Socra, MTDS, bloobert. Everything else starts `hidden` and Teo may promote it later by changing `status` only."
- S5: "Projects as **case studies**, 3–5 featured: problem, constraints, the decision and why, *what Teo personally owned* in team projects, result, what he would change." / "Every featured project has problem, ownership, decision, result, links."
- S6: "When something requires Teo's writing (hero line, about, case-study "what I'd change"), draft options clearly marked as drafts and ask him to rewrite them in his own words; his text wins."
- S7: "**About**: two paragraphs + a short timeline of 4–6 milestones (from `resume.json`). **One** personal photo: childhood at the computer, as the origin anchor of the timeline."
- S8: "only 3–5 courses/certificates relevant to the positioning go in `resume.json` `certificates` (with a verification link when available)"
- S9: DEV posts for the writing section: Loci, Pricor, Dogear, Learning system (URLs in BRIEF.md §6).
- S10: Photo caption (L2): "2004. Where it started."

## Tasks

- T1 (S2, S7, S8, S10) `content/resume.json` from `resume.tex` + timeline + photo caption — inline — 4581853
- T2 (S3, S5, S6) research featured projects (socra, mtds, bloobert) — 3 × gentle-ai-explore (evidence-budget rule) — a467b07
- T3 (S3, S4) hidden stubs from verified sources only (L5) — inline — 6e35c8b
- T4 (S3–S6) write `content/projects/*.md` from the explorer evidence — gentle-ai-worker — e32d8dc
- T5 (S9) `content/writing.json` with verified titles/dates — inline — 5f3dd6f
- T6 (S1) gate summary for Teo; update PLAN.md — inline

## Log

- L1: "Great! Let's see 1. Update Node's global version 2. The photo caption could be something like "2004. Where it started." Start with the implementation of P1"
- L2: Photo caption from Teo: "2004. Where it started."
- L3: Sibling repos are read-only (BRIEF §7). Reading them is authorized by the brief's P1 scope and L1.
- L4: Explorers stalled at startup twice. Teo chose "Research inline, featured only", then said "Continue now, I've changed the profile"; one fresh explorer attempt succeeded.
- L5: Hidden stubs only where a verified source exists (emprender from CV; pricor, dogear from DEV posts). Alethea and UAP skipped.
- L6: MTDS repo contradicts several CV claims; case study uses repo wording with TODO(owner) for the gate. Parent fixed two worker errors (four-DOF -> three-DOF; unmeasured microcontroller claim).
