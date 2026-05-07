/* eslint-disable @typescript-eslint/no-require-imports */
// One-off: generate a magic-link URL via Supabase admin API (no email needed).
// Usage: npx tsx scripts/magic-link.ts you@example.com
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx tsx scripts/magic-link.ts <email>");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://volt-quiz.vercel.app";

(async () => {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${SITE_URL}/auth/confirm?next=/dashboard`,
    },
  });
  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
  const props = data.properties;
  if (!props) {
    console.error("No link properties returned");
    process.exit(1);
  }
  // The hashed_token + type are what /auth/confirm expects.
  const url = `${SITE_URL}/auth/confirm?token_hash=${props.hashed_token}&type=magiclink&next=/dashboard`;
  console.log("\nClick or paste this URL on your phone:\n");
  console.log(url);
  console.log("\nLink expires in ~1 hour. Single-use.\n");
})();
