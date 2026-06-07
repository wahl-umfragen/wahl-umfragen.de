import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/lib/og";
import { parliamentBySlug, STATE_PARLIAMENTS } from "@/lib/parliaments";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return STATE_PARLIAMENTS.map((p) => ({ land: p.slug }));
}

export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ land: string }>;
}) {
  const { land } = await params;
  const p = parliamentBySlug(land);
  return [
    {
      id: land,
      alt: p
        ? `Wahlumfragen ${p.name} – ${p.parliamentName}`
        : "Wahlumfragen Landtag",
    },
  ];
}

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
