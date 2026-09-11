# Sync POST atomico

`POST /api/sync` scrive `games` + `events` dentro `withTransaction()` (`src/lib/db/index.ts`), usando il driver WebSocket `drizzle-orm/neon-serverless` + `ws`.

Il driver HTTP (`neon-http`) **non** supporta `BEGIN`/`COMMIT`: per questo le letture restano su HTTP e le scritture sync usano il Pool.

## Client: lock in-flight su `flushGame`

Oltre all’idempotenza server + `markSynced`, `flushGame` riusa una sola Promise per `gameId` (`flushInflight` in `src/lib/local/sync.ts`) così tap/interval sovrapposti non moltiplicano i POST. Test: `src/lib/local/sync.test.ts`.

## Test

- Decisioni pure: `src/lib/sync-write.test.ts` e `src/lib/sync-route-policy.test.ts` (closed / recorder / limit) senza DB.
- Transazione end-to-end: richiede Neon reale; non coperto in CI. In caso di mid-failure non devono restare game senza events del batch (o viceversa).
