import { describe, expect, it } from "vitest";
import { FOOD_STOCK_WEEKS } from "./actions";
import { firstSeedFor } from "./events";
import { getHomeDef, leaseRent, RELOCATE_TIME } from "./homes";
import { FRIDGE_FOOD_WEEKS, getItemDef, repairPrice, sellPrice, usedPrice } from "./items";
import { dispatch } from "./reducer";
import { buyItemBlock, costToLocation, relocateBlock } from "./selectors";
import { createMatch } from "./state";
import type { EngineResult } from "./result";
import type { GameState } from "./types";

function unwrap(result: EngineResult): GameState {
  if (!result.ok) {
    throw new Error(result.error.code);
  }
  return result.state;
}

function errorOf(result: EngineResult): string {
  if (result.ok) {
    throw new Error("expected failure");
  }
  return result.error.code;
}

/** Linijka weekendu zmienia kasę i szczęście; testy liczą ją jawnie. */
function weekendOf(state: GameState): { money: number; happiness: number } {
  const found = state.lastWeekEffects.find((effect) => effect.kind === "weekend");
  return found !== undefined && found.kind === "weekend" ? { money: found.money, happiness: found.happiness } : { money: 0, happiness: 0 };
}

function playerOf(state: GameState) {
  const player = state.players[state.active];
  if (player === undefined) {
    throw new Error("missing player");
  }
  return player;
}

const quiet = { foodWeeks: 9, clothesWeeks: 9, suitWeeks: 0 };

describe("mieszkania", () => {
  it("moves up with a deposit and freezes the rent at today's rate", () => {
    const rich = createMatch({ locationId: "home", stats: { money: 3000 } });
    const rent = leaseRent("kawalerka", "normal");
    expect(rent).toBe(700);
    const moved = unwrap(dispatch(rich, { type: "relocate", home: "kawalerka" }));
    expect(playerOf(moved).home).toEqual({ id: "kawalerka", rent });
    expect(playerOf(moved).stats.money).toBe(3000 - rent);
    expect(moved.timeLeft).toBe(rich.timeLeft - RELOCATE_TIME);
    expect(playerOf(moved).lastNotice).toBe("przeprowadzka");
  });

  it("refuses the same lease unless the rate dropped, and lets you re-sign in recession", () => {
    const normal = createMatch({ locationId: "home" });
    expect(relocateBlock(normal, "stancja")?.code).toBe("sameHome");
    const recession = createMatch({ locationId: "home", economy: { phase: "recession", hiringFrozen: null } });
    expect(leaseRent("stancja", "recession")).toBe(320);
    const resigned = unwrap(dispatch(recession, { type: "relocate", home: "stancja" }));
    expect(playerOf(resigned).home.rent).toBe(320);
    expect(playerOf(resigned).stats.money).toBe(800);
  });

  it("refuses a smaller flat when the stuff will not fit and a deposit you cannot pay", () => {
    const crowded = createMatch({
      locationId: "home",
      home: { id: "kawalerka", rent: 700 },
      items: [
        { id: "lodowka", used: false, broken: false },
        { id: "telewizor", used: false, broken: false },
        { id: "wieza", used: false, broken: false },
        { id: "rower", used: false, broken: false },
      ],
    });
    expect(relocateBlock(crowded, "stancja")?.code).toBe("homeTooSmall");
    const poor = createMatch({ locationId: "home", stats: { money: 500 } });
    expect(relocateBlock(poor, "apartament")?.code).toBe("insufficientMoney");
  });

  it("charges the frozen rent and adds weekly comfort", () => {
    const flat = createMatch({
      week: 4,
      home: { id: "apartament", rent: 1100 },
      stats: { money: 3000 },
      needs: quiet,
      rngSeed: firstSeedFor("spokoj"),
      items: [{ id: "telewizor", used: false, broken: false }],
    });
    const after = unwrap(dispatch(flat, { type: "endWeek" }));
    expect(playerOf(after).stats.money).toBe(3000 - 1100 + weekendOf(after).money);
    expect(after.lastWeekEffects).toContainEqual({ kind: "homeHappiness", amount: 4 });
    expect(playerOf(after).stats.happiness).toBe(20 + 4 - 1 + weekendOf(after).happiness);
    expect(playerOf(after).home.rent).toBe(1100);
  });
});

describe("przedmioty", () => {
  it("buys new at Elektro-Mir and used at the Lombard, once each, within the slots", () => {
    const elektro = createMatch({ locationId: "elektro", stats: { money: 3000 } });
    const bought = unwrap(dispatch(elektro, { type: "buyItem", item: "lodowka", used: false }));
    expect(playerOf(bought).items).toEqual([{ id: "lodowka", used: false, broken: false }]);
    expect(playerOf(bought).stats.money).toBe(3000 - getItemDef("lodowka").price);
    expect(playerOf(bought).stats.happiness).toBe(23);
    expect(buyItemBlock(bought, "lodowka", false)?.code).toBe("alreadyOwned");
    expect(errorOf(dispatch(bought, { type: "buyItem", item: "rower", used: true }))).toBe("wrongLocation");

    const lombard = createMatch({ locationId: "lombard", stats: { money: 3000 } });
    const used = unwrap(dispatch(lombard, { type: "buyItem", item: "rower", used: true }));
    expect(playerOf(used).items[0]?.used).toBe(true);
    expect(playerOf(used).stats.money).toBe(3000 - usedPrice("rower"));

    const full = createMatch({
      locationId: "elektro",
      stats: { money: 9000 },
      items: [
        { id: "lodowka", used: false, broken: false },
        { id: "telewizor", used: false, broken: false },
        { id: "wieza", used: false, broken: false },
      ],
    });
    expect(buyItemBlock(full, "rower", false)?.code).toBe("noSlot");
  });

  it("sells for half and repairs for a fifth", () => {
    const owner = createMatch({
      locationId: "lombard",
      items: [{ id: "telewizor", used: false, broken: false }],
    });
    const sold = unwrap(dispatch(owner, { type: "sellItem", item: "telewizor" }));
    expect(playerOf(sold).items).toEqual([]);
    expect(playerOf(sold).stats.money).toBe(800 + sellPrice("telewizor"));

    const broken = createMatch({
      locationId: "elektro",
      items: [{ id: "komputer", used: true, broken: true }],
    });
    const fixed = unwrap(dispatch(broken, { type: "repairItem", item: "komputer" }));
    expect(playerOf(fixed).items[0]?.broken).toBe(false);
    expect(playerOf(fixed).stats.money).toBe(800 - repairPrice("komputer"));
    expect(errorOf(dispatch(fixed, { type: "repairItem", item: "komputer" }))).toBe("notBroken");
  });

  it("fridge stocks six weeks, couch rests better, bike shortens long trips", () => {
    const fridge = createMatch({ locationId: "shop", items: [{ id: "lodowka", used: false, broken: false }] });
    expect(playerOf(unwrap(dispatch(fridge, { type: "act", id: "buyFood" }))).needs.foodWeeks).toBe(FRIDGE_FOOD_WEEKS);
    const noFridge = createMatch({ locationId: "shop" });
    expect(playerOf(unwrap(dispatch(noFridge, { type: "act", id: "buyFood" }))).needs.foodWeeks).toBe(FOOD_STOCK_WEEKS);

    const couch = createMatch({ locationId: "home", items: [{ id: "kanapa", used: false, broken: false }] });
    expect(playerOf(unwrap(dispatch(couch, { type: "act", id: "restHome" }))).stats.happiness).toBe(25);

    const bike = createMatch({ items: [{ id: "rower", used: false, broken: false }] });
    expect(costToLocation(bike, "shop")).toBe(1);
    expect(costToLocation(bike, "bank")).toBe(3);
    const brokenBike = createMatch({ items: [{ id: "rower", used: false, broken: true }] });
    expect(costToLocation(brokenBike, "bank")).toBe(4);
  });

  it("can be stolen on the stancja but never in the kawalerka", () => {
    const stancja = createMatch({ needs: quiet, items: [{ id: "telewizor", used: false, broken: false }] });
    let stolenSeed: number | null = null;
    for (let seed = 1; seed < 3000; seed += 1) {
      const after = unwrap(dispatch({ ...stancja, rngSeed: seed }, { type: "endWeek" }));
      if (playerOf(after).items.length === 0) {
        stolenSeed = seed;
        expect(playerOf(after).lastNotice).toBe("zdzichu");
        expect(after.lastWeekEffects).toContainEqual({ kind: "theft", item: "telewizor" });
        break;
      }
    }
    expect(stolenSeed).not.toBeNull();
    const safe = createMatch({
      needs: quiet,
      home: { id: "kawalerka", rent: 700 },
      items: [{ id: "telewizor", used: false, broken: false }],
    });
    for (let seed = 1; seed < 400; seed += 1) {
      const after = unwrap(dispatch({ ...safe, rngSeed: seed }, { type: "endWeek" }));
      expect(playerOf(after).items).toHaveLength(1);
    }
    expect(getHomeDef("kawalerka").theft).toBe(false);
  });
});
