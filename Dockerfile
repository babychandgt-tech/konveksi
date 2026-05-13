FROM node:20-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

# Copy workspace config first (layer cache for install)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy all workspace package.json files so pnpm can resolve the graph
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-spec/package.json        ./lib/api-spec/
COPY lib/api-zod/package.json         ./lib/api-zod/
COPY lib/db/package.json              ./lib/db/
COPY scripts/package.json             ./scripts/
COPY artifacts/vanny-konveksi/package.json  ./artifacts/vanny-konveksi/
COPY artifacts/api-server/package.json      ./artifacts/api-server/
COPY artifacts/mockup-sandbox/package.json  ./artifacts/mockup-sandbox/

RUN pnpm install --frozen-lockfile

# Copy full source after install
COPY . .

RUN PORT=3000 BASE_PATH=/ pnpm --filter @workspace/vanny-konveksi run build && \
    pnpm --filter @workspace/api-server run build

ENV NODE_ENV=production

CMD ["pnpm", "run", "start"]
