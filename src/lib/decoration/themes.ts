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
  /** Generic parameter shape for this theme (fallback when the motif is unknown). */
  paramSpec: string;
  /** What the model must return in parameter mode (S4 fallback), one entry per motif, same order as `motifs`. */
  motifParams: string[];
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
    motifParams: [
      '{"links":[3 numbers, link lengths 15-60],"angles":[3 numbers, cumulative joint angles in degrees, -180..180],"accent":index 0-2 of the link to highlight,"seed":integer}',
      '{"ground":number 40-100,"crank":number 10-40,"coupler":number 30-90,"rocker":number 25-70,"angle":crank angle in degrees 0-360,"accent":0 crank|1 coupler plate|2 rocker|3 traced path,"seed":integer}',
      '{"opening":0 (closed) to 1 (wide open),"finger_length":number 20-38,"object":radius of the gripped object 4-14,"accent":0 left finger|1 right finger,"seed":integer}',
      '{"pivot":x of the fixed point 60-140,"tilt":tool angle in degrees -40..40,"sweep":angle of the two ghost poses 8-30,"tool_length":50-100,"accent":0 ring around the pivot|1 the pivot dot,"seed":integer}',
    ],
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
    motifParams: [
      '{"bars":[8-40 numbers 0-1, amplitudes, with quiet gaps between words],"accent":index of the loudest bar}',
      '{"bands":[4-9 numbers 0-1, energy of each frequency band, low to high],"drift":number -1..1 (how the swell moves across bands),"accent":index of the band to highlight,"seed":integer}',
      '{"rings":integer 3-7 (waves),"spread":cone angle in degrees 30-120,"accent":index of the ring to highlight}',
      '{"freqs":[2 numbers 1-6, cycles of each voice],"amps":[2 numbers 0.2-1],"phase":degrees 0-360,"accent":0 or 1 (which voice)}',
    ],
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
    motifParams: [
      '{"branches":[3-8 objects {"at":0-1 position along the trunk,"dir":-1 up or 1 down,"len":10-60}],"accent":index of the live branch}',
      '{"pins":integer 4-9 per side,"size":body width 36-70,"traces":integer 2-6 escape traces,"accent":pin index 0..(2*pins-1) whose trace is live,"seed":integer}',
      '{"size":flange size 54-84,"rings":0-3,"shaft":shaft radius ratio 0.06-0.14,"cable_side":0 left|1 right|2 top|3 bottom,"accent":0 boss|1 shaft|2 cable}',
      '{"wires":integer 2-4,"sensor_y":34-86,"mcu_y":34-86,"accent":index of the live wire}',
    ],
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
    motifParams: [
      '{"rows":3 or 4,"gaps":fraction of missing keys 0-0.4,"accent":index of one highlighted key,"seed":integer}',
      '{"size":screen width 60-100,"curve":glass roundness 0-1,"knobs":0-3,"accent":0 power light|1 glare mark}',
      '{"size":screen width 70-100,"curve":0-1,"lines":integer 2-5 prompt lines,"line_lengths":[up to 5 numbers 0.2-0.9],"seed":integer}',
      '{"cables":integer 3-6,"tangle":0.2-1,"knots":0-3 coils on the floor,"accent":index of the cable to highlight,"seed":integer}',
    ],
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
    motifParams: [
      '{"gears":[2-3 objects {"teeth":8-24,"radius":10-40}],"accent":index of the gear to highlight}',
      '{"opening":angle between the legs in degrees 20-44,"leg":leg length 52-80,"sweep":degrees of arc already drawn 40-270,"accent":0 ink|1 the arc}',
      '{"base":60-120,"height":36-74,"inner":cut-out size 0.3-0.6,"accent":0 cut-out mark|1 dimension lines|2 angle arc}',
      '{"parts":[3-5 objects {"kind":"bolt"|"washer"|"plate"|"bush"|"nut","length":5-36,"diameter":8-28}],"gap":6-20,"accent":index of the part to highlight}',
    ],
  },
];

export const getTheme = (id: string): Theme | undefined => THEMES.find((t) => t.id === id);
