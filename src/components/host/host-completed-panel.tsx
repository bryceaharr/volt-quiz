"use client";

import { HostLeaderboardPanel } from "./host-leaderboard-panel";

export function HostCompletedPanel({
  sessionId,
}: {
  sessionId: string;
  sessionCode: string;
}) {
  return (
    <div className="flex-1 flex flex-col gap-6">
      <HostLeaderboardPanel sessionId={sessionId} highlight="top3" />
    </div>
  );
}
