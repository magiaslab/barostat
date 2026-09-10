"use client";

import { StatCell } from "@/components/live/stat-cell";
import { formatFreeThrows, type TeamStats } from "@/lib/stats";
import {
  BANDS,
  BAND_CLOCK,
  BAND_LABEL,
  OUTCOMES,
  OUTCOME_LABEL,
  type Band,
  type Outcome,
  type Team,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type TeamPanelProps = {
  team: Team;
  name: string;
  stats: TeamStats;
  disabled: boolean;
  onAdd: (band: Band, outcome: Outcome) => void;
  onRemove: (band: Band, outcome: Outcome) => Promise<boolean>;
};

export function TeamPanel({
  team,
  name,
  stats,
  disabled,
  onAdd,
  onRemove,
}: TeamPanelProps) {
  return (
    <section className={cn("panel", team)}>
      <div className="panel-head">
        <span className="panel-title">{name}</span>
        <span className="panel-sub">
          <b>{stats.total}</b> pt · TL <b>{formatFreeThrows(stats.freeThrows)}</b>
        </span>
      </div>
      <div className="grid">
        <div className="colhead" />
        {OUTCOMES.map((outcome) => (
          <div
            key={outcome}
            className={cn("colhead", outcome === 0 && "miss")}
          >
            {OUTCOME_LABEL[outcome]}
          </div>
        ))}
        <div className="colhead">pt</div>
        {BANDS.map((band) => (
          <BandRow
            key={band}
            teamName={name}
            band={band}
            stats={stats}
            disabled={disabled}
            onAdd={onAdd}
            onRemove={onRemove}
          />
        ))}
      </div>
      <div className="panel-foot">
        {BANDS.map((band) => (
          <div key={band} className="stat">
            <span className="k">{band + 1}ª fascia</span>
            <span className="v">{stats.pointsByBand[band]}</span>
            <span className="s">{stats.percentsByBand[band]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function BandRow({
  teamName,
  band,
  stats,
  disabled,
  onAdd,
  onRemove,
}: {
  teamName: string;
  band: Band;
  stats: TeamStats;
  disabled: boolean;
  onAdd: (band: Band, outcome: Outcome) => void;
  onRemove: (band: Band, outcome: Outcome) => Promise<boolean>;
}) {
  return (
    <>
      <div className={cn("rowlab", `b${band + 1}`)}>
        <span className="t">{BAND_LABEL[band]}</span>
        <span className="n">{BAND_CLOCK[band]}</span>
      </div>
      {OUTCOMES.map((outcome) => (
        <StatCell
          key={outcome}
          teamName={teamName}
          band={band}
          outcome={outcome}
          count={stats.grid[band][outcome]}
          disabled={disabled}
          onAdd={() => onAdd(band, outcome)}
          onRemove={() => onRemove(band, outcome)}
        />
      ))}
      <div className="rowtot">
        <span className="p">{stats.pointsByBand[band]}</span>
        <span className="q">{stats.percentsByBand[band]}</span>
      </div>
    </>
  );
}
