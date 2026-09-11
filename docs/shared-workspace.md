# Workspace condiviso (non multi-tenant)

BaroStat è pensato per **uno staff piccolo** (2–3 account Google dello stesso Workspace).

- `GET/POST /api/sync` espone **tutto il catalogo** a qualunque utente autenticato del dominio.
- Non c’è isolamento per utente/squadra: la partita ha un `recorderUserId` (chi può scrivere), ma la lettura è condivisa.

## Sicurezza soft

- Cap catalogo: `MAX_WORKSPACE_GAMES = 200` (`src/lib/limits.ts`), applicato in `createGame` (client) e in `POST /api/sync` per insert nuovi.
- Non è un ACL: se lo staff cresce o si aggiungono più squadre, il passo successivo è un tenant/squadra id su `games` e filtro sulle query sync.

## Verifica

Creare partite fino al cap in test (mockando il conteggio) o abbassando temporaneamente `MAX_WORKSPACE_GAMES` in un unit test di `decideSyncWrite`.
