"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Trash2,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { AnswerOption, Question, QuestionType } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteQuestionAction,
  updateQuestionAction,
} from "@/app/quizzes/questions/actions";

type FullQuestion = Question & { options: AnswerOption[] };

const TYPE_LABEL: Record<QuestionType, string> = {
  multiple_choice: "Multiple choice",
  true_false: "True / False",
  poll: "Poll",
};

const OPTION_COLORS = [
  "bg-chart-1/20 text-chart-1 border-chart-1/40",
  "bg-chart-2/20 text-chart-2 border-chart-2/40",
  "bg-chart-3/20 text-chart-3 border-chart-3/40",
  "bg-chart-4/20 text-chart-4 border-chart-4/40",
];

export function QuestionEditor({
  quizId,
  index,
  question,
}: {
  quizId: string;
  index: number;
  total: number;
  question: FullQuestion;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(question.prompt === "");
  const [prompt, setPrompt] = useState(question.prompt);
  const [timeLimit, setTimeLimit] = useState(question.timeLimit);
  const [points, setPoints] = useState(question.points);
  const [explanation, setExplanation] = useState(question.explanation ?? "");
  type EditableOption = {
    id?: string;
    text: string;
    isCorrect: boolean;
  };
  const [options, setOptions] = useState<EditableOption[]>(
    question.options.map((o) => ({
      id: o.id,
      text: o.text,
      isCorrect: o.isCorrect,
    })),
  );
  const [pending, startTransition] = useTransition();

  const onSave = () => {
    startTransition(async () => {
      const payload = {
        type: question.type,
        prompt,
        imageUrl: question.imageUrl ?? "",
        timeLimit,
        points,
        explanation: explanation || null,
        options: options.map((o) => ({
          id: o.id,
          text: o.text,
          isCorrect: o.isCorrect,
        })),
      };
      const result = await updateQuestionAction(quizId, question.id, payload);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Saved");
        router.refresh();
      }
    });
  };

  const onDelete = () => {
    if (!confirm("Delete this question?")) return;
    startTransition(async () => {
      await deleteQuestionAction(quizId, question.id);
      router.refresh();
    });
  };

  const setCorrect = (i: number, value: boolean) => {
    setOptions((prev) => {
      if (question.type === "true_false") {
        // Exactly one correct.
        return prev.map((o, idx) => ({ ...o, isCorrect: idx === i }));
      }
      const next = [...prev];
      next[i] = { ...next[i], isCorrect: value };
      return next;
    });
  };

  const addOption = () => {
    if (options.length >= 4) return;
    setOptions([...options, { text: "", isCorrect: false }]);
  };

  const removeOption = (i: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== i));
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        type="button"
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="text-xs text-muted-foreground tabular-nums w-6 text-right">
          {index + 1}.
        </span>
        <Badge variant="outline" className="shrink-0 text-xs">
          {TYPE_LABEL[question.type]}
        </Badge>
        <span className="flex-1 text-left truncate text-sm">
          {prompt || (
            <span className="text-muted-foreground italic">
              Untitled question
            </span>
          )}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {timeLimit}s · {points}pt
        </span>
        {expanded ? (
          <ChevronUp className="size-4" />
        ) : (
          <ChevronDown className="size-4" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border/40">
          <div className="space-y-1.5">
            <Label htmlFor={`prompt-${question.id}`}>Question</Label>
            <Input
              id={`prompt-${question.id}`}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What's the question?"
              className="h-11 text-base"
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Answers{" "}
              {question.type !== "poll" && (
                <span className="text-xs text-muted-foreground font-normal">
                  · tap the circle to mark correct
                </span>
              )}
            </Label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 rounded-xl border-2 p-2.5 transition ${
                    opt.isCorrect && question.type !== "poll"
                      ? OPTION_COLORS[i % OPTION_COLORS.length]
                      : "bg-muted/30 border-transparent"
                  }`}
                >
                  {question.type !== "poll" && (
                    <button
                      type="button"
                      onClick={() => setCorrect(i, !opt.isCorrect)}
                      aria-label="Mark correct"
                      className={`size-6 rounded-full border-2 grid place-items-center transition ${
                        opt.isCorrect
                          ? "bg-current border-current"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      {opt.isCorrect && (
                        <Check className="size-3.5 text-background" />
                      )}
                    </button>
                  )}
                  <Input
                    value={opt.text}
                    onChange={(e) => {
                      const v = e.target.value;
                      setOptions((prev) =>
                        prev.map((o, idx) =>
                          idx === i ? { ...o, text: v } : o,
                        ),
                      );
                    }}
                    disabled={question.type === "true_false"}
                    placeholder={`Option ${i + 1}`}
                    className="h-9 bg-transparent border-transparent focus-visible:border-border"
                    maxLength={200}
                  />
                  {question.type === "multiple_choice" && options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(i)}
                      className="size-8 shrink-0"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {question.type === "multiple_choice" && options.length < 4 && (
              <Button variant="ghost" size="sm" onClick={addOption}>
                <Plus className="size-3.5" />
                Add option
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Time limit</Label>
              <Select
                value={String(timeLimit)}
                onValueChange={(v) => setTimeLimit(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 30, 45, 60, 90, 120].map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s} seconds
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Points</Label>
              <Select
                value={String(points)}
                onValueChange={(v) => setPoints(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 500, 1000, 1500, 2000].map((p) => (
                    <SelectItem key={p} value={String(p)}>
                      {p === 0 ? "No points (poll-style)" : `${p} pts`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`explanation-${question.id}`}>
              Explanation (optional)
            </Label>
            <Input
              id={`explanation-${question.id}`}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Shown to players after the answer is revealed"
              maxLength={500}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
              disabled={pending}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
            <Button onClick={onSave} disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
