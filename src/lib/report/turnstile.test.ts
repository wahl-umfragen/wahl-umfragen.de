import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isTurnstileEnabled, verifyTurnstile } from "./turnstile";

const ORIGINAL_SECRET = process.env.TURNSTILE_SECRET;

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.TURNSTILE_SECRET;
  else process.env.TURNSTILE_SECRET = ORIGINAL_SECRET;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("isTurnstileEnabled", () => {
  it("reflects whether the secret is set", () => {
    process.env.TURNSTILE_SECRET = "shh";
    expect(isTurnstileEnabled()).toBe(true);
    delete process.env.TURNSTILE_SECRET;
    expect(isTurnstileEnabled()).toBe(false);
  });
});

describe("verifyTurnstile", () => {
  describe("when not configured", () => {
    beforeEach(() => {
      delete process.env.TURNSTILE_SECRET;
    });

    it("skips verification and returns true without calling the network", async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);
      await expect(verifyTurnstile("anything")).resolves.toBe(true);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("when configured", () => {
    beforeEach(() => {
      process.env.TURNSTILE_SECRET = "shh";
    });

    it("fails closed for a missing or non-string token (no network call)", async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);
      await expect(verifyTurnstile("")).resolves.toBe(false);
      await expect(verifyTurnstile(undefined)).resolves.toBe(false);
      await expect(verifyTurnstile(123)).resolves.toBe(false);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("returns true when siteverify reports success", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          json: () => Promise.resolve({ success: true }),
        }),
      );
      await expect(verifyTurnstile("good-token", "1.2.3.4")).resolves.toBe(
        true,
      );
    });

    it("returns false when siteverify reports failure", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          json: () =>
            Promise.resolve({ success: false, "error-codes": ["bad"] }),
        }),
      );
      await expect(verifyTurnstile("bad-token")).resolves.toBe(false);
    });

    it("fails closed on a network error", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));
      vi.spyOn(console, "error").mockImplementation(() => {});
      await expect(verifyTurnstile("token")).resolves.toBe(false);
    });
  });
});
