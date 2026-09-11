import { describe, expect, test } from "vitest";

import { decideSyncWrite } from "./sync-write";

describe("decideSyncWrite", () => {
  test("accetta una partita nuova sotto il cap", () => {
    expect(
      decideSyncWrite({
        existing: undefined,
        sessionUserId: "a@basketsanvincenzo.it",
        gameCount: 3,
        maxGames: 200,
      }),
    ).toEqual({ ok: true });
  });

  test("rifiuta una partita nuova oltre il cap", () => {
    expect(
      decideSyncWrite({
        existing: undefined,
        sessionUserId: "a@basketsanvincenzo.it",
        gameCount: 200,
        maxGames: 200,
      }),
    ).toEqual({ ok: false, error: "limit" });
  });

  test("rifiuta scritture su partita già chiusa", () => {
    expect(
      decideSyncWrite({
        existing: {
          recorderUserId: "a@basketsanvincenzo.it",
          closedAt: 1,
        },
        sessionUserId: "a@basketsanvincenzo.it",
        gameCount: 1,
      }),
    ).toEqual({ ok: false, error: "closed" });
  });

  test("rifiuta un registratore diverso", () => {
    expect(
      decideSyncWrite({
        existing: {
          recorderUserId: "a@basketsanvincenzo.it",
          closedAt: null,
        },
        sessionUserId: "b@basketsanvincenzo.it",
        gameCount: 1,
      }),
    ).toEqual({ ok: false, error: "recorder" });
  });

  test("permette la chiusura (closedAt ancora null sul server)", () => {
    expect(
      decideSyncWrite({
        existing: {
          recorderUserId: "a@basketsanvincenzo.it",
          closedAt: null,
        },
        sessionUserId: "a@basketsanvincenzo.it",
        gameCount: 1,
      }),
    ).toEqual({ ok: true });
  });
});
