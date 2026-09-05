import { travelCost } from "./board";
import type { LocationId } from "./catalog";
import type { GameState, Player } from "./types";

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
  return travelCost(player.locationId, to);
}
