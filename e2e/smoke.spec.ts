import { expect, test, type Page } from "@playwright/test";

/** Jedna tura nowego gracza: start, ruch, akcja, koniec tygodnia, karta eventu, tura Kowalskiego. */
async function startNewGame(page: Page): Promise<void> {
  await page.goto("./");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Wejdź do Mirkowa" }).click();
  await page.getByRole("button", { name: "Wiem, gram" }).click();
}

/** Tła z CSS nie są <img>, więc sprawdzamy je osobno: każdy url() w computed style musi odpowiadać 200. */
async function expectCssImageLoads(page: Page, backgroundImage: string): Promise<void> {
  const urls = [...backgroundImage.matchAll(/url\("?([^")]+)"?\)/g)].map((match) => match[1] ?? "");
  expect(urls.length).toBeGreaterThan(0);
  for (const url of urls) {
    const status = await page.evaluate(async (target) => (await fetch(target)).status, url);
    expect(status, url).toBe(200);
  }
}

test("plays the first week without errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });

  await page.goto("./");
  await expect(page.getByRole("button", { name: "Wejdź do Mirkowa" })).toBeVisible();
  const panorama = await page.evaluate(() => getComputedStyle(document.querySelector(".setup-head")!).backgroundImage);
  await expectCssImageLoads(page, panorama);

  await startNewGame(page);
  await expect(page.getByRole("button", { name: /^PUP Mirków/ })).toBeVisible();
  const mat = await page.evaluate(() => getComputedStyle(document.querySelector(".board")!, "::before").backgroundImage);
  await expectCssImageLoads(page, mat);
  await expect(page.locator(".tile")).toHaveCount(12);
  await expect(page.locator(".week-goal-text")).toContainText("PUP");

  await page.getByRole("button", { name: /^Żuczek/ }).click();
  await expect(page.locator(".place-name")).toHaveText("Żuczek");
  await expect(page.locator(".npc-text")).not.toBeEmpty();
  await page.locator(".act[data-action='buyFood']").click();
  await expect(page.locator(".status")).toContainText("Lodówka");

  await page.locator(".endweek > .btn").click();
  const confirm = page.locator(".confirm .btn-primary");
  if (await confirm.isVisible()) {
    await confirm.click();
  }
  const card = page.locator(".card");
  await expect(card).toBeVisible();
  await expect(card.locator(".card-foot")).toContainText("Weekend");
  await card.locator(".card-close").click();

  await expect(page.locator(".status")).toContainText("Twoja tura", { timeout: 20_000 });
  await expect(page.locator(".week")).toContainText("Tydzień 2");

  const broken = await page.evaluate(() => [...document.images].filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.src));
  expect(broken).toEqual([]);
  expect(errors).toEqual([]);
});

test("keeps the save and resumes", async ({ page }) => {
  await startNewGame(page);
  await page.getByRole("button", { name: /^Na Rogu/ }).click();
  await page.reload();
  await page.getByRole("button", { name: /Kontynuuj tydzień 1/ }).click();
  await expect(page.locator(".place-name")).toHaveText("Na Rogu");
});
