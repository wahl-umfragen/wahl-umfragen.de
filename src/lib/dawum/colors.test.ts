import { describe, expect, it } from "vitest";
import { PARTY_FALLBACK_COLOR, partyColor } from "./colors";

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
});
