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

// Subscribes to GameSession + Player rows for a given code.
// Falls back to the initial server-rendered values until the realtime channel connects.
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
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          setSession({
            id: row.id as string,
            code: row.code as string,
            state: row.state as LiveSession["state"],
            currentQuestionId: (row.current_question_id ?? null) as string | null,
            questionStartedAt: row.question_started_at
              ? new Date(row.question_started_at as string)
              : null,
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "players",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const newPlayer: LivePlayer = {
            id: row.id as string,
            displayName: row.display_name as string,
            avatarSeed: row.avatar_seed as string,
            joinedAt: new Date(row.joined_at as string),
          };
          setPlayers((prev) =>
            prev.some((p) => p.id === newPlayer.id) ? prev : [...prev, newPlayer],
          );
        },
      )
      .subscribe();

    return () => {
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

    // Initial count.
    let active = true;
    supabase
      .from("responses")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .eq("question_id", questionId)
      .then(({ count: c }) => {
        if (active) setCount(c ?? 0);
      });

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
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (row.question_id === questionId) {
            setCount((c) => c + 1);
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [sessionId, questionId, channelKey]);

  return count;
}
