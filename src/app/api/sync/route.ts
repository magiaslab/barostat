import { eq, sql } from "drizzle-orm";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { events, games } from "@/lib/db/schema";
import { canWriteAsRecorder, recorderIdFromEmail } from "@/lib/sync-auth";
import { parseSyncPayload } from "@/lib/sync-payload";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const [gameRows, eventRows] = await Promise.all([
    db.select().from(games),
    db.select().from(events),
  ]);

  return Response.json({
    games: gameRows.map((row) => ({
      id: row.id,
      opponent: row.opponent,
      date: row.date,
      venue: row.venue,
      competition: row.competition,
      createdAt: row.createdAt,
      closedAt: row.closedAt ?? null,
      // Hint UX per il tablet; l'autorità di scrittura è recorderUserId.
      recorderDeviceId: row.recorderDeviceId,
      recorderUserId: row.recorderUserId ?? null,
    })),
    events: eventRows.map((row) => ({
      id: row.id,
      gameId: row.gameId,
      period: row.period,
      team: row.team,
      band: row.band,
      outcome: row.outcome,
      tsClient: row.tsClient,
      seq: row.seq,
      deletedAt: row.deletedAt ?? null,
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const sessionUserId = recorderIdFromEmail(session.user.email);
  if (!sessionUserId) {
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

  // Un solo registratore per partita, legato alla sessione — non al device id
  // (che chiunque autenticato può copiare dal GET).
  if (existing && !canWriteAsRecorder(existing.recorderUserId, sessionUserId)) {
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
      recorderUserId: sessionUserId,
    })
    .onConflictDoUpdate({
      target: games.id,
      set: {
        opponent: payload.game.opponent,
        date: payload.game.date,
        venue: payload.game.venue,
        competition: payload.game.competition,
        // Una volta chiusa, non si riapre.
        closedAt: sql`coalesce(${games.closedAt}, excluded.closed_at)`,
        // UX: aggiorna il tablet del registratore (solo lui arriva qui).
        recorderDeviceId: payload.game.recorderDeviceId,
        // Reclama le righe legacy (NULL) senza permettere di rubare un owner.
        recorderUserId: sql`coalesce(${games.recorderUserId}, excluded.recorder_user_id)`,
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
