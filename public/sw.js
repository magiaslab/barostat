const SHELL = "barostat-shell-v4";
const ASSET_URLS = [
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

/** Precache di una shell navigabile (HTML di /games) se la sessione è valida. */
async function cacheGamesShell(cache) {
  try {
    const response = await fetch("/games", {
      credentials: "same-origin",
      redirect: "follow",
    });
    // Un redirect al login ha redirected === true: non va salvato come /games.
    if (response.ok && !response.redirected && response.type === "basic") {
      await cache.put("/games", response);
    }
  } catch {
    // Offline o rete assente in install/activate: ci penserà la prima visita online.
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      await Promise.all(
        ASSET_URLS.map((url) => cache.add(url).catch(() => undefined)),
      );
      await cacheGamesShell(cache);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== SHELL).map((key) => caches.delete(key)),
      );
      // Secondo tentativo: dopo il login la cookie di sessione è disponibile.
      const cache = await caches.open(SHELL);
      await cacheGamesShell(cache);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Anche le navigazioni: solo pagine vere (niente redirect al login).
        if (response.ok && !response.redirected && response.type === "basic") {
          const copy = response.clone();
          void caches.open(SHELL).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") return caches.match("/games");
        return Response.error();
      }),
  );
});
