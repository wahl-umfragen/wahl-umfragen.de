/** Brand mark: a stylised Sonntagsfrage bar chart in the party palette.
 * The tile uses `currentColor` so it inverts with the theme (dark ink on
 * the light background, light tile in dark mode); the bars keep their fixed
 * party colors. Mirrors `src/app/icon.svg`. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Wahlumfragen"
      className={className}
    >
      <rect width="32" height="32" rx="6" fill="currentColor" />
      <rect x="5" y="18" width="3" height="9" rx="1.2" fill="#e3000f" />
      <rect x="10.25" y="12" width="3" height="15" rx="1.2" fill="#009ee0" />
      <rect x="15.5" y="8" width="3" height="19" rx="1.2" fill="#1fa12b" />
      <rect x="20.75" y="14" width="3" height="13" rx="1.2" fill="#d4a900" />
      <rect x="26" y="20" width="3" height="7" rx="1.2" fill="#be3075" />
    </svg>
  );
}
