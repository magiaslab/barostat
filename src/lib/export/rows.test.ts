import { describe, expect, test } from "vitest";

import { excelPreview, eventRows, exportFilename, gameSlug } from "./rows";
import type { Game, GameEvent } from "@/lib/types";

const game: Game = {
  id: "g1",
  opponent: "Basket Cernusco",
  date: "2026-09-12",
  venue: "home",
  competition: "league",
  createdAt: 1,
  closedAt: null,
  recorderDeviceId: "dev-1",
};

function ev(partial: Partial<GameEvent> & Pick<GameEvent, "seq" | "outcome">): GameEvent {
  return {
    id: `e${partial.seq}`,
    gameId: "g1",
    period: 0,
    team: "us",
    band: 0,
    tsClient: partial.seq,
    deletedAt: null,
    syncedAt: null,
    ...partial,
  };
}

describe("eventRows", () => {
  test("una riga live per evento, tombstone esclusi", () => {
    const rows = eventRows(game, [
      ev({ seq: 2, period: 1, team: "them", band: 2, outcome: 0 }),
      ev({ seq: 1, outcome: 3 }),
      ev({ seq: 3, outcome: 2, deletedAt: 9 }),
    ]);
    expect(rows).toEqual([
      ["basket-cernusco", "2026-09-12", "Q1", "noi", "0–8", "3p", "3"],
      ["basket-cernusco", "2026-09-12", "Q2", "loro", "16–24", "tl-sbagliato", "0"],
    ]);
  });

  test("anteprima taglia e conta il resto", () => {
    const events = Array.from({ length: 8 }, (_, i) => ev({ seq: i + 1, outcome: 2 }));
    const preview = excelPreview(game, events, 6);
    expect(preview.startsWith("partita,data,periodo,squadra,fascia,esito,punti")).toBe(
      true,
    );
    expect(preview.endsWith("… 2 righe successive")).toBe(true);
  });
});

describe("gameSlug", () => {
  test("slug per il nome file", () => {
    expect(gameSlug("Basket Cernusco")).toBe("basket-cernusco");
    expect(exportFilename(game, "xlsx")).toBe(
      "barostat-basket-cernusco-2026-09-12.xlsx",
    );
  });

  test("normalizza le lettere accentate", () => {
    expect(gameSlug("Cassanò")).toBe("cassano");
    expect(gameSlug("Virtus Cassanò d'Adda")).toBe("virtus-cassano-d-adda");
  });

  test("l'apostrofo separa le parole nello slug", () => {
    expect(gameSlug("d'Adda")).toBe("d-adda");
  });
});
