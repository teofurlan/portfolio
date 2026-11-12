# Pricor evidence (explorer read-only research, 2026-11-12)

Paths relative to ../ideaslab/pricor/. Spot-checked by the parent: remote URL, PRODUCT.md:49, docs/benchmark.md:50-64, git authors (68 commits, all teofurlan). Repo public: https://github.com/teofurlan/pricor answered 200 on 2026-11-12. Never publish local paths, the author's email from git logs, internal agent metadata, or raw supplier data.

- One-line summary: "Pricor turns heterogeneous supplier price lists (Excel/CSV) from Argentine stores into one normalized catalog that the store's own system can import." (README.md:3) [VERIFIED]. Core line: "The models fill the form, the engine does the math, you sign." (README.md:5; PRODUCT.md:37) [VERIFIED].
- Problem: small Argentine stores (hardware, stationery, distributors) get weekly supplier price lists in Excel/CSV with conflicting column names and missing metadata (VAT included or net, per pack or per unit, chained discounts like `10+5`, mixed currencies, number conventions). POS/ERP systems accept rigid layouts, so manual loading is slow and misreadings silently corrupt costs (PRODUCT.md:12-21) [VERIFIED].
- Constraints: local and private, binds to 127.0.0.1; only optional outbound call is DolarAPI for the USD→ARS rate, overridable by hand (README.md:24; PRODUCT.md:27). Windows-first; Python 3.13 (uv), Node 22, Ollama with `gemma4:e4b` and `bge-m3` (README.md:29-37). `OLLAMA_FLASH_ATTENTION=0` needed due to an upstream CUDA crash on the tested setup (README.md:61). Out of scope: PDFs, multi-supplier consolidation, ERP-specific exports, installer (PRODUCT.md:34) [VERIFIED].
- Key decisions and why [VERIFIED]:
  1. Models propose, engine calculates, user signs: model output never executes and never does arithmetic; models pick column roles from a closed set or suggest answers (README.md:65-70; PRODUCT.md:25).
  2. Exact decimal arithmetic: Python `Decimal`, 50-digit precision, one final ROUND_HALF_UP (src/pricor/domain/engine.py:34).
  3. Closed catalogue of operations in fixed order: parse_number → apply_discounts → strip_vat → per_unit → convert_currency → round, with a per-step audit trace shown as an adding-machine tape (src/pricor/domain/plan.py:32; engine.py:80).
  4. Cascade: Laya fine-tuned (~35 ms/column GPU) → Gemma 4 E4B (~11 s/sheet GPU) → user; only answers above thresholds calibrated on a validation set (n=161) to ≥95 % precision settle automatically (docs/benchmark.md:38-56). Thresholds: Laya 0.9959, Gemma 0.9800.
  5. An "agreement" stage (heuristics + Laya) reached only 88.0 % precision without a bar; kept dormant, not shipped (docs/benchmark.md:52, 129-142).
  6. Excel percentages: `21%` stored as 0.21 is read as percentage points, preventing a silent 100× error (README.md:80).
  7. Approved plans saved per supplier (SQLite); next week's list reuses the plan and flags only moved, added or missing columns (README.md:20; PRODUCT.md:20).
- Results (measured, held-out test set of 29 columns from 2 unseen distributors, RTX 4060 Laptop GPU; docs/benchmark.md) [VERIFIED]:
  - Standalone accuracy: Gemma 25/29 (86.2 %), heuristics 24/29 (82.8 %, optimistic: rules written after seeing one distributor's headers), Laya fine-tuned 22/29 (75.9 %), Laya zero-shot 18/29 (62.1 %).
  - Cascade: settled automatically 11 of 29, 10 correct (90.9 %); escalated to the user 18 (62.1 %), best suggestion right for 15 of them (benchmark.md:64).
  - Latency: Laya CUDA mean 35.4 ms/column, CPU mean 516.5 ms/column; Gemma mean 11.4 s/sheet.
  - Laya fine-tune: 290 s, peak 6.2 GB VRAM.
- NOT usable as results: "No paying customer, user interview, measured time savings or testimonial exists. Do not fabricate any." (PRODUCT.md:49). A chat with a distributor's IT colleague is an anecdote, not a metric.
- Team and ownership: solo; 68 commits, all by teofurlan, 2026-10-13 to 2026-10-26 [VERIFIED]. Owned everything: domain contract and decimal engine, adapters, FastAPI server, Laya fine-tuning, synthetic corpus, benchmark, React/TypeScript UI (EN/ES), docs.
- Stack: Python 3.13, uv, FastAPI, openpyxl, xlrd, SQLite, Decimal, Ollama (Gemma 4 E4B, bge-m3), Laya + PyTorch (CUDA, optional), React 19, Vite, TypeScript, Vitest, pytest [VERIFIED].
- Status: research prototype, tested on public lists from 6 distributors, not in weekly store use (README.md:26) [VERIFIED].
- Limitations (repo words): 62.1 % of columns escalate; Laya settles ~10 % because its confidence separates poorly below 0.9959; test set small and missing roles (vat_rate, units_per_pack, barcode, discount, currency) (benchmark.md:167, 175).
- What he might change (repo TODOs) [EXTRAPOLATED, Teo confirms]: calibrate Laya on more real distributor data; PDF lists; multi-supplier consolidation; validate on CPU-only hardware.
- Candidate media (not copied): docs/media/pricor-filter.png, pricor-filter-dark.png, pricor-demo.gif.
- FIG 1.3 sketch: supplier lists (xlsx/csv) → profile → Laya → Gemma → you (confirm) → exact decimal engine (closed operations, audit tape) → normalized catalogue → store system; plan saved per supplier and reused next week.
