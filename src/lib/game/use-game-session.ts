"use client";

import { useEffect, useRef, useState } from "react";
import type { Player, GameSession } from "@prisma/client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type LiveSession = Pick<
  GameSession,
  "id" | "code" | "state" | "currentQuestionId" | "questionStartedAt"
>;

type LivePlayer = Pick<
  Player,
  "id" | "displayName" | "avatarSeed" | "joinedAt"
>;

const POLL_MS = 1500;

// Subscribes to GameSession + Player rows for a given code.
// Uses polling as primary mechanism (reliable across networks/regions) plus
// realtime postgres_changes as a bonus for instant updates when available.
export function useGameSession({
  initialSession,
  initialPlayers,
}: {
  initialSession: LiveSession;
  initialPlayers: LivePlayer[];
}) {
  const [session, setSession] = useState<LiveSession>(initialSession);
  const [players, setPlayers] = useState<LivePlayer[]>(initialPlayers);
  const sessionIdRef = useRef(initialSession.id);

  useEffect(() => {
    sessionIdRef.current = initialSession.id;
  }, [initialSession.id]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const sessionId = sessionIdRef.current;
    let active = true;

    const refetch = async () => {
      const [s, p] = await Promise.all([
        supabase
          .from("game_sessions")
          .select("id,code,state,current_question_id,question_started_at")
          .eq("id", sessionId)
          .maybeSingle(),
        supabase
          .from("players")
          .select("id,display_name,avatar_seed,joined_at")
          .eq("session_id", sessionId)
          .order("joined_at"),
      ]);
      if (!active) return;
      if (s.data) {
        const r = s.data as Record<string, unknown>;
        setSession({
          id: r.id as string,
          code: r.code as string,
          state: r.state as LiveSession["state"],
          currentQuestionId: (r.current_question_id ?? null) as string | null,
          questionStartedAt: r.question_started_at
            ? new Date(r.question_started_at as string)
            : null,
        });
      }
      if (p.data) {
        const list = (p.data as Record<string, unknown>[]).map((row) => ({
          id: row.id as string,
          displayName: row.display_name as string,
          avatarSeed: row.avatar_seed as string,
          joinedAt: new Date(row.joined_at as string),
        }));
        setPlayers(list);
      }
    };

    // Realtime channel — best-effort, instant when it works.
    const channel = supabase
      .channel(`session:${initialSession.code}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_sessions",
          filter: `id=eq.${sessionId}`,
        },
        () => refetch(),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "players",
          filter: `session_id=eq.${sessionId}`,
        },
        () => refetch(),
      )
      .subscribe();

    // Polling fallback — guarantees state convergence within POLL_MS.
    const interval = setInterval(refetch, POLL_MS);

    return () => {
      active = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [initialSession.code]);

  return { session, players };
}

export function useAnswerCount({
  sessionId,
  questionId,
  channelKey,
}: {
  sessionId: string;
  questionId: string | null;
  channelKey: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!questionId) {
      setCount(0);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    let active = true;

    const refetch = () => {
      supabase
        .from("responses")
        .select("id", { count: "exact", head: true })
        .eq("session_id", sessionId)
        .eq("question_id", questionId)
        .then(({ count: c }) => {
          if (active) setCount(c ?? 0);
        });
    };

    refetch();
    const interval = setInterval(refetch, POLL_MS);

    const channel = supabase
      .channel(`${channelKey}:answers:${questionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "responses",
          filter: `session_id=eq.${sessionId}`,
        },
        () => refetch(),
      )
      .subscribe();

    return () => {
      active = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [sessionId, questionId, channelKey]);

  return count;
}
