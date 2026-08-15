# Build stage
FROM node:20-bullseye AS build
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace manifests first for better cache (lockfile + workspace config)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./

# Copy the full repository so workspace package.json files are present
COPY . .

# Install all workspace deps (after workspace files are present)
RUN pnpm install --frozen-lockfile

# Build frontend
WORKDIR /app/artifacts/property-lo
RUN pnpm run build

# Build backend
WORKDIR /app/artifacts/api-server
RUN pnpm run build

# Production image
FROM node:20-bullseye AS prod
WORKDIR /app
ENV NODE_ENV=production

# Copy backend dist and frontend dist into backend dist/public
COPY --from=build /app/artifacts/api-server/dist ./dist
COPY --from=build /app/artifacts/property-lo/dist ./dist/public

# Copy backend package.json and install production deps (use npm for prod install)
COPY artifacts/api-server/package.json ./package.json
RUN npm install --only=production

EXPOSE 10000
ENV PORT=10000

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
