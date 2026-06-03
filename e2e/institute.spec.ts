import { expect, test } from "@playwright/test";

test.describe("institute detail page", () => {
  test("opens from an institute link, shows its own H1, trend and back link", async ({
    page,
  }) => {
    await page.goto("/");

    const link = page.locator('a[href^="/institut/"]').first();
    const empty = page.getByTestId("empty-state");
    await expect(link.or(empty).first()).toBeVisible({ timeout: 15_000 });
    test.skip(await empty.first().isVisible(), "no survey data in DB");

    const name = (await link.textContent())?.trim();
    await link.click();
    await expect(page).toHaveURL(/\/institut\/.+/);

    // The page exposes a single, unique <h1> = the institute's name.
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);
    if (name) await expect(h1).toContainText(name);

    // Meta block + its own trend chart render.
    await expect(page.getByTestId("institute-meta")).toBeVisible();
    await expect(page.getByTestId("trend-chart")).toBeVisible();

    // Back link returns to the home page.
    await page.getByRole("link", { name: /Zur Startseite/ }).click();
    await expect(
      page.getByRole("heading", { name: "Sonntagsfrage Bundestag", level: 1 }),
    ).toBeVisible();
  });
});
