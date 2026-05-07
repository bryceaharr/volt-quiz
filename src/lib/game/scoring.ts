// Faster correct answers earn more points. Floor of 50% even at the buzzer.
export function calculatePoints(opts: {
  isCorrect: boolean;
  msToAnswer: number;
  timeLimitMs: number;
  basePoints: number;
}): number {
  if (!opts.isCorrect) return 0;
  const ratio = Math.max(0, 1 - opts.msToAnswer / opts.timeLimitMs);
  // 50% floor for any correct answer; 100% for instant answers.
  const speedBonus = 0.5 + ratio * 0.5;
  return Math.round(opts.basePoints * speedBonus);
}
