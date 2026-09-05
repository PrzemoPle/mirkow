import type { LocationId } from "./catalog";
import { wageMultiplier } from "./economy";
import {
  getJobDef,
  jobLocation,
  LOKAL_BUYIN,
  LOKAL_OPEN_TIME,
  RAISE_PERCENT,
  WORK_TIME,
} from "./jobs";
import { EXAM_FEE, EXAM_TIME, getDiplomaDef } from "./diplomas";
import { FOOD_BASE, CLOTHES_BASE } from "./market";
import { REST_HAPPINESS, REST_TIME_COST, type ActionId, type GameState, type Player } from "./types";

export { FOOD_BASE as BUY_FOOD_COST, CLOTHES_BASE as BUY_CLOTHES_COST } from "./market";

export const BUY_FOOD_TIME = 1;
export const FOOD_STOCK_WEEKS = 3;
export const BUY_CLOTHES_TIME = 1;
export const CLOTHES_STOCK_WEEKS = 4;
export const BUY_SUIT_TIME = 1;
export const SUIT_COST = 350;
export const SUIT_STOCK_WEEKS = 8;
export const REST_CAFE_TIME = 1;
export const REST_CAFE_COST = 25;
export const REST_CAFE_HAPPINESS = 5;
export const REST_GYM_TIME = 2;
export const REST_GYM_COST = 40;
export const REST_GYM_HAPPINESS = 8;
export const HUNGER_TIME_PENALTY = 2;
export const HUNGER_HAPPINESS_PENALTY = 3;
export const BARE_HAPPINESS_PENALTY = 5;
export const RENT_INTERVAL_WEEKS = 4;
export const DEPOSIT_TIME = 1;
export const DEPOSIT_COST = 1000;
export const DEPOSIT_PAYOUT = 1080;
export const DEPOSIT_WEEKS = 4;

export type ActionDef = {
  id: ActionId;
  /** null = miejsce pracy gracza (zależy od etatu). */
  locationId: LocationId | null;
  timeCost: number;
  moneyCost: number;
  wage: number;
  happiness: number;
  education: number;
  requiredMoney: number;
  isWork: boolean;
  isClass: boolean;
  isExam: boolean;
  opensLokal: boolean;
  opensDeposit: boolean;
  foodWeeks: number | null;
  clothesWeeks: number | null;
  suitWeeks: number | null;
};

const idle = {
  moneyCost: 0,
  wage: 0,
  happiness: 0,
  education: 0,
  requiredMoney: 0,
  isWork: false,
  isClass: false,
  isExam: false,
  opensLokal: false,
  opensDeposit: false,
  foodWeeks: null,
  clothesWeeks: null,
  suitWeeks: null,
} satisfies Omit<ActionDef, "id" | "locationId" | "timeCost">;

export const ACTION_DEFS: Record<ActionId, ActionDef> = {
  work: { ...idle, id: "work", locationId: null, timeCost: WORK_TIME, isWork: true },
  openLokal: {
    ...idle,
    id: "openLokal",
    locationId: "kebab",
    timeCost: LOKAL_OPEN_TIME,
    moneyCost: LOKAL_BUYIN,
    opensLokal: true,
  },
  attendClass: { ...idle, id: "attendClass", locationId: "campus", timeCost: 3, isClass: true },
  takeExam: { ...idle, id: "takeExam", locationId: "campus", timeCost: EXAM_TIME, moneyCost: EXAM_FEE, isExam: true },
  buyFood: { ...idle, id: "buyFood", locationId: "shop", timeCost: BUY_FOOD_TIME, moneyCost: FOOD_BASE, foodWeeks: FOOD_STOCK_WEEKS },
  buyClothes: { ...idle, id: "buyClothes", locationId: "shop", timeCost: BUY_CLOTHES_TIME, moneyCost: CLOTHES_BASE, clothesWeeks: CLOTHES_STOCK_WEEKS },
  buySuit: { ...idle, id: "buySuit", locationId: "lombard", timeCost: BUY_SUIT_TIME, moneyCost: SUIT_COST, suitWeeks: SUIT_STOCK_WEEKS },
  restHome: { ...idle, id: "restHome", locationId: "home", timeCost: REST_TIME_COST, happiness: REST_HAPPINESS },
  restCafe: { ...idle, id: "restCafe", locationId: "cafe", timeCost: REST_CAFE_TIME, moneyCost: REST_CAFE_COST, happiness: REST_CAFE_HAPPINESS },
  restGym: { ...idle, id: "restGym", locationId: "gym", timeCost: REST_GYM_TIME, moneyCost: REST_GYM_COST, happiness: REST_GYM_HAPPINESS },
  deposit: { ...idle, id: "deposit", locationId: "bank", timeCost: DEPOSIT_TIME, moneyCost: DEPOSIT_COST, opensDeposit: true },
};

export function isActionId(value: string): value is ActionId {
  return Object.hasOwn(ACTION_DEFS, value);
}

export function getActionDef(id: ActionId): ActionDef {
  const def = ACTION_DEFS[id];
  if (def === undefined) {
    throw new Error(`Missing action ${id}`);
  }
  return def;
}

/** Wypłata za zmianę: stawka × podwyżki × koniunktura, zaokrąglona do 10 zł. */
export function shiftWage(state: GameState, player: Player): number {
  if (player.job === null) {
    return 0;
  }
  const def = getJobDef(player.job.id);
  const raw = def.wage * (1 + RAISE_PERCENT * player.job.raises) * wageMultiplier(state.economy.phase);
  return Math.round(raw / 10) * 10;
}

function listedForPlayer(def: ActionDef, player: Player): boolean {
  if (def.isWork) {
    return player.job !== null;
  }
  if (def.opensLokal) {
    return player.job?.id === "kebabKierownik";
  }
  if (def.isClass) {
    return player.studying !== null;
  }
  if (def.isExam) {
    return player.studying !== null && (player.studies[player.studying]?.classes ?? 0) >= getDiplomaDef(player.studying).classes;
  }
  return true;
}

export function actionsAt(locationId: LocationId, player?: Player): readonly ActionId[] {
  return (Object.keys(ACTION_DEFS) as ActionId[]).filter((id) => {
    const def = getActionDef(id);
    const where = def.isWork ? (player?.job ? jobLocation(player.job.id) : null) : def.locationId;
    if (where !== locationId) {
      return false;
    }
    if (player === undefined) {
      return !def.isWork;
    }
    return listedForPlayer(def, player);
  });
}

export function resolveAction(state: GameState, id: ActionId): ActionDef {
  const def = getActionDef(id);
  const player = state.players[state.active];
  if (id === "buyFood") {
    return { ...def, moneyCost: state.market.food };
  }
  if (id === "buyClothes") {
    return { ...def, moneyCost: state.market.clothes };
  }
  if (id === "work" && player !== undefined && player.job !== null) {
    return { ...def, locationId: jobLocation(player.job.id), wage: shiftWage(state, player) };
  }
  if (id === "attendClass" && player !== undefined && player.studying !== null) {
    const diploma = getDiplomaDef(player.studying);
    return { ...def, moneyCost: diploma.classCost, timeCost: diploma.classTime };
  }
  return def;
}
