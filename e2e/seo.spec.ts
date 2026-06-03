import { expect, test } from "@playwright/test";

/**
 * Each top-level view must read to Google as its own page: exactly one <h1>
 * carrying that view's unique, descriptive title (never the shared wordmark),
 * plus a self-referencing canonical. These are static document signals, so the
 * checks need no DB and run deterministically.
 */
const PAGES = [
  { path: "/", h1: "Sonntagsfrage Bundestag", canonical: /\/?$/ },
  { path: "/archiv", h1: "Archiv", canonical: /\/archiv$/ },
  { path: "/trend", h1: "Auswertung", canonical: /\/trend$/ },
  { path: "/laender", h1: "Landtagswahlen", canonical: /\/laender$/ },
  {
    path: "/laender/bayern",
    h1: "Umfragen Bayern",
    canonical: /\/laender\/bayern$/,
  },
  { path: "/wahlen", h1: "Wahlergebnisse", canonical: /\/wahlen$/ },
  { path: "/koalition", h1: "Koalitionsrechner", canonical: /\/koalition$/ },
  { path: "/impressum", h1: "Impressum", canonical: /\/impressum$/ },
  {
    path: "/datenschutz",
    h1: "Datenschutzerklärung",
    canonical: /\/datenschutz$/,
  },
] as const;

test.describe("SEO: every view is its own page", () => {
  for (const { path, h1, canonical } of PAGES) {
    test(`${path} exposes a single unique <h1> and a self-referencing canonical`, async ({
      page,
    }) => {
      const res = await page.goto(path);
      expect(res?.ok()).toBeTruthy();

      // Exactly one <h1>, and it is this view's own title.
      const headings = page.locator("h1");
      await expect(headings).toHaveCount(1);
      await expect(headings).toHaveText(h1);

      // The wordmark is present but as a link, not a heading.
      await expect(
        page.getByRole("link", { name: "Wahlumfragen" }).first(),
      ).toBeVisible();

      // Self-referencing canonical (absolute, origin-dependent → match suffix).
      const link = page.locator('link[rel="canonical"]');
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute("href", canonical);
    });
  }
});
