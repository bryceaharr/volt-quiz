import Link from "next/link";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-6 py-5 flex items-center justify-between max-w-6xl w-full mx-auto">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <Zap className="size-5 text-primary fill-primary" />
          <span>{BRAND.name}</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button render={<Link href="/join" />} variant="ghost" size="sm">
            Join a game
          </Button>
          <Button render={<Link href="/login" />} size="sm">
            Sign in
          </Button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="max-w-3xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-accent" />
            <span>Real-time quiz games for teams, classrooms, and events</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.05]">
            Live quizzes that{" "}
            <span className="text-gradient">hit different</span>.
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
            Build a quiz, share a code, watch the room light up. Players join
            from any phone — no app, no signup, no friction.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              render={<Link href="/login" />}
              size="lg"
              className="h-12 px-6 text-base"
            >
              Create a quiz <ArrowRight className="size-4" />
            </Button>
            <Button
              render={<Link href="/join" />}
              size="lg"
              variant="outline"
              className="h-12 px-6 text-base"
            >
              I have a game code
            </Button>
          </div>
        </div>
      </main>

      <footer className="px-6 py-6 text-xs text-muted-foreground text-center">
        Built for hosts who want it to feel good on a big screen.
      </footer>
    </div>
  );
}
