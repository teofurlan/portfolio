/**
 * Trial driver (P5 / T1, T2): themes x seeds (gemma only by default) against the local trial Worker, then a gallery.
The Worker runs the cron pipeline per piece: SVG attempt 1, SVG attempt 2, parameters.
 *   1. pnpm wrangler dev -c scripts/decoration/wrangler.trial.jsonc --port 8799
 *   2. node scripts/decoration/trials.ts [--models a,b,c] [--seeds 1,2,3,4] [--base http://127.0.0.1:8799] [--force parameters]
 * Output: trials/decoration/<timestamp>/{results.json,index.html} (git-ignored).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { THEMES } from '../../src/lib/decoration/themes.ts';

const arg = (name: string, dflt: string): string => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1]! : dflt;
};

const BASE = arg('base', 'http://127.0.0.1:8799');
const MODELS = arg('models', '@cf/google/gemma-4-26b-a4b-it').split(',');
const SEEDS = arg('seeds', '1,2,3,4').split(',').map(Number);
// --force parameters: skip the SVG attempts and show the code-drawn fallback.
const FORCE = arg('force', '');
const MAX_CALLS = 50;

type Path = 'svg-attempt-1' | 'svg-attempt-2' | 'parameters' | 'failed';
interface Attempt {
  kind: 'svg' | 'parameters';
  n: number;
  ok: boolean;
  errors: string[];
  raw: string;
  finish_reason: string | null;
  neurons: number | null;
  ms: number;
}
interface Result {
  model: string;
  theme: string;
  seed: number;
  selection?: { theme: string; motif: string; attitude: string };
  prompt?: string;
  parameterPrompt?: string;
  path: Path;
  ok: boolean;
  svg?: string;
  title_en?: string;
  title_es?: string;
  attempts: Attempt[];
  calls?: number;
  neurons?: number | null;
  ms?: number;
  error?: string;
}

let calls = 0;
async function run(model: string, theme: string, seed: number): Promise<Result> {
  const failed = (error: string): Result => ({ model, theme, seed, path: 'failed', ok: false, attempts: [], error });
  // A piece can cost up to 3 calls; never start one that could overshoot the budget.
  if (calls + 3 > MAX_CALLS) return failed('call budget exhausted (not run)');
  try {
    const url = `${BASE}/run?model=${encodeURIComponent(model)}&theme=${theme}&seed=${seed}${FORCE ? `&force=${FORCE}` : ''}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(400_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const r = (await res.json()) as Result;
    calls += r.calls ?? 0;
    return r;
  } catch (e) {
    calls += 1; // unknown how many calls happened; count one
    return failed(`runner request failed: ${e}`);
  }
}

const esc = (s: unknown): string =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const shortModel = (m: string) => m.split('/').pop()!;
const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n) + `… [${s.length - n} more chars]` : s);

const PATH_LABEL: Record<Path, string> = {
  'svg-attempt-1': 'svg-attempt-1: the model drew it on the first try',
  'svg-attempt-2': 'svg-attempt-2: the model drew it on the second try',
  parameters: 'parameters: the model chose parameters, code drew it',
  failed: 'failed: no valid piece (yesterday\'s piece would stay)',
};

function card(r: Result): string {
  const sel = r.selection;
  const head =
    `<div class="meta"><b>${esc(shortModel(r.model))}</b> · ${esc(r.theme)} · seed ${r.seed}<br>` +
    `motif: ${esc(sel?.motif)}<br>attitude: ${esc(sel?.attitude)}</div>`;
  const art = r.ok && r.svg ? `<div class="paper">${r.svg}</div>` : `<div class="paper none">no valid piece</div>`;
  const pathLine = `<div class="path path-${r.path}">${esc(PATH_LABEL[r.path])}</div>`;
  const titles = `<div class="titles">EN: ${esc(r.title_en) || '—'}<br>ES: ${esc(r.title_es) || '—'}</div>`;
  const failedAttempts = r.attempts.filter((a) => !a.ok);
  const fails = failedAttempts.length
    ? `<details class="fails"><summary>${failedAttempts.length} failed attempt${failedAttempts.length > 1 ? 's' : ''}</summary>` +
      failedAttempts
        .map(
          (a) =>
            `<div class="attempt"><b>${a.kind === 'svg' ? `svg attempt ${a.n}` : 'parameters'}</b> (finish_reason ${esc(a.finish_reason)}, ${(a.raw ?? '').length} chars)` +
            `<ul>${a.errors.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>` +
            `<pre>${esc(trunc(a.raw ?? '', 600))}</pre></div>`,
        )
        .join('') +
      `</details>`
    : '';
  const err = r.error ? `<div class="bad">${esc(r.error)}</div>` : '';
  const prompt = r.prompt ? `<details><summary>prompt</summary><pre>${esc(r.prompt)}</pre></details>` : '';
  return `<article class="card ${r.ok ? 'is-ok' : 'is-bad'}">${head}${art}${pathLine}${titles}${err}${fails}${prompt}</article>`;
}

function gallery(results: Result[], stamp: string): string {
  const ok = results.filter((r) => r.ok).length;
  const count = (p: Path) => results.filter((r) => r.path === p).length;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Decoration trials ${esc(stamp)}</title>
<style>
  body{font:14px/1.4 system-ui,sans-serif;background:#e9e4d3;color:#1d2c47;margin:24px}
  h1{font-size:20px} .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(440px,1fr));gap:16px;align-items:start}
  .card{background:#fff;border:1px solid #cfc8b3;padding:12px;border-radius:4px;min-width:0}
  .is-bad{border-color:#a62f08}
  .meta{font-size:12px;margin-bottom:8px}
  .paper{width:100%;aspect-ratio:5/3;background:#f6f0de;display:flex;align-items:center;justify-content:center;overflow:hidden}
  .paper svg{width:100%;height:100%;display:block}
  .paper.none{color:#a62f08}
  .path{font-size:12px;margin-top:6px;font-family:ui-monospace,monospace}
  .path-failed{color:#a62f08;font-weight:600} .path-parameters{color:#8a5a00}
  .titles{margin:8px 0;font-weight:600}
  .bad{color:#a62f08}
  details{margin-top:6px} summary{cursor:pointer;font-size:12px}
  .fails{border-top:1px dashed #cfc8b3;padding-top:4px}
  .attempt{font-size:12px;margin:6px 0} .attempt ul{margin:2px 0 4px 16px;padding:0;color:#a62f08}
  details pre{white-space:pre-wrap;word-break:break-all;font-size:11px;max-height:200px;overflow:auto;margin:2px 0}
</style></head><body>
<h1>Decoration trials · ${esc(stamp)}</h1>
<p>${ok}/${results.length} valid. svg-attempt-1: ${count('svg-attempt-1')}, svg-attempt-2: ${count('svg-attempt-2')}, parameters: ${count('parameters')}, failed: ${count('failed')}. Models: ${[...new Set(results.map((r) => r.model))].map((m) => esc(m)).join(', ')}.</p>
<div class="grid">
${results.map(card).join('\n')}
</div></body></html>
`;
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = resolve('trials', 'decoration', stamp);
mkdirSync(outDir, { recursive: true });

const results: Result[] = [];
for (const model of MODELS) {
  for (const theme of THEMES) {
    for (const seed of SEEDS) {
      const r = await run(model, theme.id, seed);
      results.push(r);
      console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${shortModel(model)} ${theme.id} #${seed} ${r.ms ?? '?'}ms neurons=${Math.round(r.neurons ?? 0)} path=${r.path}${r.ok ? '' : ' :: ' + (r.error ?? r.attempts.at(-1)?.errors[0])}`);
      // Persist progressively so a crash keeps what we have.
      writeFileSync(resolve(outDir, 'results.json'), JSON.stringify(results, null, 2));
    }
  }
}

writeFileSync(resolve(outDir, 'index.html'), gallery(results, stamp));

const rate = (rs: Result[]) => `${rs.filter((r) => r.ok).length}/${rs.length}`;
console.log(`\nValid: ${rate(results)}`);
for (const p of Object.keys(PATH_LABEL) as Path[]) console.log(`  ${p}: ${results.filter((r) => r.path === p).length}`);
console.log('By theme:');
for (const t of THEMES) console.log(`  ${t.id}: ${rate(results.filter((r) => r.theme === t.id))}`);
const neurons = results.reduce((n, r) => n + (r.neurons ?? 0), 0);
console.log(`Calls: ${calls}. Neurons reported: ${Math.round(neurons)}`);
console.log(`Gallery: ${resolve(outDir, 'index.html')}`);
