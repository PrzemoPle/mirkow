import type { LocationNameKey } from "../game/catalog";
import { pl, type MessageKey } from "./pl";

export type { MessageKey };

export function t(key: MessageKey): string {
  return pl[key];
}

export const locationCopyIsComplete: [Exclude<LocationNameKey, MessageKey>] extends [
  never,
]
  ? true
  : never = true;
