/**
 * Tiny escaping helpers for the hand-built XML (RSS feed) and HTML (embed
 * widget) documents. Centralised so both routes share one implementation and it
 * can be unit-tested. Not a general-purpose sanitizer — only the entity set
 * needed for text/attribute contexts in those documents.
 */

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
