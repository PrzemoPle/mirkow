import { describe, expect, it } from "vitest";
import { dispatch } from "./reducer";
import { createMatch, createSetup, createVersusMatch } from "./state";
import {
  AUNT_HELP,
  MOPS_HELP,
  REST_HAPPINESS,
  REST_TIME_COST,
  STARTING_HAPPINESS,
  STARTING_MONEY,
  type GameState,
} from "./types";
import { EVENT_DEFS, firstSeedFor } from "./events";
import type { EngineResult } from "./result";
import type { LocationId } from "./catalog";
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

describe("dispatch start", () => {
  it("opens a match at home with a full week of time", () => {
    const started = unwrap(
      dispatch(createSetup(9), {
        type: "start",
        name: "Ola",
        avatarId: "ola",
        goals: { money: 4000, happiness: 70, education: 40, career: 30 },
        rngSeed: 9,
      }),
    );

    expect(started.phase).toBe("playing");
    expect(started.week).toBe(1);
    expect(started.timeLeft).toBe(TIME_MAX);
    expect(started.players).toHaveLength(2);
    expect(playerOf(started).locationId).toBe("home");
    expect(playerOf(started).stats.money).toBe(STARTING_MONEY);
    expect(playerOf(started).job).toBeNull();
    expect(playerOf(started).controller).toBe("human");
    expect(started.players[1]?.name).toBe("Kowalski");
    expect(started.players[1]?.controller).toBe("bot");
    expect(started.players[1]?.stats).toEqual(playerOf(started).stats);
    expect(started.goals.career).toBe(30);
  });

  it("rejects start after the match has begun", () => {
    const result = dispatch(createMatch(), {
      type: "start",
      name: "Ola",
      avatarId: "ola",
      goals: { money: 100, happiness: 10, education: 10, career: 10 },
    });
    expect(result).toEqual({
      ok: false,
      error: { code: "wrongPhase", phase: "playing" },
    });
  });
});

describe("dispatch move", () => {
  it("spends travel time and leaves the original state untouched", () => {
    const before = createMatch();
    const snapshot = structuredClone(before);
    const after = unwrap(dispatch(before, { type: "move", to: "shop" }));

    expect(playerOf(after).locationId).toBe("shop");
    expect(after.timeLeft).toBe(TIME_MAX - 1);
    expect(before).toEqual(snapshot);
  });

  it("charges the shortest path to a distant building", () => {
    const after = unwrap(dispatch(createMatch(), { type: "move", to: "bank" }));
    expect(playerOf(after).locationId).toBe("bank");
    expect(after.timeLeft).toBe(TIME_MAX - 4);
  });

  it("blocks a move that costs more time than remains", () => {
    const state = createMatch({ timeLeft: 2 });
    const result = dispatch(state, { type: "move", to: "bank" });
    expect(result).toEqual({
      ok: false,
      error: { code: "insufficientTime", needed: 4, have: 2 },
    });
    expect(playerOf(state).locationId).toBe("home");
    expect(state.timeLeft).toBe(2);
  });

  it("blocks a move to the current tile", () => {
    const result = dispatch(createMatch(), { type: "move", to: "home" });
    expect(result).toEqual({ ok: false, error: { code: "alreadyThere" } });
  });

  it("rejects an unknown location at runtime", () => {
    const result = dispatch(createMatch(), {
      type: "move",
      to: "moon" as LocationId,
    });
    expect(result).toEqual({ ok: false, error: { code: "unknownLocation" } });
  });
});

describe("dispatch act", () => {
  it("rest spends time and raises happiness", () => {
    const after = unwrap(dispatch(createMatch(), { type: "act", id: "restHome" }));
    expect(after.timeLeft).toBe(TIME_MAX - REST_TIME_COST);
    expect(playerOf(after).stats.happiness).toBe(STARTING_HAPPINESS + REST_HAPPINESS);
  });

  it("blocks rest when the week is out of time", () => {
    const state = createMatch({ timeLeft: 0 });
    const result = dispatch(state, { type: "act", id: "restHome" });
    expect(result).toEqual({
      ok: false,
      error: { code: "insufficientTime", needed: REST_TIME_COST, have: 0 },
    });
    expect(playerOf(state).stats.happiness).toBe(STARTING_HAPPINESS);
  });
});

describe("dispatch endWeek", () => {
  it("refills time and advances the week", () => {
    const after = unwrap(
      dispatch(
        createMatch({
          timeLeft: 3,
          needs: { foodWeeks: 2, clothesWeeks: 3, suitWeeks: 0 },
        }),
        { type: "endWeek" },
      ),
    );
    expect(after.week).toBe(2);
    expect(after.lastEvent).not.toBeNull();
    const lost =
      after.lastEvent === null ? 0 : EVENT_DEFS[after.lastEvent].timeLost;
    expect(after.timeLeft).toBe(TIME_MAX - lost);
    expect(after.phase).toBe("playing");
  });

  it("applies a safety net instead of ending the match at 0 zł", () => {
    const after = unwrap(
      dispatch(
        createMatch({
          stats: { money: 0 },
          rngSeed: firstSeedFor("korek"),
          needs: { foodWeeks: 2, clothesWeeks: 3, suitWeeks: 0 },
        }),
        {
          type: "endWeek",
        },
      ),
    );

    expect(after.phase).toBe("playing");
    expect(playerOf(after).stats.money).toBeGreaterThan(0);
    expect([AUNT_HELP, MOPS_HELP]).toContain(playerOf(after).stats.money);
    expect(after.lastSafetyNet === "ciocia" || after.lastSafetyNet === "mops").toBe(
      true,
    );
  });

  it("picks the same grant for the same seed", () => {
    const action = { type: "endWeek" } as const;
    const setup = {
      stats: { money: 0 },
      rngSeed: firstSeedFor("korek"),
      needs: { foodWeeks: 2, clothesWeeks: 3, suitWeeks: 0 },
    };
    const first = unwrap(dispatch(createMatch(setup), action));
    const second = unwrap(dispatch(createMatch(setup), action));
    expect(first.lastSafetyNet).toBe(second.lastSafetyNet);
    expect(playerOf(first).stats.money).toBe(playerOf(second).stats.money);
  });
});

describe("victory", () => {
  it("requires all four thresholds at once", () => {
    const after = unwrap(
      dispatch(
        createMatch({
          goals: { money: 10, happiness: 10, education: 10, career: 10 },
          stats: { money: 10, happiness: 10, education: 10, career: 9 },
        }),
        { type: "endWeek" },
      ),
    );
    expect(after.phase).toBe("playing");
  });

  it("flags victory as soon as the last threshold is met", () => {
    const after = unwrap(
      dispatch(
        createMatch({
          goals: { money: 10, happiness: 10, education: 10, career: 10 },
          stats: { money: 10, happiness: 8, education: 10, career: 10 },
        }),
        { type: "act", id: "restHome" },
      ),
    );
    expect(after.phase).toBe("victory");
    expect(playerOf(after).stats.happiness).toBe(8 + REST_HAPPINESS);
  });

  it("rejects further moves after victory", () => {
    const won = unwrap(
      dispatch(
        createMatch({
          goals: { money: 10, happiness: 10, education: 10, career: 10 },
          stats: { money: 10, happiness: 10, education: 10, career: 10 },
          rngSeed: firstSeedFor("korek"),
          needs: { foodWeeks: 2, clothesWeeks: 3, suitWeeks: 0 },
        }),
        { type: "endWeek" },
      ),
    );
    expect(won.phase).toBe("victory");
    expect(dispatch(won, { type: "move", to: "shop" })).toEqual({
      ok: false,
      error: { code: "wrongPhase", phase: "victory" },
    });
  });
});

describe("versus turns", () => {
  it("keeps the calendar week until both players have ended", () => {
    const afterHuman = unwrap(dispatch(createVersusMatch(), { type: "endWeek" }));
    expect(afterHuman.week).toBe(1);
    expect(afterHuman.active).toBe(1);
    expect(playerOf(afterHuman).controller).toBe("bot");
    expect(afterHuman.timeLeft).toBe(TIME_MAX);

    const afterBot = unwrap(dispatch(afterHuman, { type: "endWeek" }));
    expect(afterBot.week).toBe(2);
    expect(afterBot.active).toBe(0);
    expect(playerOf(afterBot).controller).toBe("human");
  });
});
