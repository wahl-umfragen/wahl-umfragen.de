import { describe, expect, it, vi } from "vitest";
import { CATALOGS, t, type TranslationKey } from "./index";

describe("t()", () => {
  it("resolves a top-level leaf key", () => {
    expect(t("app.name")).toBe("Wahlumfragen");
  });

  it("resolves a nested leaf key via dot-path", () => {
    expect(t("nav.surveys")).toBe("Umfragen");
  });

  it("substitutes {placeholder} tokens from params", () => {
    expect(t("archive.results", { count: 5 })).toBe("5 Umfragen");
  });

  it("leaves an unknown {placeholder} token intact when no param is given", () => {
    expect(t("archive.results")).toBe("{count} Umfragen");
  });

  it("falls back to the key string for a missing key", () => {
    // Cast: a real missing key is a type error, which is the point — this
    // exercises the runtime fallback for keys that slip through (e.g. typos).
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(t("nav.nope" as TranslationKey)).toBe("nav.nope");
    warn.mockRestore();
  });

  it("renders a non-default locale when asked", () => {
    expect(t("nav.surveys", undefined, "en-US")).toBe("Polls");
    expect(t("report.submit", undefined, "en-US")).toBe("Send");
  });

  it("falls back to the key string when the path points at an object, not a leaf", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(t("nav" as TranslationKey)).toBe("nav");
    warn.mockRestore();
  });
});

describe("locale catalogs", () => {
  /** Recursively collect dot-paths to every string leaf. */
  function leafPaths(obj: unknown, prefix = ""): string[] {
    if (typeof obj !== "object" || obj === null) return [];
    return Object.entries(obj).flatMap(([k, v]) => {
      const path = prefix ? `${prefix}.${k}` : k;
      return typeof v === "object" && v !== null ? leafPaths(v, path) : [path];
    });
  }

  it("en-US has exactly the same keys as de-DE (no missing or extra)", () => {
    const de = leafPaths(CATALOGS["de-DE"]).sort();
    const en = leafPaths(CATALOGS["en-US"]).sort();
    expect(en).toEqual(de);
  });
});
