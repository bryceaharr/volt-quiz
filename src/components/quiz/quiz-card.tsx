import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import type { QuizStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function timeAgo(date: Date): string {
  const now = Date.now();
  const diff = Math.max(0, now - date.getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return date.toLocaleDateString();
}

export function QuizCard({
  id,
  title,
  description,
  coverEmoji,
  status,
  questionCount,
  updatedAt,
}: {
  id: string;
  title: string;
  description: string | null;
  coverEmoji: string | null;
  status: QuizStatus;
  questionCount: number;
  updatedAt: Date;
}) {
  const canHost = status === "published" && questionCount > 0;

  return (
    <div className="group glass rounded-2xl p-5 flex flex-col gap-4 hover:bg-white/[0.06] transition-colors">
      <div className="flex items-start justify-between">
        <div className="size-12 rounded-xl bg-primary/15 grid place-items-center text-2xl">
          {coverEmoji ?? "⚡"}
        </div>
        <Badge variant={status === "published" ? "default" : "secondary"}>
          {status}
        </Badge>
      </div>

      <Link href={`/quizzes/${id}/edit`} className="space-y-1.5 flex-1">
        <h3 className="font-semibold leading-tight line-clamp-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
      </Link>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {questionCount} {questionCount === 1 ? "question" : "questions"}
        </span>
        <span>Updated {timeAgo(updatedAt)}</span>
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          render={<Link href={`/quizzes/${id}/edit`} />}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          Edit <ArrowUpRight className="size-3.5" />
        </Button>
        <Button
          render={
            <Link
              href={canHost ? `/quizzes/${id}/host` : `/quizzes/${id}/edit`}
              aria-disabled={!canHost}
            />
          }
          size="sm"
          className="flex-1"
          disabled={!canHost}
        >
          <Play className="size-3.5 fill-current" />
          Host
        </Button>
      </div>
    </div>
  );
}
