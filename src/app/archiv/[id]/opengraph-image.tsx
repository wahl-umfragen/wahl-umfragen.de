import { ImageResponse } from "next/og";
import { loadBundestagData } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/lib/og";

export const alt = "Sonntagsfrage einer Umfrage – Wahlumfragen";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Per-survey social card: institute + date and the top parties. */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { bundestag } = await loadBundestagData();
  const survey = bundestag.find((s) => s.id === id);

  if (!survey) {
    return new ImageResponse(<OgCard title="Sonntagsfrage" />, { ...size });
  }

  const top = [...survey.results]
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 5)
    .map((r) => `${r.shortcut} ${r.percent.toFixed(1)} %`)
    .join("    ");

  return new ImageResponse(
    (
      <OgCard
        eyebrow={`${survey.institute.name} · ${formatDate(survey.date)}`}
        title="Sonntagsfrage"
        subtitle={top}
      />
    ),
    { ...size },
  );
}
