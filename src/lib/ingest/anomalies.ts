import type { IngestRows } from "./transform";

/**
 * Plausibility checks over the transformed ingest rows, so a malformed or
 * surprising dawum payload is *flagged* (logged + alerted) rather than silently
 * stored. Pure and side-effect free — `run.ts` calls it and decides what to do
 * (it still upserts; an anomaly is a warning, not a hard reject).
 */

/** A survey's party shares should sum to ~100 (dawum includes a "Sonstige"
 * bucket). Outside this band something is off (missing parties, bad parse). */
export const MIN_SUM = 85;
export const MAX_SUM = 115;

export type AnomalyKind = "empty" | "range" | "sum" | "sample" | "period";

export interface Anomaly {
  surveyId: string;
  kind: AnomalyKind;
  detail: string;
}

export function detectAnomalies(rows: IngestRows): Anomaly[] {
  const sums = new Map<string, number>();
  const counts = new Map<string, number>();
  const anomalies: Anomaly[] = [];

  for (const r of rows.surveyResults) {
    sums.set(r.surveyId, (sums.get(r.surveyId) ?? 0) + r.percent);
    counts.set(r.surveyId, (counts.get(r.surveyId) ?? 0) + 1);
    if (r.percent < 0 || r.percent > 100) {
      anomalies.push({
        surveyId: r.surveyId,
        kind: "range",
        detail: `percent ${r.percent} for party ${r.partyId} is outside [0, 100]`,
      });
    }
  }

  for (const s of rows.surveys) {
    // A negative sample size is never valid (dawum may omit it → null is fine).
    if (s.surveyedPersons != null && s.surveyedPersons < 0) {
      anomalies.push({
        surveyId: s.id,
        kind: "sample",
        detail: `surveyedPersons ${s.surveyedPersons} is negative`,
      });
    }
    // Field period must not run backwards. Dates are ISO (YYYY-MM-DD), so a
    // lexicographic compare is a correct chronological compare.
    if (s.periodStart && s.periodEnd && s.periodStart > s.periodEnd) {
      anomalies.push({
        surveyId: s.id,
        kind: "period",
        detail: `survey period starts ${s.periodStart} after it ends ${s.periodEnd}`,
      });
    }

    const n = counts.get(s.id) ?? 0;
    if (n === 0) {
      anomalies.push({
        surveyId: s.id,
        kind: "empty",
        detail: "survey has no party results",
      });
      continue;
    }
    const sum = sums.get(s.id) ?? 0;
    if (sum < MIN_SUM || sum > MAX_SUM) {
      anomalies.push({
        surveyId: s.id,
        kind: "sum",
        detail: `party shares sum to ${sum.toFixed(1)} (expected ~100)`,
      });
    }
  }

  return anomalies;
}
