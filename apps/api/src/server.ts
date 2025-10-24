import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { join } from "node:path";
import playersRoutes from "./routes/players.js";
import draftRoutes from "./routes/draft.js";
import { topPlayersByPoints } from "./routes/scoring.js";
import { readFileSync } from "node:fs";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(fastifyStatic, { root: join(process.cwd(), "public") });

await app.register(playersRoutes);
await app.register(draftRoutes);

// Exercise 2A demo endpoint
app.get("/api/scoring/top", async () => {
  const players = JSON.parse(readFileSync(join(process.cwd(), "src", "data", "players.json"), "utf-8"));
  return topPlayersByPoints(players, 5);
});

const port = Number(process.env.PORT ?? 5174);
app.listen({ port, host: "0.0.0.0" }).then(() => {
  app.log.info(`API listening on http://localhost:${port}`);
});
