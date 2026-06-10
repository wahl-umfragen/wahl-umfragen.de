import { SITE_NAME } from "./seo";

/** Shared layout for the generated OpenGraph cards (1200×630). */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const BG = "#0c0a09";
const FG = "#fafaf9";
const MUTED = "#a1a1aa";

// Party accent colors, CDU lightened so it shows on the dark card.
const ACCENT = [
  "#d4d4d8",
  "#E3000F",
  "#1FA12B",
  "#009EE0",
  "#BE3075",
  "#FFCC00",
  "#722F75",
];

/**
 * The branded card used by every opengraph-image route. Uses only the satori
 * CSS subset (flexbox + inline styles); every element with children declares
 * `display: flex`.
 */
export function OgCard({
  title,
  subtitle,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: BG,
        color: FG,
        padding: 72,
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          fontSize: 32,
          color: MUTED,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          {ACCENT.slice(0, 4).map((c, i) => (
            <div
              key={i}
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                background: c,
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex" }}>{SITE_NAME}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {eyebrow ? (
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: MUTED,
              letterSpacing: 1,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        <div
          style={{
            display: "flex",
            fontSize: 68,
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              display: "flex",
              fontSize: 32,
              color: MUTED,
              lineHeight: 1.3,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          height: 12,
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        {ACCENT.map((c, i) => (
          <div key={i} style={{ display: "flex", flex: 1, background: c }} />
        ))}
      </div>
    </div>
  );
}
