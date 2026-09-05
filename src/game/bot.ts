import {
  RENT_INTERVAL_WEEKS,
  REST_CAFE_COST,
  STUDY_COURSE_COST,
  STUDY_COURSE_EDU,
  STUDY_DEGREE_COST,
  resolveAction,
} from "./actions";
import { travelCost } from "./board";
import type { LocationId } from "./catalog";
import { dispatch } from "./reducer";
import { getActivePlayer } from "./selectors";
import type { ActionId, GameAction, GameState } from "./types";

const BOT_STEP_LIMIT = 32;

function isLegal(state: GameState, action: GameAction): boolean {
  return dispatch(state, action).ok;
}

function firstLegal(
  state: GameState,
  actions: readonly GameAction[],
): GameAction | null {
  for (const action of actions) {
    if (isLegal(state, action)) {
      return action;
    }
  }
  return null;
}

function goDo(
  state: GameState,
  locationId: LocationId,
  actionId: ActionId,
): readonly GameAction[] {
  const player = getActivePlayer(state);
  if (player === undefined) {
    return [];
  }
  if (player.locationId === locationId) {
    return [{ type: "act", id: actionId }];
  }
  const travel = travelCost(player.locationId, locationId);
  if (travel === null) {
    return [];
  }
  const def = resolveAction(state, actionId);
  if (travel + def.timeCost > state.timeLeft) {
    return [];
  }
  // Próba na sucho: jedziemy tylko wtedy, gdy akcja na miejscu będzie legalna.
  const move: GameAction = { type: "move", to: locationId };
  const moved = dispatch(state, move);
  if (!moved.ok || !dispatch(moved.state, { type: "act", id: actionId }).ok) {
    return [];
  }
  return [move];
}

export function nextBotAction(state: GameState): GameAction {
  if (state.phase !== "playing" || state.timeLeft === 0) {
    return { type: "endWeek" };
  }

  const player = getActivePlayer(state);
  if (player === undefined || player.controller !== "bot") {
    return { type: "endWeek" };
  }

  const rentDue = state.week % RENT_INTERVAL_WEEKS === 0;
  const rentSoon =
    rentDue || state.week % RENT_INTERVAL_WEEKS === RENT_INTERVAL_WEEKS - 1;
  const shortOnRent = player.stats.money < player.home.rent;

  if (player.needs.foodWeeks <= 1) {
    const food = firstLegal(state, goDo(state, "shop", "buyFood"));
    if (food !== null) {
      return food;
    }
  }

  if (player.needs.clothesWeeks <= 1 && !(rentDue && shortOnRent)) {
    const clothes = firstLegal(state, goDo(state, "shop", "buyClothes"));
    if (clothes !== null) {
      return clothes;
    }
  }

  if (player.job === null) {
    const job = firstLegal(state, goDo(state, "pup", "searchJob"));
    if (job !== null) {
      return job;
    }
  }

  if (player.job?.id === "kebabKasjer") {
    const promo = firstLegal(state, goDo(state, "pup", "applyKierownik"));
    if (promo !== null) {
      return promo;
    }
  }

  if (player.job?.id === "kebabKierownik" && !(rentSoon && shortOnRent)) {
    const lokal = firstLegal(state, goDo(state, "kebab", "openLokal"));
    if (lokal !== null) {
      return lokal;
    }
  }

  const buffer = player.home.rent;
  const urgentCash = (rentSoon && shortOnRent) || player.stats.money < buffer;

  if (player.job !== null && urgentCash) {
    const work = firstLegal(state, goDo(state, "kebab", "workKebab"));
    if (work !== null) {
      return work;
    }
  }

  if (player.stats.education < state.goals.education) {
    const preferDegree =
      player.stats.education + STUDY_COURSE_EDU < state.goals.education &&
      player.stats.money >= STUDY_DEGREE_COST + buffer;
    const canCourse = player.stats.money >= STUDY_COURSE_COST + buffer;
    if (preferDegree || canCourse) {
      const study = firstLegal(
        state,
        goDo(state, "campus", preferDegree ? "studyDegree" : "studyCourse"),
      );
      if (study !== null) {
        return study;
      }
    }
  }

  const wantsCash =
    player.stats.money < state.goals.money || player.stats.career < state.goals.career;
  if (player.job !== null && wantsCash) {
    const work = firstLegal(state, goDo(state, "kebab", "workKebab"));
    if (work !== null) {
      return work;
    }
  }

  if (player.stats.happiness < state.goals.happiness) {
    const comfortable = player.stats.money >= player.home.rent * 2 + REST_CAFE_COST;
    const cafe = comfortable ? firstLegal(state, goDo(state, "cafe", "restCafe")) : null;
    if (cafe !== null) {
      return cafe;
    }
    const rest = firstLegal(state, goDo(state, "home", "restHome"));
    if (rest !== null) {
      return rest;
    }
  }

  if (player.job !== null) {
    const work = firstLegal(state, goDo(state, "kebab", "workKebab"));
    if (work !== null) {
      return work;
    }
  }

  const rest = firstLegal(state, goDo(state, "home", "restHome"));
  if (rest !== null) {
    return rest;
  }

  return { type: "endWeek" };
}

export type BotStep = {
  action: GameAction;
  state: GameState;
};

export type BotTrace = {
  state: GameState;
  steps: readonly BotStep[];
};

function endTurn(current: GameState, steps: BotStep[]): BotTrace {
  const ending = dispatch(current, { type: "endWeek" });
  if (!ending.ok) {
    return { state: current, steps };
  }
  steps.push({ action: { type: "endWeek" }, state: ending.state });
  return { state: ending.state, steps };
}

/** Plays the bot's whole turn and returns every step, so the UI can replay it. */
export function playBotWithTrace(state: GameState): BotTrace {
  let current = state;
  const steps: BotStep[] = [];

  for (let step = 0; step < BOT_STEP_LIMIT; step += 1) {
    const player = getActivePlayer(current);
    if (
      current.phase !== "playing" ||
      player === undefined ||
      player.controller !== "bot"
    ) {
      return { state: current, steps };
    }

    const action = nextBotAction(current);
    const result = dispatch(current, action);
    if (!result.ok) {
      return endTurn(current, steps);
    }

    current = result.state;
    steps.push({ action, state: current });
    if (action.type === "endWeek") {
      return { state: current, steps };
    }
  }

  return endTurn(current, steps);
}

export function playBotUntilIdle(state: GameState): GameState {
  return playBotWithTrace(state).state;
}
