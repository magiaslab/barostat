"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getGame } from "@/lib/local/dexie";

/**
 * Pagina aggiunta per il 2° assistente: falli, minuti e percentuali della partita in corso.
 * I dati arrivano da SVB Stats (il tablet di chi registra le statistiche), letti dal server di BaroStat
 * (/api/svb-stats) con il link di stagione: in sola lettura, senza toccare il database dei 24″.
 */

type LivePlayer = { number: number | null; name: string; onCourt: boolean; pf: number; sec: number; pts: number; fgm: number; fga: number; ftm: number; fta: number; tov: number };
type LiveTeam = {
  name: string; pts: number; teamFouls: number; timeoutsLeft: number; tech: { c: number; b: number; out: boolean }; periodPoints: number[];
  shooting: { m2: number; a2: number; m3: number; a3: number; mf: number; af: number; tov: number }; players: LivePlayer[];
};
type LiveSummary = { title: string; home: boolean; period: number; clock: number; closed: boolean; svb: LiveTeam; opp: LiveTeam };

const SOURCE = "/api/svb-stats";
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const pct = (m: number, a: number) => (a ? Math.round((m / a) * 100) : null);

export function StatsScreen({ gameId, back: backQuery = "" }: { gameId: string; back?: string }) {
  const [data, setData] = useState<LiveSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastOk, setLastOk] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [tab, setTab] = useState<"us" | "team" | "them">("us");

  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    let url = SOURCE;
    const load = async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Statistiche non disponibili");
        setData(json);
        setError(null);
        setLastOk(Date.now());
        if (!stop) timer = setTimeout(load, json.closed ? 60_000 : 4_000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Statistiche non disponibili");
        if (!stop) timer = setTimeout(load, 8_000);
      }
    };
    // Sempre la partita di questa schermata: SVB Stats risponde con la gara dello stesso giorno
    void getGame(gameId).then((g) => { if (g?.date) url = `${SOURCE}?date=${encodeURIComponent(g.date)}`; }).catch(() => undefined).finally(() => { void load(); });
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => { stop = true; clearTimeout(timer); clearInterval(t); };
  }, [gameId]);

  const back = <Link href={`/games/${gameId}${backQuery ? `?${backQuery}` : ""}`} className="svb-back">‹ 24″</Link>;
  if (!data) return <main className="svbstats"><header className="svb-top">{back}<p className="svb-msg">{error ?? "Carico le statistiche…"}</p></header></main>;

  const ago = lastOk ? Math.round((now - lastOk) / 1000) : null;
  const status = data.closed ? "Finale" : data.clock === 0 ? `Fine ${data.period <= 4 ? `${data.period}°` : "suppl."}` : `${data.period <= 4 ? `${data.period}°` : "TS"} · ${clock(data.clock)}`;

  const teamCol = (t: LiveTeam, side: "us" | "them") => {
    const rows = [...t.players]
      .filter((p) => p.sec > 0 || p.onCourt || p.pts || p.pf)
      .sort((a, b) => Number(b.onCourt) - Number(a.onCourt) || b.pf - a.pf || (a.number ?? 99) - (b.number ?? 99));
    const tf = t.teamFouls;
    return (
      <section className={`svb-col c-${side}`}>
        <h2 className={side}>{side === "us" ? "SVB" : t.name}<small>falli · minuti · tiro</small></h2>
        <div className="svb-rows">
          {rows.map((p, i) => (
            <div key={i} className={`svb-row ${p.onCourt ? "on" : ""} ${p.pf >= 5 ? "f5" : p.pf >= 2 ? `f${Math.min(p.pf, 4)}` : ""}`}>
              <span className="num">{p.number ?? "–"}</span>
              <span className="nm">{p.name}<small><b>{p.pts}</b> pt · campo {p.fgm}/{p.fga}{p.fga ? ` ${pct(p.fgm, p.fga)}%` : ""}{p.fta ? ` · TL ${p.ftm}/${p.fta}` : ""} · <b>{p.tov}</b> perse</small></span>
              <span className="fouls"><b>{p.pf >= 5 ? "Fuori" : p.pf}</b><small>falli</small></span>
              <span className="min">{mmss(p.sec)}<small>min</small></span>
            </div>
          ))}
          {!rows.length && <p className="svb-msg">Nessun giocatore ancora in campo.</p>}
        </div>
        <div className="svb-cards">
          <div className={`svb-card ${tf >= 5 ? "bonus" : tf === 4 ? "near" : ""}`}><small>Falli squadra</small><b>{tf}</b><em>{tf >= 5 ? "bonus" : tf === 4 ? "1 al bonus" : "nel quarto"}</em></div>
          <div className={`svb-card ${t.timeoutsLeft === 0 ? "zero" : ""}`}><small>Timeout</small><b>{t.timeoutsLeft}</b><em>rimasti</em></div>
          <div className="svb-card"><small>Palle perse</small><b>{t.shooting.tov}</b><em>di squadra</em></div>
          {t.tech.c + t.tech.b > 0 && <div className={`svb-card ${t.tech.out ? "bonus" : "near"}`}><small>Tecnici</small><b className="small">{t.tech.c}C {t.tech.b}B</b><em>{t.tech.out ? "espulso" : "2 C o 3: fuori"}</em></div>}
        </div>
      </section>
    );
  };

  const s = data.svb.shooting, o = data.opp.shooting;
  const line = (lab: string, a: [number, number], b: [number, number]) => (
    <div className="svb-line">
      <span className="lab">{lab}</span>
      <span className="bars"><i className="us" style={{ width: `${pct(...a) ?? 0}%` }} /><i className="them" style={{ width: `${pct(...b) ?? 0}%` }} /></span>
      <span className="v us">{pct(...a) ?? "–"}{a[1] ? "%" : ""}<small>{a[0]} su {a[1]}</small></span>
      <span className="v them">{pct(...b) ?? "–"}{b[1] ? "%" : ""}<small>{b[0]} su {b[1]}</small></span>
    </div>
  );
  const [left, right] = data.home ? [data.svb, data.opp] : [data.opp, data.svb];
  return (
    <main className="svbstats">
      <header className="svb-top">
        {back}
        <div className="svb-score">
          <span className={`t ${left === data.svb ? "us" : "them"}`}>{left === data.svb ? "SVB" : left.name}</span>
          <span className={`n ${left === data.svb ? "us" : "them"}`}>{left.pts}</span>
          <span className="q"><b>{status}</b>{data.title}</span>
          <span className={`n ${right === data.svb ? "us" : "them"}`}>{right.pts}</span>
          <span className={`t ${right === data.svb ? "us" : "them"}`}>{right === data.svb ? "SVB" : right.name}</span>
        </div>
        <div className="svb-live"><span className={`dot ${data.closed ? "done" : ago !== null && ago > 12 ? "stale" : ""}`} />{data.closed ? "Partita finita" : ago !== null ? `In diretta · ${ago} s fa` : "In diretta"}</div>
      </header>
      <nav className="svb-tabs">
        {(["us", "team", "them"] as const).map((k) => <button key={k} type="button" className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{k === "us" ? "SVB" : k === "team" ? "Squadre" : "Avversari"}</button>)}
      </nav>
      <div className="svb-body" data-tab={tab}>
        {teamCol(data.svb, "us")}
        <section className="svb-col c-team">
          <h2>Squadre<small>tiro e punti per quarto</small></h2>
          {line("Da 2", [s.m2, s.a2], [o.m2, o.a2])}
          {line("Da 3", [s.m3, s.a3], [o.m3, o.a3])}
          {line("Liberi", [s.mf, s.af], [o.mf, o.af])}
          {line("Dal campo", [s.m2 + s.m3, s.a2 + s.a3], [o.m2 + o.m3, o.a2 + o.a3])}
          <table className="svb-q">
            <thead><tr><th />{data.svb.periodPoints.map((_, i) => <th key={i}>{i < 4 ? `${i + 1}°` : `TS${i - 3}`}</th>)}<th>Tot.</th></tr></thead>
            <tbody>
              <tr><td className="us">SVB</td>{data.svb.periodPoints.map((v, i) => <td key={i}>{i + 1 <= data.period ? v : "–"}</td>)}<td><b>{data.svb.pts}</b></td></tr>
              <tr><td className="them">Avv.</td>{data.opp.periodPoints.map((v, i) => <td key={i}>{i + 1 <= data.period ? v : "–"}</td>)}<td><b>{data.opp.pts}</b></td></tr>
            </tbody>
          </table>
          <p className="svb-msg small">Dati di SVB Stats, dal tablet di chi registra le statistiche.</p>
        </section>
        {teamCol(data.opp, "them")}
      </div>
    </main>
  );
}
