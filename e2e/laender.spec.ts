import { expect, test } from "@playwright/test";

test.describe("Landtagswahlen views", () => {
  test("nav reaches /laender; a state opens its own dashboard", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByTestId("site-nav")
      .getByRole("link", { name: "Länder" })
      .click();
    await expect(page).toHaveURL(/\/laender$/);

    // The overview lists the states.
    const bayern = page.getByRole("link", { name: /Bayern/ }).first();
    await expect(bayern).toBeVisible();
    await bayern.click();
    await expect(page).toHaveURL(/\/laender\/bayern$/);

    // Unique state H1.
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText("Bayern");

    // The shared dashboard renders for the state (or an empty state).
    const standing = page.getByTestId("standing-chart");
    const empty = page.getByTestId("empty-state");
    await expect(standing.or(empty).first()).toBeVisible({ timeout: 15_000 });
  });
});
