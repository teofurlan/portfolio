/**
 * Pure HTML helpers for the Worker (P5 / S1, S11). Everything read from KV is untrusted:
 * records are shape-checked and their SVG is validated again before it is served as HTML;
 * titles, dates, models and prompts always go through `escapeHtml`.
 */
import { plateLabel, provenance, type Lang, type PieceRecord } from '../lib/decoration/daily';
import { validateSvg } from '../lib/decoration/validate';

export const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export interface IndexEntry {
  date: string;
  plate: number;
  theme: string;
  title_en: string;
  title_es: string;
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): v is string => typeof v === 'string';
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A stored piece, or null if it is not a well-formed record with a valid svg. */
export function parseRecord(v: unknown): PieceRecord | null {
  if (!isObject(v)) return null;
  if (!str(v['date']) || !DATE.test(v['date'])) return null;
  if (typeof v['plate'] !== 'number' || !Number.isInteger(v['plate']) || v['plate'] < 1) return null;
  for (const k of ['theme', 'motif', 'attitude', 'title_en', 'title_es', 'model', 'prompt', 'svg']) if (!str(v[k])) return null;
  if (v['source'] !== 'model-params' && v['source'] !== 'code-random') return null;
  const svg = validateSvg(v['svg'] as string);
  if (!svg.ok) return null;
  return { ...(v as unknown as PieceRecord), params: isObject(v['params']) ? v['params'] : {}, svg: svg.svg };
}

/** Index entries (newest first) or null when the value is not an array at all. */
export function parseIndex(v: unknown): IndexEntry[] | null {
  if (!Array.isArray(v)) return null;
  return v.filter(
    (e): e is IndexEntry =>
      isObject(e) && str(e['date']) && DATE.test(e['date']) && typeof e['plate'] === 'number' && str(e['theme']) && str(e['title_en']) && str(e['title_es']),
  );
}

/** The drawing as an inline <svg> with the rewriter hook and an accessible label. */
export function liveSvg(record: PieceRecord, lang: Lang): string | null {
  const v = validateSvg(record.svg);
  if (!v.ok || !v.svg.startsWith('<svg ')) return null;
  const label = escapeHtml(plateLabel(record, lang));
  return `<svg data-piece-svg data-live role="img" aria-label="${label}" ${v.svg.slice('<svg '.length)}`;
}

/** Archive grid, newest first as given. Pieces whose svg no longer validates are skipped. */
export function archiveHtml(records: PieceRecord[], lang: Lang, promptLabel: string): string {
  const items = records.flatMap((r) => {
    const v = validateSvg(r.svg);
    if (!v.ok) return [];
    const label = escapeHtml(plateLabel(r, lang));
    return [
      `<li class="plate-card"><figure>${v.svg.replace('<svg ', `<svg role="img" aria-label="${label}" `)}` +
        `<figcaption><b>${label}</b><br><time datetime="${escapeHtml(r.date)}">${escapeHtml(r.date)}</time><br>` +
        `<span>${escapeHtml(provenance(r, lang))}</span></figcaption></figure>` +
        `<details><summary>${escapeHtml(promptLabel)}</summary><pre>${escapeHtml(r.prompt)}</pre></details></li>`,
    ];
  });
  return items.length ? `<ul class="archive-grid">${items.join('')}</ul>` : '';
}
