import { expect, test } from "@playwright/test";

test.describe("home page", () => {
  test("renders header, sonntagsfrage section, and ODbL attribution", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Wahlumfragen/);
    await expect(
      page.getByRole("heading", { name: "Wahlumfragen", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Sonntagsfrage Bundestag", level: 2 }),
    ).toBeVisible();

    const footer = page.getByTestId("site-footer");
    await expect(footer).toBeVisible();
    await expect(footer.getByRole("link", { name: "dawum.de" })).toHaveAttribute(
      "href",
      "https://dawum.de/",
    );
    await expect(footer.getByRole("link", { name: "ODbL" })).toBeVisible();
  });

  test("renders either survey cards or an empty state (no crash)", async ({
    page,
  }) => {
    await page.goto("/");

    const list = page.getByTestId("survey-list");
    const empty = page.getByTestId("empty-state");

    await expect(list.or(empty)).toBeVisible({ timeout: 15_000 });

    if (await list.isVisible()) {
      const cards = page.getByTestId("survey-card");
      await expect(cards.first()).toBeVisible();
      expect(await cards.count()).toBeGreaterThan(0);
    }
  });
});
