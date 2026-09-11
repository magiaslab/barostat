import { afterEach, describe, expect, test, vi } from "vitest";

import {
  flushGame,
  resetFlushLocksForTests,
} from "@/lib/local/sync";

vi.mock("@/lib/local/dexie", () => ({
  getGame: vi.fn(async () => ({
    id: "g1",
    opponent: "X",
    date: "2026-01-01",
    venue: "home",
    competition: "league",
    createdAt: 1,
    closedAt: null,
    recorderDeviceId: "dev-1",
    recorderUserId: null,
  })),
  listPendingEvents: vi.fn(async () => []),
  claimRecorder: vi.fn(),
  hasOpenRecording: vi.fn(async () => false),
  markSynced: vi.fn(),
  mergeRemoteSnapshot: vi.fn(),
}));

vi.mock("@/lib/local/device", () => ({
  ensureDeviceId: vi.fn(() => "dev-1"),
  readDeviceId: vi.fn(() => "dev-1"),
}));

describe("flushGame in-flight lock", () => {
  afterEach(() => {
    resetFlushLocksForTests();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test("chiamate sovrapposte sullo stesso gameId condividono una sola fetch", async () => {
    let resolveFetch!: (value: Response) => void;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = vi.fn(() => fetchPromise);
    vi.stubGlobal("fetch", fetchMock);

    const a = flushGame("g1", { pull: false });
    const b = flushGame("g1", { pull: false });

    // Lascia partire flushGameOnce fino alla fetch.
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    resolveFetch(
      new Response(JSON.stringify({ ok: true, accepted: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const [ra, rb] = await Promise.all([a, b]);
    expect(ra).toEqual(rb);
    expect(ra.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
