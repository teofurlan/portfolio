# P2 — design directions

Phase P2 of `BRIEF.md` §8. Ends at a gate: Teo picks one direction. Each
direction is one self-contained HTML artboard under `design/portfolio-directions/`.

## Specs

- S1: "Before building UI, propose **2–3 distinct directions** (static HTML artboards or screenshots) and stop for Teo to choose. Restraint: one typeface pairing, a small palette, motion only where it explains something."
- S2: "Theme: **personal story**. Thread: from a kid at a computer to an engineer who builds agents and robots. Let the aesthetic come from his real work (engineering drawings, kinematic diagrams, annotated notes), not from generic dev clichés."
- S3: "positioned on two legs: **software with AI / agents** and **hardware** (robotics, embedded). The site must make both visible from the hero onward, not hide hardware as a footnote."
- S4: "It must pass the recruiter "10-second test": who he is, what he builds, proof it is real, how to reach him. Original and pleasant, but never flashy or "vende humo": substance first, motion second."
- S5: "Saturated, avoid as the main idea: terminal/ASCII-everything aesthetics and "chat with my resume" bots."
- S6: "Targets: Lighthouse ≥ 95 in all categories on mobile, works without JS for all core content, `prefers-reduced-motion` respected, keyboard accessible, WCAG AA."
- S7: "**One** personal photo: childhood at the computer, as the origin anchor of the timeline. The other milestones (...) are text-only; do not use stock images or placeholders for them." Photo treatment (media/photos/photos.yaml): "Authentic, no generative AI enhancement or upscaling. Show it small (roughly 280-360 px wide on desktop), optionally cropped toward the child and keyboard. Allowed: ... a print-like frame or a subtle palette-matched treatment chosen in P2. Avoid feathered/blurred edges."
- S8: "Show the official **"Built with Gentle-AI" badge** ... in the footer, linking to the gentle-ai repo: ... keep its aspect ratio, size it to fit the footer (it may be smaller than 220 px), and check it reads well on the chosen palette. AI Hero has no badge: credit it as a text link next to it."
- S9: "Contact one click away on every page." Links: GitHub, LinkedIn, email (lightly obfuscated), DEV, CV PDF.

- S10 (L4): "I like the "Drafting sheet" style, but it gives the arm too much importance for my taste and the size of the project. Let's consider a similar approach but more general."
- S11 (L4): "Lab notebook is too simple, so is "Two legs" is as well. Propose more and different options."
- S12 (L4): "I would like it to have some kind of interaction with the scroll if it's appropriate"

- S13 (L6): "they all feel too bright and washed out"; themes per L7: "Follow system + toggle".
- S14 (L7): combine 04 Drawing set + 05 Exploded view.

- S15 (L8): "Keep only the 'Cover and sheets' and 'Exploded index' versions, but polish them a bit"
- S16 (L8): "fix the scroll effect, as it currently isn't showing up in either of them"
- S17 (L8): "I'd like an interactive background effect where it reacts when the mouse hovers over it"

## Interactive background rules (S17)

- Same effect in both artboards: the page background is a faint drafting grid; under the mouse pointer the grid lines near the cursor brighten in a soft circle (radial mask, about 220 px), and a thin drafting crosshair with a small X/Y coordinate readout in monospace follows the pointer. It is the drawing language reacting to the reader, not decoration for its own sake.
- Behind all content (`pointer-events: none`, `z-index` below content); never lowers text contrast; never moves layout.
- Only for `(hover: hover) and (pointer: fine)`. Touch devices, `prefers-reduced-motion: reduce` and no-JS get the static faint grid only. The crosshair hides when the pointer leaves the window or is over a link/button, and while the user types.
- Implementation: one `pointermove` listener (passive) that writes `--mx`/`--my` CSS custom properties in a `requestAnimationFrame`; the glow is a `mask-image: radial-gradient(...)` on a grid layer. No canvas, no per-frame layout reads.
- Works in both themes (grid colour from the theme tokens).

## Scroll fix rules (S16)

- Teo's machine: Windows animations are ON (`ClientAreaAnimation=True`) and the default browser is Chrome, so reduced motion and missing support are NOT the cause; the effects are broken.
- Diagnose by actually scrolling: launch the installed Chrome headless with remote debugging from a script in the OS temp dir (Node 22 has a global `WebSocket` for CDP), scroll to several positions (`window.scrollTo`), and read computed values (`getComputedStyle(el).transform`, `strokeDashoffset`, the title block text, `aria-current`) plus screenshots at each position. Record before/after values in the report.
- The page must also work inside the design canvas, where each artboard is shown in an iframe: test the file directly and inside a plain iframe (1440×900).
- Keep the S12 rules (progressive enhancement, reduced motion shows the final state). If CSS scroll-driven animation is unreliable for an element, drive it from the IntersectionObserver/scroll script instead.

## Theme rules (S13)

- Two themes from one set of CSS custom properties: dark "blueprint" (deep blue-ink ground, light line work; not pure black, not neon) and light "paper" (warmer and deeper than round 1, near-black ink; meaningful lines and hairlines at least 3:1, no pale grey hairlines).
- Default follows `prefers-color-scheme`. A header toggle (a real `<button>` with `aria-pressed` and a visible label) overrides it and stores the choice in `localStorage`; a tiny inline script in `<head>` applies the stored choice before first paint (no flash). Without JS the page follows the OS setting and the toggle is hidden.
- Both themes pass WCAG AA (text at least 4.5:1; meaningful lines and controls at least 3:1). The badge sits on a dark surface in both themes.

## Scroll interaction rules (S12)

- The scroll effect must explain something (story progress, how a system works), never decorate for its own sake, and never block reading or hijack scrolling (no scroll-jacking, no pinned sections taller than one viewport, no snap).
- Progressive enhancement: prefer CSS scroll-driven animations (`animation-timeline: view()` / `scroll()`) inside `@supports (animation-timeline: view())`; a small inline script with IntersectionObserver is allowed as fallback. Without JS or support, the page shows the finished, fully readable state.
- `@media (prefers-reduced-motion: reduce)`: no scroll animation at all; final state shown.
- Animate only transform, opacity, stroke-dashoffset. No layout-shifting animations.

## Real links (now known)

- Socra repo: https://github.com/teofurlan/socra (public). MTDS and bloobert: no repo link (private).
- Socra post: https://dev.to/teo_furlan/i-wanted-my-coding-agent-to-examine-me-out-loud-so-i-built-a-local-voice-layer-for-it-2ni4
- Learning system post: https://dev.to/teo_furlan/how-i-built-a-learning-system-inside-my-ai-coding-workflow-using-obsidian-fbp
- Loci: https://dev.to/teo_furlan/loci-a-walk-you-have-to-remember-14lf · Pricor: https://dev.to/teo_furlan/pricor-local-ai-reads-the-supplier-spreadsheet-an-exact-engine-does-the-math-3915 · Dogear: https://dev.to/teo_furlan/i-highlight-paper-books-a-small-open-model-types-my-quotes-while-i-sleep-4197
- AI Hero: https://www.aihero.dev · gentle-ai: https://github.com/Gentleman-Programming/gentle-ai · CV: /cv.pdf · Build session: /build-session/ · Colophon: /colophon/ · Decoration archive: /decoration/

## Shared content (use verbatim; never invent anything else)

- Name: Teo Furlan. Location: Entre Ríos, Argentina (UTC−3), open to remote.
- Hero line: show it inside a visible "DRAFT — Teo rewrites" marker. Draft options (pick one per artboard, different in each):
  1. "I build software with AI agents, and the hardware they can move."
  2. "Agents in software. Motors in hardware. One engineer in between."
  3. "From a kid at a keyboard to agents and robot arms."
- Links: GitHub github.com/teofurlan · LinkedIn linkedin.com/in/teo-furlan · DEV dev.to/teo_furlan · Email (show as "teofurlan03 [at] gmail.com" style or a "Copy email" button) · CV (PDF).
- Featured work, in this order (summaries verbatim):
  1. **Socra** — "A local, private voice layer for Claude Code: the model speaks, you answer out loud." Tags: AI, agents, voice. Stack: Python, faster-whisper, Piper TTS, MCP, React. Solo, 2026. Links: GitHub repo, DEV post.
  2. **MTDS surgical robot arm** — "A low-cost robot arm for laparoscopic surgery training by teleoperation, built around a remote center of motion." Tags: hardware, robotics. Stack: C++, ESP32, Arduino Mega, Python, Fusion 360. Team of 3, 2026. Proof line: "Inverse kinematics validated against the CAD model to 3 micrometres."
  3. **bloobert** — "A translucent jelly pet that melts while you sit at your computer and regains its shape when you take an active break." Tags: desktop, Rust. Stack: Tauri 2, Rust, TypeScript, WebAudio. Solo, 2026.
- How this site was built: "The whole build conversation with the coding agent, replayed. Original Spanish, with an English translation." CTA "Watch the build session".
- How I work with AI: "A harness around the agent: a workflow that tracks every task, a learning vault, project exams and memory." Link to the DEV post "How I Built a Learning System Inside My AI Coding Workflow (Using Obsidian)".
- Writing (DEV, date): Loci: A Walk You Have to Remember (2026-10-12) · Pricor: local AI reads the supplier spreadsheet, an exact engine does the math (2026-10-19) · I highlight paper books. A small open model types my quotes while I sleep (2026-10-25) · How I Built a Learning System Inside My AI Coding Workflow (Using Obsidian) (2026-10-30).
- About timeline: 2004 "2004. Where it started." (the photo) · 2016 Technical secondary school: electromechanical equipment and installations · 2022 Information Systems Engineering, Universidad Adventista del Plata · 2024 First real client: EmprendER, an entrepreneurship platform · 2026 Software developer at the university; robot arm for laparoscopic surgery training.
- About paragraphs: two short paragraphs marked "DRAFT — Teo rewrites", grounded only in the facts above.
- Footer: badge image + "Built with the gentle-ai harness and AI Hero skills" (AI Hero as text link) · "Copy edited with an LLM. The raw build conversation is below, in Spanish." · link to Colophon.
- A small "Today's piece" decoration slot with provenance "Generated today by <model> · prompt · archive" (the model name is shown as a placeholder label `@cf/model`, marked as an example; the decoration itself may be a simple inline SVG kinematic chain).

## Assets

- Photo (data URI, JPEG 560 px wide, 4:3): `design/portfolio-directions/.photo.datauri`
- Badge (data URI, PNG 320×138, aspect ≈ 2.31:1): `design/portfolio-directions/.badge.datauri`
Read the file and inline its single line as an `<img src>`. Never reference external URLs.

## Tasks

- T1 (S1–S9) artboard 01 drafting-sheet — gentle-ai-worker — b1c02f1
- T2 (S1–S9) artboard 02 lab-notebook — gentle-ai-worker — b1c02f1
- T3 (S1–S9) artboard 03 two-legs — gentle-ai-worker — b1c02f1
- T4 (S1) design.json, open the canvas, stop at gate — inline — b1c02f1
- T5 (S10–S12) artboard 04 drawing-set — gentle-ai-worker
- T6 (S10–S12) artboard 05 exploded-view — gentle-ai-worker
- T7 (S10–S12) artboard 06 signal-path — gentle-ai-worker
- T8 manifest, canvas, stop at gate — inline — 99ee9fe
- T9 (S10–S14) artboard 07 cover-and-sheets — gentle-ai-worker — d7faec6
- T10 (S10–S14) artboard 08 exploded-index — gentle-ai-worker — d7faec6
- T11 manifest, canvas, stop at gate — inline — d7faec6
- T12 (S15–S17) polish 07, fix its scroll, add the interactive background — gentle-ai-worker
- T13 (S15–S17) polish 08, fix its scroll, add the interactive background — gentle-ai-worker
- T14 remove 01–06, manifest, canvas, stop at gate — inline

## Log

- L1: "Understood, about the remaining gaps - We are not mentioning the congress, leave it - Socra speaks english first because the voice is less robotic and whisper transcribes better this languajes. - Socra is public, link that one first. The rest I'll decide later what to do. Start with P2"
- L2: No design sources exist in the repo (gentle_design list): directions are designed freely.
- L3: Three artboards written by parallel workers (01 drafting sheet, 02 lab notebook, 03 two legs), committed b1c02f1. Links to projects/posts are placeholders in the mockups; real URLs come from content in P3. Badge is dark with a neon-pink glow: keep it small (~160 px).
- L4: "- I like the "Drafting sheet" style, but it gives the arm too much importance for my taste and the size of the project. Let's consider a similar approach but more general. - Lab notebook is too simple, so is "Two legs" is as well. Propose more and different options. - I would like it to have some kind of interaction with the scroll if it's appropriate - I agree with you about the gentle-ai badge"
- L5: Round 2 keeps 01–03 for reference and adds 04 drawing set, 05 exploded view, 06 signal path. Badge stays small (~160 px), as agreed.
- L6: "Let's resume the work. Make sure to update the server where you shared the first three designs or give me a new one. I opened the mockups' HTML files directly, and while they look better, none of them fully convince me yet. One issue is that they all feel too bright and washed out—should we add a dark/light mode toggle?"
- L7: Teo chose to combine 04 Drawing set + 05 Exploded view, and themes "Follow system + toggle" (dark blueprint + light paper; OS preference by default; header toggle overrides and is remembered).
- L10: Workers for T12/T13 failed (stall; runtime quarantine). Parent diagnosed with a CDP probe: effects ran but completed off-screen or were too small. Fixed inline with a shared script (fe76a11). Polish limited to the effects.
