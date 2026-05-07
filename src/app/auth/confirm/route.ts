import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

// Handles email OTP / magic link confirmations.
// Triggered by Supabase email links built from the {{ .TokenHash }} template variable.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  // Upsert profile row on first sign-in.
  await prisma.profile.upsert({
    where: { id: data.user.id },
    create: { id: data.user.id, email: data.user.email! },
    update: { email: data.user.email! },
  });

  return NextResponse.redirect(`${origin}${next}`);
}
