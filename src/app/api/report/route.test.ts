import { beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mock handles so the factories below can reference them.
const h = vi.hoisted(() => {
  const values = vi.fn();
  return {
    execute: vi.fn(),
    values,
    insert: vi.fn(() => ({ values })),
  };
});

vi.mock("@/db/client", () => ({
  db: { execute: h.execute, insert: h.insert },
}));
vi.mock("@/lib/report/mailer", () => ({
  sendReportEmail: vi.fn().mockResolvedValue(undefined),
  sendReportConfirmation: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/report/turnstile", () => ({
  verifyTurnstile: vi.fn().mockResolvedValue(true),
}));

import type { NextRequest } from "next/server";
import { sendReportConfirmation, sendReportEmail } from "@/lib/report/mailer";
import { verifyTurnstile } from "@/lib/report/turnstile";
import { POST } from "./route";

function makeRequest(
  body: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return {
    headers: new Headers(headers),
    text: () => Promise.resolve(text),
  } as unknown as NextRequest;
}

const validBody = {
  category: "bug",
  message: "Auf der Trend-Seite fehlt eine Partei.",
  turnstileToken: "ok",
};

beforeEach(() => {
  vi.clearAllMocks();
  // Rate limiter: count 1 → under the limit.
  h.execute.mockResolvedValue({ rows: [{ count: 1 }] });
  h.values.mockResolvedValue(undefined);
  vi.mocked(verifyTurnstile).mockResolvedValue(true);
});

describe("POST /api/report", () => {
  it("persists a valid report and fires both mails", async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(h.insert).toHaveBeenCalledTimes(1);
    expect(h.values).toHaveBeenCalledWith(
      expect.objectContaining({ category: "bug", message: validBody.message }),
    );
    expect(sendReportEmail).toHaveBeenCalledTimes(1);
    expect(sendReportConfirmation).toHaveBeenCalledTimes(1);
  });

  it("silently succeeds and persists nothing when the honeypot is tripped", async () => {
    const res = await POST(
      makeRequest({ ...validBody, honeypot: "i am a bot" }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(h.insert).not.toHaveBeenCalled();
  });

  it("rejects an invalid body with 400 and persists nothing", async () => {
    const res = await POST(makeRequest({ category: "nope", message: "" }));
    expect(res.status).toBe(400);
    expect(h.insert).not.toHaveBeenCalled();
  });

  it("returns 429 when the rate limit is exceeded", async () => {
    h.execute.mockResolvedValueOnce({ rows: [{ count: 6 }] });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(429);
    expect(h.insert).not.toHaveBeenCalled();
  });

  it("returns 403 and persists nothing when Turnstile fails", async () => {
    vi.mocked(verifyTurnstile).mockResolvedValueOnce(false);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(403);
    expect(h.insert).not.toHaveBeenCalled();
  });

  it("rejects an oversized body with 413", async () => {
    const huge = JSON.stringify({
      ...validBody,
      message: "x".repeat(20 * 1024),
    });
    const res = await POST(makeRequest(huge));
    expect(res.status).toBe(413);
    expect(h.insert).not.toHaveBeenCalled();
  });

  it("prefers cf-connecting-ip for the rate-limit key", async () => {
    await POST(makeRequest(validBody, { "cf-connecting-ip": "203.0.113.7" }));
    expect(h.execute).toHaveBeenCalledTimes(1);
  });
});
