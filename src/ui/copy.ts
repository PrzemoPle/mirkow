import { assertNever } from "../game/assert-never";
import type { ActionDef } from "../game/actions";
import { DEPOSIT_PAYOUT, DEPOSIT_WEEKS } from "../game/actions";
import {
  AUKCJE_COST,
  KONTROLA_COST,
  KOREK_TIME,
  LOTTO_MONEY,
  NAPIWKI_MONEY,
  PIT_COST,
  PRALKA_COST,
  PROMOCJA_FOOD,
  TESCIOWA_HAPPINESS,
} from "../game/events";
import { getJobDef, RELIABILITY_PER_SHIFT, type JobDef } from "../game/jobs";
import type { EngineError } from "../game/result";
import type {
  ActionId,
  CompanyId,
  EconomyPhase,
  EventId,
  GameState,
  Job,
  JobId,
  NoticeId,
  WeekEffect,
} from "../game/types";
import { t, type MessageKey } from "../i18n";
import { interpolate } from "./format";

export function actionLabel(id: ActionId): string {
  return t(actionLabelKey(id));
}

function actionLabelKey(id: ActionId): MessageKey {
  switch (id) {
    case "work":
      return "actWork";
    case "openLokal":
      return "actOpenLokal";
    case "studyCourse":
      return "actStudyCourse";
    case "studyDegree":
      return "actStudyDegree";
    case "buyFood":
      return "actBuyFood";
    case "buyClothes":
      return "actBuyClothes";
    case "buySuit":
      return "actBuySuit";
    case "restHome":
      return "actRestHome";
    case "restCafe":
      return "actRestCafe";
    case "restGym":
      return "actRestGym";
    case "deposit":
      return "actDeposit";
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function actionCaption(def: ActionDef): string {
  const label = actionLabel(def.id);
  if (def.wage > 0) {
    return interpolate("actionMetaWage", { label, time: def.timeCost, money: def.wage });
  }
  if (def.moneyCost > 0) {
    return interpolate("actionMetaPaid", { label, time: def.timeCost, money: def.moneyCost });
  }
  return interpolate("actionMetaTime", { label, time: def.timeCost });
}

export function actedMessage(id: ActionId, wage: number): string {
  switch (id) {
    case "work":
      return interpolate("actedWork", { wage });
    case "openLokal":
      return t("actedOpenLokal");
    case "studyCourse":
      return t("actedStudyCourse");
    case "studyDegree":
      return t("actedStudyDegree");
    case "buyFood":
      return t("actedBuyFood");
    case "buyClothes":
      return t("actedBuyClothes");
    case "buySuit":
      return t("actedBuySuit");
    case "restHome":
      return t("actedRestHome");
    case "restCafe":
      return t("actedRestCafe");
    case "restGym":
      return t("actedRestGym");
    case "deposit":
      return interpolate("actedDeposit", { n: DEPOSIT_WEEKS });
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function companyName(id: CompanyId): string {
  switch (id) {
    case "kebab":
      return t("companyKebab");
    case "shop":
      return t("companyShop");
    case "bank":
      return t("companyBank");
    case "pup":
      return t("companyPup");
    case "depot":
      return t("companyDepot");
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function jobName(id: JobId): string {
  switch (id) {
    case "kebabPomoc":
      return t("jobKebabPomoc");
    case "kebabKasjer":
      return t("jobKebabKasjer");
    case "kebabKierownik":
      return t("jobKebabKierownik");
    case "kebabLokal":
      return t("jobKebabLokal");
    case "shopPolki":
      return t("jobShopPolki");
    case "shopKasjer":
      return t("jobShopKasjer");
    case "shopKierownik":
      return t("jobShopKierownik");
    case "bankKasjer":
      return t("jobBankKasjer");
    case "bankDoradca":
      return t("jobBankDoradca");
    case "bankDyrektor":
      return t("jobBankDyrektor");
    case "pupReferent":
      return t("jobPupReferent");
    case "pupNaczelnik":
      return t("jobPupNaczelnik");
    case "depotMonter":
      return t("jobDepotMonter");
    case "depotBrygadzista":
      return t("jobDepotBrygadzista");
    case "depotInzynier":
      return t("jobDepotInzynier");
    case "depotDyrektor":
      return t("jobDepotDyrektor");
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function jobLabel(job: Job | null): string {
  if (job === null) {
    return t("jobNone");
  }
  const def = getJobDef(job.id);
  return interpolate("jobLabel", { job: jobName(job.id), company: companyName(def.company) });
}

export function jobShort(job: Job | null): string {
  return job === null ? t("jobNoneShort") : jobName(job.id);
}

/** Wymagania stanowiska jako krótkie chipy. */
export function jobRequirements(def: JobDef): string[] {
  const out: string[] = [];
  if (def.requiredExperience > 0) {
    out.push(interpolate("jobReqExperience", { n: def.requiredExperience }));
  }
  if (def.requiredReliability > 0) {
    out.push(interpolate("jobReqReliability", { n: def.requiredReliability }));
  }
  if (def.requiredEducation > 0) {
    out.push(interpolate("jobReqEducation", { n: def.requiredEducation }));
  }
  if (def.requiresSuit) {
    out.push(t("jobReqSuit"));
  }
  return out.length === 0 ? [t("jobReqNone")] : out;
}

export function economyLabel(phase: EconomyPhase): string {
  switch (phase) {
    case "boom":
      return t("economyBoom");
    case "normal":
      return t("economyNormal");
    case "recession":
      return t("economyRecession");
    default: {
      const exhaustive: never = phase;
      return assertNever(exhaustive);
    }
  }
}

/** Efekty akcji jako krótkie chipy pod nazwą. */
export function actionEffects(def: ActionDef): string[] {
  const out: string[] = [];
  if (def.isWork) {
    out.push(interpolate("effectWork", { n: RELIABILITY_PER_SHIFT }));
  }
  if (def.opensLokal) {
    out.push(interpolate("effectLokal", { n: getJobDef("kebabLokal").prestige }));
  }
  if (def.education > 0) {
    out.push(interpolate("effectEducation", { n: def.education }));
  }
  if (def.happiness > 0) {
    out.push(interpolate("effectHappiness", { n: def.happiness }));
  }
  if (def.foodWeeks !== null) {
    out.push(interpolate("effectFood", { n: def.foodWeeks }));
  }
  if (def.clothesWeeks !== null) {
    out.push(interpolate("effectClothes", { n: def.clothesWeeks }));
  }
  if (def.suitWeeks !== null) {
    out.push(interpolate("effectSuit", { n: def.suitWeeks }));
  }
  if (def.opensDeposit) {
    out.push(interpolate("effectDepositInfo", { payout: DEPOSIT_PAYOUT, n: DEPOSIT_WEEKS }));
  }
  return out;
}

/** Jedno zdanie, dlaczego akcja jest zablokowana. */
export function blockReason(error: EngineError): string {
  switch (error.code) {
    case "noJob":
      return t("blockNoJob");
    case "alreadyThisJob":
      return t("blockAlreadyThisJob");
    case "insufficientMoney":
      return interpolate("blockMoney", { n: error.needed - error.have });
    case "tooLittleEducation":
      return interpolate("blockEducation", { have: error.have, needed: error.needed });
    case "tooLittleExperience":
      return interpolate("blockExperience", { have: error.have, needed: error.needed });
    case "tooLittleReliability":
      return interpolate("blockReliability", { have: error.have, needed: error.needed });
    case "needsSuit":
      return t("blockSuit");
    case "hiringFrozen":
      return t("blockHiringFrozen");
    case "notKierownik":
      return t("blockNotKierownik");
    case "raiseTooSoon":
      return interpolate("blockRaiseTooSoon", { have: error.have, needed: error.needed });
    case "raiseMaxed":
      return t("blockRaiseMaxed");
    case "insufficientTime":
      return interpolate("blockTime", { needed: error.needed });
    case "depositActive":
      return t("blockDeposit");
    case "wrongPhase":
    case "alreadyThere":
    case "unknownLocation":
    case "noPath":
    case "noActivePlayer":
    case "wrongLocation":
      return t("blockOther");
    default: {
      const exhaustive: never = error;
      return assertNever(exhaustive);
    }
  }
}

export function noticeTitle(id: NoticeId): string {
  switch (id) {
    case "zwolnienie":
      return t("noticeZwolnienie");
    case "redukcja":
      return t("noticeRedukcja");
    case "podwyzka":
      return t("noticePodwyzka");
    case "awans":
      return t("noticeAwans");
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function noticeEffect(id: NoticeId): string {
  switch (id) {
    case "zwolnienie":
      return t("noticeZwolnienieEffect");
    case "redukcja":
      return t("noticeRedukcjaEffect");
    case "podwyzka":
      return t("noticePodwyzkaEffect");
    case "awans":
      return t("noticeAwansEffect");
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function eventTitle(id: EventId): string {
  switch (id) {
    case "korek":
      return t("eventTitleKorek");
    case "lotto":
      return t("eventTitleLotto");
    case "pralka":
      return t("eventTitlePralka");
    case "tesciowa":
      return t("eventTitleTesciowa");
    case "aukcje":
      return t("eventTitleAukcje");
    case "kontrola":
      return t("eventTitleKontrola");
    case "pit":
      return t("eventTitlePit");
    case "promocja":
      return t("eventTitlePromocja");
    case "napiwki":
      return t("eventTitleNapiwki");
    case "spokoj":
      return t("eventTitleSpokoj");
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function eventEffect(id: EventId): string {
  switch (id) {
    case "korek":
      return interpolate("eventEffectTime", { n: KOREK_TIME });
    case "lotto":
      return interpolate("eventEffectMoneyPlus", { n: LOTTO_MONEY });
    case "pralka":
      return interpolate("eventEffectMoneyMinus", { n: PRALKA_COST });
    case "tesciowa":
      return interpolate("eventEffectHappiness", { n: TESCIOWA_HAPPINESS });
    case "aukcje":
      return interpolate("eventEffectMoneyMinus", { n: AUKCJE_COST });
    case "kontrola":
      return interpolate("eventEffectMoneyMinus", { n: KONTROLA_COST });
    case "pit":
      return interpolate("eventEffectMoneyMinus", { n: PIT_COST });
    case "promocja":
      return interpolate("eventEffectFood", { n: PROMOCJA_FOOD });
    case "napiwki":
      return interpolate("eventEffectMoneyPlus", { n: NAPIWKI_MONEY });
    case "spokoj":
      return t("eventEffectNone");
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function effectLine(effect: WeekEffect): string {
  switch (effect.kind) {
    case "rent":
      return interpolate("effectRent", { amount: effect.amount });
    case "rentHike":
      return interpolate("effectRentHike", { amount: effect.amount });
    case "hunger":
      return interpolate("effectHunger", { n: effect.timeLost });
    case "noClothes":
      return interpolate("effectNoClothes", { n: effect.happinessLost });
    case "shopPrices":
      return interpolate("effectShopPrices", { food: effect.food, clothes: effect.clothes });
    case "event":
      return eventMessage(effect.id);
    case "deposit":
      return interpolate("effectDepositPaid", { amount: effect.amount });
    case "fired":
      return effect.reason === "reliability"
        ? interpolate("effectFired", { job: jobName(effect.job) })
        : interpolate("effectReduction", { job: jobName(effect.job) });
    case "economy": {
      if (effect.phase === "boom") {
        return t("effectEconomyBoom");
      }
      if (effect.phase === "normal") {
        return t("effectEconomyNormal");
      }
      return interpolate("effectEconomyRecession", {
        company: effect.hiringFrozen === null ? "" : companyName(effect.hiringFrozen),
      });
    }
    case "safetyNet": {
      switch (effect.grant) {
        case "ciocia":
          return interpolate("effectSafetyCiocia", { amount: effect.amount });
        case "mops":
          return interpolate("effectSafetyMops", { amount: effect.amount });
        default: {
          const exhaustive: never = effect.grant;
          return assertNever(exhaustive);
        }
      }
    }
    default: {
      const exhaustive: never = effect;
      return assertNever(exhaustive);
    }
  }
}

export function eventMessage(id: EventId | null): string {
  if (id === null) {
    return "";
  }
  switch (id) {
    case "korek":
      return interpolate("eventKorek", { n: KOREK_TIME });
    case "lotto":
      return interpolate("eventLotto", { amount: LOTTO_MONEY });
    case "pralka":
      return interpolate("eventPralka", { amount: PRALKA_COST });
    case "tesciowa":
      return interpolate("eventTesciowa", { n: TESCIOWA_HAPPINESS });
    case "aukcje":
      return interpolate("eventAukcje", { amount: AUKCJE_COST });
    case "kontrola":
      return interpolate("eventKontrola", { amount: KONTROLA_COST });
    case "pit":
      return interpolate("eventPit", { amount: PIT_COST });
    case "promocja":
      return interpolate("eventPromocja", { n: PROMOCJA_FOOD });
    case "napiwki":
      return interpolate("eventNapiwki", { amount: NAPIWKI_MONEY });
    case "spokoj":
      return t("eventSpokoj");
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function weekStatus(state: GameState): string {
  const lines = [
    t("weekEnded"),
    ...state.lastWeekEffects.filter((effect) => effect.kind !== "event").map(effectLine),
  ];
  return lines.join(" ");
}
