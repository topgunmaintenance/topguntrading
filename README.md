# TopGun Trading

> A premium trading intelligence and practice platform for serious traders.
> Analysis, discipline, replay, journaling, and AI-assisted review — without the hype.

TopGun Trading is a clean-room build of a high-end trading workspace. It is **not** an
auto-trader, a signal service, or a profit guarantee. It is a disciplined environment
for market observation, chart analysis, replay, journaling, pattern study, and
AI-assisted trade review.

---

## Status

**Phase 3 — Market data + chart workspace.** On top of the Phase 2
skeleton: a provider-agnostic market data adapter layer
(`@topgun/market-data`) with a real Coinbase public adapter and a
clearly-labeled mock adapter, a Lightweight Charts wrapper
(`@topgun/charting`), a cookie-authenticated WebSocket stream gateway
with an upstream-multiplex subscription hub, persisted symbols and
watchlists in Postgres, and new Next.js pages for watchlists and the
chart workspace with live quote streaming over WebSockets. No
journal, replay, patterns, AI, alerts, extension logic, or broker
integration yet.

See `docs/roadmap.md` for the phase plan and `AGENTS.md` for how this repo
is operated by Claude Code agents.

---

## What this repo contains

- `apps/web` — Next.js marketing site + app shell (TypeScript, Tailwind, shadcn/ui)
- `apps/api` — NestJS API service (TypeScript, PostgreSQL, Redis, WebSockets)
- `apps/extension` — Chrome MV3 browser extension (TypeScript)
- `apps/worker` — Background jobs and ingestion worker
- `packages/ui` — Shared design system primitives
- `packages/types` — Shared TypeScript types and zod schemas
- `packages/config` — Shared lint, tsconfig, and runtime config
- `packages/market-data` — Provider-agnostic market data adapter layer (Mock + Coinbase)
- `packages/charting` — Lightweight Charts wrapper (React, client-only)
- `packages/ai-prompts` — Versioned prompt library for AI features
- `packages/trading-rules` — Rule engine for discipline and journaling
- `infra/docker` — Local dev compose stack
- `scripts` — Repo automation and developer tooling
- `docs` — Product, architecture, strategy, and process documentation
- `agents` — Per-role agent operating instructions

---

## Quick start

```bash
# One-command local bootstrap:
# installs deps, starts Postgres/Redis/mailhog, generates Prisma,
# applies the initial migration.
pnpm bootstrap

# Run the API (NestJS) on :4000
pnpm dev:api

# In another terminal, run the web (Next.js) on :3000
pnpm dev:web
```

Workspace scripts from the repo root:

```bash
pnpm lint         # every package + app
pnpm typecheck    # every package + app
pnpm test         # every package + app
pnpm build        # topological build
pnpm format       # prettier --write .
```

Stop local services:

```bash
docker compose -f infra/docker/docker-compose.yml down
```

---

## Read these first

1. [`docs/vision.md`](docs/vision.md) — Why TopGun Trading exists
2. [`docs/product.md`](docs/product.md) — What it is and is not
3. [`docs/architecture.md`](docs/architecture.md) — How it is built
4. [`docs/roadmap.md`](docs/roadmap.md) — Phase plan
5. [`AGENTS.md`](AGENTS.md) — How agents operate this repo
6. [`docs/working-rules.md`](docs/working-rules.md) — Day-to-day rules of engagement

---

## Important disclaimers

TopGun Trading does **not** provide investment advice, broker execution, or
guaranteed outcomes. Trading carries risk of loss. See [`docs/compliance.md`](docs/compliance.md).

---

## License

See [`LICENSE`](LICENSE).
