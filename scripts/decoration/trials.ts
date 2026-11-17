/**
 * Trial driver (P5 / T1): models x themes x seeds against the local trial Worker, then a gallery.
 *   1. pnpm wrangler dev -c scripts/decoration/wrangler.trial.jsonc --port 8799
 *   2. node scripts/decoration/trials.ts [--models a,b,c] [--seeds 1,2] [--base http://127.0.0.1:8799]
 * --reuse <results.json> keeps earlier results for models not re-run now (saves calls).
 * Output: trials/decoration/<timestamp>/{results.json,index.html} (git-ignored).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { THEMES } from '../../src/lib/decoration/themes.ts';

const arg = (name: string, dflt: string): string => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1]! : dflt;
};

const BASE = arg('base', 'http://127.0.0.1:8799');
const MODELS = arg('models', '@cf/zai-org/glm-4.7-flash,@cf/google/gemma-4-26b-a4b-it,@cf/qwen/qwen3-30b-a3b-fp8').split(',');
const SEEDS = arg('seeds', '1,2').split(',').map(Number);
const MAX_CALLS = 60;

interface Result {
  model: string;
  theme: string;
  seed: number;
  selection?: { theme: string; motif: string; attitude: string };
  prompt?: string;
  raw?: string;
  title_en?: string;
  title_es?: string;
  ok: boolean;
  svg?: string;
  errors: string[];
  neurons?: number | null;
  ms?: number;
  finish_reason?: string | null;
}

let calls = 0;
async function run(model: string, theme: string, seed: number): Promise<Result> {
  for (let attempt = 0; attempt < 2; attempt++) {
    if (calls >= MAX_CALLS) return { model, theme, seed, ok: false, errors: ['call budget exhausted'] };
    calls++;
    try {
      const url = `${BASE}/run?model=${encodeURIComponent(model)}&theme=${theme}&seed=${seed}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(280_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as Result;
    } catch (e) {
      console.error(`  ${model} ${theme} #${seed} attempt ${attempt + 1} failed: ${e}`);
    }
  }
  return { model, theme, seed, ok: false, errors: ['runner request failed twice'] };
}

const esc = (s: unknown): string =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const shortModel = (m: string) => m.split('/').pop()!;

function card(r: Result): string {
  const sel = r.selection;
  const head =
    `<div class="meta"><b>${esc(shortModel(r.model))}</b> · ${esc(r.theme)} · seed ${r.seed}<br>` +
    `motif: ${esc(sel?.motif)}<br>attitude: ${esc(sel?.attitude)}</div>`;
  const titles = `<div class="titles">EN: ${esc(r.title_en) || '—'}<br>ES: ${esc(r.title_es) || '—'}</div>`;
  const status = r.ok ? '<div class="ok">valid</div>' : `<div class="bad">invalid<ul>${r.errors.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>`;
  const art = r.ok && r.svg ? `<div class="paper">${r.svg}</div>` : `<div class="paper raw"><pre>${esc((r.raw ?? '').slice(0, 3000))}</pre></div>`;
  const prompt = r.prompt ? `<details><summary>prompt</summary><pre>${esc(r.prompt)}</pre></details>` : '';
  return `<article class="card ${r.ok ? 'is-ok' : 'is-bad'}">${head}${art}${titles}${status}${prompt}</article>`;
}

function gallery(results: Result[], stamp: string): string {
  const ok = results.filter((r) => r.ok).length;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Decoration trials ${esc(stamp)}</title>
<style>
  body{font:14px/1.4 system-ui,sans-serif;background:#e9e4d3;color:#1d2c47;margin:24px}
  h1{font-size:20px} .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:16px}
  .card{background:#fff;border:1px solid #cfc8b3;padding:12px;border-radius:4px}
  .is-bad{border-color:#a62f08}
  .meta{font-size:12px;margin-bottom:8px}
  .paper{width:300px;height:180px;background:#f6f0de;display:flex;align-items:center;justify-content:center;overflow:hidden}
  .paper svg{width:300px;height:180px;display:block}
  .paper.raw{align-items:stretch;justify-content:flex-start;overflow:auto}
  .paper.raw pre{margin:4px;font-size:10px;white-space:pre-wrap;word-break:break-all}
  .titles{margin:8px 0;font-weight:600}
  .ok{color:#1b6b2f;font-weight:600} .bad{color:#a62f08} .bad ul{margin:4px 0 0 16px;padding:0;font-size:12px}
  details pre{white-space:pre-wrap;font-size:11px;max-height:260px;overflow:auto}
</style></head><body>
<h1>Decoration trials · ${esc(stamp)}</h1>
<p>${ok}/${results.length} valid. Models: ${[...new Set(results.map((r) => r.model))].map((m) => esc(m)).join(', ')}. Cards are rendered at 300×180 on #f6f0de.</p>
<div class="grid">
${results.map(card).join('\n')}
</div></body></html>
`;
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = resolve('trials', 'decoration', stamp);
mkdirSync(outDir, { recursive: true });

const reuse = arg('reuse', '');
const kept: Result[] = reuse ? (JSON.parse(readFileSync(reuse, 'utf8')) as Result[]).filter((r) => !MODELS.includes(r.model)) : [];
const results: Result[] = [...kept];
for (const model of MODELS) {
  for (const theme of THEMES) {
    for (const seed of SEEDS) {
      const r = await run(model, theme.id, seed);
      results.push(r);
      console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${shortModel(model)} ${theme.id} #${seed} ${r.ms ?? '?'}ms neurons=${r.neurons ?? '?'}${r.ok ? '' : ' :: ' + r.errors[0]}`);
      // Persist progressively so a crash keeps what we have.
      writeFileSync(resolve(outDir, 'results.json'), JSON.stringify(results, null, 2));
    }
  }
}

writeFileSync(resolve(outDir, 'index.html'), gallery(results, stamp));

const ALL_MODELS = [...new Set(results.map((r) => r.model))];
const rate = (rs: Result[]) => `${rs.filter((r) => r.ok).length}/${rs.length}`;
console.log('\nBy model:');
for (const m of ALL_MODELS) console.log(`  ${shortModel(m)}: ${rate(results.filter((r) => r.model === m))}`);
console.log('By theme:');
for (const t of THEMES) console.log(`  ${t.id}: ${rate(results.filter((r) => r.theme === t.id))}`);
const neurons = results.reduce((n, r) => n + (r.neurons ?? 0), 0);
console.log(`Calls: ${calls}. Neurons reported: ${Math.round(neurons)}`);
console.log(`Gallery: ${resolve(outDir, 'index.html')}`);
