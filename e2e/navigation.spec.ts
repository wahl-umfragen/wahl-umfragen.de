import { expect, test } from "@playwright/test";

/**
 * Regression coverage for the context-aware back button on the survey detail
 * page (`/archiv/[id]`). The page is reachable from several entry points, so
 * "back" must return to wherever the user came from — not always the archive.
 */
test.describe("survey detail back navigation", () => {
  test("returns to the home page when opened from 'Letzte Umfragen'", async ({
    page,
  }) => {
    await page.goto("/");

    const recent = page.getByTestId("recent-surveys");
    const empty = page.getByTestId("empty-state");
    await expect(recent.or(empty).first()).toBeVisible({ timeout: 15_000 });
    test.skip(await empty.first().isVisible(), "no survey data in DB");

    // Open the newest survey from the home "Letzte Umfragen" list.
    await recent.locator("li a").first().click();
    await expect(page).toHaveURL(/\/archiv\/.+/);
    await expect(page.getByTestId("survey-results")).toBeVisible();

    // Back must land on the home page (its unique heading), not the archive.
    await page.getByTestId("back-link").click();
    await expect(
      page.getByRole("heading", { name: "Sonntagsfrage Bundestag", level: 2 }),
    ).toBeVisible();
  });

  test("returns to the archive when opened from the archive list", async ({
    page,
  }) => {
    await page.goto("/archiv");

    const table = page.getByTestId("archive-table");
    const empty = page.getByTestId("empty-state");
    await expect(table.or(empty).first()).toBeVisible({ timeout: 15_000 });
    test.skip(await empty.first().isVisible(), "no survey data in DB");

    await page.getByTestId("archive-row").first().getByRole("link").click();
    await expect(page).toHaveURL(/\/archiv\/.+/);
    await expect(page.getByTestId("survey-results")).toBeVisible();

    await page.getByTestId("back-link").click();
    await expect(page).toHaveURL(/\/archiv$/);
    await expect(page.getByTestId("archive-table")).toBeVisible();
  });
});
