const FALLBACK_COLOR = "#8a8a8a";
const FALLBACK_VAR = "--party-fallback";

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

const VAR_BY_SHORTCUT: Record<string, string> = {
  "CDU/CSU": "--party-cdu",
  CDU: "--party-cdu",
  CSU: "--party-cdu",
  SPD: "--party-spd",
  Grüne: "--party-gruene",
  "Bündnis 90/Die Grünen": "--party-gruene",
  FDP: "--party-fdp",
  AfD: "--party-afd",
  Linke: "--party-linke",
  "Die Linke": "--party-linke",
  BSW: "--party-bsw",
  FW: "--party-fw",
  "Freie Wähler": "--party-fw",
  Piraten: "--party-fw",
  Tierschutz: "--party-tierschutz",
};

const CDU_SHORTCUTS = new Set(["CDU/CSU", "CDU", "CSU"]);

export interface PartyColorOptions {
  /** Color scheme of the surrounding surface — affects only parties whose default has poor dark-mode contrast (CDU). */
  scheme?: "light" | "dark";
}

export function partyColor(
  shortcut: string,
  { scheme = "light" }: PartyColorOptions = {},
): string {
  if (scheme === "dark" && CDU_SHORTCUTS.has(shortcut)) {
    return "#d4d4d8";
  }
  return COLOR_BY_SHORTCUT[shortcut] ?? FALLBACK_COLOR;
}

export function partyColorVar(shortcut: string): string {
  const name = VAR_BY_SHORTCUT[shortcut] ?? FALLBACK_VAR;
  return `var(${name})`;
}

export const PARTY_FALLBACK_COLOR = FALLBACK_COLOR;
