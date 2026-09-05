import type { ItemId, OwnedItem, Player } from "./types";

export const USED_PRICE_RATIO = 0.6;
export const SELL_PRICE_RATIO = 0.5;
export const REPAIR_PRICE_RATIO = 0.2;
export const BUY_ITEM_TIME = 1;
export const SELL_ITEM_TIME = 1;
export const REPAIR_TIME = 1;
/** Tygodniowa szansa awarii: nowy z Elektro-Mir i używany z Lombardu. */
export const BREAK_CHANCE_NEW = 0.01;
export const BREAK_CHANCE_USED = 0.03;
/** Efekty przedmiotów. */
export const FRIDGE_FOOD_WEEKS = 6;
export const FRIDGE_FOOD_DISCOUNT = 0.9;
export const WASHER_CLOTHES_WEEKS = 6;
export const COUCH_REST_HAPPINESS = 5;
export const COMPUTER_CLASS_TIME_SAVED = 1;
export const COMPUTER_EXAM_BONUS = 0.1;
export const BOOK_EXAM_BONUS = 0.1;
export const BIKE_TRAVEL_SAVED = 1;
export const BIKE_TRAVEL_MIN = 2;

export const itemIds = [
  "lodowka",
  "pralka",
  "kanapa",
  "telewizor",
  "wieza",
  "komputer",
  "encyklopedia",
  "rower",
] as const satisfies readonly ItemId[];

export type ItemZone = "A" | "B" | "C";

export type ItemDef = {
  id: ItemId;
  price: number;
  zone: ItemZone;
  happinessOnBuy: number;
  happinessWeekly: number;
};

export const ITEM_DEFS: Record<ItemId, ItemDef> = {
  lodowka: { id: "lodowka", price: 900, zone: "A", happinessOnBuy: 3, happinessWeekly: 0 },
  pralka: { id: "pralka", price: 800, zone: "A", happinessOnBuy: 2, happinessWeekly: 0 },
  kanapa: { id: "kanapa", price: 400, zone: "A", happinessOnBuy: 2, happinessWeekly: 0 },
  telewizor: { id: "telewizor", price: 700, zone: "B", happinessOnBuy: 4, happinessWeekly: 1 },
  wieza: { id: "wieza", price: 600, zone: "B", happinessOnBuy: 3, happinessWeekly: 1 },
  komputer: { id: "komputer", price: 1800, zone: "B", happinessOnBuy: 4, happinessWeekly: 0 },
  encyklopedia: { id: "encyklopedia", price: 300, zone: "C", happinessOnBuy: 1, happinessWeekly: 0 },
  rower: { id: "rower", price: 500, zone: "C", happinessOnBuy: 3, happinessWeekly: 0 },
};

export function getItemDef(id: ItemId): ItemDef {
  const def = ITEM_DEFS[id];
  if (def === undefined) {
    throw new Error(`Missing item ${id}`);
  }
  return def;
}

export function isItemId(value: string): value is ItemId {
  return Object.hasOwn(ITEM_DEFS, value);
}

export function usedPrice(id: ItemId): number {
  return Math.round((getItemDef(id).price * USED_PRICE_RATIO) / 10) * 10;
}

export function sellPrice(id: ItemId): number {
  return Math.round((getItemDef(id).price * SELL_PRICE_RATIO) / 10) * 10;
}

export function repairPrice(id: ItemId): number {
  return Math.round((getItemDef(id).price * REPAIR_PRICE_RATIO) / 10) * 10;
}

export function ownedItem(player: Player, id: ItemId): OwnedItem | undefined {
  return player.items.find((item) => item.id === id);
}

/** Przedmiot działa tylko, gdy jest i nie jest zepsuty. */
export function hasWorking(player: Player, id: ItemId): boolean {
  const item = ownedItem(player, id);
  return item !== undefined && !item.broken;
}

export function weeklyItemHappiness(player: Player): number {
  return player.items.reduce(
    (sum, item) => sum + (item.broken ? 0 : getItemDef(item.id).happinessWeekly),
    0,
  );
}
