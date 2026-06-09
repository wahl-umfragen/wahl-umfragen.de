import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/lib/og";

export const alt = "Bundestagswahl-Ergebnisse – Wahlumfragen";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return new ImageResponse(
    <OgCard
      eyebrow="Bundestagswahl"
      title="Wahlergebnisse"
      subtitle="Amtliche Zweitstimmen je Partei"
    />,
    { ...OG_SIZE },
  );
}
