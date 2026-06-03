/**
 * State-parliament registry for the Landtagswahlen views. dawum already ingests
 * every parliament's surveys (see `transform.ts`); the frontend just needs to
 * know the dawum parliament id, a URL slug, display names, and the seat/threshold
 * rules to project a seat distribution. Seat totals are the statutory regular
 * sizes ("gesetzliche Mitgliederzahl"); the real chamber can grow with overhang
 * mandates, so projections are an approximation. Thresholds are 5 % across the
 * board (the few special cases — e.g. SSW in Schleswig-Holstein — don't change
 * the 5 % bar itself).
 */
export interface Parliament {
  /** dawum parliament id. */
  id: string;
  /** URL segment under /laender/. */
  slug: string;
  /** State name, e.g. "Bayern". */
  name: string;
  /** Chamber name, e.g. "Bayerischer Landtag". */
  parliamentName: string;
  /** Statutory regular seat count. */
  totalSeats: number;
  /** Electoral threshold in percent. */
  threshold: number;
}

export const STATE_PARLIAMENTS: Parliament[] = [
  { id: "1", slug: "baden-wuerttemberg", name: "Baden-Württemberg", parliamentName: "Landtag von Baden-Württemberg", totalSeats: 120, threshold: 5 },
  { id: "2", slug: "bayern", name: "Bayern", parliamentName: "Bayerischer Landtag", totalSeats: 180, threshold: 5 },
  { id: "3", slug: "berlin", name: "Berlin", parliamentName: "Berliner Abgeordnetenhaus", totalSeats: 130, threshold: 5 },
  { id: "4", slug: "brandenburg", name: "Brandenburg", parliamentName: "Brandenburgischer Landtag", totalSeats: 88, threshold: 5 },
  { id: "5", slug: "bremen", name: "Bremen", parliamentName: "Bremische Bürgerschaft", totalSeats: 84, threshold: 5 },
  { id: "6", slug: "hamburg", name: "Hamburg", parliamentName: "Hamburgische Bürgerschaft", totalSeats: 121, threshold: 5 },
  { id: "7", slug: "hessen", name: "Hessen", parliamentName: "Hessischer Landtag", totalSeats: 110, threshold: 5 },
  { id: "8", slug: "mecklenburg-vorpommern", name: "Mecklenburg-Vorpommern", parliamentName: "Landtag von Mecklenburg-Vorpommern", totalSeats: 71, threshold: 5 },
  { id: "9", slug: "niedersachsen", name: "Niedersachsen", parliamentName: "Niedersächsischer Landtag", totalSeats: 135, threshold: 5 },
  { id: "10", slug: "nordrhein-westfalen", name: "Nordrhein-Westfalen", parliamentName: "Landtag von Nordrhein-Westfalen", totalSeats: 181, threshold: 5 },
  { id: "11", slug: "rheinland-pfalz", name: "Rheinland-Pfalz", parliamentName: "Landtag von Rheinland-Pfalz", totalSeats: 101, threshold: 5 },
  { id: "12", slug: "saarland", name: "Saarland", parliamentName: "Saarländischer Landtag", totalSeats: 51, threshold: 5 },
  { id: "13", slug: "sachsen", name: "Sachsen", parliamentName: "Sächsischer Landtag", totalSeats: 120, threshold: 5 },
  { id: "14", slug: "sachsen-anhalt", name: "Sachsen-Anhalt", parliamentName: "Landtag von Sachsen-Anhalt", totalSeats: 87, threshold: 5 },
  { id: "15", slug: "schleswig-holstein", name: "Schleswig-Holstein", parliamentName: "Landtag von Schleswig-Holstein", totalSeats: 69, threshold: 5 },
  { id: "16", slug: "thueringen", name: "Thüringen", parliamentName: "Thüringischer Landtag", totalSeats: 88, threshold: 5 },
];

export function parliamentBySlug(slug: string): Parliament | undefined {
  return STATE_PARLIAMENTS.find((p) => p.slug === slug);
}
