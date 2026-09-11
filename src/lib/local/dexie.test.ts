import { clearDeviceId, ensureDeviceId, readDeviceId } from "@/lib/local/device";
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { eventRows } from "@/lib/export/rows";
import { score } from "@/lib/stats";
import type { Game, GameEvent } from "@/lib/types";

import {
  appendEvent,
  claimRecorder,
  closeDb,
  clearLocalData,
  closeGame,
  createGame,
  getDb,
  getGame,
  listGames,
  listLiveEvents,
  listPendingEvents,
  markSynced,
  mergeRemoteSnapshot,
  newId,
  removeLastMatching,
  undoLast,
} from "./dexie";

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Vitest/Node non ha localStorage: serve un mock persistibile per createGame. */
function installMemoryLocalStorage() {
  const store = new Map<string, string>();
  const mock = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: mock,
  });
}

beforeEach(() => {
  installMemoryLocalStorage();
});

afterEach(async () => {
  clearDeviceId();
  await closeDb();
  indexedDB.deleteDatabase("barostat-24");
  await Dexie.delete("barostat-24");
});

describe("newId", () => {
  test("genera UUID v4 anche se randomUUID è undefined", () => {
    const original = crypto.randomUUID;
    Object.defineProperty(crypto, "randomUUID", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    try {
      expect(crypto.randomUUID).toBeUndefined();
      expect(newId()).toMatch(UUID_V4);
    } finally {
      Object.defineProperty(crypto, "randomUUID", {
        value: original,
        configurable: true,
        writable: true,
      });
    }
  });
});

describe("store Dexie", () => {
  test("append scrive in IndexedDB e sopravvive a una riapertura", async () => {
    const created = await appendEvent({
      gameId: "prova",
      period: 0,
      team: "us",
      band: 0,
      outcome: 3,
    });

    expect(created.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(created.seq).toBe(1);
    expect(created.deletedAt).toBeNull();
    expect(created.syncedAt).toBeNull();

    const before = await listLiveEvents("prova");
    expect(before).toHaveLength(1);
    expect(before[0]?.outcome).toBe(3);

    await closeDb();
    const afterReload = await listLiveEvents("prova");
    expect(afterReload).toHaveLength(1);
    expect(afterReload[0]?.id).toBe(created.id);
  });

  test("undoLast è un pop: l'evento sparisce dal log live ma resta come tombstone", async () => {
    await appendEvent({
      gameId: "prova",
      period: 0,
      team: "us",
      band: 0,
      outcome: 2,
    });
    const last = await appendEvent({
      gameId: "prova",
      period: 0,
      team: "them",
      band: 1,
      outcome: 3,
    });

    const retracted = await undoLast("prova");
    expect(retracted?.id).toBe(last.id);
    expect(retracted?.deletedAt).not.toBeNull();

    expect(await listLiveEvents("prova")).toHaveLength(1);

    await closeDb();
    expect(await listLiveEvents("prova")).toHaveLength(1);
  });

  test("due append consecutivi incrementano seq senza collisione", async () => {
    const a = await appendEvent({
      gameId: "prova",
      period: 0,
      team: "us",
      band: 0,
      outcome: 1,
    });
    const b = await appendEvent({
      gameId: "prova",
      period: 0,
      team: "us",
      band: 0,
      outcome: 1,
    });
    expect(b.seq).toBe(a.seq + 1);
  });

  test("un evento annullato dopo la sync ricompare tra i pending", async () => {
    const created = await appendEvent({
      gameId: "prova",
      period: 0,
      team: "us",
      band: 0,
      outcome: 3,
    });
    await markSynced([{ id: created.id, deletedAt: created.deletedAt }]);
    expect(await listPendingEvents("prova")).toHaveLength(0);

    const retracted = await undoLast("prova");
    expect(retracted?.deletedAt).not.toBeNull();
    expect(retracted?.syncedAt).toBeNull();

    const pending = await listPendingEvents("prova");
    expect(pending).toHaveLength(1);
    expect(pending[0]?.id).toBe(created.id);
    expect(pending[0]?.deletedAt).not.toBeNull();
  });

  test("removeLastMatching toglie solo l'ultimo evento vivo di quella cella", async () => {
    const first = await appendEvent({
      gameId: "prova",
      period: 0,
      team: "us",
      band: 0,
      outcome: 2,
    });
    await appendEvent({
      gameId: "prova",
      period: 0,
      team: "us",
      band: 0,
      outcome: 2,
    });
    await appendEvent({
      gameId: "prova",
      period: 1,
      team: "us",
      band: 0,
      outcome: 2,
    });

    const removed = await removeLastMatching("prova", 0, "us", 0, 2);
    expect(removed?.id).not.toBe(first.id);
    expect(removed?.period).toBe(0);

    const live = await listLiveEvents("prova");
    expect(live).toHaveLength(2);
    expect(live.map((event) => event.id)).toContain(first.id);

    expect(await removeLastMatching("prova", 0, "them", 0, 2)).toBeNull();
  });

  test("annullare fra listPendingEvents e markSynced lascia il tombstone in coda", async () => {
    const created = await appendEvent({
      gameId: "prova",
      period: 0,
      team: "us",
      band: 0,
      outcome: 3,
    });

    const pending = await listPendingEvents("prova");
    expect(pending).toHaveLength(1);
    expect(pending[0]?.id).toBe(created.id);
    expect(pending[0]?.deletedAt).toBeNull();

    const retracted = await undoLast("prova");
    expect(retracted?.deletedAt).not.toBeNull();
    expect(retracted?.syncedAt).toBeNull();

    await markSynced(
      pending.map((event) => ({ id: event.id, deletedAt: event.deletedAt })),
    );

    const stillPending = await listPendingEvents("prova");
    expect(stillPending).toHaveLength(1);
    expect(stillPending[0]?.id).toBe(created.id);
    expect(stillPending[0]?.deletedAt).not.toBeNull();
    expect(stillPending[0]?.syncedAt).toBeNull();
  });
});

describe("partite Dexie", () => {
  test("createGame genera UUID, closedAt nullo e fallback Avversari", async () => {
    const created = await createGame({
      opponent: "   ",
      date: "2026-09-10",
      venue: "home",
      competition: "league",
    });
    expect(created.id).toMatch(UUID_V4);
    expect(created.opponent).toBe("Avversari");
    expect(created.closedAt).toBeNull();
    expect(created.recorderDeviceId).toBeTruthy();
    expect(await getGame(created.id)).toEqual(created);
    expect(await getGame("inesistente")).toBeUndefined();
  });

  test("listGames ordina per data decrescente e poi per createdAt", async () => {
    await createGame({
      opponent: "Seveso",
      date: "2026-09-04",
      venue: "away",
      competition: "league",
    });
    await createGame({
      opponent: "Cernusco",
      date: "2026-09-10",
      venue: "home",
      competition: "cup",
    });

    const listed = await listGames();
    expect(listed.map((game) => game.opponent)).toEqual(["Cernusco", "Seveso"]);
  });

  test("closeGame imposta closedAt e resta idempotente", async () => {
    const created = await createGame({
      opponent: "Cernusco",
      date: "2026-09-10",
      venue: "home",
      competition: "cup",
    });
    const closed = await closeGame(created.id);
    expect(closed?.closedAt).toEqual(expect.any(Number));
    const again = await closeGame(created.id);
    expect(again?.closedAt).toBe(closed?.closedAt);
    expect(await closeGame("inesistente")).toBeUndefined();
  });

  test("claimRecorder riempie solo un registratore vuoto", async () => {
    const created = await createGame({
      opponent: "Cernusco",
      date: "2026-09-10",
      venue: "home",
      competition: "cup",
    });
    const kept = await claimRecorder(created.id, "altro-device");
    expect(kept?.recorderDeviceId).toBe(created.recorderDeviceId);

    await getDb().games.put({ ...created, recorderDeviceId: "" });
    const claimed = await claimRecorder(created.id, "dev-2");
    expect(claimed?.recorderDeviceId).toBe("dev-2");
    expect(await claimRecorder("inesistente", "dev-2")).toBeUndefined();
  });
});

const remoteGame: Game = {
  id: "g-remoto",
  opponent: "Cernusco",
  date: "2026-09-10",
  venue: "home",
  competition: "cup",
  createdAt: 10,
  closedAt: 20,
  recorderDeviceId: "altro-device",
  recorderUserId: null,};

function remoteEvent(over: Partial<GameEvent> = {}): GameEvent {
  return {
    id: "e-remoto",
    gameId: remoteGame.id,
    period: 0,
    team: "us",
    band: 0,
    outcome: 3,
    tsClient: 1,
    seq: 1,
    deletedAt: null,
    syncedAt: null,
    ...over,
  };
}

describe("mergeRemoteSnapshot", () => {
  test("non tocca una riga locale con syncedAt a null", async () => {
    const store = getDb();
    const local = remoteEvent({ outcome: 2, syncedAt: null });
    await store.games.put({ ...remoteGame, opponent: "Locale" });
    await store.events.put(local);

    await mergeRemoteSnapshot(
      [{ ...remoteGame, opponent: "Server" }],
      [remoteEvent({ outcome: 3 })],
      99,
    );

    expect(await store.events.get(local.id)).toEqual(local);
  });

  test("un tombstone locale non ancora inviato non viene resuscitato", async () => {
    const store = getDb();
    const tombstone = remoteEvent({ deletedAt: 50, syncedAt: null });
    await store.events.put(tombstone);

    await mergeRemoteSnapshot(
      [remoteGame],
      [remoteEvent({ deletedAt: null })],
      99,
    );

    const kept = await store.events.get(tombstone.id);
    expect(kept?.deletedAt).toBe(50);
    expect(kept?.syncedAt).toBeNull();
  });

  test("una partita con eventi in coda non viene sovrascritta", async () => {
    const store = getDb();
    await store.games.put({ ...remoteGame, opponent: "Locale" });
    await store.events.put(remoteEvent({ syncedAt: null }));

    await mergeRemoteSnapshot(
      [
        {
          ...remoteGame,
          opponent: "Server",
          recorderDeviceId: "non-toccare",
  recorderUserId: null,        },
      ],
      [remoteEvent({ outcome: 1 })],
      99,
    );

    const game = await getGame(remoteGame.id);
    expect(game?.opponent).toBe("Locale");
    expect(game?.recorderDeviceId).toBe("altro-device");
  });

  test("un Dexie vuoto, dopo il pull, ha elenco riepilogo ed export", async () => {
    await mergeRemoteSnapshot(
      [remoteGame],
      [remoteEvent({ outcome: 3 }), remoteEvent({ id: "e-2", seq: 2, outcome: 2 })],
      99,
    );

    const listed = await listGames();
    expect(listed).toHaveLength(1);
    expect(listed[0]?.opponent).toBe("Cernusco");
    expect(listed[0]?.recorderDeviceId).toBe("altro-device");

    const live = await listLiveEvents(remoteGame.id);
    expect(live).toHaveLength(2);
    expect(score(live, remoteGame.id)).toEqual({ us: 5, them: 0 });
    expect(eventRows(remoteGame, live)).toHaveLength(2);
    expect(await getDb().events.get("e-2")).toMatchObject({ syncedAt: 99 });
  });

  test("non cancella una riga locale assente dal server", async () => {
    const store = getDb();
    const onlyLocal = remoteEvent({ id: "solo-locale", gameId: "g-locale" });
    await store.games.put({ ...remoteGame, id: "g-locale", opponent: "Solo qui" });
    await store.events.put(onlyLocal);

    await mergeRemoteSnapshot([remoteGame], [remoteEvent()], 99);

    expect(await getGame("g-locale")).toMatchObject({ opponent: "Solo qui" });
    expect(await store.events.get("solo-locale")).toEqual(onlyLocal);
  });
});


describe("archivio e limiti", () => {
  test("appendEvent rifiuta una partita chiusa", async () => {
    const game = await createGame({
      opponent: "Chiusa",
      date: "2026-09-11",
      venue: "home",
      competition: "league",
    });
    await closeGame(game.id);
    await expect(
      appendEvent({
        gameId: game.id,
        period: 0,
        team: "us",
        band: 0,
        outcome: 2,
      }),
    ).rejects.toThrow(/archiviata/i);
  });

  test("clearLocalData svuota partite e device id", async () => {
    await createGame({
      opponent: "Temp",
      date: "2026-09-11",
      venue: "home",
      competition: "league",
    });
    ensureDeviceId();
    await clearLocalData();
    expect(await listGames()).toEqual([]);
    expect(readDeviceId()).toBe("");
  });
});
