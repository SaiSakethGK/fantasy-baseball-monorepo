// src/routes/scoring.ts
// Single source of truth for scoring on the server.

export type Stats = Partial<{
  HR: number; RBI: number; R: number; SB: number; AVG: number;
  W: number; SV: number; K: number; ERA: number; WHIP: number;
}>;

/** Score a single player. */
export function scoreStats(stats: Stats | undefined): number {
  if (!stats) return 0;
  let pts = 0;

  if (stats.HR)  pts += stats.HR * 4;
  if (stats.RBI) pts += stats.RBI * 1;
  if (stats.R)   pts += stats.R * 1;
  if (stats.SB)  pts += stats.SB * 2;
  if (typeof stats.AVG  === 'number')  pts += stats.AVG * 10;

  if (stats.W)   pts += stats.W * 5;
  if (stats.SV)  pts += stats.SV * 5;
  if (stats.K)   pts += stats.K * 1;
  if (typeof stats.ERA  === 'number')  pts += Math.max(0, 4.0 - stats.ERA) * 2;
  if (typeof stats.WHIP === 'number')  pts += Math.max(0, 1.3 - stats.WHIP) * 5;

  return Math.round(pts * 100) / 100;
}

/** Sum team points. */
export function calcTeamPoints(players: Array<{ stats?: Stats }>): number {
  const sum = players.reduce((acc, p) => acc + scoreStats(p.stats), 0);
  return Math.round(sum * 100) / 100;
}

/** Return top N players by computed points. */
export function topPlayersByPoints<T extends { stats?: Stats }>(
  players: T[],
  n = 5
): Array<T & { points: number }> {
  return players
    .map(p => ({ ...p, points: scoreStats(p.stats) }))
    .sort((a, b) => b.points - a.points)
    .slice(0, n);
}
