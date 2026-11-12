# P3.6 — Teo's review round 1

Copy, naming and project changes from Teo's first look at the bilingual site.
Branch `p3-layout` (not merged). Both languages change together; the Spanish
copy stays flagged BORRADOR, English drafts stay DRAFT.

## Specs

- S1 (L1.1): "\"Desde la infancia frente a un teclado hasta agentes y brazos robóticos.\" should be more like \"De nene con teclado a Ingeniero en Sistemas\". Also, the photo should be next to that phrase for it to make sense." With L2 (degree finishes 2027-07): ES hero line "De nene con teclado a futuro Ingeniero en Sistemas." (Teo's own wording, keep "nene"); EN "From a kid at a keyboard to a Systems Engineer in the making." The 2004 photo sits next to the hero line on the home page (both languages, small, .print frame, same alt). On the home About section the 2004 timeline entry becomes text-only so the photo appears once per page; the /about/ page keeps the photo in its timeline.
- S2 (L1.2): "\"Work\" could be just \"Projects\". Also, instead of Brazo robótico quirúrgico MTDS we can say Brazo Rbótico MTDS only." Section/nav/rail/parts list label "Projects" / "Proyectos"; URLs `/projects/<slug>/` and `/es/proyectos/<slug>/` (old `/work/*` and `/es/trabajo/*` 301 to the new ones). MTDS title "MTDS robot arm" / "Brazo robótico MTDS" everywhere it is shown (the case study body may still say what it is for).
- S3 (L1.3): "I believe that pricor would be a better project than bloobert for the page". With L2: Pricor becomes featured (order 3) with a real case study in both languages, written from read-only research of `C:/Users/teofu/Code/ideaslab/pricor` and its DEV post (evidence in `odd/evidence/pricor.md`), `TODO(owner)` for anything unverified, never invented metrics, plus its own figure (FIG 1.3). Bloobert becomes `listed`: off the home sheets, page kept, reachable from a short "More projects" / "Más proyectos" list on the home page.
- S4 (L1.4): "I would not say that EmprendER was y first real client. IW could say something like \"Built serveral projects during college, one of them is emprender...\"" Remove every "first real client" claim (About paragraph, timeline 2024 entry, both languages, `content/resume.json` meta.timeline and its Spanish overlay). New wording: EN "During college I built several projects; one of them is EmprendER, an entrepreneurship platform." / ES "Durante la facultad construí varios proyectos; uno de ellos es EmprendER, una plataforma para emprendedores." Timeline 2024: "Builds several projects in college, among them EmprendER" / "Construye varios proyectos en la facultad, entre ellos EmprendER".
- S5 (L1.5): "Hardware: I would loke to say something like Although I primarily develop software, I am very interested in robotics and IoT, and I believe they are the future." Hero hardware leg: EN "I mainly build software, but I'm very interested in robotics and IoT; I believe they are the future." / ES "Aunque me dedico principalmente al software, me interesan mucho la robótica y el IoT, y creo que son el futuro."
- S6 (L1.6): "Sections 2, 3 and 4 have all different link buttons, is this intentional?" Answer: no. The closing link of sections 2 (build), 3 (AI) and 4 (writing) uses the same secondary button style (`.btn`, not solid); RSS stays a small text link.
- S8 (L3): "Socra is thought for any agent or harness, don't say \"Claude Code\"". No "Claude Code" anywhere in rendered pages (Socra summary, ownership, case study, About text, both languages); say "any coding agent or harness" / "cualquier agente o arnés de programación".
- S9 (L5): "the footer goes to the middle of the page" on short pages: the footer sits at the bottom of the viewport when content is shorter than the screen.
- S10 (L5): "There is not pdf for the resume/cv yet". Both supplied PDFs print the phone number, which BRIEF forbids publishing; PDF links stay hidden until phone-free files exist (EN /resume.pdf, ES /es/cv.pdf).
- S7: P3/P3.5 rules keep holding in both languages (no full email/phone in HTML, works without JS, one h1, no 390 px overflow, hreflang/switch point to the renamed routes, hidden projects never rendered, tests/check/build green).

## Tasks

| ID | Task | Specs | Route | Commit |
|---|---|---|---|---|
| T1 | Copy and naming: hero line + photo in hero, Projects rename + URL moves with redirects, MTDS title, EmprendER wording, hardware leg, consistent buttons | S1, S2, S4, S5, S6, S7, S8 (site.json) | worker | `f73dc13` |
| T2 | Pricor research (read-only) → `odd/evidence/pricor.md` | S3 | explore (parallel with T1) | |
| T3 | Pricor case study EN+ES + FIG 1.3, featured order 3; bloobert `listed` + "More projects" list | S3, S7 | worker (after T1, T2) | `0d78f5e` |
| T6 | Footer pinned to the bottom on short pages (body flex column) | S9 | inline | `8100e09` |
| T7 | PDF link per language, hidden until a phone-free file exists (`site.links.pdf`) | S10 | inline | `8100e09` |
| T8 | Phone-free Resume (EN) / CV (ES) PDFs in public/ | S10 | blocked: Teo exports them | |
| T4 | Verify | S1–S7 | verify | |
| T5 | PLAN.md | — | inline | |

## Log

- L1 (Teo, 2026-11-12): "I like how it's going. This are some things I notice: 1. \"Desde la infancia frente a un teclado hasta agentes y brazos robóticos.\" should be more like \"De nene con teclado a Ingeniero en Sistemas\". Also, the photo should be next to that phrase for it to make sense. 2. \"Work\" could be just \"Projects\". Also, instead of Brazo robótico quirúrgico MTDS we can say Brazo Rbótico MTDS only. 3. I believe that pricor would be a better project than bloobert for the page 4. I would not say that EmprendER was y first real client. IW could say something like \"Built serveral projects during college, one of them is emprender...\" 5. Hardware: I would loke to say something like Although I primarily develop software, I am very interested in robotics and IoT, and I believe they are the future. 6. Sections 2, 3 and 4 have all different link buttons, is this intentional?"
- L2 (Teo, 2026-11-12): hero "\"...a futuro Ingeniero en Sistemas\" (Recommended)"; Pricor source "Yes, read it" (C:/Users/teofu/Code/ideaslab/pricor, read-only); bloobert "Keep its page, off the home (Recommended)".
- L3 (Teo, 2026-11-12): "Something else, Socra is thought for any agent or harness, don't say \"Claude Code\"". Parent edited content/projects{,-es}/socra.md; T1 worker steered to fix site.json.
- L4 (Teo, 2026-11-12): "I don't like this line in Hardware: Hoy: el brazo robótico MTDS, remove it or replace it" → removed in both languages (S5 updated; T1 worker steered).
- L5 (Teo, 2026-11-12): screenshot of /cv.pdf 404 with the footer mid-screen: \"There is not pdf for the resume/cv yet and the footer goes to the middle of the page. You can check the .pdfs here C:\Users\teofu\OneDrive\Documentos\CV\cv_teo-furlan.pdf C:\Users\teofu\OneDrive\Documentos\CV\resume_teo-furlan.pdf\". Both PDFs print the phone in the header; no LaTeX on the machine.
- L6 (Teo, 2026-11-12): PDFs: "I export phone-free PDFs (Recommended)". Teo removes the phone, adds GitHub, exports both; then the parent puts them at /resume.pdf and /es/cv.pdf and sets site.links.pdf.
- L7: T4 independent verifier failed to start ("child exit unconfirmed; capacity quarantined"): unavailable, not retried. Inline checks instead: test 68, check 0 errors, build green; dist has /projects/* and /es/proyectos/* (4 each), 12 old-path 301 lines in _redirects, no .pdf link, no "Claude Code"/"first real client"/"primer cliente", ES hero and hardware text exact; every number in pricor.md (EN/ES) matches odd/evidence/pricor.md; no distributor names, paths or emails. NOT verified: browser rendering (hero photo layout, FIG 1.3 at 390 px, footer at viewport bottom, overflow, contrast), redirects against wrangler dev.
