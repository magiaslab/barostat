import { describe, expect, test } from "vitest";

import { isLiveGridReadOnly } from "./live-grid";

describe("isLiveGridReadOnly", () => {
  test("blocca la griglia in vista Partita", () => {
    expect(
      isLiveGridReadOnly({
        scope: "game",
        closedAt: null,
        foreignRecorder: false,
        syncRecorderConflict: false,
      }),
    ).toBe(true);
  });

  test("blocca una partita archiviata", () => {
    expect(
      isLiveGridReadOnly({
        scope: "period",
        closedAt: 1,
        foreignRecorder: false,
        syncRecorderConflict: false,
      }),
    ).toBe(true);
  });

  test("permette la scrittura nel quarto attivo al registratore", () => {
    expect(
      isLiveGridReadOnly({
        scope: "period",
        closedAt: null,
        foreignRecorder: false,
        syncRecorderConflict: false,
      }),
    ).toBe(false);
  });

  test("blocca registratore straniero o conflitto sync", () => {
    expect(
      isLiveGridReadOnly({
        scope: "period",
        closedAt: null,
        foreignRecorder: true,
        syncRecorderConflict: false,
      }),
    ).toBe(true);
    expect(
      isLiveGridReadOnly({
        scope: "period",
        closedAt: null,
        foreignRecorder: false,
        syncRecorderConflict: true,
      }),
    ).toBe(true);
  });
});
