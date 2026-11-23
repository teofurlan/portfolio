/**
 * Shared helpers for the parameter-mode renderers (P5 / S4, S7, S10).
 * `Plate` collects drawable elements, clamps every coordinate into the canvas and refuses to
 * outgrow the validator's element and byte budgets, so a renderer can never emit an invalid piece.
 */
import { ACCENT, CANVAS_H, CANVAS_W, INK, VIEWBOX } from '../validate.ts';
import { getTheme } from '../themes.ts';
import { seededRng } from '../rng.ts';

export const clamp = (n: unknown, lo: number, hi: number, dflt: number): number =>
  typeof n === 'number' && Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
export const f = (n: number): string => String(Math.round(n * 10) / 10);
export const asArray = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : []);
export const asObject = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
export const num = (p: Record<string, unknown>, key: string, lo: number, hi: number, dflt: number): number => clamp(p[key], lo, hi, dflt);
export const int = (p: Record<string, unknown>, key: string, lo: number, hi: number, dflt: number): number =>
  Math.round(clamp(p[key], lo, hi, dflt));

export type Pt = [number, number];

/** The model's own line weight is 1.2-1.6; construction lines go thinner. */
export const WEIGHT = 1.4;
export const THIN = 0.6;
const MAX_DRAWABLE = 116;
const MAX_BODY_BYTES = 7400;

/** Index of the motif inside its theme (0 when unknown, so a missing motif still draws something). */
export const motifIndex = (themeId: string, motif: unknown): number =>
  Math.max(0, getTheme(themeId)?.motifs.indexOf(String(motif)) ?? 0);

export interface Opt {
  /** stroke-width override (default is the root weight) */
  w?: number;
  /** put the element in the single accent group */
  a?: boolean;
  dash?: string;
}

const X = (v: number): number => (Number.isFinite(v) ? Math.min(199.5, Math.max(0.5, v)) : 100);
const Y = (v: number): number => (Number.isFinite(v) ? Math.min(119.5, Math.max(0.5, v)) : 60);

export class Plate {
  readonly rng: () => number;
  private ink: string[] = [];
  private acc: string[] = [];
  private bytes = 0;

  constructor(params: Record<string, unknown>) {
    this.rng = seededRng(Math.round(clamp(params['seed'], 0, 1e6, 1)));
  }

  /** Random number in [lo, hi) from the seeded rng. */
  between(lo: number, hi: number): number {
    return lo + this.rng() * (hi - lo);
  }

  private put(el: string, o: Opt): void {
    if (this.ink.length + this.acc.length >= MAX_DRAWABLE || this.bytes + el.length > MAX_BODY_BYTES) return;
    this.bytes += el.length;
    (o.a ? this.acc : this.ink).push(el);
  }
  private style(o: Opt): string {
    return (o.w !== undefined ? ` stroke-width="${f(o.w)}"` : '') + (o.dash ? ` stroke-dasharray="${o.dash}"` : '');
  }

  line(x1: number, y1: number, x2: number, y2: number, o: Opt = {}): void {
    this.put(`<line x1="${f(X(x1))}" y1="${f(Y(y1))}" x2="${f(X(x2))}" y2="${f(Y(y2))}"${this.style(o)}/>`, o);
  }
  poly(pts: Pt[], o: Opt & { close?: boolean } = {}): void {
    const list = pts.slice(0, 230);
    if (list.length < 2) return;
    const tag = o.close && list.length >= 3 ? 'polygon' : 'polyline';
    this.put(`<${tag} points="${list.map(([x, y]) => `${f(X(x))},${f(Y(y))}`).join(' ')}"${this.style(o)}/>`, o);
  }
  circle(cx: number, cy: number, r: number, o: Opt = {}): void {
    const rr = Math.min(55, Math.max(0.3, Number.isFinite(r) ? r : 1));
    const x = Math.min(200 - rr, Math.max(rr, Number.isFinite(cx) ? cx : 100));
    const y = Math.min(120 - rr, Math.max(rr, Number.isFinite(cy) ? cy : 60));
    this.put(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}"${this.style(o)}/>`, o);
  }
  rect(x: number, y: number, w: number, h: number, o: Opt & { rx?: number } = {}): void {
    const ww = Math.min(198, Math.max(0.5, Number.isFinite(w) ? w : 1));
    const hh = Math.min(118, Math.max(0.5, Number.isFinite(h) ? h : 1));
    const xx = Math.min(199.5 - ww, Math.max(0.5, Number.isFinite(x) ? x : 0));
    const yy = Math.min(119.5 - hh, Math.max(0.5, Number.isFinite(y) ? y : 0));
    const rx = o.rx ? ` rx="${f(Math.min(o.rx, ww / 2, hh / 2))}"` : '';
    this.put(`<rect x="${f(xx)}" y="${f(yy)}" width="${f(ww)}" height="${f(hh)}"${rx}${this.style(o)}/>`, o);
  }
  /** Raw path data; build it with `px`/`py` so every number is clamped. */
  path(d: string, o: Opt = {}): void {
    this.put(`<path d="${d}"${this.style(o)}/>`, o);
  }
  /** Elliptical arc as a sampled polyline (angles in radians, screen coordinates). */
  arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, o: Opt = {}): void {
    const n = Math.min(40, Math.max(6, Math.ceil(Math.abs(a1 - a0) / 0.12)));
    const pts: Pt[] = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    this.poly(pts, o);
  }

  count(): number {
    return this.ink.length + this.acc.length;
  }

  svg(): string {
    const accent = this.acc.length ? `<g stroke="${ACCENT}">${this.acc.join('')}</g>` : '';
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}" fill="none" stroke="${INK}" stroke-width="${WEIGHT}"` +
      ` stroke-linecap="round" stroke-linejoin="round">${this.ink.join('')}${accent}</svg>`
    );
  }
}

/** Clamped path coordinates. */
export const px = (v: number): string => f(X(v));
export const py = (v: number): string => f(Y(v));
export const W = CANVAS_W;
export const H = CANVAS_H;

/** Pick which of `n` things carries the accent: the model's index, or a default. */
export const accentIndex = (p: Record<string, unknown>, n: number, dflt: number): number =>
  Math.round(clamp(p['accent'], 0, Math.max(0, n - 1), Math.min(dflt, Math.max(0, n - 1))));

/** Ground hatching: a baseline-free row of short diagonals under a surface. */
export function hatch(pl: Plate, x0: number, x1: number, y: number, step = 5, len = 5): void {
  for (let x = x0; x <= x1; x += step) pl.line(x, y, x - len, y + len, { w: THIN });
}
