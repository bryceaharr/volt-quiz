"use server";

import { cookies } from "next/headers";
import * as z from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

const PLAYER_COOKIE = (code: string) => `volt_player_${code}`;

const NameSchema = z
  .string()
  .trim()
  .min(1, "Pick a name")
  .max(24, "Too long");

const AVATAR_SEEDS = [
  "comet",
  "spark",
  "neon",
  "vibe",
  "echo",
  "pixel",
  "lumen",
  "dash",
  "rocket",
  "mango",
  "tiger",
  "river",
];

function randomSeed() {
  return AVATAR_SEEDS[Math.floor(Math.random() * AVATAR_SEEDS.length)];
}

export async function joinSessionAction(input: {
  code: string;
  displayName: string;
}) {
  const code = input.code.toUpperCase().trim();
  const parsed = NameSchema.safeParse(input.displayName);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid name" };
  }

  const session = await prisma.gameSession.findUnique({
    where: { code },
    select: { id: true, state: true },
  });
  if (!session) return { error: "Game not found. Check the code." };
  if (session.state === "completed") {
    return { error: "This game is over." };
  }

  let player;
  try {
    player = await prisma.player.create({
      data: {
        sessionId: session.id,
        displayName: parsed.data,
        avatarSeed: randomSeed(),
      },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { error: "Someone in this game already has that name." };
    }
    throw e;
  }

  const jar = await cookies();
  jar.set(PLAYER_COOKIE(code), player.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24h
  });

  return { ok: true as const, playerId: player.id };
}

export async function getPlayerForCodeAction(code: string) {
  const jar = await cookies();
  const playerId = jar.get(PLAYER_COOKIE(code))?.value;
  if (!playerId) return null;
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      session: { select: { code: true, state: true } },
    },
  });
  if (!player || player.session.code !== code) return null;
  return player;
}

const SubmitSchema = z.object({
  code: z.string(),
  questionId: z.string(),
  selectedOptionId: z.string().nullable(),
});

export async function submitAnswerAction(input: z.infer<typeof SubmitSchema>) {
  const parsed = SubmitSchema.safeParse(input);
  if (!parsed.success) return { error: "Bad input" };

  const jar = await cookies();
  const playerId = jar.get(PLAYER_COOKIE(parsed.data.code))?.value;
  if (!playerId) return { error: "Not joined" };

  const session = await prisma.gameSession.findUnique({
    where: { code: parsed.data.code },
    select: {
      id: true,
      state: true,
      currentQuestionId: true,
      questionStartedAt: true,
    },
  });
  if (!session) return { error: "Session not found" };
  if (session.state !== "question_active") {
    return { error: "Answers are locked" };
  }
  if (session.currentQuestionId !== parsed.data.questionId) {
    return { error: "Wrong question" };
  }

  const msToAnswer = session.questionStartedAt
    ? Math.max(0, Date.now() - session.questionStartedAt.getTime())
    : 0;

  try {
    await prisma.response.create({
      data: {
        sessionId: session.id,
        questionId: parsed.data.questionId,
        playerId,
        selectedOptionId: parsed.data.selectedOptionId,
        msToAnswer,
      },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { error: "Already answered" };
    }
    throw e;
  }
  return { ok: true as const };
}
