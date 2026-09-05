import { BOT_NAME, pickBotAvatar } from "./avatars";
import { TIME_MAX, type LocationId } from "./catalog";
import { startingMarket } from "./market";
import {
  STARTING_HAPPINESS,
  STARTING_MONEY,
  STARTING_RENT,
  type AvatarId,
  type Controller,
  type GameState,
  type Job,
  type Market,
  type Player,
  type Stats,
} from "./types";

export const DEFAULT_GOALS: Stats = {
  money: 5000,
  happiness: 80,
  education: 60,
  career: 50,
};

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
  needs?: Player["needs"];
  nextTimeLeft?: number;
  lastEvent?: Player["lastEvent"];
}): Player {
  return {
    id: input.id ?? "p1",
    name: input.name,
    avatarId: input.avatarId,
    controller: input.controller ?? "human",
    locationId: input.locationId,
    stats: input.stats,
    job: input.job ?? null,
    home: { id: "stancja", rent: STARTING_RENT },
    needs: input.needs ?? { foodWeeks: 1, clothesWeeks: 2 },
    nextTimeLeft: input.nextTimeLeft ?? TIME_MAX,
    lastEvent: input.lastEvent ?? null,
  };
}

export function createSetup(rngSeed = 1): GameState {
  return {
    version: 1,
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
  };
}

export function createMatch(overrides: {
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
  needs?: Player["needs"];
  market?: Market;
} = {}): GameState {
  const stats: Stats = {
    ...startingStats(),
    ...overrides.stats,
  };

  return {
    version: 1,
    phase: overrides.phase ?? "playing",
    week: overrides.week ?? 1,
    timeLeft: overrides.timeLeft ?? TIME_MAX,
    timeMax: TIME_MAX,
    goals: { ...DEFAULT_GOALS, ...overrides.goals },
    players: [
      createPlayer({
        id: "p1",
        controller: "human",
        name: overrides.name ?? "Gracz",
        avatarId: overrides.avatarId ?? "ola",
        locationId: overrides.locationId ?? "home",
        stats,
        job: overrides.job ?? null,
        needs: overrides.needs ?? { foodWeeks: 1, clothesWeeks: 2 },
      }),
    ],
    active: 0,
    rngSeed: overrides.rngSeed ?? 1,
    lastSafetyNet: null,
    lastEvent: null,
    lastWeekEffects: [],
    market: overrides.market ?? startingMarket(),
  };
}

export function createVersusMatch(
  overrides: Parameters<typeof createMatch>[0] & {
    active?: number;
    botNeeds?: Player["needs"];
    botLocationId?: LocationId;
    botJob?: Job | null;
    botStats?: Partial<Stats>;
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
    stats: { ...startingStats(), ...overrides.botStats },
    job: overrides.botJob ?? null,
    needs: overrides.botNeeds ?? { foodWeeks: 1, clothesWeeks: 2 },
  });

  return {
    ...match,
    players: [human, bot],
    active: overrides.active ?? 0,
  };
}
