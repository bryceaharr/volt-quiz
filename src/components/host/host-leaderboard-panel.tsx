"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Crown, Medal, Trophy } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Entry = {
  playerId: string;
  displayName: string;
  avatarSeed: string;
  totalPoints: number;
};

const RANK_ICONS = [Crown, Medal, Trophy] as const;
const RANK_COLORS = [
  "text-amber-300",
  "text-zinc-300",
  "text-orange-400",
] as const;

export function HostLeaderboardPanel({
  sessionId,
  highlight = "all",
}: {
  sessionId: string;
  highlight?: "top3" | "all";
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [sessionId]);

  const top3 = highlight === "top3";

  return (
    <div className="flex-1 flex flex-col px-2 py-4 max-w-3xl mx-auto w-full gap-6">
      <div className="text-center">
        <h1 className="text-3xl lg:text-5xl font-bold text-gradient">
          Leaderboard
        </h1>
      </div>
      {loading ? (
        <div className="text-center text-muted-foreground text-sm">
          Loading…
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center text-muted-foreground">No players.</div>
      ) : top3 ? (
        <div className="grid grid-cols-3 gap-3 items-end max-w-2xl mx-auto w-full">
          {[1, 0, 2].map((i) => {
            const e = entries[i];
            if (!e)
              return (
                <div
                  key={i}
                  className="opacity-30 glass rounded-2xl h-24 grid place-items-center text-xs"
                >
                  —
                </div>
              );
            const rank = i + 1;
            const Icon = RANK_ICONS[i];
            const heights = ["h-44", "h-56", "h-36"];
            return (
              <motion.div
                key={e.playerId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className={`glass-strong rounded-2xl p-5 flex flex-col items-center justify-end gap-2 ${heights[i]} ${
                  rank === 1 ? "glow-primary" : ""
                }`}
              >
                <Icon className={`size-7 ${RANK_COLORS[i]}`} />
                <div
                  className="size-12 rounded-full grid place-items-center text-sm font-bold uppercase"
                  style={{ background: avatarColor(e.avatarSeed) }}
                >
                  {e.displayName.slice(0, 2)}
                </div>
                <span className="text-sm font-semibold truncate max-w-full">
                  {e.displayName}
                </span>
                <span className="text-2xl font-bold tabular-nums">
                  {e.totalPoints}
                </span>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {entries.map((e, i) => (
              <motion.li
                key={e.playerId}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`glass rounded-xl px-4 py-3 flex items-center gap-3 ${
                  i < 3 ? "glow-primary/50" : ""
                }`}
              >
                <span className="text-2xl font-bold tabular-nums w-10 text-muted-foreground">
                  {i + 1}
                </span>
                <div
                  className="size-9 rounded-full grid place-items-center text-xs font-bold uppercase"
                  style={{ background: avatarColor(e.avatarSeed) }}
                >
                  {e.displayName.slice(0, 2)}
                </div>
                <span className="flex-1 font-medium truncate">
                  {e.displayName}
                </span>
                <span className="text-lg font-bold tabular-nums">
                  {e.totalPoints}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

function avatarColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `linear-gradient(135deg, oklch(0.72 0.18 ${hue}), oklch(0.65 0.2 ${(hue + 60) % 360}))`;
}
