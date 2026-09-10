"use client";

import { useEffect, useState } from "react";

type BeforeInstall = Event & { prompt: () => Promise<void> };

export function InstallBanner() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstall | null>(null);
  const [ios, setIos] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone === true);
    if (standalone) return;
    if (sessionStorage.getItem("barostat-install-dismissed") === "1") return;

    const isIos =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIos(isIos);
    if (isIos) setOpen(true);

    function onPrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as BeforeInstall);
      setOpen(true);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!open) return null;

  function dismiss() {
    sessionStorage.setItem("barostat-install-dismissed", "1");
    setOpen(false);
  }

  return (
    <div className="install-banner">
      <p>
        Aggiungi BaroStat 24 alla schermata Home. Su questo tablet Safari può
        cancellare le partite non sincronizzate dopo una settimana.
      </p>
      {promptEvent ? (
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            void promptEvent.prompt();
            dismiss();
          }}
        >
          Installa
        </button>
      ) : ios ? (
        <p className="muted">
          Condividi → Aggiungi a Home.
        </p>
      ) : null}
      <button type="button" className="link" onClick={dismiss}>
        Non ora
      </button>
    </div>
  );
}
