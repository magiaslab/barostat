/**
 * Regole pure della griglia live: usate dalla UI e dai test.
 * - scope "game" (Partita) → solo consultazione (conteggi aggregati ≠ quarto attivo)
 * - partita con closedAt → archivio, nessuna scrittura
 */
export function isLiveGridReadOnly(input: {
  scope: "period" | "game";
  closedAt: number | null | undefined;
  foreignRecorder: boolean;
  syncRecorderConflict: boolean;
}): boolean {
  if (input.closedAt != null) return true;
  if (input.foreignRecorder) return true;
  if (input.syncRecorderConflict) return true;
  if (input.scope === "game") return true;
  return false;
}
