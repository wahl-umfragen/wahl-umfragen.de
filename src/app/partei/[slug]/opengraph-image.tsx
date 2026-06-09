import { ImageResponse } from "next/og";
import { loadBundestagData } from "@/lib/data";
import { partySeries, surveysWithinDays, weightedAverage } from "@/lib/dawum";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/lib/og";
import { PARTIES, partyBySlug } from "@/lib/parties";

export const alt = "Umfragewerte einer Partei – Wahlumfragen";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Pre-render the social card for every registered party. */
export function generateStaticParams() {
  return PARTIES.map((p) => ({ slug: p.slug }));
}

/** Per-party social card: name + current weighted poll-of-polls value. */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const party = partyBySlug(slug);
  const name = party?.name ?? "Partei";

  let subtitle = "Sonntagsfrage zur Bundestagswahl";
  if (party) {
    const { bundestag } = await loadBundestagData();
    const weighted = weightedAverage(surveysWithinDays(bundestag, 30)).find((p) =>
      party.aliases.includes(p.shortcut),
    );
    const value =
      weighted?.percent ??
      partySeries(bundestag, (s) => party.aliases.includes(s)).latest?.percent;
    if (value !== undefined) {
      subtitle = `Aktueller Schnitt: ${value.toFixed(1).replace(".", ",")} %`;
    }
  }

  return new ImageResponse(
    <OgCard eyebrow="Sonntagsfrage Bundestag" title={name} subtitle={subtitle} />,
    { ...size },
  );
}
