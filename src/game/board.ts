import { locationIds, type LocationId } from "./catalog";

export const boardEdges: readonly (readonly [LocationId, LocationId, number])[] = [
  ["pup", "campus", 2],
  ["campus", "bank", 2],
  ["bank", "zajezdnia", 1],
  ["pup", "cafe", 1],
  ["cafe", "home", 1],
  ["home", "shop", 1],
  ["shop", "lombard", 1],
  ["lombard", "kebab", 1],
  ["kebab", "gym", 1],
  ["gym", "zajezdnia", 1],
  ["bank", "elektro", 1],
  ["elektro", "gym", 1],
  ["elektro", "lombard", 1],
  ["cafe", "shop", 2],
  ["campus", "elektro", 2],
  ["campus", "shop", 2],
];

type Neighbor = { to: LocationId; cost: number };

function locationRecord<T>(make: (id: LocationId) => T): Record<LocationId, T> {
  const record = {} as Record<LocationId, T>;
  for (const id of locationIds) {
    record[id] = make(id);
  }
  return record;
}

function createAdjacency(): Record<LocationId, Neighbor[]> {
  const adjacency = locationRecord<Neighbor[]>(() => []);

  for (const [from, to, cost] of boardEdges) {
    const fromList = adjacency[from];
    const toList = adjacency[to];
    fromList.push({ to, cost });
    toList.push({ to: from, cost });
  }

  return adjacency;
}

const adjacency = createAdjacency();

type Route = {
  distance: Record<LocationId, number>;
  previous: Record<LocationId, LocationId | null>;
};

function routesFrom(start: LocationId): Route {
  const distance = locationRecord(() => Number.POSITIVE_INFINITY);
  const previous = locationRecord<LocationId | null>(() => null);
  distance[start] = 0;
  const pending: LocationId[] = [...locationIds];

  while (pending.length > 0) {
    let closestIndex = 0;
    const firstId = pending[0];
    if (firstId === undefined) {
      break;
    }

    let closestId = firstId;
    let closestDistance = distance[closestId];

    for (let index = 1; index < pending.length; index += 1) {
      const candidateId = pending[index];
      if (candidateId === undefined) {
        continue;
      }
      const candidateDistance = distance[candidateId];
      if (candidateDistance < closestDistance) {
        closestIndex = index;
        closestId = candidateId;
        closestDistance = candidateDistance;
      }
    }

    pending.splice(closestIndex, 1);

    if (closestDistance === Number.POSITIVE_INFINITY) {
      break;
    }

    for (const neighbor of adjacency[closestId]) {
      const nextDistance = closestDistance + neighbor.cost;
      if (nextDistance < distance[neighbor.to]) {
        distance[neighbor.to] = nextDistance;
        previous[neighbor.to] = closestId;
      }
    }
  }

  return { distance, previous };
}

const allRoutes: Record<LocationId, Route> = locationRecord((from) =>
  routesFrom(from),
);

export function isLocationId(value: string): value is LocationId {
  return (locationIds as readonly string[]).includes(value);
}

export function travelCost(from: LocationId, to: LocationId): number | null {
  const cost = allRoutes[from].distance[to];
  if (cost === undefined || cost === Number.POSITIVE_INFINITY) {
    return null;
  }
  return cost;
}

/** Cheapest route as a list of nodes, starting with `from` and ending with `to`. */
export function travelPath(
  from: LocationId,
  to: LocationId,
): readonly LocationId[] | null {
  if (travelCost(from, to) === null) {
    return null;
  }
  const route = allRoutes[from];
  const path: LocationId[] = [to];
  let cursor: LocationId | null = to;
  while (cursor !== null && cursor !== from) {
    cursor = route.previous[cursor];
    if (cursor !== null) {
      path.push(cursor);
    }
  }
  return path.reverse();
}
