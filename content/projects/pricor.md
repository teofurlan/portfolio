---
title: Pricor
summary: The models fill the form, the engine does the math, you sign. Supplier price lists in Excel or CSV become one normalized catalog.
status: featured
order: 3
role: Designer and developer
team: 1
ownership: >-
  Everything: the domain contract and the exact decimal engine, the file
  adapters, the FastAPI server, the Laya fine-tuning and its synthetic corpus,
  the benchmark, the React interface in English and Spanish, and the docs.
stack: [Python, uv, FastAPI, openpyxl, xlrd, SQLite, Decimal, Ollama, Gemma 4 E4B, bge-m3, Laya, PyTorch, React, Vite, TypeScript, Vitest, pytest]
tags: [ai]
links:
  repo: https://github.com/teofurlan/pricor
  post: https://dev.to/teo_furlan/pricor-local-ai-reads-the-supplier-spreadsheet-an-exact-engine-does-the-math-3915
media: []
year: 2026
---

<!-- Sources: odd/evidence/pricor.md (explorer report of the pricor repo, README,
PRODUCT.md, docs/benchmark.md; repo public, 200 on 2026-11-12; DEV post title).
Only VERIFIED items are stated as fact. "What I'd change" is EXTRAPOLATED from the
repo TODOs: Teo confirms. Solo: 68 commits, all by the author, 2026-10-13 to 2026-10-26.
No supplier names, local paths or emails. Not usable: any customer, interview,
time-savings or testimonial claim (none exists). -->

## Problem

Small Argentine stores (hardware, stationery, distributors) get weekly supplier price lists in Excel or CSV. Every supplier names its columns differently and leaves out metadata: is VAT included or net, is the price per pack or per unit, is the discount a chain like `10+5`, which currency, which number format. Point-of-sale and ERP systems accept only rigid layouts, so loading by hand is slow, and a misread column silently corrupts costs.

Pricor turns those lists into one normalized catalog that the store's own system can import.

It is a research prototype. It has no users yet, no customers and no measured time savings, and I'm not claiming any. It has been tried on public price lists from six distributors, not in weekly use at a store.

## Constraints

- Local and private: the app binds to 127.0.0.1. The only optional outbound call fetches the USD to ARS rate, and you can override it by hand.
- Windows first. Python 3.13 with uv, Node 22, and Ollama running `gemma4:e4b` and `bge-m3`.
- On the tested setup, `OLLAMA_FLASH_ATTENTION=0` is needed because of an upstream CUDA crash.
- Out of scope: PDF lists, consolidating several suppliers, ERP-specific exports, an installer.

## The decision and why

**Models propose, the engine calculates, you sign.** A model never executes anything and never does arithmetic. It picks column roles from a closed set, or suggests answers, and you confirm.

- **Exact decimal arithmetic.** The engine uses Python `Decimal` with 50-digit precision and a single final rounding (ROUND_HALF_UP).
- **A closed catalogue of operations in a fixed order:** parse number, apply discounts, strip VAT, per unit, convert currency, round. Each step leaves an audit trace, shown as an adding-machine tape.
- **A cascade, not one model.** A small fine-tuned classifier (Laya, about 35 ms per column on GPU) goes first, then Gemma 4 E4B (about 11 s per sheet on GPU), then you. An answer settles automatically only above thresholds calibrated on a validation set of 161 columns to at least 95 % precision.
- **An "agreement" stage was left out.** Heuristics plus Laya reached only 88.0 % precision without a confidence bar, so it stays dormant and is not shipped.
- **Excel percentages are read as percentage points.** A `21%` stored as 0.21 would otherwise cause a silent 100× error.
- **Approved plans are saved per supplier.** Next week's list reuses the plan and flags only the columns that moved, were added or went missing.

## Result

Measured on a held-out test set of **29 columns from two distributors the system had never seen**, on an RTX 4060 Laptop GPU. The set is small and is missing some roles (VAT rate, units per pack, barcode, discount, currency), so read these as a first signal, not a guarantee.

| Approach | Correct columns |
|---|---|
| Gemma 4 E4B alone | 25 of 29 (86.2 %) |
| Heuristics | 24 of 29 (82.8 %), optimistic: the rules were written after seeing one distributor's headers |
| Laya fine-tuned | 22 of 29 (75.9 %) |
| Laya zero-shot | 18 of 29 (62.1 %) |

The cascade, which only settles answers it is confident about:

- **11 of 29 columns settled automatically, 10 correct (90.9 %).**
- **18 escalated to the user (62.1 %), and the best suggestion was right for 15 of them.**

That means most columns still reach a person. Laya settles only about 10 % because its confidence separates poorly below its threshold.

Speed: Laya takes 35.4 ms per column on GPU and 516.5 ms on CPU (means); Gemma takes 11.4 s per sheet. The Laya fine-tune took 290 s and peaked at 6.2 GB of VRAM.

## What I'd change

> DRAFT — Teo rewrites this in his own words.

- TODO(owner): confirm. Calibrate Laya on more real distributor data, so it settles more than about 10 % of columns on its own.
- TODO(owner): confirm. Support PDF price lists.
- TODO(owner): confirm. Consolidate several suppliers into one catalog.
- TODO(owner): confirm. Validate on CPU-only hardware, where the numbers above were not measured.
