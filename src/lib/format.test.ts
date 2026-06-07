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

  it("renders the 15th (not 14th) for 2025-01-15 regardless of host TZ", () => {
    // new Date("2025-01-15") parses as UTC midnight; without Europe/Berlin pin
    // a UTC-behind host would shift the day to the 14th.
    expect(formatDate("2025-01-15")).toMatch(/15/);
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

  it("renders Berlin wall-clock time for a known UTC instant (CEST = UTC+2)", () => {
    // 2025-07-01T12:00:00Z is 14:00 in Berlin (CEST).
    // This would render as 12:00 on a UTC host without the Europe/Berlin pin.
    const out = formatDateTime("2025-07-01T12:00:00Z");
    expect(out).toMatch(/14/);
  });

  it("renders Berlin wall-clock time for a known UTC instant (CET = UTC+1)", () => {
    // 2025-01-15T13:00:00Z is 14:00 in Berlin (CET).
    const out = formatDateTime("2025-01-15T13:00:00Z");
    expect(out).toMatch(/14/);
  });

  it("returns the input unchanged when it is not a parseable date", () => {
    expect(formatDateTime("garbage")).toBe("garbage");
    expect(formatDateTime("")).toBe("");
  });
});
