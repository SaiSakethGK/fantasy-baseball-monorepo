// src/server.ts
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { join } from "node:path";
import { existsSync } from "node:fs";
import playersRoutes from "./routes/players.js";
import draftRoutes from "./routes/draft.js";
import { topPlayersByPoints } from "./routes/scoring.js";

const app = Fastify({ logger: true });

// Allow requests from my Vite dev server
await app.register(cors, { origin: true });

// Optional static files
const staticRoot = join(process.cwd(), "public");
if (existsSync(staticRoot)) {
  await app.register(fastifyStatic, {
    root: staticRoot,
    prefix: "/public/",
  });
} else {
  app.log.warn(`Static root "${staticRoot}" does not exist; skipping @fastify/static`);
}

// API routes
await app.register(playersRoutes);
await app.register(draftRoutes);

app.get("/api/health", async () => ({ ok: true }));

// Scoring preview — uses /api/players + shared scoring
app.get("/api/scoring/top", async (req, reply) => {
  try {
    const playersResp = await app.inject({ method: "GET", url: "/api/players" });
    if (playersResp.statusCode !== 200) {
      req.log.error({ status: playersResp.statusCode }, "Failed to load players");
      return reply.code(500).send({ error: "Failed to load players" });
    }
    const players = playersResp.json() as any[];
    return topPlayersByPoints(players, 5);
  } catch (err) {
    req.log.error({ err }, "Error computing top scoring players");
    return reply.code(500).send({ error: "Internal error" });
  }
});

// IMPORTANT: use 3001 for API to avoid clashing with Vite (5174)
const port = Number(process.env.PORT ?? 3001);
app.listen({ port, host: "0.0.0.0" }).then(() => {
  app.log.info(`API listening on http://localhost:${port}`);
});
