import { describe, expect, it } from "vitest";
import { failPingUrl } from "./heartbeat";

describe("failPingUrl", () => {
  it("appends /fail to a base ping URL", () => {
    expect(failPingUrl("https://hc-ping.com/abc123")).toBe(
      "https://hc-ping.com/abc123/fail",
    );
  });

  it("does not double the slash when the base has a trailing slash", () => {
    expect(failPingUrl("https://hc-ping.com/abc123/")).toBe(
      "https://hc-ping.com/abc123/fail",
    );
  });
});
