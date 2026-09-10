import Link from "next/link";

import { formatGameMeta } from "@/lib/format";
import type { GameListRow } from "@/lib/local/use-games";
import { BANDS } from "@/lib/types";

type GameRowProps = {
  row: GameListRow;
};

export function GameRow({ row }: GameRowProps) {
  const { game, score: board, dist } = row;
  const total = dist[0] + dist[1] + dist[2] || 1;
  const inPlay = game.closedAt === null;

  return (
    <Link href={`/games/${game.id}`} className="game">
      <span className="g-opp">{game.opponent}</span>
      <span className="g-res">
        <ResultChip inPlay={inPlay} us={board.us} them={board.them} />
        {board.us}–{board.them}
      </span>
      <span className="g-meta">{formatGameMeta(game)}</span>
      <span className="dist" aria-hidden>
        {BANDS.map((band) => (
          <i
            key={band}
            className={`f${band + 1}`}
            style={{ width: `${(dist[band] / total) * 100}%` }}
          />
        ))}
      </span>
    </Link>
  );
}

function ResultChip({
  inPlay,
  us,
  them,
}: {
  inPlay: boolean;
  us: number;
  them: number;
}) {
  if (inPlay) return <span className="chip inplay">In corso</span>;
  if (us === them) return null;
  if (us > them) return <span className="chip win">V</span>;
  return <span className="chip loss">S</span>;
}
