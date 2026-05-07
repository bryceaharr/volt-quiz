import Link from "next/link";
import { Zap } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { UserMenu } from "./user-menu";

export function AppShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 glass border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Zap className="size-5 text-primary fill-primary" />
            <span>{BRAND.name}</span>
          </Link>
          <UserMenu email={email} />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
