import { describe, expect, it } from "vitest";
import { palette } from "./palette";

const hex = /^#[0-9A-Fa-f]{6}$/;

describe("palette", () => {
  it("locks the paper-and-ink tokens", () => {
    expect(palette.paper).toBe("#E8DCC8");
    expect(palette.ink).toBe("#2B2622");
    expect(palette.accent).toBe(palette.kebab);
  });

  it("uses six-digit hex for every token", () => {
    for (const value of Object.values(palette)) {
      expect(value).toMatch(hex);
    }
  });
});
