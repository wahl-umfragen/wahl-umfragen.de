import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/lib/og";

export const alt = "Datenstand – Wahlumfragen";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return new ImageResponse(
    <OgCard
      eyebrow="Wahlumfragen"
      title="Datenstand"
      subtitle="Aktualität und Abdeckung der Umfragen"
    />,
    { ...OG_SIZE },
  );
}
