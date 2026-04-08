# Deployment

## Environments

- **local** — Docker Compose, `infra/docker/docker-compose.yml`
- **preview** — per-PR ephemeral environment for `apps/web` and a shared
  preview API
- **staging** — long-lived staging environment behind auth
- **production** — public

Phase 1 ships only the local stack scaffolding.

## Local development

`infra/docker/docker-compose.yml` brings up:

- `postgres` — primary database
- `redis` — cache, pubsub, queues
- `mailhog` — captures dev mail
- (later) `minio` — S3-compatible object store for attachments
- (later) `clickhouse` — only if we need it for analytics; not in scope yet

Application processes (`apps/web`, `apps/api`, `apps/worker`) are run on
the host with `pnpm` for fast hot reload, while the data services run
in containers.

## Build artifacts

- `apps/web` — static + server bundle from `next build`
- `apps/api` — Node bundle, Dockerfile produces a slim image
- `apps/worker` — Node bundle, shares base image with `apps/api`
- `apps/extension` — zipped MV3 bundle for the Chrome Web Store

## Production target

Container-based. Concretely:

- `apps/web` — Vercel or a self-hosted Next.js node
- `apps/api`, `apps/worker` — managed container platform (Fly.io, Render,
  ECS, or Kubernetes; final choice tracked in `docs/decisions.md`)
- `postgres` — managed (RDS, Neon, Supabase, or equivalent)
- `redis` — managed (Upstash, ElastiCache, or equivalent)

## Configuration

- All configuration is via environment variables.
- `.env.example` lists every variable with a description and a sane
  default where possible.
- Production secrets live in the deployment provider's secret store.
  Secrets never enter git.
- See [`docs/security.md`](security.md).

## Migrations

- Prisma migrations live in `apps/api/prisma/migrations`.
- Migrations are applied on deploy by a one-shot job, not by the running
  API process.
- Backwards-incompatible migrations require a documented rollout plan.

## Releases

- Semantic versioning per app and per package.
- Each release produces a tagged commit, a build artifact, and a
  changelog entry.
- The Chrome extension follows the Chrome Web Store review cadence and
  may lag the web release.

## Rollback

- Web and API: redeploy previous container.
- Database: forward-only migrations are the default; destructive
  migrations are gated and have a written rollback.
- Extension: previous version stays available until the new version is
  promoted.

## Observability hooks

- Health endpoints: `/healthz`, `/readyz`
- Metrics: Prometheus-compatible scrape endpoint on the API and worker
- Logs: structured JSON to stdout, shipped by the platform
- Errors: an error tracker (Sentry or equivalent), final choice in
  `docs/decisions.md`
- See [`docs/observability.md`](observability.md).
