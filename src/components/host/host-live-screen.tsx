"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Lock, Play, Trophy, Eye, Zap } from "lucide-react";
import { toast } from "sonner";
import type {
  AnswerOption,
  GameSession,
  Player,
  Question,
  Quiz,
} from "@prisma/client";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { useGameSession, useAnswerCount } from "@/lib/game/use-game-session";
import { LobbyPanel } from "@/components/host/lobby-panel";
import { HostQuestionPanel } from "@/components/host/host-question-panel";
import { HostResultsPanel } from "@/components/host/host-results-panel";
import { HostLeaderboardPanel } from "@/components/host/host-leaderboard-panel";
import { HostCompletedPanel } from "@/components/host/host-completed-panel";
import {
  advanceSessionAction,
  showLeaderboardAction,
} from "@/app/host/actions";

type FullSession = GameSession & {
  quiz: Quiz & {
    questions: (Question & { options: AnswerOption[] })[];
  };
  players: Player[];
};

export function HostLiveScreen({
  session: initialSession,
  joinUrl,
}: {
  session: FullSession;
  joinUrl: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const { session, players } = useGameSession({
    initialSession: {
      id: initialSession.id,
      code: initialSession.code,
      state: initialSession.state,
      currentQuestionId: initialSession.currentQuestionId,
      questionStartedAt: initialSession.questionStartedAt,
    },
    initialPlayers: initialSession.players.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      avatarSeed: p.avatarSeed,
      joinedAt: p.joinedAt,
    })),
  });

  const currentQuestion = useMemo(
    () =>
      session.currentQuestionId
        ? initialSession.quiz.questions.find(
            (q) => q.id === session.currentQuestionId,
          ) ?? null
        : null,
    [session.currentQuestionId, initialSession.quiz.questions],
  );

  const questionIndex = currentQuestion
    ? initialSession.quiz.questions.findIndex(
        (q) => q.id === currentQuestion.id,
      )
    : -1;

  const totalQuestions = initialSession.quiz.questions.length;

  const answerCount = useAnswerCount({
    sessionId: session.id,
    questionId: currentQuestion?.id ?? null,
    channelKey: session.code,
  });

  const advance = (
    intent: "start" | "lock" | "reveal" | "next" | "end",
    optimistic?: () => void,
  ) =>
    startTransition(async () => {
      optimistic?.();
      const r = await advanceSessionAction(session.code, intent);
      if (r && "error" in r) toast.error((r as { error: string }).error);
      router.refresh();
    });

  const showLeaderboard = () =>
    startTransition(async () => {
      await showLeaderboardAction(session.code);
      router.refresh();
    });

  const renderControls = () => {
    switch (session.state) {
      case "lobby":
        return (
          <Button
            size="lg"
            className="h-14 px-8 text-lg glow-primary"
            disabled={players.length === 0 || pending}
            onClick={() => advance("start")}
          >
            <Play className="size-5 fill-current" />
            Start game
          </Button>
        );
      case "question_active":
        return (
          <Button
            size="lg"
            className="h-14 px-8 text-lg"
            variant="outline"
            disabled={pending}
            onClick={() => advance("lock")}
          >
            <Lock className="size-5" />
            Lock answers
          </Button>
        );
      case "question_locked":
        return (
          <Button
            size="lg"
            className="h-14 px-8 text-lg glow-accent"
            disabled={pending}
            onClick={() => advance("reveal")}
          >
            <Eye className="size-5" />
            Reveal answer
          </Button>
        );
      case "showing_results":
        return (
          <div className="flex gap-3">
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-6 text-lg"
              disabled={pending}
              onClick={showLeaderboard}
            >
              <Trophy className="size-5" />
              Leaderboard
            </Button>
            <Button
              size="lg"
              className="h-14 px-6 text-lg"
              disabled={pending}
              onClick={() => advance("next")}
            >
              {questionIndex + 1 >= totalQuestions ? "Finish" : "Next"}
              <ArrowRight className="size-5" />
            </Button>
          </div>
        );
      case "showing_leaderboard":
        return (
          <Button
            size="lg"
            className="h-14 px-8 text-lg"
            disabled={pending}
            onClick={() => advance("next")}
          >
            {questionIndex + 1 >= totalQuestions ? "Finish" : "Next question"}
            <ArrowRight className="size-5" />
          </Button>
        );
      case "completed":
        return (
          <Button
            size="lg"
            className="h-14 px-8 text-lg"
            variant="outline"
            render={<Link href="/dashboard" />}
          >
            Back to dashboard
          </Button>
        );
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <Zap className="size-5 text-primary fill-primary" />
          <span>{BRAND.name}</span>
          <span className="text-muted-foreground font-normal mx-2">·</span>
          <span className="text-muted-foreground font-normal">
            {initialSession.quiz.title}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {questionIndex >= 0 && (
            <span className="tabular-nums">
              Q{questionIndex + 1} / {totalQuestions}
            </span>
          )}
          <Button
            size="sm"
            variant="ghost"
            render={<Link href="/dashboard" />}
          >
            <ArrowLeft className="size-4" />
            Exit
          </Button>
        </div>
      </header>

      <main className="flex-1 px-6 pb-6 flex flex-col">
        {session.state === "lobby" && (
          <LobbyPanel
            code={session.code}
            joinUrl={joinUrl}
            players={players}
            quizTitle={initialSession.quiz.title}
          />
        )}
        {(session.state === "question_active" ||
          session.state === "question_locked") &&
          currentQuestion && (
            <HostQuestionPanel
              question={currentQuestion}
              questionIndex={questionIndex}
              totalQuestions={totalQuestions}
              answerCount={answerCount}
              playerCount={players.length}
              questionStartedAt={session.questionStartedAt}
              locked={session.state === "question_locked"}
            />
          )}
        {session.state === "showing_results" && currentQuestion && (
          <HostResultsPanel
            sessionId={session.id}
            sessionCode={session.code}
            question={currentQuestion}
            playerCount={players.length}
          />
        )}
        {session.state === "showing_leaderboard" && (
          <HostLeaderboardPanel
            sessionId={session.id}
            highlight="top3"
          />
        )}
        {session.state === "completed" && (
          <HostCompletedPanel
            sessionId={session.id}
            sessionCode={session.code}
          />
        )}
      </main>

      <footer className="px-6 py-5 border-t border-border/40 glass flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {session.state === "lobby"
            ? `${players.length} ${players.length === 1 ? "player" : "players"} joined`
            : null}
          {session.state === "question_active"
            ? `${answerCount} / ${players.length} answered`
            : null}
          {session.state === "question_locked"
            ? `${answerCount} / ${players.length} answered (locked)`
            : null}
        </div>
        <div>{renderControls()}</div>
      </footer>
    </div>
  );
}
