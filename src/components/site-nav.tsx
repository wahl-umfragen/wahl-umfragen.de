"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, NAV_LINKS } from "./nav-links";

/**
 * Desktop primary navigation: the full inline link row. Hidden below `lg`,
 * where the header switches to the hamburger MobileNav — eight links don't fit
 * a phone width without wrapping into several rows.
 */
export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav
      data-testid="site-nav"
      className="hidden flex-wrap gap-1 text-sm lg:flex"
    >
      {NAV_LINKS.map((link) => {
        const active = isActive(pathname, link.href);
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
