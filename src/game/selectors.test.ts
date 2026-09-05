import { describe, expect, it } from "vitest";
import { createMatch } from "./state";
import { costToLocation, getActivePlayer } from "./selectors";

describe("selectors", () => {
  it("reads the active player", () => {
    const player = getActivePlayer(createMatch({ name: "Ola" }));
    expect(player?.name).toBe("Ola");
    expect(player?.locationId).toBe("home");
  });

  it("returns travel cost from the active tile", () => {
    const state = createMatch();
    expect(costToLocation(state, "home")).toBe(0);
    expect(costToLocation(state, "shop")).toBe(1);
    expect(costToLocation(state, "bank")).toBe(4);
  });
});
