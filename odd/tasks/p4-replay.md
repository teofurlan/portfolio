# P4 — Session replay + favicon

The "How this site was built" page replays the real build sessions (BRIEF §5.3), plus a favicon
chosen from three options. Branch `p4-replay` (from `p3-layout`). **Gate:** Teo reviews the
redacted transcript before it is public.

## Specs

- S1 (BRIEF §5.3): "Source: the JSONL transcript of the **build session(s)** of this site (the session running this brief). Keep every session's transcript; do not delete or compact them away. Locate the harness's session files and copy them into `transcripts/raw/` (git-ignored)."
- S2 (BRIEF §5.3): "`scripts/redact.ts`: removes secrets, tokens, emails, absolute local paths, hostnames/IPs; outputs `transcripts/public/*.json`. Fails the build if a secret pattern remains. Teo reviews the redacted output before publish."
- S3 (BRIEF §5.3): "Curation without rewriting: group into **chapters** (title + time range), collapse tool calls/diffs by default (expandable), mark highlights. User messages are never edited; omissions are shown as \"[n steps collapsed]\"."
- S4 (BRIEF §5.3): "Player: autoplays like a video (typing/streaming effect, readable speed), progress bar with chapters, play/pause, speed control. Any click, scroll or key on the player **pauses it and switches to a full browsable transcript** at that point. Reduced-motion → starts paused as a static transcript."
- S5 (BRIEF §5.3): "Show metadata: model(s), dates, number of turns, tool calls, files changed."
- S6 (BRIEF §5.3 + §3): "Spanish original; optional English translation column (precomputed at build, labelled)." / "Never rewrite his messages; translation is clearly labelled as machine translation."
- S7 (L1): "add the favicon (give me three options)": three favicon directions as design artboards; Teo picks one; the chosen one ships as the site favicon on every page.
- S8: P3 rules keep holding (no full email/phone in HTML, works without JS, one h1, tests, check and build pass).

## Tasks

| ID | Task | Specs | Route | Commit |
|---|---|---|---|---|
| T1 | `scripts/collect-sessions.ts`: copy this repo's Pi session JSONL into `transcripts/raw/` (git-ignored, never deletes) | S1 | inline | |
| T2 | `scripts/redact.ts` + tests: redact to `transcripts/public/*.json`; `--check` fails on any remaining secret pattern; wired before build | S2, S8 | inline, test-first | |
| T3 | Favicon: three artboards in `design/favicon/` (after design system sync) | S7 | inline | |
| T4 | **Gate:** Teo reviews the redacted output and picks the favicon | S2, S7 | Teo | |
| T5 | Curation: chapters, highlights, collapsed steps, metadata | S3, S5 | inline | |
| T6 | EN translation precompute (labelled machine translation) | S6 | inline | |
| T7 | Player island (autoplay, pause → browsable transcript, reduced motion, no-JS static) | S4, S8 | inline | |
| T8 | Ship the chosen favicon | S7, S8 | inline | |

## Log

- L1: "Let's start with the P4 phase and also add the favicon (give me three options)"
- L2: Pi session files for this repo live in `~/.pi/agent/sessions/--C--Users-teofu-Code-portfolio--/` (5 files, ~18 MB, format v3: `session`, `model_change`, `thinking_level_change`, `custom`, `message` with roles system/user/assistant/toolResult; entries form a tree via `id`/`parentId`). Sensitive categories seen: local paths, email/name/phone, deploy-key and Cloudflare token context, private repo links.
