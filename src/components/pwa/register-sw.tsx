"use client";

import { useEffect } from "react";

/**
 * Registra il SW e, se ne arriva uno nuovo in waiting, chiede un reload
 * one-shot (skipWaiting già nel SW + clients.claim). Niente schermata impostazioni.
 */
export function RegisterSw() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    void navigator.serviceWorker.register("/sw.js").then((registration) => {
      if (cancelled) return;

      const promptReload = () => {
        const accepted = window.confirm(
          "È disponibile un aggiornamento di BaroStat. Ricaricare ora?",
        );
        if (accepted) {
          // Il SW in install fa già skipWaiting; un reload prende clients.claim.
          window.location.reload();
        }
      };

      if (registration.waiting) {
        promptReload();
      }

      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (
            installing.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            promptReload();
          }
        });
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
