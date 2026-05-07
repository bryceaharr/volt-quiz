import Link from "next/link";
import { Plus, ListMusic } from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { QuizCard } from "@/components/quiz/quiz-card";
import { EmptyState } from "@/components/ui-ext/empty-state";

export const metadata = { title: "Your quizzes" };

export default async function DashboardPage() {
  const user = await requireUser();
  const quizzes = await prisma.quiz.findMany({
    where: { ownerId: user.id },
    include: { _count: { select: { questions: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Your quizzes</h1>
          <p className="text-muted-foreground mt-1">
            Drafts, published games, and the ones you ran last week.
          </p>
        </div>
        <Button
          render={<Link href="/quizzes/new" />}
          size="lg"
          className="h-11"
        >
          <Plus className="size-4" />
          New quiz
        </Button>
      </div>

      {quizzes.length === 0 ? (
        <EmptyState
          icon={<ListMusic className="size-8 text-primary" />}
          title="No quizzes yet"
          description="Build your first quiz in under a minute. Add questions, publish, and host live."
          action={
            <Button render={<Link href="/quizzes/new" />} size="lg">
              <Plus className="size-4" />
              Create your first quiz
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((q) => (
            <QuizCard
              key={q.id}
              id={q.id}
              title={q.title}
              description={q.description}
              coverEmoji={q.coverEmoji}
              status={q.status}
              questionCount={q._count.questions}
              updatedAt={q.updatedAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
