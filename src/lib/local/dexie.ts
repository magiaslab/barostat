import Dexie, { type EntityTable } from "dexie";

import {
  clearDeviceId,
  ensureDeviceId,
  isPersistableDeviceId,
} from "@/lib/local/device";
import { MAX_WORKSPACE_GAMES } from "@/lib/limits";
import type {
  Band,
  Competition,
  Game,
  GameEvent,
  Outcome,
  Period,
  Team,
  Venue,
} from "@/lib/types";

export type EventDraft = {
  gameId: string;
  period: Period;
  team: Team;
  band: Band;
  outcome: Outcome;
};

export type GameDraft = {
  opponent: string;
  date: string;
  venue: Venue;
  competition: Competition;
};

export type BarostatDB = Dexie & {
  events: EntityTable<GameEvent, "id">;
  games: EntityTable<Game, "id">;
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
        // IndexedDB non indicizza null: un indice su syncedAt conterrebbe
        // solo le righe già sincronizzate, l'esatto contrario della coda.
        // listPendingEvents filtra in JavaScript (~70 eventi a partita).
        // Non rimettere syncedAt fra gli indici. Se un giorno servisse
        // davvero, usare un campo separato pending: 0 | 1.
        events: "id, gameId, [gameId+seq]",
      })
      .upgrade(async (tx) => {
        await tx
          .table("events")
          .toCollection()
          .modify((event: { syncedAt?: number | null }) => {
            if (event.syncedAt === undefined) event.syncedAt = null;
          });
      });
    db.version(3).stores({
      events: "id, gameId, [gameId+seq]",
      games: "id, date, createdAt",
    });
    db.version(4)
      .stores({
        events: "id, gameId, [gameId+seq]",
        games: "id, date, createdAt",
      })
      .upgrade(async (tx) => {
        await tx
          .table("games")
          .toCollection()
          .modify((game: { recorderDeviceId?: string }) => {
            if (!game.recorderDeviceId) game.recorderDeviceId = "";
          });
      });
    db.version(5)
      .stores({
        events: "id, gameId, [gameId+seq]",
        games: "id, date, createdAt",
      })
      .upgrade(async (tx) => {
        await tx
          .table("games")
          .toCollection()
          .modify((game: { recorderUserId?: string | null }) => {
            if (game.recorderUserId === undefined) game.recorderUserId = null;
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

/** Svuota IndexedDB e l'id dispositivo (logout su tablet condiviso). */
export async function clearLocalData(): Promise<void> {
  await closeDb();
  await Dexie.delete("barostat-24");
  clearDeviceId();
}

export async function createGame(draft: GameDraft): Promise<Game> {
  const existing = await listGames();
  if (existing.length >= MAX_WORKSPACE_GAMES) {
    throw new Error(
      `Limite catalogo: massimo ${MAX_WORKSPACE_GAMES} partite su questo Workspace.`,
    );
  }
  const game: Game = {
    id: newId(),
    opponent: draft.opponent.trim() || "Avversari",
    date: draft.date,
    venue: draft.venue,
    competition: draft.competition,
    createdAt: Date.now(),
    closedAt: null,
    recorderDeviceId: (() => {
      const id = ensureDeviceId();
      if (!isPersistableDeviceId(id)) {
        throw new Error("createGame richiede un browser con localStorage");
      }
      return id;
    })(),
    recorderUserId: null,
  };
  await getDb().games.add(game);
  return game;
}

export async function getGame(id: string): Promise<Game | undefined> {
  return getDb().games.get(id);
}

export async function closeGame(id: string): Promise<Game | undefined> {
  const store = getDb();
  const game = await store.games.get(id);
  if (!game) return undefined;
  if (game.closedAt !== null) return game;
  const closed: Game = { ...game, closedAt: Date.now() };
  await store.games.put(closed);
  return closed;
}

export async function claimRecorder(
  id: string,
  deviceId: string,
): Promise<Game | undefined> {
  const store = getDb();
  const game = await store.games.get(id);
  if (!game) return undefined;
  if (game.recorderDeviceId === "") {
    if (!isPersistableDeviceId(deviceId)) {
      throw new Error("claimRecorder richiede un device id persistibile");
    }
    const claimed = { ...game, recorderDeviceId: deviceId };
    await store.games.put(claimed);
    return claimed;
  }
  return game;
}

export async function listGames(): Promise<Game[]> {
  const rows = await getDb().games.toArray();
  return rows.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return b.createdAt - a.createdAt;
  });
}

export async function listAllEvents(): Promise<GameEvent[]> {
  return getDb().events.toArray();
}

export async function listLiveEvents(gameId: string): Promise<GameEvent[]> {
  const rows = await getDb().events.where("gameId").equals(gameId).sortBy("seq");
  return rows.filter((event) => event.deletedAt === null);
}

export async function listPendingEvents(gameId: string): Promise<GameEvent[]> {
  const rows = await getDb().events.where("gameId").equals(gameId).sortBy("seq");
  return rows.filter((event) => event.syncedAt === null);
}

export async function hasOpenRecording(deviceId: string): Promise<boolean> {
  if (!deviceId) return false;
  const rows = await getDb().games.toArray();
  return rows.some(
    (game) => game.closedAt === null && game.recorderDeviceId === deviceId,
  );
}

/** Cache da Neon: non tocca la coda locale e non cancella ciò che il server non ha. */
export async function mergeRemoteSnapshot(
  remoteGames: readonly Game[],
  remoteEvents: readonly GameEvent[],
  syncedAt: number = Date.now(),
): Promise<void> {
  const store = getDb();
  await store.transaction("rw", store.games, store.events, async () => {
    for (const remote of remoteEvents) {
      const local = await store.events.get(remote.id);
      if (local && local.syncedAt === null) continue;
      await store.events.put({ ...remote, syncedAt });
    }

    const queued = await store.events
      .filter((event) => event.syncedAt === null)
      .toArray();
    const gamesWithQueue = new Set(queued.map((event) => event.gameId));

    for (const remote of remoteGames) {
      if (gamesWithQueue.has(remote.id)) continue;
      await store.games.put(remote);
    }
  });
}

export type SyncedEntry = { id: string; deletedAt: number | null };

export async function markSynced(entries: SyncedEntry[]): Promise<void> {
  const store = getDb();
  const now = Date.now();
  await store.transaction("rw", store.events, async () => {
    for (const entry of entries) {
      const event = await store.events.get(entry.id);
      // Se nel frattempo l'evento è cambiato, resta in coda: quel cambiamento
      // non è ancora stato spedito.
      if (!event || event.deletedAt !== entry.deletedAt) continue;
      await store.events.put({ ...event, syncedAt: now });
    }
  });
}

export async function appendEvent(draft: EventDraft): Promise<GameEvent> {
  const store = getDb();
  const game = await store.games.get(draft.gameId);
  if (game?.closedAt != null) {
    throw new Error("Partita archiviata: registrazione non consentita.");
  }
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
  const game = await store.games.get(gameId);
  if (game?.closedAt != null) return null;

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
  const game = await store.games.get(gameId);
  if (game?.closedAt != null) return null;

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
