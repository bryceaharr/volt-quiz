"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  ListChecks,
  ToggleRight,
  BarChart3,
  Plus,
  Play,
  Trash2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Quiz, Question, AnswerOption, QuestionType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuizMetaEditor } from "./quiz-meta-editor";
import { QuestionEditor } from "./question-editor";
import { EmptyState } from "@/components/ui-ext/empty-state";
import {
  publishQuizAction,
  unpublishQuizAction,
  deleteQuizAction,
  duplicateQuizAction,
} from "@/app/quizzes/actions";
import { addQuestionAction } from "@/app/quizzes/questions/actions";

type FullQuiz = Quiz & {
  questions: (Question & { options: AnswerOption[] })[];
};

const QUESTION_TYPES: {
  value: QuestionType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  {
    value: "multiple_choice",
    label: "Multiple choice",
    icon: ListChecks,
    description: "2–4 options, one or more correct",
  },
  {
    value: "true_false",
    label: "True / False",
    icon: ToggleRight,
    description: "Two options, one correct",
  },
  {
    value: "poll",
    label: "Poll",
    icon: BarChart3,
    description: "No correct answer — gauge the room",
  },
];

export function QuizEditor({ quiz }: { quiz: FullQuiz }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const togglePublish = () => {
    startTransition(async () => {
      const action =
        quiz.status === "published" ? unpublishQuizAction : publishQuizAction;
      const result = await action(quiz.id);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          quiz.status === "published" ? "Moved to draft" : "Published",
        );
        router.refresh();
      }
    });
  };

  const onAddQuestion = (type: QuestionType) => {
    startTransition(async () => {
      const result = await addQuestionAction(quiz.id, type);
      if (result && "error" in result) {
        toast.error(result.error as string);
      } else {
        router.refresh();
      }
    });
  };

  const onDuplicate = () => {
    startTransition(async () => {
      await duplicateQuizAction(quiz.id);
    });
  };

  const onDelete = () => {
    if (!confirm("Delete this quiz? This can't be undone.")) return;
    startTransition(async () => {
      await deleteQuizAction(quiz.id);
    });
  };

  const canHost = quiz.status === "published" && quiz.questions.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <Button
          render={<Link href="/dashboard" />}
          variant="ghost"
          size="sm"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant={quiz.status === "published" ? "default" : "secondary"}>
            {quiz.status}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={togglePublish}
            disabled={pending}
          >
            {quiz.status === "published" ? "Unpublish" : "Publish"}
          </Button>
          <Button
            render={
              <Link
                href={canHost ? `/quizzes/${quiz.id}/host` : "#"}
                aria-disabled={!canHost}
              />
            }
            size="sm"
            disabled={!canHost}
          >
            <Play className="size-4 fill-current" />
            Host Live
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon">
                  ⋯
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDuplicate} className="cursor-pointer">
                <Copy className="size-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <QuizMetaEditor quiz={quiz} />

      <div className="mt-10 mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Questions{" "}
          <span className="text-muted-foreground font-normal">
            ({quiz.questions.length})
          </span>
        </h2>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button size="sm" disabled={pending}>
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Add question
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-72">
            {QUESTION_TYPES.map((t) => (
              <DropdownMenuItem
                key={t.value}
                onClick={() => onAddQuestion(t.value)}
                className="cursor-pointer flex-col items-start gap-0.5 py-2.5"
              >
                <span className="flex items-center gap-2 font-medium">
                  <t.icon className="size-4" />
                  {t.label}
                </span>
                <span className="text-xs text-muted-foreground pl-6">
                  {t.description}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {quiz.questions.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="size-8 text-primary" />}
          title="No questions yet"
          description="Add your first question to get going. Multiple choice is a good start."
          action={
            <Button onClick={() => onAddQuestion("multiple_choice")} size="lg">
              <Plus className="size-4" />
              Add a multiple-choice question
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {quiz.questions.map((q, i) => (
            <QuestionEditor
              key={q.id}
              quizId={quiz.id}
              index={i}
              total={quiz.questions.length}
              question={q}
            />
          ))}
        </div>
      )}
    </div>
  );
}
