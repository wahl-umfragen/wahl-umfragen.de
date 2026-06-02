"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/i18n";

const LINKS = [
  { href: "/", label: t("nav.surveys") },
  { href: "/archiv", label: t("nav.archive") },
  { href: "/trend", label: t("nav.trend") },
  { href: "/koalition", label: t("nav.koalition") },
] as const;

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav data-testid="site-nav" className="flex gap-1 text-sm">
      {LINKS.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              active
                ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
