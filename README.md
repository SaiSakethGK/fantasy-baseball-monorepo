# Fantasy Baseball WebAPP

**Author:** Saketh

**Date:** October 29, 2025

## 1. Objective

Implemented a working fantasy baseball draft demo.

* A pnpm monorepo with a **Fastify (Node.js/TypeScript)** API (`apps/api`) and a **React/Vite/TypeScript** web app (`apps/web`).
* A reproducible local run and minimal configuration.
* A short but complete system architecture and scaling discussion mapping to real draft-day concurrency concerns.
* Other features implemented (queue-aware auto-pick, Draft Settings UI, notifications, suggested picks).

---

## 2. Repository Layout and Tech Stack

**Monorepo structure**

```
fantasy-baseball-monorepo/
├─ apps/
│  ├─ api/            # Fastify + TypeScript backend
│  └─ web/            # React + Vite + TypeScript frontend
├─ package.json       # workspace scripts
├─ pnpm-workspace.yaml
└─ README.md
```

**Backend (apps/api)**

* **Fastify 5 (TypeScript)**: low overhead, schema-first, fast routing.
* **Zod**: request validation and safe typing.
* **@fastify/cors, @fastify/static**: CORS + static files (for tones/notification sounds, optional assets).
* **In-memory state**: draft, teams, queues, and picks (simple and deterministic for the exercise).
* **Single source of truth for scoring**: `src/routes/scoring.ts`.

**Frontend (apps/web)**

* **React 18 + TypeScript + Vite**.
* **Tailwind + shadcn/ui + Radix primitives** for accessible, consistent UI.
* **Polling** for leaderboard/draft state (upgrade path to WebSocket planned).
* **Draft Settings UI** to mutate timers, auto-pick strategy, and roster limits in real time.

**Tooling**

* **pnpm workspaces** for deterministic installs across apps.
* **tsx** for fast TypeScript dev on the backend.
* **concurrently** to run API and Web together.

**Why I chose Fastify over FastAPI or others**

* I wanted **end-to-end TypeScript** (shared models and strict client/server types).
* Fastify’s performance and plugin ecosystem are a good fit for **low-latency, event-driven** draft logic (timers, picks).
* Node’s non-blocking runtime maps well to countdowns and auto-pick tasks.

---

## 3. Setup and Run

### Prerequisites

* Node.js ≥ 20.11
* pnpm ≥ 9.10.0

### Install

```bash
git clone https://github.com/SaiSakethGK/fantasy-baseball-monorepo.git

cd fantasy-baseball-monorepo

pnpm install --frozen-lockfile
```

### Configure Web → API base URL

Create `apps/web/.env.local`:

```
VITE_API_BASE=http://localhost:3001
```

### Start

```bash
pnpm dev
```

* API: `http://localhost:3001`
* Web: `http://localhost:5173`

To run individually:

```bash
pnpm --filter @fantasy-baseball/api dev
pnpm --filter @fantasy-baseball/web dev
```

---

## 4. Initialization and Test Commands

I expose an endpoint to initialize a league with team identities and draft order. The system calculates default rounds automatically based on player pool size and team count.

**Initialize league (minimum required payload only):**

```bash
curl -X POST http://localhost:3001/api/league/init \
  -H "Content-Type: application/json" \
  -d '{
    "teams":[
      {"userId":"u1","name":"Saketh"},
      {"userId":"u2","name":"Alice"},
      {"userId":"u3","name":"Bob"},
      {"userId":"u4","name":"Chandra"}
    ],
    "rounds":6,
    "pickSeconds":15,
    "autoPick":true,
    "enforceLimits":true,
    "positionLimits":{"C":1,"1B":1,"2B":1,"3B":1,"SS":1,"OF":2,"SP":1,"RP":1,"UT":1},
    "allowRemoveAnytime":true
  }'
```

> **Note**: We do **not** need to pass `rounds`, `pickSeconds`, `autoPick`, `enforceLimits`, `positionLimits`, or `allowRemoveAnytime` here.
> These are configurable from the **Draft Settings** panel in the UI, which updates server state dynamically. So we can just run the below command.
```bash
curl -X POST http://localhost:3001/api/league/init \
  -H "Content-Type: application/json" \
  -d '{
    "teams":[
      {"userId":"u1","name":"Saketh"},
      {"userId":"u2","name":"Alice"},
      {"userId":"u3","name":"Bob"},
      {"userId":"u4","name":"Chandra"}
    ]
  }'
```

**Read current team, leaderboard, and projected top players:**

```bash
curl http://localhost:3001/api/team/u1
curl http://localhost:3001/api/teams
curl http://localhost:3001/api/scoring/top
```

---

## 5. Exercise 1 — Fantasy Draft Demo

### 5.1 Display a list of 20 players with basic stats

* Created a local dataset at `apps/api/src/data/players.json`.
* The backend exposes `GET /api/players`.
* The web app lists players with position, team, ADP (derived index), and **projected points** (scoring function applied).

### 5.2 Users can add/remove players to their team

* **Add (draft)** via `POST /api/draft/pick { userId, playerId }`.
* **Remove** via `POST /api/draft/remove { userId, playerId }`.
  I expose a toggle (`allowRemoveAnytime`) in Draft Settings to permit removal only on our turn or at any time.

### 5.3 Notify users and enforce auto-draft on timer expiration

* The server maintains `pickEndsAt` and `pickSeconds`.
* On tick (`POST /api/draft/tick`, called by the UI loop), if time elapses:

  * If **autoPick** is enabled, I draft from the user’s **queue** first, otherwise pick the **best available** by projected points.
  * If autoPick is disabled, I mark the turn as **SKIPPED**.
* The UI shows a live countdown and inline status messages (on the clock, auto-drafted, skipped).
  I also ship notification sound and (if allowed) a browser notification.

### 5.4 Prevent drafting the same player twice

* I maintain a global `drafted` set; attempts to pick a drafted player return `400` with a clear error string.
* I also guard against a team drafting the same player twice.

### 5.5 Backend in-memory or persistent

* Implemented an **in-memory backend** for the demo, also it's fast, and simple for review.
* The state is structured to migrate to Redis/PostgreSQL.

### 5.6 Optional bonus implemented

* **Leaderboard** (`GET /api/teams`) with periodic polling on the UI.
* **Draft rules enforcement** with **position limits** (default constraints, configurable in Draft Settings).
* UI disables draft buttons when a position limit would be violated.

---

## 6. Exercise 2 — Live Coding / Logic Test

### 6.1 Scenario A — Scoring Function

Calculate team total points and return top 5 players by points.

* I centralize scoring in **`apps/api/src/routes/scoring.ts`**:

  * `scoreStats(stats)` → numeric score, rounded to 2 decimals.
  * `calcTeamPoints(players)` → team sum.
  * `topPlayersByPoints(players, n)` → top `n` ranked.
* I expose **`GET /api/scoring/top`** which reads `/api/players`, applies `topPlayersByPoints`, and returns top 5.

**Scoring details**

* **Batters**: `HR×4 + RBI×1 + R×1 + SB×2 + AVG×10`
* **Pitchers**: `W×5 + SV×5 + K×1 + max(0, 4.0−ERA)×2 + max(0, 1.3−WHIP)×5`
* Rationale: positive weights for production; pitcher run-prevention recognized by bonuses below thresholds (does not penalize beyond zero).

### 6.2 Scenario B — API Design

Endpoint to retrieve a user’s drafted team and current points; handle missing stats or traded players.

* **Endpoint**: `GET /api/team/:userId` returns:

  * `teamName`, `totalPoints`, and `players` with `{id,name,team,position,stats,points,status}`.
  * If a stored player id is not in the current dataset (e.g., missing), I return a placeholder:

    ```
    { id: <pid>, name: "(Traded/Unknown Player)", position: "UT", team: "—", stats: {}, points: 0, status: "UNKNOWN" }
    ```
  * This keeps the contract stable even when data is partially missing.

### 6.3 Scenario C — Bug Fix

**I faced the similar bug during the development**. Draft UI adds a player, but points didn't update.

1. To fix this, I vVerified that `/api/draft/pick` appended to the roster but did not recompute totals.
2. Add **`recalcTeamPoints(team)`** immediately after state mutation.
3. In the UI, after a pick/remove, I **refetch `/api/team/:userId`** and re-compute displayed totals.
4. Confirmed leaderboard reflects changes due to periodic `/api/teams` polling.

---

## 7. Exercise 3 — System Design (hundreds of concurrent users)

I treat the draft as a **state machine** with time-bound transitions and idempotent pick events. For real traffic:

**Backend**

* **Stateless Fastify replicas** behind ALB/Nginx.
* **Redis** for shared, low-latency state (draft rooms keyed by league id).
* **Pub/Sub or Redis Streams** for event fan-out (room broadcasts, pick confirmations).
* **PostgreSQL** persistence for leagues, rosters, historical events, and audits (append-only event log + materialized projections).
* **BullMQ** workers for scheduled auto-pick jobs, periodic scoring, and backfills.

**Concurrency control**

* **Version counters / optimistic concurrency** on league snapshots and pick operations.
* **Idempotent APIs** (pick endpoints accept client-generated operation ids to avoid double-applies).

**Frontend**

* **WebSockets** for room updates (join by league id); **polling** remains fallback.
* **Local optimistic UI** with server reconciliation on ack.

**Caching**

* **Redis** caches for read-heavy endpoints (leaderboard snapshots, player projections).
* **ETag/If-None-Match** for state endpoints to reduce payload size.

**Trade-offs**

* For this exercise, I keep **in-memory state** and **polling**.
* At production scale, I would shift to **event-driven** coordination with **WebSockets**, Redis, and durable storage.

---

## 8. Exercise 4 — Optional Domain Bonus

I implemented:

* **Suggested picks**: UI module ranks eligible players by projected points and surfaces the top 3.
* **Queue-aware auto-pick**: on timeout, I first honor the user’s queue order, then fall back to best available by projection.
* **Draft timer**: countdown per active pick; UI highlights low-time threshold.
* **Live leaderboard**: periodic polling updates to show team points.

Planned (not implemented here, but started implementing):

* Waivers and transactions with server-side validation and scoring deltas.
* WebSocket real-time updates instead of polling.

---

## 9. Implementation Details and Assumptions

**State structure (server)**

* `teams: Map<userId, Team>` with `picks: string[]` and `points: number`.
* `drafted: Set<playerId>` for global uniqueness.
* `draft`: runtime config and cursor (`round`, `order`, `pickIndex`, `onTheClockUserId`, `pickEndsAt`, `autoPick`).
* `queues: Map<userId, string[]>` used by auto-pick.

**Position limits**

* Default enforced in `draft.positionLimits` (C, 1B, 2B, 3B, SS, OF, SP, RP, UT).
* Can be set to `0` (unlimited) or any positive integer.
* UI arms/disarms draft button depending on team composition versus limits.

**Timer**

* Server is authoritative.
* `POST /api/draft/tick` advances time; if my user is not on the clock, I fast-forward CPU draft picks for bots/others until my turn (for demo purposes).
* This produces deterministic demo behavior and avoids client-side cheating.

**Scoring**

* Backed by a single function used for both **top-N scoring** and **team totals**, ensuring consistency.

**Error handling**

* Inputs validated with Zod; errors returned with clear messages (e.g., “Player already drafted”, “Position limit reached: max 1 C”).

---

## 10. API Reference (selected)

* `GET  /api/players` — Player list (subset for demo)
* `POST /api/league/init` — Initialize a league

  * Body: `{ teams: Array<{ userId:string, name:string }>, ...(optional settings) }`
* `POST /api/draft/tick` — Advance the draft clock and potentially trigger auto-picks
* `POST /api/draft/pick` — Make a pick: `{ userId, playerId }`
* `POST /api/draft/remove` — Remove a pick: `{ userId, playerId }`
* `POST /api/draft/settings` — Update timer/limits/flags from the UI
* `POST /api/draft/reset` — Reset all picks and restart draft at pick #1
* `POST /api/draft/resetTeam` — Reset a specific user’s team: `{ userId }`
* `GET  /api/team/:userId` — Team composition and total points
* `GET  /api/teams` — Leaderboard snapshot
* `GET  /api/scoring/top` — Top 5 projected players

---

## 11. Working on

* Replacing polling with **WebSockets** for real-time updates.
* Persist events and rosters in **PostgreSQL**; share state via **Redis**.
* Authentication/authorization for multi-user leagues.
* Unit/integration tests (Jest, Supertest) and E2E flows (Playwright).
* Containerization (Docker) and CI/CD (GitHub Actions).

---
