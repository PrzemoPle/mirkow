import { describe, expect, it } from "vitest";
import { locationIds } from "./catalog";
import { boardEdges, travelCost } from "./board";

describe("board graph", () => {
  it("only connects catalog locations", () => {
    const known = new Set<string>(locationIds);
    for (const [from, to, cost] of boardEdges) {
      expect(known.has(from)).toBe(true);
      expect(known.has(to)).toBe(true);
      expect(cost).toBeGreaterThan(0);
    }
  });

  it("can reach every location from every other location", () => {
    for (const from of locationIds) {
      for (const to of locationIds) {
        expect(travelCost(from, to)).not.toBeNull();
      }
    }
  });

  it("charges adjacent streets the listed time", () => {
    expect(travelCost("home", "shop")).toBe(1);
    expect(travelCost("home", "cafe")).toBe(1);
    expect(travelCost("home", "kebab")).toBe(2);
    expect(travelCost("home", "pup")).toBe(2);
    expect(travelCost("home", "campus")).toBe(3);
    expect(travelCost("home", "gym")).toBe(3);
    expect(travelCost("home", "bank")).toBe(4);
  });

  it("is symmetric", () => {
    expect(travelCost("bank", "home")).toBe(travelCost("home", "bank"));
    expect(travelCost("pup", "kebab")).toBe(travelCost("kebab", "pup"));
  });
});
