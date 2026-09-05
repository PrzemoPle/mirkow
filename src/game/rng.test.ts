import { describe, expect, it } from "vitest";
import { advanceRng } from "./rng";

describe("advanceRng", () => {
  it("returns a unit interval value and a new seed", () => {
    const first = advanceRng(1);
    expect(first.value).toBeGreaterThanOrEqual(0);
    expect(first.value).toBeLessThan(1);
    expect(first.seed).not.toBe(1);
  });

  it("is deterministic for the same seed", () => {
    expect(advanceRng(42)).toEqual(advanceRng(42));
  });

  it("advances when chained", () => {
    const first = advanceRng(7);
    const second = advanceRng(first.seed);
    expect(second.value).not.toBe(first.value);
  });
});
