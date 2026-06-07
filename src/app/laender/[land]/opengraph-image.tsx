import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/lib/og";
import { parliamentBySlug } from "@/lib/parliaments";

export const alt = "Wahlumfragen Landtag – Aktuelle Umfragen zur Landtagswahl";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ land: string }>;
}) {
  const { land } = await params;
  const p = parliamentBySlug(land);

  if (!p) {
    return new ImageResponse(
      <OgCard eyebrow="Landtagswahl" title="Wahlumfragen Landtag" />,
      { ...size },
    );
  }

  return new ImageResponse(
    (
      <OgCard
        eyebrow="Landtagswahl"
        title={`Umfragen ${p.name}`}
        subtitle={p.parliamentName}
      />
    ),
    { ...size },
  );
}
