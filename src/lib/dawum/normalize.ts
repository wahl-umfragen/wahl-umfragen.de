import {
  BUNDESTAG_PARLIAMENT_ID,
  type DawumDatabase,
  type DawumId,
  type NormalizedSurvey,
} from "./types";

export class DawumLookupError extends Error {
  constructor(kind: string, id: DawumId) {
    super(`dawum: unknown ${kind} id "${id}"`);
    this.name = "DawumLookupError";
  }
}

export function normalizeSurvey(
  db: DawumDatabase,
  id: DawumId,
): NormalizedSurvey {
  const survey = db.Surveys[id];
  if (!survey) throw new DawumLookupError("survey", id);

  const parliament = db.Parliaments[survey.Parliament_ID];
  if (!parliament) throw new DawumLookupError("parliament", survey.Parliament_ID);

  const institute = db.Institutes[survey.Institute_ID];
  if (!institute) throw new DawumLookupError("institute", survey.Institute_ID);

  const tasker =
    survey.Tasker_ID !== undefined ? db.Taskers[survey.Tasker_ID] : undefined;
  const method =
    survey.Method_ID !== undefined ? db.Methods[survey.Method_ID] : undefined;

  const results = Object.entries(survey.Results)
    .map(([partyId, percent]) => {
      const party = db.Parties[partyId];
      if (!party) throw new DawumLookupError("party", partyId);
      return {
        partyId,
        shortcut: party.Shortcut,
        name: party.Name,
        percent,
      };
    })
    .sort((a, b) => b.percent - a.percent);

  return {
    id,
    date: survey.Date,
    periodStart: survey.Survey_Period?.Date_Start,
    periodEnd: survey.Survey_Period?.Date_End,
    surveyedPersons: survey.Surveyed_Persons,
    parliament: {
      id: survey.Parliament_ID,
      shortcut: parliament.Shortcut,
      name: parliament.Name,
    },
    institute: { id: survey.Institute_ID, name: institute.Name },
    tasker:
      survey.Tasker_ID && tasker
        ? { id: survey.Tasker_ID, name: tasker.Name }
        : undefined,
    method:
      survey.Method_ID && method
        ? { id: survey.Method_ID, name: method.Name }
        : undefined,
    results,
  };
}

export function selectBundestagSurveys(db: DawumDatabase): NormalizedSurvey[] {
  return Object.entries(db.Surveys)
    .filter(([, s]) => s.Parliament_ID === BUNDESTAG_PARLIAMENT_ID)
    .map(([id]) => normalizeSurvey(db, id))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function latestPerInstitute(
  surveys: NormalizedSurvey[],
): NormalizedSurvey[] {
  const seen = new Map<DawumId, NormalizedSurvey>();
  for (const s of surveys) {
    const prev = seen.get(s.institute.id);
    if (!prev || s.date > prev.date) seen.set(s.institute.id, s);
  }
  return [...seen.values()].sort((a, b) =>
    a.institute.name.localeCompare(b.institute.name, "de"),
  );
}
