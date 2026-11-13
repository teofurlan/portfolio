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
  With L9: translation goes both ways: Spanish text gets a labelled English machine translation and English text a labelled Spanish one; the original is never edited.
- S7 (L1): "add the favicon (give me three options)": three favicon directions as design artboards; Teo picks one; the chosen one ships as the site favicon on every page.
- S8: P3 rules keep holding (no full email/phone in HTML, works without JS, one h1, tests, check and build pass).

## Tasks

| ID | Task | Specs | Route | Commit |
|---|---|---|---|---|
| T1 | `scripts/collect-sessions.ts`: copy this repo's Pi session JSONL into `transcripts/raw/` (git-ignored, never deletes) | S1 | inline | `04102b0` |
| T2 | `scripts/redact.ts` + tests: redact to `transcripts/public/*.json`; `--check` fails on any remaining secret pattern; wired before build | S2, S8 | inline, test-first | `04102b0` |
| T3 | Favicon: three artboards in `design/favicon/` (after design system sync), then five T. variations (L8) | S7 | inline | `cad09d4`, see L10 |
| T4 | **Gate:** Teo reviews the redacted output and picks the favicon | S2, S7 | Teo | |
| T5 | Curation: active branch only, harness notices, chapters, highlights, collapsed steps, metadata (`src/lib/replay.ts`, `transcripts/curation.json`) | S3, S5 | inline, test-first | `586df59` |
| T6 | Two-way translation precompute into `transcripts/public/_translations.json` (L12) | S6 | worker (background) | |
| T7 | Player island (autoplay, pause → browsable transcript, reduced motion, no-JS static) | S4, S5, S6, S8 | worker (background, context backstop) | |
| T8 | Ship the chosen favicon (07, T_ prompt) | S7, S8 | inline | see L15 |

## Log

- L1: "Let's start with the P4 phase and also add the favicon (give me three options)"
- L2: Pi session files for this repo live in `~/.pi/agent/sessions/--C--Users-teofu-Code-portfolio--/` (5 files, ~18 MB, format v3: `session`, `model_change`, `thinking_level_change`, `custom`, `message` with roles system/user/assistant/toolResult; entries form a tree via `id`/`parentId`). Sensitive categories seen: local paths, email/name/phone, deploy-key and Cloudflare token context, private repo links.
- L3: T1/T2 done: `pnpm transcripts:collect` copied 5 files; `pnpm transcripts:redact` wrote 5 files (2.1 MB, 2042 events) to `transcripts/public/`; `pnpm build` now runs `redact.ts --check` first. RED observed for the module and for regex-escaped/truncated emails (`a@gmail\.com`, `a@gmail.`) found in the real output. Tests 102/102, check 0 errors. Added dev dependency `@types/node` (scripts use `node:` modules). The public JSON is **not committed** until Teo reviews it (gate T4).
- L4: Left in the redacted output for Teo to judge: the obfuscated "teofurlan03 [at] gmail.com" (already on the site), "Entre Ríos" (CV location), the Windows PATH dump with `[user]`, names of private sibling folders in `ls` output (e.g. `gitlab_deploy_key` file name, no key content), web-search results. Extra literals to hide go in `transcripts/redact.local.json` (git-ignored).
- L5: Design system synced to `design/system.md` + `design/system.html` from `src/styles/global.css`. Favicon directions in `design/favicon/`: `01-monogram.html`, `02-kinematic-link.html`, `03-exploded-plates.html`.
- L6: Independent verifier refused (no Risk line in the launch); inline extra scan instead: no keyword+opaque-value pairs, no private IPs; only opaque string is the fake test token tail from this session. Private repo URLs remain (`github.com/teofurlan/{socra,pricor,bloobert,robot-arm,mtds-brazo-robot}`), for Teo to decide (BRIEF: repos private, no repo links). Risk: item 2 (a missed secret would become public), item 5 (new dev dependency `@types/node`). Mitigation: the public JSON stays uncommitted until the T4 review.
- L7: "1. I check the transcripts and they're decent, will do."
- L8: "2. I don't really like one, the first one (T.) is the one I like the most of them. Suggest more options"
- L9: "3. The translation should go both ways"
- L10: Five more favicon artboards, all variations of 01 (T.): `04-solid-monogram`, `05-drafting-sheet`, `06-joint-stop`, `07-prompt-cursor`, `08-dimensioned`. 01-03 kept. Reading of L7: Teo finds the redacted output acceptable and will finish reviewing; the public JSON stays uncommitted until he says it can be published, and the private repo URLs question is still open.
- L11: Raw sessions are trees: 3 sessions hold one abandoned branch each (a retried prompt). `toPublic` now keeps only the active branch (root to the last entry) and records `abandoned` (count). Harness notifications sent with the user role ("[System-generated …]") become `notice` events, so only Teo's own words are `user`. Volume to translate: 40 user messages (11k chars) and 170 assistant texts (107k chars).
- L12: Translation format (T6): `transcripts/public/_translations.json`, an object keyed by event id (`user` and `text` events only): `{ "<eventId>": { "from": "es"|"en", "to": "en"|"es", "text": "<translation>" } }`. Each event is translated into the other language (Spanish → English, English → Spanish; Spanish in voseo, matching the site). Code blocks, inline code, paths, commands, URLs, file names, identifiers and redaction markers (`[email]`, `[REDACTED]`, `~`) stay verbatim; markdown structure is kept; nothing is added, summarized or corrected. A message mixing both languages is translated by its main language. Files starting with `_` in `transcripts/public/` are not sessions, but the redact check still scans them. The page labels it "Machine translation" / "Traducción automática".
- L13: "1. I like the T_ prompt one"
- L14: "2. Hace socra y pricor públicos si no lo están"
- L15: T8: favicon 07 (T_ prompt) shipped: `public/favicon.svg` (palette follows `prefers-color-scheme`), `public/favicon-32.png` and `public/apple-touch-icon.png` (paper palette, rendered with Sharp), linked from `src/layouts/Base.astro` on every page. L14: `gh repo view` shows socra and pricor are already PUBLIC (robot-arm and portfolio too; bloobert and mtds-brazo-robot are PRIVATE), so nothing was changed on GitHub.
