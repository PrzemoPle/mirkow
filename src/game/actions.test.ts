import { describe, expect, it } from "vitest";
import { locationIds } from "./catalog";
import { dispatch } from "./reducer";
import { createMatch } from "./state";
import {
  ACTION_DEFS,
  BARE_HAPPINESS_PENALTY,
  FOOD_STOCK_WEEKS,
  HUNGER_TIME_PENALTY,
  STUDY_COURSE_COST,
  STUDY_COURSE_EDU,
  SUIT_COST,
  SUIT_STOCK_WEEKS,
  actionsAt,
  shiftWage,
} from "./actions";
import { firstSeedFor, KOREK_TIME } from "./events";
import { getJobDef, RELIABILITY_PER_SHIFT } from "./jobs";
import { STARTING_HAPPINESS, STARTING_MONEY, STARTING_RENT, type GameState } from "./types";
import type { EngineResult } from "./result";
import { TIME_MAX } from "./catalog";

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

function playerOf(state: GameState) {
  const player = state.players[state.active];
  if (player === undefined) {
    throw new Error("missing player");
  }
  return player;
}

const quiet = { foodWeeks: 9, clothesWeeks: 9, suitWeeks: 0 };

describe("actionsAt", () => {
  it("covers every location; work follows the job, not the tile", () => {
    for (const id of locationIds) {
      expect(Array.isArray(actionsAt(id))).toBe(true);
    }
    expect(actionsAt("bank")).toEqual(["deposit"]);
    expect(actionsAt("home")).toEqual(["restHome"]);
    expect(actionsAt("pup")).toEqual([]);
    expect(actionsAt("lombard")).toEqual(["buySuit"]);
    expect(actionsAt("elektro")).toEqual([]);
    expect(actionsAt("kebab")).toEqual(["openLokal"]);
    expect(actionsAt("campus")).toEqual(["studyCourse", "studyDegree"]);
    expect(actionsAt("shop")).toEqual(["buyFood", "buyClothes"]);

    const cashier = playerOf(createMatch({ job: { id: "kebabKasjer", weeks: 0, raises: 0 } }));
    expect(actionsAt("kebab", cashier)).toEqual(["work"]);
    expect(actionsAt("shop", cashier)).toEqual(["buyFood", "buyClothes"]);
    const clerk = playerOf(createMatch({ job: { id: "shopKasjer", weeks: 0, raises: 0 } }));
    expect(actionsAt("shop", clerk)).toEqual(["work", "buyFood", "buyClothes"]);
  });

  it("shows the lokal only to a kebab manager", () => {
    const manager = playerOf(createMatch({ job: { id: "kebabKierownik", weeks: 0, raises: 0 } }));
    expect(actionsAt("kebab", manager)).toEqual(["work", "openLokal"]);
  });

  it("keeps a def for every action id", () => {
    for (const [id, def] of Object.entries(ACTION_DEFS)) {
      expect(def.id).toBe(id);
      expect(def.timeCost).toBeGreaterThan(0);
    }
  });
});

describe("work", () => {
  it("pays the wage at the job's own tile and builds experience and reliability", () => {
    const state = createMatch({ locationId: "kebab", job: { id: "kebabPomoc", weeks: 0, raises: 0 }, reliability: 20 });
    const wage = shiftWage(state, playerOf(state));
    expect(wage).toBe(getJobDef("kebabPomoc").wage);
    const after = unwrap(dispatch(state, { type: "act", id: "work" }));
    expect(playerOf(after).stats.money).toBe(STARTING_MONEY + wage);
    expect(playerOf(after).experience).toBe(1);
    expect(playerOf(after).reliability).toBe(20 + RELIABILITY_PER_SHIFT);
    expect(after.timeLeft).toBe(TIME_MAX - 3);
  });

  it("refuses work without a job and on the wrong tile", () => {
    expect(errorOf(dispatch(createMatch({ locationId: "kebab" }), { type: "act", id: "work" }))).toBe("noJob");
    const shopJob = createMatch({ locationId: "kebab", job: { id: "shopPolki", weeks: 0, raises: 0 } });
    expect(errorOf(dispatch(shopJob, { type: "act", id: "work" }))).toBe("wrongLocation");
  });

  it("refuses an office shift without a suit", () => {
    const bank = createMatch({ locationId: "bank", job: { id: "bankKasjer", weeks: 0, raises: 0 } });
    expect(errorOf(dispatch(bank, { type: "act", id: "work" }))).toBe("needsSuit");
    const suited = createMatch({
      locationId: "bank",
      job: { id: "bankKasjer", weeks: 0, raises: 0 },
      needs: { ...quiet, suitWeeks: 3 },
    });
    expect(dispatch(suited, { type: "act", id: "work" }).ok).toBe(true);
  });

  it("scales the wage with raises and rounds to 10 zł", () => {
    const state = createMatch({ job: { id: "kebabKasjer", weeks: 0, raises: 2 } });
    expect(shiftWage(state, playerOf(state))).toBe(340);
  });
});

describe("shopping and study", () => {
  it("stocks food at Żuczek and refuses a course without cash", () => {
    const shop = createMatch({ locationId: "shop", stats: { money: 100 } });
    const fed = unwrap(dispatch(shop, { type: "act", id: "buyFood" }));
    expect(playerOf(fed).needs.foodWeeks).toBe(FOOD_STOCK_WEEKS);
    expect(playerOf(fed).stats.money).toBe(100 - shop.market.food);

    const campus = createMatch({ locationId: "campus", stats: { money: STUDY_COURSE_COST - 1 } });
    expect(errorOf(dispatch(campus, { type: "act", id: "studyCourse" }))).toBe("insufficientMoney");
  });

  it("raises education on a weekend course", () => {
    const campus = createMatch({ locationId: "campus" });
    const learned = unwrap(dispatch(campus, { type: "act", id: "studyCourse" }));
    expect(playerOf(learned).stats.education).toBe(STUDY_COURSE_EDU);
  });

  it("sells a second-hand suit at the lombard", () => {
    const lombard = createMatch({ locationId: "lombard" });
    const suited = unwrap(dispatch(lombard, { type: "act", id: "buySuit" }));
    expect(playerOf(suited).needs.suitWeeks).toBe(SUIT_STOCK_WEEKS);
    expect(playerOf(suited).stats.money).toBe(STARTING_MONEY - SUIT_COST);
  });

  it("blocks an action on the wrong tile", () => {
    expect(errorOf(dispatch(createMatch({ locationId: "home" }), { type: "act", id: "buyFood" }))).toBe("wrongLocation");
  });
});

describe("week settlement", () => {
  it("charges rent every fourth week and raises it", () => {
    const after = unwrap(
      dispatch(createMatch({ week: 4, rngSeed: firstSeedFor("spokoj"), needs: quiet }), { type: "endWeek" }),
    );
    expect(playerOf(after).stats.money).toBe(STARTING_MONEY - STARTING_RENT);
    expect(after.lastWeekEffects).toContainEqual({ kind: "rent", amount: STARTING_RENT });
    expect(playerOf(after).home.rent).toBe(STARTING_RENT + 50);
    expect(after.week).toBe(5);
  });

  it("cuts next-week time and happiness when food runs out", () => {
    const after = unwrap(
      dispatch(
        createMatch({ rngSeed: firstSeedFor("spokoj"), needs: { ...quiet, foodWeeks: 1 } }),
        { type: "endWeek" },
      ),
    );
    expect(after.timeLeft).toBe(TIME_MAX - HUNGER_TIME_PENALTY);
    expect(playerOf(after).stats.happiness).toBe(STARTING_HAPPINESS - 3);
  });

  it("drops happiness when clothes run out", () => {
    const after = unwrap(
      dispatch(
        createMatch({ rngSeed: firstSeedFor("spokoj"), needs: { ...quiet, clothesWeeks: 1 } }),
        { type: "endWeek" },
      ),
    );
    expect(playerOf(after).stats.happiness).toBe(STARTING_HAPPINESS - BARE_HAPPINESS_PENALTY);
  });

  it("stacks the traffic jam on top of hunger", () => {
    const after = unwrap(
      dispatch(
        createMatch({ rngSeed: firstSeedFor("korek"), needs: { ...quiet, foodWeeks: 1 } }),
        { type: "endWeek" },
      ),
    );
    expect(after.timeLeft).toBe(TIME_MAX - HUNGER_TIME_PENALTY - KOREK_TIME);
  });

  it("counts a finished week on the job and wears the suit", () => {
    const after = unwrap(
      dispatch(
        createMatch({
          rngSeed: firstSeedFor("spokoj"),
          job: { id: "kebabPomoc", weeks: 2, raises: 0 },
          reliability: 50,
          needs: { ...quiet, suitWeeks: 2 },
        }),
        { type: "endWeek" },
      ),
    );
    expect(playerOf(after).job?.weeks).toBe(3);
    expect(playerOf(after).needs.suitWeeks).toBe(1);
  });
});
