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
    const empty = page.getByTestId("empty-state");
    await expect(list.or(empty)).toBeVisible({ timeout: 15_000 });
    // DB-backed: with an empty DB there is no table to sort.
    test.skip(await empty.isVisible(), "no survey data in DB");

    const instituteHeader = page.getByRole("button", { name: /^Institut/ });
    await instituteHeader.click();
    await expect(instituteHeader).toContainText(/↑|↓/);
  });
});

test.describe("auswertung page", () => {
  test("renders the dashboard charts after hydration", async ({ page }) => {
    await page.goto("/trend");

    await expect(
      page.getByRole("heading", { name: "Auswertung", level: 2 }),
    ).toBeVisible();

    // Current-standing bar chart always renders when any data exists.
    const standing = page.getByTestId("standing-chart");
    const empty = page.getByTestId("trend-empty");
    await expect(standing.or(empty).first()).toBeVisible({ timeout: 15_000 });
  });

  test("toggles trend smoothing", async ({ page }) => {
    await page.goto("/trend");

    const empty = page.getByTestId("trend-empty");
    const toggle = page.getByTestId("smooth-toggle");
    await expect(toggle.or(empty).first()).toBeVisible({ timeout: 15_000 });
    // DB-backed: with an empty DB there is no trend to smooth.
    test.skip(await empty.first().isVisible(), "no survey data in DB");

    await expect(toggle).toBeChecked();
    await toggle.uncheck();
    await expect(toggle).not.toBeChecked();
  });

  test("switches the trend window", async ({ page }) => {
    await page.goto("/trend");

    const windowCtl = page.getByTestId("trend-window");
    const empty = page.getByTestId("trend-empty");
    await expect(windowCtl.or(empty).first()).toBeVisible({ timeout: 15_000 });
    test.skip(await empty.first().isVisible(), "no survey data in DB");

    const all = windowCtl.getByRole("button", { name: "Gesamt" });
    await all.click();
    await expect(all).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("trend-chart")).toBeVisible();
  });
});

test.describe("koalition page", () => {
  test("coalition builder toggles a party and updates the sum", async ({
    page,
  }) => {
    await page.goto("/koalition");

    const builder = page.getByTestId("coalition-builder");
    const empty = page.getByTestId("empty-state");
    await expect(builder.or(empty).first()).toBeVisible({ timeout: 15_000 });
    // DB-backed: with an empty DB there is no most-recent survey to build on.
    test.skip(await empty.first().isVisible(), "no survey data in DB");

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

test.describe("archive page", () => {
  test("lists surveys and paginates", async ({ page }) => {
    await page.goto("/archiv");

    const table = page.getByTestId("archive-table");
    const empty = page.getByTestId("empty-state");
    await expect(table.or(empty).first()).toBeVisible({ timeout: 15_000 });
    // DB-backed: with an empty DB there is nothing to browse.
    test.skip(await empty.first().isVisible(), "no survey data in DB");

    // First page renders rows and a page indicator.
    const rows = page.getByTestId("archive-row");
    await expect(rows.first()).toBeVisible();
    const indicator = page.getByTestId("archive-page");
    await expect(indicator).toContainText("Seite 1");

    // Paging forward advances the indicator (when there's more than one page).
    const next = page.getByRole("button", { name: "Weiter" });
    if (await next.isEnabled()) {
      await next.click();
      await expect(indicator).toContainText("Seite 2");
    }

    // Filtering by an institute narrows the result count.
    const before = await page.getByTestId("archive-count").textContent();
    await page
      .getByTestId("archive-institute")
      .selectOption({ index: 1 });
    await expect(page.getByTestId("archive-count")).not.toHaveText(
      before ?? "",
    );
  });

  test("opens a survey detail page", async ({ page }) => {
    await page.goto("/archiv");

    const table = page.getByTestId("archive-table");
    const empty = page.getByTestId("empty-state");
    await expect(table.or(empty).first()).toBeVisible({ timeout: 15_000 });
    test.skip(await empty.first().isVisible(), "no survey data in DB");

    await page.getByTestId("archive-row").first().getByRole("link").click();
    await expect(page).toHaveURL(/\/archiv\/.+/);
    await expect(page.getByTestId("survey-results")).toBeVisible();
  });
});

test.describe("data api", () => {
  test("serves survey JSON", async ({ request }) => {
    const res = await request.get("/api/surveys");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(typeof body.count).toBe("number");
    expect(Array.isArray(body.surveys)).toBe(true);
  });

  test("serves a CSV download", async ({ request }) => {
    const res = await request.get("/api/surveys?format=csv");
    expect(res.ok()).toBeTruthy();
    expect(res.headers()["content-type"]).toContain("text/csv");
    expect(await res.text()).toContain("survey_id,date");
  });
});
