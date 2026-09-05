import { allAvatarIds } from "./avatars";
import { locationIds, TIME_MAX } from "./catalog";
import { eventIds } from "./events";
import { JOB_DEFS } from "./jobs";
import type {
  Deposit,
  EventId,
  GameState,
  Job,
  JobId,
  Player,
  SafetyNetKind,
  Stats,
  WeekEffect,
} from "./types";

export const SAVE_KEY = "mirkow.save.v1";
export const SAVE_FORMAT = 1;

export type SaveStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type LoadResult =
  | { status: "empty" }
  | { status: "ok"; state: GameState }
  | { status: "corrupt" };

export type SaveResult = "ok" | "failed";

const jobIds = Object.keys(JOB_DEFS) as JobId[];
const phases = ["setup", "playing", "victory"] as const;
const controllers = ["human", "bot"] as const;
const safetyNets = ["ciocia", "mops"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isMember<T extends string>(
  value: unknown,
  list: readonly T[],
): value is T {
  return typeof value === "string" && (list as readonly string[]).includes(value);
}

function parseStats(value: unknown): Stats | null {
  if (!isRecord(value)) {
    return null;
  }
  if (
    !isFiniteNumber(value.money) ||
    !isFiniteNumber(value.happiness) ||
    !isFiniteNumber(value.education) ||
    !isFiniteNumber(value.career)
  ) {
    return null;
  }
  return {
    money: value.money,
    happiness: value.happiness,
    education: value.education,
    career: value.career,
  };
}

function parseJob(value: unknown): Job | null | undefined {
  if (value === null) {
    return null;
  }
  if (!isRecord(value) || !isMember(value.id, jobIds) || !isFiniteNumber(value.weeks)) {
    return undefined;
  }
  return { id: value.id, weeks: value.weeks };
}

function parseEventId(value: unknown): EventId | null | undefined {
  if (value === null) {
    return null;
  }
  if (!isMember(value, eventIds)) {
    return undefined;
  }
  return value;
}

function parseWeekEffect(value: unknown): WeekEffect | null {
  if (!isRecord(value) || typeof value.kind !== "string") {
    return null;
  }
  switch (value.kind) {
    case "rent":
      return isFiniteNumber(value.amount) ? { kind: "rent", amount: value.amount } : null;
    case "rentHike":
      return isFiniteNumber(value.amount)
        ? { kind: "rentHike", amount: value.amount }
        : null;
    case "hunger":
      return isFiniteNumber(value.timeLost)
        ? { kind: "hunger", timeLost: value.timeLost }
        : null;
    case "noClothes":
      return isFiniteNumber(value.happinessLost)
        ? { kind: "noClothes", happinessLost: value.happinessLost }
        : null;
    case "shopPrices":
      return isFiniteNumber(value.food) && isFiniteNumber(value.clothes)
        ? { kind: "shopPrices", food: value.food, clothes: value.clothes }
        : null;
    case "event": {
      const id = parseEventId(value.id);
      return id === undefined || id === null ? null : { kind: "event", id };
    }
    case "safetyNet":
      return isMember(value.grant, safetyNets) && isFiniteNumber(value.amount)
        ? { kind: "safetyNet", grant: value.grant, amount: value.amount }
        : null;
    case "deposit":
      return isFiniteNumber(value.amount) ? { kind: "deposit", amount: value.amount } : null;
    default:
      return null;
  }
}

/** Brak pola (starszy zapis) i null znaczą to samo: bez lokaty. Śmieci odrzucamy. */
function parseDeposit(value: unknown): Deposit | null | undefined {
  if (value === undefined || value === null) {
    return null;
  }
  if (
    !isRecord(value) ||
    !isFiniteNumber(value.amount) ||
    !isFiniteNumber(value.payout) ||
    !isFiniteNumber(value.weeksLeft)
  ) {
    return undefined;
  }
  return { amount: value.amount, payout: value.payout, weeksLeft: value.weeksLeft };
}

function parsePlayer(value: unknown): Player | null {
  if (!isRecord(value)) {
    return null;
  }
  if (typeof value.id !== "string" || typeof value.name !== "string") {
    return null;
  }
  if (!isMember(value.avatarId, allAvatarIds) || !isMember(value.controller, controllers)) {
    return null;
  }
  if (!isMember(value.locationId, locationIds)) {
    return null;
  }
  const stats = parseStats(value.stats);
  const job = parseJob(value.job);
  const lastEvent = parseEventId(value.lastEvent);
  if (stats === null || job === undefined || lastEvent === undefined) {
    return null;
  }
  if (!isRecord(value.home) || value.home.id !== "stancja" || !isFiniteNumber(value.home.rent)) {
    return null;
  }
  if (
    !isRecord(value.needs) ||
    !isFiniteNumber(value.needs.foodWeeks) ||
    !isFiniteNumber(value.needs.clothesWeeks)
  ) {
    return null;
  }
  if (!isFiniteNumber(value.nextTimeLeft)) {
    return null;
  }
  const deposit = parseDeposit(value.deposit);
  if (deposit === undefined) {
    return null;
  }
  return {
    id: value.id,
    name: value.name,
    avatarId: value.avatarId,
    controller: value.controller,
    locationId: value.locationId,
    stats,
    job,
    home: { id: "stancja", rent: value.home.rent },
    needs: {
      foodWeeks: value.needs.foodWeeks,
      clothesWeeks: value.needs.clothesWeeks,
    },
    nextTimeLeft: value.nextTimeLeft,
    lastEvent,
    deposit,
  };
}

export function parseGameState(value: unknown): GameState | null {
  if (!isRecord(value) || value.version !== 1) {
    return null;
  }
  if (!isMember(value.phase, phases)) {
    return null;
  }
  if (
    !isFiniteNumber(value.week) ||
    !isFiniteNumber(value.timeLeft) ||
    value.timeMax !== TIME_MAX ||
    !isFiniteNumber(value.active) ||
    !isFiniteNumber(value.rngSeed)
  ) {
    return null;
  }
  const goals = parseStats(value.goals);
  if (goals === null) {
    return null;
  }
  if (!Array.isArray(value.players)) {
    return null;
  }
  const players: Player[] = [];
  for (const entry of value.players) {
    const player = parsePlayer(entry);
    if (player === null) {
      return null;
    }
    players.push(player);
  }
  if (
    (value.phase === "playing" || value.phase === "victory") &&
    (players.length === 0 || value.active < 0 || value.active >= players.length)
  ) {
    return null;
  }
  const lastEvent = parseEventId(value.lastEvent);
  if (lastEvent === undefined) {
    return null;
  }
  let lastSafetyNet: SafetyNetKind | null = null;
  if (value.lastSafetyNet === null) {
    lastSafetyNet = null;
  } else if (isMember(value.lastSafetyNet, safetyNets)) {
    lastSafetyNet = value.lastSafetyNet;
  } else {
    return null;
  }
  if (!Array.isArray(value.lastWeekEffects)) {
    return null;
  }
  const effects: WeekEffect[] = [];
  for (const entry of value.lastWeekEffects) {
    const effect = parseWeekEffect(entry);
    if (effect === null) {
      return null;
    }
    effects.push(effect);
  }
  if (
    !isRecord(value.market) ||
    !isFiniteNumber(value.market.food) ||
    !isFiniteNumber(value.market.clothes)
  ) {
    return null;
  }
  return {
    version: 1,
    phase: value.phase,
    week: value.week,
    timeLeft: value.timeLeft,
    timeMax: TIME_MAX,
    goals,
    players,
    active: value.active,
    rngSeed: value.rngSeed,
    lastSafetyNet,
    lastEvent,
    lastWeekEffects: effects,
    market: { food: value.market.food, clothes: value.market.clothes },
  };
}

export function parseSave(raw: string | null): LoadResult {
  if (raw === null || raw === "") {
    return { status: "empty" };
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== SAVE_FORMAT) {
      return { status: "corrupt" };
    }
    const state = parseGameState(parsed.state);
    if (state === null) {
      return { status: "corrupt" };
    }
    if (state.phase === "setup") {
      return { status: "empty" };
    }
    return { status: "ok", state };
  } catch {
    return { status: "corrupt" };
  }
}

export function memoryStore(initial: Record<string, string> = {}): SaveStore {
  const data = { ...initial };
  return {
    getItem(key) {
      return Object.hasOwn(data, key) ? data[key] ?? null : null;
    },
    setItem(key, value) {
      data[key] = value;
    },
    removeItem(key) {
      delete data[key];
    },
  };
}

export function loadSave(store: SaveStore): LoadResult {
  try {
    return parseSave(store.getItem(SAVE_KEY));
  } catch {
    return { status: "corrupt" };
  }
}

export function writeSave(store: SaveStore, state: GameState): SaveResult {
  if (state.phase === "setup") {
    return clearSave(store);
  }
  try {
    store.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_FORMAT, state }));
    return "ok";
  } catch {
    return "failed";
  }
}

export function clearSave(store: SaveStore): SaveResult {
  try {
    store.removeItem(SAVE_KEY);
    return "ok";
  } catch {
    return "failed";
  }
}
