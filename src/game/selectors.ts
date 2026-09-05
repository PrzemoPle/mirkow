import { playerTravelCost } from "./travel";
import { dispatch } from "./reducer";
import type { EngineError } from "./result";
import type { LocationId } from "./catalog";
import type { ActionId, DiplomaId, GameAction, GameState, HomeId, ItemId, JobId, Player } from "./types";

export function getActivePlayer(state: GameState): Player | undefined {
  return state.players[state.active];
}

export function getHumanPlayer(state: GameState): Player | undefined {
  return state.players.find((player) => player.controller === "human");
}

export function getBotPlayer(state: GameState): Player | undefined {
  return state.players.find((player) => player.controller === "bot");
}

export function isHumanTurn(state: GameState): boolean {
  if (state.phase !== "playing") {
    return false;
  }
  const player = getActivePlayer(state);
  return player !== undefined && player.controller === "human";
}

export function costToLocation(
  state: GameState,
  to: LocationId,
): number | null {
  const player = getActivePlayer(state);
  if (player === undefined) {
    return null;
  }
  return playerTravelCost(player, player.locationId, to);
}

/** Dry-runs an action for the active player; null means it can be taken now. */
export function actionBlock(state: GameState, id: ActionId): EngineError | null {
  const result = dispatch(state, { type: "act", id });
  return result.ok ? null : result.error;
}

/** Dry-run podania o pracę; null = można złożyć teraz (będąc w PUP). */
export function jobBlock(state: GameState, job: JobId): EngineError | null {
  const result = dispatch(state, { type: "apply", job });
  return result.ok ? null : result.error;
}

export function raiseBlock(state: GameState): EngineError | null {
  const result = dispatch(state, { type: "askRaise" });
  return result.ok ? null : result.error;
}

/** Dry-run zapisu na dyplom (będąc w WSMiK). */
export function enrollBlock(state: GameState, diploma: DiplomaId): EngineError | null {
  const result = dispatch(state, { type: "enroll", diploma });
  return result.ok ? null : result.error;
}

export function relocateBlock(state: GameState, home: HomeId): EngineError | null {
  const result = dispatch(state, { type: "relocate", home });
  return result.ok ? null : result.error;
}

export function buyItemBlock(state: GameState, item: ItemId, used: boolean): EngineError | null {
  const result = dispatch(state, { type: "buyItem", item, used });
  return result.ok ? null : result.error;
}

export function sellItemBlock(state: GameState, item: ItemId): EngineError | null {
  const result = dispatch(state, { type: "sellItem", item });
  return result.ok ? null : result.error;
}

export function repairItemBlock(state: GameState, item: ItemId): EngineError | null {
  const result = dispatch(state, { type: "repairItem", item });
  return result.ok ? null : result.error;
}

/** Dry-run dowolnej akcji (konto, kredyt, akcje). */
export function actionBlockFor(state: GameState, action: GameAction): EngineError | null {
  const result = dispatch(state, action);
  return result.ok ? null : result.error;
}
