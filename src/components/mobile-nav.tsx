"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { t } from "@/i18n";
import { isActive, NAV_LINKS } from "./nav-links";

/**
 * Mobile primary navigation: a hamburger button (shown below `lg`, where the
 * inline SiteNav is hidden) that toggles a full-width dropdown panel under the
 * sticky header. The panel is positioned `absolute` against the header, so the
 * header element must be `relative`. Closes on navigation, Escape, or an
 * outside tap.
 */
export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={t(open ? "nav.close" : "nav.menu")}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-md text-brand-foreground transition-colors hover:bg-white/10"
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      {open ? (
        <>
          {/* Tap anywhere outside the panel to close it. */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <nav
            id="mobile-nav"
            data-testid="mobile-nav"
            className="absolute inset-x-0 top-full z-40 border-b border-brand-hover/40 bg-brand px-6 pb-4 pt-2 shadow-lg"
          >
            <ul className="flex flex-col gap-1 text-sm">
              {NAV_LINKS.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={`block rounded-md px-3 py-2.5 font-medium transition-colors ${
                        active
                          ? "bg-brand-foreground text-brand"
                          : "text-brand-foreground/80 hover:bg-white/10 hover:text-brand-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      ) : null}
    </div>
  );
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
