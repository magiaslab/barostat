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

export function getDb(): BarostatDB {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB non disponibile");
  }
  if (!db) {
    db = new Dexie("barostat-24") as BarostatDB;
    db.version(1).stores({
      events: "id, gameId, [gameId+seq]",
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

export async function appendEvent(draft: EventDraft): Promise<GameEvent> {
  const store = getDb();
  const now = Date.now();
  const id = crypto.randomUUID();

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
    };
    await store.events.add(event);
    return event;
  });
}

export async function undoLast(gameId: string): Promise<GameEvent | null> {
  const store = getDb();

  return store.transaction("rw", store.events, async () => {
    const live = (await store.events.where("gameId").equals(gameId).sortBy("seq")).filter(
      (event) => event.deletedAt === null,
    );
    const last = live.at(-1);
    if (!last) return null;
    const retracted: GameEvent = { ...last, deletedAt: Date.now() };
    await store.events.put(retracted);
    return retracted;
  });
}
