import type { DawumDatabase } from "@/lib/dawum/types";

export interface IngestRows {
  parliaments: Array<{
    id: string;
    shortcut: string;
    name: string;
    election: string;
  }>;
  institutes: Array<{ id: string; name: string }>;
  taskers: Array<{ id: string; name: string }>;
  methods: Array<{ id: string; name: string }>;
  parties: Array<{ id: string; shortcut: string; name: string }>;
  surveys: Array<{
    id: string;
    date: string;
    parliamentId: string;
    instituteId: string;
    taskerId: string | null;
    methodId: string | null;
    surveyedPersons: number | null;
    periodStart: string | null;
    periodEnd: string | null;
  }>;
  surveyResults: Array<{
    surveyId: string;
    partyId: string;
    percent: number;
  }>;
}

export function transformDawumToRows(data: DawumDatabase): IngestRows {
  return {
    parliaments: Object.entries(data.Parliaments).map(([id, p]) => ({
      id,
      shortcut: p.Shortcut,
      name: p.Name,
      election: p.Election,
    })),
    institutes: Object.entries(data.Institutes).map(([id, i]) => ({
      id,
      name: i.Name,
    })),
    taskers: Object.entries(data.Taskers).map(([id, t]) => ({
      id,
      name: t.Name,
    })),
    methods: Object.entries(data.Methods).map(([id, m]) => ({
      id,
      name: m.Name,
    })),
    parties: Object.entries(data.Parties).map(([id, p]) => ({
      id,
      shortcut: p.Shortcut,
      name: p.Name,
    })),
    surveys: Object.entries(data.Surveys).map(([id, s]) => ({
      id,
      date: s.Date,
      parliamentId: s.Parliament_ID,
      instituteId: s.Institute_ID,
      taskerId: s.Tasker_ID ?? null,
      methodId: s.Method_ID ?? null,
      surveyedPersons: s.Surveyed_Persons ?? null,
      periodStart: s.Survey_Period?.Date_Start ?? null,
      periodEnd: s.Survey_Period?.Date_End ?? null,
    })),
    surveyResults: Object.entries(data.Surveys).flatMap(([surveyId, s]) =>
      Object.entries(s.Results).map(([partyId, percent]) => ({
        surveyId,
        partyId,
        percent,
      })),
    ),
  };
}
