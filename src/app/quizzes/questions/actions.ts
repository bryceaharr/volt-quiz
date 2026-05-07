"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { QuestionType } from "@prisma/client";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db/prisma";

const OptionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, "Option text required").max(200),
  isCorrect: z.boolean().default(false),
});

const QuestionSchema = z
  .object({
    type: z.enum(["multiple_choice", "true_false", "poll"]),
    prompt: z.string().min(1, "Question text required").max(500),
    imageUrl: z.string().url().optional().nullable().or(z.literal("")),
    timeLimit: z.number().int().min(5).max(300),
    points: z.number().int().min(0).max(10000),
    explanation: z.string().max(500).optional().nullable(),
    options: z.array(OptionSchema).min(2).max(4),
  })
  .superRefine((q, ctx) => {
    if (q.type === "true_false" && q.options.length !== 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "True/False must have exactly 2 options",
      });
    }
    if (q.type === "multiple_choice") {
      const correctCount = q.options.filter((o) => o.isCorrect).length;
      if (correctCount === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pick at least one correct answer",
          path: ["options"],
        });
      }
    }
  });

async function assertOwnsQuiz(quizId: string, userId: string) {
  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, ownerId: userId },
    select: { id: true },
  });
  if (!quiz) throw new Error("Not found");
}

export async function addQuestionAction(quizId: string, type: QuestionType) {
  const user = await requireUser();
  await assertOwnsQuiz(quizId, user.id);
  const last = await prisma.question.findFirst({
    where: { quizId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const order = (last?.order ?? -1) + 1;

  const defaultOptions =
    type === "true_false"
      ? [
          { text: "True", isCorrect: true, order: 0 },
          { text: "False", isCorrect: false, order: 1 },
        ]
      : [
          { text: "", isCorrect: type === "multiple_choice", order: 0 },
          { text: "", isCorrect: false, order: 1 },
          { text: "", isCorrect: false, order: 2 },
          { text: "", isCorrect: false, order: 3 },
        ];

  const question = await prisma.question.create({
    data: {
      quizId,
      type,
      prompt: "",
      timeLimit: 20,
      points: 1000,
      order,
      options: { create: defaultOptions },
    },
    include: { options: { orderBy: { order: "asc" } } },
  });
  revalidatePath(`/quizzes/${quizId}/edit`);
  return { ok: true as const, question };
}

export async function updateQuestionAction(
  quizId: string,
  questionId: string,
  payload: z.infer<typeof QuestionSchema>,
) {
  const user = await requireUser();
  await assertOwnsQuiz(quizId, user.id);

  const parsed = QuestionSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.question.update({
      where: { id: questionId, quizId },
      data: {
        type: data.type,
        prompt: data.prompt,
        imageUrl: data.imageUrl || null,
        timeLimit: data.timeLimit,
        points: data.points,
        explanation: data.explanation || null,
      },
    });

    // Replace options atomically — simpler and correct than diffing.
    await tx.answerOption.deleteMany({ where: { questionId } });
    await tx.answerOption.createMany({
      data: data.options.map((o, i) => ({
        questionId,
        text: o.text,
        isCorrect: data.type === "poll" ? false : o.isCorrect,
        order: i,
      })),
    });
  });

  revalidatePath(`/quizzes/${quizId}/edit`);
  return { ok: true as const };
}

export async function deleteQuestionAction(quizId: string, questionId: string) {
  const user = await requireUser();
  await assertOwnsQuiz(quizId, user.id);
  await prisma.question.delete({ where: { id: questionId, quizId } });
  revalidatePath(`/quizzes/${quizId}/edit`);
  return { ok: true as const };
}

export async function reorderQuestionsAction(
  quizId: string,
  orderedIds: string[],
) {
  const user = await requireUser();
  await assertOwnsQuiz(quizId, user.id);
  await prisma.$transaction(
    orderedIds.map((id, i) =>
      prisma.question.update({
        where: { id, quizId },
        data: { order: i },
      }),
    ),
  );
  revalidatePath(`/quizzes/${quizId}/edit`);
  return { ok: true as const };
}
