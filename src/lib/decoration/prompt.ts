/**
 * Prompt builder + parameter-mode renderer for the daily decoration (P5 / S4, S7).
 * Pure: the RNG is injected so tests and the cron Worker control randomness.
 */
import { ACCENT, INK, VIEWBOX } from './validate';
import { ATTITUDES, THEMES, getTheme } from './themes';

export interface Selection {
  theme: string;
  motif: string;
  attitude: string;
}
export interface Message {
  role: 'system' | 'user';
  content: string;
}

/** Small deterministic RNG (mulberry32) for trials and tests. */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(list: readonly T[], rng: () => number): T =>
  list[Math.min(list.length - 1, Math.floor(rng() * list.length))]!;

export function pickSelection(themeId: string, rng: () => number): Selection {
  const theme = getTheme(themeId);
  if (!theme) throw new Error(`unknown theme: ${themeId}`);
  return { theme: themeId, motif: pick(theme.motifs, rng), attitude: pick(ATTITUDES, rng) };
}

export const themeIds = (): string[] => THEMES.map((t) => t.id);

const CONSTRAINTS = [
  'Hard constraints (any violation makes the piece unusable):',
  `- SVG only, with viewBox="${VIEWBOX}" (a 5:3 canvas).`,
  `- Stroke-only line art: stroke="${INK}" (ink), fill="none" everywhere, transparent background (no background rectangle).`,
  `- Optionally ONE group of elements in the accent colour ${ACCENT}; every other colour is forbidden.`,
  '- Allowed elements: svg, g, path, line, polyline, polygon, circle, ellipse, rect. No transform, style, class, id, defs, text, image, use or script.',
  '- no text, letters or numbers anywhere in the drawing.',
  '- Between 5 and 120 drawable elements, all inside the canvas, under 8 KB in total.',
].join('\n');

const ENVELOPE =
  'Reply with ONLY a JSON object, no markdown fences and no commentary: ' +
  '{"title_en":"<short English title, max 40 characters>","title_es":"<título corto en español, máx. 40 caracteres>","svg":"<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 200 120\\">...</svg>"}. ' +
  'The titles are plain text, evocative, with no quotes. Escape quotes inside the svg string or use single quotes for SVG attributes.';

export function buildPrompt(sel: Selection): Message[] {
  const theme = getTheme(sel.theme);
  if (!theme) throw new Error(`unknown theme: ${sel.theme}`);
  return [
    {
      role: 'system',
      content: 'You are a careful illustrator who draws small decorative SVG plates and follows format rules exactly.',
    },
    {
      role: 'user',
      content: [
        theme.draft,
        `Today's motif: ${sel.motif}.`,
        `Attitude of the line: ${sel.attitude}.`,
        '',
        CONSTRAINTS,
        '',
        ENVELOPE,
      ].join('\n'),
    },
  ];
}

/** S4 fallback: the model only picks parameters; code draws the SVG. */
export function buildParameterPrompt(sel: Selection): Message[] {
  const theme = getTheme(sel.theme);
  if (!theme) throw new Error(`unknown theme: ${sel.theme}`);
  return [
    { role: 'system', content: 'You choose parameters for a drawing routine and answer with JSON only.' },
    {
      role: 'user',
      content: [
        `Theme: ${theme.name}. Motif: ${sel.motif}. Attitude: ${sel.attitude}.`,
        `Reply with ONLY a JSON object of parameters, no commentary, shaped like: ${theme.paramSpec}`,
        'Also include "title_en" and "title_es": short plain-text titles (max 40 characters).',
      ].join('\n'),
    },
  ];
}

// ---------------------------------------------------------------------------
// Deterministic renderers (parameter mode). Only `mechanisms` exists so far.
// ---------------------------------------------------------------------------

export interface MechanismsParams {
  links?: number[];
  angles?: number[];
  accent?: number;
}

const clamp = (n: unknown, lo: number, hi: number, dflt: number): number =>
  typeof n === 'number' && Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
const f = (n: number) => String(Math.round(n * 10) / 10);

export function renderMechanisms(params: MechanismsParams): string {
  const p = params && typeof params === 'object' ? params : {};
  const dl = [45, 35, 25];
  const da = [40, -30, -50];
  const links = [0, 1, 2].map((i) => clamp(p.links?.[i], 10, 60, dl[i]!));
  const angles = [0, 1, 2].map((i) => clamp(p.angles?.[i], -180, 180, da[i]!));
  const accent = Math.round(clamp(p.accent, 0, 2, 2));

  // Chain in maths coordinates (y up), cumulative angles from the horizontal.
  const pts: [number, number][] = [[0, 0]];
  let a = 0;
  for (let i = 0; i < 3; i++) {
    a += (angles[i]! * Math.PI) / 180;
    const [x, y] = pts[i]!;
    pts.push([x + links[i]! * Math.cos(a), y + links[i]! * Math.sin(a)]);
  }
  const xs = pts.map((q) => q[0]);
  const ys = pts.map((q) => q[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(0, ...ys);
  const maxY = Math.max(0, ...ys);
  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);
  // Fit the whole chain (above and below the base) in 150 x 80 around the ground line.
  const s = Math.min(1, 150 / w, 80 / h);
  const groundY = 90;
  const ox = 100 - ((minX + maxX) / 2) * s;
  const oy = groundY - 4;
  const P = pts.map(([x, y]) => [ox + x * s, Math.max(8, Math.min(112, oy - y * s))] as [number, number]);

  const el: string[] = [];
  el.push(`<line x1="20" y1="${groundY}" x2="180" y2="${groundY}"/>`);
  for (let x = 28; x <= 172; x += 16) el.push(`<line x1="${x}" y1="${groundY}" x2="${x - 6}" y2="${groundY + 6}"/>`);
  const [bx, by] = P[0]!;
  el.push(`<polygon points="${f(bx - 8)},${groundY} ${f(bx + 8)},${groundY} ${f(bx)},${f(by)}"/>`);
  const ink: string[] = [];
  const acc: string[] = [];
  for (let i = 0; i < 3; i++) {
    const [x1, y1] = P[i]!;
    const [x2, y2] = P[i + 1]!;
    (i === accent ? acc : ink).push(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke-width="2"/>`);
  }
  for (let i = 0; i < 4; i++) ink.push(`<circle cx="${f(P[i]![0])}" cy="${f(P[i]![1])}" r="3"/>`);
  const body = el.join('') + ink.join('') + (acc.length ? `<g stroke="${ACCENT}">${acc.join('')}</g>` : '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}" fill="none" stroke="${INK}" stroke-width="1.5">${body}</svg>`;
}

/** Which themes have a deterministic parameter renderer so far. */
export const PARAMETER_RENDERERS: Record<string, (params: never) => string> = {
  mechanisms: renderMechanisms as (params: never) => string,
};
