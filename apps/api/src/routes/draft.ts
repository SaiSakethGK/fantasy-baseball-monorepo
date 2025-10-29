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

const queues = new Map<string, string[]>();
const DEFAULT_SECONDS = 20;
const DEFAULT_ROUNDS = 15;

const DEFAULT_POSITION_LIMITS: Record<string, number> = {
  C: 1,
  "1B": 1,
  "2B": 1,
  "3B": 1,
  SS: 1,
  OF: 3,
  SP: 2,
  RP: 1,
  UT: 2,
};

type DraftEvent =
  | { type: "PICK"; userId: string; player: { id: string; name: string; team: string; position: string } }
  | { type: "AUTOPICK"; userId: string; player: { id: string; name: string; team: string; position: string } }
  | { type: "SKIPPED"; userId: string };

type DraftRuntime = DraftState & {
  round: number;
  pickIndex: number;
  dir: 1 | -1;
  totalRounds: number;
  humanUserId?: string;
  lastEvent?: DraftEvent;

  enforceLimits: boolean;
  positionLimits: Record<string, number>;

  allowRemoveAnytime: boolean;
};

const draft: DraftRuntime = {
  isActive: true,
  onTheClockUserId: "u1",
  pickSeconds: DEFAULT_SECONDS,
  pickEndsAt: Date.now() + DEFAULT_SECONDS * 1000,
  order: ["u1"],
  autoPick: true,

  round: 1,
  pickIndex: 0,
  dir: 1,
  totalRounds: DEFAULT_ROUNDS,

  lastEvent: undefined,

  enforceLimits: true,
  positionLimits: { ...DEFAULT_POSITION_LIMITS },

  allowRemoveAnytime: true,
};

function recalcTeamPoints(team: Team) {
  let total = 0;
  for (const pid of team.picks) {
    const p = players.find((pp) => pp.id === pid);
    if (p) total += scoreStats(p.stats);
  }
  team.points = Math.round(total * 100) / 100;
}

function ensureTeam(userId: string, name?: string): Team {
  const existing = teams.get(userId);
  if (existing) return existing;
  const team = { userId, name: name ?? "Team " + userId, picks: [], points: 0 };
  teams.set(userId, team);
  if (!queues.has(userId)) queues.set(userId, []);
  return team;
}

function countPositionsOnTeam(team: Team) {
  const counts: Record<string, number> = {};
  for (const pid of team.picks) {
    const p = players.find(pp => pp.id === pid);
    if (!p) continue;
    counts[p.position] = (counts[p.position] ?? 0) + 1;
  }
  return counts;
}

/** Returns error string if a pick violates limits; null when allowed. */
function violatesPositionLimits(team: Team, playerId: string): string | null {
  if (!draft.enforceLimits) return null;
  const player = players.find(p => p.id === playerId);
  if (!player) return "Player not found";
  const rawLimit = draft.positionLimits[player.position];
  if (typeof rawLimit !== "number" || rawLimit <= 0) return null;
  const counts = countPositionsOnTeam(team);
  const current = counts[player.position] ?? 0;
  if (current >= rawLimit) {
    return `Position limit reached: max ${rawLimit} ${player.position}`;
  }
  return null;
}

function setLastEvent(ev: DraftEvent | undefined) {
  draft.lastEvent = ev;
}

function nextOnTheClock() {
  draft.pickIndex += draft.dir;

  if (draft.pickIndex < 0 || draft.pickIndex >= draft.order.length) {
    draft.round += 1;
    if (draft.round > draft.totalRounds) {
      draft.isActive = false;
      draft.onTheClockUserId = undefined;
      draft.pickEndsAt = undefined;
      setLastEvent(undefined);
      return;
    }
    draft.dir = (draft.dir * -1) as 1 | -1;
    draft.pickIndex = draft.dir === 1 ? 0 : draft.order.length - 1;
  }

  draft.onTheClockUserId = draft.order[draft.pickIndex];
  draft.pickEndsAt = Date.now() + draft.pickSeconds * 1000;
}

function removeFromAllQueues(playerId: string) {
  for (const [uid, q] of queues.entries()) {
    const filtered = q.filter(id => id !== playerId);
    if (filtered.length !== q.length) queues.set(uid, filtered);
  }
}

function sanitizeQueueList(list: string[]) {
  const seen = new Set<string>();
  const valid = new Set(players.map(p => p.id));
  const out: string[] = [];
  for (const id of list) {
    if (!valid.has(id)) continue;
    if (seen.has(id)) continue;
    if (drafted.has(id)) continue; // already taken
    seen.add(id);
    out.push(id);
  }
  return out;
}

function autoPickFor(userId: string) {
  const team = ensureTeam(userId);

  // 1) Try user's queue, in order
  const q = queues.get(userId) ?? [];
  for (const pid of q) {
    if (drafted.has(pid)) continue;
    const violation = violatesPositionLimits(team, pid);
    if (violation) continue;
    const p = players.find(x => x.id === pid)!;
    // perform pick from queue
    pickPlayer(userId, pid, /*enforceClock*/ false, /*eventType*/ "AUTOPICK", {
      id: p.id, name: p.name, team: p.team, position: p.position
    });
    return;
  }

  // 2) Fallback to best available by score
  const available = players.filter((p) => !drafted.has(p.id));
  if (available.length === 0) return;
  const best = available
    .map((p) => ({ id: p.id, name: p.name, team: p.team, position: p.position, pts: scoreStats(p.stats) }))
    .sort((a, b) => b.pts - a.pts)
    .find(c => !violatesPositionLimits(team, c.id));
  if (!best) return;
  pickPlayer(userId, best.id, /*enforceClock*/ false, "AUTOPICK", best);
}

function fastForwardUntilHuman(maxSteps = 500) {
  let steps = 0;
  while (
    draft.isActive &&
    draft.humanUserId &&
    draft.onTheClockUserId &&
    draft.onTheClockUserId !== draft.humanUserId &&
    steps < maxSteps
  ) {
    autoPickFor(draft.onTheClockUserId);
    steps++;
  }
  if (draft.isActive && draft.humanUserId && draft.onTheClockUserId === draft.humanUserId) {
    draft.pickEndsAt = Date.now() + draft.pickSeconds * 1000;
  }
}

function pickPlayer(
  userId: string,
  playerId: string,
  enforceClock = true,
  eventType: "PICK" | "AUTOPICK" = "PICK",
  knownPlayer?: { id: string; name: string; team: string; position: string }
) {
  if (enforceClock) {
    if (!draft.onTheClockUserId || userId !== draft.onTheClockUserId) {
      throw new Error("Not your turn");
    }
  }
  if (drafted.has(playerId)) throw new Error("Player already drafted");
  const team = ensureTeam(userId);
  if (team.picks.includes(playerId)) throw new Error("Cannot draft same player twice");

  const violation = violatesPositionLimits(team, playerId);
  if (violation) throw new Error(violation);

  team.picks.push(playerId);
  drafted.add(playerId);
  recalcTeamPoints(team);

  // Remove from queues (all users) when drafted
  removeFromAllQueues(playerId);

  const p = knownPlayer ?? players.find(x => x.id === playerId);
  if (p) {
    setLastEvent({
      type: eventType,
      userId,
      player: { id: p.id, name: p.name, team: p.team, position: p.position }
    });
  } else {
    setLastEvent(undefined);
  }

  nextOnTheClock();

  if (draft.humanUserId) {
    fastForwardUntilHuman();
  }
}

/** Sorted snapshot used by /api/teams and for client rendering */
export function getTeamsSnapshot() {
  return Array.from(teams.values())
    .map((t) => ({
      userId: t.userId,
      name: t.name,
      points: t.points,
    }))
    .sort((a, b) => b.points - a.points);
}

/** Always return a consistent draft snapshot including global drafted IDs */
function getDraftSnapshot() {
  return {
    ...draft,
    draftedIds: Array.from(drafted),
  };
}

export default async function draftRoutes(app: FastifyInstance) {
  // --- Initialize league
  app.post("/api/league/init", async (req, reply) => {
    const body = z.object({
      teams: z.array(z.object({
        userId: z.string(),
        name: z.string().min(1),
      })).min(2),
      rounds: z.number().int().min(1).max(40).optional(),
      pickSeconds: z.number().int().min(5).max(600).optional(),
      autoPick: z.boolean().optional(),
      enforceLimits: z.boolean().optional(),
      positionLimits: z.record(z.string(), z.number().int().min(0).max(20)).optional(),
      allowRemoveAnytime: z.boolean().optional(),
    }).parse(req.body);

    teams.clear();
    drafted.clear();
    queues.clear();

    for (const t of body.teams) ensureTeam(t.userId, t.name);

    const numTeams = body.teams.length;
    const totalPlayers = players.length;
    const autoRounds =
      numTeams > 0
        ? Math.max(1, Math.min(40, Math.floor(totalPlayers / numTeams)))
        : DEFAULT_ROUNDS;

    draft.order = body.teams.map(t => t.userId);
    draft.totalRounds = typeof body.rounds === "number" ? body.rounds : autoRounds;
    draft.pickSeconds = body.pickSeconds ?? DEFAULT_SECONDS;
    draft.autoPick = body.autoPick ?? true;

    draft.enforceLimits = body.enforceLimits ?? true;
    draft.positionLimits = { ...DEFAULT_POSITION_LIMITS, ...(body.positionLimits ?? {}) };
    draft.allowRemoveAnytime = body.allowRemoveAnytime ?? true;

    draft.isActive = true;
    draft.round = 1;
    draft.dir = 1;
    draft.pickIndex = 0;
    draft.onTheClockUserId = draft.order[0];
    draft.pickEndsAt = Date.now() + draft.pickSeconds * 1000;
    draft.humanUserId = undefined;
    setLastEvent(undefined);

    return { ok: true, draft: getDraftSnapshot(), teams: getTeamsSnapshot() };
  });

  app.get("/api/draft/state", async () => getDraftSnapshot());

  app.post("/api/draft/human", async (req, reply) => {
    const body = z.object({ userId: z.string().optional() }).parse(req.body);
    if (!body.userId) {
      draft.humanUserId = undefined;
      return { ok: true, draft: getDraftSnapshot() };
    }
    if (!draft.order.includes(body.userId)) {
      reply.status(400);
      return { ok: false, error: "User not in draft order" };
    }
    draft.humanUserId = body.userId;
    if (draft.isActive) fastForwardUntilHuman();
    return { ok: true, draft: getDraftSnapshot() };
  });

  // Tick
  app.post("/api/draft/tick", async () => {
    if (!draft.isActive || !draft.onTheClockUserId) {
      return getDraftSnapshot();
    }

    if (draft.humanUserId && draft.onTheClockUserId !== draft.humanUserId) {
      fastForwardUntilHuman();
      return getDraftSnapshot();
    }

    if (draft.pickEndsAt && Date.now() >= draft.pickEndsAt) {
      const uid = draft.onTheClockUserId!;
      if (draft.autoPick) {
        autoPickFor(uid); // respects queue first
      } else {
        setLastEvent({ type: "SKIPPED", userId: uid });
        nextOnTheClock();
      }
    }
    return getDraftSnapshot();
  });

  // Pick
  app.post("/api/draft/pick", async (req, reply) => {
    const body = z.object({ userId: z.string(), playerId: z.string() }).parse(req.body);
    try {
      pickPlayer(body.userId, body.playerId, /*enforceClock*/ true, "PICK");
      return { ok: true, team: teams.get(body.userId) };
    } catch (e) {
      reply.status(400);
      return { ok: false, error: (e as Error).message };
    }
  });

  // Remove
  app.post("/api/draft/remove", async (req, reply) => {
    const body = z.object({ userId: z.string(), playerId: z.string() }).parse(req.body);

    if (!draft.allowRemoveAnytime) {
      if (!draft.onTheClockUserId || draft.onTheClockUserId !== body.userId) {
        reply.status(400);
        return { ok: false, error: "Removal allowed only on your turn" };
      }
    }

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
    setLastEvent(undefined);
    return { ok: true, team, draft: getDraftSnapshot() };
  });

  // Team snapshot
  app.get("/api/team/:userId", async (req, reply) => {
    const { userId } = req.params as { userId: string };
    const team = teams.get(userId);
    if (!team) {
      reply.status(404);
      return { error: "Team not found" };
    }

    const allPlayers: Player[] = JSON.parse(
      readFileSync(join(process.cwd(), "src", "data", "players.json"), "utf-8")
    );

    const items = team.picks.map((pid) => {
      const p = allPlayers.find((pp) => pp.id === pid);
      if (!p) {
        return {
          id: pid,
          name: "(Traded/Unknown Player)",
          position: "UT",
          team: "—",
          stats: {},
          points: 0,
          status: "UNKNOWN" as const,
        };
      }
      const points = scoreStats(p.stats || {} as any);
      return {
        id: p.id,
        name: p.name,
        position: p.position,
        team: p.team,
        stats: p.stats,
        points,
        status: "OK" as const,
      };
    });

    const totalPoints = Math.round(
      items.reduce((acc, it) => acc + (it.points || 0), 0) * 100
    ) / 100;

    return {
      userId,
      teamName: team.name,
      totalPoints,
      players: items,
    };
  });

  // All teams
  app.get("/api/teams", async () => getTeamsSnapshot());

  // Settings
  app.post("/api/draft/settings", async (req, reply) => {
    const body = z.object({
      pickSeconds: z.number().int().min(5).max(600).optional(),
      autoPick: z.boolean().optional(),
      enforceLimits: z.boolean().optional(),
      positionLimits: z.record(z.string(), z.number().int().min(0).max(20)).optional(),
      allowRemoveAnytime: z.boolean().optional(),
    }).parse(req.body);

    if (typeof body.pickSeconds === "number") {
      draft.pickSeconds = body.pickSeconds;
      if (draft.onTheClockUserId) {
        draft.pickEndsAt = Date.now() + draft.pickSeconds * 1000;
      }
    }
    if (typeof body.autoPick === "boolean") {
      draft.autoPick = body.autoPick;
    }
    if (typeof body.enforceLimits === "boolean") {
      draft.enforceLimits = body.enforceLimits;
    }
    if (body.positionLimits && Object.keys(body.positionLimits).length > 0) {
      draft.positionLimits = { ...draft.positionLimits, ...body.positionLimits };
    }
    if (typeof body.allowRemoveAnytime === "boolean") {
      draft.allowRemoveAnytime = body.allowRemoveAnytime;
    }

    return { ok: true, draft: getDraftSnapshot() };
  });

  // Reset draft
  app.post("/api/draft/reset", async () => {
    drafted.clear();
    for (const t of teams.values()) {
      t.picks = [];
      recalcTeamPoints(t);
    }
    // Keep queues; already-drafted were cleared, so queues remain valid as-is.
    draft.isActive = true;
    draft.round = 1;
    draft.dir = 1;
    draft.pickIndex = 0;
    draft.onTheClockUserId = draft.order[0];
    draft.pickEndsAt = Date.now() + draft.pickSeconds * 1000;
    setLastEvent(undefined);
    return { ok: true, draft: getDraftSnapshot(), teams: getTeamsSnapshot() };
  });

  // Reset a single team
  app.post("/api/draft/resetTeam", async (req, reply) => {
    const body = z.object({ userId: z.string() }).parse(req.body);
    const team = teams.get(body.userId);
    if (!team) {
      reply.status(404);
      return { ok: false, error: "Team not found" };
    }
    for (const pid of team.picks) drafted.delete(pid);
    team.picks = [];
    recalcTeamPoints(team);
    setLastEvent(undefined);
    return { ok: true, team, draft: getDraftSnapshot() };
  });

  // Get queue
  app.get("/api/queue/:userId", async (req, reply) => {
    const { userId } = req.params as { userId: string };
    const q = (queues.get(userId) ?? []).filter(id => !drafted.has(id));
    queues.set(userId, q); // prune any taken ones
    const expanded = q.map(id => {
      const p = players.find(pp => pp.id === id);
      if (!p) return null;
      return { id: p.id, name: p.name, team: p.team, position: p.position };
    }).filter(Boolean);
    return { userId, queue: expanded };
  });

  // Set queue (update entire order)
  app.post("/api/queue/set", async (req, reply) => {
    const body = z.object({
      userId: z.string(),
      playerIds: z.array(z.string()).max(200),
    }).parse(req.body);

    if (!teams.has(body.userId)) {
      ensureTeam(body.userId, "Team " + body.userId);
    }

    const clean = sanitizeQueueList(body.playerIds);
    queues.set(body.userId, clean);
    return { ok: true, userId: body.userId, count: clean.length };
  });
}

export { teams };
