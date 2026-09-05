import { assertNever } from "../game/assert-never";
import type { EngineError } from "../game/result";
import { t } from "../i18n";
import { diplomaName } from "./copy";
import { interpolate } from "./format";

export function errorMessage(error: EngineError): string {
  switch (error.code) {
    case "wrongPhase":
      return t("errorWrongPhase");
    case "insufficientTime":
      return interpolate("errorInsufficientTime", { needed: error.needed, have: error.have });
    case "alreadyThere":
      return t("errorAlreadyThere");
    case "unknownLocation":
      return t("errorUnknownLocation");
    case "noPath":
      return t("errorNoPath");
    case "noActivePlayer":
      return t("errorNoActivePlayer");
    case "wrongLocation":
      return t("errorWrongLocation");
    case "noJob":
      return t("errorNoJob");
    case "alreadyThisJob":
      return t("errorAlreadyThisJob");
    case "insufficientMoney":
      return interpolate("errorInsufficientMoney", { needed: error.needed, have: error.have });
    case "missingDiploma":
      return interpolate("errorMissingDiploma", { diploma: diplomaName(error.diploma) });
    case "prerequisiteMissing":
      return interpolate("errorPrerequisiteMissing", { diploma: diplomaName(error.diploma) });
    case "diplomaDone":
      return t("errorDiplomaDone");
    case "notEnrolled":
      return t("errorNotEnrolled");
    case "classesNotDone":
      return interpolate("errorClassesNotDone", { needed: error.needed, have: error.have });
    case "tooLittleExperience":
      return interpolate("errorTooLittleExperience", { needed: error.needed, have: error.have });
    case "tooLittleReliability":
      return interpolate("errorTooLittleReliability", { needed: error.needed, have: error.have });
    case "needsSuit":
      return t("errorNeedsSuit");
    case "hiringFrozen":
      return t("errorHiringFrozen");
    case "notKierownik":
      return t("errorNotKierownik");
    case "raiseTooSoon":
      return interpolate("errorRaiseTooSoon", { needed: error.needed, have: error.have });
    case "raiseMaxed":
      return t("errorRaiseMaxed");
    case "depositActive":
      return t("errorDepositActive");
    case "sameHome":
      return t("errorSameHome");
    case "homeTooSmall":
      return interpolate("errorHomeTooSmall", { have: error.have, slots: error.slots });
    case "noSlot":
      return interpolate("errorNoSlot", { slots: error.slots });
    case "alreadyOwned":
      return t("errorAlreadyOwned");
    case "notOwned":
      return t("errorNotOwned");
    case "notBroken":
      return t("errorNotBroken");
    case "insufficientAccount":
      return interpolate("errorInsufficientAccount", { needed: error.needed, have: error.have });
    case "loanActive":
      return t("errorLoanActive");
    case "loanTooBig":
      return interpolate("errorLoanTooBig", { limit: error.limit });
    case "noLoan":
      return t("errorNoLoan");
    case "notEnoughShares":
      return interpolate("errorNotEnoughShares", { have: error.have });
    case "badAmount":
      return t("errorBadAmount");
    default: {
      const exhaustive: never = error;
      return assertNever(exhaustive);
    }
  }
}
