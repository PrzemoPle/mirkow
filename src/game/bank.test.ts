import { describe, expect, it } from "vitest";
import { EAT_OUT_COST } from "./actions";
import { loanInstallment, loanLimit, PICKPOCKET_MAX, STOCK_LOT, wealth } from "./bank";
import { firstSeedFor } from "./events";
import { dispatch } from "./reducer";
import { actionBlockFor } from "./selectors";
import { createMatch } from "./state";
import { WEEKEND_DEFS } from "./weekends";
import type { EngineResult } from "./result";
import type { GameState } from "./types";

function unwrap(result: EngineResult): GameState {
  if (!result.ok) {
    throw new Error(result.error.code);
  }
  return result.state;
}

function errorOf(result: EngineResult): string {
  if (result.ok) {
    throw new Error("expected failure");
  }
  return result.error.code;
}

/** Linijka weekendu zmienia kasę i szczęście; testy liczą ją jawnie. */
function weekendOf(state: GameState): { money: number; happiness: number } {
  const found = state.lastWeekEffects.find((effect) => effect.kind === "weekend");
  return found !== undefined && found.kind === "weekend" ? { money: found.money, happiness: found.happiness } : { money: 0, happiness: 0 };
}

function playerOf(state: GameState) {
  const player = state.players[state.active];
  if (player === undefined) {
    throw new Error("missing player");
  }
  return player;
}

const quiet = { foodWeeks: 9, clothesWeeks: 9, suitWeeks: 0 };

describe("konto", () => {
  it("moves cash in steps of 100 and keeps it safe from the pickpocket", () => {
    const bank = createMatch({ locationId: "bank", stats: { money: 800 } });
    const deposited = unwrap(dispatch(bank, { type: "account", amount: 500 }));
    expect(playerOf(deposited).account).toBe(500);
    expect(playerOf(deposited).stats.money).toBe(300);
    expect(errorOf(dispatch(deposited, { type: "account", amount: 350 }))).toBe("badAmount");
    expect(errorOf(dispatch(deposited, { type: "account", amount: -600 }))).toBe("insufficientAccount");
    const back = unwrap(dispatch(deposited, { type: "account", amount: -500 }));
    expect(playerOf(back).stats.money).toBe(800);

    const robbed = unwrap(
      dispatch(createMatch({ stats: { money: 5000 }, account: 2000, needs: quiet, rngSeed: firstSeedFor("kieszonkowiec") }), { type: "endWeek" }),
    );
    expect(playerOf(robbed).account).toBe(2000);
    expect(playerOf(robbed).stats.money).toBe(5000 - PICKPOCKET_MAX + weekendOf(robbed).money);
    expect(robbed.lastWeekEffects).toContainEqual({ kind: "pickpocket", amount: PICKPOCKET_MAX });
  });

  it("counts wealth across cash, account, deposit and shares minus the loan", () => {
    const state = createMatch({
      stats: { money: 1000 },
      account: 500,
      shares: 20,
      stockPrice: 60,
      loan: { principal: 500, missed: 0 },
    });
    expect(wealth(playerOf(state), state.stockPrice)).toBe(1000 + 500 + 1200 - 500);
  });
});

describe("kredyt", () => {
  it("lends up to six shifts, collects an installment every fourth week, then sends the bailiff", () => {
    const worker = createMatch({ locationId: "bank", job: { id: "kebabKasjer", weeks: 0, raises: 0 } });
    const limit = loanLimit(280);
    expect(limit).toBe(1500);
    expect(actionBlockFor(worker, { type: "loan", amount: 2000 })?.code).toBe("loanTooBig");
    const borrowed = unwrap(dispatch(worker, { type: "loan", amount: 1000 }));
    expect(playerOf(borrowed).loan).toEqual({ principal: 1000, missed: 0 });
    expect(playerOf(borrowed).stats.money).toBe(1800);
    expect(actionBlockFor(borrowed, { type: "loan", amount: 500 })?.code).toBe("loanActive");

    const installment = loanInstallment({ principal: 1000, missed: 0 });
    expect(installment).toBe(290);
    const dueWeek = createMatch({ week: 4, loan: { principal: 1000, missed: 0 }, stats: { money: 1000 }, account: 500, needs: quiet, rngSeed: firstSeedFor("spokoj") });
    const paid = unwrap(dispatch(dueWeek, { type: "endWeek" }));
    expect(playerOf(paid).stats.money).toBe(1000 - 400 - installment + weekendOf(paid).money);
    expect(playerOf(paid).account).toBe(500);

    const thin = createMatch({ week: 4, loan: { principal: 1000, missed: 0 }, stats: { money: 500 }, account: 500, needs: quiet, rngSeed: firstSeedFor("spokoj") });
    const split = unwrap(dispatch(thin, { type: "endWeek" }));
    expect(playerOf(split).account).toBe(500 - 190);
    expect(playerOf(paid).loan?.principal).toBe(1000 - 250);
    expect(paid.lastWeekEffects).toContainEqual({ kind: "installment", amount: installment, paid: true });

    const broke = createMatch({ week: 4, loan: { principal: 1000, missed: 1 }, stats: { money: 50 }, needs: quiet, rngSeed: firstSeedFor("spokoj"), items: [{ id: "rower", used: false, broken: false }] });
    const seized = unwrap(dispatch(broke, { type: "endWeek" }));
    expect(playerOf(seized).items).toEqual([]);
    expect(playerOf(seized).lastNotice).toBe("komornik");
    expect(playerOf(seized).loan?.missed).toBe(0);
  });

  it("repays early from cash", () => {
    const debtor = createMatch({ locationId: "bank", loan: { principal: 1000, missed: 0 }, stats: { money: 1200 } });
    const repaid = unwrap(dispatch(debtor, { type: "loan", amount: -1000 }));
    expect(playerOf(repaid).loan).toBeNull();
    expect(playerOf(repaid).stats.money).toBe(200);
  });
});

describe("akcje MZT", () => {
  it("trades in lots of ten at the current price and follows the economy", () => {
    const bank = createMatch({ locationId: "bank", stats: { money: 1000 }, stockPrice: 50 });
    const bought = unwrap(dispatch(bank, { type: "trade", shares: STOCK_LOT }));
    expect(playerOf(bought).shares).toBe(10);
    expect(playerOf(bought).stats.money).toBe(500);
    expect(errorOf(dispatch(bought, { type: "trade", shares: -20 }))).toBe("notEnoughShares");
    expect(errorOf(dispatch(bought, { type: "trade", shares: 5 }))).toBe("badAmount");

    const boom = createMatch({ needs: quiet, economy: { phase: "boom", hiringFrozen: null }, stockPrice: 100, rngSeed: firstSeedFor("spokoj") });
    const after = unwrap(dispatch(boom, { type: "endWeek" }));
    expect(after.stockPrice).toBeGreaterThan(100);
    expect(after.stockHistory.at(-1)).toBe(after.stockPrice);
    const bust = createMatch({ needs: quiet, economy: { phase: "recession", hiringFrozen: null }, stockPrice: 100, rngSeed: firstSeedFor("spokoj") });
    expect(unwrap(dispatch(bust, { type: "endWeek" })).stockPrice).toBeLessThan(100);
  });
});

describe("weekend i jedzenie na miejscu", () => {
  it("picks one weekend line per week that matches what the player owns", () => {
    const withTv = createMatch({ needs: quiet, items: [{ id: "telewizor", used: false, broken: false }] });
    const ids = new Set<string>();
    for (let seed = 1; seed < 400; seed += 1) {
      const after = unwrap(dispatch({ ...withTv, rngSeed: seed }, { type: "endWeek" }));
      const weekend = after.lastWeekEffects.filter((effect) => effect.kind === "weekend");
      expect(weekend).toHaveLength(1);
      const only = weekend[0];
      if (only?.kind === "weekend") {
        ids.add(only.id);
        expect(WEEKEND_DEFS.find((def) => def.id === only.id)?.when(playerOf(withTv))).toBe(true);
      }
    }
    expect(ids.has("serialMaraton")).toBe(true);
    expect(ids.has("fuchaKomputer")).toBe(false);
    expect(WEEKEND_DEFS.length).toBeGreaterThanOrEqual(20);
  });

  it("eats a kebab on the spot for one week of food and a smile", () => {
    const kebab = createMatch({ locationId: "kebab", needs: { ...quiet, foodWeeks: 0 } });
    const fed = unwrap(dispatch(kebab, { type: "act", id: "eatOut" }));
    expect(playerOf(fed).needs.foodWeeks).toBe(1);
    expect(playerOf(fed).stats.money).toBe(800 - EAT_OUT_COST);
    expect(playerOf(fed).stats.happiness).toBe(21);
  });
});
