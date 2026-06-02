import messages from "./de-DE.json";

/**
 * Lightweight, dependency-free i18n. The app is single-locale (de-DE) for now;
 * `t()` is a pure function over the bundled message catalog and works in both
 * server and client components. To add a locale later, introduce a second JSON
 * and select the catalog per request/context.
 */

type Messages = typeof messages;

// Dot-paths into the catalog, e.g. "home.title" — gives autocomplete and
// compile-time errors on typos.
type LeafPaths<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : `${K}.${LeafPaths<T[K]>}`;
}[keyof T & string];

export type TranslationKey = LeafPaths<Messages>;

/** Values to substitute into `{placeholder}` tokens. */
export type TranslationParams = Record<string, string | number>;

export function t(key: TranslationKey, params?: TranslationParams): string {
  const value = key
    .split(".")
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      messages,
    );

  if (typeof value !== "string") {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[i18n] missing translation for key "${key}"`);
    }
    return key;
  }

  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in params ? String(params[name]) : `{${name}}`,
  );
}

export { messages };
