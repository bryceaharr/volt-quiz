"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import type { AnswerOption, Question } from "@prisma/client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const SHAPES = ["▲", "■", "●", "◆"];
const COLORS = ["chart-1", "chart-2", "chart-3", "chart-4"];

export function HostResultsPanel({
  sessionId,
  question,
  playerCount,
}: {
  sessionId: string;
  sessionCode: string;
  question: Question & { options: AnswerOption[] };
  playerCount: number;
}) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const totalAnswers = Object.values(counts).reduce((a, b) => a + b, 0);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let active = true;
    supabase
      .from("responses")
      .select("selected_option_id")
      .eq("session_id", sessionId)
      .eq("question_id", question.id)
      .then(({ data }) => {
        if (!active || !data) return;
        const c: Record<string, number> = {};
        for (const r of data as { selected_option_id: string | null }[]) {
          if (r.selected_option_id)
            c[r.selected_option_id] = (c[r.selected_option_id] ?? 0) + 1;
        }
        setCounts(c);
      });
    return () => {
      active = false;
    };
  }, [sessionId, question.id]);

  const max = Math.max(1, ...Object.values(counts));
  const isPoll = question.points === 0;

  return (
    <div className="flex-1 flex flex-col gap-6 mt-2 max-w-4xl mx-auto w-full">
      <div className="text-center space-y-2">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          {isPoll ? "Results" : "Answer"}
        </p>
        <h1 className="text-3xl lg:text-4xl font-bold leading-tight">
          {question.prompt}
        </h1>
        <p className="text-sm text-muted-foreground">
          {totalAnswers} of {playerCount} answered
        </p>
      </div>

      <div className="space-y-3">
        {question.options.map((opt, i) => {
          const count = counts[opt.id] ?? 0;
          const ratio = count / max;
          return (
            <div
              key={opt.id}
              className={`relative rounded-2xl overflow-hidden border-2 ${
                opt.isCorrect && !isPoll
                  ? `border-accent bg-accent/10`
                  : "border-border/40 bg-card/30"
              }`}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${ratio * 100}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`absolute inset-y-0 left-0 bg-${COLORS[i % 4]}/30`}
              />
              <div className="relative flex items-center gap-3 px-5 py-4">
                <span className={`text-2xl font-bold text-${COLORS[i % 4]}`}>
                  {SHAPES[i % 4]}
                </span>
                <span className="flex-1 text-lg font-medium">
                  {opt.text || <span className="opacity-50 italic">—</span>}
                </span>
                {!isPoll &&
                  (opt.isCorrect ? (
                    <Check className="size-6 text-accent" />
                  ) : (
                    <X className="size-6 text-muted-foreground/40" />
                  ))}
                <span className="font-bold tabular-nums w-12 text-right">
                  {count}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {question.explanation && (
        <div className="glass rounded-xl px-5 py-4 text-center text-sm text-muted-foreground max-w-2xl mx-auto">
          <span className="font-semibold text-foreground">Note: </span>
          {question.explanation}
        </div>
      )}
    </div>
  );
}
