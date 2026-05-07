-- Rename camelCase columns to snake_case so raw Supabase REST/Realtime queries work.
-- Prisma client API still exposes camelCase via @map().

ALTER TABLE public.profiles RENAME COLUMN "displayName" TO display_name;
ALTER TABLE public.profiles RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE public.profiles RENAME COLUMN "updatedAt" TO updated_at;

ALTER TABLE public.quizzes RENAME COLUMN "ownerId" TO owner_id;
ALTER TABLE public.quizzes RENAME COLUMN "coverEmoji" TO cover_emoji;
ALTER TABLE public.quizzes RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE public.quizzes RENAME COLUMN "updatedAt" TO updated_at;

ALTER TABLE public.questions RENAME COLUMN "quizId" TO quiz_id;
ALTER TABLE public.questions RENAME COLUMN "imageUrl" TO image_url;
ALTER TABLE public.questions RENAME COLUMN "timeLimit" TO time_limit;

ALTER TABLE public.answer_options RENAME COLUMN "questionId" TO question_id;
ALTER TABLE public.answer_options RENAME COLUMN "isCorrect" TO is_correct;

ALTER TABLE public.game_sessions RENAME COLUMN "quizId" TO quiz_id;
ALTER TABLE public.game_sessions RENAME COLUMN "hostId" TO host_id;
ALTER TABLE public.game_sessions RENAME COLUMN "currentQuestionId" TO current_question_id;
ALTER TABLE public.game_sessions RENAME COLUMN "questionStartedAt" TO question_started_at;
ALTER TABLE public.game_sessions RENAME COLUMN "startedAt" TO started_at;
ALTER TABLE public.game_sessions RENAME COLUMN "endedAt" TO ended_at;
ALTER TABLE public.game_sessions RENAME COLUMN "createdAt" TO created_at;

ALTER TABLE public.players RENAME COLUMN "sessionId" TO session_id;
ALTER TABLE public.players RENAME COLUMN "displayName" TO display_name;
ALTER TABLE public.players RENAME COLUMN "avatarSeed" TO avatar_seed;
ALTER TABLE public.players RENAME COLUMN "joinedAt" TO joined_at;
ALTER TABLE public.players RENAME COLUMN "isConnected" TO is_connected;

ALTER TABLE public.responses RENAME COLUMN "sessionId" TO session_id;
ALTER TABLE public.responses RENAME COLUMN "questionId" TO question_id;
ALTER TABLE public.responses RENAME COLUMN "playerId" TO player_id;
ALTER TABLE public.responses RENAME COLUMN "selectedOptionId" TO selected_option_id;
ALTER TABLE public.responses RENAME COLUMN "textAnswer" TO text_answer;
ALTER TABLE public.responses RENAME COLUMN "msToAnswer" TO ms_to_answer;
ALTER TABLE public.responses RENAME COLUMN "isCorrect" TO is_correct;
ALTER TABLE public.responses RENAME COLUMN "pointsAwarded" TO points_awarded;
ALTER TABLE public.responses RENAME COLUMN "createdAt" TO created_at;

-- For postgres_changes payloads to fire on UPDATE/DELETE, REPLICA IDENTITY FULL
-- must be set so old/new row data is captured.
ALTER TABLE public.game_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.players REPLICA IDENTITY FULL;
ALTER TABLE public.responses REPLICA IDENTITY FULL;
