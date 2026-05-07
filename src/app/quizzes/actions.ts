"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db/prisma";

const QuizMetaSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().max(500).optional().nullable(),
  coverEmoji: z.string().max(8).optional().nullable(),
});

export async function createQuizAction(formData: FormData) {
  const user = await requireUser();
  const parsed = QuizMetaSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || null,
    coverEmoji: formData.get("coverEmoji") || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const quiz = await prisma.quiz.create({
    data: { ...parsed.data, ownerId: user.id },
  });
  revalidatePath("/dashboard");
  redirect(`/quizzes/${quiz.id}/edit`);
}

export async function updateQuizMetaAction(
  quizId: string,
  data: z.infer<typeof QuizMetaSchema>,
) {
  const user = await requireUser();
  const parsed = QuizMetaSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const result = await prisma.quiz.updateMany({
    where: { id: quizId, ownerId: user.id },
    data: parsed.data,
  });
  if (result.count === 0) return { error: "Not found" };
  revalidatePath(`/quizzes/${quizId}/edit`);
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function publishQuizAction(quizId: string) {
  const user = await requireUser();
  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, ownerId: user.id },
    include: { _count: { select: { questions: true } } },
  });
  if (!quiz) return { error: "Not found" };
  if (quiz._count.questions === 0) {
    return { error: "Add at least one question before publishing." };
  }
  await prisma.quiz.update({
    where: { id: quizId },
    data: { status: "published" },
  });
  revalidatePath(`/quizzes/${quizId}/edit`);
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function unpublishQuizAction(quizId: string) {
  const user = await requireUser();
  await prisma.quiz.updateMany({
    where: { id: quizId, ownerId: user.id },
    data: { status: "draft" },
  });
  revalidatePath(`/quizzes/${quizId}/edit`);
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function deleteQuizAction(quizId: string) {
  const user = await requireUser();
  await prisma.quiz.deleteMany({ where: { id: quizId, ownerId: user.id } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function duplicateQuizAction(quizId: string) {
  const user = await requireUser();
  const original = await prisma.quiz.findFirst({
    where: { id: quizId, ownerId: user.id },
    include: { questions: { include: { options: true } } },
  });
  if (!original) return { error: "Not found" };

  const copy = await prisma.quiz.create({
    data: {
      ownerId: user.id,
      title: `${original.title} (copy)`,
      description: original.description,
      coverEmoji: original.coverEmoji,
      status: "draft",
      questions: {
        create: original.questions.map((q) => ({
          type: q.type,
          prompt: q.prompt,
          imageUrl: q.imageUrl,
          timeLimit: q.timeLimit,
          points: q.points,
          explanation: q.explanation,
          order: q.order,
          options: {
            create: q.options.map((o) => ({
              text: o.text,
              isCorrect: o.isCorrect,
              order: o.order,
            })),
          },
        })),
      },
    },
  });
  revalidatePath("/dashboard");
  redirect(`/quizzes/${copy.id}/edit`);
}
