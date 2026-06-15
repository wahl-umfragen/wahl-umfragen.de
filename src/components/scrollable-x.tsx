"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Horizontal scroll container with edge fade-shadows that hint at off-screen
 * content — the wide data tables have one column per party, so on a phone most
 * of them sit past the right edge. Each shadow shows only when the content is
 * actually overscrollable in that direction and fades out at the end, so it
 * doubles as a "swipe for more" affordance without any extra chrome.
 */
export function ScrollableX({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () =>
      setEdges({
        left: el.scrollLeft > 1,
        right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
      });
    el.addEventListener("scroll", update, { passive: true });
    // ResizeObserver fires on observe() and on every size change — that gives
    // the initial measurement and keeps it correct on viewport/content resize,
    // without calling setState directly in the effect body.
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative">
      <div ref={ref} className={`overflow-x-auto ${className}`}>
        {children}
      </div>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/15 to-transparent transition-opacity duration-200 dark:from-black/45 ${
          edges.left ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black/15 to-transparent transition-opacity duration-200 dark:from-black/45 ${
          edges.right ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
