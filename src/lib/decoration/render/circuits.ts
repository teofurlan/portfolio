import { Plate, THIN, accentIndex, asArray, asObject, clamp, int, motifIndex, num, type Pt } from './common.ts';

export interface CircuitsParams {
  branches?: unknown[];
  accent?: number;
  [key: string]: unknown;
}

/** Branching PCB traces: a trunk with a jog, and 45-degree branches ending in pads. */
function traces(pl: Plate, p: Record<string, unknown>): void {
  const given = asArray(p['branches'], 8).map(asObject);
  const dflt = [
    { at: 0.1, dir: -1, len: 40 },
    { at: 0.25, dir: 1, len: 55 },
    { at: 0.45, dir: -1, len: 30 },
    { at: 0.7, dir: 1, len: 38 },
    { at: 0.9, dir: -1, len: 22 },
  ];
  const specs = given.length >= 3 ? given : dflt;
  const trunk: Pt[] = [[14, 60], [76, 60], [90, 46], [138, 46], [152, 60], [186, 60]];
  const trunkY = (x: number): number => (x < 76 ? 60 : x < 90 ? 60 - (x - 76) : x < 138 ? 46 : x < 152 ? 46 + (x - 138) : 60);
  pl.poly(trunk);
  pl.circle(14, 60, 3);
  pl.circle(186, 60, 3);
  const live = accentIndex(p, specs.length, specs.length - 1);
  const list = specs
    .map((s, i) => ({
      x: 22 + clamp(s['at'], 0, 1, 0.5) * 140,
      dir: clamp(s['dir'], -1, 1, i % 2 ? 1 : -1) < 0 ? -1 : 1,
      len: clamp(s['len'], 10, 60, 30),
      i,
    }))
    .sort((a, b) => a.x - b.x);
  // Space the branches out, and give neighbours on the same side different heights so they never overlap.
  for (let k = 1; k < list.length; k++) list[k]!.x = Math.max(list[k]!.x, list[k - 1]!.x + 11);
  const seenSide: Record<number, number> = { [-1]: 0, [1]: 0 };
  for (const b of list) {
    const y = trunkY(Math.min(b.x, 160));
    const x = Math.min(b.x, 160);
    const d = 9;
    const level = seenSide[b.dir]!++ % 3;
    const next = list.find((o) => o.x > b.x && o.dir === b.dir && (list.indexOf(o) - list.indexOf(b)) > 0);
    const room = Math.min(186 - (x + d), next ? Math.max(8, next.x - x - d - 4) : 186);
    const len = Math.min(b.len, room);
    const yEnd = y + b.dir * (d * 2 + level * 9);
    const pts: Pt[] = [[x, y], [x + d, y + b.dir * d], [x + d, yEnd], [x + d + len, yEnd]];
    const a = b.i === live;
    pl.poly(pts, { a });
    pl.circle(x + d + len, yEnd, 2.6, { a });
    pl.circle(x, y, 1.2, { a });
  }
  // Two vias on the trunk.
  pl.circle(60, 60, 2);
  pl.circle(120, 46, 2);
}

/** A chip with pins on two sides and a few escape traces. */
function chip(pl: Plate, p: Record<string, unknown>): void {
  const pins = int(p, 'pins', 4, 9, 7);
  const w = num(p, 'size', 36, 70, 52);
  const pitch = 8;
  const h = pins * pitch + 6;
  const x0 = 100 - w / 2;
  const y0 = 60 - h / 2;
  const escapes = int(p, 'traces', 2, 6, 4);
  const live = int(p, 'accent', 0, pins * 2 - 1, pins - 1);
  pl.rect(x0, y0, w, h, { rx: 2 });
  // Pin-1 notch and a small dimple.
  pl.arc(100, y0, 5, 5, 0, Math.PI);
  pl.circle(x0 + 6, y0 + 6, 1.6);
  const side = (i: number) => (i < pins ? -1 : 1);
  for (let i = 0; i < pins * 2; i++) {
    const s = side(i);
    const y = y0 + 3 + pitch * ((i % pins) + 0.5);
    const xa = s < 0 ? x0 - 8 : x0 + w;
    pl.line(xa, y, xa + 8, y);
  }
  // Escape traces from evenly spread pins, plus the live one.
  const chosen = new Set<number>([live]);
  for (let k = 0; chosen.size < escapes && k < 40; k++) chosen.add(Math.floor(pl.rng() * pins * 2));
  for (const i of chosen) {
    const s = side(i);
    const row = i % pins;
    const y = y0 + 3 + pitch * (row + 0.5);
    const xs = s < 0 ? x0 - 8 : x0 + w + 8;
    const up = row < pins / 2 ? -1 : 1;
    const reach = 12 + ((i * 7) % 5) * 5;
    const bend = Math.abs(up) * (10 + ((i * 3) % 4) * 3);
    const xe = xs + s * (reach + bend);
    const ye = y + up * bend;
    const a = i === live;
    pl.poly([[xs, y], [xs + s * reach, y], [xe, ye], [xe + s * 14, ye]], { a });
    pl.circle(xe + s * 17, ye, 2.6, { a });
  }
}

/** Stepper motor seen from the front: square flange, four bolt holes, round boss, shaft with a flat, cable. */
function stepper(pl: Plate, p: Record<string, unknown>): void {
  const size = num(p, 'size', 54, 84, 70);
  const rings = int(p, 'rings', 0, 3, 2);
  const shaft = num(p, 'shaft', 0.06, 0.14, 0.1) * size;
  const side = int(p, 'cable_side', 0, 3, 1);
  const accent = accentIndex(p, 3, 1);
  const cx = 100;
  const cy = 60;
  const half = size / 2;
  pl.rect(cx - half, cy - half, size, size, { rx: 4 });
  const inset = size * 0.12;
  const corners: Pt[] = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [cx + a! * (half - inset), cy + b! * (half - inset)] as Pt);
  corners.forEach(([x, y], i) => {
    pl.circle(x, y, 2.6);
    if (i === 0) pl.circle(x, y, 1, { w: THIN });
  });
  const boss = size * 0.32;
  pl.circle(cx, cy, boss, { a: accent === 0 });
  for (let r = 1; r <= rings; r++) pl.circle(cx, cy, boss * (1 - r * 0.2), { w: THIN });
  // Shaft with its flat.
  pl.circle(cx, cy, shaft, { a: accent === 1 });
  pl.line(cx - shaft * 0.45, cy - shaft + 0.8, cx - shaft * 0.45, cy + shaft - 0.8, { a: accent === 1, w: THIN });
  pl.line(cx - 10, cy, cx + 10, cy, { w: THIN, dash: '4 2' });
  // Cable out of one side (0 left, 1 right, 2 top, 3 bottom): a connector and four wires.
  const dx = side === 0 ? -1 : side === 1 ? 1 : 0;
  const dy = side === 2 ? -1 : side === 3 ? 1 : 0;
  const ex = cx + dx * half;
  const ey = cy + dy * half;
  const reach = Math.max(14, Math.min(dx ? 92 - half : 52 - half, 40));
  const cw = 8;
  pl.rect(dx ? Math.min(ex, ex + dx * 8) : ex - cw, dy ? Math.min(ey, ey + dy * 8) : ey - cw, dx ? 8 : cw * 2, dy ? 8 : cw * 2, { a: accent === 2, rx: 1 });
  for (let k = 0; k < 4; k++) {
    const o = (k - 1.5) * 4.6;
    const x1 = ex + dx * 8 + (dx ? 0 : o);
    const y1 = ey + dy * 8 + (dy ? 0 : o);
    pl.line(x1, y1, x1 + dx * reach, y1 + dy * reach, { a: accent === 2 });
  }
  if (accent === 2) pl.circle(ex + dx * (8 + reach) + (dx ? 0 : 0), ey + dy * (8 + reach), 1.6, { a: true });
}

/** A sensor on a small board, wired to a microcontroller; one wire has a resistor, one a ground mark. */
function sensor(pl: Plate, p: Record<string, unknown>): void {
  const wires = int(p, 'wires', 2, 4, 3);
  const sy = num(p, 'sensor_y', 34, 86, 60);
  const my = num(p, 'mcu_y', 34, 86, 56);
  const live = accentIndex(p, wires, 0);
  // Sensor board with a lens and a short stem of pins.
  pl.rect(18, sy - 18, 34, 36, { rx: 3 });
  pl.circle(35, sy - 3, 8);
  pl.circle(35, sy - 3, 3.6, { w: THIN });
  pl.line(24, sy + 12, 46, sy + 12, { w: THIN });
  // Microcontroller block.
  const mh = wires * 14 + 12;
  pl.rect(144, my - mh / 2, 40, mh, { rx: 2 });
  pl.arc(164, my - mh / 2, 4, 4, 0, Math.PI);
  for (let i = 0; i < wires; i++) {
    const py0 = sy + (i - (wires - 1) / 2) * 9;
    const ty = my + (i - (wires - 1) / 2) * 14;
    const xm = 70 + i * 16;
    const pts: Pt[] = [[52, py0], [xm, py0], [xm, ty]];
    if (i === 0) {
      // Resistor zigzag on the last run.
      const r0 = xm + 8;
      pts.push([r0, ty]);
      for (let k = 0; k < 6; k++) pts.push([r0 + 3 + k * 3, ty + (k % 2 ? 3.2 : -3.2)]);
      pts.push([r0 + 21, ty]);
    }
    pts.push([144, ty]);
    pl.poly(pts, { a: i === live });
    pl.circle(52, py0, 1.5, { a: i === live });
  }
  // Ground mark under the sensor: a stem and three shrinking bars.
  pl.line(35, sy + 18, 35, sy + 26);
  pl.line(27, sy + 26, 43, sy + 26);
  pl.line(30, sy + 30, 40, sy + 30);
  pl.line(33, sy + 34, 37, sy + 34);
}

export function renderCircuits(params: CircuitsParams, motif: string = ''): string {
  const p = asObject(params);
  const pl = new Plate(p);
  const m = motifIndex('circuits', motif);
  if (m === 1) chip(pl, p);
  else if (m === 2) stepper(pl, p);
  else if (m === 3) sensor(pl, p);
  else traces(pl, p);
  return pl.svg();
}
