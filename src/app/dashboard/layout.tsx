import { requireUser } from "@/lib/auth/require-user";
import { AppShell } from "@/components/host/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return <AppShell email={user.email!}>{children}</AppShell>;
}
