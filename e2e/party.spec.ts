import { expect, test } from "@playwright/test";

/**
 * Per-party pages and the public data-status page. DB-tolerant: assertions hold
 * whether or not the database has survey data (an empty DB renders headings +
 * empty/no-data states, not a crash).
 */
test.describe("party pages", () => {
  test("overview renders and links into a party page", async ({ page }) => {
    await page.goto("/partei");
    await expect(
      page.getByRole("heading", { name: "Parteien", level: 1 }),
    ).toBeVisible();

    // With data, party cards link to /partei/<slug>; tolerate an empty DB.
    const cards = page.locator('a[href^="/partei/"]');
    if (
      await cards
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await cards.first().click();
      await expect(page).toHaveURL(/\/partei\/.+/);
    }
  });

  test("a party detail page renders its heading", async ({ page }) => {
    await page.goto("/partei/union");
    await expect(
      page.getByRole("heading", { name: "CDU/CSU", level: 1 }),
    ).toBeVisible();
  });

  test("an unknown party slug 404s", async ({ page }) => {
    const res = await page.goto("/partei/does-not-exist");
    expect(res?.status()).toBe(404);
  });
});

test.describe("datenstand page", () => {
  test("renders the status heading and last-sync label", async ({ page }) => {
    await page.goto("/datenstand");
    await expect(
      page.getByRole("heading", { name: "Datenstand", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByText("Letzter Abgleich", { exact: true }),
    ).toBeVisible();
  });
});

test.describe("compare page", () => {
  test("renders and lets the look-back period be switched", async ({
    page,
  }) => {
    await page.goto("/vergleich");
    await expect(
      page.getByRole("heading", { name: "Umfrage-Vergleich", level: 1 }),
    ).toBeVisible();

    const sixMonths = page.getByRole("link", { name: "vor 6 Monaten" });
    await sixMonths.click();
    await expect(page).toHaveURL(/vor=180/);
    await expect(sixMonths).toHaveAttribute("aria-current", "true");
  });
});
