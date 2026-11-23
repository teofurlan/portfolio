/**
 * Preview gallery (P5 / T2, trial round 4). No network, no model calls, no wrangler.
 *   node scripts/decoration/preview.ts [--variants 2] [--roughness 1] [--results trials/decoration/<folder>/results.json]
 * Shows, CLEAN and MARKER side by side at the real 300x180 size:
 *   (a) every theme x motif drawn by the code renderers with seeded random parameters;
 *   (b) the model-drawn SVGs of the trial run in --results (default: 2026-11-17T20-14-14-936Z, 20 pieces).
 * Output: trials/decoration/<timestamp>-preview/index.html (git-ignored).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { THEMES } from '../../src/lib/decoration/themes.ts';
import { PARAMETER_RENDERERS } from '../../src/lib/decoration/prompt.ts';
import { seededRng } from '../../src/lib/decoration/rng.ts';
import { randomParams } from '../../src/lib/decoration/random-params.ts';
import { validateSvg } from '../../src/lib/decoration/validate.ts';
import { roughenDetailed } from '../../src/lib/decoration/rough.ts';

const arg = (name: string, dflt: string): string => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1]! : dflt;
};
const VARIANTS = Math.max(1, Math.min(6, Number(arg('variants', '2'))));
const ROUGHNESS = Number(arg('roughness', '1'));
const RESULTS = arg('results', 'trials/decoration/2026-11-17T20-14-14-936Z/results.json');

const esc = (s: unknown): string =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

interface Card {
  title: string;
  lines: string[];
  clean: string;
  marker: string;
  tier: number;
}

const TIER_LABEL = (tier: number): string =>
  tier === 0 ? 'full sketch (double stroke)' : tier > 0 ? `lighter sketch, tier ${tier} (size cap: single stroke${tier > 1 ? ', fewer vertices' : ''})` : 'NOT roughened (nothing fit the validator)';

function makeCard(title: string, lines: string[], svg: string, seed: number): Card {
  const v = validateSvg(svg);
  if (!v.ok) throw new Error(`${title}: clean svg is invalid: ${v.errors.join('; ')}`);
  const r = roughenDetailed(v.svg, { seed, roughness: ROUGHNESS });
  return { title, lines: [...lines, `clean ${v.svg.length} B · marker ${r.svg.length} B · ${TIER_LABEL(r.tier)}`], clean: v.svg, marker: r.svg, tier: r.tier };
}

const cardHtml = (c: Card): string =>
  `<article class="card${c.tier < 0 ? ' is-bad' : ''}"><div class="meta"><b>${esc(c.title)}</b><br>${c.lines.map(esc).join('<br>')}</div>` +
  `<div class="pair"><figure><div class="paper">${c.clean}</div><figcaption>CLEAN</figcaption></figure>` +
  `<figure><div class="paper">${c.marker}</div><figcaption>MARKER</figcaption></figure></div></article>`;

// (a) code renderers
const codeCards: Card[] = [];
for (const theme of THEMES) {
  theme.motifs.forEach((motif, mi) => {
    for (let v = 0; v < VARIANTS; v++) {
      const seed = 1 + v;
      const rng = seededRng(seed * 1000 + mi * 17 + theme.id.length);
      const params = randomParams(theme.id, mi, rng);
      const render = PARAMETER_RENDERERS[theme.id] as unknown as (p: unknown, m: string) => string;
      codeCards.push(makeCard(`${theme.name} · ${motif}`, [`drawn by code · variant ${v + 1}`, `params: ${JSON.stringify(params).slice(0, 160)}`], render(params, motif), seed * 31 + mi));
    }
  });
}

// (b) the model's own SVGs
interface TrialResult {
  model?: string;
  theme?: string;
  seed?: number;
  ok?: boolean;
  svg?: string;
  path?: string;
  selection?: { motif?: string; attitude?: string };
  title_en?: string;
}
const trial = JSON.parse(readFileSync(resolve(RESULTS), 'utf8')) as TrialResult[];
const modelCards: Card[] = [];
const skipped: string[] = [];
trial.forEach((r, i) => {
  if (!r.ok || !r.svg) {
    skipped.push(`#${i} ${r.theme} seed ${r.seed}`);
    return;
  }
  modelCards.push(makeCard(`${r.theme} · seed ${r.seed}`, [`motif: ${r.selection?.motif}`, `attitude: ${r.selection?.attitude}`, `path: ${r.path} · title: ${r.title_en ?? ''}`], r.svg, 100 + i));
});

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = resolve('trials', 'decoration', `${stamp}-preview`);
mkdirSync(outDir, { recursive: true });
const tiers = (cards: Card[]) => `${cards.filter((c) => c.tier === 0).length} full sketch, ${cards.filter((c) => c.tier > 0).length} lighter, ${cards.filter((c) => c.tier < 0).length} not roughened`;
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Decoration preview ${esc(stamp)}</title>
<style>
  body{font:14px/1.4 system-ui,sans-serif;background:#e9e4d3;color:#1d2c47;margin:24px}
  h1{font-size:20px} h2{font-size:17px;margin-top:32px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(660px,1fr));gap:16px;align-items:start}
  .card{background:#fff;border:1px solid #cfc8b3;padding:12px;border-radius:4px;min-width:0}
  .is-bad{border-color:#a62f08}
  .meta{font-size:12px;margin-bottom:8px;overflow-wrap:anywhere}
  .pair{display:flex;gap:12px;flex-wrap:wrap}
  figure{margin:0}
  figcaption{font:600 11px ui-monospace,monospace;letter-spacing:.08em;margin-top:4px}
  .paper{width:300px;height:180px;background:#f6f0de;overflow:hidden}
  .paper svg{width:300px;height:180px;display:block}
</style></head><body>
<h1>Decoration preview · ${esc(stamp)}</h1>
<p>No model calls. Marker = roughjs sketch at roughness ${ROUGHNESS}, stroke only, round caps, validated again. Each version is shown at the real 300×180 size.</p>
<h2>(a) Code renderers: every theme × motif, ${VARIANTS} seeded random parameter sets each (${codeCards.length} pieces; ${esc(tiers(codeCards))})</h2>
<div class="grid">
${codeCards.map(cardHtml).join('\n')}
</div>
<h2>(b) Model-drawn SVGs from ${esc(RESULTS)} (${modelCards.length} pieces; ${esc(tiers(modelCards))}${skipped.length ? `; skipped invalid: ${esc(skipped.join(', '))}` : ''})</h2>
<div class="grid">
${modelCards.map(cardHtml).join('\n')}
</div></body></html>
`;
writeFileSync(resolve(outDir, 'index.html'), html);
console.log(`code renderers: ${codeCards.length} cards (${tiers(codeCards)})`);
console.log(`model svgs: ${modelCards.length} cards (${tiers(modelCards)})`);
console.log(`Gallery: ${resolve(outDir, 'index.html')}`);
