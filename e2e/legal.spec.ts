import { expect, test } from "@playwright/test";

test.describe("legal pages", () => {
  test("footer links reach Impressum and Datenschutz", async ({ page }) => {
    await page.goto("/");

    const footer = page.getByTestId("site-footer");
    await footer.getByRole("link", { name: "Impressum" }).click();
    await expect(page).toHaveURL(/\/impressum$/);
    await expect(
      page.getByRole("heading", { name: "Impressum", level: 1 }),
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
      page.getByRole("heading", { name: "Datenschutzerklärung", level: 1 }),
    ).toBeVisible();
    // Cookieless analytics section.
    await expect(
      page.getByRole("heading", { name: /Reichweitenmessung/ }),
    ).toBeVisible();
  });

  test("footer shows the 'ohne Gewähr' disclaimer", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("site-footer")).toContainText("ohne Gewähr");
  });
});
