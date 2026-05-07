"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createQuizAction } from "../actions";

const EMOJI_CHOICES = ["⚡", "🎯", "🧠", "🚀", "🔥", "🎲", "💡", "🎮"];

export function NewQuizForm() {
  const router = useRouter();
  const [emoji, setEmoji] = useState("⚡");
  const [pending, startTransition] = useTransition();

  const onSubmit = (form: FormData) => {
    form.set("coverEmoji", emoji);
    startTransition(async () => {
      const result = await createQuizAction(form);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      // Redirect happens server-side.
      router.refresh();
    });
  };

  return (
    <form action={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label>Cover</Label>
        <div className="flex flex-wrap gap-2">
          {EMOJI_CHOICES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`size-11 rounded-xl text-xl grid place-items-center transition ${
                emoji === e
                  ? "bg-primary/25 ring-2 ring-primary"
                  : "bg-muted hover:bg-muted/70"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={120}
          placeholder="Q3 Sales Training Trivia"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          name="description"
          maxLength={500}
          placeholder="A 10-minute warm-up before kickoff."
        />
      </div>
      <Button type="submit" className="w-full h-11" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Create quiz
      </Button>
    </form>
  );
}
