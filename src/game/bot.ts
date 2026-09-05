import {
  RENT_INTERVAL_WEEKS,
  REST_CAFE_COST,
  resolveAction,
  SUIT_COST,
} from "./actions";
import { ACCOUNT_STEP, LOAN_STEP, STOCK_LOT } from "./bank";
import { diplomaIds, EXAM_FEE, getDiplomaDef, hasDiploma, prerequisiteMet } from "./diplomas";
import { hasWorking, ownedItem, repairPrice } from "./items";
import { playerTravelCost } from "./travel";
import type { LocationId } from "./catalog";
import { FIRE_MARGIN, getJobDef, jobIds, jobLocation, RELIABILITY_DECAY, type JobDef } from "./jobs";
import { dispatch } from "./reducer";
import { getActivePlayer } from "./selectors";
import type { ActionId, DiplomaId, GameAction, GameState, Player } from "./types";

const BOT_STEP_LIMIT = 32;

export type BotStep = {
  action: GameAction;
  state: GameState;
};

export type BotTrace = {
  state: GameState;
  steps: readonly BotStep[];
};

function isLegal(state: GameState, action: GameAction): boolean {
  return dispatch(state, action).ok;
}

function firstLegal(state: GameState, actions: readonly GameAction[]): GameAction | null {
  for (const action of actions) {
    if (isLegal(state, action)) {
      return action;
    }
  }
  return null;
}

/** Plan „dojedź i zrób”: zwraca ruch tylko, gdy akcja na miejscu będzie legalna. */
function goDo(state: GameState, locationId: LocationId, then: GameAction, timeCost: number): readonly GameAction[] {
  const player = getActivePlayer(state);
  if (player === undefined) {
    return [];
  }
  if (player.locationId === locationId) {
    return [then];
  }
  const travel = playerTravelCost(player, player.locationId, locationId);
  if (travel === null || travel + timeCost > state.timeLeft) {
    return [];
  }
  const move: GameAction = { type: "move", to: locationId };
  const moved = dispatch(state, move);
  if (!moved.ok || !dispatch(moved.state, then).ok) {
    return [];
  }
  return [move];
}

function goAct(state: GameState, locationId: LocationId, actionId: ActionId): readonly GameAction[] {
  return goDo(state, locationId, { type: "act", id: actionId }, resolveAction(state, actionId).timeCost);
}

/** Najlepsze stanowisko, o które bot może się dziś ubiegać (wyższy prestiż niż obecne). */
function bestReachableJob(state: GameState, player: Player): JobDef | null {
  const currentPrestige = player.job === null ? -1 : getJobDef(player.job.id).prestige;
  let best: JobDef | null = null;
  for (const id of jobIds) {
    const def = getJobDef(id);
    if (def.hiddenInPup || def.prestige <= currentPrestige) {
      continue;
    }
    const atPup: GameState = {
      ...state,
      players: state.players.map((entry, index) =>
        index === state.active ? { ...entry, locationId: "pup" as LocationId } : entry,
      ),
    };
    if (!dispatch(atPup, { type: "apply", job: id }).ok) {
      continue;
    }
    if (best === null || def.prestige > best.prestige) {
      best = def;
    }
  }
  return best;
}

/** Dyplom, który najbardziej przybliża do celu: brakujący do następnego stanowiska albo najtańszy do progu. */
function wantedDiploma(player: Player, target: JobDef | null, educationGoal: number): DiplomaId | null {
  if (player.studying !== null && !hasDiploma(player, player.studying)) {
    return player.studying;
  }
  if (target !== null) {
    for (const diploma of target.requiredDiplomas) {
      if (hasDiploma(player, diploma)) {
        continue;
      }
      if (prerequisiteMet(player, diploma)) {
        return diploma;
      }
      const prerequisite = getDiplomaDef(diploma).prerequisiteAny.find((need) => !hasDiploma(player, need));
      if (prerequisite !== undefined && prerequisiteMet(player, prerequisite)) {
        return prerequisite;
      }
    }
  }
  if (player.stats.education < educationGoal) {
    for (const diploma of diplomaIds) {
      if (!hasDiploma(player, diploma) && prerequisiteMet(player, diploma)) {
        return diploma;
      }
    }
  }
  return null;
}

/** Czy jedyną przeszkodą w lepszym podaniu jest brak garnituru. */
function suitBlocksApplication(state: GameState, player: Player): boolean {
  const currentPrestige = player.job === null ? -1 : getJobDef(player.job.id).prestige;
  const atPup: GameState = {
    ...state,
    players: state.players.map((entry, index) =>
      index === state.active ? { ...entry, locationId: "pup" as LocationId, needs: { ...entry.needs, suitWeeks: 0 } } : entry,
    ),
  };
  for (const id of jobIds) {
    const def = getJobDef(id);
    if (def.hiddenInPup || !def.requiresSuit || def.prestige <= currentPrestige) {
      continue;
    }
    const result = dispatch(atPup, { type: "apply", job: id });
    if (!result.ok && result.error.code === "needsSuit") {
      return true;
    }
  }
  return false;
}

/** Następny cel kariery: najtańsze stanowisko wyżej, do którego brakuje tylko edukacji lub stroju. */
function nextCareerTarget(player: Player): JobDef | null {
  const currentPrestige = player.job === null ? -1 : getJobDef(player.job.id).prestige;
  let target: JobDef | null = null;
  for (const id of jobIds) {
    const def = getJobDef(id);
    if (def.hiddenInPup || def.prestige <= currentPrestige) {
      continue;
    }
    if (player.experience + 8 < def.requiredExperience) {
      continue;
    }
    // Nie celuj w stanowisko, do którego brakuje dwóch dyplomów naraz.
    const missing = def.requiredDiplomas.filter((diploma) => !hasDiploma(player, diploma));
    if (missing.length > 1) {
      continue;
    }
    if (target === null || def.prestige < target.prestige) {
      target = def;
    }
  }
  return target;
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
  const rentSoon = rentDue || state.week % RENT_INTERVAL_WEEKS === RENT_INTERVAL_WEEKS - 1;
  const shortOnRent = player.stats.money < player.home.rent;
  const buffer = player.home.rent;
  const job = player.job === null ? null : getJobDef(player.job.id);
  const workplace = player.job === null ? null : jobLocation(player.job.id);

  // 1. Jedzenie i ubranie.
  if (player.needs.foodWeeks <= 1) {
    const food = firstLegal(state, goAct(state, "shop", "buyFood"));
    if (food !== null) {
      return food;
    }
  }
  if (player.needs.clothesWeeks <= 1 && !(rentDue && shortOnRent)) {
    const clothes = firstLegal(state, goAct(state, "shop", "buyClothes"));
    if (clothes !== null) {
      return clothes;
    }
  }

  // 2. Solidność: trzymaj zapas nad własnym progiem i dociągnij do progu następnego stanowiska.
  const target = nextCareerTarget(player);
  if (job !== null && workplace !== null) {
    const nextWeek = player.reliability - RELIABILITY_DECAY;
    const reliabilityGoal = Math.max(
      job.requiredReliability + RELIABILITY_DECAY * 2,
      target?.requiredReliability ?? 0,
    );
    const inDanger = nextWeek < job.requiredReliability - FIRE_MARGIN + RELIABILITY_DECAY;
    if (inDanger || player.reliability < reliabilityGoal) {
      const work = firstLegal(state, goAct(state, workplace, "work"));
      if (work !== null) {
        return work;
      }
    }
  }

  // 3. Własny lokal, gdy stać.
  if (job?.id === "kebabKierownik" && !(rentSoon && shortOnRent)) {
    const lokal = firstLegal(state, goAct(state, "kebab", "openLokal"));
    if (lokal !== null) {
      return lokal;
    }
  }

  // 4. Garnitur, gdy obecna praca go wymaga albo blokuje podanie, które poza tym przeszłoby dziś.
  const needsSuit = (job?.requiresSuit ?? false) || suitBlocksApplication(state, player);
  if (needsSuit && player.needs.suitWeeks <= 1 && player.stats.money >= SUIT_COST + buffer) {
    const suit = firstLegal(state, goAct(state, "lombard", "buySuit"));
    if (suit !== null) {
      return suit;
    }
  }

  // 5. Lepsza praca, jeśli jest w zasięgu.
  const reachable = bestReachableJob(state, player);
  if (reachable !== null) {
    const apply = firstLegal(state, goDo(state, "pup", { type: "apply", job: reachable.id }, 2));
    if (apply !== null) {
      return apply;
    }
  }

  // 6. Podwyżka, gdy się należy.
  if (job !== null) {
    const raise = firstLegal(state, goDo(state, "pup", { type: "askRaise" }, 1));
    if (raise !== null) {
      return raise;
    }
  }

  // 7. Pilna kasa.
  const urgentCash = (rentSoon && shortOnRent) || player.stats.money < buffer;
  if (workplace !== null && urgentCash) {
    const work = firstLegal(state, goAct(state, workplace, "work"));
    if (work !== null) {
      return work;
    }
  }

  // 8. Nauka: dyplom pod cel kariery albo pod próg wykształcenia.
  const wanted = wantedDiploma(player, target, state.goals.education);
  if (wanted !== null) {
    const def = getDiplomaDef(wanted);
    if (player.studying !== wanted) {
      const enrollAction = firstLegal(state, goDo(state, "campus", { type: "enroll", diploma: wanted }, 0));
      if (enrollAction !== null) {
        return enrollAction;
      }
    } else {
      const done = player.studies[wanted]?.classes ?? 0;
      if (done >= def.classes && player.stats.money >= EXAM_FEE + buffer) {
        const exam = firstLegal(state, goAct(state, "campus", "takeExam"));
        if (exam !== null) {
          return exam;
        }
      } else if (player.stats.money >= def.classCost + buffer) {
        const lesson = firstLegal(state, goAct(state, "campus", "attendClass"));
        if (lesson !== null) {
          return lesson;
        }
      }
    }
  }

  // 9. Praca na kasę i staż.
  const wantsCash =
    player.stats.money < state.goals.money ||
    player.stats.career < state.goals.career ||
    (target !== null && player.experience < target.requiredExperience);
  if (workplace !== null && wantsCash) {
    const work = firstLegal(state, goAct(state, workplace, "work"));
    if (work !== null) {
      return work;
    }
  }

  // 10. Dom i sprzęt: rower skraca drogę, lodówka oszczędza wizyty, komputer skraca naukę, kawalerka chroni rzeczy.
  const spare = player.stats.money - buffer * 2;
  const broken = player.items.find((item) => item.broken);
  if (broken !== undefined && spare >= repairPrice(broken.id)) {
    const fix = firstLegal(state, goDo(state, "elektro", { type: "repairItem", item: broken.id }, 1));
    if (fix !== null) {
      return fix;
    }
  }
  if (ownedItem(player, "rower") === undefined && spare >= 1000) {
    const bike = firstLegal(state, goDo(state, "elektro", { type: "buyItem", item: "rower", used: false }, 1));
    if (bike !== null) {
      return bike;
    }
  }
  if (player.studying !== null && ownedItem(player, "komputer") === undefined && spare >= 2500) {
    const pc = firstLegal(state, goDo(state, "elektro", { type: "buyItem", item: "komputer", used: false }, 1));
    if (pc !== null) {
      return pc;
    }
  }
  if (!player.items.some((item) => item.id === "lodowka") && spare >= 900) {
    const fridge = firstLegal(state, goDo(state, "elektro", { type: "buyItem", item: "lodowka", used: false }, 1));
    if (fridge !== null) {
      return fridge;
    }
  }
  if (player.home.id === "stancja" && player.items.length >= 2 && player.stats.money >= 700 * 3) {
    const flat = firstLegal(state, goDo(state, "home", { type: "relocate", home: "kawalerka" }, 2));
    if (flat !== null) {
      return flat;
    }
  }
  if (
    player.home.id === "kawalerka" &&
    player.stats.happiness < state.goals.happiness &&
    player.stats.money >= state.goals.money * 0.5 + 1200 * 2
  ) {
    const bigger = firstLegal(state, goDo(state, "home", { type: "relocate", home: "apartament" }, 2));
    if (bigger !== null) {
      return bigger;
    }
  }

  // 10b. Bank: nadwyżka na konto, akcje w boomie, sprzedaż w recesji, mały kredyt na naukę.
  const cashCap = Math.max(buffer * 3 + 1000, state.goals.money);
  if (player.stats.money > cashCap + ACCOUNT_STEP) {
    const amount = Math.floor((player.stats.money - cashCap) / ACCOUNT_STEP) * ACCOUNT_STEP;
    const stash = firstLegal(state, goDo(state, "bank", { type: "account", amount }, 1));
    if (stash !== null) {
      return stash;
    }
  }
  if (state.economy.phase === "boom" && spare >= state.stockPrice * STOCK_LOT + 500) {
    const buy = firstLegal(state, goDo(state, "bank", { type: "trade", shares: STOCK_LOT }, 1));
    if (buy !== null) {
      return buy;
    }
  }
  if (state.economy.phase === "recession" && player.shares > 0) {
    const sell = firstLegal(state, goDo(state, "bank", { type: "trade", shares: -player.shares }, 1));
    if (sell !== null) {
      return sell;
    }
  }
  if (
    player.loan === null &&
    player.job !== null &&
    player.studying !== null &&
    player.stats.money < getDiplomaDef(player.studying).classCost + buffer
  ) {
    const credit = firstLegal(state, goDo(state, "bank", { type: "loan", amount: LOAN_STEP }, 1));
    if (credit !== null) {
      return credit;
    }
  }
  if (player.loan !== null && player.stats.money >= player.loan.principal + buffer * 2) {
    const repay = firstLegal(state, goDo(state, "bank", { type: "loan", amount: -player.loan.principal }, 1));
    if (repay !== null) {
      return repay;
    }
  }
  if (player.needs.foodWeeks === 0 && player.locationId === "kebab" && hasWorking(player, "lodowka") === false) {
    const eat = firstLegal(state, [{ type: "act", id: "eatOut" }]);
    if (eat !== null) {
      return eat;
    }
  }
  if (
    player.stats.happiness < state.goals.happiness &&
    !player.items.some((item) => item.id === "telewizor") &&
    spare >= 700
  ) {
    const tv = firstLegal(state, goDo(state, "elektro", { type: "buyItem", item: "telewizor", used: false }, 1));
    if (tv !== null) {
      return tv;
    }
  }

  // 11. Szczęście.
  if (player.stats.happiness < state.goals.happiness) {
    const comfortable = player.stats.money >= player.home.rent * 2 + REST_CAFE_COST;
    const cafe = comfortable ? firstLegal(state, goAct(state, "cafe", "restCafe")) : null;
    if (cafe !== null) {
      return cafe;
    }
    const rest = firstLegal(state, goAct(state, "home", "restHome"));
    if (rest !== null) {
      return rest;
    }
  }

  if (workplace !== null) {
    const work = firstLegal(state, goAct(state, workplace, "work"));
    if (work !== null) {
      return work;
    }
  }

  const rest = firstLegal(state, goAct(state, "home", "restHome"));
  if (rest !== null) {
    return rest;
  }

  return { type: "endWeek" };
}

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
    if (current.phase !== "playing" || player === undefined || player.controller !== "bot") {
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
