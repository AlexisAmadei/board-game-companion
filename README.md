# Board game companion - React App

## Overview

This is a digital implementation of the popular board game **Secret H**, built using **React**. The app allows players to vote digitally instead of using physical game cards, reducing delays and improving game flow. The purpose of the app is NOT to replace the real game but to streamline the voting process.

#### Create a new game at:

[https://secret-h-companion.web.app](https://secret-h-companion.web.app)

- Enter a unique game code to create or join a room.
- At least one device should function as the "host" to display game progress and manage the voting phase. For better visibility, a TV or laptop screen is recommended.
- The voting interface is optimized for mobile devices, while the host display is best viewed on a larger screen.

## Features

- **Multiplayer support**: Play online with friends.
- **Voting system**: Elect governments and pass policies.
- **UI**: follows the design of the real game

## Tech Stack

- **Monorepo**: [Turborepo](https://turbo.build/) with npm workspaces
- **Frontend** (`apps/web`): React 18 + Vite — deployed on **Vercel**
- **Backend** (`apps/api`): Express + SQLite (`better-sqlite3`), real-time via
  Server-Sent Events — runs in a **Docker** container on a custom VPS

## Project structure

```
.
├── apps/
│   ├── web/   # React + Vite frontend (Vercel)
│   └── api/   # Express + SQLite backend (Docker / VPS)
├── docker-compose.yml
├── turbo.json
└── package.json   # npm workspaces root
```

## Local development

```sh
npm install            # install all workspaces

# Backend (http://localhost:3001)
cp apps/api/.env.example apps/api/.env
npm run dev --workspace=@board-game-companion/api

# Frontend (http://localhost:5173)
cp apps/web/.env.example apps/web/.env   # VITE_API_URL=http://localhost:3001
npm run dev --workspace=@board-game-companion/web

# …or run everything at once
npm run dev            # turbo runs every app's dev task
```

### API overview

The backend exposes a small REST API under `/api/rooms` plus an SSE stream
(`GET /api/rooms/:id/events`) that pushes the full room state on every change —
the replacement for Firestore's `onSnapshot`. Each room is stored as a JSON blob
in SQLite. Rooms older than 48h are purged hourly by the server.

## Deployment

### Frontend → Vercel

Point the Vercel project's **Root Directory** at `apps/web` (Vercel detects the
Turborepo automatically). Set the environment variable `VITE_API_URL` to the
public URL of your backend (e.g. `https://api.yourdomain.com`).

### Backend → Docker on a VPS

```sh
# build & run with the provided compose file
CORS_ORIGIN=https://your-app.vercel.app docker compose up -d --build
```

The SQLite database is persisted on the `api-data` Docker volume. Configure
`CORS_ORIGIN` (comma-separated allowlist) so only the Vercel frontend can call
the API, and put the container behind a reverse proxy (nginx/Caddy/Traefik) for
TLS.

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

