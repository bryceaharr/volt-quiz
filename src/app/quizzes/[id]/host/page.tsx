import { startHostingAction } from "@/app/host/actions";

export default async function StartHostingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Server action redirects on success.
  await startHostingAction(id);
  return null;
}
