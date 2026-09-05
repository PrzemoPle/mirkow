import { describe, expect, it } from "vitest";
import { BARS_PER_SECTION, loopVariant, LOOP_STEPS, midiToHz, SECTION_A, SECTION_B, SECTION_STEPS, SONG_FORM, stepSeconds } from "./song";

describe("utwór w tle", () => {
  it("has eight bars per section with notes inside the grid", () => {
    for (const section of [SECTION_A, SECTION_B]) {
      expect(section.roots).toHaveLength(BARS_PER_SECTION);
      expect(section.colors).toHaveLength(BARS_PER_SECTION);
      for (const note of section.lead) {
        expect(note.step).toBeGreaterThanOrEqual(0);
        expect(note.step + note.length).toBeLessThanOrEqual(SECTION_STEPS);
        expect(note.midi).toBeGreaterThan(60);
        expect(note.midi).toBeLessThan(90);
      }
      const sorted = [...section.lead].sort((a, b) => a.step - b.step);
      expect(section.lead).toEqual(sorted);
    }
    expect(SONG_FORM).toHaveLength(4);
    expect(LOOP_STEPS).toBe(SECTION_STEPS * 4);
  });

  it("keeps a slow tempo and standard tuning", () => {
    expect(stepSeconds()).toBeCloseTo(0.1786, 3);
    expect(midiToHz(69)).toBe(440);
    expect(midiToHz(57)).toBeCloseTo(220, 6);
  });

  it("varies loops without ever going silent for two loops in a row", () => {
    const gains = [0, 1, 2, 3, 4, 5, 6, 7].map((index) => loopVariant(index).leadGain);
    expect(gains).toEqual([1, 0.7, 1, 0, 1, 0.7, 1, 0]);
  });
});
