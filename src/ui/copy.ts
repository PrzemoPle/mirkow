import { assertNever } from "../game/assert-never";
import type { ActionDef } from "../game/actions";
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

function effectLine(effect: WeekEffect): string {
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
