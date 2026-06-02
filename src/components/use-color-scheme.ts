"use client";

import { useTheme } from "next-themes";

export type ColorScheme = "light" | "dark";

/**
 * Resolved color scheme from next-themes (follows the manual Light/Dark/System
 * choice, not the OS media query). Defaults to "light" during SSR + first
 * render, matching the app's default theme.
 */
export function useColorScheme(): ColorScheme {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark" ? "dark" : "light";
}
