import { Plate, THIN, accentIndex, asArray, asObject, clamp, int, motifIndex, num, type Pt } from './common.ts';

export interface TechnicalDrawingParams {
  gears?: { teeth?: number; radius?: number }[];
  accent?: number;
  [key: string]: unknown;
}

const rad = (d: number): number => (d * Math.PI) / 180;

/** Meshing gears in a row on a centre line, drawn as toothed polygons. */
function gears(pl: Plate, p: Record<string, unknown>): void {
  const given = asArray(p['gears'], 3).map(asObject);
  const specs = given.length >= 2 ? given : [{ teeth: 12, radius: 22 }, { teeth: 16, radius: 30 }];
  const list = specs.map((g) => ({ teeth: Math.round(clamp(g['teeth'], 8, 24, 12)), r: clamp(g['radius'], 10, 40, 24) }));
  const accent = accentIndex(p, list.length, 0);
  const tooth = (r: number) => Math.max(2, r * 0.18);
  const outer = list.map((g) => g.r + tooth(g.r) / 2);
  // Neighbouring pitch circles touch; scale the whole row to fit 160 wide.
  const centres: number[] = [outer[0]!];
  for (let i = 1; i < list.length; i++) centres.push(centres[i - 1]! + list[i - 1]!.r + list[i]!.r);
  const right = centres[centres.length - 1]! + outer[outer.length - 1]!;
  const s = Math.min(1, 160 / right);
  const x0 = 100 - (right * s) / 2;
  list.forEach((g, i) => {
    const cx = x0 + centres[i]! * s;
    const cy = 60;
    const rIn = (g.r - tooth(g.r) / 2) * s;
    const rOut = (g.r + tooth(g.r) / 2) * s;
    const step = (2 * Math.PI) / g.teeth;
    // Offset alternate gears by half a tooth so they interlock.
    const phase = i % 2 ? step / 2 : 0;
    const pts: Pt[] = [];
    for (let t = 0; t < g.teeth; t++) {
      const a0 = phase + t * step;
      for (const [da, r] of [[0, rIn], [0.1, rOut], [0.4, rOut], [0.5, rIn]] as const) {
        const a = a0 + da * step;
        pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
      }
    }
    const a = i === accent;
    pl.poly(pts, { close: true, a });
    pl.circle(cx, cy, g.r * s, { w: 0.5, dash: '3 2', a });
    pl.circle(cx, cy, Math.max(1.5, g.r * s * 0.2), { a });
    pl.line(cx - rOut - 4, cy, cx + rOut + 4, cy, { w: 0.4, a });
  });
}

/** A compass with its needle planted, drawing an arc on the paper (the arc is foreshortened). */
function compass(pl: Plate, p: Record<string, unknown>): void {
  const opening = rad(num(p, 'opening', 20, 44, 32));
  const leg = num(p, 'leg', 52, 80, 68);
  const sweep = rad(num(p, 'sweep', 40, 270, 200));
  const accent = int(p, 'accent', 0, 1, 1) === 1;
  const hx = 100;
  const hy = 12;
  const half = opening / 2;
  const nx = hx - leg * Math.sin(half);
  const px0 = hx + leg * Math.sin(half);
  const ly = hy + leg * Math.cos(half);
  const r = px0 - nx;
  const ry = r * 0.28;
  // Paper edge, the radius on the paper and the centre mark.
  pl.line(Math.max(8, nx - r - 8), ly, Math.min(192, px0 + 14), ly, { w: THIN });
  pl.line(nx, ly, px0, ly, { w: THIN, dash: '3 2' });
  pl.line(nx - 3, ly, nx + 3, ly);
  // Legs, hinge and handle.
  pl.line(hx, hy, nx, ly);
  pl.line(hx, hy, px0, ly);
  pl.circle(hx, hy, 3);
  pl.line(hx, hy - 3, hx, 5);
  pl.circle(hx, 5, 1.6);
  const crossY = hy + (ly - hy) * 0.45;
  const k = (crossY - hy) / (ly - hy);
  pl.line(hx - (hx - nx) * k, crossY, hx + (px0 - hx) * k, crossY, { w: THIN });
  // Needle point and pencil lead.
  pl.poly([[nx - 1.6, ly - 6], [nx + 1.6, ly - 6], [nx, ly]], { close: true });
  pl.poly([[px0 - 1.8, ly - 6], [px0 + 1.8, ly - 6], [px0, ly]], { close: true });
  // The arc, behind the paper edge, from the pencil's position sweeping backwards.
  pl.arc(nx, ly, r, ry, 0, -sweep, { a: accent });
}

/** A set square with its cut-out, ruler ticks, a right-angle mark, and two dimension lines. */
function setSquare(pl: Plate, p: Record<string, unknown>): void {
  const base = num(p, 'base', 60, 120, 96);
  const height = num(p, 'height', 36, 74, 56);
  const inner = num(p, 'inner', 0.3, 0.6, 0.45);
  const accent = accentIndex(p, 3, 1);
  const x0 = 100 - base / 2 + 8;
  const y0 = 60 + height / 2 - 6;
  const A: Pt = [x0, y0];
  const B: Pt = [x0 + base, y0];
  const C: Pt = [x0, y0 - height];
  pl.poly([A, B, C], { close: true });
  // Cut-out: a smaller triangle with the same proportions, nudged toward the right angle.
  const t = 0.18 + (0.6 - inner) * 0.2;
  const ia: Pt = [x0 + base * t * 0.6, y0 - height * t * 0.9];
  const ib: Pt = [x0 + base * (inner + 0.18), y0 - height * t * 0.9];
  const ic: Pt = [x0 + base * t * 0.6, y0 - height * (inner + 0.18)];
  pl.poly([ia, ib, ic], { close: true, w: THIN });
  // Ticks along the base.
  for (let x = 6, i = 0; x < base - 4; x += 6, i++) pl.line(x0 + x, y0, x0 + x, y0 - (i % 5 === 4 ? 5 : 3), { w: THIN });
  // Right-angle mark and an angle arc at the far end.
  pl.poly([[x0 + 7, y0], [x0 + 7, y0 - 7], [x0, y0 - 7]], { w: THIN });
  const ang = Math.atan2(height, base);
  pl.arc(B[0], B[1], 12, 12, Math.PI, Math.PI + ang, { a: accent === 2 });
  // Dimension lines: base below, height to the left, with extension lines and arrowheads.
  const dim = (a: Pt, b: Pt, off: Pt, on: boolean) => {
    const a2: Pt = [a[0] + off[0], a[1] + off[1]];
    const b2: Pt = [b[0] + off[0], b[1] + off[1]];
    pl.line(a[0] + off[0] * 0.25, a[1] + off[1] * 0.25, a2[0] + off[0] * 0.15, a2[1] + off[1] * 0.15, { w: THIN, a: on });
    pl.line(b[0] + off[0] * 0.25, b[1] + off[1] * 0.25, b2[0] + off[0] * 0.15, b2[1] + off[1] * 0.15, { w: THIN, a: on });
    pl.line(a2[0], a2[1], b2[0], b2[1], { a: on });
    const ux = (b2[0] - a2[0]) / Math.hypot(b2[0] - a2[0], b2[1] - a2[1]);
    const uy = (b2[1] - a2[1]) / Math.hypot(b2[0] - a2[0], b2[1] - a2[1]);
    for (const [q, s] of [[a2, 1], [b2, -1]] as const) {
      const tipx = q[0];
      const tipy = q[1];
      pl.poly([[tipx + s * ux * 5 - uy * 1.8, tipy + s * uy * 5 + ux * 1.8], [tipx, tipy], [tipx + s * ux * 5 + uy * 1.8, tipy + s * uy * 5 - ux * 1.8]], { a: on });
    }
    // A short tick where a figure would sit (text is not allowed).
    pl.line((a2[0] + b2[0]) / 2 - uy * 3, (a2[1] + b2[1]) / 2 + ux * 3, (a2[0] + b2[0]) / 2 + uy * 3, (a2[1] + b2[1]) / 2 - ux * 3, { w: THIN, a: on });
  };
  dim(A, B, [0, 13], accent === 1);
  dim(A, C, [-13, 0], accent === 1);
  if (accent === 0) pl.circle((ia[0] + ib[0] + ic[0]) / 3, (ia[1] + ib[1] + ic[1]) / 3, 2.4, { a: true });
}

/** Exploded view: parts of a bolted joint pulled apart along a dash-dot axis, with assembly guides. */
function exploded(pl: Plate, p: Record<string, unknown>): void {
  const kinds = ['bolt', 'washer', 'plate', 'bush', 'nut'] as const;
  const given = asArray(p['parts'], 5).map(asObject);
  const dflt = [{ kind: 'bolt', length: 34, diameter: 12 }, { kind: 'washer', length: 5, diameter: 12 }, { kind: 'plate', length: 12, diameter: 16 }, { kind: 'bush', length: 16, diameter: 12 }, { kind: 'nut', length: 10, diameter: 12 }];
  const specs = (given.length >= 3 ? given : dflt.slice(0, 4)).map((g, i) => ({
    kind: kinds.includes(g['kind'] as never) ? (g['kind'] as (typeof kinds)[number]) : kinds[i % kinds.length]!,
    len: clamp(g['length'], 5, 36, 14),
    dia: clamp(g['diameter'], 8, 28, 14),
  }));
  const gap = num(p, 'gap', 6, 20, 12);
  const accent = accentIndex(p, specs.length, 0);
  const total = specs.reduce((s, q) => s + q.len, 0) + gap * (specs.length - 1);
  const k = Math.min(1, 168 / total);
  let x = 100 - (total * k) / 2;
  const cy = 60;
  pl.line(8, cy, 192, cy, { w: THIN, dash: '8 2 1.5 2' });
  let prev: { right: number; half: number } | null = null;
  specs.forEach((q, i) => {
    const len = q.len * k;
    const a = i === accent;
    const half = (q.kind === 'plate' ? q.dia * 2 : q.kind === 'washer' ? q.dia * 1.7 : q.kind === 'nut' ? q.dia * 1.3 : q.kind === 'bolt' ? q.dia * 1.6 : q.dia) / 2;
    if (q.kind === 'bolt') {
      const head = len * 0.3;
      pl.rect(x, cy - half, head, half * 2, { a });
      pl.rect(x + head, cy - q.dia / 2, len - head, q.dia, { a });
      for (let t = 1; t <= 3; t++) pl.line(x + head + ((len - head) * (t + 3)) / 7, cy - q.dia / 2, x + head + ((len - head) * (t + 3)) / 7 - 1.5, cy + q.dia / 2, { w: THIN, a });
    } else {
      pl.rect(x, cy - half, len, half * 2, { a });
      const hole = q.kind === 'plate' ? q.dia * 0.5 : q.dia * 0.3;
      pl.line(x, cy - hole, x + len, cy - hole, { w: THIN, dash: '2 1.5', a });
      pl.line(x, cy + hole, x + len, cy + hole, { w: THIN, dash: '2 1.5', a });
      if (q.kind === 'nut') pl.line(x + len / 2, cy - half, x + len / 2, cy + half, { w: THIN, a });
      if (q.kind === 'plate') {
        pl.line(x, cy - half + 4, x + len, cy - half + 4, { w: THIN, dash: '2 1.5', a });
        pl.line(x, cy + half - 4, x + len, cy + half - 4, { w: THIN, dash: '2 1.5', a });
      }
    }
    if (prev) {
      const h = Math.min(prev.half, half);
      pl.line(prev.right, cy - h, x, cy - h, { w: THIN, dash: '1 2.5' });
      pl.line(prev.right, cy + h, x, cy + h, { w: THIN, dash: '1 2.5' });
    }
    prev = { right: x + len, half };
    x += len + gap * k;
  });
}

export function renderTechnicalDrawing(params: TechnicalDrawingParams, motif: string = ''): string {
  const p = asObject(params);
  const pl = new Plate(p);
  const m = motifIndex('technical-drawing', motif);
  if (m === 1) compass(pl, p);
  else if (m === 2) setSquare(pl, p);
  else if (m === 3) exploded(pl, p);
  else gears(pl, p);
  return pl.svg();
}
