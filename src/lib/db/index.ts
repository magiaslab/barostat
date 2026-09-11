import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { drizzle as drizzleWs } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import ws from "ws";

import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

/** Letture e query semplici: driver HTTP (senza WebSocket). */
export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL mancante");
  return drizzle(neon(url), { schema });
}

type TxDb = ReturnType<typeof drizzleWs<typeof schema>>;

/**
 * Scrive game+events in una transazione Postgres vera (Pool WebSocket).
 * Il driver HTTP di Neon non supporta BEGIN/COMMIT.
 */
export async function withTransaction<T>(
  fn: (tx: Parameters<Parameters<TxDb["transaction"]>[0]>[0]) => Promise<T>,
): Promise<T> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL mancante");
  const pool = new Pool({ connectionString: url });
  const db = drizzleWs(pool, { schema });
  try {
    return await db.transaction(fn);
  } finally {
    await pool.end();
  }
}
