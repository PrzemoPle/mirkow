import type { LocationId } from "./catalog";
import { TIME_MAX } from "./catalog";

export const STARTING_MONEY = 800;
export const STARTING_HAPPINESS = 20;
export const STARTING_RENT = 400;
export const REST_TIME_COST = 1;
export const REST_HAPPINESS = 3;
export const AUNT_HELP = 500;
export const MOPS_HELP = 350;
export const METER_MAX = 100;

export type Stats = {
  money: number;
  happiness: number;
  education: number;
  career: number;
};

export type Phase = "setup" | "playing" | "victory";

export type SafetyNetKind = "ciocia" | "mops";

export type ActionId =
  | "searchJob"
  | "applyKierownik"
  | "openLokal"
  | "workKebab"
  | "studyCourse"
  | "studyDegree"
  | "buyFood"
  | "buyClothes"
  | "restHome"
  | "restCafe"
  | "restGym";

export type JobId = "kebabKasjer" | "kebabKierownik" | "kebabLokal";

export type Job = {
  id: JobId;
  weeks: number;
};

export type EventId =
  | "korek"
  | "lotto"
  | "pralka"
  | "tesciowa"
  | "aukcje"
  | "kontrola"
  | "pit"
  | "promocja";

export type WeekEffect =
  | { kind: "rent"; amount: number }
  | { kind: "rentHike"; amount: number }
  | { kind: "hunger"; timeLost: number }
  | { kind: "noClothes"; happinessLost: number }
  | { kind: "safetyNet"; grant: SafetyNetKind; amount: number }
  | { kind: "shopPrices"; food: number; clothes: number }
  | { kind: "event"; id: EventId };

export type Market = {
  food: number;
  clothes: number;
};

export type AvatarId = "ola" | "bartek" | "nati" | "marek";

export type Controller = "human" | "bot";

export type Player = {
  id: string;
  name: string;
  avatarId: AvatarId;
  controller: Controller;
  locationId: LocationId;
  stats: Stats;
  job: Job | null;
  home: { id: "stancja"; rent: number };
  needs: { foodWeeks: number; clothesWeeks: number };
  nextTimeLeft: number;
  lastEvent: EventId | null;
};

export type GameState = {
  version: 1;
  phase: Phase;
  week: number;
  timeLeft: number;
  timeMax: typeof TIME_MAX;
  goals: Stats;
  players: readonly Player[];
  active: number;
  rngSeed: number;
  lastSafetyNet: SafetyNetKind | null;
  lastEvent: EventId | null;
  lastWeekEffects: readonly WeekEffect[];
  market: Market;
};

export type GameAction =
  | {
      type: "start";
      goals: Stats;
      name: string;
      avatarId: AvatarId;
      rngSeed?: number;
    }
  | { type: "move"; to: LocationId }
  | { type: "act"; id: ActionId }
  | { type: "endWeek" };
