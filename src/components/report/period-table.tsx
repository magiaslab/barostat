import { periodRows } from "@/lib/report";
import { teamStats } from "@/lib/stats";
import { BANDS, type GameEvent, type Team } from "@/lib/types";

type PeriodTableProps = {
  events: GameEvent[];
  team: Team;
  caption: string;
};

export function PeriodTable({ events, team, caption }: PeriodTableProps) {
  const rows = periodRows(events, team, (period) =>
    teamStats(events, team, period),
  );

  return (
    <div className="tbl-wrap">
      <table>
        <caption className={team}>{caption}</caption>
        <thead>
          <tr>
            <th>Periodo</th>
            <th>0–8″</th>
            <th>8–16″</th>
            <th>16–24″</th>
            <th>Tot</th>
            <th>TL</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className={row.key === "game" ? "tot" : undefined}>
              <td>{row.label}</td>
              {BANDS.map((band) => (
                <td key={band}>
                  {row.bands[band]}{" "}
                  <span className="pct">{row.percents[band]}</span>
                </td>
              ))}
              <td className={row.key === "game" ? undefined : "hi"}>{row.total}</td>
              <td>{row.ft}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
