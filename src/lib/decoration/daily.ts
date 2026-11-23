/**
 * Pure core of the daily decoration (P5 / T3+T4; S3, S4, S8, S10, S11).
 * No Workers or KV types: the cron Worker (src/worker/decoration.ts) wires these to the model and KV.
 */
import { buildParameterPrompt, PARAMETER_RENDERERS, type Selection } from './prompt.ts';
import { getTheme, THEMES } from './themes.ts';
import { randomParams } from './random-params.ts';
import { roughen } from './rough.ts';
import { validateSvg, validateTitle } from './validate.ts';

export type Lang = 'en' | 'es';
export type Source = 'model-params' | 'code-random';

export const TIME_ZONE = 'America/Argentina/Buenos_Aires';
export const FALLBACK_TITLES = { en: "Today's piece", es: 'La pieza de hoy' } as const;

export interface RotationState {
  used: string[];
  last?: string;
}

/** YYYY-MM-DD in Buenos Aires (the cron runs at 06:00 UTC, 03:00 there). */
export function buenosAiresDate(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

const pick = <T>(list: readonly T[], rng: () => number): T => list[Math.min(list.length - 1, Math.floor(rng() * list.length))]!;

/** S3: random theme without repeats until every theme was used; a new round never starts with the last one. */
export function nextTheme(state: unknown, rng: () => number): { theme: string; state: RotationState } {
  const ids = THEMES.map((t) => t.id);
  const raw = state && typeof state === 'object' ? (state as Record<string, unknown>) : {};
  const used = Array.isArray(raw['used']) ? (raw['used'] as unknown[]).filter((u): u is string => typeof u === 'string' && ids.includes(u)) : [];
  const last = typeof raw['last'] === 'string' && ids.includes(raw['last']) ? raw['last'] : undefined;
  let round = [...new Set(used)];
  let pool = ids.filter((id) => !round.includes(id));
  if (pool.length === 0) {
    round = [];
    pool = ids.filter((id) => id !== last);
    if (pool.length === 0) pool = ids;
  }
  const theme = pick(pool, rng);
  return { theme, state: { used: [...round, theme], last: theme } };
}

export interface PieceRecord {
  date: string;
  plate: number;
  theme: string;
  motif: string;
  attitude: string;
  params: Record<string, unknown>;
  title_en: string;
  title_es: string;
  model: string;
  source: Source;
  prompt: string;
  svg: string;
}

export interface MakePieceInput {
  date: string;
  plate: number;
  selection: Selection;
  /** The model's parameters, or null to draw from seeded random parameters (S4 fallback). */
  params: Record<string, unknown> | null;
  titles: { title_en?: unknown; title_es?: unknown } | null;
  model: string;
  rng: () => number;
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Code draws the chosen motif, the marker stroke is applied, the result is validated again. Throws if nothing valid comes out. */
export function makePiece(input: MakePieceInput): PieceRecord {
  const { selection, rng } = input;
  const theme = getTheme(selection.theme);
  const render = PARAMETER_RENDERERS[selection.theme];
  if (!theme || !render) throw new Error(`unknown theme: ${selection.theme}`);
  const motifIdx = Math.max(0, theme.motifs.indexOf(selection.motif));
  const fromModel = isObject(input.params);
  const params = fromModel ? (input.params as Record<string, unknown>) : randomParams(selection.theme, motifIdx, rng);

  const clean = validateSvg(render(params as never, selection.motif));
  if (!clean.ok) throw new Error(`drawn svg is invalid: ${clean.errors.join('; ')}`);
  const seed = Math.floor(rng() * 1_000_000) + 1;
  const svg = validateSvg(roughen(clean.svg, { seed }));
  if (!svg.ok) throw new Error(`marker svg is invalid: ${svg.errors.join('; ')}`);

  const title = (value: unknown, fallback: string): string => {
    const t = validateTitle(value);
    return t.ok ? t.title : fallback;
  };
  return {
    date: input.date,
    plate: input.plate,
    theme: selection.theme,
    motif: selection.motif,
    attitude: selection.attitude,
    params,
    title_en: title(input.titles?.title_en, FALLBACK_TITLES.en),
    title_es: title(input.titles?.title_es, FALLBACK_TITLES.es),
    model: input.model,
    source: fromModel ? 'model-params' : 'code-random',
    prompt: buildParameterPrompt(selection)
      .map((m) => `[${m.role}]\n${m.content}`)
      .join('\n\n'),
    svg: svg.svg,
  };
}

export const shortModel = (model: string): string => model.split('/').pop() ?? model;

type Labelled = Pick<PieceRecord, 'plate' | 'title_en' | 'title_es'>;

/** S8: "Plate N · <title>" / "Lámina N · <title>". */
export function plateLabel(record: Labelled, lang: Lang): string {
  return lang === 'es' ? `Lámina ${record.plate} · ${record.title_es}` : `Plate ${record.plate} · ${record.title_en}`;
}

/** S11: which path made the piece. */
export function provenance(record: Pick<PieceRecord, 'model' | 'source'>, lang: Lang): string {
  const model = shortModel(record.model);
  if (record.source === 'model-params') {
    return lang === 'es' ? `Parámetros y título de ${model}, dibujo de código` : `Parameters and title by ${model}, drawn by code`;
  }
  return lang === 'es' ? 'Dibujo de código' : 'Drawn by code';
}
