import { count, eq, sql } from "drizzle-orm";

import { auth } from "@/auth";
import { getDb, withTransaction } from "@/lib/db";
import { events, games } from "@/lib/db/schema";
import { MAX_WORKSPACE_GAMES } from "@/lib/limits";
import { recorderIdFromEmail } from "@/lib/sync-auth";
import { parseSyncPayload } from "@/lib/sync-payload";
import { decideSyncWrite } from "@/lib/sync-write";

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

  // Anteprima fuori transazione (risposta 409 veloce); il check serio è sotto.
  const previewDb = getDb();
  const preview = (
    await previewDb
      .select()
      .from(games)
      .where(eq(games.id, payload.game.id))
      .limit(1)
  )[0];
  const previewCount = preview
    ? 0
    : Number(
        (
          await previewDb.select({ value: count() }).from(games)
        )[0]?.value ?? 0,
      );
  const previewDecision = decideSyncWrite({
    existing: preview
      ? {
          recorderUserId: preview.recorderUserId ?? null,
          closedAt: preview.closedAt ?? null,
        }
      : undefined,
    sessionUserId,
    gameCount: previewCount,
    maxGames: MAX_WORKSPACE_GAMES,
  });
  if (!previewDecision.ok) {
    return Response.json(
      { error: previewDecision.error },
      { status: 409 },
    );
  }

  try {
    await withTransaction(async (tx) => {
      const existing = (
        await tx
          .select()
          .from(games)
          .where(eq(games.id, payload.game.id))
          .limit(1)
      )[0];

      const gameCount = existing
        ? 0
        : Number((await tx.select({ value: count() }).from(games))[0]?.value ?? 0);

      const decision = decideSyncWrite({
        existing: existing
          ? {
              recorderUserId: existing.recorderUserId ?? null,
              closedAt: existing.closedAt ?? null,
            }
          : undefined,
        sessionUserId,
        gameCount,
        maxGames: MAX_WORKSPACE_GAMES,
      });
      if (!decision.ok) {
        throw Object.assign(new Error(decision.error), {
          code: decision.error,
        });
      }

      await tx
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
            closedAt: sql`coalesce(${games.closedAt}, excluded.closed_at)`,
            recorderDeviceId: payload.game.recorderDeviceId,
            recorderUserId: sql`coalesce(${games.recorderUserId}, excluded.recorder_user_id)`,
          },
        });

      if (payload.events.length > 0) {
        await tx
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
    });
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: unknown }).code)
        : null;
    if (code === "closed" || code === "recorder" || code === "limit") {
      return Response.json({ error: code }, { status: 409 });
    }
    throw error;
  }

  return Response.json({
    ok: true,
    accepted: payload.events.map((event) => ({
      id: event.id,
      deletedAt: event.deletedAt,
    })),
  });
}
