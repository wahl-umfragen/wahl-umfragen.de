export type DawumId = string;

export interface DawumLicense {
  Name: string;
  Shortcut: string;
  Link: string;
}

export interface DawumDatabaseMeta {
  License: DawumLicense;
  Publisher: string;
  Author: string;
  Last_Update: string;
}

export interface DawumParliament {
  Shortcut: string;
  Name: string;
  Election: string;
}

export interface DawumInstitute {
  Name: string;
}

export interface DawumTasker {
  Name: string;
}

export interface DawumMethod {
  Name: string;
}

export interface DawumParty {
  Shortcut: string;
  Name: string;
}

export interface DawumSurveyPeriod {
  Date_Start: string;
  Date_End: string;
}

export interface DawumSurvey {
  Date: string;
  Survey_Period?: DawumSurveyPeriod;
  Surveyed_Persons?: number;
  Parliament_ID: DawumId;
  Institute_ID: DawumId;
  Tasker_ID?: DawumId;
  Method_ID?: DawumId;
  Results: Record<DawumId, number>;
}

export interface DawumDatabase {
  Database: DawumDatabaseMeta;
  Parliaments: Record<DawumId, DawumParliament>;
  Institutes: Record<DawumId, DawumInstitute>;
  Taskers: Record<DawumId, DawumTasker>;
  Methods: Record<DawumId, DawumMethod>;
  Parties: Record<DawumId, DawumParty>;
  Surveys: Record<DawumId, DawumSurvey>;
}

export interface NormalizedPartyResult {
  partyId: DawumId;
  shortcut: string;
  name: string;
  percent: number;
}

export interface NormalizedSurvey {
  id: DawumId;
  date: string;
  periodStart?: string;
  periodEnd?: string;
  surveyedPersons?: number;
  parliament: { id: DawumId; shortcut: string; name: string };
  institute: { id: DawumId; name: string };
  tasker?: { id: DawumId; name: string };
  method?: { id: DawumId; name: string };
  results: NormalizedPartyResult[];
}

export const BUNDESTAG_PARLIAMENT_ID: DawumId = "0";
