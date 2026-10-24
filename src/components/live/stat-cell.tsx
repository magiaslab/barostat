"use client";

import { useRef } from "react";

import { vibrate } from "@/lib/haptics";
import {
  BAND_LABEL,
  CELL_LABEL,
  type Band,
  type Cell,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const LONG_PRESS_MS = 480;

type StatCellProps = {
  teamName: string;
  band: Band;
  cell: Cell;
  count: number;
  disabled: boolean;
  onAdd: () => void;
  onRemove: () => Promise<boolean>;
};

export function StatCell({
  teamName,
  band,
  cell,
  count,
  disabled,
  onAdd,
  onRemove,
}: StatCellProps) {
  const timer = useRef<number>(0);
  const longFired = useRef(false);
  const miss = cell === 0;
  const label = `${teamName} ${BAND_LABEL[band]} ${miss ? "tiro libero sbagliato" : cell === "ro" ? "canestro da rimbalzo offensivo" : CELL_LABEL[cell]}`;

  function clearTimer() {
    window.clearTimeout(timer.current);
    timer.current = 0;
  }

  return (
    <button
      type="button"
      className={cn("cell", miss && "miss", cell === "ro" && "ro", count > 0 && "has")}
      disabled={disabled}
      aria-label={label}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={() => {
        if (disabled) return;
        longFired.current = false;
        clearTimer();
        timer.current = window.setTimeout(() => {
          longFired.current = true;
          void onRemove().then((removed) => {
            if (removed) vibrate(30);
          });
        }, LONG_PRESS_MS);
      }}
      onPointerUp={clearTimer}
      onPointerCancel={clearTimer}
      onPointerLeave={clearTimer}
      onClick={(event) => {
        if (longFired.current) {
          longFired.current = false;
          event.preventDefault();
          return;
        }
        onAdd();
        vibrate(12);
        const el = event.currentTarget;
        el.classList.remove("bump");
        void el.offsetWidth;
        el.classList.add("bump");
      }}
    >
      {count}
    </button>
  );
}
