import { claimRecorder, getGame, listPendingEvents, markSynced } from "@/lib/local/dexie";
import type { SyncedEntry } from "@/lib/local/dexie";
import { ensureDeviceId } from "@/lib/local/device";

export type FlushResult = {
  ok: boolean;
  pending: number;
  reason?: "recorder" | "auth" | "network";
};

export async function flushGame(gameId: string): Promise<FlushResult> {
  let game = await getGame(gameId);
  const pending = await listPendingEvents(gameId);
  if (!game) return { ok: false, pending: pending.length, reason: "network" };

  if (game.recorderDeviceId === "") {
    game = (await claimRecorder(gameId, ensureDeviceId())) ?? game;
  }
  if (!game.recorderDeviceId) {
    return { ok: false, pending: pending.length, reason: "network" };
  }

  try {
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        game,
        events: pending.map((event) => ({
          ...event,
          syncedAt: null,
        })),
      }),
    });

    if (response.status === 401) {
      return { ok: false, pending: pending.length, reason: "auth" };
    }
    if (response.status === 409) {
      return { ok: false, pending: pending.length, reason: "recorder" };
    }
    if (!response.ok) {
      return { ok: false, pending: pending.length, reason: "network" };
    }

    const body = (await response.json()) as { accepted?: SyncedEntry[] };
    if (body.accepted && body.accepted.length > 0) {
      await markSynced(body.accepted);
    }
    const left = await listPendingEvents(gameId);
    return { ok: true, pending: left.length };
  } catch {
    return { ok: false, pending: pending.length, reason: "network" };
  }
}

export async function flushGames(gameIds: string[]): Promise<FlushResult> {
  let pending = 0;
  let ok = true;
  let reason: FlushResult["reason"];
  for (const id of gameIds) {
    const result = await flushGame(id);
    pending += result.pending;
    if (!result.ok && result.reason !== "recorder") {
      ok = false;
      reason = result.reason;
    }
  }
  return { ok, pending, reason };
}
