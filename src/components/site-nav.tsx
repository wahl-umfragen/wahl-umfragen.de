"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/i18n";

const LINKS = [
  { href: "/", label: t("nav.surveys") },
  { href: "/partei", label: t("nav.parties") },
  { href: "/archiv", label: t("nav.archive") },
  { href: "/trend", label: t("nav.trend") },
  { href: "/vergleich", label: t("nav.compare") },
  { href: "/laender", label: t("nav.laender") },
  { href: "/wahlen", label: t("nav.elections") },
  { href: "/koalition", label: t("nav.koalition") },
] as const;

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav data-testid="site-nav" className="flex flex-wrap gap-1 text-sm">
      {LINKS.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              active
                ? "bg-brand-foreground text-brand"
                : "text-brand-foreground/70 hover:bg-white/10 hover:text-brand-foreground"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
