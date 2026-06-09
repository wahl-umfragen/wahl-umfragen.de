import { expect, test } from "@playwright/test";

/**
 * Guards the enforcing Content-Security-Policy: loads the JS-heavy pages and
 * asserts the browser logs no CSP violation. Run the server with
 * `CSP_ENFORCE=true` for this to exercise the enforcing header (the default once
 * the policy is verified). A violation surfaces as a console error like
 * "Refused to execute inline script because it violates ... Content Security Policy".
 */
const PAGES = ["/", "/trend", "/koalition", "/partei/union", "/vergleich"];

for (const path of PAGES) {
  test(`no CSP violation on ${path}`, async ({ page }) => {
    const violations: string[] = [];
    const isCsp = (text: string) =>
      /content security policy|refused to (execute|load|apply|connect)/i.test(text);

    page.on("console", (msg) => {
      if (msg.type() === "error" && isCsp(msg.text())) violations.push(msg.text());
    });
    page.on("pageerror", (err) => {
      if (isCsp(err.message)) violations.push(err.message);
    });

    await page.goto(path, { waitUntil: "networkidle" });
    // Give hydration + lazy charts a beat to run any inline/injected scripts.
    await page.waitForTimeout(1500);

    expect(violations, violations.join("\n")).toEqual([]);
  });
}
