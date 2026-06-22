import deDE from "./de-DE.json";

/**
 * Lightweight, dependency-free i18n. `t()` is a pure function over the bundled
 * message catalog and works in both server and client components.
 *
 * The app is currently German-only (de-DE). `t()` still accepts an optional
 * `locale` argument so a second catalog can be added later without touching
 * call sites, but de-DE is the only locale that ships today.
 */

export const DEFAULT_LOCALE = "de-DE" as const;

export const CATALOGS = {
  "de-DE": deDE,
} as const;

export type Locale = keyof typeof CATALOGS;

type Messages = typeof deDE;

// Dot-paths into the catalog, e.g. "home.title" — gives autocomplete and
// compile-time errors on typos.
type LeafPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${LeafPaths<T[K]>}`;
}[keyof T & string];

export type TranslationKey = LeafPaths<Messages>;

/** Values to substitute into `{placeholder}` tokens. */
export type TranslationParams = Record<string, string | number>;

export function t(
  key: TranslationKey,
  params?: TranslationParams,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const catalog = CATALOGS[locale] ?? CATALOGS[DEFAULT_LOCALE];
  let value = lookup(catalog, key);
  // Fall back to the default locale if a key is missing in the chosen one.
  if (typeof value !== "string" && locale !== DEFAULT_LOCALE) {
    value = lookup(CATALOGS[DEFAULT_LOCALE], key);
  }

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

function lookup(catalog: unknown, key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      catalog,
    );
}

export const messages = deDE;
