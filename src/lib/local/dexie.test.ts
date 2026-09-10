import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, describe, expect, test } from "vitest";

import {
  appendEvent,
  closeDb,
  listLiveEvents,
  listPendingEvents,
  markSynced,
  newId,
  removeLastMatching,
  undoLast,
} from "./dexie";

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

afterEach(async () => {
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
