import { describe, expect, it } from "vitest";
import { ACTION_DEFS } from "../game/actions";
import { createMatch } from "../game/state";
import { actionCaption, actedMessage, eventMessage, jobLabel, placeDescription, weekGoal, weekStatus } from "./copy";

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

  it("points a new player to PUP, then to what is missing most", () => {
    const fresh = createMatch();
    const player = fresh.players[0]!;
    expect(weekGoal(fresh, player)).toEqual({ text: "Nie masz pracy. Idź do PUP i złóż podanie.", location: "pup" });

    const hungry = createMatch({ job: { id: "kebabPomoc", weeks: 1, raises: 0 }, reliability: 60, needs: { foodWeeks: 0, clothesWeeks: 5, suitWeeks: 0 } });
    expect(weekGoal(hungry, hungry.players[0]!).location).toBe("shop");

    const fed = createMatch({
      job: { id: "kebabPomoc", weeks: 1, raises: 0 },
      reliability: 60,
      needs: { foodWeeks: 5, clothesWeeks: 5, suitWeeks: 0 },
      goals: { money: 1000, happiness: 30, education: 40, career: 5 },
      stats: { money: 900, happiness: 28, education: 0, career: 5 },
    });
    const goal = weekGoal(fed, fed.players[0]!);
    expect(goal.location).toBe("campus");
    expect(goal.text).toContain("WSMiK");
    expect(placeDescription("pup")).toContain("Tablica ofert");
  });
});
