"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinSessionAction } from "@/app/play/actions";

export function JoinNameForm({ code }: { code: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const r = await joinSessionAction({ code, displayName: trimmed });
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      router.push(`/play/${code}`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Your name
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sam"
          maxLength={24}
          autoFocus
          autoComplete="off"
          className="h-14 text-lg text-center"
        />
        <p className="text-xs text-muted-foreground text-center">
          Everyone on the leaderboard will see this.
        </p>
      </div>
      <Button
        type="submit"
        className="w-full h-12 text-base"
        disabled={pending || !name.trim()}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            Let&apos;s go <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
