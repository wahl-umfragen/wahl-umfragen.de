"use client";

import { useEffect, useRef, useState } from "react";
import { t } from "@/i18n";

/**
 * Wraps a single chart and adds a button that takes it fullscreen via the
 * browser Fullscreen API. The button sits in its own right-aligned row *above*
 * the chart card, never overlapping the card content. In fullscreen the wrapper
 * becomes a flex column filling the screen and forces the chart card to fill the
 * available height (`!h-full`), so height-driven charts (trend, comparison)
 * expand; charts with an intrinsic height keep it and sit centered. No
 * portal/modal — the element itself is promoted, so chart interactivity and
 * tooltips keep working.
 */
export function Fullscreenable({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const onChange = () => setIsFullscreen(document.fullscreenElement === el);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggle() {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void ref.current?.requestFullscreen();
    }
  }

  const label = t(isFullscreen ? "charts.exitFullscreen" : "charts.fullscreen");

  return (
    <div
      ref={ref}
      className={isFullscreen ? "flex flex-col bg-background p-4" : ""}
    >
      <div className="mb-1.5 flex justify-end">
        <button
          type="button"
          onClick={toggle}
          aria-label={label}
          title={label}
          className="rounded-md border border-border bg-surface p-1.5 text-muted transition-colors hover:text-foreground"
        >
          {isFullscreen ? <CollapseIcon /> : <ExpandIcon />}
        </button>
      </div>
      <div
        className={isFullscreen ? "min-h-0 flex-1 [&>*]:!h-full" : "contents"}
      >
        {children}
      </div>
    </div>
  );
}

function ExpandIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3v3a2 2 0 0 1-2 2H3" />
      <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
      <path d="M3 16h3a2 2 0 0 1 2 2v3" />
      <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}
