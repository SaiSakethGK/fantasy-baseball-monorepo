import type { Player, Stats } from "../models.js";

// Demo scoring weights
// Batters: HR=4, RBI=1, R=1, SB=2, AVG bonus = AVG * 10
// Pitchers: W=5, SV=5, K=1, ERA bonus = max(0, (4.00 - ERA)) * 2, WHIP bonus = max(0, (1.30 - WHIP)) * 5
export function scoreStats(stats: Stats): number {
  let pts = 0;
  if (stats.HR) pts += stats.HR * 4;
  if (stats.RBI) pts += stats.RBI * 1;
  if (stats.R) pts += stats.R * 1;
  if (stats.SB) pts += stats.SB * 2;
  if (stats.AVG) pts += stats.AVG * 10;
  if (stats.W) pts += stats.W * 5;
  if (stats.SV) pts += stats.SV * 5;
  if (stats.K) pts += stats.K * 1;
  if (typeof stats.ERA === "number") pts += Math.max(0, 4.0 - stats.ERA) * 2;
  if (typeof stats.WHIP === "number") pts += Math.max(0, 1.3 - stats.WHIP) * 5;
  return Math.round(pts * 100) / 100;
}

export function topPlayersByPoints(players: Player[], topN = 5) {
  return players
    .map((p) => ({ ...p, points: scoreStats(p.stats) }))
    .sort((a, b) => b.points - a.points)
    .slice(0, topN);
}
