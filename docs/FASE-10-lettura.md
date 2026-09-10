# Fase 10 — leggere le partite registrate da un altro dispositivo

## Il problema

Oggi `/api/sync` ha solo il `POST` e l'elenco partite legge esclusivamente da Dexie. Ogni dispositivo vede quindi solo ciò che ha registrato lui: se il vice allenatore segna la partita dal suo telefono, il coach che apre l'app dal PC trova l'elenco vuoto. I dati sono su Neon e sono integri — manca il pezzo che li riporta giù.

Metà della funzione esiste già: la schermata live ha `readOnly = foreignRecorder || sync.reason === "recorder"`, quindi una partita registrata altrove si apre già in sola lettura. Non ha mai avuto dati da mostrare.

**Serve la lettura post-partita, non il tempo reale.** Il coach guarda i dati e fa gli export a partita finita. Niente polling, niente SSE.

## Endpoint: `GET` sulla rotta `/api/sync` esistente

Non creare `/api/games`. Il motivo è concreto: `/api/sync` è già esentata nel callback `authorized` di `auth.config.ts`, e risponde 401 in JSON invece di un redirect HTML. Una rotta nuova ricadrebbe nella regola generale del proxy, che a una `fetch` non autenticata risponderebbe con l'HTML del login — un errore di parsing invece di un 401 leggibile.

```
GET /api/sync  →  { games: Game[], events: GameEvent[] }
```

Stessa verifica di sessione del POST. Restituisce **tutto**: una stagione sono ~30 partite da ~70 eventi, poche centinaia di kilobyte. Niente paginazione, niente `since`: si aggiungeranno se e quando serviranno.

Le partite sono già condivise fra tutto lo staff — la tabella `games` non ha un campo proprietario, e va bene così: una squadra sola, tutti vedono tutto.

## Fusione in Dexie — la parte delicata

Dexie resta la fonte di verità **durante** la partita e diventa una cache di Neon per tutto il resto.

Una regola sopra tutte: **non sovrascrivere mai una riga locale con `syncedAt` a null.** Sono i canestri non ancora inviati, e un pull nel momento sbagliato li cancellerebbe. È lo stesso principio della correzione 10.

```
per ogni evento remoto:
  locale = get(id)
  se locale && locale.syncedAt === null  → salta       // in coda, vince il locale
  altrimenti                             → put(remoto con syncedAt valorizzato)

per ogni partita remota:
  se esistono eventi locali in coda per quella partita → salta
  altrimenti                                          → put(remota)
```

Non cancellare mai righe locali assenti dal server: sono quelle ancora da inviare.
Attenzione a non azzerare `recorderDeviceId` in fusione: è il campo che decide chi può scrivere.

## Quando si tira giù

- All'apertura dell'elenco partite, se c'è rete.
- Dopo un invio andato a buon fine, così l'elenco riflette il server.
- Su gesto esplicito: il pallino dello stato diventa toccabile e forza un aggiornamento.
- **Mai** mentre su questo dispositivo è in corso la registrazione di una partita.

## Conseguenze sull'interfaccia

- L'elenco mostra anche le partite altrui: la riga esiste già, non va ridisegnata.
- Aprirne una porta alla live in sola lettura, che è già implementata.
- Riepilogo ed export funzionano senza modifiche: leggono da Dexie, che dopo la fusione ha gli eventi.
- Serve uno stato di caricamento: su un dispositivo nuovo, prima che il pull arrivi, oggi comparirebbe «Nessuna partita» — che è falso e spaventa.

## Test

- Una riga locale con `syncedAt` a null non viene toccata da un pull che contiene la stessa riga.
- Un tombstone locale non ancora inviato non viene resuscitato dal pull.
- Una partita con eventi in coda non viene sovrascritta.
- Un dispositivo con Dexie vuoto, dopo il pull, mostra elenco, riepilogo ed export corretti.
