# P4b — Replay fixes: local paths and Markdown

Follow-up to P4 on branch `p4-replay` (PR #3, public repo). The public transcripts still show
home-relative paths, and model messages show raw Markdown. History rewrite is planned apart.

## Specs

- S1 (L1): "Vi también que hay algunas partes en la que se están mostrando rutas, por ejemplo: ~\OneDrive\Documentos\CV\resume.tex. Todo eso tenemos que corregirlo"
  With L3: paths inside this repo (`~/Code/portfolio/...`) become repo-relative (`src/x.ts`); any other path on Teo's machine becomes a placeholder for the whole path, no file name. `--check` (build and CI) fails if a home-relative path remains.
- S2 (L2): "cuando se muestra la salida del modelo para un prompt dado, se podría formatearla en lugar de que aparezca con los asteriscos pelados para la negrita y demás"
- S3 (L4): the paths must also leave the git history of `p4-replay` (rewrite + force push), planned and confirmed apart because it is destructive.
- S4: P4 rules keep holding (text never rewritten except redaction, works without JS, reduced motion, tests, check and build pass).

## Tasks

| ID | Task | Specs | Route | Commit |
|---|---|---|---|---|
| T1 | `scripts/lib/redact.ts` + tests: repo-relative and `[local path]` rules; `--check` flags leftover `~/` paths | S1 | worker, test-first; correction round after L8 | |
| T2 | Regenerate `transcripts/public/*.json` and `_translations.json`; check, build | S1, S4 | inline | |
| T3 | Render Markdown in model messages (and their translations), escaped, with the typing effect | S2, S4 | inline, test-first | |
| T4 | History rewrite of `p4-replay` without the paths; plan, Teo confirms, force push | S3 | parent, after Teo's go | |

## Log

- L1: "Vi también que hay algunas partes en la que se están mostrando rutas, por ejemplo: ~\OneDrive\Documentos\CV\resume.tex. Todo eso tenemos que corregirlo"
- L2: "Estuve viendo la sección de \"How this site was built\" y me gusta bastante, lo único que me gustaría que arreglemos es que cuando se muestra la salida del modelo para un prompt dado, se podría formatearla en lugar de que aparezca con los asteriscos pelados para la negrita y demás"
- L3: Teo (choice): "Recomendado: relativas al repo + [ruta local]" — repo paths relative, every other local path hidden whole, no file name. 670 `~` paths in the public JSON: 466 under `~/Code/portfolio`, the rest OneDrive, other `~/Code` projects, `.claude`, `.pi`, `AppData`, `Downloads`, `Engineering`.
- L4: Teo (question): history → "Reescribir el historial". The JSON landed in `0eec329`, only on `p4-replay` / `origin/p4-replay` (PR #3 open, repo PUBLIC); `main` does not contain it.
- L5: The exploration subagent failed (quota); Teo chose "Explorar yo directamente" (parent explores inline).
- L6: T1 design (parent). Placeholder token `[local path]` (English, like the existing `[private]`, `[host]`, `[user]`). After the existing `home-path` rules turn the home folder into `~`: (a) a repo rule turns `~<sep>Code<sep>portfolio<sep>rest` into `rest` (separators kept as written) and the bare repo root into `[repo]`; the repo's home-relative path comes from `RedactContext.repo` (CLI: `relative(homedir(), cwd)`), (b) a generic `local-path` rule turns any remaining `~` + separator + path into `[local path]`; `findLeaks` reports it, so `--check` fails on CI too. Separators: `/`, `\`, `\\`. A path segment never ends in a backslash (so `\"` and `\n` escapes inside JSON-looking text stay intact). Paths with spaces may leave the part after the space; accepted. Existing tests at `scripts/lib/redact.test.ts:80-87` and `:170` expect `~...` output and must be updated to the new behavior. Plain `~` without a separator (`~2k tokens`) is untouched.
- L8: T2 regenerated (716 path texts changed, event lists unchanged). Parent fixes during T2: SEP accepts any run of backslashes (test-first), and `--check` now checks parsed JSON string values instead of the file text (JSON escapes like `~` + `\n` looked like paths). Independent verify (Risk: item 2): S1 FAIL (partial, medium). Home paths still public in forms the `home-path` rules miss, and `--check` does not flag them: (a) PATH lists `…:/c/Users/[user]/AppData/…` (rule refuses a match after `:`), `2026-11-12-01a1cf3a.json`, `2026-11-13-01a1d2b3.json`; (b) ANSI colour code before the drive `\x1b[34mC:\Users\…` (`\b` fails); (c) Pi session folder names `--C--Users-[user]-AppData-…` (11 in `2026-11-13`); (d) `$HOME/…`, `${HOME}`, `%LOCALAPPDATA%\…`, `$env:USERPROFILE`; (e) a path right after a literal `\n` in JSON-looking text (`a\nC:\\Users…`, `x\n~/OneDrive/…`); (f) 3+ backslashes before `Users`; (g) lowercase `c:\users`, `/C/Users`, `\\wsl$\…\home\<user>`, URL-encoded `C%3A%5CUsers`, `_C:/Users`. Also: `stringsOf` in `scripts/redact.ts` skips object keys (old check covered keys); relative paths `../ideaslab/bloobert` and `../mtds-brazo-robot` name the private repos (config only has `teofurlan/<name>`). Accepted: paths with spaces leave the tail (L6); `..` out of the repo shows the sibling name (low).
- L9: Correction round (worker): (a)-(g), keys in `stringsOf`, literals `ideaslab/bloobert` and `mtds-brazo-robot`; RED 28 failing, GREEN redact 89/89, suite 208/208, check 0, build ok; transcripts regenerated (ids/kinds unchanged). Bare `bloobert` stays: Bloobert is a public project on the site (only its repo is private). Remaining `ideaslab` siblings (socra, pricor, dogear) are not private per config.
- L7: T3 design (parent). Model output is `<pre class="orig">{m.text}</pre>` in `src/components/replay/Message.astro` (escaped, pre-wrap); the player `src/scripts/replay.ts:31-74` reads `.orig` textContent once and types it by slicing text. Render Markdown only for model messages (`role` of `text` events) and their translations; user messages stay verbatim pre-wrapped. No Markdown dependency is installed; a small pure renderer in `src/lib/` that escapes all HTML first (bold, italic, inline code, fenced code, headings, lists, links http(s) only, paragraphs) is acceptable. The typing effect must reveal the formatted HTML progressively (truncate text nodes by character count), and restore the full HTML when done; reduced motion and no-JS show the formatted text.
