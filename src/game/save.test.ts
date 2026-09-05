import { describe, expect, it } from "vitest";
import { dispatch } from "./reducer";
import {
  clearSave,
  loadSave,
  memoryStore,
  parseSave,
  SAVE_KEY,
  writeSave,
} from "./save";
import { createMatch, createSetup, createVersusMatch } from "./state";

describe("parseSave", () => {
  it("treats missing payload as empty", () => {
    expect(parseSave(null)).toEqual({ status: "empty" });
    expect(parseSave("")).toEqual({ status: "empty" });
  });

  it("rejects broken JSON and unknown versions", () => {
    expect(parseSave("{")).toEqual({ status: "corrupt" });
    expect(parseSave(JSON.stringify({ version: 5, state: createMatch() }))).toEqual({
      status: "corrupt",
    });
    expect(parseSave(JSON.stringify({ version: 1, state: createMatch() }))).toEqual({
      status: "outdated",
    });
  });

  it("round-trips a live match including seed and cash", () => {
    const match = createVersusMatch({
      rngSeed: 42,
      stats: { money: 610 },
      locationId: "shop",
      week: 3,
    });
    const store = memoryStore();
    expect(writeSave(store, match)).toBe("ok");
    const loaded = loadSave(store);
    expect(loaded).toEqual({ status: "ok", state: match });
    if (loaded.status !== "ok") {
      return;
    }
    expect(loaded.state.rngSeed).toBe(42);
    expect(loaded.state.players[0]?.stats.money).toBe(610);
    expect(loaded.state.players[0]?.locationId).toBe("shop");
    expect(loaded.state.week).toBe(3);
  });

  it("ignores a setup snapshot", () => {
    const store = memoryStore();
    expect(writeSave(store, createSetup())).toBe("ok");
    expect(loadSave(store)).toEqual({ status: "empty" });
  });

  it("rejects a playing match with no players", () => {
    const broken = { ...createMatch(), players: [] };
    expect(
      parseSave(JSON.stringify({ version: 4, state: broken })),
    ).toEqual({ status: "corrupt" });
  });
});

describe("writeSave", () => {
  it("clears the slot on request", () => {
    const match = createMatch();
    const store = memoryStore({
      [SAVE_KEY]: JSON.stringify({ version: 4, state: match }),
    });
    expect(clearSave(store)).toBe("ok");
    expect(loadSave(store)).toEqual({ status: "empty" });
  });

  it("returns failed when storage throws", () => {
    const store = memoryStore();
    const failing = {
      getItem: store.getItem,
      removeItem: store.removeItem,
      setItem() {
        throw new Error("quota");
      },
    };
    expect(writeSave(failing, createMatch())).toBe("failed");
  });

  it("keeps the same week after a saved move", () => {
    const started = dispatch(createSetup(4), {
      type: "start",
      name: "Ola",
      avatarId: "ola",
      goals: { money: 5000, happiness: 80, education: 60, career: 50 },
      rngSeed: 4,
    });
    if (!started.ok) {
      throw new Error(started.error.code);
    }
    const moved = dispatch(started.state, { type: "move", to: "shop" });
    if (!moved.ok) {
      throw new Error(moved.error.code);
    }
    const store = memoryStore();
    writeSave(store, moved.state);
    const loaded = loadSave(store);
    expect(loaded.status).toBe("ok");
    if (loaded.status !== "ok") {
      return;
    }
    expect(loaded.state.phase).toBe("playing");
    expect(loaded.state.players[0]?.locationId).toBe("shop");
    expect(loaded.state.timeLeft).toBe(moved.state.timeLeft);
    expect(loaded.state.rngSeed).toBe(moved.state.rngSeed);
  });
});
