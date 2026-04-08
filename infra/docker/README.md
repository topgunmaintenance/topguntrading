# infra/docker

Local development data services for TopGun Trading.

> **Phase 1 placeholder.** Application services are not in this compose
> file yet. They run on the host with `pnpm` for fast hot reload.
> Real container build and orchestration arrive in Phase 2 for the API
> and worker, and in Phase 6+ for production manifests.

## Bring up

```bash
docker compose -f infra/docker/docker-compose.yml up
```

## Services

- `postgres` — Postgres 16, port 5432
- `redis` — Redis 7, port 6379
- `mailhog` — SMTP 1025, web UI 8025

## Owner

DevOps — see `agents/devops.md`.
