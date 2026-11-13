---
title: Bloobert
summary: A translucent jelly desktop pet that melts while you sit and regains its shape when you take an active break.
status: listed
order: 10
role: Designer and developer
team: 1
ownership: >-
  All of it: product definition, the Tauri 2 and Rust app, idle and presence
  detection, procedural sound, SVG rendering and local save files. Built with
  coding agents.
stack: [Tauri 2, Rust, TypeScript, Vite, SVG, WebAudio, Vitest]
tags: [desktop]
links: {}
media: []
year: 2026
---

<!-- Sources: odd/evidence/bloobert.md (explorer report of the bloobert repo: README.md,
docs/mvp.md, app/src-tauri/src/{idle,presence}.rs, app/src/{bloobert,main}.ts,
odd/tasks/m0-spike.md, m1-local-save.md, m1-break-restore.md, m2-routines.md).
Status listed (2026-11-12): Pricor is featured instead. Order 10.
Solo confirmed by Teo (2026-11-11). Repo is private: no repo link.
Media candidates, not copied yet: design/main-window/.screenshots/{dark,light}-1200-{sitting,break}.png.
The short videos in design/ are marketing reels with AI-generated footage: do not use unless Teo checks. -->

## Problem

People sit at the computer for hours without breaks. I built Bloobert, a translucent jelly pet that melts while you sit and regains its shape when you take an active break. I defined success as using it myself every working day. I did no user research.

## Constraints

- Windows 11 first, macOS next.
- Local only: no account, no telemetry. Idle detection reads only a timestamp, never which keys were pressed.
- A small, transparent, always-on-top window (252×182).
- Unknown presence must not advance the sitting clock: melting unfairly is worse than melting late.

## Decisions

- **Tauri 2 over Electron.** It reuses the existing SVG and WebAudio prototype, Rust reads the idle time, and the footprint is small. A spike found no failure criterion that required Electron. I didn't measure an Electron baseline.
- **Procedural sound.** WebAudio in TypeScript: one triangle oscillator per vowel, a pitch drop, a lowpass filter and random jitter, lower and slower as Bloobert melts. It needs no voice actor, carries no voice licensing and works in any language.
- **SVG rendering.** A sticker look ported from a design study. Three.js 3D is the plan B.
- **Layered break detection.** Raw idle time cannot tell whether you are seated. The layers are an input grace period (5 minutes proposed), then whether media is playing, then an opt-in camera during breaks only.
- **Safe saves.** Writes are atomic. An unreadable or unknown-version save file is renamed, never overwritten.

## What I owned

Everything, working with coding agents: the product definition, the architecture, the Rust and TypeScript code, the design and the tests.

## Result

- It runs as a desktop app. The spike measured a working set of about 37 MB, in a **debug build**, "observed roughly". I haven't measured release size or CPU.
- Rust tests grew to 126 and the frontend suite passes 11 of 11.
- Five deliberate mutations of the break rule each made its tests fail.
- There is no release or installer yet.

## What I'd change


- I'd measure a release build (size, CPU), and check the Windows transparent-window border and click-through behavior, which the docs list as still to be checked.
- Without the camera, break detection is trust-based. I still need to decide whether that is acceptable or needs another signal.
