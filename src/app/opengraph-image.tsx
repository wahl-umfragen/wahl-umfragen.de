import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/lib/og";

export const alt = "Wahlumfragen Bundestag – Sonntagsfrage & Wahltrend";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Default social-share card for all routes without their own OG image. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <OgCard
        eyebrow="Bundestagswahl"
        title="Sonntagsfrage Bundestag"
        subtitle="Aktuelle Umfragen, Wahltrend, Sitzverteilung & Koalitionsrechner"
      />
    ),
    { ...size },
  );
}
