import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { FastifyInstance } from "fastify";
import type { Player } from "../models.js";

export default async function playersRoutes(app: FastifyInstance) {
  app.get("/api/players", async () => {
    const file = join(process.cwd(), "src", "data", "players.json");
    const players = JSON.parse(readFileSync(file, "utf-8")) as Player[];
    return players;
  });
}
