import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getPlayerForCodeAction } from "@/app/play/actions";
import { PlayerLiveScreen } from "@/components/player/player-live-screen";

export default async function PlayCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: raw } = await params;
  const code = raw.toUpperCase().trim();

  const player = await getPlayerForCodeAction(code);
  if (!player) redirect(`/join/${code}`);

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
  if (!session) notFound();

  return (
    <PlayerLiveScreen
      session={session}
      quiz={session.quiz}
      player={{
        id: player.id,
        displayName: player.displayName,
        avatarSeed: player.avatarSeed,
      }}
    />
  );
}
