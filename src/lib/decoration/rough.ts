/**
 * Marker ("fibra", Excalidraw-like) stroke for the daily decoration (P5 / T2, trial round 4).
 *
 * `roughen` takes an ALREADY VALIDATED svg (the output of `validateSvg`) and redraws every
 * drawable element with roughjs (MIT; `generator()` + `toPaths` need no DOM): one rough <path> per
 * element (the multi-stroke sketch lines are merged into that path's `d`), stroke only, fill none,
 * a slightly thicker marker weight and round caps. Stroke colours, group nesting (the single accent
 * group) and dashes are kept. The result is validated again; if the sketch wobbles out of the
 * canvas or past the byte budget it is retried with less roughness, and as a last resort the clean
 * input is returned, so the output always passes `validateSvg`.
 * Pure and deterministic for a given (svg, seed, roughness).
 */
import rough from 'roughjs';
import { CANVAS_H, CANVAS_W, INK, VIEWBOX, validateSvg } from './validate.ts';

export interface RoughOptions {
  seed: number;
  /** roughjs roughness: 0 is clean, 1 is the default sketch, 2+ is very shaky. Default 1. */
  roughness?: number;
}

/** Marker weight for ink lines, and for the thin construction lines of the clean drawing. */
export const MARKER_WIDTH = 1.6; // L9
export const MARKER_THIN_WIDTH = 1.1;

const TAG = /<(\/?)([a-zA-Z]+)((?:\s+[\w-]+="[^"]*")*)\s*(\/?)>/g;
const ATTR = /([\w-]+)="([^"]*)"/g;

const attrsOf = (src: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const m of src.matchAll(ATTR)) out[m[1]!] = m[2]!;
  return out;
};
const nums = (s: string | undefined): number[] => (s ?? '').trim().split(/[\s,]+/).filter(Boolean).map(Number);
const pairs = (s: string | undefined): [number, number][] => {
  const n = nums(s);
  const out: [number, number][] = [];
  for (let i = 0; i + 1 < n.length; i += 2) out.push([n[i]!, n[i + 1]!]);
  return out;
};

/** Distinct, non-zero seed per element (roughjs treats 0 as "random"). */
const elementSeed = (seed: number, index: number): number => {
  const s = (Math.imul((seed | 0) ^ 0x5bd1e995, 0x01000193) + Math.imul(index + 1, 0x9e3779b1)) >>> 0;
  return (s % 2147483646) + 1;
};

function sketch(svg: string, seed: number, roughness: number, tier: Tier): string {
  const gen = rough.generator();
  const out: string[] = [];
  const stack: Record<string, string>[] = [];
  let rootStroke = INK;
  let index = 0;
  for (const m of svg.matchAll(TAG)) {
    const [, closing, name, rawAttrs, selfClosing] = m as unknown as [string, string, string, string, string];
    const a = attrsOf(rawAttrs);
    if (closing) {
      if (name === 'g') {
        stack.pop();
        out.push('</g>');
      }
      continue;
    }
    if (name === 'svg') {
      rootStroke = a['stroke'] ?? INK;
      continue;
    }
    if (name === 'g') {
      stack.push(a);
      out.push(a['stroke'] && a['stroke'] !== rootStroke ? `<g stroke="${a['stroke']}">` : '<g>');
      continue;
    }
    void selfClosing;
    const options = {
      seed: elementSeed(seed, index++),
      roughness,
      bowing: 1,
      fixedDecimalPlaceDigits: 1,
      preserveVertices: false,
      disableMultiStroke: !tier.multiStroke,
      curveStepCount: tier.curveSteps,
    };
    const n = (k: string): number => Number(a[k] ?? 0);
    let drawable;
    switch (name) {
      case 'line':
        drawable = gen.line(n('x1'), n('y1'), n('x2'), n('y2'), options);
        break;
      case 'rect':
        // Tiny corner radii (keys, connectors) are not worth the extra curve bytes: plain rectangle.
        drawable = n('rx') >= 3 ? gen.path(roundedRect(n('x'), n('y'), n('width'), n('height'), n('rx')), options) : gen.rectangle(n('x'), n('y'), n('width'), n('height'), options);
        break;
      case 'circle':
        drawable = gen.circle(n('cx'), n('cy'), n('r') * 2, options);
        break;
      case 'ellipse':
        drawable = gen.ellipse(n('cx'), n('cy'), n('rx') * 2, n('ry') * 2, options);
        break;
      case 'polygon':
        drawable = gen.polygon(decimate(pairs(a['points']), tier.maxPoints), options);
        break;
      case 'polyline':
        {
          const pts = decimate(pairs(a['points']), tier.maxPoints);
          // Densely sampled polylines are curves (waves, arcs): sketch them smooth instead of segment by segment.
          drawable = pts.length >= CURVE_MIN_POINTS ? gen.curve(pts, options) : gen.linearPath(pts, options);
        }
        break;
      case 'path':
        drawable = gen.path(a['d'] ?? '', options);
        break;
      default:
        continue;
    }
    let d = gen
      .toPaths(drawable)
      .map((p) => p.d)
      .filter(Boolean)
      .join(' ')
      .replace(/,\s*/g, ' ');
    d = fitToCanvas(d);
    if (!d) continue;
    const thin = a['stroke-width'] !== undefined && Number(a['stroke-width']) < 1;
    const width = thin ? ` stroke-width="${MARKER_THIN_WIDTH}"` : '';
    const dash = a['stroke-dasharray'] ? ` stroke-dasharray="${a['stroke-dasharray']}"` : '';
    const stroke = a['stroke'] && a['stroke'] !== (stack.at(-1)?.['stroke'] ?? rootStroke) ? ` stroke="${a['stroke']}"` : '';
    out.push(`<path d="${d}"${stroke}${width}${dash}/>`);
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}" fill="none" stroke="${rootStroke}" stroke-width="${MARKER_WIDTH}"` +
    ` stroke-linecap="round" stroke-linejoin="round">${out.join('')}</svg>`
  );
}

/**
 * Detail tiers, richest first. A sketched stroke is several times heavier than a straight line, and S10
 * caps a piece at 16 KB, so heavy pieces step down: single stroke, then fewer curve segments and fewer
 * vertices on long polylines/polygons.
 */
interface Tier {
  multiStroke: boolean;
  curveSteps: number;
  maxPoints: number;
}
const TIERS: Tier[] = [
  { multiStroke: true, curveSteps: 9, maxPoints: 240 },
  { multiStroke: false, curveSteps: 9, maxPoints: 240 },
  { multiStroke: false, curveSteps: 6, maxPoints: 48 },
  { multiStroke: false, curveSteps: 5, maxPoints: 28 },
  { multiStroke: false, curveSteps: 4, maxPoints: 16 },
];

const CURVE_MIN_POINTS = 10;

/**
 * roughjs ignores fixedDecimalPlaceDigits in toPaths, so round to 0.1 here (bytes matter, S10), and pull
 * every coordinate (control points included: smooth Q/T curves can overshoot) back inside the validator's
 * canvas tolerance. roughjs paths are absolute M/L/C only, so numbers alternate x, y.
 */
function fitToCanvas(d: string): string {
  let k = 0;
  return d
    .replace(/-?\d+(?:\.\d+)?e-\d+/g, '0')
    .replace(/-?\d+(?:\.\d+)?/g, (x) => {
      const max = k++ % 2 === 0 ? CANVAS_W + 4 : CANVAS_H + 4;
      const v = Math.min(max, Math.max(-4, Number(x)));
      return String(Math.round(v * 10) / 10);
    });
}

/** Rounded rectangle outline (roughjs's rectangle() ignores the corner radius). */
function roundedRect(x: number, y: number, w: number, h: number, rx: number): string {
  const r = Math.min(rx, w / 2, h / 2);
  return (
    `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}` +
    `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
  );
}

/** Keep at most `max` points, evenly spread, always keeping the first and the last. */
function decimate(pts: [number, number][], max: number): [number, number][] {
  if (pts.length <= max) return pts;
  const out: [number, number][] = [];
  for (let i = 0; i < max; i++) out.push(pts[Math.round((i * (pts.length - 1)) / (max - 1))]!);
  return out;
}

export interface RoughResult {
  svg: string;
  /** Index into the detail tiers (0 = full double-stroke sketch); -1 when the clean input had to be returned. */
  tier: number;
  roughness: number;
}

/**
 * Redraw a validated SVG with a marker-like hand-drawn stroke. Tries the richest tier first and the
 * requested roughness, then half of it, before stepping down a tier. Returns the clean `svg` unchanged
 * (tier -1) only if nothing validates.
 */
export function roughenDetailed(svg: string, opts: RoughOptions): RoughResult {
  const requested = Math.min(3, Math.max(0, Number.isFinite(opts.roughness) ? (opts.roughness as number) : 1));
  for (let t = 0; t < TIERS.length; t++) {
    for (const factor of [1, 0.5]) {
      const roughness = requested * factor;
      const v = validateSvg(sketch(svg, opts.seed, roughness, TIERS[t]!));
      if (v.ok) return { svg: v.svg, tier: t, roughness };
    }
  }
  return { svg, tier: -1, roughness: 0 };
}

export const roughen = (svg: string, opts: RoughOptions): string => roughenDetailed(svg, opts).svg;
