import { barWidth, chartMax } from "@/lib/report";
import type { TeamStats } from "@/lib/stats";
import { BANDS, BAND_CLOCK, BAND_LABEL } from "@/lib/types";

type BandChartProps = {
  us: TeamStats;
  them: TeamStats;
  opponent: string;
};

export function BandChart({ us, them, opponent }: BandChartProps) {
  const max = chartMax(us.pointsByBand, them.pointsByBand);

  return (
    <figure className="fig">
      <h3 className="t">Da dove arrivano i punti</h3>
      <p className="cap">Punti per fascia dei 24″ — partita intera</p>
      <div className="legend">
        <span>
          <i className="sw us" aria-hidden />
          Noi
        </span>
        <span>
          <i className="sw them" aria-hidden />
          {opponent}
        </span>
      </div>
      <div>
        {BANDS.map((band) => (
          <div className="grp" key={band}>
            <div className="grp-lab">
              {BAND_LABEL[band]}{" "}
              <span className="grp-clock">{BAND_CLOCK[band]}</span>
            </div>
            <Track
              team="us"
              value={us.pointsByBand[band]}
              percent={us.percentsByBand[band]}
              max={max}
            />
            <Track
              team="them"
              value={them.pointsByBand[band]}
              percent={them.percentsByBand[band]}
              max={max}
            />
          </div>
        ))}
      </div>
    </figure>
  );
}

function Track({
  team,
  value,
  percent,
  max,
}: {
  team: "us" | "them";
  value: number;
  percent: string;
  max: number;
}) {
  const width = barWidth(value, max);
  return (
    <div className="track">
      <div className="barout">
        <div
          className={`barin ${team}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="val">
        <b>{value}</b> pt · {percent}
      </span>
    </div>
  );
}
