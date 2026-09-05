import { locationIds, type LocationId } from "./catalog";

export const boardEdges: readonly (readonly [LocationId, LocationId, number])[] = [
  ["pup", "campus", 2],
  ["campus", "bank", 2],
  ["pup", "cafe", 1],
  ["cafe", "home", 1],
  ["home", "shop", 1],
  ["shop", "kebab", 1],
  ["kebab", "gym", 1],
  ["gym", "bank", 1],
  ["cafe", "shop", 2],
  ["campus", "gym", 2],
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

function costsFrom(start: LocationId): Record<LocationId, number> {
  const distance = locationRecord(() => Number.POSITIVE_INFINITY);
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
      }
    }
  }

  return distance;
}

const allCosts: Record<LocationId, Record<LocationId, number>> = locationRecord(
  (from) => costsFrom(from),
);

export function isLocationId(value: string): value is LocationId {
  return (locationIds as readonly string[]).includes(value);
}

export function travelCost(from: LocationId, to: LocationId): number | null {
  const row = allCosts[from];
  const cost = row[to];
  if (cost === undefined || cost === Number.POSITIVE_INFINITY) {
    return null;
  }
  return cost;
}
