import { ImageResponse } from "next/og";
import { loadSurveysByInstitute } from "@/lib/data";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/lib/og";

export const alt = "Umfragen eines Instituts – Wahlumfragen";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Per-institute social card: name + how many surveys, since when. */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const surveys = await loadSurveysByInstitute(id);
  const name = surveys[0]?.institute.name ?? "Institut";
  const sinceYear = surveys.length
    ? new Date(
        [...surveys].sort((a, b) => a.date.localeCompare(b.date))[0].date,
      ).getFullYear()
    : null;

  return new ImageResponse(
    (
      <OgCard
        eyebrow="Umfragen-Institut"
        title={name}
        subtitle={
          sinceYear
            ? `${surveys.length} Bundestags-Umfragen seit ${sinceYear}`
            : "Bundestags-Umfragen"
        }
      />
    ),
    { ...size },
  );
}
