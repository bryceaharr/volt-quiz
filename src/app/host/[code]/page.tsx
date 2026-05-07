import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db/prisma";
import { HostLiveScreen } from "@/components/host/host-live-screen";
import { headers } from "next/headers";

export default async function HostLivePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
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
      players: { orderBy: { joinedAt: "asc" } },
    },
  });
  if (!session) notFound();
  if (session.hostId !== user.id) notFound();

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const joinUrl = `${proto}://${host}/join/${session.code}`;

  return <HostLiveScreen session={session} joinUrl={joinUrl} />;
}
