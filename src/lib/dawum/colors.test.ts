import { describe, expect, it } from "vitest";
import { PARTY_FALLBACK_COLOR, partyColor, partyColorVar } from "./colors";

describe("partyColor", () => {
  it("returns brand colors for the major parties", () => {
    expect(partyColor("CDU/CSU")).toBe("#1f1f1f");
    expect(partyColor("SPD")).toBe("#E3000F");
    expect(partyColor("Grüne")).toBe("#1FA12B");
    expect(partyColor("FDP")).toBe("#FFCC00");
    expect(partyColor("AfD")).toBe("#009EE0");
    expect(partyColor("Linke")).toBe("#BE3075");
    expect(partyColor("BSW")).toBe("#722F75");
  });

  it("falls back for unknown parties", () => {
    expect(partyColor("Foo")).toBe(PARTY_FALLBACK_COLOR);
  });

  it("treats long and short names equivalently for Grüne", () => {
    expect(partyColor("Grüne")).toBe(partyColor("Bündnis 90/Die Grünen"));
  });

  it("returns a brighter CDU color for dark scheme", () => {
    const light = partyColor("CDU/CSU", { scheme: "light" });
    const dark = partyColor("CDU/CSU", { scheme: "dark" });
    expect(light).not.toBe(dark);
    expect(dark).toBe("#d4d4d8");
  });

  it("scheme has no effect on other parties", () => {
    expect(partyColor("SPD", { scheme: "dark" })).toBe(partyColor("SPD"));
  });
});

describe("partyColorVar", () => {
  it("returns the CSS variable wrapping each known party", () => {
    expect(partyColorVar("CDU/CSU")).toBe("var(--party-cdu)");
    expect(partyColorVar("SPD")).toBe("var(--party-spd)");
    expect(partyColorVar("Grüne")).toBe("var(--party-gruene)");
  });

  it("falls back to a generic var for unknown parties", () => {
    expect(partyColorVar("Foo")).toBe("var(--party-fallback)");
  });
});
