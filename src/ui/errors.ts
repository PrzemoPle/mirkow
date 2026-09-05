import { assertNever } from "../game/assert-never";
import type { EngineError } from "../game/result";
import { t } from "../i18n";
import { interpolate } from "./format";

export function errorMessage(error: EngineError): string {
  switch (error.code) {
    case "wrongPhase":
      return t("errorWrongPhase");
    case "insufficientTime":
      return interpolate("errorInsufficientTime", {
        needed: error.needed,
        have: error.have,
      });
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
    case "alreadyEmployed":
      return t("errorAlreadyEmployed");
    case "insufficientMoney":
      return interpolate("errorInsufficientMoney", {
        needed: error.needed,
        have: error.have,
      });
    case "tooLittleEducation":
      return interpolate("errorTooLittleEducation", {
        needed: error.needed,
        have: error.have,
      });
    case "tooLittleTenure":
      return interpolate("errorTooLittleTenure", {
        needed: error.needed,
        have: error.have,
      });
    default: {
      const exhaustive: never = error;
      return assertNever(exhaustive);
    }
  }
}
