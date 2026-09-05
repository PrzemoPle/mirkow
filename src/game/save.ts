import { allAvatarIds } from "./avatars";
import { locationIds, TIME_MAX } from "./catalog";
import { eventIds } from "./events";
import { companyIds, JOB_DEFS } from "./jobs";
import type {
  CompanyId,
  Deposit,
  Economy,
  EventId,
  GameState,
  Job,
  JobId,
  NoticeId,
  Player,
  SafetyNetKind,
  Stats,
  WeekEffect,
} from "./types";

export const SAVE_KEY = "mirkow.save.v2";
/** Klucz starego zapisu (v1): czyścimy go, żeby nie zalegał. */
export const LEGACY_SAVE_KEY = "mirkow.save.v1";
export const SAVE_FORMAT = 2;

export type SaveStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type LoadResult =
  | { status: "empty" }
  | { status: "ok"; state: GameState }
  | { status: "corrupt" }
  | { status: "outdated" };

export type SaveResult = "ok" | "failed";

const jobIds = Object.keys(JOB_DEFS) as JobId[];
const phases = ["setup", "playing", "victory"] as const;
const controllers = ["human", "bot"] as const;
const safetyNets = ["ciocia", "mops"] as const;
const notices = ["zwolnienie", "redukcja", "podwyzka", "awans"] as const satisfies readonly NoticeId[];
const economyPhases = ["boom", "normal", "recession"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isMember<T extends string>(value: unknown, list: readonly T[]): value is T {
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

/** undefined = śmieci; null = brak pracy. */
function parseJob(value: unknown): Job | null | undefined {
  if (value === null) {
    return null;
  }
  if (!isRecord(value) || !isMember(value.id, jobIds) || !isFiniteNumber(value.weeks)) {
    return undefined;
  }
  const raises = value.raises === undefined ? 0 : value.raises;
  if (!isFiniteNumber(raises)) {
    return undefined;
  }
  return { id: value.id, weeks: value.weeks, raises };
}

function parseEventId(value: unknown): EventId | null | undefined {
  if (value === null) {
    return null;
  }
  return isMember(value, eventIds) ? value : undefined;
}

function parseNotice(value: unknown): NoticeId | null | undefined {
  if (value === null || value === undefined) {
    return null;
  }
  return isMember(value, notices) ? value : undefined;
}

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

function parseEffect(value: unknown): WeekEffect | null {
  if (!isRecord(value) || typeof value.kind !== "string") {
    return null;
  }
  switch (value.kind) {
    case "rent":
    case "rentHike":
    case "deposit":
      return isFiniteNumber(value.amount) ? { kind: value.kind, amount: value.amount } : null;
    case "hunger":
      return isFiniteNumber(value.timeLost) ? { kind: "hunger", timeLost: value.timeLost } : null;
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
      return id === null || id === undefined ? null : { kind: "event", id };
    }
    case "safetyNet":
      return isMember(value.grant, safetyNets) && isFiniteNumber(value.amount)
        ? { kind: "safetyNet", grant: value.grant, amount: value.amount }
        : null;
    case "fired":
      return isMember(value.job, jobIds) && (value.reason === "reliability" || value.reason === "reduction")
        ? { kind: "fired", job: value.job, reason: value.reason }
        : null;
    case "economy": {
      const frozen: CompanyId | null = value.hiringFrozen === null ? null : isMember(value.hiringFrozen, companyIds) ? value.hiringFrozen : null;
      return isMember(value.phase, economyPhases)
        ? { kind: "economy", phase: value.phase, hiringFrozen: frozen }
        : null;
    }
    default:
      return null;
  }
}

function parseEconomy(value: unknown): Economy | null {
  if (!isRecord(value) || !isMember(value.phase, economyPhases)) {
    return null;
  }
  if (value.hiringFrozen === null) {
    return { phase: value.phase, hiringFrozen: null };
  }
  return isMember(value.hiringFrozen, companyIds)
    ? { phase: value.phase, hiringFrozen: value.hiringFrozen }
    : null;
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
  const lastNotice = parseNotice(value.lastNotice);
  const deposit = parseDeposit(value.deposit);
  if (stats === null || job === undefined || lastEvent === undefined || lastNotice === undefined || deposit === undefined) {
    return null;
  }
  if (!isRecord(value.home) || value.home.id !== "stancja" || !isFiniteNumber(value.home.rent)) {
    return null;
  }
  if (
    !isRecord(value.needs) ||
    !isFiniteNumber(value.needs.foodWeeks) ||
    !isFiniteNumber(value.needs.clothesWeeks) ||
    !isFiniteNumber(value.needs.suitWeeks)
  ) {
    return null;
  }
  if (!isFiniteNumber(value.nextTimeLeft) || !isFiniteNumber(value.experience) || !isFiniteNumber(value.reliability)) {
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
    experience: value.experience,
    reliability: value.reliability,
    home: { id: "stancja", rent: value.home.rent },
    needs: {
      foodWeeks: value.needs.foodWeeks,
      clothesWeeks: value.needs.clothesWeeks,
      suitWeeks: value.needs.suitWeeks,
    },
    nextTimeLeft: value.nextTimeLeft,
    lastEvent,
    lastNotice,
    deposit,
  };
}

export function parseGameState(value: unknown): GameState | null {
  if (!isRecord(value) || value.version !== 2) {
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
  if (value.phase !== "setup" && players.length === 0) {
    return null;
  }
  if (players.length > 0 && (value.active < 0 || value.active >= players.length)) {
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
    const effect = parseEffect(entry);
    if (effect === null) {
      return null;
    }
    effects.push(effect);
  }
  if (!isRecord(value.market) || !isFiniteNumber(value.market.food) || !isFiniteNumber(value.market.clothes)) {
    return null;
  }
  const economy = parseEconomy(value.economy);
  if (economy === null) {
    return null;
  }
  return {
    version: 2,
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
    economy,
  };
}

export function parseSave(raw: string | null): LoadResult {
  if (raw === null || raw === "") {
    return { status: "empty" };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "corrupt" };
  }
  if (!isRecord(parsed)) {
    return { status: "corrupt" };
  }
  if (parsed.version !== SAVE_FORMAT) {
    return isFiniteNumber(parsed.version) && parsed.version < SAVE_FORMAT
      ? { status: "outdated" }
      : { status: "corrupt" };
  }
  const state = parseGameState(parsed.state);
  if (state === null) {
    return { status: "corrupt" };
  }
  if (state.phase === "setup") {
    return { status: "empty" };
  }
  return { status: "ok", state };
}

export function loadSave(store: SaveStore): LoadResult {
  let raw: string | null;
  try {
    raw = store.getItem(SAVE_KEY);
  } catch {
    return { status: "corrupt" };
  }
  if (raw === null) {
    let legacy: string | null = null;
    try {
      legacy = store.getItem(LEGACY_SAVE_KEY);
    } catch {
      legacy = null;
    }
    return legacy === null ? { status: "empty" } : { status: "outdated" };
  }
  return parseSave(raw);
}

export function writeSave(store: SaveStore, state: GameState): SaveResult {
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
    store.removeItem(LEGACY_SAVE_KEY);
    return "ok";
  } catch {
    return "failed";
  }
}

export function memoryStore(initial: Record<string, string> = {}): SaveStore {
  const data = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}
