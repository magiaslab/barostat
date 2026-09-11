"use client";

import { useState } from "react";

import { signOutAction } from "@/components/games/sign-out-action";
import { clearLocalData, listGames, listPendingEvents } from "@/lib/local/dexie";
import { flushGames } from "@/lib/local/sync";

/**
 * Su tablet di squadra l'uscita deve lasciare IndexedDB e device id puliti,
 * altrimenti il collega successivo eredita coda e partite.
 * Non cancelliamo in silenzio se resta coda non sincronizzata: chiediamo conferma.
 */
export function SignOutButton() {
  const [busy, setBusy] = useState(false);

  async function onSignOut() {
    if (busy) return;
    setBusy(true);
    try {
      const games = await listGames();
      const result = await flushGames(games.map((game) => game.id));
      let pending = result.pending;
      if (pending === 0) {
        // Rilettura di sicurezza dopo il flush.
        pending = 0;
        for (const game of games) {
          pending += (await listPendingEvents(game.id)).length;
        }
      }

      if (!result.ok || pending > 0) {
        const message =
          pending > 0
            ? `Ci sono ancora ${pending} eventi non sincronizzati. Uscendo cancelli i dati locali di questo tablet e potresti perderli. Uscire comunque?`
            : "La sincronizzazione non è riuscita. Uscendo cancelli i dati locali di questo tablet. Uscire comunque?";
        if (!window.confirm(message)) {
          setBusy(false);
          return;
        }
      }

      await clearLocalData();
      await signOutAction();
    } catch (error) {
      console.error(error);
      const proceed = window.confirm(
        "Non sono riuscito a sincronizzare o pulire lo storage. Uscire comunque? I dati locali potrebbero restare su questo tablet.",
      );
      if (proceed) {
        try {
          await clearLocalData();
        } catch {
          /* best-effort */
        }
        await signOutAction();
        return;
      }
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="link"
      disabled={busy}
      onClick={() => {
        void onSignOut();
      }}
    >
      {busy ? "Esco…" : "Esci"}
    </button>
  );
}
