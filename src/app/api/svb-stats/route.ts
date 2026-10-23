import { auth } from "@/auth";

/**
 * Riepilogo della partita in corso da SVB Stats, letto dal server: il link di stagione resta qui
 * (SVB_STATS_LIVE_URL, variabile solo server) e non finisce nei file JavaScript scaricabili.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Accesso scaduto: rientra" }, { status: 401 });
  const source = process.env.SVB_STATS_LIVE_URL;
  if (!source) return Response.json({ error: "Collegamento a SVB Stats non configurato." }, { status: 503 });
  const date = new URL(req.url).searchParams.get("date");
  const url = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${source}?date=${date}` : source;
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    return new Response(await res.text(), { status: res.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "SVB Stats non risponde" }, { status: 502 });
  }
}
