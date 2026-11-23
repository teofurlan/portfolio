/**
 * Prompt builder + parameter-mode renderer for the daily decoration (P5 / S4, S7).
 * Pure: the RNG is injected so tests and the cron Worker control randomness.
 */
import { ACCENT, INK, VIEWBOX } from './validate.ts';
import { ATTITUDES, THEMES, getTheme } from './themes.ts';
import { seededRng } from './rng.ts';
import { renderMechanisms } from './render/mechanisms.ts';
import { renderSoundVoice } from './render/sound.ts';
import { renderCircuits } from './render/circuits.ts';
import { renderOldComputers } from './render/computers.ts';
import { renderTechnicalDrawing } from './render/technical.ts';

export { seededRng };
export { renderMechanisms, renderSoundVoice, renderCircuits, renderOldComputers, renderTechnicalDrawing };
export type { MechanismsParams } from './render/mechanisms.ts';
export type { SoundVoiceParams } from './render/sound.ts';
export type { CircuitsParams } from './render/circuits.ts';
export type { OldComputersParams } from './render/computers.ts';
export type { TechnicalDrawingParams } from './render/technical.ts';

export interface Selection {
  theme: string;
  motif: string;
  attitude: string;
}
export interface Message {
  role: 'system' | 'user';
  content: string;
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
  '- Between 5 and 120 drawable elements, all inside the canvas, under 16 KB in total.',
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
  const shape = theme.motifParams[theme.motifs.indexOf(sel.motif)] ?? theme.paramSpec;
  return [
    { role: 'system', content: 'You choose parameters for a drawing routine and answer with JSON only.' },
    {
      role: 'user',
      content: [
        `Theme: ${theme.name}. Motif: ${sel.motif}. Attitude: ${sel.attitude}.`,
        `Reply with ONLY a JSON object of parameters, no commentary, shaped like: ${shape}`,
        'The drawing routine draws exactly this motif; choose parameters that make this motif look good and match the attitude.',
        'Also include "title_en" and "title_es": short plain-text titles (max 40 characters).',
      ].join('\n'),
    },
  ];
}

// ---------------------------------------------------------------------------
// Deterministic renderers (parameter mode): one per theme, each drawing the selected motif.
// They live in ./render/*.ts; all clamp their input and stay inside the validator's budgets.
// ---------------------------------------------------------------------------

/** Deterministic parameter renderer per theme (S4 fallback). `motif` is one of the theme's motifs. */
export const PARAMETER_RENDERERS: Record<string, (params: never, motif?: string) => string> = {
  mechanisms: renderMechanisms as (params: never, motif?: string) => string,
  'sound-voice': renderSoundVoice as (params: never, motif?: string) => string,
  circuits: renderCircuits as (params: never, motif?: string) => string,
  'old-computers': renderOldComputers as (params: never, motif?: string) => string,
  'technical-drawing': renderTechnicalDrawing as (params: never, motif?: string) => string,
};
