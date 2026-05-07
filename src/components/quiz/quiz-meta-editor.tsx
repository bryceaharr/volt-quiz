"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Quiz } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateQuizMetaAction } from "@/app/quizzes/actions";

const EMOJI_CHOICES = ["⚡", "🎯", "🧠", "🚀", "🔥", "🎲", "💡", "🎮"];

export function QuizMetaEditor({ quiz }: { quiz: Quiz }) {
  const router = useRouter();
  const [title, setTitle] = useState(quiz.title);
  const [description, setDescription] = useState(quiz.description ?? "");
  const [coverEmoji, setCoverEmoji] = useState(quiz.coverEmoji ?? "⚡");
  const [pending, startTransition] = useTransition();

  const dirty =
    title !== quiz.title ||
    description !== (quiz.description ?? "") ||
    coverEmoji !== (quiz.coverEmoji ?? "⚡");

  const onSave = () => {
    startTransition(async () => {
      const result = await updateQuizMetaAction(quiz.id, {
        title,
        description: description || null,
        coverEmoji,
      });
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Saved");
        router.refresh();
      }
    });
  };

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-start gap-4">
        <div className="size-16 rounded-xl bg-primary/15 grid place-items-center text-3xl shrink-0">
          {coverEmoji}
        </div>
        <div className="flex-1 space-y-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Quiz title"
            className="text-lg font-semibold h-11 bg-transparent border-transparent hover:border-border focus-visible:border-border px-3 -mx-3"
            maxLength={120}
          />
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a short description (optional)"
            className="text-sm bg-transparent border-transparent hover:border-border focus-visible:border-border px-3 -mx-3 text-muted-foreground"
            maxLength={500}
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {EMOJI_CHOICES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setCoverEmoji(e)}
              className={`size-8 rounded-lg text-lg grid place-items-center transition ${
                coverEmoji === e
                  ? "bg-primary/25 ring-2 ring-primary"
                  : "bg-muted hover:bg-muted/70"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        <Button
          onClick={onSave}
          disabled={!dirty || pending}
          size="sm"
          variant={dirty ? "default" : "ghost"}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          {dirty ? "Save" : "Saved"}
        </Button>
      </div>
    </div>
  );
}
