import { expect, test } from "@playwright/test";

/**
 * The "Problem melden" footer dialog. The submit test mocks the POST so it never
 * writes to the database (e2e runs against the real app + DB).
 */
test.describe("report dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("opens from the footer and shows the form with a hidden honeypot", async ({
    page,
  }) => {
    await page.getByTestId("report-trigger").click();

    const dialog = page.getByTestId("report-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Kategorie")).toBeVisible();
    await expect(dialog.getByLabel(/Beschreibung/)).toBeVisible();

    // Honeypot input exists but is removed from tab order (bot trap).
    await expect(dialog.locator('input[name="website"]')).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });

  test("submitting shows a confirmation (network mocked, no DB write)", async ({
    page,
  }) => {
    await page.route("**/api/report", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      }),
    );

    await page.getByTestId("report-trigger").click();

    const dialog = page.getByTestId("report-dialog");
    await dialog.getByLabel(/Beschreibung/).fill("E2E Testmeldung");
    await dialog.getByRole("button", { name: "Absenden" }).click();

    await expect(page.getByTestId("report-success")).toBeVisible();
  });
});
