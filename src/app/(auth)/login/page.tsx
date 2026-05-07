import Link from "next/link";
import { Zap } from "lucide-react";
import { LoginForm } from "./login-form";
import { BRAND } from "@/lib/brand";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 text-lg font-semibold"
        >
          <Zap className="size-5 text-primary fill-primary" />
          {BRAND.name}
        </Link>
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            We&apos;ll email you a magic link. No password required.
          </p>
        </div>
        <div className="glass-strong rounded-2xl p-6">
          <LoginForm />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Just here to play?{" "}
          <Link href="/join" className="text-foreground underline">
            Join with a game code
          </Link>
        </p>
      </div>
    </div>
  );
}
