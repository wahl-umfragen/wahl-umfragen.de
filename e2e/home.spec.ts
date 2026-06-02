import { expect, test } from "@playwright/test";

test.describe("home page", () => {
  test("renders header, nav, sonntagsfrage section, and ODbL attribution", async ({
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

    const nav = page.getByTestId("site-nav");
    await expect(nav.getByRole("link", { name: "Umfragen" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Trend" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Koalition" })).toBeVisible();

    const footer = page.getByTestId("site-footer");
    await expect(footer).toBeVisible();
    await expect(footer.getByRole("link", { name: "dawum.de" })).toHaveAttribute(
      "href",
      "https://dawum.de/",
    );
    await expect(footer.getByRole("link", { name: "ODbL" })).toBeVisible();
  });

  test("renders the institute table or an empty state (no crash)", async ({
    page,
  }) => {
    await page.goto("/");

    const list = page.getByTestId("survey-list");
    const empty = page.getByTestId("empty-state");

    await expect(list.or(empty)).toBeVisible({ timeout: 15_000 });

    await expect(page.getByTestId("data-freshness")).toContainText("Stand:");

    if (await list.isVisible()) {
      const rows = page.getByTestId("survey-card");
      await expect(rows.first()).toBeVisible();
      expect(await rows.count()).toBeGreaterThan(0);
    }
  });

  test("sorts the table when a column header is clicked", async ({ page }) => {
    await page.goto("/");

    const list = page.getByTestId("survey-list");
    await expect(list).toBeVisible({ timeout: 15_000 });

    const instituteHeader = page.getByRole("button", { name: /^Institut/ });
    await instituteHeader.click();
    await expect(instituteHeader).toContainText(/↑|↓/);
  });
});

test.describe("trend page", () => {
  test("renders the 90-day trend chart after hydration", async ({ page }) => {
    await page.goto("/trend");

    await expect(
      page.getByRole("heading", { name: "Trend (90 Tage)", level: 2 }),
    ).toBeVisible();

    const chart = page.getByTestId("trend-chart");
    const empty = page.getByTestId("trend-empty");
    await expect(chart.or(empty)).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("koalition page", () => {
  test("coalition builder toggles a party and updates the sum", async ({
    page,
  }) => {
    await page.goto("/koalition");

    const builder = page.getByTestId("coalition-builder");
    await expect(builder).toBeVisible({ timeout: 15_000 });

    await expect(page.getByTestId("coalition-status")).toContainText(
      "keine Auswahl",
    );

    const firstParty = builder.locator("label").first();
    await firstParty.click();

    await expect(page.getByTestId("coalition-sum")).not.toContainText("0.0%");
    await expect(page.getByTestId("coalition-status")).not.toContainText(
      "keine Auswahl",
    );
  });
});
