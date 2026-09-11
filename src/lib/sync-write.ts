import { canWriteAsRecorder } from "@/lib/sync-auth";
import { MAX_WORKSPACE_GAMES } from "@/lib/limits";

export type SyncWriteDenial = "recorder" | "closed" | "limit";

export type SyncWriteDecision =
  | { ok: true }
  | { ok: false; error: SyncWriteDenial };

/**
 * Regole di scrittura sync, pure e testabili senza DB:
 * - partita già chiusa sul server → niente altri POST
 * - registratore = sessione
 * - nuovo insert oltre il cap workspace → limit
 */
export function decideSyncWrite(input: {
  existing:
    | { recorderUserId: string | null; closedAt: number | null }
    | undefined;
  sessionUserId: string;
  /** Conteggio partite già presenti (solo rilevante se `existing` è assente). */
  gameCount: number;
  maxGames?: number;
}): SyncWriteDecision {
  const maxGames = input.maxGames ?? MAX_WORKSPACE_GAMES;
  if (input.existing?.closedAt != null) {
    return { ok: false, error: "closed" };
  }
  if (
    input.existing &&
    !canWriteAsRecorder(input.existing.recorderUserId, input.sessionUserId)
  ) {
    return { ok: false, error: "recorder" };
  }
  if (!input.existing && input.gameCount >= maxGames) {
    return { ok: false, error: "limit" };
  }
  return { ok: true };
}
