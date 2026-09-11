import { describe, expect, test } from "vitest";

import { decideSyncWrite } from "./sync-write";

/**
 * Coverage “route senza Neon”: le decisioni di POST /api/sync stanno qui.
 * Un e2e con Postgres reale non gira in CI; vedi docs/sync-transaction.md.
 */
describe("POST /api/sync write policy (unit, no DB)", () => {
  test("409 closed se la partita è già archiviata", () => {
    expect(
      decideSyncWrite({
        existing: { recorderUserId: "a@x.it", closedAt: 99 },
        sessionUserId: "a@x.it",
        gameCount: 1,
      }),
    ).toEqual({ ok: false, error: "closed" });
  });

  test("409 limit su nuovo insert oltre cap", () => {
    expect(
      decideSyncWrite({
        existing: undefined,
        sessionUserId: "a@x.it",
        gameCount: 200,
        maxGames: 200,
      }),
    ).toEqual({ ok: false, error: "limit" });
  });

  test("409 recorder se la sessione non è il registratore", () => {
    expect(
      decideSyncWrite({
        existing: { recorderUserId: "a@x.it", closedAt: null },
        sessionUserId: "b@x.it",
        gameCount: 1,
      }),
    ).toEqual({ ok: false, error: "recorder" });
  });
});
