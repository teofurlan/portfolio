/**
 * Themes, motifs and attitudes for the daily decoration (P5 / S3, S6, S7, L5).
 * `draft` is the per-theme prompt text: a DRAFT for Teo to correct (S6); prompts are public.
 */

export interface Theme {
  id: string;
  name: string;
  motifs: string[];
  /** Short, vivid, personal English draft of what the piece should evoke. */
  draft: string;
  /** What the model must return in parameter mode (S4 fallback) for this theme. */
  paramSpec: string;
}

export const ATTITUDES = [
  'geometric and precise',
  'organic, loose lines',
  'minimal',
  'dense and detailed',
  'freehand sketch',
] as const;

export const THEMES: Theme[] = [
  {
    id: 'mechanisms',
    name: 'Mechanisms',
    motifs: [
      'a three-link robot arm',
      'a four-bar linkage',
      'a gripper closing',
      'a tool pivoting around a fixed point (remote center of motion)',
    ],
    draft:
      'You are drawing a small plate for the notebook of a robotics engineer who builds surgical-style manipulators. ' +
      'Show a mechanism caught mid-motion, with visible joints, pivots and links, as if sketched while working out how it moves.',
    paramSpec:
      '{"links":[3 numbers, link lengths 15-60],"angles":[3 numbers, cumulative joint angles in degrees, -180..180],"accent":index 0-2 of the link to highlight}',
  },
  {
    id: 'sound-voice',
    name: 'Sound and voice',
    motifs: [
      'the waveform of a spoken phrase',
      'a banded spectrogram',
      'waves leaving a microphone',
      'two voices crossing',
    ],
    draft:
      'You are drawing a small plate for someone who works on voice and speech systems. ' +
      'Make sound visible: a spoken moment turned into lines, rhythm and silence between words.',
    paramSpec: '{"bars":[8-40 numbers 0-1, amplitudes],"accent":index of the loudest bar}',
  },
  {
    id: 'circuits',
    name: 'Circuits',
    motifs: [
      'branching PCB traces',
      'a chip with its pins',
      'a stepper motor seen from the front',
      'a sensor wired up',
    ],
    draft:
      'You are drawing a small plate for an electronics tinkerer who wires boards by hand. ' +
      'Show copper traces, pads and components with the quiet order of a well-routed board and one place where something is alive.',
    paramSpec: '{"traces":[3-10 objects {"from":[x,y],"to":[x,y]} on a 0-200 x 0-120 grid],"accent":index of the live trace}',
  },
  {
    id: 'old-computers',
    name: 'Old computers',
    motifs: [
      'a keyboard seen from above',
      'a CRT monitor',
      'a blinking cursor on a screen',
      'tangled cables behind the desk',
    ],
    draft:
      'You are drawing a small plate for someone who is fond of old computers and the rooms they lived in. ' +
      'Give the machine a little personality, affectionate and slightly worn, never a logo or a screenshot.',
    paramSpec: '{"keys":{"rows":3-5,"cols":8-14},"accent":[row,col] of one highlighted key}',
  },
  {
    id: 'technical-drawing',
    name: 'Technical drawing',
    motifs: [
      'meshing gears',
      'a compass drawing an arc',
      'a set square with dimensions',
      'an exploded view of parts',
    ],
    draft:
      'You are drawing a small plate in the spirit of an engineering drafting sheet: construction lines, centre lines and the patience of drawing by hand. ' +
      'It may lean artistic, but it should feel like the work of someone who measures things.',
    paramSpec: '{"gears":[2-3 objects {"teeth":8-24,"radius":10-40}],"accent":index of the gear to highlight}',
  },
];

export const getTheme = (id: string): Theme | undefined => THEMES.find((t) => t.id === id);
