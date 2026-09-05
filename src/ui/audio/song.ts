/**
 * Utwory w tle zapisane jako dane, bez plików audio. Silnik (engine.ts) gra je na syntezie Web Audio.
 * Każdy utwór: tempo, forma z sekcji po 8 taktów (szesnastki) i barwa instrumentów.
 */

export const STEPS_PER_BAR = 16;
export const BARS_PER_SECTION = 8;
export const SECTION_STEPS = STEPS_PER_BAR * BARS_PER_SECTION;

export type TrackId = "wieczor" | "poranek" | "noc";
export const TRACK_IDS: readonly TrackId[] = ["wieczor", "poranek", "noc"];

/** Nuta: krok w sekcji, wysokość MIDI, długość w krokach, głośność 0..1. */
export type Note = { step: number; midi: number; length: number; velocity: number };

export type Section = {
  /** Podstawa akordu na takt (MIDI, oktawa basu). */
  roots: readonly number[];
  /** Tercja i septyma nad podstawą (półtony) na takt: pad. */
  colors: readonly (readonly [number, number])[];
  lead: readonly Note[];
};

export type Timbre = {
  leadWave: OscillatorType;
  /** Rozstrojenie dwóch oscylatorów leadu w centach. */
  leadDetune: number;
  /** Filtr leadu: start i koniec nuty (Hz). */
  leadCutoff: readonly [number, number];
  leadGain: number;
  padWave: OscillatorType;
  padGain: number;
  padCutoff: readonly [number, number];
  bassWave: OscillatorType;
  bassGain: number;
  reverbSend: number;
  tickGain: number;
};

/** Aranżacja: kto gra. To ona odróżnia utwory od siebie bardziej niż barwa. */
export type Arrangement = {
  /** detuned: dwa rozstrojone oscylatory przez filtr; fmPiano: elektryczne pianino FM jak z OPL3; bell: dzwonek FM z długim wybrzmieniem. */
  lead: "detuned" | "fmPiano" | "bell";
  /** roots: podstawa na 1 i 3, kwinta na 4; walking: ósemki po akordzie; sub: jeden niski sinus na takt. */
  bass: "roots" | "walking" | "sub";
  pad: boolean;
  /** tick: cichy szum na 2 i 4; hats: hi-hat na każdą ósemkę ze stopą; thump: jedno niskie uderzenie na takt; none. */
  percussion: "tick" | "hats" | "thump" | "none";
};

export type Song = {
  id: TrackId;
  tempo: number;
  /** Przesunięcie całego utworu w półtonach (osobna tonacja bez przepisywania nut). */
  transpose: number;
  form: readonly Section[];
  timbre: Timbre;
  arrangement: Arrangement;
};

const n = (step: number, midi: number, length: number, velocity = 0.8): Note => ({ step, midi, length, velocity });

/** Arpeggio na takt: kolejne interwały nad podstawą, po `stepLen` kroków, cicho. */
function arp(bar: number, root: number, intervals: readonly number[], stepLen: number, velocity = 0.45): Note[] {
  const out: Note[] = [];
  for (let step = 0; step < STEPS_PER_BAR; step += stepLen) {
    const interval = intervals[(step / stepLen) % intervals.length] ?? 0;
    out.push(n(bar * STEPS_PER_BAR + step, root + interval, stepLen, velocity));
  }
  return out;
}

const MINOR7: readonly [number, number] = [3, 10];
const DOM7: readonly [number, number] = [4, 10];
const MAJ7: readonly [number, number] = [4, 11];

/* ---------- 1. Wieczór w Mirkowie: D-moll, 84 BPM, spokojnie, lekko melancholijnie ---------- */

const D2 = 38;
const F2 = 41;
const G2 = 43;
const A2 = 45;
const Bb2 = 46;
const C3 = 48;

const WIECZOR_A: Section = {
  roots: [D2, F2, C3, G2, D2, F2, A2, G2],
  colors: [MINOR7, MAJ7, DOM7, MINOR7, MINOR7, MAJ7, MINOR7, DOM7],
  lead: [
    n(0, 74, 6),
    n(8, 72, 4, 0.7),
    n(12, 69, 4, 0.7),
    n(16, 72, 8),
    n(28, 74, 4, 0.6),
    n(32, 76, 6),
    n(40, 74, 4, 0.7),
    n(44, 72, 4, 0.7),
    n(48, 69, 10),
    n(60, 67, 4, 0.6),
    n(64, 74, 6),
    n(72, 77, 4, 0.75),
    n(76, 76, 4, 0.7),
    n(80, 72, 8),
    n(92, 74, 4, 0.6),
    n(96, 76, 4),
    n(100, 79, 4, 0.8),
    n(104, 77, 4, 0.7),
    n(108, 76, 4, 0.7),
    n(112, 74, 12),
  ],
};

const WIECZOR_B: Section = {
  roots: [Bb2, F2, C3, G2, Bb2, F2, C3, D2],
  colors: [MAJ7, MAJ7, DOM7, MINOR7, MAJ7, MAJ7, DOM7, MINOR7],
  lead: [
    n(0, 77, 8),
    n(10, 76, 2, 0.6),
    n(12, 74, 4, 0.7),
    n(16, 72, 12),
    n(32, 79, 6),
    n(40, 77, 4, 0.7),
    n(44, 76, 4, 0.7),
    n(48, 74, 12),
    n(64, 77, 8),
    n(74, 79, 2, 0.6),
    n(76, 81, 4, 0.8),
    n(80, 79, 12),
    n(96, 76, 4),
    n(100, 74, 4, 0.7),
    n(104, 72, 4, 0.7),
    n(108, 70, 4, 0.7),
    n(112, 69, 14),
  ],
};

export const WIECZOR: Song = {
  id: "wieczor",
  tempo: 84,
  transpose: 0,
  form: [WIECZOR_A, WIECZOR_A, WIECZOR_B, WIECZOR_B],
  arrangement: { lead: "detuned", bass: "roots", pad: true, percussion: "tick" },
  timbre: {
    leadWave: "square",
    leadDetune: 7,
    leadCutoff: [2400, 900],
    leadGain: 0.16,
    padWave: "sawtooth",
    padGain: 0.045,
    padCutoff: [800, 1400],
    bassWave: "triangle",
    bassGain: 0.32,
    reverbSend: 0.35,
    tickGain: 0.05,
  },
};

/* ---------- 2. Poranna zmiana: zapis w G, gra w B♭ (transpose +3), 104 BPM, pianino FM, chodzący bas, hi-hat ---------- */

const E2 = 40;
const D3 = 50;

const PORANEK_A: Section = {
  roots: [G2, G2, C3, C3, F2, F2, D3, D3],
  colors: [DOM7, DOM7, MAJ7, MAJ7, MAJ7, MAJ7, MINOR7, MINOR7],
  lead: [
    ...arp(0, G2, [24, 28, 31, 28], 2),
    ...arp(1, G2, [24, 31, 34, 31], 2),
    ...arp(2, C3, [24, 28, 31, 28], 2),
    ...arp(3, C3, [24, 31, 35, 31], 2),
    ...arp(4, F2, [24, 28, 31, 28], 2),
    ...arp(5, F2, [24, 31, 35, 31], 2),
    ...arp(6, D3, [12, 15, 19, 15], 2),
    ...arp(7, D3, [12, 19, 22, 19], 2),
    n(0, 79, 8, 0.7),
    n(16, 83, 6, 0.7),
    n(32, 84, 8, 0.7),
    n(48, 79, 6, 0.6),
    n(64, 81, 8, 0.7),
    n(80, 77, 6, 0.6),
    n(96, 74, 8, 0.7),
    n(112, 76, 12, 0.6),
  ],
};

const PORANEK_B: Section = {
  roots: [E2, E2, C3, C3, G2, G2, D3, D3],
  colors: [MINOR7, MINOR7, MAJ7, MAJ7, DOM7, DOM7, MINOR7, MINOR7],
  lead: [
    ...arp(0, E2, [24, 27, 31, 27], 2),
    ...arp(1, E2, [24, 31, 34, 31], 2),
    ...arp(2, C3, [24, 28, 31, 28], 2),
    ...arp(3, C3, [24, 31, 35, 31], 2),
    ...arp(4, G2, [24, 28, 31, 28], 2),
    ...arp(5, G2, [24, 31, 34, 31], 2),
    ...arp(6, D3, [12, 15, 19, 15], 2),
    ...arp(7, D3, [12, 17, 19, 17], 2),
    n(0, 83, 8, 0.7),
    n(16, 79, 6, 0.6),
    n(32, 84, 8, 0.7),
    n(48, 83, 6, 0.6),
    n(64, 79, 8, 0.7),
    n(80, 81, 6, 0.6),
    n(96, 86, 8, 0.7),
    n(112, 83, 12, 0.6),
  ],
};

export const PORANEK: Song = {
  id: "poranek",
  tempo: 104,
  transpose: 3,
  form: [PORANEK_A, PORANEK_A, PORANEK_B, PORANEK_B],
  arrangement: { lead: "fmPiano", bass: "walking", pad: false, percussion: "hats" },
  timbre: {
    leadWave: "square",
    leadDetune: 4,
    leadCutoff: [3200, 1400],
    leadGain: 0.11,
    padWave: "triangle",
    padGain: 0.07,
    padCutoff: [1200, 1800],
    bassWave: "square",
    bassGain: 0.18,
    reverbSend: 0.22,
    tickGain: 0.07,
  },
};

/* ---------- 3. Nocna Buła: zapis w a-moll, gra w e-moll (transpose -5), 66 BPM, dzwonki FM, sub-bas, pad ---------- */

const A1 = 33;

const NOC_A: Section = {
  roots: [A2, F2, C3, G2, A2, F2, E2, E2],
  colors: [MINOR7, MAJ7, MAJ7, DOM7, MINOR7, MAJ7, DOM7, DOM7],
  lead: [
    n(0, 81, 12, 0.9),
    n(16, 79, 10, 0.8),
    n(32, 76, 12, 0.85),
    n(52, 74, 4, 0.6),
    n(56, 76, 6, 0.6),
    n(64, 81, 8, 0.9),
    n(76, 84, 4, 0.7),
    n(80, 83, 12, 0.8),
    n(96, 79, 8, 0.8),
    n(108, 80, 4, 0.7),
    n(112, 81, 14, 0.85),
  ],
};

const NOC_B: Section = {
  roots: [D2, A2, D2, E2, F2, G2, A1, A2],
  colors: [MINOR7, MINOR7, MINOR7, DOM7, MAJ7, DOM7, MINOR7, MINOR7],
  lead: [
    n(0, 77, 12, 0.85),
    n(16, 76, 12, 0.8),
    n(32, 74, 8, 0.8),
    n(44, 77, 4, 0.6),
    n(48, 80, 14, 0.85),
    n(64, 81, 8, 0.85),
    n(76, 79, 4, 0.6),
    n(80, 77, 12, 0.8),
    n(96, 76, 8, 0.75),
    n(108, 72, 4, 0.6),
    n(112, 69, 16, 0.85),
  ],
};

export const NOC: Song = {
  id: "noc",
  tempo: 66,
  transpose: -5,
  form: [NOC_A, NOC_A, NOC_B, NOC_B],
  arrangement: { lead: "bell", bass: "sub", pad: true, percussion: "thump" },
  timbre: {
    leadWave: "triangle",
    leadDetune: 9,
    leadCutoff: [1800, 700],
    leadGain: 0.3,
    padWave: "sawtooth",
    padGain: 0.04,
    padCutoff: [600, 1000],
    bassWave: "triangle",
    bassGain: 0.36,
    reverbSend: 0.55,
    tickGain: 0.03,
  },
};

export const SONGS: Record<TrackId, Song> = { wieczor: WIECZOR, poranek: PORANEK, noc: NOC };

export function loopSteps(song: Song): number {
  return SECTION_STEPS * song.form.length;
}

export function stepSeconds(song: Song): number {
  return 60 / song.tempo / 4;
}

export function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** Wariacja pętli: co drugie przejście melodia cichnie o oktawę niżej, co czwarte milknie (tylko bas i pad). */
export type LoopVariant = { leadOctave: number; leadGain: number; padOpen: boolean };

export function loopVariant(loopIndex: number): LoopVariant {
  const phase = loopIndex % 4;
  if (phase === 3) {
    return { leadOctave: 0, leadGain: 0, padOpen: true };
  }
  if (phase === 1) {
    return { leadOctave: -12, leadGain: 0.7, padOpen: false };
  }
  return { leadOctave: 0, leadGain: 1, padOpen: phase === 2 };
}
