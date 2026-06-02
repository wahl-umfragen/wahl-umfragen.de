const FALLBACK_COLOR = "#8a8a8a";

const COLOR_BY_SHORTCUT: Record<string, string> = {
  "CDU/CSU": "#1f1f1f",
  CDU: "#1f1f1f",
  CSU: "#1f1f1f",
  SPD: "#E3000F",
  Grüne: "#1FA12B",
  "Bündnis 90/Die Grünen": "#1FA12B",
  FDP: "#FFCC00",
  AfD: "#009EE0",
  Linke: "#BE3075",
  "Die Linke": "#BE3075",
  BSW: "#722F75",
  FW: "#FF8C00",
  "Freie Wähler": "#FF8C00",
  Piraten: "#FF8C00",
  Tierschutz: "#557A38",
  Sonstige: FALLBACK_COLOR,
  "Sonstige Parteien": FALLBACK_COLOR,
  Andere: FALLBACK_COLOR,
};

export function partyColor(shortcut: string): string {
  return COLOR_BY_SHORTCUT[shortcut] ?? FALLBACK_COLOR;
}

export const PARTY_FALLBACK_COLOR = FALLBACK_COLOR;
