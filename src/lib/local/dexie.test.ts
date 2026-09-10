import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, describe, expect, test } from "vitest";

import {
  appendEvent,
  closeDb,
  listLiveEvents,
  undoLast,
} from "./dexie";

afterEach(async () => {
  await closeDb();
  indexedDB.deleteDatabase("barostat-24");
  await Dexie.delete("barostat-24");
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
});
