// Điểm theo rank trong round — rank 1 nhiều nhất
const RANK_SCORES: Record<number, number> = {
  1: 100,
  2: 80,
  3: 60,
  4: 45,
  5: 35,
  6: 25,
  7: 15,
  8: 10,
};

export function getScoreByRank(rank: number): number {
  return RANK_SCORES[rank] ?? 5; // Rank > 8 được 5 điểm
}

export function calculateRanks(
  submissions: { uid: string; drawDurationMs: number }[]
): { uid: string; rank: number; score: number }[] {
  // Sort theo thời gian tăng dần — nhanh nhất rank 1
  const sorted = [...submissions].sort(
    (a, b) => a.drawDurationMs - b.drawDurationMs
  );

  return sorted.map((s, index) => ({
    uid: s.uid,
    rank: index + 1,
    score: getScoreByRank(index + 1),
  }));
}