import { expect, test } from "@playwright/test";

test.describe("legal pages", () => {
  test("footer links reach Impressum and Datenschutz", async ({ page }) => {
    await page.goto("/");

    // The cookie banner is fixed to the bottom and overlays the footer; dismiss
    // it first so the footer links are reliably clickable.
    await page.getByTestId("cookie-banner").getByRole("button").click();

    const footer = page.getByTestId("site-footer");
    await footer.getByRole("link", { name: "Impressum" }).click();
    await expect(page).toHaveURL(/\/impressum$/);
    await expect(
      page.getByRole("heading", { name: "Impressum", level: 2 }),
    ).toBeVisible();
    // Mandatory § 5 DDG provider section is present.
    await expect(
      page.getByRole("heading", { name: "Angaben gemäß § 5 DDG" }),
    ).toBeVisible();
    // Liability disclaimer for the third-party survey data.
    await expect(
      page.getByRole("heading", { name: "Datenquelle und Haftungsausschluss" }),
    ).toBeVisible();

    await page.goto("/datenschutz");
    await expect(
      page.getByRole("heading", { name: "Datenschutzerklärung", level: 2 }),
    ).toBeVisible();
    // Cookieless analytics section.
    await expect(
      page.getByRole("heading", { name: /Plausible Analytics/ }),
    ).toBeVisible();
  });

  test("footer shows the 'ohne Gewähr' disclaimer", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("site-footer")).toContainText("ohne Gewähr");
  });
});

test.describe("cookie notice", () => {
  test("appears, links to Datenschutz, and stays dismissed after reload", async ({
    page,
  }) => {
    await page.goto("/");

    const banner = page.getByTestId("cookie-banner");
    await expect(banner).toBeVisible();
    await expect(
      banner.getByRole("link", { name: "Mehr im Datenschutz" }),
    ).toHaveAttribute("href", "/datenschutz");

    // Dismissing removes the banner...
    await banner.getByRole("button", { name: "Verstanden" }).click();
    await expect(banner).toBeHidden();

    // ...and the choice persists (localStorage) across a reload.
    await page.reload();
    await expect(page.getByTestId("cookie-banner")).toBeHidden();
  });
});
