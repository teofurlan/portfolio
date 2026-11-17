import { Plate, THIN, accentIndex, asArray, asObject, clamp, int, motifIndex, num, px, py, type Pt } from './common.ts';

export interface OldComputersParams {
  rows?: number;
  accent?: number;
  [key: string]: unknown;
}

/** A sparse keyboard from above: a few rows of irregular keys, some missing, a long space bar, a coiled cable. */
function keyboard(pl: Plate, p: Record<string, unknown>): void {
  const rows = int(p, 'rows', 3, 4, 3);
  const gaps = num(p, 'gaps', 0, 0.4, 0.18);
  const rowH = 15;
  const trayH = rows * rowH + 12;
  const top = 64 - trayH / 2 + 6;
  const left = 22;
  const right = 178;
  pl.rect(left - 8, top - 6, right - left + 16, trayH, { rx: 5 });
  pl.rect(left - 3, top - 1, right - left + 6, trayH - 10, { rx: 3, w: THIN });
  const keys: { x: number; y: number; w: number }[] = [];
  for (let r = 0; r < rows; r++) {
    const y = top + 2 + r * rowH;
    const last = r === rows - 1;
    let x = left + 2 + pl.between(0, 10) + r * 3;
    if (last) {
      // Bottom row: a few keys either side of one long space bar.
      const bar = pl.between(52, 70);
      const start = 100 - bar / 2;
      keys.push({ x: start + pl.between(-4, 4), y, w: bar });
      for (let k = 0; k < 2; k++) keys.push({ x: start - 22 - k * 15 + pl.between(-1, 1), y, w: pl.between(10, 14) });
      for (let k = 0; k < 2; k++) keys.push({ x: start + bar + 6 + k * 15 + pl.between(-1, 1), y, w: pl.between(10, 14) });
      continue;
    }
    while (x < right - 14) {
      const w = pl.between(9, 15);
      if (pl.rng() >= gaps) keys.push({ x, y: y + pl.between(-0.8, 0.8), w });
      x += w + pl.between(2.5, 4.5);
    }
  }
  const live = accentIndex(p, keys.length, Math.floor(keys.length / 3));
  keys.forEach((k, i) => pl.rect(k.x, k.y, k.w, 11, { rx: 1.2, a: i === live }));
  // The cable leaves the top edge in a loose S.
  const y0 = top - 6;
  pl.path(`M${px(100)} ${py(y0)}C${px(100)} ${py(y0 - 12)} ${px(126)} ${py(y0 - 4)} ${px(128)} ${py(y0 - 16)}S${px(150)} ${py(8)} ${px(170)} ${py(10)}`);
}

interface Screen {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The CRT case, screen and base; returns the screen rectangle. */
function monitor(pl: Plate, size: number, curve: number, knobs: number, led: boolean): Screen {
  const sw = size;
  const sh = size * 0.72;
  const caseW = sw + 26;
  const caseH = sh + 24;
  const cx = 100;
  const x0 = cx - caseW / 2;
  const y0 = (120 - caseH - 8) / 2;
  pl.rect(x0, y0, caseW, caseH, { rx: 7 });
  const screen: Screen = { x: cx - sw / 2, y: y0 + 8, w: sw, h: sh };
  pl.rect(screen.x, screen.y, screen.w, screen.h, { rx: 3 + curve * 13 });
  // Bezel controls under the screen.
  for (let k = 0; k < knobs; k++) pl.circle(cx + sw / 2 - 5 - k * 8, y0 + caseH - 7, 2.2);
  pl.line(x0 + 10, y0 + caseH - 7, x0 + 26, y0 + caseH - 7, { w: THIN });
  if (led) pl.circle(cx - sw / 2 + 4, y0 + caseH - 7, 1.8, { a: true });
  // Stand: a neck and a foot.
  const by = y0 + caseH;
  pl.poly([[cx - 12, by], [cx + 12, by], [cx + 18, by + 8], [cx - 18, by + 8]], { close: true });
  pl.line(cx - 30, by + 8, cx + 30, by + 8);
  return screen;
}

/** A CRT monitor: heavy case, rounded glass, vent slots, a glare mark and a few controls. */
function crt(pl: Plate, p: Record<string, unknown>): void {
  const size = num(p, 'size', 60, 100, 84);
  const curve = num(p, 'curve', 0, 1, 0.6);
  const knobs = int(p, 'knobs', 0, 3, 2);
  const glare = int(p, 'accent', 0, 1, 1) === 1;
  const s = monitor(pl, size, curve, knobs, !glare);
  // Vent slots on the top of the case.
  for (let k = 0; k < 4; k++) pl.line(s.x + 8 + k * 6, s.y - 5, s.x + 8 + k * 6 + 3, s.y - 5, { w: THIN });
  // Glare in the top-left corner of the glass.
  pl.arc(s.x + 11, s.y + 11, 6, 6, Math.PI, Math.PI * 1.55, { a: glare });
  pl.line(s.x + 6, s.y + s.h - 8, s.x + 12, s.y + s.h - 13, { w: THIN });
  // The beam's centre cross, very faint.
  const mx = s.x + s.w / 2;
  const my = s.y + s.h / 2;
  pl.line(mx - 5, my, mx + 5, my, { w: THIN });
  pl.line(mx, my - 5, mx, my + 5, { w: THIN });
}

/** A monitor with a few prompt lines and a block cursor waiting after the last one. */
function cursor(pl: Plate, p: Record<string, unknown>): void {
  const size = num(p, 'size', 70, 100, 88);
  const curve = num(p, 'curve', 0, 1, 0.4);
  const lines = int(p, 'lines', 2, 5, 3);
  const lens = asArray(p['line_lengths'], 5);
  const s = monitor(pl, size, curve, 1, false);
  const rowStep = Math.min(11, (s.h - 14) / (lines + 1));
  const x0 = s.x + 7;
  let lastEnd = x0 + 7;
  let lastY = s.y + 8;
  for (let i = 0; i < lines; i++) {
    const y = s.y + 9 + i * rowStep;
    // ">" prompt, then the words as short dashes of varying length.
    pl.poly([[x0, y - 2.4], [x0 + 3, y], [x0, y + 2.4]]);
    const frac = clamp(lens[i], 0.2, 0.9, 0.35 + pl.rng() * 0.5);
    const end = x0 + 7 + frac * (s.w - 28);
    let d = '';
    let x = x0 + 7;
    while (x < end - 2) {
      const w = Math.min(end - x, pl.between(4, 12));
      d += `M${px(x)} ${py(y)}H${px(x + w)}`;
      x += w + pl.between(2.5, 4);
    }
    if (d) pl.path(d);
    lastEnd = x;
    lastY = y;
  }
  // Block cursor: an outline with diagonal hatching, in the accent.
  const cy0 = lastY + rowStep * 0.9 - 4;
  const cx0 = Math.min(s.x + s.w - 14, lastEnd + 2);
  const useY = Math.min(s.y + s.h - 12, cy0);
  pl.rect(cx0, useY, 7, 9, { a: true });
  pl.line(cx0 + 1, useY + 6, cx0 + 6, useY + 1, { a: true });
  pl.line(cx0 + 1, useY + 8, cx0 + 6, useY + 3, { a: true });
}

/** Cables behind the desk: plugs on the left, sockets on the right, wandering cables with a few loops. */
function cables(pl: Plate, p: Record<string, unknown>): void {
  const n = int(p, 'cables', 3, 6, 4);
  const knots = int(p, 'knots', 0, 3, 1);
  const tangle = num(p, 'tangle', 0.3, 1, 0.8);
  const live = accentIndex(p, n, 1);
  const top = 22;
  const gap = Math.min(14, 84 / n);
  // The desk edge and a power strip on the floor.
  pl.line(8, top - 8, 192, top - 8, { w: THIN });
  pl.rect(70, 104, 60, 8, { rx: 2 });
  for (let k = 0; k < 3; k++) pl.circle(84 + k * 16, 108, 1.6, { w: THIN });
  for (let i = 0; i < n; i++) {
    const y1 = top + gap * (i + 0.5);
    const y2 = top + gap * ((i * 5 + 2) % n + 0.5);
    pl.rect(12, y1 - 3, 9, 6, { rx: 1 });
    pl.line(8, y1 - 1.2, 12, y1 - 1.2, { w: THIN });
    pl.line(8, y1 + 1.2, 12, y1 + 1.2, { w: THIN });
    pl.rect(180, y2 - 3, 8, 6, { rx: 1 });
    // Two waypoints per cable, thrown around the middle: that is what makes the pile a tangle.
    const m1x = 56 + pl.between(0, 36);
    const m2x = 108 + pl.between(0, 40);
    const m1y = clamp(60 + (pl.rng() - 0.5) * 130 * tangle, 14, 98, 60);
    const m2y = clamp(60 + (pl.rng() - 0.5) * 130 * tangle, 14, 98, 60);
    const d1 = pl.between(-40, 40) * tangle;
    const d2 = pl.between(-40, 40) * tangle;
    const a: Pt = [21, y1];
    const b: Pt = [180, y2];
    pl.path(
      `M${px(a[0])} ${py(a[1])}C${px(a[0] + 28)} ${py(a[1] + d1)} ${px(m1x - 24)} ${py(m1y + d2)} ${px(m1x)} ${py(m1y)}` +
        `S${px(m2x - 24)} ${py(m2y - d1)} ${px(m2x)} ${py(m2y)}S${px(b[0] - 30)} ${py(b[1] + d2)} ${px(b[0])} ${py(b[1])}`,
      { a: i === live },
    );
  }
  // Loops: coils of spare cable lying on the floor.
  for (let k = 0; k < knots; k++) {
    const cx = 40 + k * 50 + pl.between(-8, 8);
    const cy = 90 + pl.between(-4, 4);
    pl.arc(cx, cy, 12 + k * 2, 7, 0, Math.PI * 2);
    pl.arc(cx + 3, cy, 8, 4.5, 0.4, Math.PI * 2.2, { w: THIN });
  }
}

export function renderOldComputers(params: OldComputersParams, motif: string = ''): string {
  const p = asObject(params);
  const pl = new Plate(p);
  const m = motifIndex('old-computers', motif);
  if (m === 1) crt(pl, p);
  else if (m === 2) cursor(pl, p);
  else if (m === 3) cables(pl, p);
  else keyboard(pl, p);
  return pl.svg();
}
