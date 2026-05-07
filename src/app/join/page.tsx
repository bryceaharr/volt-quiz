import Link from "next/link";
import { Zap } from "lucide-react";
import { JoinCodeForm } from "./join-code-form";
import { BRAND } from "@/lib/brand";

export const metadata = { title: "Join a game" };

export default function JoinPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 text-lg font-semibold"
        >
          <Zap className="size-5 text-primary fill-primary" />
          {BRAND.name}
        </Link>
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Game code</h1>
          <p className="text-sm text-muted-foreground">
            Ask the host for the code on screen.
          </p>
        </div>
        <div className="glass-strong rounded-2xl p-6">
          <JoinCodeForm />
        </div>
      </div>
    </div>
  );
}
