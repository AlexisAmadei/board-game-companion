# --- build stage: compile better-sqlite3 native bindings ---
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Toolchain required to build better-sqlite3 from source.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --omit=dev

# --- runtime stage ---
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
# Persisted on a Docker volume; see docker-compose.yml.
ENV DATABASE_PATH=/data/app.db

COPY --from=build /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

RUN mkdir -p /data
EXPOSE 3001
CMD ["node", "src/index.js"]
