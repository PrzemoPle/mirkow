import { advanceRng } from "./rng";
import type { Market } from "./types";

export const FOOD_BASE = 80;
export const CLOTHES_BASE = 120;
export const PRICE_FLOOR = 0.8;
export const PRICE_SPAN = 0.5;
export const RENT_HIKE = 50;
/** Sufit czynszu: inflacja ma dawać presję, nie spiralę śmierci. */
export const RENT_MAX = 800;

export function startingMarket(): Market {
  return { food: FOOD_BASE, clothes: CLOTHES_BASE };
}

function quote(base: number, roll: number): number {
  return Math.round(base * (PRICE_FLOOR + roll * PRICE_SPAN));
}

export function rollShopPrices(seed: number): { market: Market; seed: number } {
  const foodRoll = advanceRng(seed);
  const clothesRoll = advanceRng(foodRoll.seed);
  return {
    market: {
      food: quote(FOOD_BASE, foodRoll.value),
      clothes: quote(CLOTHES_BASE, clothesRoll.value),
    },
    seed: clothesRoll.seed,
  };
}

export function pricesChanged(before: Market, after: Market): boolean {
  return before.food !== after.food || before.clothes !== after.clothes;
}
