import { describe, expect, test } from "vitest";

import { canWriteAsRecorder, recorderIdFromEmail } from "./sync-auth";

describe("recorderIdFromEmail", () => {
  test("normalizza l'email", () => {
    expect(recorderIdFromEmail("  Coach@BasketSanVincenzo.it ")).toBe(
      "coach@basketsanvincenzo.it",
    );
  });

  test("rifiuta valori vuoti o non email", () => {
    expect(recorderIdFromEmail(null)).toBeNull();
    expect(recorderIdFromEmail(undefined)).toBeNull();
    expect(recorderIdFromEmail("")).toBeNull();
    expect(recorderIdFromEmail("niente")).toBeNull();
  });
});

describe("canWriteAsRecorder", () => {
  test("reclama partite nuove o legacy senza utente", () => {
    expect(canWriteAsRecorder(null, "a@basketsanvincenzo.it")).toBe(true);
    expect(canWriteAsRecorder(undefined, "a@basketsanvincenzo.it")).toBe(true);
    expect(canWriteAsRecorder("", "a@basketsanvincenzo.it")).toBe(true);
  });

  test("solo il registratore assegnato può scrivere", () => {
    expect(
      canWriteAsRecorder("a@basketsanvincenzo.it", "a@basketsanvincenzo.it"),
    ).toBe(true);
    expect(
      canWriteAsRecorder("a@basketsanvincenzo.it", "b@basketsanvincenzo.it"),
    ).toBe(false);
  });
});
