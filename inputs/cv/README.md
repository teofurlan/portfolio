# CV source data (private)

Everything in this folder except this README is **git-ignored**: it contains
private data (phone number; a LinkedIn export would add messages and contacts).

## Contents

- `resume.tex` — Teo's current CV (LaTeX, ATS-tuned). Copy of
  `C:/Users/teofu/OneDrive/Documentos/CV/resume.tex`; that original is the one
  Teo keeps editing, so re-copy it when it changes.
- Optional: LinkedIn data export CSVs (Settings & Privacy → Data privacy →
  *Get a copy of your data*), only if something is missing from the CV.

## How the site uses it

- `content/resume.json` (JSON Resume, public) is derived from `resume.tex`.
  Teo confirms every entry before it is published.
- The downloadable PDF is compiled from a **public variant** of the CV with
  the phone number removed. Never publish the phone number anywhere.
- The CV facts are authoritative over any automated summary of the repos
  (ownership, dates, team size).
