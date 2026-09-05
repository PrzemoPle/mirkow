import { describe, expect, it } from "vitest";
import { locationIds, locationPreview, TIME_MAX } from "../game/catalog";
import { t } from "./index";
import { pl } from "./pl";

describe("i18n", () => {
  it("returns the working title", () => {
    expect(t("appTitle")).toBe("Symulator życia");
  });

  it("covers every catalog location name", () => {
    for (const location of locationPreview) {
      expect(t(location.nameKey).length).toBeGreaterThan(0);
    }
  });

  it("keeps Polish copy without em dashes", () => {
    for (const value of Object.values(pl)) {
      expect(value).not.toMatch(/[—–]/);
    }
  });
});

describe("catalog", () => {
  it("has eight locations and a week of ten time units", () => {
    expect(locationIds).toHaveLength(8);
    expect(locationPreview).toHaveLength(8);
    expect(TIME_MAX).toBe(10);
  });

  it("leaves the center square for the park", () => {
    expect(
      locationPreview.some((location) => location.col === 2 && location.row === 2),
    ).toBe(false);
  });
});
