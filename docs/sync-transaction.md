# Sync POST atomico

`POST /api/sync` scrive `games` + `events` dentro `withTransaction()` (`src/lib/db/index.ts`), usando il driver WebSocket `drizzle-orm/neon-serverless` + `ws`.

Il driver HTTP (`neon-http`) **non** supporta `BEGIN`/`COMMIT`: per questo le letture restano su HTTP e le scritture sync usano il Pool.

## Test

- Decisioni pure: `src/lib/sync-write.test.ts` (closed / recorder / limit) senza DB.
- Transazione end-to-end: richiede Neon reale; non coperto in CI. In caso di mid-failure non devono restare game senza events del batch (o viceversa).
