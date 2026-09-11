# Partite archiviate (`closedAt`)

## Regola prodotto

Quando `closedAt` è valorizzato la partita è **archivio**:

- Live: sola lettura (banner “Partita archiviata”).
- Dexie: `appendEvent` / undo / remove rifiutano modifiche.
- Server: `POST /api/sync` risponde `409 { error: "closed" }` se `closedAt` è già sul DB.
- Il flush di chiusura (primo POST che porta `closedAt`) è permesso finché sul server `closedAt` è ancora `null`; game+events vanno in **un’unica transazione**.

Il pulsante del riepilogo diventa **“Vedi live (sola lettura)”** dopo l’archiviazione (non “Continua” a registrare).
