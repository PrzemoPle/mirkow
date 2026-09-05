import { describe, expect, it } from "vitest";
import { nextBotAction, playBotUntilIdle, playBotWithTrace } from "./bot";
import { dispatch } from "./reducer";
import { createSetup, createVersusMatch } from "./state";
import { TIME_MAX } from "./catalog";
import { STARTING_MONEY, type GameState } from "./types";
import type { EngineResult } from "./result";
import { DEFAULT_GOALS } from "./state";

function unwrap(result: EngineResult): GameState {
  if (!result.ok) {
    throw new Error(result.error.code);
  }
  return result.state;
}

function botOf(state: GameState) {
  const bot = state.players.find((player) => player.controller === "bot");
  if (bot === undefined) {
    throw new Error("missing bot");
  }
  return bot;
}

describe("bot Kowalski", () => {
  it("buys food before anything else", () => {
    const hungry = createVersusMatch({
      active: 1,
      botNeeds: { foodWeeks: 0, clothesWeeks: 2 },
      botLocationId: "home",
    });
    expect(nextBotAction(hungry)).toEqual({ type: "move", to: "shop" });

    const atShop = unwrap(dispatch(hungry, { type: "move", to: "shop" }));
    expect(nextBotAction(atShop)).toEqual({ type: "act", id: "buyFood" });
  });

  it("does not rest at the gym while starving", () => {
    const hungry = createVersusMatch({
      active: 1,
      botNeeds: { foodWeeks: 0, clothesWeeks: 2 },
      botLocationId: "gym",
    });
    expect(nextBotAction(hungry)).toEqual({ type: "move", to: "shop" });
  });

  it("does not walk into a job it cannot finish this week", () => {
    const short = createVersusMatch({
      active: 1,
      timeLeft: 3,
      botLocationId: "pup",
      botJob: { id: "kebabKasjer", weeks: 1 },
      botNeeds: { foodWeeks: 2, clothesWeeks: 2 },
      botStats: { money: 800, happiness: 20, education: 0, career: 4 },
    });
    expect(nextBotAction(short)).toEqual({ type: "move", to: "home" });
  });

  it("plays its week and returns control without staying active", () => {
    const afterHuman = unwrap(dispatch(createVersusMatch(), { type: "endWeek" }));
    expect(afterHuman.active).toBe(1);
    const afterBot = playBotUntilIdle(afterHuman);
    expect(afterBot.phase).toBe("playing");
    expect(afterBot.active).toBe(0);
    expect(afterBot.week).toBe(2);
  });

  it("gets a job and stays above 0 zł across three weeks", () => {
    let state = unwrap(
      dispatch(createSetup(3), {
        type: "start",
        name: "Ola",
        avatarId: "ola",
        goals: DEFAULT_GOALS,
        rngSeed: 3,
      }),
    );

    for (let round = 0; round < 3; round += 1) {
      state = unwrap(dispatch(state, { type: "endWeek" }));
      state = playBotUntilIdle(state);
    }

    const bot = botOf(state);
    expect(state.week).toBe(4);
    expect(state.active).toBe(0);
    expect(bot.job).not.toBeNull();
    expect(bot.stats.money).toBeGreaterThan(0);
    expect(bot.stats.money).not.toBe(STARTING_MONEY);
  });

  it("leaves the human time pool untouched on the first bot week", () => {
    const afterHuman = unwrap(
      dispatch(createVersusMatch({ timeLeft: 4 }), { type: "endWeek" }),
    );
    expect(afterHuman.timeLeft).toBe(TIME_MAX);
    expect(afterHuman.players[0]?.nextTimeLeft).toBeGreaterThan(0);
  });

  it("trace ends with endWeek and its last state equals playBotUntilIdle", () => {
    const start = createVersusMatch({ active: 1 });
    const trace = playBotWithTrace(start);
    expect(trace.steps.length).toBeGreaterThan(0);
    expect(trace.steps.at(-1)?.action).toEqual({ type: "endWeek" });
    expect(trace.state).toEqual(playBotUntilIdle(start));
    for (const step of trace.steps) {
      expect(step.state.version).toBe(1);
    }
  });
});
