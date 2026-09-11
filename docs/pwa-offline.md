# PWA offline — cold start e aggiornamento SW

## Cosa è cambiato (`public/sw.js`, cache `barostat-shell-v4`)

Oltre a manifest e icone, all’**install** e all’**activate** il service worker prova a mettere in cache l’HTML navigabile di `/games` (con cookie di sessione).

- Se la risposta è un redirect al login (`redirected === true`), **non** viene salvata.
- A runtime restano in cache le navigazioni riuscite (pagine vere).
- Offline, una navigation senza match esatto ripiega su `/games` in cache.
- In **install** fa `skipWaiting`; in **activate** fa `clients.claim`.

## Aggiornamento (UX minimale)

`RegisterSw` (`src/components/pwa/register-sw.tsx`) ascolta `updatefound` / SW in `waiting`. Se c’è già un controller (app già controllata dal vecchio SW), mostra un `confirm` e, se accettato, ricarica la pagina. Il nuovo SW prende il controllo al reload grazie a `skipWaiting` + `clients.claim`. Niente schermata impostazioni.

## Verifica su iPad (standalone / modalità aereo)

1. Apri l’app **online**, fai login Google, vai su **Partite** (`/games`).
2. Aggiorna una volta (così il SW v4 si installa e può precache-are `/games`).
3. Aggiungi a Home schermata se non l’hai già fatto.
4. Chiudi l’app, attiva **Modalità aereo**, riapri dall’icona Home.
5. Atteso: si apre l’elenco partite (dati da Dexie); la pillola sync può indicare offline.
6. Se vedi la pagina di errore Safari: non c’era `/games` in cache (apertura a freddo mai andata online dopo l’update del SW) — ripeti i passi 1–2.

## Limiti restanti / gap di test

- Senza una visita online autenticata dopo l’install del nuovo SW, `/games` può mancare in cache. Non precachiamo HTML non autenticato sotto `/games` di proposito.
- **Nessun e2e automatico del service worker** in CI (serve browser reale + ciclo install/update). La verifica è manuale: deploy → visita online → secondo deploy/cambio `sw.js` → comparsa del prompt di reload.
