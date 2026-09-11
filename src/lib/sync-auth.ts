/** Identità stabile del registratore: email della sessione Auth.js (minuscola). */
export function recorderIdFromEmail(
  email: string | null | undefined,
): string | null {
  if (typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed.includes("@") ? trimmed : null;
}

/**
 * Chi può scrivere su una partita già presente.
 * - assente / legacy senza recorderUserId → il primo utente autenticato la reclama
 * - già assegnata → solo quel utente
 * L'id dispositivo non entra nella decisione: non è un segreto.
 */
export function canWriteAsRecorder(
  existingUserId: string | null | undefined,
  sessionUserId: string,
): boolean {
  if (!existingUserId) return true;
  return existingUserId === sessionUserId;
}
