---
title: Socra
summary: A local voice layer for Claude Code. The model speaks, you answer out loud.
status: featured
order: 1
role: Designer and developer
team: 1
ownership: >-
  Everything: the Python server (speech-to-text, text-to-speech, MCP over stdio,
  WebSocket), the Claude Code and Pi backends, and the React page that shows only
  code, permission prompts or the reply.
stack: [Python, asyncio, MCP, WebSocket, faster-whisper, Piper, React, Vite, TypeScript, Vitest, uv]
tags: [ai]
links:
  repo: https://github.com/teofurlan/socra
  post: https://dev.to/teo_furlan/i-wanted-my-coding-agent-to-examine-me-out-loud-so-i-built-a-local-voice-layer-for-it-2ni4
media: []
year: 2026
---

<!-- Sources: odd/evidence/socra.md (explorer report of the socra repo: README.md,
PRODUCT.md, server/README.md, server tests, piper_tts.py; DEV post verified via DEV API).
Solo confirmed by Teo (2026-11-11). Repo is private: no repo link. Order 1 chosen by Teo.
Order 2 is a draft choice (hardware leg MTDS goes first).
Media candidates, not copied yet: socra-demo-muted.mp4 and cover.png (from the
2026-11-socra draft folder; copy into media/projects/socra/).
Not usable as results: blind voice A/B winner, voice/playback-results.json
(audible_quality_verified is false), Qwen3-TTS RTF figures (upstream docs). -->

## Problem

A developer who works with Claude Code all day sometimes wants to be examined out loud on a project they built, or to drive a coding session by voice. Socra is a local, private voice layer for that: the model speaks, you answer out loud, and the page shows only code, permission prompts or the reply.

## Constraints

- Private: the server binds to 127.0.0.1 only, and nothing leaves the machine except what Claude Code itself sends.
- Windows first. Python 3.12+, Node 22+, a microphone and Edge or Chrome. An NVIDIA GPU is optional; CPU works.
- A transcription budget of 3.0 s or less.
- The Piper voice model is about 79 MB.

## Decisions

- **Switching mode is a handoff, not a resume.** Resuming would keep the old system prompt and an ever-growing context.
- **Whisper large-v3-turbo as the default.** The aim is the highest recognition accuracy and robustness against accents and slang.
- **Speak each reply sentence by sentence while it is still being written**, so the answer starts before it is finished.
- **English first, one voice.** In English the voice sounds less robotic and Whisper transcribes better. A test keeps the language to a single source.
- **80 ms of lead-in before speech.** Lead-ins of 30 to 75 ms cut the first phoneme; a test requires at least 60 ms.

## What I owned

Solo project, built with coding agents: the whole thing, from the server and the audio pipeline to the React page and the tests.

## Result

Socra runs and is used daily by its author. It has no users, testimonials or press, and I'm not claiming any.

One measurement exists, with a caveat. On an RTX 4060 8 GB, with synthesized **Spanish** audio, measured **before the switch to English**:

| Model | Transcription time | Model load |
|---|---|---|
| large-v3-turbo, CUDA fp16 | 0.55 s and 0.43 s (two clips) | 4.35 s |
| small | 0.30 s (first clip) | not recorded |
| base | 0.60 s (first clip) | not recorded |

End-to-end speed has not been measured.

TODO(owner): blind voice A/B result. The ratings sit in browser localStorage and the winner is only in a draft note, so it is not stated here.

## What I'd change

> DRAFT — Teo rewrites this in his own words.

- Measure end-to-end latency, and re-run the Whisper benchmark on English audio, since the current numbers are Spanish.
- Make Pi questions that need a choice or free text answerable by voice. Today they are cancelled.
