/** Which inline figure belongs to which project slug (FIG 1.1–1.3 from artboard 08). */
import FigBloobert from './Fig-bloobert.astro';
import FigMtds from './Fig-mtds.astro';
import FigSocra from './Fig-socra.astro';

export const figures: Record<string, typeof FigSocra> = {
  socra: FigSocra,
  mtds: FigMtds,
  bloobert: FigBloobert,
};

/** Verified proof lines (P2 shared content); never invent new ones here. */
export const proofs: Record<string, string> = {
  mtds: 'Inverse kinematics validated against the CAD model to 3 micrometres.',
};
