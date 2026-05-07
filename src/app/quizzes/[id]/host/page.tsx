import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db/prisma";
import { generateGameCode } from "@/lib/game/code";

const CODE_RETRIES = 6;

// Visiting this page mints a fresh GameSession and redirects to /host/[code].
// Inlined here (instead of calling the server action) because Next 16 complains
// about invoking "use server" functions during a server component's render pass.
export default async function StartHostingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const quiz = await prisma.quiz.findFirst({
    where: { id, ownerId: user.id },
    include: { _count: { select: { questions: true } } },
  });
  if (!quiz) redirect("/dashboard");
  if (quiz._count.questions === 0) {
    redirect(`/quizzes/${id}/edit`);
  }

  let code: string | undefined;
  for (let i = 0; i < CODE_RETRIES; i++) {
    const candidate = generateGameCode();
    const exists = await prisma.gameSession.findUnique({
      where: { code: candidate },
      select: { id: true },
    });
    if (!exists) {
      code = candidate;
      break;
    }
  }
  if (!code) throw new Error("Couldn't generate a unique game code; try again.");

  const session = await prisma.gameSession.create({
    data: { code, quizId: id, hostId: user.id },
  });

  redirect(`/host/${session.code}`);
}
