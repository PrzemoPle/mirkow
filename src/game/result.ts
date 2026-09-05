import type { LocationId } from "./catalog";
import type { GameState, Phase } from "./types";

export type EngineError =
  | { code: "wrongPhase"; phase: Phase }
  | { code: "insufficientTime"; needed: number; have: number }
  | { code: "alreadyThere" }
  | { code: "unknownLocation" }
  | { code: "noPath" }
  | { code: "noActivePlayer" }
  | { code: "wrongLocation"; here: LocationId; needed: LocationId }
  | { code: "noJob" }
  | { code: "alreadyThisJob" }
  | { code: "insufficientMoney"; needed: number; have: number }
  | { code: "missingDiploma"; diploma: import("./types").DiplomaId }
  | { code: "prerequisiteMissing"; diploma: import("./types").DiplomaId }
  | { code: "diplomaDone"; diploma: import("./types").DiplomaId }
  | { code: "notEnrolled" }
  | { code: "classesNotDone"; needed: number; have: number }
  | { code: "tooLittleExperience"; needed: number; have: number }
  | { code: "tooLittleReliability"; needed: number; have: number }
  | { code: "needsSuit" }
  | { code: "hiringFrozen" }
  | { code: "notKierownik" }
  | { code: "raiseTooSoon"; needed: number; have: number }
  | { code: "raiseMaxed" }
  | { code: "depositActive" }
  | { code: "sameHome" }
  | { code: "homeTooSmall"; slots: number; have: number }
  | { code: "noSlot"; slots: number }
  | { code: "alreadyOwned"; item: import("./types").ItemId }
  | { code: "notOwned"; item: import("./types").ItemId }
  | { code: "notBroken"; item: import("./types").ItemId }
  | { code: "insufficientAccount"; needed: number; have: number }
  | { code: "loanActive" }
  | { code: "loanTooBig"; limit: number }
  | { code: "noLoan" }
  | { code: "notEnoughShares"; have: number }
  | { code: "badAmount" };

export type EngineResult =
  | { ok: true; state: GameState }
  | { ok: false; error: EngineError };

export function ok(state: GameState): EngineResult {
  return { ok: true, state };
}

export function fail(error: EngineError): EngineResult {
  return { ok: false, error };
}
