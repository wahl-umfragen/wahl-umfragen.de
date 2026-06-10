import type { DawumDatabase } from "./types";

export const SAMPLE_DB: DawumDatabase = {
  Database: {
    License: {
      Name: "Open Database License (ODbL) v1.0",
      Shortcut: "ODbL",
      Link: "https://opendatacommons.org/licenses/odbl/1-0/",
    },
    Publisher: "dawum.de",
    Author: "Test",
    Last_Update: "2026-06-01T10:00:00Z",
  },
  Parliaments: {
    "0": {
      Shortcut: "Bundestag",
      Name: "Bundestag",
      Election: "Bundestagswahl",
    },
    "13": {
      Shortcut: "Sachsen",
      Name: "Sächsischer Landtag",
      Election: "Landtagswahl in Sachsen",
    },
  },
  Institutes: {
    "1": { Name: "Infratest dimap" },
    "4": { Name: "Forsa" },
    "8": { Name: "INSA" },
  },
  Taskers: {
    "1": { Name: "ARD-Morgenmagazin" },
    "5": { Name: "RTL/n-tv" },
  },
  Methods: {
    "1": { Name: "Telefonisch" },
    "3": { Name: "Online" },
  },
  Parties: {
    "1": {
      Shortcut: "CDU/CSU",
      Name: "Christlich Demokratische Union / Christlich-Soziale Union",
    },
    "2": { Shortcut: "SPD", Name: "Sozialdemokratische Partei Deutschlands" },
    "3": { Shortcut: "Grüne", Name: "Bündnis 90/Die Grünen" },
    "7": { Shortcut: "AfD", Name: "Alternative für Deutschland" },
  },
  Surveys: {
    "100": {
      Date: "2026-06-01",
      Survey_Period: { Date_Start: "2026-05-28", Date_End: "2026-05-31" },
      Surveyed_Persons: 1023,
      Parliament_ID: "0",
      Institute_ID: "4",
      Tasker_ID: "5",
      Method_ID: "1",
      Results: { "1": 23, "2": 14, "3": 12, "7": 27 },
    },
    "101": {
      Date: "2026-05-28",
      Parliament_ID: "0",
      Institute_ID: "1",
      Results: { "1": 24, "2": 15, "3": 13, "7": 25 },
    },
    "102": {
      Date: "2026-05-20",
      Parliament_ID: "0",
      Institute_ID: "4",
      Results: { "1": 22, "2": 16, "3": 13, "7": 26 },
    },
    "200": {
      Date: "2026-05-15",
      Parliament_ID: "13",
      Institute_ID: "8",
      Results: { "1": 30, "7": 32 },
    },
  },
};
