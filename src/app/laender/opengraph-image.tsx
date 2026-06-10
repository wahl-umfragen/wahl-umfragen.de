import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/lib/og";

export const alt =
  "Wahlumfragen Landtage – Aktuelle Umfragen alle Bundesländer";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Social card for the /laender index: all 16 state parliaments overview. */
export default function OpengraphImage() {
  return new ImageResponse(
    <OgCard
      eyebrow="Landtagswahlen"
      title="Wahlumfragen Bundesländer"
      subtitle="Aktuelle Umfragen zu allen 16 Landtagen"
    />,
    { ...size },
  );
}
