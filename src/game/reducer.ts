import { TIME_MAX } from "./catalog";
import {
  resolveAction,
  BARE_HAPPINESS_PENALTY,
  DEPOSIT_PAYOUT,
  DEPOSIT_WEEKS,
  HUNGER_HAPPINESS_PENALTY,
  HUNGER_TIME_PENALTY,
  RENT_INTERVAL_WEEKS,
  type ActionDef,
} from "./actions";
import { BOT_NAME, pickBotAvatar } from "./avatars";
import {
  isEconomyWeek,
  priceMultiplier,
  REDUCTION_CHANCE,
  REDUCTION_MARGIN,
  rollEconomy,
} from "./economy";
import { getEventDef, pickEvent } from "./events";
import {
  FIRE_MARGIN,
  getJobDef,
  HIRE_HAPPINESS,
  RAISE_MAX,
  RAISE_RELIABILITY_MARGIN,
  RAISE_TENURE_BONUS,
  RAISE_TIME,
  APPLY_TIME,
  RELIABILITY_DECAY,
  RELIABILITY_PER_SHIFT,
  COMPANY_DEFS,
} from "./jobs";
import { pricesChanged, RENT_HIKE, RENT_MAX, rollShopPrices, startingMarket } from "./market";
import { startingEconomy } from "./economy";
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
  type JobId,
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
    economy: startingEconomy(),
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

/** Wspólne bramki dla akcji i stanowisk: strój, solidność, staż. */
function checkJobRequirements(player: Player, jobId: JobId): EngineResult | null {
  const def = getJobDef(jobId);
  if (player.experience < def.requiredExperience) {
    return fail({ code: "tooLittleExperience", needed: def.requiredExperience, have: player.experience });
  }
  if (player.reliability < def.requiredReliability) {
    return fail({ code: "tooLittleReliability", needed: def.requiredReliability, have: player.reliability });
  }
  if (player.stats.education < def.requiredEducation) {
    return fail({ code: "tooLittleEducation", needed: def.requiredEducation, have: player.stats.education });
  }
  if (def.requiresSuit && player.needs.suitWeeks <= 0) {
    return fail({ code: "needsSuit" });
  }
  return null;
}

function applyAction(state: GameState, def: ActionDef): EngineResult {
  if (state.phase !== "playing") {
    return fail({ code: "wrongPhase", phase: state.phase });
  }

  const player = getActive(state);
  if (player === undefined) {
    return fail({ code: "noActivePlayer" });
  }
  if (def.isWork && player.job === null) {
    return fail({ code: "noJob" });
  }
  if (def.locationId !== null && player.locationId !== def.locationId) {
    return fail({
      code: "wrongLocation",
      here: player.locationId,
      needed: def.locationId,
    });
  }
  if (def.isWork && player.job !== null && getJobDef(player.job.id).requiresSuit && player.needs.suitWeeks <= 0) {
    return fail({ code: "needsSuit" });
  }
  if (def.opensLokal) {
    if (player.job?.id !== "kebabKierownik") {
      return fail({ code: "notKierownik" });
    }
    const blocked = checkJobRequirements(player, "kebabLokal");
    if (blocked !== null) {
      return blocked;
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

  const lokal = def.opensLokal ? getJobDef("kebabLokal") : null;
  const nextStats: Stats = {
    money: current.stats.money - def.moneyCost + def.wage,
    happiness: clampMeter(current.stats.happiness + def.happiness + (lokal !== null ? HIRE_HAPPINESS : 0)),
    education: clampMeter(current.stats.education + def.education),
    career: lokal !== null ? lokal.prestige : current.stats.career,
  };

  return ok(
    withVictory(
      replaceActive(spent.state, {
        ...current,
        stats: nextStats,
        job: lokal !== null ? { id: "kebabLokal", weeks: 0, raises: 0 } : current.job,
        experience: def.isWork ? current.experience + 1 : current.experience,
        reliability: def.isWork
          ? clampMeter(current.reliability + RELIABILITY_PER_SHIFT)
          : current.reliability,
        needs: {
          foodWeeks: def.foodWeeks !== null ? def.foodWeeks : current.needs.foodWeeks,
          clothesWeeks: def.clothesWeeks !== null ? def.clothesWeeks : current.needs.clothesWeeks,
          suitWeeks: def.suitWeeks !== null ? def.suitWeeks : current.needs.suitWeeks,
        },
        deposit: def.opensDeposit
          ? { amount: def.moneyCost, payout: DEPOSIT_PAYOUT, weeksLeft: DEPOSIT_WEEKS }
          : current.deposit,
      }),
    ),
  );
}

function performAct(state: GameState, actionId: ActionId): EngineResult {
  switch (actionId) {
    case "work":
    case "openLokal":
    case "studyCourse":
    case "studyDegree":
    case "buyFood":
    case "buyClothes":
    case "buySuit":
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

/** Podanie o pracę w PUP. Można też zejść niżej albo zmienić firmę. */
function applyForJob(state: GameState, jobId: JobId): EngineResult {
  if (state.phase !== "playing") {
    return fail({ code: "wrongPhase", phase: state.phase });
  }
  const player = getActive(state);
  if (player === undefined) {
    return fail({ code: "noActivePlayer" });
  }
  if (player.locationId !== "pup") {
    return fail({ code: "wrongLocation", here: player.locationId, needed: "pup" });
  }
  const def = getJobDef(jobId);
  if (def.hiddenInPup) {
    return fail({ code: "notKierownik" });
  }
  if (player.job?.id === jobId) {
    return fail({ code: "alreadyThisJob" });
  }
  if (state.economy.hiringFrozen === def.company) {
    return fail({ code: "hiringFrozen" });
  }
  const blocked = checkJobRequirements(player, jobId);
  if (blocked !== null) {
    return blocked;
  }
  const spent = spendTime(state, APPLY_TIME);
  if (!spent.ok) {
    return spent;
  }
  const current = getActive(spent.state);
  if (current === undefined) {
    return fail({ code: "noActivePlayer" });
  }
  const promotion = current.job === null || def.prestige > getJobDef(current.job.id).prestige;
  return ok(
    withVictory(
      replaceActive(spent.state, {
        ...current,
        job: { id: jobId, weeks: 0, raises: 0 },
        stats: {
          ...current.stats,
          career: def.prestige,
          happiness: clampMeter(current.stats.happiness + (promotion ? HIRE_HAPPINESS : 0)),
        },
        lastNotice: promotion && current.job !== null ? "awans" : current.lastNotice,
      }),
    ),
  );
}

function askRaise(state: GameState): EngineResult {
  if (state.phase !== "playing") {
    return fail({ code: "wrongPhase", phase: state.phase });
  }
  const player = getActive(state);
  if (player === undefined) {
    return fail({ code: "noActivePlayer" });
  }
  if (player.locationId !== "pup") {
    return fail({ code: "wrongLocation", here: player.locationId, needed: "pup" });
  }
  if (player.job === null) {
    return fail({ code: "noJob" });
  }
  const def = getJobDef(player.job.id);
  if (player.job.raises >= RAISE_MAX) {
    return fail({ code: "raiseMaxed" });
  }
  const neededWeeks = RAISE_TENURE_BONUS * (player.job.raises + 1);
  if (player.job.weeks < neededWeeks) {
    return fail({ code: "raiseTooSoon", needed: neededWeeks, have: player.job.weeks });
  }
  const neededReliability = def.requiredReliability + RAISE_RELIABILITY_MARGIN;
  if (player.reliability < neededReliability) {
    return fail({ code: "tooLittleReliability", needed: neededReliability, have: player.reliability });
  }
  const spent = spendTime(state, RAISE_TIME);
  if (!spent.ok) {
    return spent;
  }
  const current = getActive(spent.state);
  if (current === undefined || current.job === null) {
    return fail({ code: "noActivePlayer" });
  }
  return ok(
    replaceActive(spent.state, {
      ...current,
      job: { ...current.job, raises: current.job.raises + 1 },
      stats: { ...current.stats, happiness: clampMeter(current.stats.happiness + HIRE_HAPPINESS) },
      lastNotice: "podwyzka",
    }),
  );
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
  const rolled = rollShopPrices(state.rngSeed, priceMultiplier(state.economy.phase));
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

function rollEconomyIfDue(state: GameState): GameState {
  if (!isEconomyWeek(state.week)) {
    return state;
  }
  const rolled = rollEconomy(state.rngSeed);
  return {
    ...state,
    economy: rolled.economy,
    rngSeed: rolled.seed,
    lastWeekEffects: [
      ...state.lastWeekEffects,
      { kind: "economy", phase: rolled.economy.phase, hiringFrozen: rolled.economy.hiringFrozen },
    ],
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
      suitWeeks: Math.max(0, player.needs.suitWeeks - 1),
    },
    job: player.job === null ? null : { ...player.job, weeks: player.job.weeks + 1 },
    reliability: Math.max(0, player.reliability - RELIABILITY_DECAY),
  });
}

/** Zwolnienie: solidność za nisko albo redukcja w recesji. */
function checkEmployment(state: GameState): GameState {
  const player = getActive(state);
  if (player === undefined || player.job === null) {
    return state;
  }
  const def = getJobDef(player.job.id);
  const fire = (reason: "reliability" | "reduction", seed: number): GameState => ({
    ...replaceActive(state, {
      ...player,
      job: null,
      stats: { ...player.stats, career: 0 },
      lastNotice: reason === "reliability" ? "zwolnienie" : "redukcja",
    }),
    rngSeed: seed,
    lastWeekEffects: [...state.lastWeekEffects, { kind: "fired", job: def.id, reason }],
  });

  if (player.reliability < def.requiredReliability - FIRE_MARGIN) {
    return fire("reliability", state.rngSeed);
  }
  if (
    state.economy.phase === "recession" &&
    player.job.id !== "kebabLokal" &&
    player.reliability < def.requiredReliability + REDUCTION_MARGIN
  ) {
    const roll = advanceRng(state.rngSeed);
    if (roll.value < REDUCTION_CHANCE) {
      return fire("reduction", roll.seed);
    }
    return { ...state, rngSeed: roll.seed };
  }
  return state;
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
    nextPlayer = {
      ...nextPlayer,
      stats: {
        ...nextPlayer.stats,
        happiness: clampMeter(nextPlayer.stats.happiness - HUNGER_HAPPINESS_PENALTY),
      },
    };
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
  const active = getActive(state);
  if (active === undefined) {
    return fail({ code: "noActivePlayer" });
  }

  const cleared: GameState = {
    ...replaceActive(state, { ...active, lastNotice: null }),
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
  const employed = checkEmployment(decayed);
  const fed = applyEventFood(employed);
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

  const economy = rollEconomyIfDue(handed);
  const priced = rollMarket(economy);
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
    case "apply":
      return applyForJob(state, action.job);
    case "askRaise":
      return askRaise(state);
    case "endWeek":
      return endWeek(state);
    default: {
      const exhaustive: never = action;
      return assertNever(exhaustive);
    }
  }
}

export { COMPANY_DEFS };
