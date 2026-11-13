// Build-time data for the session replay page: loads the redacted sessions, merges curation and
// translations, and shapes everything the page renders. Pure `loadReplay` takes the glob result, so
// "no transcripts" (CI) is a tested case: it returns null and the page shows the placeholder copy.
// Text is never rewritten: originals pass through untouched; the page escapes them.
import type { PublicEvent, PublicSession } from '../../scripts/lib/redact.ts';
import curationFile from '../../transcripts/curation.json';
import type { Lang } from '../i18n/ui.ts';
import { buildChapters, sessionStats, totals, type Localized, type SessionCuration } from './replay.ts';

export interface Translation {
  to: Lang;
  text: string;
}

export interface StepView {
  kind: 'call' | 'result' | 'thinking' | 'notice';
  label: string;
  snippet: string;
  error?: boolean;
}

export type BlockView =
  | { kind: 'message'; id: string; role: 'user' | 'agent'; at: string; text: string; highlight: boolean; translation?: Translation }
  | { kind: 'steps'; count: number; steps: StepView[] };

export interface ChapterView {
  n: number;
  title: Localized;
  from: string;
  to: string;
  blocks: BlockView[];
}

export interface Replay {
  totals: ReturnType<typeof totals>;
  chapters: ChapterView[];
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isLang = (v: unknown): v is Lang => v === 'en' || v === 'es';

/** Tolerant reader for `_translations.json` (odd/tasks/p4-replay.md L12): bad entries are skipped. */
export function parseTranslations(raw: unknown): Map<string, Translation> {
  const out = new Map<string, Translation>();
  if (!isRecord(raw)) return out;
  for (const [id, v] of Object.entries(raw)) {
    if (isRecord(v) && isLang(v.to) && typeof v.text === 'string' && v.text.trim()) out.set(id, { to: v.to, text: v.text });
  }
  return out;
}

/** One line, whitespace collapsed, cut with an ellipsis. */
export function clip(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

const LIMITS = { call: 110, result: 150, thinking: 150, notice: 110 } as const;

export function stepView(e: PublicEvent): StepView {
  switch (e.kind) {
    case 'tool_call':
      return { kind: 'call', label: e.tool ?? 'tool', snippet: clip(e.text, LIMITS.call) };
    case 'tool_result':
      return { kind: 'result', label: e.tool ?? 'tool', snippet: clip(e.text, LIMITS.result), ...(e.isError ? { error: true } : {}) };
    case 'thinking':
      return { kind: 'thinking', label: 'thinking', snippet: clip(e.text, LIMITS.thinking) };
    default:
      return { kind: 'notice', label: 'notice', snippet: clip(e.text, LIMITS.notice) };
  }
}

const isSession = (v: unknown): v is PublicSession =>
  isRecord(v) && typeof v.id === 'string' && typeof v.startedAt === 'string' && Array.isArray(v.events) && Array.isArray(v.models);

const isSessionFile = (path: string) => /(?:^|[\\/])2026-[^\\/]*\.json$/.test(path) && !/(?:^|[\\/])_[^\\/]*$/.test(path);

export function loadReplay(
  files: Record<string, unknown>,
  translationsRaw: unknown,
  curation: { sessions?: Record<string, SessionCuration> } | undefined,
): Replay | null {
  const sessions = Object.entries(files)
    .filter(([path]) => isSessionFile(path))
    .map(([, v]) => v)
    .filter(isSession)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  if (!sessions.length) return null;

  const translations = parseTranslations(translationsRaw);
  const chapters: ChapterView[] = [];
  for (const s of sessions) {
    for (const c of buildChapters(s, curation?.sessions?.[s.id.slice(0, 8)])) {
      chapters.push({
        n: chapters.length + 1,
        title: c.title,
        from: c.from,
        to: c.to,
        blocks: c.blocks.map((b): BlockView => {
          if (b.kind === 'steps') return { kind: 'steps', count: b.count, steps: b.events.map(stepView) };
          const translation = translations.get(b.event.id);
          return {
            kind: 'message',
            id: b.event.id,
            role: b.event.kind === 'user' ? 'user' : 'agent',
            at: b.event.at,
            text: b.event.text,
            highlight: b.highlight,
            ...(translation ? { translation } : {}),
          };
        }),
      });
    }
  }
  return { totals: totals(sessions.map(sessionStats)), chapters };
}

const base = { timeZone: 'UTC' } as const;
const dateTime = (lang: Lang) => new Intl.DateTimeFormat(lang, { ...base, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const timeOnly = (lang: Lang) => new Intl.DateTimeFormat(lang, { ...base, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const dateOnly = (lang: Lang, year = false) => new Intl.DateTimeFormat(lang, { ...base, day: 'numeric', month: 'short', ...(year ? { year: 'numeric' } : {}) });

export const formatWhen = (iso: string, lang: Lang) => dateTime(lang).format(new Date(iso));
export const formatTime = (iso: string, lang: Lang) => timeOnly(lang).format(new Date(iso));
export const formatDate = (iso: string, lang: Lang, year = false) => dateOnly(lang, year).format(new Date(iso));

/** "Nov 10, 19:21 – 19:58" on one day, both dates otherwise. Times are UTC. */
export function formatRange(from: string, to: string, lang: Lang): string {
  const sameDay = from.slice(0, 10) === to.slice(0, 10);
  return `${formatWhen(from, lang)} – ${sameDay ? formatTime(to, lang) : formatWhen(to, lang)}`;
}

const sessionFiles = import.meta.glob('../../transcripts/public/2026-*.json', { eager: true, import: 'default' });
// Raw text, parsed here: a half-written or invalid file means "no translations", never a failed build.
const translationFiles = import.meta.glob('../../transcripts/public/_translations.json', { eager: true, query: '?raw', import: 'default' });

export function parseJsonOrUndefined(text: unknown): unknown {
  if (typeof text !== 'string') return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** The replay for this build, or null when `transcripts/public/` has no sessions (e.g. CI). */
export function getReplay(): Replay | null {
  return loadReplay(sessionFiles, parseJsonOrUndefined(Object.values(translationFiles)[0]), curationFile as { sessions?: Record<string, SessionCuration> });
}
