import { describe, expect, it } from "vitest";
import { TIME_MAX } from "./catalog";
import { dispatch } from "./reducer";
import { createMatch } from "./state";
import {
  eventIds,
  firstSeedFor,
  KOREK_TIME,
  LOTTO_MONEY,
  pickEvent,
  PROMOCJA_FOOD,
} from "./events";
import {
  STARTING_MONEY,
  type EventId,
  type GameState,
} from "./types";
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

function seedFor(id: EventId): number {
  return firstSeedFor(id);
}

describe("events", () => {
  it("covers ten cards and picks the same one for a seed", () => {
    expect(eventIds).toHaveLength(10);
    const first = pickEvent(9);
    const second = pickEvent(9);
    expect(first.id).toBe(second.id);
    expect(eventIds).toContain(first.id);
  });

  it("can reach every card from some seed", () => {
    const seen = new Set<EventId>();
    for (let seed = 1; seed < 20_000; seed += 1) {
      seen.add(pickEvent(seed).id);
      if (seen.size === eventIds.length) {
        break;
      }
    }
    expect(seen.size).toBe(eventIds.length);
  });

  it("rolls a repeatable event at the end of the week", () => {
    const seed = seedFor("korek");
    const action = { type: "endWeek" } as const;
    const needs = { foodWeeks: 2, clothesWeeks: 3, suitWeeks: 0 };
    const first = unwrap(dispatch(createMatch({ rngSeed: seed, needs }), action));
    const second = unwrap(
      dispatch(createMatch({ rngSeed: seed, needs }), action),
    );
    expect(first.lastEvent).toBe("korek");
    expect(second.lastEvent).toBe("korek");
    expect(first.lastWeekEffects).toContainEqual({ kind: "event", id: "korek" });
  });

  it("cuts next-week time on a traffic jam", () => {
    const after = unwrap(
      dispatch(
        createMatch({
          rngSeed: seedFor("korek"),
          needs: { foodWeeks: 2, clothesWeeks: 3, suitWeeks: 0 },
        }),
        { type: "endWeek" },
      ),
    );
    expect(after.timeLeft).toBe(TIME_MAX - KOREK_TIME);
    expect(playerOf(after).stats.money).toBe(STARTING_MONEY);
  });

  it("pays a Kupon Szczęścia win", () => {
    const after = unwrap(
      dispatch(
        createMatch({
          rngSeed: seedFor("lotto"),
          needs: { foodWeeks: 2, clothesWeeks: 3, suitWeeks: 0 },
        }),
        { type: "endWeek" },
      ),
    );
    expect(after.lastEvent).toBe("lotto");
    expect(playerOf(after).stats.money).toBe(STARTING_MONEY + LOTTO_MONEY);
  });

  it("stocks a Żuczek promo after needs decay", () => {
    const after = unwrap(
      dispatch(
        createMatch({
          rngSeed: seedFor("promocja"),
          needs: { foodWeeks: 1, clothesWeeks: 3, suitWeeks: 0 },
        }),
        { type: "endWeek" },
      ),
    );
    expect(playerOf(after).needs.foodWeeks).toBe(PROMOCJA_FOOD);
    expect(after.timeLeft).toBe(TIME_MAX);
    expect(after.lastWeekEffects.some((effect) => effect.kind === "hunger")).toBe(
      false,
    );
  });

  it("still fires the safety net after a bill from the tax office", () => {
    const after = unwrap(
      dispatch(
        createMatch({
          rngSeed: seedFor("pit"),
          stats: { money: 0 },
          needs: { foodWeeks: 2, clothesWeeks: 3, suitWeeks: 0 },
        }),
        { type: "endWeek" },
      ),
    );
    expect(after.lastSafetyNet === "ciocia" || after.lastSafetyNet === "mops").toBe(
      true,
    );
    expect(playerOf(after).stats.money).toBeGreaterThan(0);
  });
});
