import { t } from "@/i18n";

/** Primary navigation, shared by the desktop (SiteNav) and mobile (MobileNav)
 *  renderers so the two never drift apart. */
export const NAV_LINKS = [
  { href: "/", label: t("nav.surveys") },
  { href: "/partei", label: t("nav.parties") },
  { href: "/archiv", label: t("nav.archive") },
  { href: "/trend", label: t("nav.trend") },
  { href: "/laender", label: t("nav.laender") },
  { href: "/wahlen", label: t("nav.elections") },
  { href: "/koalition", label: t("nav.koalition") },
] as const;

/** Active-state test shared by both navs: "/" matches exactly, others by prefix. */
export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
