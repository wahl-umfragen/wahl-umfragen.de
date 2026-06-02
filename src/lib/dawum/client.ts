import { cache } from "react";
import type { DawumDatabase } from "./types";

const DAWUM_FULL = "https://api.dawum.de/";
const DAWUM_NEWEST = "https://api.dawum.de/newest_surveys.json";
const DAWUM_LAST_UPDATE = "https://api.dawum.de/last_update.txt";

const REVALIDATE_SECONDS = 15 * 60;
const CACHE_TAG = "dawum";

export class DawumFetchError extends Error {
  constructor(
    public url: string,
    public status: number,
    public statusText: string,
  ) {
    super(`dawum: fetch ${url} failed: ${status} ${statusText}`);
    this.name = "DawumFetchError";
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS, tags: [CACHE_TAG] },
  });
  if (!res.ok) {
    throw new DawumFetchError(url, res.status, res.statusText);
  }
  return (await res.json()) as T;
}

export async function fetchDawumDatabaseRaw(): Promise<DawumDatabase> {
  return fetchJson<DawumDatabase>(DAWUM_FULL);
}

export async function fetchDawumNewestRaw(): Promise<DawumDatabase> {
  return fetchJson<DawumDatabase>(DAWUM_NEWEST);
}

export async function fetchDawumLastUpdateRaw(): Promise<Date> {
  const res = await fetch(DAWUM_LAST_UPDATE, {
    next: { revalidate: REVALIDATE_SECONDS, tags: [CACHE_TAG] },
  });
  if (!res.ok) {
    throw new DawumFetchError(DAWUM_LAST_UPDATE, res.status, res.statusText);
  }
  return new Date((await res.text()).trim());
}

export const fetchDawumDatabase = cache(fetchDawumDatabaseRaw);
export const fetchDawumNewest = cache(fetchDawumNewestRaw);
export const fetchDawumLastUpdate = cache(fetchDawumLastUpdateRaw);

export const DAWUM_CACHE_TAG = CACHE_TAG;
