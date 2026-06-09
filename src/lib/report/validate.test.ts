import { describe, expect, it } from "vitest";
import {
  isHoneypotTripped,
  MAX_MESSAGE_LENGTH,
  validateReport,
} from "./validate";

describe("validateReport", () => {
  const base = { category: "bug", message: "Something is broken" };

  it("accepts a minimal valid report and normalises email to null", () => {
    const result = validateReport(base);
    expect(result).toEqual({
      ok: true,
      value: { category: "bug", message: "Something is broken", email: null },
    });
  });

  it("trims the message", () => {
    const result = validateReport({ ...base, message: "  hi there  " });
    expect(result.ok && result.value.message).toBe("hi there");
  });

  it("accepts and trims a valid email", () => {
    const result = validateReport({ ...base, email: "  me@example.com " });
    expect(result.ok && result.value.email).toBe("me@example.com");
  });

  it("treats an empty-string email as not supplied", () => {
    const result = validateReport({ ...base, email: "" });
    expect(result.ok && result.value.email).toBeNull();
  });

  it.each([null, undefined, 42, "string"])(
    "rejects non-object input: %s",
    (input) => {
      expect(validateReport(input).ok).toBe(false);
    },
  );

  it("rejects an unknown category", () => {
    expect(validateReport({ ...base, category: "spam" }).ok).toBe(false);
  });

  it("rejects a missing/blank message", () => {
    expect(validateReport({ category: "bug" }).ok).toBe(false);
    expect(validateReport({ ...base, message: "   " }).ok).toBe(false);
  });

  it("rejects a message over the length cap", () => {
    const long = "x".repeat(MAX_MESSAGE_LENGTH + 1);
    expect(validateReport({ ...base, message: long }).ok).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(validateReport({ ...base, email: "not-an-email" }).ok).toBe(false);
  });
});

describe("isHoneypotTripped", () => {
  it("is tripped when the hidden field has content", () => {
    expect(isHoneypotTripped("http://spam.example")).toBe(true);
  });

  it("is not tripped for empty/whitespace/missing values", () => {
    expect(isHoneypotTripped("")).toBe(false);
    expect(isHoneypotTripped("   ")).toBe(false);
    expect(isHoneypotTripped(undefined)).toBe(false);
    expect(isHoneypotTripped(null)).toBe(false);
  });
});
