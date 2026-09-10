"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type BeforeInstall = Event & { prompt: () => Promise<void> };

function subscribeNever() {
  return () => {};
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function isIosDevice(): boolean {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function wasDismissed(): boolean {
  return sessionStorage.getItem("barostat-install-dismissed") === "1";
}

export function InstallBanner() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstall | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const standalone = useSyncExternalStore(subscribeNever, isStandalone, () => true);
  const ios = useSyncExternalStore(subscribeNever, isIosDevice, () => false);
  const dismissedStored = useSyncExternalStore(
    subscribeNever,
    wasDismissed,
    () => true,
  );

  useEffect(() => {
    function onPrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as BeforeInstall);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const open =
    !standalone && !dismissed && !dismissedStored && (ios || promptEvent !== null);

  if (!open) return null;

  function dismiss() {
    sessionStorage.setItem("barostat-install-dismissed", "1");
    setDismissed(true);
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
        <p className="muted">Condividi → Aggiungi a Home.</p>
      ) : null}
      <button type="button" className="link" onClick={dismiss}>
        Non ora
      </button>
    </div>
  );
}
