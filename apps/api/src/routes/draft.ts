import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Player, Team, DraftState } from "../models.js";
import { scoreStats } from "./scoring.js";

const players: Player[] = JSON.parse(
  readFileSync(join(process.cwd(), "src", "data", "players.json"), "utf-8")
);

// In-memory state (resets on server restart)
const teams = new Map<string, Team>();
const drafted = new Set<string>();
const draft: DraftState = {
  isActive: true,
  onTheClockUserId: "u1",
  pickSeconds: 20,
  pickEndsAt: Date.now() + 20000,
  order: ["u1"]
};

function recalcTeamPoints(team: Team) {
  let total = 0;
  for (const pid of team.picks) {
    const p = players.find((pp) => pp.id === pid);
    if (p) total += scoreStats(p.stats);
  }
  team.points = Math.round(total * 100) / 100;
}

function autoPickFor(userId: string) {
  const available = players.filter((p) => !drafted.has(p.id));
  if (available.length === 0) return;
  const best = available
    .map((p) => ({ id: p.id, pts: scoreStats(p.stats) }))
    .sort((a, b) => b.pts - a.pts)[0];
  pickPlayer(userId, best.id);
}

function pickPlayer(userId: string, playerId: string) {
  if (drafted.has(playerId)) throw new Error("Player already drafted");
  const team = teams.get(userId) ?? { userId, name: "Team Demo", picks: [], points: 0 };
  if (team.picks.includes(playerId)) throw new Error("Cannot draft same player twice");
  team.picks.push(playerId);
  drafted.add(playerId);
  recalcTeamPoints(team);
  teams.set(userId, team);
  draft.onTheClockUserId = userId;
  draft.pickEndsAt = Date.now() + draft.pickSeconds * 1000;
}

export default async function draftRoutes(app: FastifyInstance) {
  app.get("/api/draft/state", async () => draft);

  app.post("/api/draft/tick", async () => {
    if (!draft.isActive || !draft.onTheClockUserId) return draft;
    if (draft.pickEndsAt && Date.now() >= draft.pickEndsAt) {
      autoPickFor(draft.onTheClockUserId);
    }
    return draft;
  });

  app.post("/api/draft/pick", async (req, reply) => {
    const body = z.object({ userId: z.string(), playerId: z.string() }).parse(req.body);
    try {
      pickPlayer(body.userId, body.playerId);
      return { ok: true, team: teams.get(body.userId) };
    } catch (e) {
      reply.status(400);
      return { ok: false, error: (e as Error).message };
    }
  });

  app.post("/api/draft/remove", async (req, reply) => {
    const body = z.object({ userId: z.string(), playerId: z.string() }).parse(req.body);
    const team = teams.get(body.userId);
    if (!team) {
      reply.status(404);
      return { ok: false, error: "Team not found" };
    }
    const idx = team.picks.indexOf(body.playerId);
    if (idx === -1) {
      reply.status(400);
      return { ok: false, error: "Player not on team" };
    }
    team.picks.splice(idx, 1);
    drafted.delete(body.playerId);
    recalcTeamPoints(team);
    return { ok: true, team };
  });

  app.get("/api/team/:userId", async (req, reply) => {
    const { userId } = req.params as { userId: string };
    const team = teams.get(userId);
    if (!team) {
      reply.status(404);
      return { error: "Team not found" };
    }
    const roster = team.picks
      .map((pid) => players.find((p) => p.id === pid))
      .filter(Boolean) as Player[];
    const items = roster.map((p) => ({
      id: p.id,
      name: p.name,
      position: p.position,
      team: p.team,
      stats: p.stats,
      points: scoreStats(p.stats)
    }));
    return { userId, teamName: team.name, totalPoints: team.points, players: items };
  });
}
