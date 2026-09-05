import { hasWorking } from "./items";
import { advanceRng } from "./rng";
import type { Player, WeekendId } from "./types";

export type WeekendDef = {
  id: WeekendId;
  money: number;
  happiness: number;
  /** Warunek: co trzeba mieć (albo gdzie mieszkać), żeby ta linijka mogła paść. */
  when: (player: Player) => boolean;
  weight: number;
};

const always = (): boolean => true;

export const WEEKEND_DEFS: readonly WeekendDef[] = [
  { id: "spacerSkwer", money: 0, happiness: 1, when: always, weight: 2 },
  { id: "piwoKowalski", money: -40, happiness: 2, when: always, weight: 1 },
  { id: "rodzinaObiad", money: -30, happiness: 1, when: always, weight: 1 },
  { id: "deszczCalyWeekend", money: 0, happiness: -1, when: always, weight: 1 },
  { id: "kinoNaRogu", money: -35, happiness: 2, when: always, weight: 1 },
  { id: "zakupyImpuls", money: -60, happiness: 1, when: always, weight: 1 },
  { id: "serialMaraton", money: 0, happiness: 2, when: (p) => hasWorking(p, "telewizor"), weight: 2 },
  { id: "abonament", money: -30, happiness: 0, when: (p) => hasWorking(p, "telewizor"), weight: 1 },
  { id: "plytaNaWiezy", money: -25, happiness: 2, when: (p) => hasWorking(p, "wieza"), weight: 2 },
  { id: "fuchaKomputer", money: 120, happiness: 0, when: (p) => hasWorking(p, "komputer"), weight: 2 },
  { id: "granieNoc", money: 0, happiness: 2, when: (p) => hasWorking(p, "komputer"), weight: 1 },
  { id: "wycieczkaRower", money: 0, happiness: 3, when: (p) => hasWorking(p, "rower"), weight: 2 },
  { id: "kanapaDrzemka", money: 0, happiness: 2, when: (p) => hasWorking(p, "kanapa"), weight: 1 },
  { id: "pranieSasiadka", money: 20, happiness: 0, when: (p) => hasWorking(p, "pralka"), weight: 1 },
  { id: "lodowkaImpreza", money: -50, happiness: 3, when: (p) => hasWorking(p, "lodowka"), weight: 1 },
  { id: "encyklopediaQuiz", money: 0, happiness: 1, when: (p) => hasWorking(p, "encyklopedia"), weight: 1 },
  { id: "krysiaAwantura", money: 0, happiness: -2, when: (p) => p.home.id === "stancja", weight: 2 },
  { id: "krysiaCiasto", money: 0, happiness: 1, when: (p) => p.home.id === "stancja", weight: 1 },
  { id: "sasiedziGrill", money: -20, happiness: 2, when: (p) => p.home.id === "kawalerka", weight: 2 },
  { id: "balkonKawa", money: 0, happiness: 2, when: (p) => p.home.id === "kawalerka", weight: 1 },
  { id: "widokSkwer", money: 0, happiness: 3, when: (p) => p.home.id === "apartament", weight: 2 },
  { id: "goscieApartament", money: -80, happiness: 3, when: (p) => p.home.id === "apartament", weight: 1 },
];

export function getWeekendDef(id: WeekendId): WeekendDef {
  const def = WEEKEND_DEFS.find((entry) => entry.id === id);
  if (def === undefined) {
    throw new Error(`Missing weekend ${id}`);
  }
  return def;
}

export function pickWeekend(player: Player, seed: number): { def: WeekendDef; seed: number } {
  const pool = WEEKEND_DEFS.filter((def) => def.when(player));
  const total = pool.reduce((sum, def) => sum + def.weight, 0);
  const roll = advanceRng(seed);
  let cursor = roll.value * total;
  for (const def of pool) {
    cursor -= def.weight;
    if (cursor < 0) {
      return { def, seed: roll.seed };
    }
  }
  const last = pool[pool.length - 1] ?? WEEKEND_DEFS[0];
  if (last === undefined) {
    throw new Error("Weekend table is empty");
  }
  return { def: last, seed: roll.seed };
}
