import { describe, expect, it } from "vitest";
import { BARS_PER_SECTION, loopSteps, loopVariant, midiToHz, SECTION_STEPS, SONGS, stepSeconds, TRACK_IDS } from "./song";

describe("utwory w tle", () => {
  it("keeps every song on an eight-bar grid with notes inside the section", () => {
    for (const id of TRACK_IDS) {
      const song = SONGS[id];
      expect(song.id).toBe(id);
      expect(song.form.length).toBe(4);
      for (const section of song.form) {
        expect(section.roots).toHaveLength(BARS_PER_SECTION);
        expect(section.colors).toHaveLength(BARS_PER_SECTION);
        for (const note of section.lead) {
          expect(note.step).toBeGreaterThanOrEqual(0);
          expect(note.step + note.length).toBeLessThanOrEqual(SECTION_STEPS);
          expect(note.midi).toBeGreaterThan(55);
          expect(note.midi).toBeLessThan(96);
          expect(note.velocity).toBeGreaterThan(0);
          expect(note.velocity).toBeLessThanOrEqual(1);
        }
      }
      expect(loopSteps(song)).toBe(SECTION_STEPS * 4);
      expect(stepSeconds(song)).toBeGreaterThan(0.1);
      expect(stepSeconds(song)).toBeLessThan(0.25);
    }
  });

  it("gives the three tracks distinct tempo, key, lead, bass and percussion", () => {
    expect(new Set(TRACK_IDS.map((id) => SONGS[id].tempo)).size).toBe(3);
    expect(new Set(TRACK_IDS.map((id) => SONGS[id].transpose % 12)).size).toBe(3);
    expect(new Set(TRACK_IDS.map((id) => SONGS[id].arrangement.lead)).size).toBe(3);
    expect(new Set(TRACK_IDS.map((id) => SONGS[id].arrangement.bass)).size).toBe(3);
    expect(new Set(TRACK_IDS.map((id) => SONGS[id].arrangement.percussion)).size).toBe(3);
    expect(midiToHz(69)).toBe(440);
  });

  it("varies loops without ever going silent for two loops in a row", () => {
    const gains = [0, 1, 2, 3, 4, 5, 6, 7].map((index) => loopVariant(index).leadGain);
    expect(gains).toEqual([1, 0.7, 1, 0, 1, 0.7, 1, 0]);
  });
});
