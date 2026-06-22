import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

import { revalidateTag } from "next/cache";
import { SURVEYS_TAG } from "@/lib/data/tags";
import { POST } from "./route";

const ORIGINAL_SECRET = process.env.REVALIDATE_SECRET;

function makeRequest(headers: Record<string, string> = {}) {
  return { headers: new Headers(headers) } as Parameters<typeof POST>[0];
}

beforeEach(() => {
  vi.mocked(revalidateTag).mockClear();
  process.env.REVALIDATE_SECRET = "topsecret";
});

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.REVALIDATE_SECRET;
  else process.env.REVALIDATE_SECRET = ORIGINAL_SECRET;
});

describe("POST /api/revalidate", () => {
  it("returns 503 and revalidates nothing when no secret is configured", async () => {
    delete process.env.REVALIDATE_SECRET;
    const res = await POST(makeRequest({ "x-revalidate-secret": "anything" }));
    expect(res.status).toBe(503);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("returns 401 for a wrong secret without revalidating", async () => {
    const res = await POST(makeRequest({ "x-revalidate-secret": "wrong" }));
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("returns 401 when the secret header is missing", async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("revalidates the surveys tag for a correct secret", async () => {
    const res = await POST(makeRequest({ "x-revalidate-secret": "topsecret" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ revalidated: true, tag: SURVEYS_TAG });
    expect(revalidateTag).toHaveBeenCalledWith(SURVEYS_TAG, { expire: 0 });
  });
});
