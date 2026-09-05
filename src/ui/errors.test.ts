import { describe, expect, it } from "vitest";
import { errorMessage } from "./errors";

describe("errorMessage", () => {
  it("explains a short time pool with numbers", () => {
    expect(
      errorMessage({ code: "insufficientTime", needed: 4, have: 2 }),
    ).toBe("Za mało czasu (trzeba 4, masz 2).");
  });

  it("covers the remaining engine codes", () => {
    expect(errorMessage({ code: "alreadyThere" })).toBe("Jesteś już tutaj.");
    expect(errorMessage({ code: "noPath" })).toBe("Nie da się tam dojść.");
    expect(errorMessage({ code: "wrongPhase", phase: "victory" })).toBe(
      "Ta akcja nie jest teraz dostępna.",
    );
    expect(errorMessage({ code: "wrongLocation", here: "home", needed: "shop" })).toBe(
      "To zrób gdzie indziej.",
    );
    expect(errorMessage({ code: "noJob" })).toBe("Nie masz etatu.");
    expect(errorMessage({ code: "alreadyThisJob" })).toBe("Już tu pracujesz.");
    expect(errorMessage({ code: "needsSuit" })).toBe("Bez garnituru nie wpuszczą.");
    expect(errorMessage({ code: "hiringFrozen" })).toBe("Ta firma teraz nie zatrudnia.");
    expect(
      errorMessage({ code: "insufficientMoney", needed: 150, have: 20 }),
    ).toBe("Za mało gotówki (trzeba 150 zł, masz 20 zł).");
    expect(
      errorMessage({ code: "tooLittleEducation", needed: 18, have: 6 }),
    ).toBe("Za słabe papiery (trzeba 18, masz 6).");
    expect(
      errorMessage({ code: "tooLittleExperience", needed: 4, have: 1 }),
    ).toBe("Za mały staż (trzeba 4, masz 1).");
    expect(
      errorMessage({ code: "tooLittleReliability", needed: 40, have: 12 }),
    ).toBe("Za niska solidność (trzeba 40, masz 12).");
  });
});
