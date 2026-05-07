// Realtime channel events broadcast over `session:{code}`.
export type SessionEvent =
  | { type: "state_changed"; state: SessionState }
  | { type: "question_started"; questionId: string; startedAtMs: number }
  | { type: "question_locked"; questionId: string }
  | { type: "results_revealed"; questionId: string }
  | { type: "leaderboard"; entries: LeaderboardEntry[] }
  | { type: "session_completed" }
  | { type: "answer_count"; questionId: string; count: number };

export type SessionState =
  | "lobby"
  | "question_active"
  | "question_locked"
  | "showing_results"
  | "showing_leaderboard"
  | "completed";

export type LeaderboardEntry = {
  playerId: string;
  displayName: string;
  avatarSeed: string;
  totalPoints: number;
  rank: number;
};

export const channelName = (code: string) => `session:${code}`;
