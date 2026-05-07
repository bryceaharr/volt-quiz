"use client";

import { motion } from "motion/react";
import type { AnswerOption, Question } from "@prisma/client";
import { Image as ImageIcon } from "lucide-react";
import { TimerBar } from "./timer-bar";

const SHAPES = ["▲", "■", "●", "◆"];
const COLORS = [
  "from-chart-1/40 to-chart-1/10 border-chart-1/40",
  "from-chart-2/40 to-chart-2/10 border-chart-2/40",
  "from-chart-3/40 to-chart-3/10 border-chart-3/40",
  "from-chart-4/40 to-chart-4/10 border-chart-4/40",
];

export function HostQuestionPanel({
  question,
  questionIndex,
  totalQuestions,
  answerCount,
  playerCount,
  questionStartedAt,
  locked,
}: {
  question: Question & { options: AnswerOption[] };
  questionIndex: number;
  totalQuestions: number;
  answerCount: number;
  playerCount: number;
  questionStartedAt: Date | null;
  locked: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col gap-6 mt-2">
      {/* Timer bar */}
      <TimerBar
        durationSec={question.timeLimit}
        startedAt={questionStartedAt}
        paused={locked}
      />

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Question {questionIndex + 1} of {totalQuestions}
        </span>
        <span className="text-sm tabular-nums text-muted-foreground">
          {answerCount} / {playerCount} answered
        </span>
      </div>

      {/* Big question text */}
      <motion.h1
        key={question.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-3xl lg:text-5xl font-bold tracking-tight text-center max-w-4xl mx-auto leading-tight"
      >
        {question.prompt}
      </motion.h1>

      {question.imageUrl && (
        <div className="mx-auto rounded-2xl overflow-hidden glass max-w-2xl w-full max-h-72">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={question.imageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Answer grid (shown without highlighting correct) */}
      <div
        className={`grid gap-3 max-w-4xl w-full mx-auto ${
          question.options.length === 2
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2"
        }`}
      >
        {question.options.map((opt, i) => (
          <motion.div
            key={opt.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 + i * 0.06 }}
            className={`bg-gradient-to-br ${COLORS[i % 4]} border-2 rounded-2xl px-6 py-6 flex items-center gap-4`}
          >
            <span className="text-3xl font-bold opacity-60">
              {SHAPES[i % 4]}
            </span>
            <span className="text-lg lg:text-2xl font-semibold flex-1">
              {opt.text || (
                <span className="opacity-50 italic flex items-center gap-2">
                  <ImageIcon className="size-4" /> No text
                </span>
              )}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
