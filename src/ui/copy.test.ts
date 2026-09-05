import { describe, expect, it } from "vitest";
import { ACTION_DEFS } from "../game/actions";
import { createMatch } from "../game/state";
import { actionCaption, actedMessage, eventMessage, jobLabel, weekStatus } from "./copy";

describe("copy", () => {
  it("puts time and wage on action captions", () => {
    expect(actionCaption(ACTION_DEFS.restHome)).toBe("Drzemka · 1 cz.");
    expect(actionCaption(ACTION_DEFS.buySuit)).toContain("350");
    expect(actionCaption(ACTION_DEFS.buyFood)).toContain("80");
  });

  it("names the kebab job", () => {
    expect(jobLabel(null)).toBe("Praca: brak");
    expect(jobLabel({ id: "kebabKasjer", weeks: 2, raises: 0 })).toBe(
      "Praca: kasjer, Nocna Buła",
    );
    expect(jobLabel({ id: "depotInzynier", weeks: 1, raises: 0 })).toBe(
      "Praca: inżynier, Zajezdnia",
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
    expect(weekStatus(state)).toBe("Nowy tydzień. Czynsz 400 zł. Głód: -2 czasu i -3 szczęścia.");
    expect(actedMessage("work", 280)).toBe("Zmiana za 280 zł.");
    expect(eventMessage("korek")).toBe("Korek na obwodnicy. -2 czasu.");
    expect(eventMessage("lotto")).toContain("400");
  });
});
