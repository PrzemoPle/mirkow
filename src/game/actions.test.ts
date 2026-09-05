import { describe, expect, it } from "vitest";
import { locationIds } from "./catalog";
import { dispatch } from "./reducer";
import { createMatch } from "./state";
import {
  ACTION_DEFS,
  BARE_HAPPINESS_PENALTY,
  BUY_FOOD_COST,
  FOOD_STOCK_WEEKS,
  HUNGER_TIME_PENALTY,
  STUDY_COURSE_COST,
  STUDY_COURSE_EDU,
  WORK_KEBAB_CAREER,
  WORK_KEBAB_WAGE,
  actionsAt,
} from "./actions";
import { firstSeedFor, KOREK_TIME } from "./events";
import {
  STARTING_HAPPINESS,
  STARTING_MONEY,
  STARTING_RENT,
  type GameState,
} from "./types";
import type { EngineResult } from "./result";
import { TIME_MAX } from "./catalog";

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

describe("actionsAt", () => {
  it("covers every location and leaves the bank idle", () => {
    for (const id of locationIds) {
      expect(Array.isArray(actionsAt(id))).toBe(true);
    }
    expect(actionsAt("bank")).toEqual([]);
    expect(actionsAt("home")).toEqual(["restHome"]);
    expect(actionsAt("pup")).toEqual(["searchJob", "applyKierownik"]);
    expect(actionsAt("kebab")).toEqual(["openLokal", "workKebab"]);
    expect(actionsAt("campus")).toEqual(["studyCourse", "studyDegree"]);
    expect(actionsAt("shop")).toEqual(["buyFood", "buyClothes"]);
  });

  it("hides promotion until the player is a cashier", () => {
    expect(actionsAt("pup", playerOf(createMatch()))).toEqual(["searchJob"]);
    expect(
      actionsAt(
        "pup",
        playerOf(
          createMatch({ job: { id: "kebabKasjer", weeks: 4 } }),
        ),
      ),
    ).toEqual(["applyKierownik"]);
    expect(
      actionsAt(
        "kebab",
        playerOf(
          createMatch({ job: { id: "kebabKierownik", weeks: 4 } }),
        ),
      ),
    ).toEqual(["openLokal", "workKebab"]);
  });

  it("keeps a def for every action id", () => {
    expect(ACTION_DEFS.searchJob.locationId).toBe("pup");
    expect(ACTION_DEFS.workKebab.requiredJobs).toContain("kebabKasjer");
  });
});

describe("location actions", () => {
  it("finds a kebab job at the PUP", () => {
    const after = unwrap(
      dispatch(createMatch({ locationId: "pup" }), {
        type: "act",
        id: "searchJob",
      }),
    );
    expect(playerOf(after).job).toEqual({ id: "kebabKasjer", weeks: 0 });
    expect(after.timeLeft).toBe(TIME_MAX - ACTION_DEFS.searchJob.timeCost);
  });

  it("rejects a second job search", () => {
    const employed = createMatch({
      locationId: "pup",
      job: { id: "kebabKasjer", weeks: 1 },
    });
    expect(dispatch(employed, { type: "act", id: "searchJob" })).toEqual({
      ok: false,
      error: { code: "alreadyEmployed" },
    });
  });

  it("pays a kebab shift only with a job on that tile", () => {
    const noJob = dispatch(createMatch({ locationId: "kebab" }), {
      type: "act",
      id: "workKebab",
    });
    expect(noJob).toEqual({ ok: false, error: { code: "noJob" } });

    const after = unwrap(
      dispatch(
        createMatch({
          locationId: "kebab",
          job: { id: "kebabKasjer", weeks: 0 },
        }),
        { type: "act", id: "workKebab" },
      ),
    );
    expect(playerOf(after).stats.money).toBe(STARTING_MONEY + WORK_KEBAB_WAGE);
    expect(playerOf(after).stats.career).toBe(WORK_KEBAB_CAREER);
  });

  it("blocks an action on the wrong tile", () => {
    expect(
      dispatch(createMatch({ locationId: "home" }), {
        type: "act",
        id: "buyFood",
      }),
    ).toEqual({
      ok: false,
      error: { code: "wrongLocation", here: "home", needed: "shop" },
    });
  });

  it("stocks food at Żuczek and refuses a course without cash", () => {
    const fed = unwrap(
      dispatch(createMatch({ locationId: "shop" }), {
        type: "act",
        id: "buyFood",
      }),
    );
    expect(playerOf(fed).needs.foodWeeks).toBe(FOOD_STOCK_WEEKS);
    expect(playerOf(fed).stats.money).toBe(STARTING_MONEY - BUY_FOOD_COST);

    const broke = dispatch(
      createMatch({ locationId: "campus", stats: { money: 20 } }),
      { type: "act", id: "studyCourse" },
    );
    expect(broke).toEqual({
      ok: false,
      error: { code: "insufficientMoney", needed: STUDY_COURSE_COST, have: 20 },
    });
  });

  it("raises education on a weekend course", () => {
    const after = unwrap(
      dispatch(createMatch({ locationId: "campus" }), {
        type: "act",
        id: "studyCourse",
      }),
    );
    expect(playerOf(after).stats.education).toBe(STUDY_COURSE_EDU);
    expect(playerOf(after).stats.money).toBe(STARTING_MONEY - STUDY_COURSE_COST);
  });

  it("sells a cafe rest and a gym session", () => {
    const cafe = unwrap(
      dispatch(createMatch({ locationId: "cafe" }), {
        type: "act",
        id: "restCafe",
      }),
    );
    expect(playerOf(cafe).stats.happiness).toBe(
      STARTING_HAPPINESS + ACTION_DEFS.restCafe.happiness,
    );
    expect(playerOf(cafe).stats.money).toBe(
      STARTING_MONEY - ACTION_DEFS.restCafe.moneyCost,
    );

    const gym = unwrap(
      dispatch(createMatch({ locationId: "gym" }), {
        type: "act",
        id: "restGym",
      }),
    );
    expect(playerOf(gym).stats.happiness).toBe(
      STARTING_HAPPINESS + ACTION_DEFS.restGym.happiness,
    );
    expect(playerOf(gym).stats.money).toBe(
      STARTING_MONEY - ACTION_DEFS.restGym.moneyCost,
    );
  });
});

describe("week settlement", () => {
  it("charges rent every fourth week", () => {
    const after = unwrap(
      dispatch(
        createMatch({
          week: 4,
          rngSeed: firstSeedFor("korek"),
          needs: { foodWeeks: 2, clothesWeeks: 3 },
        }),
        { type: "endWeek" },
      ),
    );
    expect(playerOf(after).stats.money).toBe(STARTING_MONEY - STARTING_RENT);
    expect(after.lastWeekEffects).toContainEqual({
      kind: "rent",
      amount: STARTING_RENT,
    });
    expect(after.week).toBe(5);
  });

  it("cuts next-week time when food runs out", () => {
    const after = unwrap(
      dispatch(
        createMatch({
          rngSeed: firstSeedFor("korek"),
          needs: { foodWeeks: 1, clothesWeeks: 3 },
        }),
        { type: "endWeek" },
      ),
    );
    expect(playerOf(after).needs.foodWeeks).toBe(0);
    expect(after.timeLeft).toBe(TIME_MAX - HUNGER_TIME_PENALTY - KOREK_TIME);
    expect(after.lastWeekEffects).toContainEqual({
      kind: "hunger",
      timeLost: HUNGER_TIME_PENALTY,
    });
  });

  it("drops happiness when clothes run out", () => {
    const after = unwrap(
      dispatch(
        createMatch({
          rngSeed: firstSeedFor("korek"),
          needs: { foodWeeks: 3, clothesWeeks: 1 },
        }),
        { type: "endWeek" },
      ),
    );
    expect(playerOf(after).needs.clothesWeeks).toBe(0);
    expect(playerOf(after).stats.happiness).toBe(
      STARTING_HAPPINESS - BARE_HAPPINESS_PENALTY,
    );
    expect(after.lastWeekEffects).toContainEqual({
      kind: "noClothes",
      happinessLost: BARE_HAPPINESS_PENALTY,
    });
  });

  it("counts a finished week on the job", () => {
    const after = unwrap(
      dispatch(
        createMatch({
          job: { id: "kebabKasjer", weeks: 0 },
          rngSeed: firstSeedFor("korek"),
          needs: { foodWeeks: 2, clothesWeeks: 3 },
        }),
        { type: "endWeek" },
      ),
    );
    expect(playerOf(after).job).toEqual({ id: "kebabKasjer", weeks: 1 });
  });

  it("raises next month's rent after the stancja bill", () => {
    const after = unwrap(
      dispatch(
        createMatch({
          week: 4,
          needs: { foodWeeks: 2, clothesWeeks: 3 },
        }),
        { type: "endWeek" },
      ),
    );
    expect(playerOf(after).home.rent).toBe(STARTING_RENT + 50);
    expect(after.lastWeekEffects).toContainEqual({
      kind: "rentHike",
      amount: STARTING_RENT + 50,
    });
  });

  it("rolls Żuczek prices with a stable seed", () => {
    const action = { type: "endWeek" } as const;
    const needs = { foodWeeks: 2, clothesWeeks: 3 };
    const first = unwrap(
      dispatch(createMatch({ rngSeed: 21, needs }), action),
    );
    const second = unwrap(
      dispatch(createMatch({ rngSeed: 21, needs }), action),
    );
    expect(first.market).toEqual(second.market);
  });
});

describe("career ladder", () => {
  it("blocks a cashier without the education threshold", () => {
    const result = dispatch(
      createMatch({
        locationId: "pup",
        job: { id: "kebabKasjer", weeks: 8 },
        stats: { education: 6 },
      }),
      { type: "act", id: "applyKierownik" },
    );
    expect(result).toEqual({
      ok: false,
      error: { code: "tooLittleEducation", needed: 18, have: 6 },
    });
  });

  it("blocks a cashier without tenure", () => {
    const result = dispatch(
      createMatch({
        locationId: "pup",
        job: { id: "kebabKasjer", weeks: 1 },
        stats: { education: 20 },
      }),
      { type: "act", id: "applyKierownik" },
    );
    expect(result).toEqual({
      ok: false,
      error: { code: "tooLittleTenure", needed: 4, have: 1 },
    });
  });

  it("promotes a qualified cashier", () => {
    const promoted = unwrap(
      dispatch(
        createMatch({
          locationId: "pup",
          job: { id: "kebabKasjer", weeks: 4 },
          stats: { education: 20, career: 10 },
        }),
        { type: "act", id: "applyKierownik" },
      ),
    );
    expect(playerOf(promoted).job).toEqual({ id: "kebabKierownik", weeks: 0 });
  });

  it("pays the manager wage on a kebab shift", () => {
    const shift = unwrap(
      dispatch(
        createMatch({
          locationId: "kebab",
          job: { id: "kebabKierownik", weeks: 0 },
        }),
        { type: "act", id: "workKebab" },
      ),
    );
    expect(playerOf(shift).stats.money).toBe(STARTING_MONEY + 420);
  });

  it("charges live Żuczek prices", () => {
    const after = unwrap(
      dispatch(
        createMatch({
          locationId: "shop",
          market: { food: 99, clothes: 120 },
        }),
        { type: "act", id: "buyFood" },
      ),
    );
    expect(playerOf(after).stats.money).toBe(STARTING_MONEY - 99);
  });

  it("refuses a local without the buy-in", () => {
    const result = dispatch(
      createMatch({
        locationId: "kebab",
        job: { id: "kebabKierownik", weeks: 4 },
        stats: { education: 40, money: 200 },
      }),
      { type: "act", id: "openLokal" },
    );
    expect(result).toEqual({
      ok: false,
      error: { code: "insufficientMoney", needed: 1800, have: 200 },
    });
  });
});
