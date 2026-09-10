import Dexie, { type EntityTable } from "dexie";

import type { Band, GameEvent, Outcome, Period, Team } from "@/lib/types";

export type EventDraft = {
  gameId: string;
  period: Period;
  team: Team;
  band: Band;
  outcome: Outcome;
};

export type BarostatDB = Dexie & {
  events: EntityTable<GameEvent, "id">;
};

let db: BarostatDB | undefined;

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0"));
  return `${h.slice(0, 4).join("")}-${h.slice(4, 6).join("")}-${h.slice(6, 8).join("")}-${h.slice(8, 10).join("")}-${h.slice(10).join("")}`;
}

export function getDb(): BarostatDB {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB non disponibile");
  }
  if (!db) {
    db = new Dexie("barostat-24") as BarostatDB;
    db.version(1).stores({
      events: "id, gameId, [gameId+seq]",
    });
    db.version(2)
      .stores({
        events: "id, gameId, [gameId+seq], syncedAt",
      })
      .upgrade(async (tx) => {
        await tx
          .table("events")
          .toCollection()
          .modify((event: { syncedAt?: number | null }) => {
            if (event.syncedAt === undefined) event.syncedAt = null;
          });
      });
  }
  return db;
}

export async function closeDb(): Promise<void> {
  if (!db) return;
  db.close();
  db = undefined;
}

export async function listLiveEvents(gameId: string): Promise<GameEvent[]> {
  const rows = await getDb().events.where("gameId").equals(gameId).sortBy("seq");
  return rows.filter((event) => event.deletedAt === null);
}

export async function listPendingEvents(gameId: string): Promise<GameEvent[]> {
  const rows = await getDb().events.where("gameId").equals(gameId).sortBy("seq");
  return rows.filter((event) => event.syncedAt === null);
}

export async function markSynced(ids: string[]): Promise<void> {
  const store = getDb();
  const now = Date.now();
  await store.transaction("rw", store.events, async () => {
    for (const id of ids) {
      const event = await store.events.get(id);
      if (!event) continue;
      await store.events.put({ ...event, syncedAt: now });
    }
  });
}

export async function appendEvent(draft: EventDraft): Promise<GameEvent> {
  const store = getDb();
  const now = Date.now();
  const id = newId();

  return store.transaction("rw", store.events, async () => {
    const rows = await store.events.where("gameId").equals(draft.gameId).sortBy("seq");
    // Il seq cresce anche sugli eventi annullati, così un pop non riusa l'ordine.
    const seq = (rows.at(-1)?.seq ?? 0) + 1;
    const event: GameEvent = {
      ...draft,
      id,
      tsClient: now,
      seq,
      deletedAt: null,
      syncedAt: null,
    };
    await store.events.add(event);
    return event;
  });
}

function asTombstone(event: GameEvent): GameEvent {
  return { ...event, deletedAt: Date.now(), syncedAt: null };
}

export async function undoLast(gameId: string): Promise<GameEvent | null> {
  const store = getDb();

  return store.transaction("rw", store.events, async () => {
    const live = (await store.events.where("gameId").equals(gameId).sortBy("seq")).filter(
      (event) => event.deletedAt === null,
    );
    const last = live.at(-1);
    if (!last) return null;
    const retracted = asTombstone(last);
    await store.events.put(retracted);
    return retracted;
  });
}

export async function removeLastMatching(
  gameId: string,
  period: Period,
  team: Team,
  band: Band,
  outcome: Outcome,
): Promise<GameEvent | null> {
  const store = getDb();

  return store.transaction("rw", store.events, async () => {
    const live = (await store.events.where("gameId").equals(gameId).sortBy("seq")).filter(
      (event) =>
        event.deletedAt === null &&
        event.period === period &&
        event.team === team &&
        event.band === band &&
        event.outcome === outcome,
    );
    const last = live.at(-1);
    if (!last) return null;
    const retracted = asTombstone(last);
    await store.events.put(retracted);
    return retracted;
  });
}
