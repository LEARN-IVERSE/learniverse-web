// Ranking helpers for the leaderboard sample (pure functions, unit-tested).

export type ScoreRow = { id: string; name: string; value: number };
export type RankedRow<T extends ScoreRow = ScoreRow> = T & { rank: number; tied: boolean };

/**
 * Standard competition ranking ("1224"): equal values share the same rank and are marked as tied.
 * Rows inside a tie keep a stable order by id, as required by the spec (no hidden tie-breaker score).
 */
export function rankByValue<T extends ScoreRow>(rows: readonly T[]): RankedRow<T>[] {
  const sorted = [...rows].sort((a, b) => b.value - a.value || a.id.localeCompare(b.id));
  return sorted.map((row) => {
    const firstIndex = sorted.findIndex((r) => r.value === row.value);
    const sameValue = sorted.filter((r) => r.value === row.value).length;
    return { ...row, rank: firstIndex + 1, tied: sameValue > 1 };
  });
}

/** Format a duration in minutes as Vietnamese hours/minutes, e.g. 1930 -> "32 giờ 10 phút". */
export function formatMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes} phút`;
  return `${hours} giờ ${String(minutes).padStart(2, "0")} phút`;
}
