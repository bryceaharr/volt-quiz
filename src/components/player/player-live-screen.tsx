"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Loader2, Trophy, Zap } from "lucide-react";
import { toast } from "sonner";
import type {
  AnswerOption,
  GameSession,
  Question,
  Quiz,
} from "@prisma/client";
import { useGameSession } from "@/lib/game/use-game-session";
import { submitAnswerAction } from "@/app/play/actions";
import { TimerBar } from "@/components/host/timer-bar";
import { BRAND } from "@/lib/brand";
import { PlayerLeaderboard } from "@/components/player/player-leaderboard";

const SHAPES = ["▲", "■", "●", "◆"];
const COLORS = [
  "from-chart-1 to-chart-1/70 border-chart-1",
  "from-chart-2 to-chart-2/70 border-chart-2",
  "from-chart-3 to-chart-3/70 border-chart-3",
  "from-chart-4 to-chart-4/70 border-chart-4",
];

type FullQuiz = Quiz & {
  questions: (Question & { options: AnswerOption[] })[];
};

export function PlayerLiveScreen({
  session: initialSession,
  quiz,
  player,
}: {
  session: GameSession;
  quiz: FullQuiz;
  player: { id: string; displayName: string; avatarSeed: string };
}) {
  const { session } = useGameSession({
    initialSession: {
      id: initialSession.id,
      code: initialSession.code,
      state: initialSession.state,
      currentQuestionId: initialSession.currentQuestionId,
      questionStartedAt: initialSession.questionStartedAt,
    },
    initialPlayers: [],
  });

  const currentQuestion = useMemo(
    () =>
      session.currentQuestionId
        ? quiz.questions.find((q) => q.id === session.currentQuestionId) ?? null
        : null,
    [session.currentQuestionId, quiz.questions],
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-5 py-3 flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-semibold">
          <Zap className="size-4 text-primary fill-primary" />
          {BRAND.name}
        </span>
        <span className="text-muted-foreground">
          You · <span className="text-foreground">{player.displayName}</span>
        </span>
      </header>

      <main className="flex-1 flex flex-col">
        {session.state === "lobby" && <PlayerLobbyView player={player} />}
        {(session.state === "question_active" ||
          session.state === "question_locked") &&
          currentQuestion && (
            <PlayerQuestionView
              code={session.code}
              question={currentQuestion}
              questionStartedAt={session.questionStartedAt}
              playerId={player.id}
              locked={session.state === "question_locked"}
            />
          )}
        {session.state === "showing_results" && currentQuestion && (
          <PlayerResultsView
            question={currentQuestion}
            playerId={player.id}
            sessionId={session.id}
          />
        )}
        {session.state === "showing_leaderboard" && (
          <PlayerLeaderboard sessionId={session.id} highlightPlayerId={player.id} />
        )}
        {session.state === "completed" && (
          <PlayerLeaderboard
            sessionId={session.id}
            highlightPlayerId={player.id}
            title="Final results"
          />
        )}
      </main>
    </div>
  );
}

function PlayerLobbyView({
  player,
}: {
  player: { displayName: string; avatarSeed: string };
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="space-y-6 max-w-xs">
        <div className="relative mx-auto w-fit">
          <div
            className="size-24 rounded-3xl grid place-items-center text-2xl font-bold uppercase"
            style={{ background: avatarColor(player.avatarSeed) }}
          >
            {player.displayName.slice(0, 2)}
          </div>
          <div className="absolute inset-0 size-24 rounded-3xl border-2 border-primary pulse-ring" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{player.displayName}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            You&apos;re in. Look at the host&apos;s screen.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Game starts when the host hits go.
        </p>
      </div>
    </div>
  );
}

function PlayerQuestionView({
  code,
  question,
  questionStartedAt,
  playerId,
  locked,
}: {
  code: string;
  question: Question & { options: AnswerOption[] };
  questionStartedAt: Date | null;
  playerId: string;
  locked: boolean;
}) {
  const [submittedOptionId, setSubmittedOptionId] = useState<string | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  // Reset on question change.
  useEffect(() => {
    setSubmittedOptionId(null);
  }, [question.id]);

  const onPick = (optionId: string) => {
    if (submittedOptionId || locked || pending) return;
    setSubmittedOptionId(optionId);
    startTransition(async () => {
      const r = await submitAnswerAction({
        code,
        questionId: question.id,
        selectedOptionId: optionId,
      });
      if ("error" in r) {
        toast.error(r.error);
        setSubmittedOptionId(null);
      }
    });
  };

  if (submittedOptionId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 18 }}
          className="size-20 rounded-full bg-accent/20 grid place-items-center"
        >
          {pending ? (
            <Loader2 className="size-8 animate-spin text-accent" />
          ) : (
            <Check className="size-10 text-accent" />
          )}
        </motion.div>
        <h2 className="text-2xl font-bold">Locked in</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Hold tight while everyone else answers.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col px-4 py-4 gap-4">
      <TimerBar
        durationSec={question.timeLimit}
        startedAt={questionStartedAt}
        paused={locked}
      />

      <div className="text-center px-2 mt-2">
        <p className="text-base font-medium leading-snug">{question.prompt}</p>
      </div>

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
        {question.options.map((opt, i) => (
          <button
            key={opt.id}
            type="button"
            disabled={locked || pending}
            onClick={() => onPick(opt.id)}
            className={`bg-gradient-to-br ${COLORS[i % 4]} border-2 rounded-2xl px-5 py-7 flex items-center gap-4 text-left disabled:opacity-50 transition active:scale-[0.98]`}
          >
            <span className="text-3xl font-bold opacity-80">
              {SHAPES[i % 4]}
            </span>
            <span className="text-lg font-semibold flex-1 text-background">
              {opt.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PlayerResultsView({
  question,
  playerId,
  sessionId,
}: {
  question: Question & { options: AnswerOption[] };
  playerId: string;
  sessionId: string;
}) {
  const [result, setResult] = useState<{
    isCorrect: boolean;
    pointsAwarded: number;
  } | null>(null);

  useEffect(() => {
    const supabase =
      require("@/lib/supabase/client").createSupabaseBrowserClient();
    let active = true;
    supabase
      .from("responses")
      .select("is_correct, points_awarded")
      .eq("session_id", sessionId)
      .eq("question_id", question.id)
      .eq("player_id", playerId)
      .maybeSingle()
      .then(({ data }: { data: { is_correct: boolean; points_awarded: number } | null }) => {
        if (active && data) {
          setResult({
            isCorrect: data.is_correct,
            pointsAwarded: data.points_awarded,
          });
        }
      });
    return () => {
      active = false;
    };
  }, [sessionId, question.id, playerId]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
      <AnimatePresence mode="wait">
        {result === null ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-muted-foreground text-sm"
          >
            Tallying…
          </motion.div>
        ) : result.isCorrect ? (
          <motion.div
            key="correct"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 16 }}
            className="space-y-4"
          >
            <div className="size-24 mx-auto rounded-full bg-accent/30 grid place-items-center glow-accent">
              <Check className="size-12 text-accent" />
            </div>
            <h1 className="text-3xl font-bold text-gradient">Correct!</h1>
            <p className="text-2xl tabular-nums font-bold">
              +{result.pointsAwarded}
            </p>
            <p className="text-muted-foreground text-sm">points</p>
          </motion.div>
        ) : question.points === 0 ? (
          <motion.div
            key="poll"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="size-24 mx-auto rounded-full bg-primary/20 grid place-items-center">
              <Trophy className="size-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Vote in</h1>
            <p className="text-muted-foreground text-sm">
              Polls don&apos;t score points.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="wrong"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 16 }}
            className="space-y-4"
          >
            <div className="size-24 mx-auto rounded-full bg-destructive/30 grid place-items-center">
              <span className="text-5xl">✕</span>
            </div>
            <h1 className="text-3xl font-bold">Not quite</h1>
            <p className="text-muted-foreground text-sm">No points this round.</p>
            {question.explanation && (
              <p className="text-sm max-w-xs glass rounded-xl px-4 py-3">
                {question.explanation}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function avatarColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `linear-gradient(135deg, oklch(0.72 0.18 ${hue}), oklch(0.65 0.2 ${(hue + 60) % 360}))`;
}
