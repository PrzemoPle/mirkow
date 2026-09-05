import { companyIds } from "./jobs";
import { advanceRng } from "./rng";
import type { CompanyId, Economy, EconomyPhase } from "./types";

export const ECONOMY_PERIOD_WEEKS = 8;
export const BOOM_WAGE = 1.15;
export const RECESSION_WAGE = 0.85;
export const BOOM_PRICES = 1.1;
export const RECESSION_PRICES = 1.05;
/** Szansa na zwolnienie w recesji dla osób tuż nad progiem solidności. */
export const REDUCTION_CHANCE = 0.1;
export const REDUCTION_MARGIN = 5;

const PHASE_WEIGHTS: Record<EconomyPhase, number> = {
  normal: 2,
  boom: 1,
  recession: 1,
};

export function startingEconomy(): Economy {
  return { phase: "normal", hiringFrozen: null };
}

export function wageMultiplier(phase: EconomyPhase): number {
  switch (phase) {
    case "boom":
      return BOOM_WAGE;
    case "recession":
      return RECESSION_WAGE;
    case "normal":
      return 1;
  }
}

export function priceMultiplier(phase: EconomyPhase): number {
  switch (phase) {
    case "boom":
      return BOOM_PRICES;
    case "recession":
      return RECESSION_PRICES;
    case "normal":
      return 1;
  }
}

export function rollEconomy(seed: number): { economy: Economy; seed: number } {
  const roll = advanceRng(seed);
  const total = PHASE_WEIGHTS.normal + PHASE_WEIGHTS.boom + PHASE_WEIGHTS.recession;
  let cursor = roll.value * total;
  let phase: EconomyPhase = "recession";
  for (const candidate of ["normal", "boom", "recession"] as const) {
    cursor -= PHASE_WEIGHTS[candidate];
    if (cursor < 0) {
      phase = candidate;
      break;
    }
  }
  if (phase !== "recession") {
    return { economy: { phase, hiringFrozen: null }, seed: roll.seed };
  }
  const pick = advanceRng(roll.seed);
  const index = Math.min(companyIds.length - 1, Math.floor(pick.value * companyIds.length));
  const frozen: CompanyId = companyIds[index] ?? "depot";
  return { economy: { phase, hiringFrozen: frozen }, seed: pick.seed };
}

export function isEconomyWeek(week: number): boolean {
  return week > 0 && week % ECONOMY_PERIOD_WEEKS === 0;
}
