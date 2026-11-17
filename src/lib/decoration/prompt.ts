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
  // Scramble the seed first: mulberry32's first draws barely differ for small consecutive seeds
  // (seeds 1-4 only ever picked two of the five attitudes).
  let a = Math.imul((seed >>> 0) ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
  a = Math.imul(a ^ (a >>> 13), 0xc2b2ae35) >>> 0;
  a = (a ^ (a >>> 16)) >>> 0;
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
// Deterministic renderers (parameter mode), one per theme. All clamp their input.
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

const svgOf = (body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}" fill="none" stroke="${INK}" stroke-width="1.5">${body}</svg>`;
const accentGroup = (els: string[]): string => (els.length ? `<g stroke="${ACCENT}">${els.join('')}</g>` : '');
const asArray = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : []);
const asObject = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

export interface SoundVoiceParams {
  bars?: number[];
  accent?: number;
}

/** Amplitude bars mirrored around a centre line, like a waveform of a phrase. */
export function renderSoundVoice(params: SoundVoiceParams): string {
  const p = asObject(params);
  const given = asArray(p['bars'], 40);
  const amps = (given.length >= 8 ? given : [0.2, 0.5, 0.8, 0.4, 0.9, 0.6, 0.3, 0.7, 0.5, 0.2]).map((a) => clamp(a, 0.04, 1, 0.3));
  const accent = Math.round(clamp(p['accent'], 0, amps.length - 1, amps.indexOf(Math.max(...amps))));
  const pitch = 160 / amps.length;
  const ink: string[] = [`<line x1="14" y1="60" x2="186" y2="60" stroke-width="0.6"/>`];
  const acc: string[] = [];
  amps.forEach((a, i) => {
    const x = 20 + pitch * (i + 0.5);
    const h = a * 46;
    (i === accent ? acc : ink).push(`<line x1="${f(x)}" y1="${f(60 - h)}" x2="${f(x)}" y2="${f(60 + h)}" stroke-width="${f(Math.min(3, Math.max(1, pitch * 0.45)))}"/>`);
  });
  return svgOf(ink.join('') + accentGroup(acc));
}

export interface CircuitsParams {
  traces?: { from?: number[]; to?: number[] }[];
  accent?: number;
}

/** Orthogonal traces (horizontal then vertical) with pads, over a chip outline. */
export function renderCircuits(params: CircuitsParams): string {
  const p = asObject(params);
  const dflt = [
    { from: [20, 20], to: [80, 50] },
    { from: [20, 60], to: [90, 90] },
    { from: [180, 30], to: [130, 70] },
    { from: [170, 100], to: [120, 60] },
  ];
  const seen = new Set<string>();
  const traces: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const source = asArray(p['traces'], 10).map(asObject);
  for (const t of source.length >= 3 ? source : dflt) {
    const from = asArray(t['from'], 2);
    const to = asArray(t['to'], 2);
    const x1 = Math.round(clamp(from[0], 8, 192, 20));
    const y1 = Math.round(clamp(from[1], 8, 112, 20));
    const x2 = Math.round(clamp(to[0], 8, 192, 100));
    const y2 = Math.round(clamp(to[1], 8, 112, 60));
    const key = `${x1},${y1},${x2},${y2}`;
    if (!seen.has(key)) {
      seen.add(key);
      traces.push({ x1, y1, x2, y2 });
    }
  }
  const accent = Math.round(clamp(p['accent'], 0, traces.length - 1, traces.length - 1));
  // A chip outline with pins, always present, so the plate never ends up empty.
  const ink: string[] = [`<rect x="86" y="46" width="28" height="28" rx="2"/>`];
  for (let i = 0; i < 4; i++) {
    const y = 51 + i * 6;
    ink.push(`<line x1="80" y1="${y}" x2="86" y2="${y}"/>`, `<line x1="114" y1="${y}" x2="120" y2="${y}"/>`);
  }
  const acc: string[] = [];
  const pads = new Set<string>();
  traces.forEach((t, i) => {
    (i === accent ? acc : ink).push(`<path d="M${t.x1} ${t.y1} H${t.x2} V${t.y2}"/>`);
    for (const [x, y] of [[t.x1, t.y1], [t.x2, t.y2]] as const) {
      const k = `${x},${y}`;
      if (pads.has(k)) continue;
      pads.add(k);
      (i === accent ? acc : ink).push(`<circle cx="${x}" cy="${y}" r="2.5"/>`);
    }
  });
  return svgOf(ink.join('') + accentGroup(acc));
}

export interface OldComputersParams {
  keys?: { rows?: number; cols?: number };
  accent?: number[];
}

/** A keyboard seen from above: a tray of keys with one highlighted. */
export function renderOldComputers(params: OldComputersParams): string {
  const p = asObject(params);
  const k = asObject(p['keys']);
  const rows = Math.round(clamp(k['rows'], 3, 5, 4));
  const cols = Math.round(clamp(k['cols'], 8, 14, 11));
  const a = asArray(p['accent'], 2);
  const ar = Math.round(clamp(a[0], 0, rows - 1, 1));
  const ac = Math.round(clamp(a[1], 0, cols - 1, 4));
  const pitchX = 164 / cols;
  const pitchY = 13;
  const top = 60 - (rows * pitchY) / 2;
  const ink: string[] = [`<rect x="12" y="${f(top - 8)}" width="176" height="${f(rows * pitchY + 14)}" rx="4"/>`];
  const acc: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `<rect x="${f(18 + c * pitchX + 1)}" y="${f(top + r * pitchY + 1)}" width="${f(pitchX - 2)}" height="${pitchY - 3}" rx="1"/>`;
      (r === ar && c === ac ? acc : ink).push(key);
    }
  }
  return svgOf(ink.join('') + accentGroup(acc));
}

export interface TechnicalDrawingParams {
  gears?: { teeth?: number; radius?: number }[];
  accent?: number;
}

/** Meshing gears in a row on a centre line, drawn as toothed polygons. */
export function renderTechnicalDrawing(params: TechnicalDrawingParams): string {
  const p = asObject(params);
  const given = asArray(p['gears'], 3).map(asObject);
  const specs = given.length >= 2 ? given : [{ teeth: 12, radius: 22 }, { teeth: 16, radius: 30 }];
  const gears = specs.map((g) => ({
    teeth: Math.round(clamp(g['teeth'], 8, 24, 12)),
    r: clamp(g['radius'], 10, 40, 24),
  }));
  const accent = Math.round(clamp(p['accent'], 0, gears.length - 1, 0));
  const tooth = (r: number) => Math.max(2, r * 0.18);
  const outer = gears.map((g) => g.r + tooth(g.r) / 2);
  // Neighbouring pitch circles touch; scale the whole row to fit 160 wide.
  const centres: number[] = [outer[0]!];
  for (let i = 1; i < gears.length; i++) centres.push(centres[i - 1]! + gears[i - 1]!.r + gears[i]!.r);
  const left = 0;
  const right = centres[centres.length - 1]! + outer[outer.length - 1]!;
  const s = Math.min(1, 160 / (right - left));
  const x0 = 100 - ((right - left) * s) / 2;
  const ink: string[] = [];
  const acc: string[] = [];
  gears.forEach((g, i) => {
    const cx = x0 + centres[i]! * s;
    const cy = 60;
    const rIn = (g.r - tooth(g.r) / 2) * s;
    const rOut = (g.r + tooth(g.r) / 2) * s;
    const step = (2 * Math.PI) / g.teeth;
    // Offset alternate gears by half a tooth so they interlock.
    const phase = i % 2 ? step / 2 : 0;
    const pts: string[] = [];
    for (let t = 0; t < g.teeth; t++) {
      const a0 = phase + t * step;
      for (const [da, r] of [[0, rIn], [0.1, rOut], [0.4, rOut], [0.5, rIn]] as const) {
        const a = a0 + da * step;
        pts.push(`${f(cx + r * Math.cos(a))},${f(cy + r * Math.sin(a))}`);
      }
    }
    const els = [
      `<polygon points="${pts.join(' ')}"/>`,
      `<circle cx="${f(cx)}" cy="${cy}" r="${f(g.r * s)}" stroke-width="0.5" stroke-dasharray="3 2"/>`,
      `<circle cx="${f(cx)}" cy="${cy}" r="${f(Math.max(1.5, g.r * s * 0.2))}"/>`,
      `<line x1="${f(cx - rOut - 4)}" y1="${cy}" x2="${f(cx + rOut + 4)}" y2="${cy}" stroke-width="0.4"/>`,
    ];
    (i === accent ? acc : ink).push(...els);
  });
  return svgOf(ink.join('') + accentGroup(acc));
}

/** Deterministic parameter renderer per theme (S4 fallback). */
export const PARAMETER_RENDERERS: Record<string, (params: never) => string> = {
  mechanisms: renderMechanisms as (params: never) => string,
  'sound-voice': renderSoundVoice as (params: never) => string,
  circuits: renderCircuits as (params: never) => string,
  'old-computers': renderOldComputers as (params: never) => string,
  'technical-drawing': renderTechnicalDrawing as (params: never) => string,
};
