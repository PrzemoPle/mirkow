import { palette } from "../theme/palette";
import { assertNever } from "./assert-never";
import type { AvatarId } from "./types";

export const BOT_NAME = "Kowalski";

export const avatarIds = [
  "ola",
  "bartek",
  "nati",
  "marek",
] as const satisfies readonly AvatarId[];

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
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function pickBotAvatar(human: AvatarId): AvatarId {
  switch (human) {
    case "ola":
      return "bartek";
    case "bartek":
      return "nati";
    case "nati":
      return "marek";
    case "marek":
      return "ola";
    default: {
      const exhaustive: never = human;
      return assertNever(exhaustive);
    }
  }
}
