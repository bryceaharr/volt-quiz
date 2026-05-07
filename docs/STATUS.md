# Volt — Status

Last updated: 2026-05-06

A live quiz platform. Host runs the show on a big screen; players join from their phones.

## Quick links

- **Local dev:** `npm run dev` → http://localhost:3000
- **Supabase project:** [hqjsmxqcucgulcvajxhv](https://supabase.com/dashboard/project/hqjsmxqcucgulcvajxhv) (org: ForgdFitness, free tier)
- **Brand source of truth:** [src/lib/brand.ts](../src/lib/brand.ts) — change `name` and the whole app updates

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui (base-ui) · Supabase (Auth + Realtime + Postgres) · Prisma 7 with `@prisma/adapter-pg` · `zod` · `react-hook-form` · `motion` · `qrcode.react` · `sonner`.

## Phase 1 (done)

- Auth: magic link via `@supabase/ssr` + `proxy.ts` session refresh
- Quiz CRUD: list, create, edit metadata, add/edit/delete questions, reorder, duplicate, publish/unpublish, delete
- Question types: multiple choice, true/false, poll
- Visual system: dark-first theme with violet/cyan palette, glassmorphism, gradient typography, animated hero

## Phase 2 (next)

- Server action `hostLive(quizId)` → creates `GameSession` with 6-char code → redirects to `/host/[code]`
- `/host/[code]` lobby: QR code, big code display, live player list via Supabase Realtime presence on channel `session:{code}`
- `/join/[code]`: display name entry, prevents dupes via `(sessionId, displayName)` unique
- `/play/[code]` lobby: "Waiting for host..."
- Start button transitions state from `lobby` → `question_active`

## Important version gotchas (read before coding)

1. **Next 16 renamed middleware → `proxy.ts`**. The `proxy()` function is the new middleware.
2. **`params` is now `Promise<{...}>`** — `await` it in async page components.
3. **shadcn here uses base-ui, not radix**. No `asChild`. Use `render={<Link href="..." />}`.
4. **Prisma 7 dropped `url`/`directUrl` from schema**. They live in `prisma.config.ts`. Runtime client needs an adapter.
5. **Supabase pooler + `pg` v9** — `DATABASE_URL` needs `?sslmode=require&uselibpqcompat=true` to avoid cert chain rejection.
6. **Supabase keys are now `sb_publishable_*` and `sb_secret_*`** — env vars are `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`.

## Testing

- Magic link emails go to `localhost:3000` redirect — only work on the dev machine. For phone testing, use ngrok or deploy to a preview URL and add it to Supabase auth allow-list.

## Repo conventions

- All Volt-specific docs live here (`docs/`), not in the Obsidian vault — that vault is for Bryce's separate Forgd project.
- Memory files (project-specific context for Claude) live at `~/.claude/projects/-Users-bryceharr-dev-quiz-platform/memory/` (also mirrored to `~/.claude/projects/-Users-bryceharr/memory/` for sessions started from the home dir).
