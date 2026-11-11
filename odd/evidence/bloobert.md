# bloobert evidence (explorer mwcgvb2f, 2026-11-11, read-only)

Paths relative to ../ideaslab/bloobert/. Never publish local paths in site copy.

- Problem: "A translucent jelly pet that melts while you sit at your computer and regains its shape when you take an active break." (README.md:3). Success = "the creator uses it every working day" (docs/mvp.md:9). No user research recorded.
- Constraints: Windows 11 first, macOS next (docs/mvp.md:109). Local-only, no account, no telemetry (docs/mvp.md:85-87). Idle reads only a timestamp, "never which keys were pressed" (app/src-tauri/src/idle.rs:2). Window 252×182 transparent, always-on-top (tauri.conf.json:17-22).
- Decision, Tauri 2 over Electron: reuse the SVG/WebAudio prototype, Rust reads idle time, small footprint (docs/mvp.md:95-99). M0 spike verdict: "No failure criterion holds, so Electron is not needed" (odd/tasks/m0-spike.md:45-47); caveat "no Electron baseline was measured" (:43).
- Decision, procedural sound: WebAudio in TypeScript, one triangle oscillator per vowel, pitch drop, lowpass 1500 Hz with Q by melt, random jitter; "lower and slower as Bloobert melts" (app/src/bloobert.ts:240-262). Why: "It needs no voice actor, carries no voice licensing, and works in any language" (README.md:38).
- Decision, rendering: SVG sticker look ported from a design study (app/README.md:6); Three.js 3D is plan B (docs/mvp.md:14). Cursor polled every 33 ms for click-through hit-testing (app/src/main.ts:62).
- Decision, break detection: raw idle "cannot decide alone whether you are seated" (docs/mvp.md:33); layers: input grace period (5 min proposal, citing Blatter et al. 2008, ActivityWatch 3 min, Teams ~5 min), then media playing, then opt-in camera during breaks only (docs/mvp.md:33-44). Rule: "Unknown presence ... must not advance the sitting clock: melting unfairly is worse than melting late" (app/src-tauri/src/presence.rs:12-13).
- Decision, storage: unreadable/unknown-version save files renamed .bad-<ms>, never overwritten; atomic writes (odd/tasks/m1-local-save.md:13,29).
- Results (literal): ~37 MB working set, DEBUG build, "observed roughly" (m0-spike.md:37,43). No release size or CPU measured. cargo test grew to 126 tests (odd/tasks/m2-routines.md:35); pnpm test 11/11. Five deliberate mutations each made the break-rule tests fail (m1-break-restore.md:27).
- Team: every commit by teofurlan; built with coding agents (explorer/worker roles in logs). "Solo" not stated — TODO(owner) confirm wording of ownership.
- Stack: Tauri 2, Rust 2024 (windows-sys GetLastInputInfo, windows media sessions), TypeScript, Vite, SVG, WebAudio, Vitest.
- Year: 2026 (2026-10-29 to 2026-11-10). Remote https://github.com/teofurlan/bloobert — public? TODO(owner). No release/installer yet (M4).
- Media candidates: design/main-window/.screenshots/{dark,light}-1200-{sitting,break}.png. Short videos in design/*/ are marketing reels with AI-generated footage — do not use without Teo checking.
- Limitations (repo words): Windows transparent windows keep border/shadow, click-through API "still needs to be checked" (docs/mvp.md:102-106); "Without the camera, Bloobert stays trust-based" (docs/mvp.md:44); "input before the minimum does not end the break" (odd/tasks/m2-settings.md:37); sound on/off not configurable yet.
- Never publish: reflog email, .git/gentle-ai, .engram, docs/go-to-market.md, docs/ideas-backlog.md, brand accounts (must never link back to Teo, README.md:13), docs/video-hooks.md, Spanish chat quotes in odd/tasks logs, raw AI footage.
