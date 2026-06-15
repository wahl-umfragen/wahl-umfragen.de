import { expect, test } from "@playwright/test";

/**
 * Mobile-only suite (runs in the `mobile` Playwright project, Pixel 5 viewport).
 * The desktop `chromium` project ignores this file. DB-tolerant: the overflow
 * contract and the header nav hold with or without survey data.
 */

const ROUTES = [
  "/",
  "/partei",
  "/archiv",
  "/trend",
  "/vergleich",
  "/laender",
  "/wahlen",
  "/koalition",
];

test.describe("mobile layout", () => {
  for (const route of ROUTES) {
    test(`no horizontal overflow at ${route}`, async ({ page }) => {
      await page.goto(route);
      // Let lazy (ssr:false) charts hydrate and lay out before measuring.
      await page.waitForLoadState("networkidle");
      const overscroll = await page.evaluate(() => {
        const de = document.documentElement;
        return de.scrollWidth - de.clientWidth;
      });
      // 1px of slack absorbs sub-pixel rounding.
      expect(
        overscroll,
        `${route} must not scroll horizontally on a phone`,
      ).toBeLessThanOrEqual(1);
    });
  }

  test("header uses a hamburger menu, not the inline nav", async ({ page }) => {
    await page.goto("/");

    // The desktop inline nav is hidden below `lg`.
    await expect(page.getByTestId("site-nav")).toBeHidden();

    // The hamburger is present; its panel is closed initially.
    const menuButton = page.getByRole("button", { name: "Menü", exact: true });
    await expect(menuButton).toBeVisible();
    await expect(page.getByTestId("mobile-nav")).toBeHidden();

    // Opening reveals the nav links...
    await menuButton.click();
    const mobileNav = page.getByTestId("mobile-nav");
    await expect(mobileNav).toBeVisible();

    // ...and tapping one navigates, then the menu closes itself.
    await mobileNav.getByRole("link", { name: "Trend" }).click();
    await expect(page).toHaveURL(/\/trend$/);
    await expect(page.getByTestId("mobile-nav")).toBeHidden();
  });
});
