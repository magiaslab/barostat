import {
  claimRecorder,
  getGame,
  hasOpenRecording,
  listPendingEvents,
  markSynced,
  mergeRemoteSnapshot,
} from "@/lib/local/dexie";
import type { SyncedEntry } from "@/lib/local/dexie";
import { ensureDeviceId, readDeviceId } from "@/lib/local/device";
import { parseSyncSnapshot } from "@/lib/sync-payload";

export type FlushResult = {
  ok: boolean;
  pending: number;
  reason?: "recorder" | "auth" | "network" | "closed" | "limit";
};

let pullInflight: Promise<{ ok: boolean }> | null = null;
let lastPullAt = 0;
const PULL_COOLDOWN_MS = 2000;

/** Un flush per gameId alla volta: le chiamate sovrapposte riusano la stessa Promise. */
const flushInflight = new Map<string, Promise<FlushResult>>();

export async function pullRemote(options?: {
  force?: boolean;
}): Promise<{ ok: boolean }> {
  if (pullInflight) return pullInflight;
  if (!options?.force && Date.now() - lastPullAt < PULL_COOLDOWN_MS) {
    return { ok: true };
  }

  pullInflight = (async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return { ok: false };
      }
      if (await hasOpenRecording(readDeviceId())) {
        return { ok: false };
      }
      const response = await fetch("/api/sync");
      if (response.status === 401) return { ok: false };
      if (!response.ok) return { ok: false };
      const parsed = parseSyncSnapshot(await response.json());
      if (!parsed) return { ok: false };
      await mergeRemoteSnapshot(parsed.games, parsed.events);
      lastPullAt = Date.now();
      return { ok: true };
    } catch {
      return { ok: false };
    } finally {
      pullInflight = null;
    }
  })();

  return pullInflight;
}

async function flushGameOnce(
  gameId: string,
  options?: { pull?: boolean },
): Promise<FlushResult> {
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
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      const error = body?.error;
      if (error === "closed") {
        // Archivio già sul server: ok se non resta coda locale da spedire.
        if (pending.length === 0) {
          return { ok: true, pending: 0 };
        }
        return { ok: false, pending: pending.length, reason: "closed" };
      }
      if (error === "limit") {
        return { ok: false, pending: pending.length, reason: "limit" };
      }
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
    if (options?.pull !== false) {
      await pullRemote();
    }
    return { ok: true, pending: left.length };
  } catch {
    return { ok: false, pending: pending.length, reason: "network" };
  }
}

export async function flushGame(
  gameId: string,
  options?: { pull?: boolean },
): Promise<FlushResult> {
  const existing = flushInflight.get(gameId);
  if (existing) return existing;

  const pending = flushGameOnce(gameId, options).finally(() => {
    flushInflight.delete(gameId);
  });
  flushInflight.set(gameId, pending);
  return pending;
}

/** Solo per i test: svuota il lock in-flight. */
export function resetFlushLocksForTests(): void {
  flushInflight.clear();
}

export async function flushGames(gameIds: string[]): Promise<FlushResult> {
  let pending = 0;
  let ok = true;
  let reason: FlushResult["reason"];
  for (const id of gameIds) {
    const result = await flushGame(id, { pull: false });
    pending += result.pending;
    if (!result.ok && result.reason !== "recorder") {
      ok = false;
      reason = result.reason;
    }
  }
  if (ok) await pullRemote();
  return { ok, pending, reason };
}
