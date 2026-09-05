import { describe, expect, it } from "vitest";
import { ACTION_DEFS } from "../game/actions";
import { createMatch } from "../game/state";
import { actionCaption, actedMessage, eventMessage, jobLabel, weekStatus } from "./copy";

describe("copy", () => {
  it("puts time and wage on action captions", () => {
    expect(actionCaption(ACTION_DEFS.restHome)).toBe("Drzemka · 1 cz.");
    expect(actionCaption(ACTION_DEFS.workKebab)).toContain("+280");
    expect(actionCaption(ACTION_DEFS.buyFood)).toContain("80");
  });

  it("names the kebab job", () => {
    expect(jobLabel(null)).toBe("Praca: brak");
    expect(jobLabel({ id: "kebabKasjer", weeks: 2 })).toBe(
      "Praca: kasjer, Nocna Buła",
    );
    expect(jobLabel({ id: "kebabKierownik", weeks: 1 })).toBe(
      "Praca: kierownik zmiany",
    );
  });

  it("joins week settlement into one status line", () => {
    const state = {
      ...createMatch(),
      lastWeekEffects: [
        { kind: "rent" as const, amount: 400 },
        { kind: "hunger" as const, timeLost: 2 },
      ],
    };
    expect(weekStatus(state)).toBe("Nowy tydzień. Czynsz 400 zł. Głód: -2 czasu.");
    expect(actedMessage("searchJob", 0)).toBe("Masz etat w Nocnej Bule.");
    expect(eventMessage("korek")).toBe("Korek na obwodnicy. -2 czasu.");
    expect(eventMessage("lotto")).toContain("400");
  });
});
