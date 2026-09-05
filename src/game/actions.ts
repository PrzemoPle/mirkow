import type { LocationId } from "./catalog";
import {
  KEBAB_JOBS,
  KIEROWNIK_EDU,
  KIEROWNIK_PROMOTE_CAREER,
  KIEROWNIK_PROMOTE_TIME,
  KIEROWNIK_WEEKS,
  LOKAL_BUYIN,
  LOKAL_EDU,
  LOKAL_OPEN_CAREER,
  LOKAL_OPEN_TIME,
  LOKAL_WEEKS,
  WORK_KEBAB_CAREER,
  WORK_KEBAB_TIME,
  WORK_KEBAB_WAGE,
  getJobDef,
} from "./jobs";
import { FOOD_BASE, CLOTHES_BASE } from "./market";
import { REST_HAPPINESS, REST_TIME_COST, type ActionId, type GameState, type JobId, type Player } from "./types";

export {
  WORK_KEBAB_CAREER,
  WORK_KEBAB_TIME,
  WORK_KEBAB_WAGE,
} from "./jobs";
export { FOOD_BASE as BUY_FOOD_COST, CLOTHES_BASE as BUY_CLOTHES_COST } from "./market";

export const SEARCH_JOB_TIME = 2;
export const STUDY_COURSE_TIME = 3;
export const STUDY_COURSE_COST = 150;
export const STUDY_COURSE_EDU = 6;
export const STUDY_DEGREE_TIME = 5;
export const STUDY_DEGREE_COST = 400;
export const STUDY_DEGREE_EDU = 14;
export const BUY_FOOD_TIME = 1;
export const FOOD_STOCK_WEEKS = 2;
export const BUY_CLOTHES_TIME = 1;
export const CLOTHES_STOCK_WEEKS = 3;
export const REST_CAFE_TIME = 1;
export const REST_CAFE_COST = 25;
export const REST_CAFE_HAPPINESS = 5;
export const REST_GYM_TIME = 2;
export const REST_GYM_COST = 40;
export const REST_GYM_HAPPINESS = 8;
export const HUNGER_TIME_PENALTY = 2;
export const BARE_HAPPINESS_PENALTY = 5;
export const RENT_INTERVAL_WEEKS = 4;

export type ActionDef = {
  id: ActionId;
  locationId: LocationId;
  timeCost: number;
  moneyCost: number;
  wage: number;
  happiness: number;
  education: number;
  career: number;
  requiredJobs: readonly JobId[] | null;
  requiredEducation: number;
  requiredWeeks: number;
  rejectIfEmployed: boolean;
  givesJob: JobId | null;
  foodWeeks: number | null;
  clothesWeeks: number | null;
};

const idleStats = {
  moneyCost: 0,
  wage: 0,
  happiness: 0,
  education: 0,
  career: 0,
  requiredJobs: null,
  requiredEducation: 0,
  requiredWeeks: 0,
  rejectIfEmployed: false,
  givesJob: null,
  foodWeeks: null,
  clothesWeeks: null,
} satisfies Omit<ActionDef, "id" | "locationId" | "timeCost">;

export const ACTION_DEFS: Record<ActionId, ActionDef> = {
  searchJob: {
    ...idleStats,
    id: "searchJob",
    locationId: "pup",
    timeCost: SEARCH_JOB_TIME,
    rejectIfEmployed: true,
    givesJob: "kebabKasjer",
  },
  applyKierownik: {
    ...idleStats,
    id: "applyKierownik",
    locationId: "pup",
    timeCost: KIEROWNIK_PROMOTE_TIME,
    career: KIEROWNIK_PROMOTE_CAREER,
    requiredJobs: ["kebabKasjer"],
    requiredEducation: KIEROWNIK_EDU,
    requiredWeeks: KIEROWNIK_WEEKS,
    givesJob: "kebabKierownik",
  },
  openLokal: {
    ...idleStats,
    id: "openLokal",
    locationId: "kebab",
    timeCost: LOKAL_OPEN_TIME,
    moneyCost: LOKAL_BUYIN,
    career: LOKAL_OPEN_CAREER,
    requiredJobs: ["kebabKierownik"],
    requiredEducation: LOKAL_EDU,
    requiredWeeks: LOKAL_WEEKS,
    givesJob: "kebabLokal",
  },
  workKebab: {
    ...idleStats,
    id: "workKebab",
    locationId: "kebab",
    timeCost: WORK_KEBAB_TIME,
    wage: WORK_KEBAB_WAGE,
    career: WORK_KEBAB_CAREER,
    requiredJobs: KEBAB_JOBS,
  },
  studyCourse: {
    ...idleStats,
    id: "studyCourse",
    locationId: "campus",
    timeCost: STUDY_COURSE_TIME,
    moneyCost: STUDY_COURSE_COST,
    education: STUDY_COURSE_EDU,
  },
  studyDegree: {
    ...idleStats,
    id: "studyDegree",
    locationId: "campus",
    timeCost: STUDY_DEGREE_TIME,
    moneyCost: STUDY_DEGREE_COST,
    education: STUDY_DEGREE_EDU,
  },
  buyFood: {
    ...idleStats,
    id: "buyFood",
    locationId: "shop",
    timeCost: BUY_FOOD_TIME,
    moneyCost: FOOD_BASE,
    foodWeeks: FOOD_STOCK_WEEKS,
  },
  buyClothes: {
    ...idleStats,
    id: "buyClothes",
    locationId: "shop",
    timeCost: BUY_CLOTHES_TIME,
    moneyCost: CLOTHES_BASE,
    clothesWeeks: CLOTHES_STOCK_WEEKS,
  },
  restHome: {
    ...idleStats,
    id: "restHome",
    locationId: "home",
    timeCost: REST_TIME_COST,
    happiness: REST_HAPPINESS,
  },
  restCafe: {
    ...idleStats,
    id: "restCafe",
    locationId: "cafe",
    timeCost: REST_CAFE_TIME,
    moneyCost: REST_CAFE_COST,
    happiness: REST_CAFE_HAPPINESS,
  },
  restGym: {
    ...idleStats,
    id: "restGym",
    locationId: "gym",
    timeCost: REST_GYM_TIME,
    moneyCost: REST_GYM_COST,
    happiness: REST_GYM_HAPPINESS,
  },
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

function listedForPlayer(def: ActionDef, player: Player): boolean {
  if (def.rejectIfEmployed) {
    return player.job === null;
  }
  if (def.givesJob === "kebabKierownik") {
    return player.job?.id === "kebabKasjer";
  }
  if (def.givesJob === "kebabLokal") {
    return player.job?.id === "kebabKierownik";
  }
  return true;
}

export function actionsAt(
  locationId: LocationId,
  player?: Player,
): readonly ActionId[] {
  return (Object.keys(ACTION_DEFS) as ActionId[]).filter((id) => {
    const def = getActionDef(id);
    if (def.locationId !== locationId) {
      return false;
    }
    if (player === undefined) {
      return true;
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
  if (id === "workKebab" && player?.job !== undefined && player.job !== null) {
    const job = getJobDef(player.job.id);
    return { ...def, wage: job.wage, career: job.career, timeCost: job.timeCost };
  }
  return def;
}
