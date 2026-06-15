/**
 * Party registry for the per-party pages (`/partei/[slug]`). dawum reports a
 * party under one or more shortcuts that vary over time (e.g. "Grüne" vs
 * "Bündnis 90/Die Grünen", "Linke" vs "Die Linke", "CDU/CSU"/"CDU"/"CSU"), so a
 * party is matched by a set of `aliases`. The `shortcut` is the canonical label
 * (it lines up with the colour map in `dawum/colors.ts`). Mirrors the
 * `STATE_PARLIAMENTS` registry pattern.
 */
export interface PartyInfo {
  /** URL segment under /partei/. */
  slug: string;
  /** Canonical display shortcut (matches dawum/colors.ts). */
  shortcut: string;
  /** Full German party name. */
  name: string;
  /** All dawum result shortcuts that map to this party. */
  aliases: string[];
  /** German Wikipedia article URL — emitted as JSON-LD `sameAs` for entity SEO. */
  wikipedia: string;
}

const WP = "https://de.wikipedia.org/wiki/";

/**
 * Party shortcuts hidden from the entire frontend read path. Freie Wähler is
 * polled for the Bundestag by effectively a single institute, so its series is
 * sparse and unrepresentative. We drop it while assembling the view model (see
 * `mapSurveyRows` in `@/lib/data/load`) rather than from the DB — the raw rows
 * stay ingested and the decision is reversible by emptying this set. Matches
 * both the dawum shortcut and the long name to be safe.
 */
export const HIDDEN_PARTY_SHORTCUTS = new Set(["FW", "Freie Wähler"]);

export const PARTIES: PartyInfo[] = [
  {
    slug: "union",
    shortcut: "CDU/CSU",
    name: "CDU/CSU",
    aliases: ["CDU/CSU", "CDU", "CSU"],
    wikipedia: `${WP}CDU/CSU`,
  },
  {
    slug: "spd",
    shortcut: "SPD",
    name: "SPD",
    aliases: ["SPD"],
    wikipedia: `${WP}Sozialdemokratische_Partei_Deutschlands`,
  },
  {
    slug: "gruene",
    shortcut: "Grüne",
    name: "Bündnis 90/Die Grünen",
    aliases: ["Grüne", "Bündnis 90/Die Grünen"],
    wikipedia: `${WP}B%C3%BCndnis_90/Die_Gr%C3%BCnen`,
  },
  {
    slug: "afd",
    shortcut: "AfD",
    name: "AfD",
    aliases: ["AfD"],
    wikipedia: `${WP}Alternative_f%C3%BCr_Deutschland`,
  },
  {
    slug: "linke",
    shortcut: "Linke",
    name: "Die Linke",
    aliases: ["Linke", "Die Linke"],
    wikipedia: `${WP}Die_Linke`,
  },
  {
    slug: "bsw",
    shortcut: "BSW",
    name: "Bündnis Sahra Wagenknecht",
    aliases: ["BSW"],
    wikipedia: `${WP}B%C3%BCndnis_Sahra_Wagenknecht`,
  },
  {
    slug: "fdp",
    shortcut: "FDP",
    name: "FDP",
    aliases: ["FDP"],
    wikipedia: `${WP}Freie_Demokratische_Partei`,
  },
];

export function partyBySlug(slug: string): PartyInfo | undefined {
  return PARTIES.find((p) => p.slug === slug);
}

/** The registered party whose aliases include this dawum shortcut, if any. */
export function partyByShortcut(shortcut: string): PartyInfo | undefined {
  return PARTIES.find((p) => p.aliases.includes(shortcut));
}
