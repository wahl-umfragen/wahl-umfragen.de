import { expect, test } from "@playwright/test";

/**
 * The /api/health probe. DB-tolerant: with a reachable DB it returns 200/up,
 * otherwise 503/down — both are valid, structured responses. Either way the
 * endpoint must respond with the documented shape and never be cached.
 */
test("health endpoint reports a structured, uncached status", async ({
  request,
}) => {
  const res = await request.get("/api/health");
  expect([200, 503]).toContain(res.status());

  expect(res.headers()["cache-control"]).toContain("no-store");

  const body = await res.json();
  expect(body).toHaveProperty("status");
  expect(body).toHaveProperty("db");

  if (res.status() === 200) {
    expect(body.status).toBe("ok");
    expect(body.db).toBe("up");
  } else {
    expect(body.status).toBe("error");
    expect(body.db).toBe("down");
  }
});
