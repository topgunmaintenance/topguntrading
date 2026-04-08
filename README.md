# TopGun Trading

> A premium trading intelligence and practice platform for serious traders.
> Analysis, discipline, replay, journaling, and AI-assisted review — without the hype.

TopGun Trading is a clean-room build of a high-end trading workspace. It is **not** an
auto-trader, a signal service, or a profit guarantee. It is a disciplined environment
for market observation, chart analysis, replay, journaling, pattern study, and
AI-assisted trade review.

---

## Status

**Phase 1 — Foundation.** Documentation, agent operating system, repo governance,
and clean monorepo scaffolding. No live integrations yet. All placeholders are
labeled as such in source.

See `docs/roadmap.md` for the phase plan and `AGENTS.md` for how this repo is
operated by Claude Code agents.

---

## What this repo contains

- `apps/web` — Next.js marketing site + app shell (TypeScript, Tailwind, shadcn/ui)
- `apps/api` — NestJS API service (TypeScript, PostgreSQL, Redis, WebSockets)
- `apps/extension` — Chrome MV3 browser extension (TypeScript)
- `apps/worker` — Background jobs and ingestion worker
- `packages/ui` — Shared design system primitives
- `packages/types` — Shared TypeScript types and zod schemas
- `packages/config` — Shared lint, tsconfig, and runtime config
- `packages/market-data` — Market data abstraction layer (provider-agnostic)
- `packages/charting` — Charting abstraction over Lightweight Charts / TradingView
- `packages/ai-prompts` — Versioned prompt library for AI features
- `packages/trading-rules` — Rule engine for discipline and journaling
- `infra/docker` — Local dev compose stack
- `scripts` — Repo automation and developer tooling
- `docs` — Product, architecture, strategy, and process documentation
- `agents` — Per-role agent operating instructions

---

## Quick start (Phase 1 scaffolding only)

> Phase 1 ships scaffolds, not a runnable product. Commands below are placeholders
> that will be wired up in Phase 2.

```bash
# Install (Phase 2+)
pnpm install

# Run the local stack (Phase 2+)
docker compose -f infra/docker/docker-compose.yml up

# Web app (Phase 2+)
pnpm --filter @topgun/web dev
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
