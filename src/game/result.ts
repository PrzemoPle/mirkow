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
  | { code: "alreadyEmployed" }
  | { code: "insufficientMoney"; needed: number; have: number }
  | { code: "tooLittleEducation"; needed: number; have: number }
  | { code: "tooLittleTenure"; needed: number; have: number }
  | { code: "depositActive" };

export type EngineResult =
  | { ok: true; state: GameState }
  | { ok: false; error: EngineError };

export function ok(state: GameState): EngineResult {
  return { ok: true, state };
}

export function fail(error: EngineError): EngineResult {
  return { ok: false, error };
}
