import { describe, expect, it } from "vitest";
import { locationIds } from "./catalog";
import { boardEdges, travelCost, travelPath } from "./board";

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
    expect(travelCost("home", "lombard")).toBe(2);
    expect(travelCost("home", "kebab")).toBe(3);
    expect(travelCost("home", "pup")).toBe(2);
    expect(travelCost("home", "campus")).toBe(3);
    expect(travelCost("home", "elektro")).toBe(3);
    expect(travelCost("home", "gym")).toBe(4);
    expect(travelCost("home", "bank")).toBe(4);
    expect(travelCost("home", "zajezdnia")).toBe(5);
  });

  it("is symmetric", () => {
    expect(travelCost("bank", "home")).toBe(travelCost("home", "bank"));
    expect(travelCost("pup", "kebab")).toBe(travelCost("kebab", "pup"));
  });

  it("returns the cheapest route as a node list", () => {
    expect(travelPath("home", "home")).toEqual(["home"]);
    expect(travelPath("home", "shop")).toEqual(["home", "shop"]);
    expect(travelPath("home", "kebab")).toEqual(["home", "shop", "lombard", "kebab"]);
    expect(travelPath("home", "elektro")).toEqual(["home", "shop", "lombard", "elektro"]);
  });

  it("path cost matches travelCost", () => {
    for (const from of locationIds) {
      for (const to of locationIds) {
        const path = travelPath(from, to);
        expect(path).not.toBeNull();
        if (path === null) {
          continue;
        }
        let total = 0;
        for (let index = 1; index < path.length; index += 1) {
          const a = path[index - 1];
          const b = path[index];
          if (a === undefined || b === undefined) {
            throw new Error("bad path");
          }
          const edge = boardEdges.find(
            ([x, y]) => (x === a && y === b) || (x === b && y === a),
          );
          expect(edge).toBeDefined();
          total += edge?.[2] ?? 0;
        }
        expect(total).toBe(travelCost(from, to));
      }
    }
  });
});
