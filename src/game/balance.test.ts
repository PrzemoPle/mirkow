import { describe, expect, it } from "vitest";
import { playBotUntilIdle } from "./bot";
import { EVENT_WEIGHTS, eventIds, pickEvent } from "./events";
import { createVersusMatch, DEFAULT_GOALS } from "./state";
import type { GameState, Stats } from "./types";

const WEEK_CAP = 120;

/** Obaj gracze grają heurystyką bota: miara tempa partii bez człowieka. */
function botVersusBot(goals: Stats, seed: number): GameState {
  const base = createVersusMatch({ goals, rngSeed: seed });
  let state: GameState = {
    ...base,
    players: base.players.map((player) => ({ ...player, controller: "bot" as const })),
  };
  while (state.phase === "playing" && state.week <= WEEK_CAP) {
    state = playBotUntilIdle(state);
  }
  return state;
}

describe("balans", () => {
  it("normal preset ends between 20 and 80 weeks for a bot", () => {
    for (const seed of [1, 7, 42, 1234]) {
      const end = botVersusBot(DEFAULT_GOALS, seed);
      expect(end.phase).toBe("victory");
      expect(end.week).toBeGreaterThanOrEqual(20);
      expect(end.week).toBeLessThanOrEqual(80);
    }
  });

  it("short preset is faster than long preset", () => {
    const short = botVersusBot({ money: 3000, happiness: 50, education: 40, career: 30 }, 3);
    const long = botVersusBot({ money: 9000, happiness: 95, education: 85, career: 80 }, 3);
    expect(short.phase).toBe("victory");
    expect(long.week).toBeGreaterThan(short.week);
  });

  it("weighted events: roughly half of the draws are not a loss", () => {
    const kind: Record<string, number> = {};
    const draws = 5000;
    let seed = 11;
    for (let index = 0; index < draws; index += 1) {
      const picked = pickEvent(seed);
      seed = picked.seed;
      kind[picked.id] = (kind[picked.id] ?? 0) + 1;
    }
    const total = eventIds.reduce((sum, id) => sum + EVENT_WEIGHTS[id], 0);
    const gentle = ((kind.spokoj ?? 0) + (kind.napiwki ?? 0) + (kind.lotto ?? 0) + (kind.promocja ?? 0)) / draws;
    const expected = (EVENT_WEIGHTS.spokoj + EVENT_WEIGHTS.napiwki + EVENT_WEIGHTS.lotto + EVENT_WEIGHTS.promocja) / total;
    expect(Math.abs(gentle - expected)).toBeLessThan(0.04);
    expect(expected).toBeGreaterThan(0.45);
  });
});
