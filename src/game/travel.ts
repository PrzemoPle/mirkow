import { travelCost } from "./board";
import type { LocationId } from "./catalog";
import { BIKE_TRAVEL_MIN, BIKE_TRAVEL_SAVED, hasWorking } from "./items";
import type { Player } from "./types";

/** Koszt drogi dla konkretnego gracza: rower skraca dłuższe trasy. */
export function playerTravelCost(player: Player, from: LocationId, to: LocationId): number | null {
  const base = travelCost(from, to);
  if (base === null) {
    return null;
  }
  if (base >= BIKE_TRAVEL_MIN && hasWorking(player, "rower")) {
    return base - BIKE_TRAVEL_SAVED;
  }
  return base;
}
