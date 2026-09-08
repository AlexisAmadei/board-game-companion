# Board game companion - React App

## Overview

This is a digital implementation of the popular board game **Secret H**, built using **React**. The app allows players to vote digitally instead of using physical game cards, reducing delays and improving game flow. The purpose of the app is NOT to replace the real game but to streamline the voting process.

#### Create a new game at:

Deploy your own: the frontend runs on Vercel and the backend on any Docker host
(see [Deployment](#deployment)).

- Enter a unique game code to create or join a room.
- At least one device should function as the "host" to display game progress and manage the voting phase. For better visibility, a TV or laptop screen is recommended.
- The voting interface is optimized for mobile devices, while the host display is best viewed on a larger screen.

## Features

- **Multiplayer support**: Play online with friends.
- **Voting system**: Elect governments and pass policies.
- **UI**: follows the design of the real game

## Tech Stack

- **Monorepo**: [Turborepo](https://turbo.build/) with pnpm workspaces
- **Frontend** (`apps/web`): React 18 + Vite, deployed on **Vercel**
- **Backend** (`apps/api`): Express + PostgreSQL (`pg`), real-time via
  Server-Sent Events, running in a **Docker** container on **Dokploy**

## Project structure

```
.
├── apps/
│   ├── web/   # React + Vite frontend (Vercel)
│   └── api/   # Express + PostgreSQL backend (Docker / Dokploy)
│       ├── migrations/   # numbered .sql files, applied at boot
│       └── src/
│           ├── repositories/  # all SQL lives here
│           └── routes/        # HTTP layer only
├── docker-compose.yml   # local Postgres + API
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Local development

Requires **pnpm** (`corepack enable`) and **Node >= 22.9**.

```sh
pnpm install           # install all workspaces

# Postgres (Docker)
docker compose up -d db

# Backend (http://localhost:3001) - migrations run automatically at boot
cp apps/api/.env.example apps/api/.env
pnpm --filter @board-game-companion/api dev

# Frontend (http://localhost:5173)
cp apps/web/.env.example apps/web/.env   # VITE_API_URL=http://localhost:3001
pnpm --filter @board-game-companion/web dev

# …or run everything at once
pnpm dev               # turbo runs every app's dev task
```

Migrations can also be applied on their own:

```sh
pnpm migrate
```

To add a schema change, drop a new numbered file in `apps/api/migrations/`
(e.g. `002_add_thing.sql`). They are applied in filename order, exactly once,
tracked in the `schema_migrations` table and guarded by a Postgres advisory
lock so two booting containers cannot race.

### API overview

The backend exposes a small REST API under `/api/rooms` plus an SSE stream
(`GET /api/rooms/:id/events`) that pushes the full room state on every change.
Every endpoint returns that same full room document, so the client never has to
merge partial updates.

State is normalized across `rooms`, `players`, `messages`, `voting_phases` and
`votes`, and the response document is reassembled in a single query. The
uniqueness rules the API reports as `409` are enforced by database constraints
rather than by application checks, so simultaneous joins and votes cannot lose
writes. Rooms older than `ROOM_TTL_HOURS` (default 48) are purged hourly, and
`ON DELETE CASCADE` sweeps everything belonging to them.

Starting a voting phase inserts a *new* phase row rather than deleting votes, so
the reset is atomic and the previous round stays on disk but out of view.

> The SSE subscriber registry is in-process, so the API must run as a **single
> replica**. See the Dokploy notes below.

## Deployment

### Frontend → Vercel

Point the Vercel project's **Root Directory** at `apps/web` (Vercel detects the
Turborepo and the pnpm lockfile automatically). Set `VITE_API_URL` to the public
URL of your backend, e.g. `https://api.yourdomain.com`.

### Backend → Dokploy

Create **two objects in the same Dokploy project**.

**1. The database.** *Create Service → Database → PostgreSQL*. Pin the image
(e.g. `postgres:17`) rather than taking the floating default, and set an
**alphanumeric** password: Dokploy permits `@ : # % ?`, which would corrupt a
connection URL. Deploy it, then copy the **Internal Connection URL** from its
page.

> Dokploy appends a random suffix to the app name you type (`bgc-db` becomes
> something like `bgc-db-a1b2c3`), so read the hostname off the dashboard
> instead of assuming it.

Leave the **External Port** unset so the database stays unreachable from the
internet. Verify with:

```sh
docker service inspect <db-app-name> --format '{{json .Endpoint.Ports}}'
```

**2. The API.** *Create Service → Application*, from this Git repo:

| Setting | Value |
| --- | --- |
| Build Type | `Dockerfile` |
| Dockerfile Path | `apps/api/Dockerfile` |
| Docker Context Path | `.` (the repo root, so the pnpm lockfile is reachable) |

Environment:

```sh
NODE_ENV=production
PORT=3001
DATABASE_URL=<the database's Internal Connection URL>
CORS_ORIGIN=https://your-app.vercel.app
ROOM_TTL_HOURS=48
```

Both objects sit on `dokploy-network`, so the API reaches Postgres by its
internal service name. Never use `localhost` or the server's public IP.

Add a **Domain** on container port `3001`; Traefik terminates TLS and issues the
certificate. Do not enable a compression middleware on it, since gzip over
`text/event-stream` buffers and breaks SSE. The 25s heartbeat comfortably
outpaces Traefik's 180s idle timeout.

#### Required Swarm settings

Dokploy applications default to `Order: "start-first"`, which briefly runs two
containers during a deploy. **That breaks this app**: the SSE registry is
in-process, so clients pinned to the old container would silently miss every
mutation landing on the new one. Under *Advanced → Cluster/Swarm Settings* set:

- **Replicas**: `1`
- **Update Config**:
  ```json
  { "Parallelism": 1, "Order": "stop-first", "FailureAction": "rollback" }
  ```
- **Stop Grace Period**: at least `15s`, so the SIGTERM handler can drain.

`stop-first` costs a few seconds of downtime per deploy; `EventSource`
reconnects on its own, so players see nothing.

Migrations run at boot. A failure exits non-zero, the healthcheck fails, and
Dokploy rolls the deploy back.

### Backend → plain Docker

The bundled compose file runs Postgres and the API together:

```sh
CORS_ORIGIN=https://your-app.vercel.app docker compose up -d --build
```

Put the container behind a reverse proxy (nginx/Caddy/Traefik) for TLS.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`feature-branch`):
   ```sh
   git checkout -b feature-branch
   ```
3. Commit your changes:
   ```sh
   git commit -m "Add new feature"
   ```
4. Push to your forked repository:
   ```sh
   git push origin feature-branch
   ```
5. Open a **Pull Request**.

## Contact

For issues or suggestions, feel free to open an issue on GitHub or reach out via email at [kiwi.dev2024@gmail.com](mailto\:kiwi.dev2024@gmail.com).

## Acknowledgment

We would like to express our gratitude to the creators of the **Secret H** board game for their brilliant design and engaging gameplay, which inspired this digital adaptation. **Secret H** is a trademark of Goat, Wolf, & Cabbage LLC. This project is an unofficial companion app and is not affiliated with, endorsed by, or associated with the official **Secret H** board game or its creators in any way. All rights to the original game, including its mechanics, design, and branding, remain with Goat, Wolf, & Cabbage LLC.

