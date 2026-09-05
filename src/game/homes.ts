import type { EconomyPhase, HomeId } from "./types";

export const RELOCATE_TIME = 2;
/** Czynsz przy podpisaniu umowy zależy od koniunktury i zostaje zamrożony. */
export const BOOM_RENT = 1.1;
export const RECESSION_RENT = 0.8;
/** Szansa kradzieży na stancji w tygodniu; rośnie, gdy jest co kraść. */
export const THEFT_CHANCE = 0.08;
export const THEFT_CHANCE_LOADED = 0.12;
export const THEFT_LOADED_ITEMS = 3;

export const homeIds = ["stancja", "kawalerka", "apartament"] as const satisfies readonly HomeId[];

export type HomeDef = {
  id: HomeId;
  baseRent: number;
  slots: number;
  theft: boolean;
  happinessWeekly: number;
  /** Kaucja przy wprowadzce jako wielokrotność czynszu. */
  depositRents: number;
};

export const HOME_DEFS: Record<HomeId, HomeDef> = {
  stancja: { id: "stancja", baseRent: 400, slots: 3, theft: true, happinessWeekly: 0, depositRents: 0 },
  kawalerka: { id: "kawalerka", baseRent: 700, slots: 6, theft: false, happinessWeekly: 1, depositRents: 1 },
  apartament: { id: "apartament", baseRent: 1200, slots: 10, theft: false, happinessWeekly: 3, depositRents: 1 },
};

export function getHomeDef(id: HomeId): HomeDef {
  const def = HOME_DEFS[id];
  if (def === undefined) {
    throw new Error(`Missing home ${id}`);
  }
  return def;
}

export function isHomeId(value: string): value is HomeId {
  return Object.hasOwn(HOME_DEFS, value);
}

export function rentMultiplier(phase: EconomyPhase): number {
  switch (phase) {
    case "boom":
      return BOOM_RENT;
    case "recession":
      return RECESSION_RENT;
    case "normal":
      return 1;
  }
}

/** Stawka umowy podpisywanej dziś, zaokrąglona do 10 zł. */
export function leaseRent(id: HomeId, phase: EconomyPhase): number {
  return Math.round((getHomeDef(id).baseRent * rentMultiplier(phase)) / 10) * 10;
}

export function homeRank(id: HomeId): number {
  return homeIds.indexOf(id);
}
