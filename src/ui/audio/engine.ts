/**
 * Dźwięk Mirkowa na Web Audio, bez plików: muzyka z song.ts na rozstrojonych kwadratach
 * i trójkątnym basie, efekty syntetyzowane na miejscu. Wszystko rusza po pierwszym geście gracza.
 */
import {
  loopSteps,
  loopVariant,
  midiToHz,
  SECTION_STEPS,
  SONGS,
  STEPS_PER_BAR,
  stepSeconds,
  TRACK_IDS,
  type LoopVariant,
  type Section,
  type Song,
  type TrackId,
} from "./song";

export type AudioPrefs = { music: boolean; track: TrackId; sfx: boolean };

const PREFS_KEY = "mirkow.audio.v2";
const MUSIC_GAIN = 0.2;
const SFX_GAIN = 0.5;
const LOOKAHEAD_S = 0.12;
const TICK_MS = 30;
const DEFAULT_PREFS: AudioPrefs = { music: true, track: "wieczor", sfx: true };

export type SfxId = "move" | "act" | "coin" | "card" | "error" | "endWeek" | "stamp" | "victory" | "defeat" | "ui";

type Ctx = {
  context: AudioContext;
  master: GainNode;
  music: GainNode;
  sfx: GainNode;
  reverb: ConvolverNode;
  reverbSend: GainNode;
};

let ctx: Ctx | null = null;
let prefs: AudioPrefs = DEFAULT_PREFS;
let timer: number | null = null;
let songStart = 0;
let nextStep = 0;
let playing: Song | null = null;
let listeners: ((next: AudioPrefs) => void)[] = [];

function isTrackId(value: unknown): value is TrackId {
  return typeof value === "string" && (TRACK_IDS as readonly string[]).includes(value);
}

function readPrefs(): AudioPrefs {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (raw === null) {
      return DEFAULT_PREFS;
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && "music" in parsed && "sfx" in parsed) {
      const record = parsed as { music: unknown; sfx: unknown; track?: unknown };
      return {
        music: Boolean(record.music),
        sfx: Boolean(record.sfx),
        track: isTrackId(record.track) ? record.track : DEFAULT_PREFS.track,
      };
    }
  } catch {
    /* brak zapisu: domyślnie włączone */
  }
  return DEFAULT_PREFS;
}

function writePrefs(next: AudioPrefs): void {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  } catch {
    /* zapis nieobowiązkowy */
  }
}

prefs = typeof window === "undefined" ? prefs : readPrefs();

function makeImpulse(context: AudioContext, seconds: number, decay: number): AudioBuffer {
  const rate = context.sampleRate;
  const length = Math.floor(rate * seconds);
  const buffer = context.createBuffer(2, length, rate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let index = 0; index < length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / length) ** decay;
    }
  }
  return buffer;
}

function ensureContext(): Ctx | null {
  if (ctx !== null) {
    return ctx;
  }
  const Ctor = window.AudioContext;
  if (typeof Ctor !== "function") {
    return null;
  }
  const context = new Ctor();
  const master = context.createGain();
  master.gain.value = 1;
  master.connect(context.destination);
  const music = context.createGain();
  music.gain.value = prefs.music ? MUSIC_GAIN : 0;
  music.connect(master);
  const sfx = context.createGain();
  sfx.gain.value = prefs.sfx ? SFX_GAIN : 0;
  sfx.connect(master);
  const reverb = context.createConvolver();
  reverb.buffer = makeImpulse(context, 2.2, 3.2);
  const reverbSend = context.createGain();
  reverbSend.gain.value = 0.35;
  reverbSend.connect(reverb);
  reverb.connect(music);
  ctx = { context, master, music, sfx, reverb, reverbSend };
  return ctx;
}

/* ---------- muzyka ---------- */

function playLead(c: Ctx, song: Song, at: number, midi: number, lengthS: number, velocity: number): void {
  const { timbre } = song;
  const filter = c.context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(timbre.leadCutoff[0], at);
  filter.frequency.exponentialRampToValueAtTime(timbre.leadCutoff[1], at + lengthS);
  const env = c.context.createGain();
  const peak = timbre.leadGain * velocity;
  env.gain.setValueAtTime(0, at);
  env.gain.linearRampToValueAtTime(peak, at + 0.02);
  env.gain.setValueAtTime(peak, at + Math.max(0.03, lengthS - 0.08));
  env.gain.linearRampToValueAtTime(0, at + lengthS);
  filter.connect(env);
  env.connect(c.music);
  env.connect(c.reverbSend);
  for (const cents of [-timbre.leadDetune, timbre.leadDetune]) {
    const osc = c.context.createOscillator();
    osc.type = timbre.leadWave;
    osc.frequency.value = midiToHz(midi);
    osc.detune.value = cents;
    osc.connect(filter);
    osc.start(at);
    osc.stop(at + lengthS + 0.05);
  }
}

function playBass(c: Ctx, song: Song, at: number, midi: number, lengthS: number, velocity: number): void {
  const osc = c.context.createOscillator();
  osc.type = song.timbre.bassWave;
  osc.frequency.value = midiToHz(midi);
  const env = c.context.createGain();
  env.gain.setValueAtTime(0, at);
  env.gain.linearRampToValueAtTime(song.timbre.bassGain * velocity, at + 0.015);
  env.gain.exponentialRampToValueAtTime(0.001, at + lengthS);
  osc.connect(env);
  env.connect(c.music);
  osc.start(at);
  osc.stop(at + lengthS + 0.02);
}

function playPad(c: Ctx, song: Song, at: number, midis: readonly number[], lengthS: number, open: boolean): void {
  const { timbre } = song;
  const filter = c.context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = open ? timbre.padCutoff[1] : timbre.padCutoff[0];
  filter.Q.value = 1.4;
  const env = c.context.createGain();
  env.gain.setValueAtTime(0, at);
  env.gain.linearRampToValueAtTime(timbre.padGain, at + lengthS * 0.35);
  env.gain.setValueAtTime(timbre.padGain, at + lengthS * 0.7);
  env.gain.linearRampToValueAtTime(0, at + lengthS);
  filter.connect(env);
  env.connect(c.music);
  env.connect(c.reverbSend);
  for (const midi of midis) {
    for (const cents of [-5, 6]) {
      const osc = c.context.createOscillator();
      osc.type = timbre.padWave;
      osc.frequency.value = midiToHz(midi);
      osc.detune.value = cents;
      osc.connect(filter);
      osc.start(at);
      osc.stop(at + lengthS + 0.05);
    }
  }
}

function playTick(c: Ctx, at: number, gain: number): void {
  const length = 0.05;
  const buffer = c.context.createBuffer(1, Math.floor(c.context.sampleRate * length), c.context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / data.length) ** 2;
  }
  const source = c.context.createBufferSource();
  source.buffer = buffer;
  const filter = c.context.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 6000;
  const env = c.context.createGain();
  env.gain.value = gain;
  source.connect(filter);
  filter.connect(env);
  env.connect(c.music);
  source.start(at);
}

function scheduleStep(c: Ctx, song: Song, step: number, at: number): void {
  const total = loopSteps(song);
  const loopIndex = Math.floor(step / total);
  const inLoop = step % total;
  const sectionIndex = Math.floor(inLoop / SECTION_STEPS);
  const section: Section | undefined = song.form[sectionIndex];
  if (section === undefined) {
    return;
  }
  const inSection = inLoop % SECTION_STEPS;
  const bar = Math.floor(inSection / STEPS_PER_BAR);
  const inBar = inSection % STEPS_PER_BAR;
  const variant: LoopVariant = loopVariant(loopIndex);
  const stepS = stepSeconds(song);
  const root = section.roots[bar];
  const color = section.colors[bar];
  if (root === undefined || color === undefined) {
    return;
  }
  if (inBar === 0) {
    playBass(c, song, at, root, stepS * 7, 1);
    playPad(c, song, at, [root + 12, root + 12 + color[0], root + 12 + color[1]], stepS * STEPS_PER_BAR, variant.padOpen);
  } else if (inBar === 8) {
    playBass(c, song, at, root, stepS * 5, 0.8);
  } else if (inBar === 12) {
    playBass(c, song, at, root + 7, stepS * 3, 0.55);
  }
  if (inBar === 4 || inBar === 12) {
    playTick(c, at, inBar === 4 ? song.timbre.tickGain : song.timbre.tickGain * 0.7);
  }
  if (variant.leadGain > 0) {
    for (const note of section.lead) {
      if (note.step === inSection) {
        playLead(c, song, at, note.midi + variant.leadOctave, note.length * stepS, note.velocity * variant.leadGain);
      }
    }
  }
}

function tick(): void {
  const c = ctx;
  const song = playing;
  if (c === null || song === null) {
    return;
  }
  const stepS = stepSeconds(song);
  while (songStart + nextStep * stepS < c.context.currentTime + LOOKAHEAD_S) {
    scheduleStep(c, song, nextStep, songStart + nextStep * stepS);
    nextStep += 1;
  }
}

function startMusic(track: TrackId): void {
  const c = ensureContext();
  if (c === null) {
    return;
  }
  if (timer !== null && playing?.id === track) {
    return;
  }
  stopMusic();
  const song = SONGS[track];
  playing = song;
  c.reverbSend.gain.value = song.timbre.reverbSend;
  songStart = c.context.currentTime + 0.05;
  nextStep = 0;
  timer = window.setInterval(tick, TICK_MS);
  tick();
}

function stopMusic(): void {
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
  playing = null;
}

/* ---------- efekty ---------- */

function blip(c: Ctx, at: number, hz: number, lengthS: number, type: OscillatorType, gain: number, slideTo?: number): void {
  const osc = c.context.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(hz, at);
  if (slideTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, at + lengthS);
  }
  const env = c.context.createGain();
  env.gain.setValueAtTime(gain, at);
  env.gain.exponentialRampToValueAtTime(0.001, at + lengthS);
  osc.connect(env);
  env.connect(c.sfx);
  osc.start(at);
  osc.stop(at + lengthS + 0.02);
}

function noise(c: Ctx, at: number, lengthS: number, gain: number, filterType: BiquadFilterType, hz: number): void {
  const buffer = c.context.createBuffer(1, Math.floor(c.context.sampleRate * lengthS), c.context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
  }
  const source = c.context.createBufferSource();
  source.buffer = buffer;
  const filter = c.context.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = hz;
  const env = c.context.createGain();
  env.gain.value = gain;
  source.connect(filter);
  filter.connect(env);
  env.connect(c.sfx);
  source.start(at);
}

function playSfx(c: Ctx, id: SfxId): void {
  const t = c.context.currentTime;
  switch (id) {
    case "move":
      // dzwonek tramwaju: dwa krótkie uderzenia
      blip(c, t, 1318, 0.18, "sine", 0.35);
      blip(c, t, 2637, 0.12, "sine", 0.12);
      blip(c, t + 0.16, 1318, 0.22, "sine", 0.3);
      return;
    case "act":
      // pieczątka: tłumiony stuk
      noise(c, t, 0.08, 0.5, "lowpass", 900);
      blip(c, t, 140, 0.12, "sine", 0.4, 70);
      return;
    case "coin":
      blip(c, t, 1047, 0.08, "square", 0.18);
      blip(c, t + 0.07, 1568, 0.16, "square", 0.18);
      return;
    case "card":
      // papier: szum z przemiataniem
      noise(c, t, 0.22, 0.35, "bandpass", 1800);
      return;
    case "error":
      blip(c, t, 110, 0.14, "square", 0.22, 90);
      return;
    case "endWeek":
      blip(c, t, 659, 0.12, "square", 0.16);
      blip(c, t + 0.12, 523, 0.12, "square", 0.16);
      blip(c, t + 0.24, 392, 0.3, "square", 0.16);
      return;
    case "stamp":
      noise(c, t, 0.06, 0.6, "lowpass", 700);
      blip(c, t, 220, 0.1, "triangle", 0.35, 110);
      return;
    case "victory":
      for (const [index, hz] of [523, 659, 784, 1047, 1319].entries()) {
        blip(c, t + index * 0.1, hz, 0.35, "square", 0.16);
      }
      blip(c, t + 0.5, 1568, 0.8, "square", 0.14);
      return;
    case "defeat":
      blip(c, t, 392, 0.3, "square", 0.16, 370);
      blip(c, t + 0.3, 349, 0.3, "square", 0.16, 330);
      blip(c, t + 0.6, 294, 0.7, "square", 0.16, 262);
      return;
    case "ui":
      blip(c, t, 880, 0.05, "square", 0.08);
      return;
    default: {
      const exhaustive: never = id;
      return exhaustive;
    }
  }
}

/* ---------- API ---------- */

/** Wywołaj z obsługi gestu gracza (klik): odblokowuje kontekst i rusza muzykę, jeśli włączona. */
export function unlockAudio(): void {
  const c = ensureContext();
  if (c === null) {
    return;
  }
  if (c.context.state === "suspended") {
    void c.context.resume();
  }
  if (prefs.music) {
    startMusic(prefs.track);
  }
}

export function sfx(id: SfxId): void {
  if (!prefs.sfx || ctx === null) {
    return;
  }
  playSfx(ctx, id);
}

export function getAudioPrefs(): AudioPrefs {
  return prefs;
}

export function setAudioPrefs(next: AudioPrefs): void {
  const previous = prefs;
  prefs = next;
  writePrefs(next);
  const c = ctx;
  if (c !== null) {
    const now = c.context.currentTime;
    c.sfx.gain.value = next.sfx ? SFX_GAIN : 0;
    const trackChanged = next.music && previous.track !== next.track && timer !== null;
    if (trackChanged) {
      // Krótkie ściszenie, zmiana utworu, powrót głośności: bez trzasku.
      c.music.gain.cancelScheduledValues(now);
      c.music.gain.linearRampToValueAtTime(0, now + 0.25);
      window.setTimeout(() => {
        if (prefs.music && prefs.track === next.track) {
          startMusic(next.track);
          const later = c.context.currentTime;
          c.music.gain.cancelScheduledValues(later);
          c.music.gain.linearRampToValueAtTime(MUSIC_GAIN, later + 0.4);
        }
      }, 300);
    } else {
      c.music.gain.cancelScheduledValues(now);
      c.music.gain.linearRampToValueAtTime(next.music ? MUSIC_GAIN : 0, now + 0.3);
      if (next.music && timer === null) {
        startMusic(next.track);
      }
      if (!next.music) {
        window.setTimeout(() => {
          if (!prefs.music) {
            stopMusic();
          }
        }, 400);
      }
    }
  }
  for (const listener of listeners) {
    listener(next);
  }
}

export function onAudioPrefs(listener: (next: AudioPrefs) => void): void {
  listeners = [...listeners, listener];
}
