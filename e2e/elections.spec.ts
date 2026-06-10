import { expect, test } from "@playwright/test";

test.describe("Wahlergebnisse page", () => {
  test("nav reaches /wahlen and the official results table renders", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByTestId("site-nav")
      .getByRole("link", { name: "Wahlen" })
      .click();
    await expect(page).toHaveURL(/\/wahlen$/);

    // Static, certified data (no DB) → always present.
    const table = page.getByTestId("election-results");
    await expect(table).toBeVisible();
    // All three certified elections appear as columns (newest first).
    await expect(table).toContainText("Bundestagswahl 2025");
    await expect(table).toContainText("Bundestagswahl 2021");
    await expect(table).toContainText("Bundestagswahl 2017");
    await expect(table).toContainText("CDU/CSU");
    await expect(table).toContainText("28,6"); // CDU/CSU 2025
    await expect(table).toContainText("25,7"); // SPD 2021
    // Sub-5 % result kept at full precision so the near-miss stays visible.
    await expect(table).toContainText("4,981");
    // Below-threshold footnote is shown.
    await expect(page.getByText(/unter der 5-%-Hürde/)).toBeVisible();

    // Source attribution links to Die Bundeswahlleiterin.
    await expect(
      page.getByRole("link", { name: "Die Bundeswahlleiterin" }).first(),
    ).toHaveAttribute("href", /bundeswahlleiterin\.de/);
  });
});

test.describe("current-standing transparency", () => {
  test("lists the surveys feeding the average, each linking to the archive", async ({
    page,
  }) => {
    await page.goto("/trend");

    // Wait for the (client-rendered) dashboard to hydrate.
    const standing = page.getByTestId("standing-chart");
    const empty = page.getByTestId("trend-empty");
    await expect(standing.or(empty).first()).toBeVisible({ timeout: 15_000 });

    const sources = page.getByTestId("current-sources");
    // The disclosure only exists when at least one survey contributed.
    test.skip(
      !(await sources.isVisible()),
      "no contributing surveys (empty DB)",
    );

    await expect(sources).toContainText("Berücksichtigte Umfragen");
    await sources.locator("summary").click();
    await expect(sources.locator("a[href^='/archiv/']").first()).toBeVisible();
  });
});
