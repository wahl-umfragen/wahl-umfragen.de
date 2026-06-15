"use client";

import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Lightweight, dependency-free HTML tooltip. The trigger renders inline; while
 * it is hovered or keyboard-focused, the tooltip is rendered into a portal on
 * <body> and positioned with fixed viewport coordinates, so it escapes
 * overflow-clipping ancestors (e.g. the horizontally scrollable survey table).
 *
 * `label` doubles as the trigger's accessible name (aria-label), so icon-only
 * triggers stay meaningful to screen readers even when the visual tooltip isn't
 * shown. Meant for short, glyph/icon-sized triggers.
 */
export function Tooltip({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  function open() {
    const rect = triggerRef.current?.getBoundingClientRect();
    // Anchor above the trigger, horizontally centred; 8px gap baked into top.
    if (rect) setPos({ top: rect.top - 8, left: rect.left + rect.width / 2 });
  }
  const close = () => setPos(null);

  return (
    <span
      ref={triggerRef}
      tabIndex={0}
      aria-label={label}
      className={`cursor-help ${className}`}
      onMouseEnter={open}
      onMouseLeave={close}
      onFocus={open}
      onBlur={close}
    >
      {children}
      {pos && typeof document !== "undefined"
        ? createPortal(
            <span
              role="tooltip"
              aria-hidden="true"
              style={{ top: pos.top, left: pos.left }}
              className="pointer-events-none fixed z-50 max-w-[16rem] -translate-x-1/2 -translate-y-full whitespace-normal rounded-md bg-foreground px-2 py-1 text-xs font-medium leading-snug text-background shadow-lg"
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
