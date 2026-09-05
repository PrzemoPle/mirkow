import { describe, expect, it } from "vitest";
import {
  DIPLOMA_DEFS,
  diplomaIds,
  educationPoints,
  EXAM_FEE,
  examChance,
  getDiplomaDef,
} from "./diplomas";
import { firstSeedFor } from "./events";
import { dispatch } from "./reducer";
import { enrollBlock, jobBlock } from "./selectors";
import { createMatch } from "./state";
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

function playerOf(state: GameState) {
  const player = state.players[state.active];
  if (player === undefined) {
    throw new Error("missing player");
  }
  return player;
}

/** Szuka ziarna, przy którym egzamin (po ustawieniu seeda) zdaje albo nie. */
function seedForExam(state: GameState, passed: boolean): number {
  for (let seed = 1; seed < 5000; seed += 1) {
    const result = dispatch({ ...state, rngSeed: seed }, { type: "act", id: "takeExam" });
    if (result.ok && playerOf(result.state).diplomas.length > 0 === passed) {
      return seed;
    }
  }
  throw new Error("no seed");
}

describe("dyplomy", () => {
  it("has seven diplomas worth 140 points with prerequisites", () => {
    expect(diplomaIds).toHaveLength(7);
    expect(educationPoints([...diplomaIds])).toBe(140);
    expect(getDiplomaDef("magister").prerequisiteAny).toContain("ekonomia");
    for (const def of Object.values(DIPLOMA_DEFS)) {
      expect(def.classes).toBeGreaterThan(0);
    }
  });

  it("enrolls only at the campus and only with the prerequisite", () => {
    const home = createMatch({ locationId: "home" });
    expect(errorOf(dispatch(home, { type: "enroll", diploma: "kurs" }))).toBe("wrongLocation");
    const campus = createMatch({ locationId: "campus" });
    expect(enrollBlock(campus, "ekonomia")).toEqual({ code: "prerequisiteMissing", diploma: "matura" });
    expect(enrollBlock(campus, "kurs")).toBeNull();
    const enrolled = unwrap(dispatch(campus, { type: "enroll", diploma: "kurs" }));
    expect(playerOf(enrolled).studying).toBe("kurs");
    expect(enrolled.timeLeft).toBe(campus.timeLeft);
    const graduate = createMatch({ locationId: "campus", diplomas: ["kurs"] });
    expect(enrollBlock(graduate, "kurs")?.code).toBe("diplomaDone");
    expect(playerOf(graduate).stats.education).toBe(10);
  });

  it("charges each class and logs the week", () => {
    const enrolled = createMatch({ locationId: "campus", studying: "kurs", week: 3 });
    const def = getDiplomaDef("kurs");
    const after = unwrap(dispatch(enrolled, { type: "act", id: "attendClass" }));
    expect(playerOf(after).studies.kurs).toEqual({ classes: 1, log: [3] });
    expect(playerOf(after).stats.money).toBe(800 - def.classCost);
    expect(after.timeLeft).toBe(enrolled.timeLeft - def.classTime);
  });

  it("refuses the exam before all classes and prices the chance by recency", () => {
    const half = createMatch({
      locationId: "campus",
      studying: "kurs",
      week: 5,
      studies: { kurs: { classes: 2, log: [1, 2] } },
    });
    expect(errorOf(dispatch(half, { type: "act", id: "takeExam" }))).toBe("classesNotDone");

    const stale = createMatch({ week: 20, studying: "kurs", studies: { kurs: { classes: 4, log: [1, 2, 3, 4] } } });
    expect(examChance(playerOf(stale), "kurs", 20)).toBeCloseTo(0.4);
    const fresh = createMatch({ week: 5, studying: "kurs", studies: { kurs: { classes: 4, log: [2, 3, 4, 5] } } });
    expect(examChance(playerOf(fresh), "kurs", 5)).toBeCloseTo(0.8);
    const cram = createMatch({ week: 5, studying: "kurs", studies: { kurs: { classes: 6, log: [2, 3, 4, 4, 5, 5] } } });
    expect(examChance(playerOf(cram), "kurs", 5)).toBe(1);
  });

  it("passing grants the diploma, points and a notice; failing costs the fee and happiness", () => {
    const ready = createMatch({
      locationId: "campus",
      studying: "kurs",
      week: 5,
      studies: { kurs: { classes: 4, log: [2, 3, 4, 5] } },
    });
    const passed = unwrap(dispatch({ ...ready, rngSeed: seedForExam(ready, true) }, { type: "act", id: "takeExam" }));
    expect(playerOf(passed).diplomas).toEqual(["kurs"]);
    expect(playerOf(passed).studying).toBeNull();
    expect(playerOf(passed).studies.kurs).toBeUndefined();
    expect(playerOf(passed).stats.education).toBe(10);
    expect(playerOf(passed).stats.happiness).toBe(25);
    expect(playerOf(passed).lastNotice).toBe("dyplom");
    expect(passed.lastWeekEffects).toContainEqual({ kind: "exam", diploma: "kurs", passed: true });

    const failed = unwrap(dispatch({ ...ready, rngSeed: seedForExam(ready, false) }, { type: "act", id: "takeExam" }));
    expect(playerOf(failed).diplomas).toEqual([]);
    expect(playerOf(failed).studying).toBe("kurs");
    expect(playerOf(failed).stats.money).toBe(800 - EXAM_FEE);
    expect(playerOf(failed).stats.happiness).toBe(17);
    expect(playerOf(failed).lastNotice).toBe("oblanyEgzamin");
  });

  it("gates jobs on diplomas instead of a number", () => {
    const base = { locationId: "pup" as const, experience: 40, reliability: 80, needs: { foodWeeks: 9, clothesWeeks: 9, suitWeeks: 6 } };
    expect(jobBlock(createMatch(base), "kebabKierownik")).toEqual({ code: "missingDiploma", diploma: "kurs" });
    expect(jobBlock(createMatch({ ...base, diplomas: ["kurs"] }), "kebabKierownik")).toBeNull();
    expect(jobBlock(createMatch({ ...base, diplomas: ["matura", "ekonomia"] }), "bankDyrektor")).toEqual({
      code: "missingDiploma",
      diploma: "magister",
    });
  });

  it("survives a save round-trip with studies", () => {
    const state = createMatch({
      studying: "matura",
      diplomas: ["kurs"],
      studies: { matura: { classes: 2, log: [1, 2] } },
      rngSeed: firstSeedFor("spokoj"),
    });
    const after = unwrap(dispatch(state, { type: "endWeek" }));
    expect(playerOf(after).studying).toBe("matura");
    expect(playerOf(after).diplomas).toEqual(["kurs"]);
  });
});
