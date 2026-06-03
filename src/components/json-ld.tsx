/**
 * Renders a Schema.org JSON-LD block. Server component — the script ships in the
 * static HTML so crawlers see it without running JS. Content comes from the
 * builders in `@/lib/seo`, which produce trusted, app-controlled objects (never
 * user input), so serializing into a script tag is safe.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
