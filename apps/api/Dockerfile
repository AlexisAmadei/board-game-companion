# Build context is the REPO ROOT (see docker-compose.yml / Dokploy settings),
# so the pnpm lockfile and workspace manifest are reachable.
# pg is pure JS, so unlike better-sqlite3 there is no C++ toolchain to install.
FROM node:22-bookworm-slim AS build
ENV PNPM_HOME=/pnpm
ENV PATH="/pnpm:$PATH"
RUN corepack enable
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @board-game-companion/api

COPY apps/api ./apps/api
# pnpm's node_modules is a tree of symlinks into a content-addressed store and
# cannot be COPY'd across stages. `pnpm deploy` materialises a self-contained
# directory of real files. --legacy because the API has no workspace deps to
# inject, which is what pnpm 11 otherwise expects here.
RUN pnpm deploy --legacy --filter=@board-game-companion/api --prod /prod/api

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

COPY --from=build /prod/api ./

USER node
EXPOSE 3001

# The slim image has no curl; Node 22 has a global fetch.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/index.js"]
