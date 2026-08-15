# Deployment to Render — Property-Lo

This document explains how the Render configuration in branch `render-deploy` builds and runs both the Vite frontend and the Express TypeScript backend as a single Docker-based web service.

Files added in this branch:
- `Dockerfile` — multi-stage image that installs pnpm, builds the Vite frontend, runs the backend esbuild script, copies frontend dist into backend `dist/public`, and runs the backend.
- `.dockerignore` — excludes node_modules, dist, and common artifacts.
- `artifacts/api-server/src/app.ts` — patched to serve the built frontend from `dist/public` with an SPA fallback.
- `render.yaml` — Render service definition (this file).

Required environment variables (set these in Render -> Service -> Environment):
- SUPABASE_URL — e.g. `https://your-project.supabase.co` (your project URL)
- SUPABASE_SERVICE_ROLE_KEY — Supabase service role key (server-side key used to create buckets)
- DATABASE_URL — Postgres connection string (if you use Postgres / Drizzle)
- JWT_SECRET — secret used by the server for signing/verifying JWTs
- Any other third-party secrets your app expects (email provider keys, Sentry DSN, etc.)

Note: The backend requires `process.env.PORT` at runtime. Render sets `PORT` automatically for web services; you do not need to set it manually.

How to create the Render service (one-time)
1. Go to https://dashboard.render.com and click "New" -> "Web Service".
2. Connect your GitHub account and select repository: `CreatorLet/Property-Lo`.
3. Set the branch to `render-deploy`.
4. Environment: Docker.
5. Dockerfile Path: `./Dockerfile`.
6. Leave Build & Start commands blank (the Dockerfile builds and runs the app).
7. Create the service. After creating, add the required environment variables listed above.

Local testing with Docker (recommended before deploying)
1. Build the image:
   docker build -t property-lo:render-deploy -f Dockerfile .
2. Run the container (replace placeholders with real secrets):
   docker run --rm -p 10000:10000 \
     -e PORT=10000 \
     -e SUPABASE_URL="https://ygzxtyngewakdkrtijwr.supabase.co" \
     -e SUPABASE_SERVICE_ROLE_KEY="<service-role-key>" \
     -e DATABASE_URL="postgres://user:pass@host:5432/db" \
     -e JWT_SECRET="your-secret" \
     property-lo:render-deploy
3. Open http://localhost:10000
   - API routes: `/api/...`
   - Frontend: non-API routes should serve the SPA index.html

Debugging common issues
- Build failures installing native dependencies on Alpine: switch Docker base to `node:18-bullseye` (Debian) in the `Dockerfile` or add required `apk` packages (build-base, python3, etc.). If you hit errors, paste the Render build logs and I will suggest a fix.
- PNPM errors: Dockerfile installs `pnpm` and runs `pnpm install --frozen-lockfile`. Run the same commands locally to reproduce errors.
- Missing env vars: server may exit or skip Supabase bucket creation; check runtime logs in Render.
- Static assets not found: ensure frontend build produced `artifacts/property-lo/dist` and that the Dockerfile copied it into `dist/public` in the final image.

Optional improvements
- Use a Render-managed Postgres and set `DATABASE_URL` from its connection string.
- Consider switching the Docker base image from Alpine to Debian (`node:18-bullseye`) if you need broader native library support.
- Add a healthcheck endpoint (e.g., `/api/health`) and configure Render's health checks.

If you want, I can:
- Switch the Dockerfile to `node:18-bullseye` proactively to avoid Alpine native build issues.
- Add a minimal `/api/health` route to the server for health checks.

Next steps I will take on request:
- If you want a Render-managed DB, I can create a `render.yaml` service entry for the DB and link it.

If anything fails during Render build or start, paste the build/runtime logs here and I’ll fix the Dockerfile or code as needed.
