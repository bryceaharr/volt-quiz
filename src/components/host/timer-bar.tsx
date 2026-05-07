"use client";

import { useEffect, useRef, useState } from "react";

// Anchored to the client's local clock once the question becomes visible,
// so server/client clock skew can't freeze the countdown.
export function TimerBar({
  durationSec,
  startedAt,
  paused = false,
}: {
  durationSec: number;
  startedAt: Date | null;
  paused?: boolean;
}) {
  const startedAtMs = startedAt ? new Date(startedAt).getTime() : null;
  const localAnchorRef = useRef<{
    serverStart: number;
    localStart: number;
  } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAtMs) {
      localAnchorRef.current = null;
      return;
    }
    if (
      !localAnchorRef.current ||
      localAnchorRef.current.serverStart !== startedAtMs
    ) {
      localAnchorRef.current = {
        serverStart: startedAtMs,
        localStart: Date.now(),
      };
      setNow(Date.now());
    }
  }, [startedAtMs]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [paused]);

  const elapsed = localAnchorRef.current
    ? Math.max(0, now - localAnchorRef.current.localStart)
    : 0;
  const total = durationSec * 1000;
  const remainingSec = Math.max(0, Math.ceil((total - elapsed) / 1000));
  const ratio = Math.max(0, Math.min(1, 1 - elapsed / total));

  const color =
    ratio > 0.5
      ? "oklch(0.78 0.16 195)"
      : ratio > 0.25
        ? "oklch(0.78 0.18 65)"
        : "oklch(0.7 0.22 22)";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
        <span>Time</span>
        <span style={{ color }} className="font-semibold text-base">
          {remainingSec}s
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-[width,background-color] duration-100"
          style={{
            width: `${ratio * 100}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}
