/**
 * Renders a Schema.org JSON-LD block. Server component — the script ships in the
 * static HTML so crawlers see it without running JS.
 *
 * Some builders embed dawum-derived strings (e.g. institute names in the
 * breadcrumbs on /archiv/[id] and /institut/[id]). `JSON.stringify` escapes `"`
 * and `\` but NOT `<`, `>`, `&`, or the U+2028/U+2029 line separators, so a name
 * containing `</script>` would otherwise break out of this inline script tag
 * (stored XSS). We escape those characters to their `\uXXXX` JSON forms — same
 * string value, but no character can close the tag or break the JS parse.
 */
function serializeJsonLd(data: object | object[]): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
