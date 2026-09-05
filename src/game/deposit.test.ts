import { describe, expect, it } from "vitest";
import { DEPOSIT_COST, DEPOSIT_PAYOUT, DEPOSIT_WEEKS } from "./actions";
import { firstSeedFor } from "./events";
import { RENT_MAX } from "./market";
import { dispatch } from "./reducer";
import { actionBlock } from "./selectors";
import { createMatch, startingNeeds } from "./state";
import { STARTING_CLOTHES_WEEKS, STARTING_FOOD_WEEKS, STARTING_MONEY, type GameState } from "./types";
import type { EngineResult } from "./result";

function unwrap(result: EngineResult): GameState {
  if (!result.ok) {
    throw new Error(result.error.code);
  }
  return result.state;
}

function playerOf(state: GameState) {
  const player = state.players[state.active];
  if (player === undefined) {
    throw new Error("missing player");
  }
  return player;
}

describe("lokata w Naszej Kasie", () => {
  it("takes the money now and pays out after four weeks", () => {
    const start = createMatch({
      locationId: "bank",
      stats: { money: 1500 },
      rngSeed: firstSeedFor("spokoj"),
      needs: { foodWeeks: 9, clothesWeeks: 9 },
    });
    const opened = unwrap(dispatch(start, { type: "act", id: "deposit" }));
    expect(playerOf(opened).stats.money).toBe(1500 - DEPOSIT_COST);
    expect(playerOf(opened).deposit).toEqual({
      amount: DEPOSIT_COST,
      payout: DEPOSIT_PAYOUT,
      weeksLeft: DEPOSIT_WEEKS,
    });
    expect(actionBlock(opened, "deposit")).toEqual({ code: "depositActive" });

    let state = opened;
    for (let week = 1; week < DEPOSIT_WEEKS; week += 1) {
      state = unwrap(dispatch({ ...state, rngSeed: firstSeedFor("spokoj") }, { type: "endWeek" }));
      expect(playerOf(state).deposit).not.toBeNull();
    }
    const paid = unwrap(dispatch({ ...state, rngSeed: firstSeedFor("spokoj") }, { type: "endWeek" }));
    expect(playerOf(paid).deposit).toBeNull();
    expect(paid.lastWeekEffects).toContainEqual({ kind: "deposit", amount: DEPOSIT_PAYOUT });
  });

  it("refuses a deposit the player cannot afford", () => {
    const poor = createMatch({ locationId: "bank", stats: { money: 300 } });
    expect(actionBlock(poor, "deposit")?.code).toBe("insufficientMoney");
  });
});

describe("czynsz", () => {
  it("stops rising at the cap", () => {
    let state = createMatch({
      week: 4,
      stats: { money: 100_000 },
      needs: { foodWeeks: 99, clothesWeeks: 99 },
    });
    for (let round = 0; round < 40; round += 1) {
      state = unwrap(dispatch({ ...state, week: 4, rngSeed: firstSeedFor("spokoj") }, { type: "endWeek" }));
    }
    expect(playerOf(state).home.rent).toBe(RENT_MAX);
  });
});

describe("balans startu", () => {
  it("gives two weeks of food and three of clothes", () => {
    expect(startingNeeds()).toEqual({
      foodWeeks: STARTING_FOOD_WEEKS,
      clothesWeeks: STARTING_CLOTHES_WEEKS,
    });
    expect(STARTING_FOOD_WEEKS).toBe(2);
    expect(STARTING_CLOTHES_WEEKS).toBe(3);
    expect(playerOf(createMatch()).stats.money).toBe(STARTING_MONEY);
  });
});
