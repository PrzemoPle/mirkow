import { describe, expect, it } from "vitest";
import {
  formatRatio,
  formatZl,
  interpolate,
  meterPercent,
  needTone,
} from "./format";

describe("format", () => {
  it("formats zloty with the currency suffix", () => {
    expect(formatZl(800)).toMatch(/800/);
    expect(formatZl(800)).toMatch(/zł/);
    expect(formatZl(1234567)).toMatch(/zł/);
  });

  it("keeps long ratios in one string", () => {
    expect(formatRatio(1_234_567, 5_000_000)).toContain("/");
    expect(formatRatio(1_234_567, 5_000_000).length).toBeGreaterThan(10);
  });

  it("caps meter fill at 100 percent", () => {
    expect(meterPercent(800, 5000)).toBe(16);
    expect(meterPercent(9000, 5000)).toBe(100);
    expect(meterPercent(0, 80)).toBe(0);
  });

  it("fills copy placeholders", () => {
    expect(interpolate("timeCost", { n: 4 })).toBe("4 cz.");
    expect(needTone(1)).toBe("needOk");
    expect(needTone(0)).toBe("needLow");
  });
});
