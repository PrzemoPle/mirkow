import { describe, expect, it } from "vitest";
import { firstSeedFor } from "./events";
import { FIRE_MARGIN, getJobDef, JOB_DEFS, jobsByCompany, RAISE_TENURE_BONUS, RELIABILITY_DECAY } from "./jobs";
import { dispatch } from "./reducer";
import { jobBlock, raiseBlock } from "./selectors";
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

const quiet = { foodWeeks: 9, clothesWeeks: 9, suitWeeks: 0 };

describe("stanowiska", () => {
  it("has 15 openings across five companies, sorted by prestige", () => {
    const groups = jobsByCompany();
    expect(groups.size).toBe(5);
    let total = 0;
    for (const defs of groups.values()) {
      for (let index = 1; index < defs.length; index += 1) {
        expect(defs[index]!.prestige).toBeGreaterThan(defs[index - 1]!.prestige);
      }
      total += defs.length;
    }
    expect(total).toBe(15);
    expect(Object.keys(JOB_DEFS)).toHaveLength(16);
  });

  it("hires anyone as kitchen help at the PUP and sets career to the job's prestige", () => {
    const pup = createMatch({ locationId: "pup" });
    const hired = unwrap(dispatch(pup, { type: "apply", job: "kebabPomoc" }));
    expect(playerOf(hired).job).toEqual({ id: "kebabPomoc", weeks: 0, raises: 0 });
    expect(playerOf(hired).stats.career).toBe(getJobDef("kebabPomoc").prestige);
    expect(hired.timeLeft).toBe(10);
  });

  it("explains every missing requirement", () => {
    const pup = createMatch({ locationId: "pup" });
    expect(jobBlock(pup, "kebabKasjer")?.code).toBe("tooLittleExperience");
    const seasoned = createMatch({ locationId: "pup", experience: 10, reliability: 5 });
    expect(jobBlock(seasoned, "kebabKasjer")?.code).toBe("tooLittleReliability");
    const reliable = createMatch({ locationId: "pup", experience: 20, reliability: 60 });
    expect(jobBlock(reliable, "kebabKierownik")?.code).toBe("tooLittleEducation");
    const educated = createMatch({ locationId: "pup", experience: 20, reliability: 60, stats: { education: 30 } });
    expect(jobBlock(educated, "bankKasjer")?.code).toBe("needsSuit");
    const suited = createMatch({
      locationId: "pup",
      experience: 20,
      reliability: 60,
      stats: { education: 30 },
      needs: { ...quiet, suitWeeks: 4 },
    });
    expect(jobBlock(suited, "bankKasjer")).toBeNull();
    expect(jobBlock(suited, "kebabLokal")?.code).toBe("notKierownik");
  });

  it("refuses the same job twice and a frozen company", () => {
    const employed = createMatch({ locationId: "pup", job: { id: "kebabPomoc", weeks: 1, raises: 0 } });
    expect(errorOf(dispatch(employed, { type: "apply", job: "kebabPomoc" }))).toBe("alreadyThisJob");
    const frozen = createMatch({ locationId: "pup", economy: { phase: "recession", hiringFrozen: "kebab" } });
    expect(errorOf(dispatch(frozen, { type: "apply", job: "kebabPomoc" }))).toBe("hiringFrozen");
    expect(dispatch(frozen, { type: "apply", job: "shopPolki" }).ok).toBe(true);
  });

  it("marks a promotion with a notice and lets you step down without one", () => {
    const cashier = createMatch({
      locationId: "pup",
      job: { id: "kebabPomoc", weeks: 5, raises: 0 },
      experience: 6,
      reliability: 30,
    });
    const promoted = unwrap(dispatch(cashier, { type: "apply", job: "kebabKasjer" }));
    expect(playerOf(promoted).lastNotice).toBe("awans");
    const down = unwrap(dispatch(promoted, { type: "apply", job: "kebabPomoc" }));
    expect(playerOf(down).lastNotice).toBe("awans");
    expect(playerOf(down).stats.career).toBe(getJobDef("kebabPomoc").prestige);
  });
});

describe("solidność i zwolnienie", () => {
  it("decays every week and fires below the margin", () => {
    const def = getJobDef("kebabKasjer");
    const edge = def.requiredReliability - FIRE_MARGIN + RELIABILITY_DECAY - 1;
    const state = createMatch({
      job: { id: "kebabKasjer", weeks: 3, raises: 0 },
      reliability: edge,
      needs: quiet,
      rngSeed: firstSeedFor("spokoj"),
      stats: { career: def.prestige },
    });
    const after = unwrap(dispatch(state, { type: "endWeek" }));
    expect(playerOf(after).job).toBeNull();
    expect(playerOf(after).stats.career).toBe(0);
    expect(playerOf(after).lastNotice).toBe("zwolnienie");
    expect(after.lastWeekEffects).toContainEqual({ kind: "fired", job: "kebabKasjer", reason: "reliability" });
  });

  it("keeps the job one point above the margin", () => {
    const def = getJobDef("kebabKasjer");
    const state = createMatch({
      job: { id: "kebabKasjer", weeks: 3, raises: 0 },
      reliability: def.requiredReliability - FIRE_MARGIN + RELIABILITY_DECAY,
      needs: quiet,
      rngSeed: firstSeedFor("spokoj"),
    });
    const after = unwrap(dispatch(state, { type: "endWeek" }));
    expect(playerOf(after).job?.id).toBe("kebabKasjer");
    expect(playerOf(after).reliability).toBe(def.requiredReliability - FIRE_MARGIN);
  });

  it("never drops reliability below zero", () => {
    const after = unwrap(
      dispatch(createMatch({ reliability: 1, needs: quiet, rngSeed: firstSeedFor("spokoj") }), { type: "endWeek" }),
    );
    expect(playerOf(after).reliability).toBe(0);
  });
});

describe("podwyżka", () => {
  it("needs tenure and reliability, then adds ten percent up to twice", () => {
    const def = getJobDef("kebabKasjer");
    const fresh = createMatch({
      locationId: "pup",
      job: { id: "kebabKasjer", weeks: 2, raises: 0 },
      reliability: def.requiredReliability + 20,
    });
    expect(raiseBlock(fresh)?.code).toBe("raiseTooSoon");
    const tenured = createMatch({
      locationId: "pup",
      job: { id: "kebabKasjer", weeks: RAISE_TENURE_BONUS, raises: 0 },
      reliability: def.requiredReliability + 20,
    });
    expect(raiseBlock(tenured)).toBeNull();
    const raised = unwrap(dispatch(tenured, { type: "askRaise" }));
    expect(playerOf(raised).job?.raises).toBe(1);
    expect(playerOf(raised).lastNotice).toBe("podwyzka");
    const maxed = createMatch({
      locationId: "pup",
      job: { id: "kebabKasjer", weeks: 40, raises: 2 },
      reliability: 90,
    });
    expect(raiseBlock(maxed)?.code).toBe("raiseMaxed");
    const unreliable = createMatch({
      locationId: "pup",
      job: { id: "kebabKasjer", weeks: 40, raises: 0 },
      reliability: def.requiredReliability + 2,
    });
    expect(raiseBlock(unreliable)?.code).toBe("tooLittleReliability");
  });
});

describe("własny lokal", () => {
  it("opens only for a manager with the buy-in and sets prestige 70", () => {
    const manager = createMatch({
      locationId: "kebab",
      job: { id: "kebabKierownik", weeks: 6, raises: 0 },
      experience: 20,
      reliability: 60,
      stats: { money: 3000, education: 20 },
    });
    const owner = unwrap(dispatch(manager, { type: "act", id: "openLokal" }));
    expect(playerOf(owner).job?.id).toBe("kebabLokal");
    expect(playerOf(owner).stats.career).toBe(70);
    expect(playerOf(owner).stats.money).toBe(3000 - 1800);
    const poor = createMatch({
      locationId: "kebab",
      job: { id: "kebabKierownik", weeks: 6, raises: 0 },
      experience: 20,
      reliability: 60,
      stats: { money: 500, education: 20 },
    });
    expect(errorOf(dispatch(poor, { type: "act", id: "openLokal" }))).toBe("insufficientMoney");
  });
});
