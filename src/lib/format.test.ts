import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime } from "./format";

describe("formatDate", () => {
  it("formats a valid ISO date in de-DE locale", () => {
    const out = formatDate("2025-01-15");
    // Don't pin the exact ICU string (locale data varies); assert the parts.
    expect(out).toMatch(/2025/);
    expect(out).toMatch(/15/);
    expect(out).not.toBe("2025-01-15");
  });

  it("returns the input unchanged when it is not a parseable date", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
    expect(formatDate("")).toBe("");
  });
});

describe("formatDateTime", () => {
  it("formats a valid ISO timestamp with a time component", () => {
    const out = formatDateTime("2025-01-15T10:30:00Z");
    expect(out).toMatch(/2025/);
    // de-DE time uses a colon between hours and minutes.
    expect(out).toMatch(/:/);
  });

  it("returns the input unchanged when it is not a parseable date", () => {
    expect(formatDateTime("garbage")).toBe("garbage");
    expect(formatDateTime("")).toBe("");
  });
});
