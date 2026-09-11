"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { todayISO } from "@/lib/format";
import { createGame } from "@/lib/local/dexie";
import { MAX_WORKSPACE_GAMES } from "@/lib/limits";
import {
  COMPETITIONS,
  COMPETITION_LABEL,
  VENUES,
  VENUE_LABEL,
  type Competition,
  type Venue,
} from "@/lib/types";

export function NewGameForm() {
  const router = useRouter();
  const [opponent, setOpponent] = useState("");
  const [date, setDate] = useState(todayISO);
  const [venue, setVenue] = useState<Venue>("home");
  const [competition, setCompetition] = useState<Competition>("league");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const game = await createGame({ opponent, date, venue, competition });
      router.push(`/games/${game.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Limite catalogo: massimo ${MAX_WORKSPACE_GAMES} partite.`,
      );
    }
  }

  return (
    <div className="setup-screen">
      <div className="wrap">
        <div className="apphead">
          <Link href="/games" className="link">
            ← Partite
          </Link>
        </div>
        <h1 className="t">Nuova partita</h1>

        <form className="form" onSubmit={(event) => void onSubmit(event)}>
          <div className="field">
            <label htmlFor="fOpp">Avversario</label>
            <input
              id="fOpp"
              type="text"
              autoComplete="off"
              value={opponent}
              onChange={(event) => setOpponent(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="fDate">Data</label>
            <input
              id="fDate"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
          <div className="field">
            <span className="field-label" id="fVenueLabel">
              Campo
            </span>
            <div className="seg" role="group" aria-labelledby="fVenueLabel">
              {VENUES.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={item === venue}
                  onClick={() => setVenue(item)}
                >
                  {VENUE_LABEL[item]}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="fComp">Competizione</label>
            <select
              id="fComp"
              value={competition}
              onChange={(event) =>
                setCompetition(event.target.value as Competition)
              }
            >
              {COMPETITIONS.map((item) => (
                <option key={item} value={item}>
                  {COMPETITION_LABEL[item]}
                </option>
              ))}
            </select>
          </div>
          <p className="muted">
            Durata dell&apos;azione: 24 secondi, tre fasce da 8. Se una
            categoria gioca con regolamenti diversi, la durata diventa un campo
            di questa schermata e le fasce si ricalcolano da sola.
          </p>
          {error ? (
            <p className="muted" role="alert">
              {error}
            </p>
          ) : null}
          <div className="bar">
            <div className="bar-inner">
              <Link href="/games" className="btn">
                Annulla
              </Link>
              <button type="submit" className="btn primary">
                Palla a due
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
