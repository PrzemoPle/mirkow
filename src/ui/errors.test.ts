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
    expect(errorMessage({ code: "noJob" })).toBe("Nie masz tu etatu.");
    expect(errorMessage({ code: "alreadyEmployed" })).toBe("Już masz pracę.");
    expect(
      errorMessage({ code: "insufficientMoney", needed: 150, have: 20 }),
    ).toBe("Za mało gotówki (trzeba 150 zł, masz 20 zł).");
    expect(
      errorMessage({ code: "tooLittleEducation", needed: 18, have: 6 }),
    ).toBe("Za słabe papiery (trzeba 18, masz 6).");
    expect(
      errorMessage({ code: "tooLittleTenure", needed: 4, have: 1 }),
    ).toBe("Za krótki staż (trzeba 4 tyg., masz 1).");
  });
});
