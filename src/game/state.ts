import { BOT_NAME, pickBotAvatar } from "./avatars";
import { TIME_MAX, type LocationId } from "./catalog";
import { STOCK_START_PRICE } from "./bank";
import { startingEconomy } from "./economy";
import { educationPoints } from "./diplomas";
import { startingMarket } from "./market";
import {
  STARTING_CLOTHES_WEEKS,
  STARTING_FOOD_WEEKS,
  STARTING_HAPPINESS,
  STARTING_MONEY,
  STARTING_RELIABILITY,
  STARTING_RENT,
  type AvatarId,
  type Controller,
  type DiplomaId,
  type Economy,
  type GameState,
  type Job,
  type Market,
  type OwnedItem,
  type Player,
  type Stats,
} from "./types";

export const DEFAULT_GOALS: Stats = {
  money: 5000,
  happiness: 80,
  education: 60,
  career: 50,
};

export function startingNeeds(): Player["needs"] {
  return { foodWeeks: STARTING_FOOD_WEEKS, clothesWeeks: STARTING_CLOTHES_WEEKS, suitWeeks: 0 };
}

export function startingStats(): Stats {
  return {
    money: STARTING_MONEY,
    happiness: STARTING_HAPPINESS,
    education: 0,
    career: 0,
  };
}

export function createPlayer(input: {
  id?: string;
  name: string;
  avatarId: AvatarId;
  controller?: Controller;
  locationId: LocationId;
  stats: Stats;
  job?: Job | null;
  experience?: number;
  reliability?: number;
  diplomas?: readonly DiplomaId[];
  studies?: Player["studies"];
  studying?: DiplomaId | null;
  needs?: Player["needs"];
  nextTimeLeft?: number;
  lastEvent?: Player["lastEvent"];
  deposit?: Player["deposit"];
  home?: Player["home"];
  items?: readonly OwnedItem[];
  account?: number;
  loan?: Player["loan"];
  shares?: number;
}): Player {
  return {
    id: input.id ?? "p1",
    name: input.name,
    avatarId: input.avatarId,
    controller: input.controller ?? "human",
    locationId: input.locationId,
    stats: input.stats,
    job: input.job ?? null,
    experience: input.experience ?? 0,
    reliability: input.reliability ?? STARTING_RELIABILITY,
    diplomas: input.diplomas ?? [],
    studies: input.studies ?? {},
    studying: input.studying ?? null,
    home: input.home ?? { id: "stancja", rent: STARTING_RENT },
    items: input.items ?? [],
    account: input.account ?? 0,
    loan: input.loan ?? null,
    shares: input.shares ?? 0,
    needs: input.needs ?? startingNeeds(),
    nextTimeLeft: input.nextTimeLeft ?? TIME_MAX,
    lastEvent: input.lastEvent ?? null,
    lastNotice: null,
    deposit: input.deposit ?? null,
  };
}

export function createSetup(rngSeed = 1): GameState {
  return {
    version: 5,
    phase: "setup",
    week: 1,
    timeLeft: TIME_MAX,
    timeMax: TIME_MAX,
    goals: DEFAULT_GOALS,
    players: [],
    active: 0,
    rngSeed,
    lastSafetyNet: null,
    lastEvent: null,
    lastWeekEffects: [],
    market: startingMarket(),
    economy: startingEconomy(),
    stockPrice: STOCK_START_PRICE,
    stockHistory: [STOCK_START_PRICE],
  };
}

export type MatchOverrides = {
  name?: string;
  avatarId?: AvatarId;
  locationId?: LocationId;
  stats?: Partial<Stats>;
  goals?: Partial<Stats>;
  timeLeft?: number;
  week?: number;
  rngSeed?: number;
  phase?: GameState["phase"];
  job?: Job | null;
  experience?: number;
  reliability?: number;
  diplomas?: readonly DiplomaId[];
  studies?: Player["studies"];
  studying?: DiplomaId | null;
  needs?: Player["needs"];
  home?: Player["home"];
  items?: readonly OwnedItem[];
  account?: number;
  loan?: Player["loan"];
  shares?: number;
  market?: Market;
  economy?: Economy;
  stockPrice?: number;
};

export function createMatch(overrides: MatchOverrides = {}): GameState {
  const stats: Stats = {
    ...startingStats(),
    ...(overrides.diplomas !== undefined ? { education: educationPoints(overrides.diplomas) } : {}),
    ...overrides.stats,
  };

  const player = createPlayer({
    id: "p1",
    controller: "human",
    name: overrides.name ?? "Gracz",
    avatarId: overrides.avatarId ?? "ola",
    locationId: overrides.locationId ?? "home",
    stats,
    job: overrides.job ?? null,
    needs: overrides.needs ?? startingNeeds(),
    ...(overrides.experience !== undefined ? { experience: overrides.experience } : {}),
    ...(overrides.reliability !== undefined ? { reliability: overrides.reliability } : {}),
    ...(overrides.diplomas !== undefined ? { diplomas: overrides.diplomas } : {}),
    ...(overrides.studies !== undefined ? { studies: overrides.studies } : {}),
    ...(overrides.studying !== undefined ? { studying: overrides.studying } : {}),
    ...(overrides.home !== undefined ? { home: overrides.home } : {}),
    ...(overrides.items !== undefined ? { items: overrides.items } : {}),
    ...(overrides.account !== undefined ? { account: overrides.account } : {}),
    ...(overrides.loan !== undefined ? { loan: overrides.loan } : {}),
    ...(overrides.shares !== undefined ? { shares: overrides.shares } : {}),
  });

  return {
    version: 5,
    phase: overrides.phase ?? "playing",
    week: overrides.week ?? 1,
    timeLeft: overrides.timeLeft ?? TIME_MAX,
    timeMax: TIME_MAX,
    goals: { ...DEFAULT_GOALS, ...overrides.goals },
    players: [player],
    active: 0,
    rngSeed: overrides.rngSeed ?? 1,
    lastSafetyNet: null,
    lastEvent: null,
    lastWeekEffects: [],
    market: overrides.market ?? startingMarket(),
    economy: overrides.economy ?? startingEconomy(),
    stockPrice: overrides.stockPrice ?? STOCK_START_PRICE,
    stockHistory: [overrides.stockPrice ?? STOCK_START_PRICE],
  };
}

export function createVersusMatch(
  overrides: MatchOverrides & {
    active?: number;
    botNeeds?: Player["needs"];
    botLocationId?: LocationId;
    botJob?: Job | null;
    botStats?: Partial<Stats>;
    botExperience?: number;
    botReliability?: number;
    botDiplomas?: readonly DiplomaId[];
    botItems?: readonly OwnedItem[];
    botHome?: Player["home"];
  } = {},
): GameState {
  const match = createMatch(overrides);
  const human = match.players[0];
  if (human === undefined) {
    throw new Error("missing human");
  }

  const bot = createPlayer({
    id: "p2",
    controller: "bot",
    name: BOT_NAME,
    avatarId: pickBotAvatar(human.avatarId),
    locationId: overrides.botLocationId ?? "home",
    stats: {
      ...startingStats(),
      ...(overrides.botDiplomas !== undefined ? { education: educationPoints(overrides.botDiplomas) } : {}),
      ...overrides.botStats,
    },
    job: overrides.botJob ?? null,
    ...(overrides.botDiplomas !== undefined ? { diplomas: overrides.botDiplomas } : {}),
    ...(overrides.botItems !== undefined ? { items: overrides.botItems } : {}),
    ...(overrides.botHome !== undefined ? { home: overrides.botHome } : {}),
    needs: overrides.botNeeds ?? startingNeeds(),
    ...(overrides.botExperience !== undefined ? { experience: overrides.botExperience } : {}),
    ...(overrides.botReliability !== undefined ? { reliability: overrides.botReliability } : {}),
  });

  return {
    ...match,
    players: [human, bot],
    active: overrides.active ?? 0,
  };
}
