import { assertNever } from "../game/assert-never";
import type { ActionDef } from "../game/actions";
import type { EngineError } from "../game/result";
import type { ActionId, EventId, GameState, Job, WeekEffect } from "../game/types";
import {
  AUKCJE_COST,
  KONTROLA_COST,
  KOREK_TIME,
  LOTTO_MONEY,
  PIT_COST,
  PRALKA_COST,
  PROMOCJA_FOOD,
  TESCIOWA_HAPPINESS,
} from "../game/events";
import { t, type MessageKey } from "../i18n";
import { interpolate } from "./format";

export function actionLabel(id: ActionId): string {
  return t(actionLabelKey(id));
}

function actionLabelKey(id: ActionId): MessageKey {
  switch (id) {
    case "searchJob":
      return "actSearchJob";
    case "applyKierownik":
      return "actApplyKierownik";
    case "openLokal":
      return "actOpenLokal";
    case "workKebab":
      return "actWorkKebab";
    case "studyCourse":
      return "actStudyCourse";
    case "studyDegree":
      return "actStudyDegree";
    case "buyFood":
      return "actBuyFood";
    case "buyClothes":
      return "actBuyClothes";
    case "restHome":
      return "actRestHome";
    case "restCafe":
      return "actRestCafe";
    case "restGym":
      return "actRestGym";
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function actionCaption(def: ActionDef): string {
  const label = t(actionLabelKey(def.id));
  if (def.wage > 0) {
    return interpolate("actionMetaWage", {
      label,
      time: def.timeCost,
      money: def.wage,
    });
  }
  if (def.moneyCost > 0) {
    return interpolate("actionMetaPaid", {
      label,
      time: def.timeCost,
      money: def.moneyCost,
    });
  }
  return interpolate("actionMetaTime", { label, time: def.timeCost });
}

export function actedMessage(id: ActionId, wage: number): string {
  switch (id) {
    case "searchJob":
      return t("actedSearchJob");
    case "applyKierownik":
      return t("actedApplyKierownik");
    case "openLokal":
      return t("actedOpenLokal");
    case "workKebab":
      return interpolate("actedWorkKebab", { wage });
    case "studyCourse":
      return t("actedStudyCourse");
    case "studyDegree":
      return t("actedStudyDegree");
    case "buyFood":
      return t("actedBuyFood");
    case "buyClothes":
      return t("actedBuyClothes");
    case "restHome":
      return t("actedRestHome");
    case "restCafe":
      return t("actedRestCafe");
    case "restGym":
      return t("actedRestGym");
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function jobShort(job: Job | null): string {
  if (job === null) {
    return t("jobNoneShort");
  }
  switch (job.id) {
    case "kebabKasjer":
      return t("jobKebabKasjerShort");
    case "kebabKierownik":
      return t("jobKebabKierownikShort");
    case "kebabLokal":
      return t("jobKebabLokalShort");
    default: {
      const exhaustive: never = job.id;
      return assertNever(exhaustive);
    }
  }
}

/** Efekty akcji jako krótkie chipy pod nazwą. */
export function actionEffects(def: ActionDef): string[] {
  const out: string[] = [];
  if (def.givesJob !== null) {
    out.push(def.id === "searchJob" ? t("effectJob") : t("effectPromotion"));
  }
  if (def.education > 0) {
    out.push(interpolate("effectEducation", { n: def.education }));
  }
  if (def.happiness > 0) {
    out.push(interpolate("effectHappiness", { n: def.happiness }));
  }
  if (def.career > 0) {
    out.push(interpolate("effectCareer", { n: def.career }));
  }
  if (def.foodWeeks !== null) {
    out.push(interpolate("effectFood", { n: def.foodWeeks }));
  }
  if (def.clothesWeeks !== null) {
    out.push(interpolate("effectClothes", { n: def.clothesWeeks }));
  }
  return out;
}

/** Jedno zdanie, dlaczego akcja jest zablokowana. */
export function blockReason(error: EngineError): string {
  switch (error.code) {
    case "noJob":
      return t("blockNoJob");
    case "alreadyEmployed":
      return t("blockEmployed");
    case "insufficientMoney":
      return interpolate("blockMoney", { n: error.needed - error.have });
    case "tooLittleEducation":
      return interpolate("blockEducation", { have: error.have, needed: error.needed });
    case "tooLittleTenure":
      return interpolate("blockTenure", { have: error.have, needed: error.needed });
    case "insufficientTime":
      return interpolate("blockTime", { needed: error.needed });
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
  switch (job.id) {
    case "kebabKasjer":
      return t("jobKebabKasjer");
    case "kebabKierownik":
      return t("jobKebabKierownik");
    case "kebabLokal":
      return t("jobKebabLokal");
    default: {
      const exhaustive: never = job.id;
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
      return interpolate("effectShopPrices", {
        food: effect.food,
        clothes: effect.clothes,
      });
    case "event":
      return eventMessage(effect.id);
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
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function weekStatus(state: GameState): string {
  const lines = [
    t("weekEnded"),
    ...state.lastWeekEffects
      .filter((effect) => effect.kind !== "event")
      .map(effectLine),
  ];
  return lines.join(" ");
}
