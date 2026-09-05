import { advanceRng } from "./rng";
import type { EventId } from "./types";

export const eventIds = [
  "korek",
  "lotto",
  "pralka",
  "tesciowa",
  "aukcje",
  "kontrola",
  "pit",
  "promocja",
  "napiwki",
  "spokoj",
  "kieszonkowiec",
] as const satisfies readonly EventId[];

/** Wagi losowania: spokojny tydzień i napiwki ważą więcej, żeby gra nie karała co turę. */
export const EVENT_WEIGHTS: Record<EventId, number> = {
  korek: 1,
  lotto: 1,
  pralka: 1,
  tesciowa: 1,
  aukcje: 1,
  kontrola: 1,
  pit: 1,
  promocja: 1,
  napiwki: 1.5,
  spokoj: 2.5,
  kieszonkowiec: 1,
};

export type EventDef = {
  id: EventId;
  money: number;
  happiness: number;
  timeLost: number;
  foodWeeks: number;
};

export const KOREK_TIME = 2;
export const LOTTO_MONEY = 400;
export const PRALKA_COST = 180;
export const TESCIOWA_HAPPINESS = 8;
export const AUKCJE_COST = 90;
export const KONTROLA_COST = 50;
export const PIT_COST = 220;
export const PROMOCJA_FOOD = 1;
export const NAPIWKI_MONEY = 60;

const idle = {
  money: 0,
  happiness: 0,
  timeLost: 0,
  foodWeeks: 0,
} satisfies Omit<EventDef, "id">;

export const EVENT_DEFS: Record<EventId, EventDef> = {
  korek: { ...idle, id: "korek", timeLost: KOREK_TIME },
  lotto: { ...idle, id: "lotto", money: LOTTO_MONEY },
  pralka: { ...idle, id: "pralka", money: -PRALKA_COST },
  tesciowa: { ...idle, id: "tesciowa", happiness: -TESCIOWA_HAPPINESS },
  aukcje: { ...idle, id: "aukcje", money: -AUKCJE_COST },
  kontrola: { ...idle, id: "kontrola", money: -KONTROLA_COST },
  pit: { ...idle, id: "pit", money: -PIT_COST },
  promocja: { ...idle, id: "promocja", foodWeeks: PROMOCJA_FOOD },
  napiwki: { ...idle, id: "napiwki", money: NAPIWKI_MONEY },
  spokoj: { ...idle, id: "spokoj" },
  kieszonkowiec: { ...idle, id: "kieszonkowiec" },
};

export function getEventDef(id: EventId): EventDef {
  const def = EVENT_DEFS[id];
  if (def === undefined) {
    throw new Error(`Missing event ${id}`);
  }
  return def;
}

const TOTAL_WEIGHT = eventIds.reduce((sum, id) => sum + EVENT_WEIGHTS[id], 0);

export function pickEvent(seed: number): { id: EventId; seed: number } {
  const roll = advanceRng(seed);
  let cursor = roll.value * TOTAL_WEIGHT;
  for (const id of eventIds) {
    cursor -= EVENT_WEIGHTS[id];
    if (cursor < 0) {
      return { id, seed: roll.seed };
    }
  }
  const last = eventIds[eventIds.length - 1];
  if (last === undefined) {
    throw new Error("Event table is empty");
  }
  return { id: last, seed: roll.seed };
}

export function firstSeedFor(id: EventId): number {
  for (let seed = 1; seed < 20_000; seed += 1) {
    if (pickEvent(seed).id === id) {
      return seed;
    }
  }
  throw new Error(`No seed for ${id}`);
}
