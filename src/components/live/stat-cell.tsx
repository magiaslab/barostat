"use client";

import { useRef } from "react";

import { vibrate } from "@/lib/haptics";
import {
  BAND_LABEL,
  OUTCOME_LABEL,
  type Band,
  type Outcome,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const LONG_PRESS_MS = 480;

type StatCellProps = {
  teamName: string;
  band: Band;
  outcome: Outcome;
  count: number;
  disabled: boolean;
  onAdd: () => void;
  onRemove: () => Promise<boolean>;
};

export function StatCell({
  teamName,
  band,
  outcome,
  count,
  disabled,
  onAdd,
  onRemove,
}: StatCellProps) {
  const timer = useRef<number>(0);
  const longFired = useRef(false);
  const miss = outcome === 0;
  const label = `${teamName} ${BAND_LABEL[band]} ${miss ? "tiro libero sbagliato" : OUTCOME_LABEL[outcome]}`;

  function clearTimer() {
    window.clearTimeout(timer.current);
    timer.current = 0;
  }

  return (
    <button
      type="button"
      className={cn("cell", miss && "miss", count > 0 && "has")}
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
