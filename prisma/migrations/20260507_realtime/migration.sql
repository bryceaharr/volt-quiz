-- Enable Supabase Realtime for live game tables.
-- These are subscribed via Postgres Changes from the host + player clients.

ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.responses;

-- Allow anonymous reads on these tables (RLS-style policies are skipped for MVP since the schema
-- enforces ownership via game session codes; a more locked-down version comes in Phase 5).
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- Public read policies: anyone with the code can see the session state and player list.
CREATE POLICY "session_public_read" ON public.game_sessions FOR SELECT USING (true);
CREATE POLICY "player_public_read" ON public.players FOR SELECT USING (true);
CREATE POLICY "response_public_read" ON public.responses FOR SELECT USING (true);
