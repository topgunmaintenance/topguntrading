# Architecture

## High-level

TopGun Trading is a TypeScript-first monorepo with four runtime apps and a set
of shared packages. Local development runs on Docker Compose. Production targets
container orchestration (Kubernetes or a managed equivalent).

```
+----------------------+        +---------------------+
|      apps/web        |  HTTPS |       apps/api      |
|  Next.js (App Router)| <----> |       NestJS        |
|  React, Tailwind     |        |  REST + WebSockets  |
+----------+-----------+        +----+--------+-------+
           |                         |        |
           | WS                      |        |
           v                         v        v
+----------------------+    +---------------+ +-----------------+
|   apps/extension     |    |  PostgreSQL   | |     Redis       |
|   Chrome MV3 (TS)    |    |   (primary)   | |  cache+pubsub   |
+----------------------+    +-------+-------+ +--------+--------+
                                    |                   |
                                    v                   v
                              +-----+----+        +-----+----+
                              | apps/    |        |  Market  |
                              | worker   |<------>|  Data    |
                              | (jobs)   |        | Adapters |
                              +----------+        +----------+
```

## Apps

### `apps/web` — Next.js
- Framework: Next.js 14+ (App Router) + React + TypeScript
- Styling: Tailwind CSS + shadcn/ui primitives, custom dark theme
- State: React Server Components first, Zustand or TanStack Query where needed
- Auth: NextAuth/Auth.js bridged to API session
- Realtime: WebSocket client to `apps/api`
- Responsibility: marketing, app shell, charts, journal UI, replay UI,
  AI copilot UI, extension companion pages

### `apps/api` — NestJS
- Framework: NestJS (Node + TypeScript)
- Why NestJS over FastAPI: a TypeScript backend lets us share types, zod
  schemas, and validation with the web app and the extension. NestJS gives
  us a battle-tested module system, dependency injection, guards,
  interceptors, and first-class WebSocket gateways without reinventing
  structure. FastAPI is excellent, but a JS/TS-only stack is faster to
  ship and easier to govern in this monorepo.
- Persistence: PostgreSQL via Prisma
- Cache, queues, pubsub: Redis
- Realtime: native WebSocket gateway, with optional SSE fallback
- AI: provider-agnostic client in `packages/ai-prompts`
- Market data: adapters in `packages/market-data`

### `apps/extension` — Chrome MV3
- Manifest V3 + TypeScript
- Service worker + content scripts + popup UI
- Talks to `apps/api` over authenticated HTTPS and WebSocket
- Responsibility: capture context (tickers, screenshots) from browser pages
  the user is already viewing, with explicit permission

### `apps/worker` — Background processor
- Long-lived Node process (BullMQ on Redis)
- Jobs: market data ingestion, replay snapshot building, journal indexing,
  AI background tasks, alert evaluation

## Shared packages

| Package | Purpose |
|---------|---------|
| `@topgun/ui` | Tailwind + shadcn-based primitives shared by web and extension |
| `@topgun/types` | Shared TypeScript types and zod schemas (single source of truth) |
| `@topgun/config` | Shared `tsconfig`, `eslint`, `prettier`, runtime env helpers |
| `@topgun/market-data` | Provider-agnostic adapters and normalized market data schema |
| `@topgun/charting` | Abstraction over Lightweight Charts and TradingView widgets |
| `@topgun/ai-prompts` | Versioned, testable prompt library and provider client |
| `@topgun/trading-rules` | Personal trading rule engine and evaluation runtime |

## Data model (initial sketch)

- `User` — auth identity, profile, preferences
- `Workspace` — saved layouts, watchlists, default symbols
- `Symbol` — instrument metadata
- `Candle` — OHLCV bars at multiple intervals
- `JournalEntry` — text, tags, linked symbols, linked bars, attachments
- `Trade` — entry, exit, size, side, fees, journal links
- `Rule` — user-defined predicate with severity (warn / block)
- `RuleEvaluation` — log of rule outcomes per session/trade
- `Alert` — symbol, condition, channel, state
- `ReplaySession` — symbol, range, speed, current cursor
- `AIInteraction` — input, prompt id, output, citations, cost

Detailed schemas live in `packages/types` and Prisma migrations under
`apps/api/prisma`.

## Realtime

- WebSockets are the default channel for streaming quotes, replay frames,
  pattern hits, and rule events.
- Channels are namespaced and authenticated per user.
- Backpressure is handled in the gateway; clients must ack heavy streams.

## AI

- All AI calls go through `@topgun/ai-prompts` so prompts are versioned and
  reviewed.
- Default provider is the Anthropic Claude API; the abstraction allows
  others to be swapped in.
- AI never executes trades. AI output is always presented as commentary.
- See [`docs/ai-strategy.md`](ai-strategy.md).

## Security boundaries

- The browser extension only talks to `apps/api`, never directly to a third
  party broker or data provider.
- Secrets stay server-side. The web client receives short-lived tokens.
- Market data credentials live only in `apps/api` and `apps/worker`.
- See [`docs/security.md`](security.md).

## Local development

- `infra/docker/docker-compose.yml` brings up Postgres, Redis, and a mailhog
  for dev mail.
- `pnpm` workspaces drive the monorepo.
- See [`docs/deployment.md`](deployment.md).

## Why this shape

- A TypeScript monorepo gives us shared types end-to-end (web ↔ api ↔ extension).
- NestJS gives us structure without ceremony.
- PostgreSQL is the boring, correct default for this kind of product.
- Redis covers cache, pubsub, and queues without adding another system.
- Provider abstractions for data, charts, and AI keep us from being held
  hostage by any one vendor.
