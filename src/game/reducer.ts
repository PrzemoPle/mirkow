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
import {
  DIPLOMA_HAPPINESS,
  EXAM_FAIL_HAPPINESS,
  educationPoints,
  examChance,
  FIRST_DIPLOMA_HAPPINESS,
  getDiplomaDef,
  hasDiploma,
  prerequisiteMet,
} from "./diplomas";
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
import { pricesChanged, rollShopPrices, startingMarket } from "./market";
import { getHomeDef, homeRank, leaseRent, RELOCATE_TIME, THEFT_CHANCE, THEFT_CHANCE_LOADED, THEFT_LOADED_ITEMS } from "./homes";
import {
  BREAK_CHANCE_NEW,
  BREAK_CHANCE_USED,
  BUY_ITEM_TIME,
  COMPUTER_CLASS_TIME_SAVED,
  COMPUTER_EXAM_BONUS,
  BOOK_EXAM_BONUS,
  COUCH_REST_HAPPINESS,
  FRIDGE_FOOD_WEEKS,
  getItemDef,
  hasWorking,
  ownedItem,
  repairPrice,
  REPAIR_TIME,
  sellPrice,
  SELL_ITEM_TIME,
  usedPrice,
  WASHER_CLOTHES_WEEKS,
  weeklyItemHappiness,
} from "./items";
import { startingEconomy } from "./economy";
import { createPlayer, startingStats } from "./state";
import { assertNever } from "./assert-never";
import { isLocationId } from "./board";
import { playerTravelCost } from "./travel";
import { fail, ok, type EngineResult } from "./result";
import { advanceRng } from "./rng";
import {
  AUNT_HELP,
  HAPPINESS_DECAY,
  METER_MAX,
  MOPS_HELP,
  type ActionId,
  type DiplomaId,
  type GameAction,
  type GameState,
  type HomeId,
  type ItemId,
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

  const needed = playerTravelCost(player, player.locationId, to);
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
  for (const diploma of def.requiredDiplomas) {
    if (!hasDiploma(player, diploma)) {
      return fail({ code: "missingDiploma", diploma });
    }
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
  if ((def.isClass || def.isExam) && player.studying === null) {
    return fail({ code: "notEnrolled" });
  }
  if (def.isExam && player.studying !== null) {
    const needed = getDiplomaDef(player.studying).classes;
    const have = player.studies[player.studying]?.classes ?? 0;
    if (have < needed) {
      return fail({ code: "classesNotDone", needed, have });
    }
  }
  if (player.stats.money < def.moneyCost) {
    return fail({
      code: "insufficientMoney",
      needed: def.moneyCost,
      have: player.stats.money,
    });
  }

  const timeCost =
    def.isClass && hasWorking(player, "komputer") ? Math.max(1, def.timeCost - COMPUTER_CLASS_TIME_SAVED) : def.timeCost;
  const spent = spendTime(state, timeCost);
  if (!spent.ok) {
    return spent;
  }

  const current = getActive(spent.state);
  if (current === undefined) {
    return fail({ code: "noActivePlayer" });
  }

  if (def.isClass || def.isExam) {
    return ok(withVictory(studyStep(spent.state, current, def)));
  }

  const lokal = def.opensLokal ? getJobDef("kebabLokal") : null;
  const restBonus = def.id === "restHome" && hasWorking(current, "kanapa") ? COUCH_REST_HAPPINESS - def.happiness : 0;
  const nextStats: Stats = {
    money: current.stats.money - def.moneyCost + def.wage,
    happiness: clampMeter(current.stats.happiness + def.happiness + restBonus + (lokal !== null ? HIRE_HAPPINESS : 0)),
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
          foodWeeks:
            def.foodWeeks !== null
              ? hasWorking(current, "lodowka")
                ? FRIDGE_FOOD_WEEKS
                : def.foodWeeks
              : current.needs.foodWeeks,
          clothesWeeks:
            def.clothesWeeks !== null
              ? hasWorking(current, "pralka")
                ? WASHER_CLOTHES_WEEKS
                : def.clothesWeeks
              : current.needs.clothesWeeks,
          suitWeeks: def.suitWeeks !== null ? def.suitWeeks : current.needs.suitWeeks,
        },
        deposit: def.opensDeposit
          ? { amount: def.moneyCost, payout: DEPOSIT_PAYOUT, weeksLeft: DEPOSIT_WEEKS }
          : current.deposit,
      }),
    ),
  );
}

/** Zajęcia albo egzamin: koszt już sprawdzony, czas już odjęty. */
function studyStep(state: GameState, player: Player, def: ActionDef): GameState {
  const diplomaId = player.studying;
  if (diplomaId === null) {
    return state;
  }
  const progress = player.studies[diplomaId] ?? { classes: 0, log: [] };
  const paid = player.stats.money - def.moneyCost;

  if (def.isClass) {
    return replaceActive(state, {
      ...player,
      stats: { ...player.stats, money: paid },
      studies: {
        ...player.studies,
        [diplomaId]: { classes: progress.classes + 1, log: [...progress.log, state.week] },
      },
    });
  }

  const roll = advanceRng(state.rngSeed);
  const bonus =
    (hasWorking(player, "komputer") ? COMPUTER_EXAM_BONUS : 0) + (hasWorking(player, "encyklopedia") ? BOOK_EXAM_BONUS : 0);
  const passed = roll.value < Math.min(1, examChance(player, diplomaId, state.week) + bonus);
  const effects: WeekEffect[] = [...state.lastWeekEffects, { kind: "exam", diploma: diplomaId, passed }];
  if (!passed) {
    return {
      ...replaceActive(state, {
        ...player,
        stats: {
          ...player.stats,
          money: paid,
          happiness: clampMeter(player.stats.happiness - EXAM_FAIL_HAPPINESS),
        },
        lastNotice: "oblanyEgzamin",
      }),
      rngSeed: roll.seed,
      lastWeekEffects: effects,
    };
  }
  const diplomas: DiplomaId[] = [...player.diplomas, diplomaId];
  const remaining = { ...player.studies };
  delete remaining[diplomaId];
  return {
    ...replaceActive(state, {
      ...player,
      stats: {
        ...player.stats,
        money: paid,
        education: clampMeter(educationPoints(diplomas)),
        happiness: clampMeter(
          player.stats.happiness + (player.diplomas.length === 0 ? FIRST_DIPLOMA_HAPPINESS : DIPLOMA_HAPPINESS),
        ),
      },
      diplomas,
      studies: remaining,
      studying: null,
      lastNotice: "dyplom",
    }),
    rngSeed: roll.seed,
    lastWeekEffects: effects,
  };
}

/** Zapis do indeksu w WSMiK: darmowy i natychmiastowy, postęp poprzedniego kierunku zostaje. */
function enroll(state: GameState, diplomaId: DiplomaId): EngineResult {
  if (state.phase !== "playing") {
    return fail({ code: "wrongPhase", phase: state.phase });
  }
  const player = getActive(state);
  if (player === undefined) {
    return fail({ code: "noActivePlayer" });
  }
  if (player.locationId !== "campus") {
    return fail({ code: "wrongLocation", here: player.locationId, needed: "campus" });
  }
  if (hasDiploma(player, diplomaId)) {
    return fail({ code: "diplomaDone", diploma: diplomaId });
  }
  if (!prerequisiteMet(player, diplomaId)) {
    const needed = getDiplomaDef(diplomaId).prerequisiteAny[0] ?? diplomaId;
    return fail({ code: "prerequisiteMissing", diploma: needed });
  }
  return ok(replaceActive(state, { ...player, studying: diplomaId }));
}

function performAct(state: GameState, actionId: ActionId): EngineResult {
  switch (actionId) {
    case "work":
    case "openLokal":
    case "attendClass":
    case "takeExam":
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
  return {
    ...replaceActive(state, {
      ...player,
      stats: { ...player.stats, money: player.stats.money - amount },
    }),
    lastWeekEffects: [...state.lastWeekEffects, { kind: "rent", amount }],
  };
}

/** Przeprowadzka albo przepisanie umowy: nowa stawka z dzisiejszej koniunktury, kaucja przy wprowadzce wyżej. */
function relocate(state: GameState, homeId: HomeId): EngineResult {
  if (state.phase !== "playing") {
    return fail({ code: "wrongPhase", phase: state.phase });
  }
  const player = getActive(state);
  if (player === undefined) {
    return fail({ code: "noActivePlayer" });
  }
  if (player.locationId !== "home") {
    return fail({ code: "wrongLocation", here: player.locationId, needed: "home" });
  }
  const def = getHomeDef(homeId);
  const rent = leaseRent(homeId, state.economy.phase);
  if (homeId === player.home.id && rent >= player.home.rent) {
    return fail({ code: "sameHome" });
  }
  if (player.items.length > def.slots) {
    return fail({ code: "homeTooSmall", slots: def.slots, have: player.items.length });
  }
  const upgrade = homeRank(homeId) > homeRank(player.home.id);
  const deposit = upgrade ? rent * def.depositRents : 0;
  if (player.stats.money < deposit) {
    return fail({ code: "insufficientMoney", needed: deposit, have: player.stats.money });
  }
  const spent = spendTime(state, RELOCATE_TIME);
  if (!spent.ok) {
    return spent;
  }
  const current = getActive(spent.state);
  if (current === undefined) {
    return fail({ code: "noActivePlayer" });
  }
  return ok(
    replaceActive(spent.state, {
      ...current,
      home: { id: homeId, rent },
      stats: { ...current.stats, money: current.stats.money - deposit },
      lastNotice: homeId === current.home.id ? current.lastNotice : "przeprowadzka",
    }),
  );
}

function buyItem(state: GameState, itemId: ItemId, used: boolean): EngineResult {
  if (state.phase !== "playing") {
    return fail({ code: "wrongPhase", phase: state.phase });
  }
  const player = getActive(state);
  if (player === undefined) {
    return fail({ code: "noActivePlayer" });
  }
  const where: "elektro" | "lombard" = used ? "lombard" : "elektro";
  if (player.locationId !== where) {
    return fail({ code: "wrongLocation", here: player.locationId, needed: where });
  }
  if (ownedItem(player, itemId) !== undefined) {
    return fail({ code: "alreadyOwned", item: itemId });
  }
  const slots = getHomeDef(player.home.id).slots;
  if (player.items.length >= slots) {
    return fail({ code: "noSlot", slots });
  }
  const price = used ? usedPrice(itemId) : getItemDef(itemId).price;
  if (player.stats.money < price) {
    return fail({ code: "insufficientMoney", needed: price, have: player.stats.money });
  }
  const spent = spendTime(state, BUY_ITEM_TIME);
  if (!spent.ok) {
    return spent;
  }
  const current = getActive(spent.state);
  if (current === undefined) {
    return fail({ code: "noActivePlayer" });
  }
  return ok(
    withVictory(
      replaceActive(spent.state, {
        ...current,
        items: [...current.items, { id: itemId, used, broken: false }],
        stats: {
          ...current.stats,
          money: current.stats.money - price,
          happiness: clampMeter(current.stats.happiness + getItemDef(itemId).happinessOnBuy),
        },
      }),
    ),
  );
}

function sellItem(state: GameState, itemId: ItemId): EngineResult {
  if (state.phase !== "playing") {
    return fail({ code: "wrongPhase", phase: state.phase });
  }
  const player = getActive(state);
  if (player === undefined) {
    return fail({ code: "noActivePlayer" });
  }
  if (player.locationId !== "lombard") {
    return fail({ code: "wrongLocation", here: player.locationId, needed: "lombard" });
  }
  const item = ownedItem(player, itemId);
  if (item === undefined) {
    return fail({ code: "notOwned", item: itemId });
  }
  const spent = spendTime(state, SELL_ITEM_TIME);
  if (!spent.ok) {
    return spent;
  }
  const current = getActive(spent.state);
  if (current === undefined) {
    return fail({ code: "noActivePlayer" });
  }
  const price = item.broken ? Math.round(sellPrice(itemId) / 2 / 10) * 10 : sellPrice(itemId);
  return ok(
    withVictory(
      replaceActive(spent.state, {
        ...current,
        items: current.items.filter((entry) => entry.id !== itemId),
        stats: { ...current.stats, money: current.stats.money + price },
      }),
    ),
  );
}

function repairItem(state: GameState, itemId: ItemId): EngineResult {
  if (state.phase !== "playing") {
    return fail({ code: "wrongPhase", phase: state.phase });
  }
  const player = getActive(state);
  if (player === undefined) {
    return fail({ code: "noActivePlayer" });
  }
  if (player.locationId !== "elektro") {
    return fail({ code: "wrongLocation", here: player.locationId, needed: "elektro" });
  }
  const item = ownedItem(player, itemId);
  if (item === undefined) {
    return fail({ code: "notOwned", item: itemId });
  }
  if (!item.broken) {
    return fail({ code: "notBroken", item: itemId });
  }
  const price = repairPrice(itemId);
  if (player.stats.money < price) {
    return fail({ code: "insufficientMoney", needed: price, have: player.stats.money });
  }
  const spent = spendTime(state, REPAIR_TIME);
  if (!spent.ok) {
    return spent;
  }
  const current = getActive(spent.state);
  if (current === undefined) {
    return fail({ code: "noActivePlayer" });
  }
  return ok(
    replaceActive(spent.state, {
      ...current,
      items: current.items.map((entry) => (entry.id === itemId ? { ...entry, broken: false } : entry)),
      stats: { ...current.stats, money: current.stats.money - price },
    }),
  );
}

/** Kradzież na stancji i awarie sprzętu: losowane co tydzień. */
function wearItems(state: GameState): GameState {
  const player = getActive(state);
  if (player === undefined || player.items.length === 0) {
    return state;
  }
  let seed = state.rngSeed;
  let items = [...player.items];
  const effects: WeekEffect[] = [...state.lastWeekEffects];
  let notice = player.lastNotice;

  if (getHomeDef(player.home.id).theft) {
    const roll = advanceRng(seed);
    seed = roll.seed;
    const chance = items.length >= THEFT_LOADED_ITEMS ? THEFT_CHANCE_LOADED : THEFT_CHANCE;
    if (roll.value < chance) {
      const pick = advanceRng(seed);
      seed = pick.seed;
      const index = Math.min(items.length - 1, Math.floor(pick.value * items.length));
      const stolen = items[index];
      if (stolen !== undefined) {
        items = items.filter((_, position) => position !== index);
        effects.push({ kind: "theft", item: stolen.id });
        notice = "zdzichu";
      }
    }
  }

  items = items.map((item) => {
    if (item.broken) {
      return item;
    }
    const roll = advanceRng(seed);
    seed = roll.seed;
    if (roll.value < (item.used ? BREAK_CHANCE_USED : BREAK_CHANCE_NEW)) {
      effects.push({ kind: "itemBroke", item: item.id });
      return { ...item, broken: true };
    }
    return item;
  });

  return {
    ...replaceActive(state, { ...player, items, lastNotice: notice }),
    rngSeed: seed,
    lastWeekEffects: effects,
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
  const shielded = picked.id === "pralka" && hasWorking(player, "pralka");

  return {
    ...replaceActive(state, {
      ...player,
      lastEvent: picked.id,
      stats: {
        ...player.stats,
        money: player.stats.money + (shielded ? 0 : def.money),
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

/** Szczęście: spadek co tydzień, plus to, co dają mieszkanie i sprawny sprzęt. */
function weeklyHappiness(state: GameState): GameState {
  const player = getActive(state);
  if (player === undefined) {
    return state;
  }
  const comfort = getHomeDef(player.home.id).happinessWeekly + weeklyItemHappiness(player);
  const delta = comfort - HAPPINESS_DECAY;
  const next = replaceActive(state, {
    ...player,
    stats: { ...player.stats, happiness: clampMeter(player.stats.happiness + delta) },
  });
  return comfort > 0
    ? { ...next, lastWeekEffects: [...next.lastWeekEffects, { kind: "homeHappiness", amount: comfort }] }
    : next;
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

  const decayed = weeklyHappiness(wearItems(decayNeeds(settled)));
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
    case "enroll":
      return enroll(state, action.diploma);
    case "relocate":
      return relocate(state, action.home);
    case "buyItem":
      return buyItem(state, action.item, action.used);
    case "sellItem":
      return sellItem(state, action.item);
    case "repairItem":
      return repairItem(state, action.item);
    case "endWeek":
      return endWeek(state);
    default: {
      const exhaustive: never = action;
      return assertNever(exhaustive);
    }
  }
}

export { COMPANY_DEFS };
