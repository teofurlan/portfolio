import { Plate, THIN, accentIndex, asArray, asObject, clamp, motifIndex, num, px, py, int, type Pt } from './common.ts';

export interface SoundVoiceParams {
  bars?: number[];
  accent?: number;
  [key: string]: unknown;
}

/** Waveform of a phrase: mirrored amplitude strokes with short silences between "words". */
function waveform(pl: Plate, p: Record<string, unknown>): void {
  const given = asArray(p['bars'], 40);
  const amps = (given.length >= 8 ? given : [0.2, 0.5, 0.8, 0.4, 0.9, 0.6, 0.3, 0.7, 0.5, 0.2]).map((a) => clamp(a, 0.04, 1, 0.3));
  const accent = accentIndex(p, amps.length, amps.indexOf(Math.max(...amps)));
  const pitch = 160 / amps.length;
  const w = Math.min(1.6, Math.max(0.9, pitch * 0.4));
  pl.line(14, 60, 186, 60, { w: THIN });
  amps.forEach((a, i) => {
    const x = 20 + pitch * (i + 0.5);
    const h = a * 46;
    pl.line(x, 60 - h, x, 60 + h, { w, a: i === accent });
  });
  // A thin envelope over the top of the bars.
  pl.poly(amps.map((a, i) => [20 + pitch * (i + 0.5), 60 - a * 46 - 4] as Pt), { w: THIN, dash: '1 3' });
}

/** Spectrogram: one row of vertical ticks per frequency band, tick height = energy over time. */
function spectrogram(pl: Plate, p: Record<string, unknown>): void {
  const given = asArray(p['bands'], 9);
  const energies = (given.length >= 4 ? given : [0.3, 0.7, 0.9, 0.6, 0.4, 0.2]).map((e) => clamp(e, 0.05, 1, 0.4));
  const bands = energies.length;
  const drift = num(p, 'drift', -1, 1, 0.3);
  const accent = accentIndex(p, bands, Math.floor(bands / 2));
  const cols = 26;
  const top = 14;
  const rowH = Math.min(14, 92 / bands);
  pl.rect(14, top - 6, 172, rowH * bands + 8, { w: THIN });
  for (let b = 0; b < bands; b++) {
    const yc = top + rowH * (b + 0.5);
    let d = '';
    for (let c = 0; c < cols; c++) {
      const t = c / (cols - 1);
      // A slow swell moving across the bands plus a little jitter.
      const swell = 0.5 + 0.5 * Math.sin(6.28 * (t * 1.3 + drift * (b / bands) + b * 0.37));
      const e = energies[b]! * (0.25 + 0.75 * swell) * (0.75 + 0.25 * pl.rng());
      const h = Math.max(0.6, e * rowH * 0.85);
      d += `M${px(20 + t * 160)} ${py(yc - h / 2)}V${py(yc + h / 2)}`;
    }
    pl.path(d, { a: b === accent });
  }
}

/** Waves leaving a microphone: concentric arcs spreading to the right. */
function microphone(pl: Plate, p: Record<string, unknown>): void {
  const rings = int(p, 'rings', 3, 7, 5);
  const spread = (num(p, 'spread', 30, 120, 70) * Math.PI) / 180;
  const accent = accentIndex(p, rings, rings - 2);
  const cx = 52;
  const cy = 52;
  // Capsule head with a grille, then the stand.
  pl.rect(cx - 9, cy - 16, 18, 32, { rx: 9 });
  pl.line(cx - 9, cy - 4, cx + 9, cy - 4, { w: THIN });
  pl.line(cx - 9, cy + 4, cx + 9, cy + 4, { w: THIN });
  pl.arc(cx, cy + 4, 14, 14, 0.1, Math.PI - 0.1);
  pl.line(cx, cy + 18, cx, 100);
  pl.line(cx - 14, 100, cx + 14, 100);
  const r0 = 20;
  // Keep the widest ring inside the canvas, whatever the cone angle.
  const rMax = Math.min(132, 50 / Math.max(0.25, Math.sin(spread / 2)));
  const step = Math.min(18, (rMax - r0) / rings);
  for (let i = 0; i < rings; i++) {
    const r = r0 + step * (i + 1);
    pl.arc(cx + 10, cy, r, r, -spread / 2, spread / 2, { a: i === accent });
  }
  pl.line(cx + 12, cy, cx + 12 + r0 + 8, cy, { w: THIN, dash: '2 2.5' });
}

/** Two voices crossing: two sine-like traces, with the crossings marked. */
function crossing(pl: Plate, p: Record<string, unknown>): void {
  const fr = asArray(p['freqs'], 2);
  const am = asArray(p['amps'], 2);
  const f1 = clamp(fr[0], 1, 6, 2);
  const f2 = clamp(fr[1], 1, 6, 3.5);
  const a1 = clamp(am[0], 0.2, 1, 0.8) * 40;
  const a2 = clamp(am[1], 0.2, 1, 0.6) * 40;
  const phase = (num(p, 'phase', 0, 360, 60) * Math.PI) / 180;
  const accent = accentIndex(p, 2, 1);
  const N = 84;
  const v1: Pt[] = [];
  const v2: Pt[] = [];
  const marks: Pt[] = [];
  let prev = 0;
  let prevY = 60;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const env = Math.pow(Math.sin(Math.PI * t), 0.6);
    const x = 12 + t * 176;
    const y1 = 60 - a1 * env * Math.sin(2 * Math.PI * f1 * t);
    const y2 = 60 - a2 * env * Math.sin(2 * Math.PI * f2 * t + phase);
    v1.push([x, y1]);
    v2.push([x, y2]);
    const diff = y1 - y2;
    if (i > 0 && prev !== 0 && Math.sign(diff) !== Math.sign(prev) && marks.length < 9) {
      const u = prev / (prev - diff);
      marks.push([x - (1 - u) * (176 / N), prevY + u * (y1 - prevY)]);
    }
    prevY = y1;
    prev = diff;
  }
  pl.line(12, 60, 188, 60, { w: THIN, dash: '3 3' });
  pl.poly(v1, { a: accent === 0 });
  pl.poly(v2, { a: accent === 1, w: 1.2 });
  for (const [x, y] of marks) pl.circle(x, y, 1.8);
}

export function renderSoundVoice(params: SoundVoiceParams, motif: string = ''): string {
  const p = asObject(params);
  const pl = new Plate(p);
  const m = motifIndex('sound-voice', motif);
  if (m === 1) spectrogram(pl, p);
  else if (m === 2) microphone(pl, p);
  else if (m === 3) crossing(pl, p);
  else waveform(pl, p);
  return pl.svg();
}
