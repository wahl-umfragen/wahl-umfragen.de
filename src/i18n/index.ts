import deDE from "./de-DE.json";
import enUS from "./en-US.json";

/**
 * Lightweight, dependency-free i18n. `t()` is a pure function over the bundled
 * message catalog and works in both server and client components.
 *
 * The default locale is de-DE; an en-US catalog ships alongside it. `t()` takes
 * an optional `locale` argument so callers can render English once the
 * user-facing locale routing (e.g. an /en subpath + a language switcher) is
 * wired up — the catalogs and key-parity test are the groundwork for that.
 * Until then every call uses the default and the UI stays German.
 */

export const DEFAULT_LOCALE = "de-DE" as const;

export const CATALOGS = {
  "de-DE": deDE,
  "en-US": enUS,
} as const;

export type Locale = keyof typeof CATALOGS;

// de-DE is the source of truth for the key shape; en-US must mirror it (enforced
// by the key-parity unit test).
type Messages = typeof deDE;

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
