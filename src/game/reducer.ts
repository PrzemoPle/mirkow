import { TIME_MAX } from "./catalog";
import {
  resolveAction,
  BARE_HAPPINESS_PENALTY,
  DEPOSIT_PAYOUT,
  DEPOSIT_WEEKS,
  HUNGER_TIME_PENALTY,
  RENT_INTERVAL_WEEKS,
  type ActionDef,
} from "./actions";
import { BOT_NAME, pickBotAvatar } from "./avatars";
import { getEventDef, pickEvent } from "./events";
import { pricesChanged, RENT_HIKE, RENT_MAX, rollShopPrices, startingMarket } from "./market";
import { createPlayer, startingStats } from "./state";
import { assertNever } from "./assert-never";
import { isLocationId, travelCost } from "./board";
import { fail, ok, type EngineResult } from "./result";
import { advanceRng } from "./rng";
import {
  AUNT_HELP,
  METER_MAX,
  MOPS_HELP,
  type ActionId,
  type GameAction,
  type GameState,
  type Player,
  type Stats,
  type WeekEffect,
} from "./types";

function getActive(state: GameState): Player | undefined {
  return state.players[state.active];
}

function replaceActive(state: GameState, player: Player): GameState {
  return {
    ...state,
    players: state.players.map((candidate, index) =>
      index === state.active ? player : candidate,
    ),
  };
}

function clampMeter(value: number): number {
  return Math.min(METER_MAX, Math.max(0, value));
}

function hasWon(state: GameState, player: Player): boolean {
  return (
    player.stats.money >= state.goals.money &&
    player.stats.happiness >= state.goals.happiness &&
    player.stats.education >= state.goals.education &&
    player.stats.career >= state.goals.career
  );
}

function withVictory(state: GameState): GameState {
  const player = getActive(state);
  if (player === undefined || state.phase !== "playing") {
    return state;
  }
  if (!hasWon(state, player)) {
    return state;
  }
  return { ...state, phase: "victory" };
}

function applySafetyNet(state: GameState): GameState {
  const player = getActive(state);
  if (player === undefined || player.stats.money > 0) {
    return state;
  }

  const roll = advanceRng(state.rngSeed);
  const kind = roll.value < 0.5 ? "ciocia" : "mops";
  const amount = kind === "ciocia" ? AUNT_HELP : MOPS_HELP;

  return {
    ...replaceActive(state, {
      ...player,
      stats: { ...player.stats, money: player.stats.money + amount },
    }),
    rngSeed: roll.seed,
    lastSafetyNet: kind,
  };
}

function spendTime(state: GameState, needed: number): EngineResult {
  if (state.phase !== "playing") {
    return fail({ code: "wrongPhase", phase: state.phase });
  }
  if (state.timeLeft < needed) {
    return fail({
      code: "insufficientTime",
      needed,
      have: state.timeLeft,
    });
  }
  return ok({ ...state, timeLeft: state.timeLeft - needed });
}

function startMatch(
  state: GameState,
  action: Extract<GameAction, { type: "start" }>,
): EngineResult {
  if (state.phase !== "setup") {
    return fail({ code: "wrongPhase", phase: state.phase });
  }

  const human = createPlayer({
    id: "p1",
    controller: "human",
    name: action.name,
    avatarId: action.avatarId,
    locationId: "home",
    stats: startingStats(),
  });
  const bot = createPlayer({
    id: "p2",
    controller: "bot",
    name: BOT_NAME,
    avatarId: pickBotAvatar(action.avatarId),
    locationId: "home",
    stats: startingStats(),
  });

  return ok({
    ...state,
    phase: "playing",
    week: 1,
    timeLeft: TIME_MAX,
    timeMax: TIME_MAX,
    goals: action.goals,
    players: [human, bot],
    active: 0,
    rngSeed: action.rngSeed ?? state.rngSeed,
    lastSafetyNet: null,
    lastEvent: null,
    lastWeekEffects: [],
    market: startingMarket(),
  });
}

function moveTo(state: GameState, to: string): EngineResult {
  if (state.phase !== "playing") {
    return fail({ code: "wrongPhase", phase: state.phase });
  }
  if (!isLocationId(to)) {
    return fail({ code: "unknownLocation" });
  }

  const player = getActive(state);
  if (player === undefined) {
    return fail({ code: "noActivePlayer" });
  }
  if (player.locationId === to) {
    return fail({ code: "alreadyThere" });
  }

  const needed = travelCost(player.locationId, to);
  if (needed === null) {
    return fail({ code: "noPath" });
  }
  const spent = spendTime(state, needed);
  if (!spent.ok) {
    return spent;
  }

  return ok(
    replaceActive(spent.state, {
      ...player,
      locationId: to,
    }),
  );
}

function applyAction(state: GameState, def: ActionDef): EngineResult {
  if (state.phase !== "playing") {
    return fail({ code: "wrongPhase", phase: state.phase });
  }

  const player = getActive(state);
  if (player === undefined) {
    return fail({ code: "noActivePlayer" });
  }
  if (player.locationId !== def.locationId) {
    return fail({
      code: "wrongLocation",
      here: player.locationId,
      needed: def.locationId,
    });
  }
  if (def.rejectIfEmployed && player.job !== null) {
    return fail({ code: "alreadyEmployed" });
  }
  if (def.requiredJobs !== null) {
    if (player.job === null || !def.requiredJobs.includes(player.job.id)) {
      return fail({ code: "noJob" });
    }
  }
  if (player.stats.education < def.requiredEducation) {
    return fail({
      code: "tooLittleEducation",
      needed: def.requiredEducation,
      have: player.stats.education,
    });
  }
  if (def.requiredWeeks > 0) {
    const weeks = player.job?.weeks ?? 0;
    if (weeks < def.requiredWeeks) {
      return fail({
        code: "tooLittleTenure",
        needed: def.requiredWeeks,
        have: weeks,
      });
    }
  }
  if (def.opensDeposit && player.deposit !== null) {
    return fail({ code: "depositActive" });
  }
  if (player.stats.money < def.moneyCost) {
    return fail({
      code: "insufficientMoney",
      needed: def.moneyCost,
      have: player.stats.money,
    });
  }

  const spent = spendTime(state, def.timeCost);
  if (!spent.ok) {
    return spent;
  }

  const current = getActive(spent.state);
  if (current === undefined) {
    return fail({ code: "noActivePlayer" });
  }

  const nextStats: Stats = {
    money: current.stats.money - def.moneyCost + def.wage,
    happiness: clampMeter(current.stats.happiness + def.happiness),
    education: clampMeter(current.stats.education + def.education),
    career: clampMeter(current.stats.career + def.career),
  };

  return ok(
    withVictory(
      replaceActive(spent.state, {
        ...current,
        stats: nextStats,
        job:
          def.givesJob !== null
            ? { id: def.givesJob, weeks: 0 }
            : current.job,
        deposit: def.opensDeposit
          ? { amount: def.moneyCost, payout: DEPOSIT_PAYOUT, weeksLeft: DEPOSIT_WEEKS }
          : current.deposit,
        needs: {
          foodWeeks:
            def.foodWeeks !== null ? def.foodWeeks : current.needs.foodWeeks,
          clothesWeeks:
            def.clothesWeeks !== null
              ? def.clothesWeeks
              : current.needs.clothesWeeks,
        },
      }),
    ),
  );
}

function performAct(state: GameState, actionId: ActionId): EngineResult {
  switch (actionId) {
    case "searchJob":
    case "applyKierownik":
    case "openLokal":
    case "workKebab":
    case "studyCourse":
    case "studyDegree":
    case "buyFood":
    case "buyClothes":
    case "restHome":
    case "restCafe":
    case "restGym":
    case "deposit":
      return applyAction(state, resolveAction(state, actionId));
    default: {
      const exhaustive: never = actionId;
      return assertNever(exhaustive);
    }
  }
}

function chargeRent(state: GameState): GameState {
  if (state.week % RENT_INTERVAL_WEEKS !== 0) {
    return state;
  }

  const player = getActive(state);
  if (player === undefined) {
    return state;
  }

  const amount = player.home.rent;
  const nextRent = Math.min(RENT_MAX, amount + RENT_HIKE);
  return {
    ...replaceActive(state, {
      ...player,
      stats: { ...player.stats, money: player.stats.money - amount },
      home: { ...player.home, rent: nextRent },
    }),
    lastWeekEffects: [
      ...state.lastWeekEffects,
      { kind: "rent", amount },
      { kind: "rentHike", amount: nextRent },
    ],
  };
}

function payDeposit(state: GameState): GameState {
  const player = getActive(state);
  if (player === undefined || player.deposit === null) {
    return state;
  }
  const weeksLeft = player.deposit.weeksLeft - 1;
  if (weeksLeft > 0) {
    return replaceActive(state, { ...player, deposit: { ...player.deposit, weeksLeft } });
  }
  const amount = player.deposit.payout;
  return {
    ...replaceActive(state, {
      ...player,
      deposit: null,
      stats: { ...player.stats, money: player.stats.money + amount },
    }),
    lastWeekEffects: [...state.lastWeekEffects, { kind: "deposit", amount }],
  };
}

function rollMarket(state: GameState): GameState {
  const rolled = rollShopPrices(state.rngSeed);
  const effects: WeekEffect[] = [...state.lastWeekEffects];
  if (pricesChanged(state.market, rolled.market)) {
    effects.push({
      kind: "shopPrices",
      food: rolled.market.food,
      clothes: rolled.market.clothes,
    });
  }
  return {
    ...state,
    market: rolled.market,
    rngSeed: rolled.seed,
    lastWeekEffects: effects,
  };
}

function applyEventHit(state: GameState): GameState {
  const player = getActive(state);
  if (player === undefined) {
    return state;
  }

  const picked = pickEvent(state.rngSeed);
  const def = getEventDef(picked.id);

  return {
    ...replaceActive(state, {
      ...player,
      lastEvent: picked.id,
      stats: {
        ...player.stats,
        money: player.stats.money + def.money,
        happiness: clampMeter(player.stats.happiness + def.happiness),
      },
    }),
    rngSeed: picked.seed,
    lastEvent: picked.id,
    lastWeekEffects: [
      ...state.lastWeekEffects,
      { kind: "event", id: picked.id },
    ],
  };
}

function applyEventFood(state: GameState): GameState {
  if (state.lastEvent === null) {
    return state;
  }

  const def = getEventDef(state.lastEvent);
  if (def.foodWeeks === 0) {
    return state;
  }

  const player = getActive(state);
  if (player === undefined) {
    return state;
  }

  return replaceActive(state, {
    ...player,
    needs: {
      ...player.needs,
      foodWeeks: Math.max(0, player.needs.foodWeeks + def.foodWeeks),
    },
  });
}

function applyEventTime(state: GameState): GameState {
  if (state.lastEvent === null) {
    return state;
  }

  const def = getEventDef(state.lastEvent);
  if (def.timeLost <= 0) {
    return state;
  }

  return {
    ...state,
    timeLeft: Math.max(0, state.timeLeft - def.timeLost),
  };
}

function withSafetyNetEffect(state: GameState): GameState {
  const supported = applySafetyNet(state);
  if (supported.lastSafetyNet === null) {
    return supported;
  }

  const grant = supported.lastSafetyNet;
  const amount = grant === "ciocia" ? AUNT_HELP : MOPS_HELP;
  return {
    ...supported,
    lastWeekEffects: [
      ...supported.lastWeekEffects,
      { kind: "safetyNet", grant, amount },
    ],
  };
}

function decayNeeds(state: GameState): GameState {
  const player = getActive(state);
  if (player === undefined) {
    return state;
  }

  return replaceActive(state, {
    ...player,
    needs: {
      foodWeeks: Math.max(0, player.needs.foodWeeks - 1),
      clothesWeeks: Math.max(0, player.needs.clothesWeeks - 1),
    },
    job: player.job === null ? null : { ...player.job, weeks: player.job.weeks + 1 },
  });
}

function applyNeedPenalties(state: GameState): GameState {
  const player = getActive(state);
  if (player === undefined) {
    return state;
  }

  const effects: WeekEffect[] = [...state.lastWeekEffects];
  let timeLeft: number = state.timeMax;
  let nextPlayer = player;

  if (nextPlayer.needs.foodWeeks === 0) {
    timeLeft = Math.max(0, timeLeft - HUNGER_TIME_PENALTY);
    effects.push({ kind: "hunger", timeLost: HUNGER_TIME_PENALTY });
  }

  if (nextPlayer.needs.clothesWeeks === 0) {
    nextPlayer = {
      ...nextPlayer,
      stats: {
        ...nextPlayer.stats,
        happiness: clampMeter(
          nextPlayer.stats.happiness - BARE_HAPPINESS_PENALTY,
        ),
      },
    };
    effects.push({
      kind: "noClothes",
      happinessLost: BARE_HAPPINESS_PENALTY,
    });
  }

  return {
    ...replaceActive(state, nextPlayer),
    timeLeft,
    lastWeekEffects: effects,
  };
}

function endWeek(state: GameState): EngineResult {
  if (state.phase !== "playing") {
    return fail({ code: "wrongPhase", phase: state.phase });
  }
  if (getActive(state) === undefined) {
    return fail({ code: "noActivePlayer" });
  }

  const cleared: GameState = {
    ...state,
    lastSafetyNet: null,
    lastEvent: null,
    lastWeekEffects: [],
  };
  const rented = payDeposit(chargeRent(cleared));
  const evented = applyEventHit(rented);
  const supported = withSafetyNetEffect(evented);
  const settled = withVictory(supported);
  if (settled.phase === "victory") {
    return ok(settled);
  }

  const decayed = decayNeeds(settled);
  const fed = applyEventFood(decayed);
  const penalized = applyNeedPenalties(fed);
  const timed = applyEventTime(penalized);
  const finished = getActive(timed);
  if (finished === undefined) {
    return fail({ code: "noActivePlayer" });
  }

  const stored = replaceActive(timed, {
    ...finished,
    nextTimeLeft: timed.timeLeft,
    lastEvent: timed.lastEvent,
  });
  const nextIndex = (stored.active + 1) % stored.players.length;
  const incoming = stored.players[nextIndex];
  if (incoming === undefined) {
    return fail({ code: "noActivePlayer" });
  }

  const handed: GameState = {
    ...stored,
    active: nextIndex,
    timeLeft: incoming.nextTimeLeft,
  };

  if (nextIndex !== 0) {
    return ok(handed);
  }

  const priced = rollMarket(handed);
  return ok({
    ...priced,
    week: priced.week + 1,
  });
}

export function dispatch(state: GameState, action: GameAction): EngineResult {
  switch (action.type) {
    case "start":
      return startMatch(state, action);
    case "move":
      return moveTo(state, action.to);
    case "act":
      return performAct(state, action.id);
    case "endWeek":
      return endWeek(state);
    default: {
      const exhaustive: never = action;
      return assertNever(exhaustive);
    }
  }
}
