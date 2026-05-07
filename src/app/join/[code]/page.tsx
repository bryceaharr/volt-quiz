import { notFound, redirect } from "next/navigation";
import { Zap } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { JoinNameForm } from "./join-name-form";
import { getPlayerForCodeAction } from "@/app/play/actions";
import { BRAND } from "@/lib/brand";

export default async function JoinCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: raw } = await params;
  const code = raw.toUpperCase().trim();
  const session = await prisma.gameSession.findUnique({
    where: { code },
    include: { quiz: { select: { title: true, coverEmoji: true } } },
  });
  if (!session) notFound();
  if (session.state === "completed") {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center">
        <div className="max-w-sm space-y-2">
          <h1 className="text-2xl font-bold">This game is over</h1>
          <p className="text-muted-foreground text-sm">
            Ask the host to start a new one.
          </p>
        </div>
      </div>
    );
  }

  // Already joined? Skip name entry.
  const existing = await getPlayerForCodeAction(code);
  if (existing) redirect(`/play/${code}`);

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="size-16 mx-auto rounded-2xl bg-primary/15 grid place-items-center text-3xl">
            {session.quiz.coverEmoji ?? "⚡"}
          </div>
          <h1 className="text-2xl font-bold">{session.quiz.title}</h1>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
            <Zap className="size-3.5 text-primary" />
            {BRAND.name} · code{" "}
            <span className="font-mono font-semibold">{code}</span>
          </p>
        </div>
        <div className="glass-strong rounded-2xl p-6">
          <JoinNameForm code={code} />
        </div>
      </div>
    </div>
  );
}
