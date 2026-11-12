/** Which inline figure belongs to which project slug (FIG 1.1–1.3 from artboard 08). */
import type { Lang } from '../../i18n/ui';
import { getContent } from '../../lib/i18n-content';
import FigBloobert from './Fig-bloobert.astro';
import FigMtds from './Fig-mtds.astro';
import FigSocra from './Fig-socra.astro';

export const figures: Record<string, typeof FigSocra> = {
  socra: FigSocra,
  mtds: FigMtds,
  bloobert: FigBloobert,
};

/** Verified proof lines (P2 shared content, per language); never invent new ones here. */
export function proofFor(slug: string, lang: Lang = 'en'): string | undefined {
  return (getContent(lang).proofs as Record<string, string>)[slug];
}
