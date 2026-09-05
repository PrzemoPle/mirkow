import { palette } from "../theme/palette";
import { assertNever } from "./assert-never";
import type { AvatarId } from "./types";

export const BOT_NAME = "Kowalski";

/** Żetony do wyboru przez człowieka. Kowalski ma własną twarz i nie jest do wzięcia. */
export const avatarIds = [
  "ola",
  "bartek",
  "nati",
  "marek",
] as const satisfies readonly AvatarId[];

export const allAvatarIds = [...avatarIds, "kowalski"] as const satisfies readonly AvatarId[];

export function avatarName(id: AvatarId): string {
  switch (id) {
    case "ola":
      return "Ola";
    case "bartek":
      return "Bartek";
    case "nati":
      return "Nati";
    case "marek":
      return "Marek";
    case "kowalski":
      return BOT_NAME;
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function avatarInitial(id: AvatarId): string {
  return avatarName(id).slice(0, 1);
}

export function avatarColor(id: AvatarId): string {
  switch (id) {
    case "ola":
      return palette.kebab;
    case "bartek":
      return palette.bank;
    case "nati":
      return palette.campus;
    case "marek":
      return palette.gym;
    case "kowalski":
      return palette.pup;
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function pickBotAvatar(_human: AvatarId): AvatarId {
  return "kowalski";
}
