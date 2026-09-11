# Autorità di scrittura sync (registratore = sessione)

## Cosa è cambiato

La scrittura su `POST /api/sync` **non** usa più `recorderDeviceId` come capability.
Chiunque autenticato poteva leggerlo dal `GET` e spacciarsi per il tablet registratore.

Ora:

1. La sessione Auth.js deve essere valida (come prima).
2. Il server ricava `recorderUserId` dall’**email** della sessione (minuscola).
3. Alla **prima** sync di una partita (o su righe legacy con `recorder_user_id` NULL) quell’utente diventa il registratore.
4. I POST successivi sono accettati **solo** se la sessione è lo stesso utente → altrimenti `409 { error: "recorder" }`.
5. `recorderDeviceId` resta nel payload e in DB **solo per UX** (quale tablet ha la griglia in sola lettura). Non decide l’autorizzazione.

## Migrazione / client esistenti

- **Schema:** colonna nullable `games.recorder_user_id` (`drizzle/0001_recorder_user.sql`). Eseguire `npm run db:migrate` prima del deploy che attiva il nuovo POST.
- **Client in partita:** nessun cambio obbligatorio al body JSON. Cookie di sessione + stesso utente → la coda continua a flushare.
- **Altro utente / altro account Workspace** sulla stessa partita: riceve `409` (prima poteva bastare copiare il device id).
- Dopo il pull, il client vede `recorderUserId` nello snapshot; Dexie v5 inizializza il campo a `null` sulle partite già in locale.

## Invariante prodotto

Un solo **registratore (utente)** per partita, enforceable lato server.
Un solo **tablet** resta una convenzione UX lato client (`recorderDeviceId`), non un controllo di sicurezza.
