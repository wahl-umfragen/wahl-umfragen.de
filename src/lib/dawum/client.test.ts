import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DawumFetchError,
  fetchDawumDatabaseRaw,
  fetchDawumLastUpdateRaw,
  fetchDawumNewestRaw,
} from "./client";
import { SAMPLE_DB } from "./fixtures";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("dawum client", () => {
  it("fetchDawumDatabaseRaw hits api.dawum.de root with revalidation tag", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(SAMPLE_DB), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const db = await fetchDawumDatabaseRaw();
    expect(db.Database.Publisher).toBe("dawum.de");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.dawum.de/",
      expect.objectContaining({
        next: expect.objectContaining({ tags: ["dawum"] }),
      }),
    );
  });

  it("fetchDawumNewestRaw hits the newest_surveys endpoint", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(SAMPLE_DB), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchDawumNewestRaw();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.dawum.de/newest_surveys.json",
      expect.any(Object),
    );
  });

  it("fetchDawumLastUpdateRaw parses ISO text into a Date", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("2026-06-01T10:00:00Z\n", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const d = await fetchDawumLastUpdateRaw();
    expect(d.toISOString()).toBe("2026-06-01T10:00:00.000Z");
  });

  it("throws DawumFetchError on non-2xx", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("nope", {
        status: 503,
        statusText: "Service Unavailable",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchDawumDatabaseRaw()).rejects.toBeInstanceOf(DawumFetchError);
  });
});
