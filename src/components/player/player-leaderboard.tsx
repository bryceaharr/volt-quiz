"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Crown, Medal, Trophy } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Entry = {
  playerId: string;
  displayName: string;
  avatarSeed: string;
  totalPoints: number;
};

const RANK_ICONS = [Crown, Medal, Trophy] as const;

export function PlayerLeaderboard({
  sessionId,
  highlightPlayerId,
  title,
}: {
  sessionId: string;
  highlightPlayerId: string;
  title?: string;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let active = true;
    Promise.all([
      supabase
        .from("players")
        .select("id, display_name, avatar_seed")
        .eq("session_id", sessionId),
      supabase
        .from("responses")
        .select("player_id, points_awarded")
        .eq("session_id", sessionId),
    ]).then(([p, r]) => {
      if (!active) return;
      const players = (p.data ?? []) as {
        id: string;
        display_name: string;
        avatar_seed: string;
      }[];
      const responses = (r.data ?? []) as {
        player_id: string;
        points_awarded: number;
      }[];
      const totals = new Map<string, number>();
      for (const resp of responses) {
        totals.set(
          resp.player_id,
          (totals.get(resp.player_id) ?? 0) + resp.points_awarded,
        );
      }
      const ranked = players
        .map((p) => ({
          playerId: p.id,
          displayName: p.display_name,
          avatarSeed: p.avatar_seed,
          totalPoints: totals.get(p.id) ?? 0,
        }))
        .sort((a, b) => b.totalPoints - a.totalPoints);
      setEntries(ranked);
    });
    return () => {
      active = false;
    };
  }, [sessionId]);

  const myRank = entries.findIndex((e) => e.playerId === highlightPlayerId);
  const me = myRank >= 0 ? entries[myRank] : null;

  return (
    <div className="flex-1 flex flex-col px-4 py-6 gap-5">
      <h1 className="text-3xl font-bold text-center text-gradient">
        {title ?? "Leaderboard"}
      </h1>
      {me && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-strong rounded-2xl p-4 flex items-center gap-3 glow-primary"
        >
          <span className="text-3xl font-bold tabular-nums">
            #{myRank + 1}
          </span>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">You</p>
            <p className="text-lg font-semibold">{me.displayName}</p>
          </div>
          <span className="text-3xl font-bold tabular-nums">
            {me.totalPoints}
          </span>
        </motion.div>
      )}
      <ul className="space-y-1.5">
        {entries.slice(0, 10).map((e, i) => {
          const Icon = i < 3 ? RANK_ICONS[i] : null;
          const isMe = e.playerId === highlightPlayerId;
          return (
            <li
              key={e.playerId}
              className={`rounded-xl px-3 py-2.5 flex items-center gap-3 ${
                isMe ? "glass-strong" : "glass"
              }`}
            >
              <span className="w-6 text-center text-sm tabular-nums text-muted-foreground">
                {Icon ? <Icon className="size-4 inline" /> : i + 1}
              </span>
              <span className="flex-1 truncate text-sm font-medium">
                {e.displayName}
              </span>
              <span className="text-sm font-bold tabular-nums">
                {e.totalPoints}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
