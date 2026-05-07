import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db/prisma";
import { AppShell } from "@/components/host/app-shell";
import { QuizEditor } from "@/components/quiz/quiz-editor";

export default async function EditQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const quiz = await prisma.quiz.findFirst({
    where: { id, ownerId: user.id },
    include: {
      questions: {
        include: { options: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!quiz) notFound();

  return (
    <AppShell email={user.email!}>
      <QuizEditor quiz={quiz} />
    </AppShell>
  );
}
