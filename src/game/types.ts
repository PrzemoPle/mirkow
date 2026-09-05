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
export const STARTING_FOOD_WEEKS = 2;
export const STARTING_CLOTHES_WEEKS = 3;
export const STARTING_RELIABILITY = 20;

export type Stats = {
  money: number;
  happiness: number;
  education: number;
  career: number;
};

export type Phase = "setup" | "playing" | "victory";

export type SafetyNetKind = "ciocia" | "mops";

export type ActionId =
  | "work"
  | "openLokal"
  | "studyCourse"
  | "studyDegree"
  | "buyFood"
  | "buyClothes"
  | "buySuit"
  | "restHome"
  | "restCafe"
  | "restGym"
  | "deposit";

export type CompanyId = "kebab" | "shop" | "bank" | "pup" | "depot";

export type JobId =
  | "kebabPomoc"
  | "kebabKasjer"
  | "kebabKierownik"
  | "kebabLokal"
  | "shopPolki"
  | "shopKasjer"
  | "shopKierownik"
  | "bankKasjer"
  | "bankDoradca"
  | "bankDyrektor"
  | "pupReferent"
  | "pupNaczelnik"
  | "depotMonter"
  | "depotBrygadzista"
  | "depotInzynier"
  | "depotDyrektor";

export type Job = {
  id: JobId;
  /** Tygodnie na tym stanowisku. */
  weeks: number;
  /** Liczba przyznanych podwyżek. */
  raises: number;
};

export type EconomyPhase = "boom" | "normal" | "recession";

export type Economy = {
  phase: EconomyPhase;
  /** Firma, która w recesji nie zatrudnia. */
  hiringFrozen: CompanyId | null;
};

export type EventId =
  | "korek"
  | "lotto"
  | "pralka"
  | "tesciowa"
  | "aukcje"
  | "kontrola"
  | "pit"
  | "promocja"
  | "napiwki"
  | "spokoj";

/** Karty pokazywane po zdarzeniach z pracy (nie losowane jak eventy). */
export type NoticeId = "zwolnienie" | "redukcja" | "podwyzka" | "awans";

export type WeekEffect =
  | { kind: "rent"; amount: number }
  | { kind: "rentHike"; amount: number }
  | { kind: "hunger"; timeLost: number }
  | { kind: "noClothes"; happinessLost: number }
  | { kind: "safetyNet"; grant: SafetyNetKind; amount: number }
  | { kind: "shopPrices"; food: number; clothes: number }
  | { kind: "event"; id: EventId }
  | { kind: "deposit"; amount: number }
  | { kind: "fired"; job: JobId; reason: "reliability" | "reduction" }
  | { kind: "economy"; phase: EconomyPhase; hiringFrozen: CompanyId | null };

export type Market = {
  food: number;
  clothes: number;
};

export type AvatarId = "ola" | "bartek" | "nati" | "marek" | "kowalski";

export type Deposit = {
  amount: number;
  payout: number;
  weeksLeft: number;
};

export type Controller = "human" | "bot";

export type Player = {
  id: string;
  name: string;
  avatarId: AvatarId;
  controller: Controller;
  locationId: LocationId;
  stats: Stats;
  job: Job | null;
  /** Łączny staż: liczba przepracowanych zmian, nigdy nie spada. */
  experience: number;
  /** Solidność 0–100: rośnie z pracą, spada co tydzień. */
  reliability: number;
  home: { id: "stancja"; rent: number };
  needs: { foodWeeks: number; clothesWeeks: number; suitWeeks: number };
  nextTimeLeft: number;
  lastEvent: EventId | null;
  lastNotice: NoticeId | null;
  deposit: Deposit | null;
};

export type GameState = {
  version: 2;
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
  economy: Economy;
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
  | { type: "apply"; job: JobId }
  | { type: "askRaise" }
  | { type: "endWeek" };
