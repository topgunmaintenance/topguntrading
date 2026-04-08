# @topgun/worker

> **Phase 1 scaffold.** No real worker yet. The BullMQ runner, market
> data ingestion jobs, replay snapshot builder, and alert evaluator
> arrive in Phase 2 onwards — see `docs/roadmap.md`.

The TopGun Trading background worker. Long-running Node process that
consumes jobs from Redis (BullMQ) and runs ingestion, replay snapshot
building, journal indexing, AI background tasks, and alert evaluation.

## Phase 2+ plan

- Node + TypeScript
- BullMQ on Redis
- Shares modules and Prisma client with `@topgun/api`
- Per-job retries, dead-letter queues, structured logs

## Owner

Backend Lead — see `agents/backend-lead.md`. Data Engineer owns the
ingestion and replay snapshot jobs — see `agents/data-engineer.md`.
