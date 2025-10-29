import type { FastifyInstance } from "fastify";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Player } from "../models.js";

/** Local JSON players loader. capped - 50 */
function readLocalPlayers(): Player[] {
  try {
    const all: Player[] = JSON.parse(
      readFileSync(join(process.cwd(), "src", "data", "players.json"), "utf-8")
    );
    return all.slice(0, 50);
  } catch {
    return [];
  }
}

export default async function playersRoutes(app: FastifyInstance) {
  app.get("/api/players", async () => {
    return readLocalPlayers();
  });

  app.get("/api/players/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const all = readLocalPlayers();
    const found = all.find((p) => String(p.id) === String(id));
    if (!found) {
      reply.status(404);
      return { error: "Player not found" };
    }
    return found;
  });
}
