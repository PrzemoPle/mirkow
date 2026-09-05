/**
 * „Wieczór w Mirkowie”: utwór w tle, zapisany jako dane, bez plików audio.
 * D-moll (dorycko z b6 w sekcji B), 84 BPM, szesnastki. Struktura AABB, 8 taktów na sekcję.
 * Silnik (engine.ts) gra to na dwóch rozstrojonych kwadratach, trójkątnym basie i padzie z pogłosem.
 */

export const TEMPO_BPM = 84;
export const STEPS_PER_BAR = 16;
export const BARS_PER_SECTION = 8;
export const SECTION_STEPS = STEPS_PER_BAR * BARS_PER_SECTION;

/** Nuta: krok w sekcji, wysokość MIDI, długość w krokach, głośność 0..1. */
export type Note = { step: number; midi: number; length: number; velocity: number };

export type Section = {
  /** Podstawa akordu na takt (MIDI, oktawa basu). */
  roots: readonly number[];
  /** Tercja i septyma nad podstawą (półtony) na takt: pad. */
  colors: readonly (readonly [number, number])[];
  lead: readonly Note[];
};

const D2 = 38;
const F2 = 41;
const G2 = 43;
const A2 = 45;
const Bb2 = 46;
const C3 = 48;

const n = (step: number, midi: number, length: number, velocity = 0.8): Note => ({ step, midi, length, velocity });

/** Sekcja A: spokojna, obiegowa. Melodia w pentatonice d-moll z przejściami. */
export const SECTION_A: Section = {
  roots: [D2, F2, C3, G2, D2, F2, A2, G2],
  colors: [
    [3, 10],
    [4, 11],
    [4, 10],
    [3, 10],
    [3, 10],
    [4, 11],
    [3, 10],
    [4, 10],
  ],
  lead: [
    // takt 1
    n(0, 74, 6),
    n(8, 72, 4, 0.7),
    n(12, 69, 4, 0.7),
    // takt 2
    n(16, 72, 8),
    n(28, 74, 4, 0.6),
    // takt 3
    n(32, 76, 6),
    n(40, 74, 4, 0.7),
    n(44, 72, 4, 0.7),
    // takt 4
    n(48, 69, 10),
    n(60, 67, 4, 0.6),
    // takt 5
    n(64, 74, 6),
    n(72, 77, 4, 0.75),
    n(76, 76, 4, 0.7),
    // takt 6
    n(80, 72, 8),
    n(92, 74, 4, 0.6),
    // takt 7
    n(96, 76, 4),
    n(100, 79, 4, 0.8),
    n(104, 77, 4, 0.7),
    n(108, 76, 4, 0.7),
    // takt 8: wyciszenie na dominantę
    n(112, 74, 12),
  ],
};

/** Sekcja B: wyżej i bardziej melancholijnie, z b6 (B♭). */
export const SECTION_B: Section = {
  roots: [Bb2, F2, C3, G2, Bb2, F2, C3, D2],
  colors: [
    [4, 11],
    [4, 11],
    [4, 10],
    [3, 10],
    [4, 11],
    [4, 11],
    [4, 10],
    [3, 10],
  ],
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

/** Kolejność sekcji w jednej pętli: AABB. */
export const SONG_FORM: readonly Section[] = [SECTION_A, SECTION_A, SECTION_B, SECTION_B];
export const LOOP_STEPS = SECTION_STEPS * SONG_FORM.length;

export function stepSeconds(): number {
  return 60 / TEMPO_BPM / 4;
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
