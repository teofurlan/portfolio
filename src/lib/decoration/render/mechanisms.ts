import { Plate, THIN, accentIndex, asArray, asObject, clamp, hatch, motifIndex, num, type Pt } from './common.ts';

export interface MechanismsParams {
  links?: number[];
  angles?: number[];
  accent?: number;
  [key: string]: unknown;
}

const rad = (d: number): number => (d * Math.PI) / 180;

/** Three-link robot arm on a ground line. */
function arm(pl: Plate, p: Record<string, unknown>): void {
  const dl = [45, 35, 25];
  const da = [40, -30, -50];
  const lk = asArray(p['links'], 3);
  const an = asArray(p['angles'], 3);
  const links = [0, 1, 2].map((i) => clamp(lk[i], 10, 60, dl[i]!));
  const angles = [0, 1, 2].map((i) => clamp(an[i], -180, 180, da[i]!));
  const accent = accentIndex(p, 3, 2);

  const pts: Pt[] = [[0, 0]];
  let a = 0;
  for (let i = 0; i < 3; i++) {
    a += rad(angles[i]!);
    const [x, y] = pts[i]!;
    pts.push([x + links[i]! * Math.cos(a), y + links[i]! * Math.sin(a)]);
  }
  const xs = pts.map((q) => q[0]);
  const ys = pts.map((q) => q[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, Math.max(0, ...ys) - Math.min(0, ...ys));
  const s = Math.min(1, 150 / w, 80 / h);
  const groundY = 90;
  const ox = 100 - ((minX + maxX) / 2) * s;
  const P = pts.map(([x, y]) => [ox + x * s, Math.max(8, Math.min(112, groundY - 4 - y * s))] as Pt);

  pl.line(20, groundY, 180, groundY);
  hatch(pl, 28, 172, groundY, 16, 6);
  const [bx, by] = P[0]!;
  pl.poly([[bx - 8, groundY], [bx + 8, groundY], [bx, by]], { close: true });
  for (let i = 0; i < 3; i++) pl.line(P[i]![0], P[i]![1], P[i + 1]![0], P[i + 1]![1], { a: i === accent });
  for (let i = 0; i < 4; i++) pl.circle(P[i]![0], P[i]![1], 3);
}

/** Circle-circle intersection for a four-bar: the pin C a distance `c` from B and `r` from D (elbow up). */
function solveC(B: Pt, D: Pt, c: number, r: number): Pt | null {
  const dx = D[0] - B[0];
  const dy = D[1] - B[1];
  const d = Math.hypot(dx, dy);
  if (d < 1e-6 || d > c + r || d < Math.abs(c - r)) return null;
  const a = (c * c - r * r + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, c * c - a * a));
  const mx = B[0] + (a * dx) / d;
  const my = B[1] + (a * dy) / d;
  const c1: Pt = [mx - (h * dy) / d, my + (h * dx) / d];
  const c2: Pt = [mx + (h * dy) / d, my - (h * dx) / d];
  return c1[1] >= c2[1] ? c1 : c2;
}

/** Four-bar linkage with a coupler triangle and the path its tip traces. */
function fourBar(pl: Plate, p: Record<string, unknown>): void {
  const crank = num(p, 'crank', 10, 40, 20);
  const g = Math.max(num(p, 'ground', 40, 100, 70), crank + 12);
  let cp = num(p, 'coupler', 30, 90, 60);
  let rk = num(p, 'rocker', 25, 70, 45);
  const th0 = rad(num(p, 'angle', 0, 360, 50));
  const A: Pt = [0, 0];
  const D: Pt = [g, 0];
  const crankEnd = (th: number): Pt => [crank * Math.cos(th), crank * Math.sin(th)];
  // Make the chosen pose assemblable: coupler and rocker must be able to reach each other.
  const d0 = Math.hypot(D[0] - crankEnd(th0)[0], D[1] - crankEnd(th0)[1]);
  if (d0 > cp + rk - 1) {
    const k = (d0 + 1) / (cp + rk);
    cp *= k;
    rk *= k;
  } else if (d0 < Math.abs(cp - rk) + 1) {
    if (cp > rk) cp = rk + d0 - 1;
    else rk = cp + d0 - 1;
  }
  const B = crankEnd(th0);
  const C = solveC(B, D, cp, rk) ?? ([(B[0] + D[0]) / 2, (B[1] + D[1]) / 2] as Pt);
  const tip = (b: Pt, c: Pt): Pt => {
    const dx = c[0] - b[0];
    const dy = c[1] - b[1];
    const l = Math.max(1, Math.hypot(dx, dy));
    return [b[0] + dx / 2 - (dy / l) * 0.45 * cp, b[1] + dy / 2 + (dx / l) * 0.45 * cp];
  };
  const T = tip(B, C);
  const curve: Pt[] = [];
  for (let k = 0; k < 36; k++) {
    const b = crankEnd(rad(k * 10));
    const c = solveC(b, D, cp, rk);
    if (c) curve.push(tip(b, c));
  }
  const all = [A, B, C, D, T, ...curve];
  const minX = Math.min(...all.map((q) => q[0]));
  const maxX = Math.max(...all.map((q) => q[0]));
  const minY = Math.min(...all.map((q) => q[1]));
  const maxY = Math.max(...all.map((q) => q[1]));
  const s = Math.min(1.6, 160 / Math.max(1, maxX - minX), 68 / Math.max(1, maxY - minY));
  // Math y points up; the pivots sit at y = 0, so the hatch hangs below them.
  const ox = 100 - ((minX + maxX) / 2) * s;
  const oy = 60 + ((minY + maxY) / 2) * s;
  const S = (q: Pt): Pt => [ox + q[0] * s, oy - q[1] * s];
  const [a, b, c, d, t] = [A, B, C, D, T].map(S) as [Pt, Pt, Pt, Pt, Pt];
  const accent = accentIndex(p, 4, 1);

  if (curve.length > 2) pl.poly(curve.map(S), { w: THIN, dash: '2 2.5', a: accent === 3 });
  pl.line(a[0], a[1], d[0], d[1], { w: THIN, dash: '4 2' });
  for (const q of [a, d]) {
    pl.poly([q, [q[0] - 6, q[1] + 9], [q[0] + 6, q[1] + 9]], { close: true });
    pl.line(q[0] - 9, q[1] + 9, q[0] + 9, q[1] + 9);
    hatch(pl, q[0] - 6, q[0] + 9, q[1] + 9, 5, 4);
  }
  pl.line(a[0], a[1], b[0], b[1], { a: accent === 0 });
  pl.poly([b, c, t], { close: true, a: accent === 1 });
  pl.line(c[0], c[1], d[0], d[1], { a: accent === 2 });
  for (const q of [a, b, c, d]) pl.circle(q[0], q[1], 2.4);
}

/** A two-finger gripper above an object: the more it closes, the closer the tips. */
function gripper(pl: Plate, p: Record<string, unknown>): void {
  const opening = num(p, 'opening', 0, 1, 0.45);
  const len = num(p, 'finger_length', 20, 38, 32);
  const obj = num(p, 'object', 4, 14, 9);
  const accent = accentIndex(p, 2, 0);
  const phi = 0.15 + 0.7 * opening;
  const kappa = 1.1;
  const top = 42;

  pl.line(100, 8, 100, 20);
  pl.rect(82, 20, 36, 14, { rx: 2 });
  pl.line(100, 6, 100, 112, { w: THIN, dash: '6 2 1 2' });
  const tips: Pt[] = [];
  for (const s of [-1, 1]) {
    const P: Pt = [100 + s * 14, top];
    pl.line(100 + s * 14, 34, P[0], P[1]);
    const J: Pt = [P[0] + s * len * Math.sin(phi), P[1] + len * Math.cos(phi)];
    const psi = phi - kappa;
    const T: Pt = [J[0] + s * len * 0.8 * Math.sin(psi), J[1] + len * 0.8 * Math.cos(psi)];
    tips.push(T);
    pl.poly([P, J, T], { a: accent === (s < 0 ? 0 : 1) });
    pl.circle(P[0], P[1], 2.5);
    pl.circle(J[0], J[1], 2.5);
    // A small pad across the tip.
    pl.line(T[0] - s * 1, T[1] - 4, T[0] - s * 1, T[1] + 3);
  }
  const midY = (tips[0]![1] + tips[1]![1]) / 2;
  pl.circle(100, Math.min(112 - obj, midY - obj * 0.15), obj);
  // Where the fingers will travel, dotted.
  const gap = Math.abs(tips[1]![0] - tips[0]![0]);
  pl.line(100 - gap / 2, midY + obj + 4, 100 + gap / 2, midY + obj + 4, { w: THIN, dash: '1 3' });
}

/** Remote centre of motion: a tool pivots about a fixed port in the skin; two ghost poses show the sweep. */
function remoteCenter(pl: Plate, p: Record<string, unknown>): void {
  const pivotX = num(p, 'pivot', 60, 140, 100);
  const tilt = num(p, 'tilt', -40, 40, 12);
  const sweep = num(p, 'sweep', 8, 30, 20);
  const length = num(p, 'tool_length', 50, 100, 85);
  const accent = accentIndex(p, 2, 1);
  const y0 = 64;
  const up = length * 0.55;
  const down = length * 0.4;
  const dir = (deg: number): Pt => [Math.sin(rad(deg)), -Math.cos(rad(deg))];

  // Skin line with a gap at the port, tissue hatch below.
  pl.line(8, y0, pivotX - 5, y0);
  pl.line(pivotX + 5, y0, 192, y0);
  hatch(pl, 16, 184, y0, 14, 5);
  for (const dd of [-sweep, sweep]) {
    const v = dir(tilt + dd);
    pl.line(pivotX + v[0] * up, y0 + v[1] * up, pivotX - v[0] * down, y0 - v[1] * down, { w: THIN, dash: '4 3' });
  }
  const v = dir(tilt);
  const top: Pt = [pivotX + v[0] * up, y0 + v[1] * up];
  const tip: Pt = [pivotX - v[0] * down, y0 - v[1] * down];
  pl.line(top[0], top[1], tip[0], tip[1]);
  // Handle across the top, jaws at the tip.
  pl.line(top[0] - v[1] * 7, top[1] + v[0] * 7, top[0] + v[1] * 7, top[1] - v[0] * 7);
  const jaw = (da: number): Pt => {
    const q = dir(tilt + 180 + da);
    return [tip[0] + q[0] * 8, tip[1] + q[1] * 8];
  };
  pl.line(tip[0], tip[1], jaw(-22)[0], jaw(-22)[1]);
  pl.line(tip[0], tip[1], jaw(22)[0], jaw(22)[1]);
  // The arc the handle sweeps through.
  pl.arc(pivotX, y0, up, up, rad(tilt - sweep - 90), rad(tilt + sweep - 90), { w: THIN });
  pl.circle(pivotX, y0, 3, { a: accent === 1 });
  if (accent === 0) pl.circle(pivotX, y0, 6, { a: true });
}

export function renderMechanisms(params: MechanismsParams, motif: string = ''): string {
  const p = asObject(params);
  const pl = new Plate(p);
  const m = motifIndex('mechanisms', motif);
  if (m === 1) fourBar(pl, p);
  else if (m === 2) gripper(pl, p);
  else if (m === 3) remoteCenter(pl, p);
  else arm(pl, p);
  return pl.svg();
}
