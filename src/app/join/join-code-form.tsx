"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function JoinCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = code.trim().toUpperCase();
    if (cleaned.length < 4) return;
    router.push(`/join/${cleaned}`);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="ABC123"
        maxLength={8}
        autoFocus
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        className="h-16 text-center text-3xl font-bold tracking-[0.4em] font-mono"
        inputMode="text"
      />
      <Button type="submit" className="w-full h-12 text-base">
        Continue <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
