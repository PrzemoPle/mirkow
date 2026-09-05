import { describe, expect, it } from "vitest";
import { shiftWage } from "./actions";
import { ECONOMY_PERIOD_WEEKS, isEconomyWeek, rollEconomy, wageMultiplier } from "./economy";
import { firstSeedFor } from "./events";
import { getJobDef } from "./jobs";
import { dispatch } from "./reducer";
import { createVersusMatch } from "./state";
import type { EngineResult } from "./result";
import type { GameState } from "./types";

function unwrap(result: EngineResult): GameState {
  if (!result.ok) {
    throw new Error(result.error.code);
  }
  return result.state;
}

describe("koniunktura", () => {
  it("rolls a phase and freezes one company only in recession", () => {
    const seen = new Set<string>();
    let seed = 3;
    for (let index = 0; index < 400; index += 1) {
      const rolled = rollEconomy(seed);
      seed = rolled.seed;
      seen.add(rolled.economy.phase);
      if (rolled.economy.phase === "recession") {
        expect(rolled.economy.hiringFrozen).not.toBeNull();
      } else {
        expect(rolled.economy.hiringFrozen).toBeNull();
      }
    }
    expect(seen).toEqual(new Set(["normal", "boom", "recession"]));
  });

  it("changes wages by phase", () => {
    const base = createVersusMatch({ job: { id: "depotMonter", weeks: 0, raises: 0 } });
    const player = base.players[0]!;
    const wage = getJobDef("depotMonter").wage;
    expect(shiftWage(base, player)).toBe(wage);
    expect(shiftWage({ ...base, economy: { phase: "boom", hiringFrozen: null } }, player)).toBe(
      Math.round((wage * wageMultiplier("boom")) / 10) * 10,
    );
    expect(shiftWage({ ...base, economy: { phase: "recession", hiringFrozen: null } }, player)).toBe(
      Math.round((wage * wageMultiplier("recession")) / 10) * 10,
    );
  });

  it("re-rolls the economy every eighth week after the full round", () => {
    expect(isEconomyWeek(ECONOMY_PERIOD_WEEKS)).toBe(true);
    expect(isEconomyWeek(ECONOMY_PERIOD_WEEKS - 1)).toBe(false);
    const quiet = { foodWeeks: 9, clothesWeeks: 9, suitWeeks: 0 };
    let state = createVersusMatch({ week: ECONOMY_PERIOD_WEEKS, needs: quiet, botNeeds: quiet, rngSeed: firstSeedFor("spokoj") });
    state = unwrap(dispatch(state, { type: "endWeek" }));
    expect(state.lastWeekEffects.some((effect) => effect.kind === "economy")).toBe(false);
    state = unwrap(dispatch({ ...state, rngSeed: firstSeedFor("spokoj") }, { type: "endWeek" }));
    expect(state.week).toBe(ECONOMY_PERIOD_WEEKS + 1);
    expect(state.lastWeekEffects.some((effect) => effect.kind === "economy")).toBe(true);
  });
});
