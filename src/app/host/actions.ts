"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db/prisma";
import { generateGameCode } from "@/lib/game/code";
import { calculatePoints } from "@/lib/game/scoring";

const CODE_RETRIES = 6;

export async function startHostingAction(quizId: string) {
  const user = await requireUser();
  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, ownerId: user.id },
    include: { _count: { select: { questions: true } } },
  });
  if (!quiz) throw new Error("Quiz not found");
  if (quiz._count.questions === 0) {
    throw new Error("Add at least one question before hosting.");
  }

  // Avoid the rare collision on the unique code column.
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
    data: { code, quizId, hostId: user.id },
  });
  revalidatePath(`/host/${code}`);
  redirect(`/host/${session.code}`);
}

export async function advanceSessionAction(
  code: string,
  intent: "start" | "lock" | "reveal" | "next" | "end",
) {
  const user = await requireUser();
  const session = await prisma.gameSession.findUnique({
    where: { code },
    include: {
      quiz: {
        include: {
          questions: {
            include: { options: { orderBy: { order: "asc" } } },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });
  if (!session) throw new Error("Session not found");
  if (session.hostId !== user.id) throw new Error("Not the host");

  const questions = session.quiz.questions;
  const currentIdx = session.currentQuestionId
    ? questions.findIndex((q) => q.id === session.currentQuestionId)
    : -1;

  if (intent === "start") {
    if (questions.length === 0) throw new Error("No questions");
    const first = questions[0];
    await prisma.gameSession.update({
      where: { code },
      data: {
        state: "question_active",
        currentQuestionId: first.id,
        questionStartedAt: new Date(),
        startedAt: new Date(),
      },
    });
  } else if (intent === "lock") {
    await prisma.gameSession.update({
      where: { code },
      data: { state: "question_locked" },
    });
  } else if (intent === "reveal") {
    // Score all responses for the current question.
    if (session.currentQuestionId) {
      const q = questions.find((x) => x.id === session.currentQuestionId);
      if (q && q.points > 0) {
        const correctIds = q.options
          .filter((o) => o.isCorrect)
          .map((o) => o.id);
        const responses = await prisma.response.findMany({
          where: { sessionId: session.id, questionId: q.id },
        });
        await prisma.$transaction(
          responses.map((r) => {
            const isCorrect = r.selectedOptionId
              ? correctIds.includes(r.selectedOptionId)
              : false;
            const pointsAwarded = calculatePoints({
              isCorrect,
              msToAnswer: r.msToAnswer,
              timeLimitMs: q.timeLimit * 1000,
              basePoints: q.points,
            });
            return prisma.response.update({
              where: { id: r.id },
              data: { isCorrect, pointsAwarded },
            });
          }),
        );
      }
    }
    await prisma.gameSession.update({
      where: { code },
      data: { state: "showing_results" },
    });
  } else if (intent === "next") {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= questions.length) {
      await prisma.gameSession.update({
        where: { code },
        data: {
          state: "completed",
          currentQuestionId: null,
          endedAt: new Date(),
        },
      });
    } else {
      const next = questions[nextIdx];
      // First show leaderboard between rounds, then auto-advance via host action.
      await prisma.gameSession.update({
        where: { code },
        data: {
          state: "question_active",
          currentQuestionId: next.id,
          questionStartedAt: new Date(),
        },
      });
    }
  } else if (intent === "end") {
    await prisma.gameSession.update({
      where: { code },
      data: { state: "completed", endedAt: new Date() },
    });
  }

  revalidatePath(`/host/${code}`);
  return { ok: true as const };
}

export async function showLeaderboardAction(code: string) {
  const user = await requireUser();
  const session = await prisma.gameSession.findUnique({
    where: { code },
    select: { hostId: true },
  });
  if (!session || session.hostId !== user.id)
    throw new Error("Not authorized");
  await prisma.gameSession.update({
    where: { code },
    data: { state: "showing_leaderboard" },
  });
  revalidatePath(`/host/${code}`);
  return { ok: true as const };
}
