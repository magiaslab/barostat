import { eq, sql } from "drizzle-orm";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { events, games } from "@/lib/db/schema";
import { parseSyncPayload } from "@/lib/sync-payload";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const payload = parseSyncPayload(body);
  if (!payload) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const db = getDb();
  const existing = (
    await db.select().from(games).where(eq(games.id, payload.game.id)).limit(1)
  )[0];

  if (existing && existing.recorderDeviceId !== payload.game.recorderDeviceId) {
    return Response.json({ error: "recorder" }, { status: 409 });
  }

  await db
    .insert(games)
    .values({
      id: payload.game.id,
      opponent: payload.game.opponent,
      date: payload.game.date,
      venue: payload.game.venue,
      competition: payload.game.competition,
      createdAt: payload.game.createdAt,
      closedAt: payload.game.closedAt,
      recorderDeviceId: payload.game.recorderDeviceId,
    })
    .onConflictDoUpdate({
      target: games.id,
      set: {
        opponent: payload.game.opponent,
        date: payload.game.date,
        venue: payload.game.venue,
        competition: payload.game.competition,
        closedAt: payload.game.closedAt,
      },
    });

  if (payload.events.length > 0) {
    await db
      .insert(events)
      .values(
        payload.events.map((event) => ({
          id: event.id,
          gameId: event.gameId,
          period: event.period,
          team: event.team,
          band: event.band,
          outcome: event.outcome,
          tsClient: event.tsClient,
          seq: event.seq,
          deletedAt: event.deletedAt,
        })),
      )
      .onConflictDoUpdate({
        target: events.id,
        // Un reinvio non sovrascrive i campi dell'evento: aggiorna solo
        // deletedAt se arriva un tombstone e in locale era ancora vivo.
        set: {
          deletedAt: sql`coalesce(${events.deletedAt}, excluded.deleted_at)`,
        },
      });
  }

  return Response.json({
    ok: true,
    accepted: payload.events.map((event) => ({
      id: event.id,
      deletedAt: event.deletedAt,
    })),
  });
}
