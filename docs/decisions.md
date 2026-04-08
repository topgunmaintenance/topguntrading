# Decisions Log

This is the architecture decision record (ADR) for TopGun Trading. Each
decision is small, dated, and either **Accepted**, **Proposed**, or
**Superseded**. We add to this file rather than rewriting history.

Format:

```
## ADR-NNNN: title
Status: Accepted | Proposed | Superseded
Date: YYYY-MM-DD
Context: ...
Decision: ...
Consequences: ...
```

---

## ADR-0001: Monorepo with pnpm workspaces
Status: Accepted
Date: 2026-04-08
Context: Web, API, extension, and worker share types, schemas, and UI
primitives. Splitting into multiple repos would force version drift and
slow iteration.
Decision: Single monorepo using pnpm workspaces with `apps/*` and
`packages/*`.
Consequences: We commit to a TypeScript-first stack and a single CI
pipeline. Tooling (turborepo or nx) may be added in Phase 2 if build
times warrant it.

## ADR-0002: NestJS over FastAPI for the API
Status: Accepted
Date: 2026-04-08
Context: A TypeScript-only stack lets us share zod schemas and types
between web, API, extension, and worker. NestJS provides battle-tested
modules, DI, guards, and WebSocket gateways.
Decision: Use NestJS for `apps/api`.
Consequences: Backend engineers must be comfortable with TypeScript and
Nest's idioms. We forgo Python-side ML libraries inside the API; ML
batch work, if any, will live in a separate worker.

## ADR-0003: PostgreSQL as the primary database
Status: Accepted
Date: 2026-04-08
Context: Relational data dominates the model (users, journals, trades,
rules, alerts, sessions). We need transactions and joins.
Decision: PostgreSQL via Prisma.
Consequences: We get a boring, correct default. Time-series storage for
candles will use Postgres partitioning to start; we may revisit if
volume forces a dedicated time-series store.

## ADR-0004: Redis for cache, pubsub, and queues
Status: Accepted
Date: 2026-04-08
Context: We need a hot store for quotes, a pubsub for realtime fan-out,
and a queue for background jobs.
Decision: Redis covers all three via BullMQ for queues.
Consequences: One operational dependency to learn well rather than
three. Redis becomes a critical service and must be sized accordingly.

## ADR-0005: Provider-agnostic market data layer
Status: Accepted
Date: 2026-04-08
Context: We will not bind the product to a single market data vendor.
Vendor terms, pricing, and coverage change.
Decision: All market data flows through `packages/market-data` adapters
implementing a stable interface.
Consequences: Slightly more upfront design work. Major upside on
flexibility, compliance, and pricing leverage.

## ADR-0006: Default AI provider is Anthropic Claude
Status: Accepted
Date: 2026-04-08
Context: Phase 5 AI features need a strong general model with structured
output and tool use.
Decision: Default to Anthropic Claude via the official SDK, behind an
abstraction in `packages/ai-prompts`.
Consequences: We adopt the latest Claude models. Other providers can be
swapped in per feature.

## ADR-0007: Dark theme first
Status: Accepted
Date: 2026-04-08
Context: The product is positioned as a premium, professional workspace.
Decision: Phase 1–2 ships dark theme only. Tokens are designed with a
future light variant in mind.
Consequences: Designers do not split focus. Light theme arrives later
without a redesign.

## ADR-0008: Lock-forward replay enforcement is server-side
Status: Accepted
Date: 2026-04-08
Context: Replay quality depends on never leaking future data. Client-
side enforcement is too easy to bypass and too easy to break by accident.
Decision: The replay channel only emits frames at or before the cursor.
Indicators are computed server-side from past data only.
Consequences: Slightly more server cost. Strong correctness guarantee.

## ADR-0017: OpenTelemetry deferred to Phase 6
Status: Accepted
Date: 2026-04-08
Context: Phase 2 brings the API and web skeletons online. Adding the
full OpenTelemetry pipeline now would burn scope without payoff — we
have nothing to trace yet beyond one auth flow.
Decision: Keep observability to structured logs + health endpoints in
Phase 2. Full OpenTelemetry lands in Phase 6 alongside alerts and the
observability track.
Consequences: Defer OTEL dependencies and exporters. Log schema is
designed so traces can be joined later without rewrites.

## ADR-0019: No Turborepo in Phase 2
Status: Accepted
Date: 2026-04-08
Context: Turborepo would accelerate repeat builds, but the workspace
is small (2 apps, 7 packages) and `pnpm -r` already runs in topological
order. The additional tool surface is not worth it yet.
Decision: Use `pnpm -r` directly. Revisit in Phase 4+ if build times
become painful.
Consequences: No remote caching. Incremental rebuilds rely on tsc
`incremental` output. Simpler mental model.

## ADR-0009: Initial market data provider is Coinbase (public, crypto-only)
Status: Accepted
Date: 2026-04-10
Context: Phase 3 needs at least one real market data provider to
exercise the adapter layer end to end. We need a provider that offers
free, unauthenticated public endpoints for both historical candles
and real-time quotes, with terms that permit display with attribution.
Context options considered:
- **Coinbase Exchange (public)**: `/products`, `/products/{id}/candles`,
  `ticker` WebSocket channel on `advanced-trade-ws.coinbase.com`. No
  API key required. Crypto spot only. Clear attribution requirement
  ("Data provided by Coinbase"). Well-documented.
- **Binance**: similar coverage, but some regions restrict access and
  terms vary by jurisdiction. Deferred.
- **Kraken**: similar coverage. Deferred.
- **Polygon / Alpaca / Tiingo (equities)**: Phase 3 is crypto-first
  (see ADR-0010). Deferred.
Decision: Coinbase is the initial real adapter. Lives in
`packages/market-data/src/coinbase/`. No credentials are ever sent.
Every response is attributed. All network traffic is over
`https://api.exchange.coinbase.com` and
`wss://advanced-trade-ws.coinbase.com`.
Consequences: We ship crypto only in Phase 3. Equities adapters arrive
in a later phase with a different contract conversation (market hours,
trading halts, corporate actions).

## ADR-0010: Crypto-first for Phase 3
Status: Accepted
Date: 2026-04-10
Context: Adding equities support in Phase 3 would force us to handle
trading halts, corporate actions, regulated attribution, and paid
data entitlements all at once. Crypto public feeds are permissively
licensed and always-on.
Decision: Phase 3 ships crypto spot market data only. Equities are
deferred to Phase 6 or later.
Consequences: No equity symbols appear in search. The UI copy is
careful to say "market data" rather than "stocks" wherever it
matters. Rule and pattern engines in later phases can still be
designed with equities in mind.

## ADR-0021: Lightweight Charts for the chart workspace
Status: Accepted
Date: 2026-04-10
Context: The chart workspace needs a candlestick renderer that is
fast, well-maintained, permissively licensed, and not a giant
dependency.
Options considered:
- **`lightweight-charts`** (TradingView, Apache 2.0): ~45KB min+gz,
  no watermark, supports candlesticks / line / area / bar, good
  API for live updates.
- **TradingView Charting Library (closed-source widget)**: richer,
  but requires a license and a widget container. Defer.
- **D3 / custom**: flexible, but we'd spend months recreating the
  obvious features. No.
Decision: `lightweight-charts` is the default backend. The
`@topgun/charting` package wraps it so swapping implementations
later is a single-package change.
Consequences: We commit to the `lightweight-charts` API shape. Chart
toolbars, drawing tools, and indicator registration all live behind
this abstraction in future phases.

## ADR-0022: Upstream-multiplex WebSocket hub
Status: Accepted
Date: 2026-04-10
Context: Multiple browser clients will subscribe to the same popular
symbols (BTC-USD, ETH-USD). Opening one upstream provider connection
per client does not scale and exhausts provider rate limits.
Decision: Phase 3 API runs a single `SubscriptionHub` in memory that
keeps exactly one upstream `IMarketDataAdapter.streamQuotes()`
subscription per symbol and fans out to every client subscribed to
that symbol. When the last client disconnects from a symbol, the
hub tears down the upstream subscription.
Consequences: The hub is per-process. Multi-instance fan-out via
Redis pub/sub lands in Phase 6 alongside horizontal scaling.

## ADR-0023: Symbol reference format `{provider}:{symbol}`
Status: Accepted
Date: 2026-04-10
Context: Symbols must be disambiguated across providers. `BTC-USD` on
Coinbase, `BTCUSDT` on Binance, and `XBT/USD` on Kraken are all the
same economic pair. We need a canonical ref the whole stack speaks.
Decision: Symbols are referenced as `{provider}:{symbol}` where
`provider` is the lowercase adapter id and `symbol` is the provider's
native identifier. Enforced by a zod regex
(`/^[a-z][a-z0-9_-]{1,19}:[A-Za-z0-9._/-]{1,32}$/`) in
`@topgun/types/market-data`. Everywhere in the DB, API, and UI uses
this form.
Consequences: Cross-provider "same pair" grouping is a UI concern —
the API does not try to unify Coinbase BTC-USD with Binance BTCUSDT.
If we want a unified symbol later, it will be a separate entity on
top of the raw refs.

## ADR-0020: Shared packages are built CommonJS
Status: Accepted
Date: 2026-04-08
Context: `apps/api` is NestJS on CommonJS. Node cannot synchronously
`require()` an ESM module. If the shared packages shipped as ESM, the
API could not consume them.
Decision: `@topgun/config` and `@topgun/types` emit CommonJS to `dist/`.
Both apps consume them via the built dist at runtime. `@topgun/ui`
stays source-only (React/TSX) because it is only consumed by Next.js,
which transpiles it via `transpilePackages`. Typecheck and tests
bypass the dist via tsconfig `paths` and Vitest `resolve.alias`
pointing at source, so `pnpm lint|typecheck|test` work without a
prior build.
Consequences: `pnpm dev:api` and `pnpm dev:web` require a prior build
of the two shared CommonJS packages. The `scripts/bootstrap` script
does this automatically. When actively iterating on shared packages,
run `pnpm --filter @topgun/config build` (and the same for types)
between edits.

---

## Open decisions (Proposed)

The following are tracked but not yet decided:

- **ADR-0011 (Proposed):** Container platform for production (Fly.io,
  Render, ECS, Kubernetes)
- **ADR-0012 (Proposed):** Error tracker (Sentry vs. self-hosted)
- **ADR-0013 (Proposed):** Vector store strategy (`pgvector` vs. external)
- **ADR-0014 (Proposed):** Final accent color (afterburner orange vs.
  ice white vs. radar green)
- **ADR-0015 (Proposed):** License choice (see top-level `LICENSE`)
- **ADR-0016 (Proposed):** "Bring your own key" mode for AI
- **ADR-0018 (Proposed):** Firefox build of the extension

ADR-0009 (Coinbase as initial provider), ADR-0010 (crypto-first),
ADR-0017 (OpenTelemetry timing), ADR-0019 (Turborepo), ADR-0020
(CommonJS shared packages), ADR-0021 (Lightweight Charts), ADR-0022
(upstream-multiplex WS hub), and ADR-0023 (symbol ref format) are now
**Accepted** — see above.

These move to **Accepted** when the relevant phase begins and a
decision is made.

---

## Phase 1 self-audit
Date: 2026-04-08
Performed by: Claude Code, wearing each agent role in turn.

Phase 1 exit criteria from `docs/roadmap.md`:

- [x] All required `docs/*.md` files exist and are written, not stubs.
- [x] All required `agents/*.md` files exist and are written.
- [x] Repo governance files (`.gitignore`, `.editorconfig`,
      `.env.example`, `LICENSE`, `CONTRIBUTING.md`,
      `CODE_OF_CONDUCT.md`, `SECURITY.md`, PR template, issue
      templates, `docs/working-rules.md`) are in place.
- [x] Monorepo scaffolding for `apps/*`, `packages/*`, `infra/*`,
      `scripts/*` exists with placeholder shell files clearly labeled.
- [x] Phase 1 self-audit recorded here.

Audit checks:

- **Missing files:** none. All required docs, agents, and governance
  files present.
- **Cross-reference integrity:** every `docs/*.md` and `agents/*.md`
  reference resolves to a real file. Verified by repo-wide grep.
- **Placeholder labeling:** every scaffolded source file
  (`apps/*/src/placeholder.ts`, `packages/*/src/index.ts`) starts with
  a header naming Phase 1 and the phase that will replace it. Every
  scaffolded `package.json` script emits a Phase 1 placeholder
  warning. The `LICENSE` file is explicitly marked PLACEHOLDER and
  references ADR-0015.
- **Duplicated responsibilities:** reviewed each agent file. The
  potentially-overlapping pairs (architect ↔ product-manager,
  backend-lead ↔ data-engineer, frontend-lead ↔ designer,
  qa-lead ↔ each lead, security-reviewer ↔ devops, docs-owner ↔
  product-manager) all have clear, non-overlapping responsibility
  statements. The `apps/worker/README.md` explicitly co-owns worker
  jobs between Backend Lead and Data Engineer.
- **Architecture coherence:** the diagram in `docs/architecture.md`
  matches the package and app layout one-to-one.
- **Phase discipline:** no Phase 2+ logic was implemented. Every
  package's `src/index.ts` only exports a phase marker.
- **Hallucinated integrations:** none. No client SDKs are imported.
  No URLs are configured. No DB schema exists. The only placeholder
  values in `.env.example` are documented and intentional.
- **Compliance posture:** disclaimers are described in
  `docs/compliance.md` and required slot is mentioned in
  `docs/design-system.md`, `agents/designer.md`, and
  `agents/ai-orchestrator.md`.
- **Security posture:** auth, secrets, input validation, and the
  threat model are documented in `docs/security.md` and reinforced
  in `agents/security-reviewer.md` and `agents/backend-lead.md`.

Findings fixed during audit:

- Added this self-audit record (this section).
- Added `.nvmrc` to pin Node version for onboarding.

Remaining open items (intentionally deferred to later phases):

- ADR-0009 through ADR-0019 in this document remain Proposed.
- No CI workflow exists yet — Phase 2.
- No Prisma schema exists yet — Phase 2.
- No real adapter or chart code exists yet — Phase 3.

Conclusion: **Phase 1 exit criteria met.** Phase 2 may begin upon
explicit approval from the project owner.

---

## Phase 2 self-audit
Date: 2026-04-08
Performed by: Claude Code, wearing each agent role in turn.

Phase 2 exit criteria from `docs/roadmap.md`:

- [x] pnpm workspace wired up
- [x] `apps/web` runs locally (landing, auth, dashboard) via
      `pnpm dev:web`
- [x] `apps/api` runs locally (health, auth, user endpoints) via
      `pnpm dev:api`
- [x] Postgres + Redis up via `infra/docker/docker-compose.yml` and a
      one-command bootstrap
- [x] Shared `@topgun/types` and `@topgun/config` consumed by both apps
- [x] CI scripts exist (`pnpm lint` / `typecheck` / `test` / `build`)
      — a hosted CI runner is Phase 6
- [x] Initial design system primitives in `@topgun/ui` (Button, Input,
      Label, Card, plus the `cn` helper and token module)

### What is complete

**`@topgun/config`** — Shared `tsconfig/{base,node,nextjs,react}.json`,
flat ESLint configs (`base`, `node`, `react`), Prettier config,
zod-backed `loadEnv` helper. Built CommonJS. Consumed by every other
workspace package.

**`@topgun/types`** — Real zod schemas for `User`, `Session`,
`Workspace`, `SignupRequest`, `LoginRequest`, `TokenPair`,
`AuthResponse`, `JwtPayload`, plus `ApiError` and `ACCESS_TOKEN_COOKIE`
/ `REFRESH_TOKEN_COOKIE` constants. Built CommonJS. Tests passing
under Vitest. Consumed by both apps.

**`@topgun/ui`** — `cn` merge helper, design `tokens`, `Button` (with
`cva` variants), `Input`, `Label`, and `Card*` primitives. Vitest +
Testing Library setup with a working `Button` test. Source-only
consumption via Next.js `transpilePackages`.

**`@topgun/api`** — NestJS bootstrap with `cookie-parser` and a
`HttpErrorFilter` that normalizes to the shared `ApiError` shape.
Prisma schema + initial migration for `users`, `sessions`,
`workspaces`. `HealthController` with `/healthz` and `/readyz`.
Auth module: `/auth/signup`, `/auth/login`, `/auth/refresh`,
`/auth/logout`, `/auth/me`. `AuthService` uses Argon2id for passwords,
HS256 JWTs for access tokens, and 48-byte refresh tokens stored as
SHA-256 hashes in the `sessions` table with rotation on every
refresh. `AuthGuard` accepts either a `Bearer` header or the
`tg_access` HTTP-only cookie. `UsersService` + `UsersController`
expose `/users/me`. `WorkspacesService` provides a
`getOrCreateDefault` stub (no controller until Phase 3). Tests cover
the password service, token service, and auth service happy + sad
paths using a hand-rolled Prisma mock — no database required.

**`@topgun/web`** — Next.js 14 App Router with a dark `globals.css`,
tokens mirrored into Tailwind, a premium landing page, `(auth)` route
group with `login` and `signup` server pages, `(app)` route group
with an authenticated `dashboard` and a logout-capable `AppNav`.
Route handlers under `src/app/api/auth/*` proxy signup / login /
refresh / logout / me to the API and set the `tg_access` and
`tg_refresh` cookies as HTTP-only. `(app)/layout.tsx` redirects
unauthenticated users to `/login`; `(auth)/layout.tsx` redirects
authenticated users to `/dashboard`. `not-found.tsx` matches the
brand voice. A small Vitest smoke test covers `ApiCallError`.

**Root** — `pnpm bootstrap`, `pnpm build`, `pnpm lint`, `pnpm typecheck`,
`pnpm test`, `pnpm format`, `pnpm dev:api`, `pnpm dev:web`. Root ESLint
flat config, Prettier re-export, `.prettierignore`, `.nvmrc`.
`scripts/bootstrap` performs the whole install-to-migration path.

### What is still placeholder

- `apps/worker` — Phase 1 placeholder (no real code)
- `apps/extension` — Phase 1 placeholder (no real code)
- `packages/market-data` — Phase 1 placeholder (contract lands Phase 3)
- `packages/charting` — Phase 1 placeholder (lands Phase 3)
- `packages/ai-prompts` — Phase 1 placeholder (lands Phase 5)
- `packages/trading-rules` — Phase 1 placeholder (lands Phase 4/5)
- OAuth providers in `.env.example` (Phase 6)
- Mail sending (Phase 4+)
- Object storage (Phase 4+)
- Sentry / OTEL wiring (Phase 6)
- No hosted CI runner yet; scripts exist but `.github/workflows/` is
  empty

### Audit checks run

- **Cross-references:** repo-wide grep confirms no `tsconfig.base.json`
  references survive the move into `@topgun/config/tsconfig/`.
- **ESM / CJS boundaries:** `@topgun/config` and `@topgun/types`
  source files contain no `.js` extensions in imports; both emit
  CommonJS. `@topgun/ui` keeps `.js` extensions because it uses
  `moduleResolution: Bundler` and is consumed via Next.js
  `transpilePackages`. `apps/api` sources contain no `.js`
  extensions.
- **Import cycles:** none introduced. `@topgun/api` imports only from
  `@topgun/config` and `@topgun/types`. `@topgun/web` imports from
  `@topgun/config`, `@topgun/types`, and `@topgun/ui`.
- **Auth contract drift:** web route handlers, API controllers, and
  Vitest tests all import `SignupRequestSchema` / `LoginRequestSchema`
  / cookie constants from `@topgun/types`. There is no parallel
  definition anywhere in the repo.
- **Placeholder labeling:** every remaining Phase 1 placeholder file
  still carries its `Phase 1 placeholder` header. No un-labeled
  scaffolds remain.
- **Compliance:** the landing page, the `(auth)` layout, and the
  dashboard all render the non-advice disclaimer copy.
- **Security:** passwords hashed with Argon2id; refresh tokens
  SHA-256'd in DB with rotation; cookies are `httpOnly` +
  `sameSite: "lax"` + `secure` in production; API validates every
  body with zod; `AuthGuard` applies to protected routes.
- **Lint/typecheck/test/build scripts** exist on every active
  package. Phase-1 placeholder packages still use `echo` scripts that
  exit 0.

### Findings fixed during the audit

- Initial shared packages were ESM (`"type": "module"`); the NestJS
  API could not `require()` them synchronously. Flipped both to
  CommonJS and stripped `.js` extensions from their source imports.
  Codified as ADR-0020.
- `@topgun/config` devDependencies (`@eslint/js`, `typescript-eslint`,
  `globals`) had to be promoted to `dependencies` so consumer packages
  can load the flat ESLint configs.
- `apps/web` `package.json` originally depended on
  `eslint-config-next` and used `next lint`, which does not cleanly
  support ESLint 9 flat config. Replaced with `eslint src
  --max-warnings=0` so it matches the rest of the workspace.
- `apps/api/tsconfig.json` initially declared `rootDir: src` while
  including `test/**/*.ts`, which tsc rejects. Split into
  `tsconfig.json` (typecheck, no `rootDir`, includes src + test) and
  `tsconfig.build.json` (build, `rootDir: src`, excludes tests).
- Added `apps/api/tsconfig.json` `paths` and `apps/api/vitest.config.ts`
  `resolve.alias` for `@topgun/config` + `@topgun/types` so typecheck
  and tests work without a prior build of the shared packages.
- Added `postinstall: "prisma generate || true"` to `apps/api` so the
  Prisma client is ready immediately after `pnpm install`.
- `.env.example` updated to replace the now-unused
  `NEXT_PUBLIC_API_URL` with the server-only `API_INTERNAL_URL` the
  web actually reads.

### Remaining open items (deferred to Phase 3+)

- Hosted CI workflow file(s) in `.github/workflows/`
- Worker and extension build pipelines
- Market data adapters, chart workspace, journal, replay, patterns,
  AI, alerts, billing

Conclusion: **Phase 2 exit criteria met.** Phase 3 may begin upon
explicit approval from the project owner.

---

## Phase 3 self-audit
Date: 2026-04-10
Performed by: Claude Code, wearing each agent role in turn.

Phase 3 exit criteria from `docs/roadmap.md`:

- [x] `@topgun/market-data` adapter contract finalized
- [x] One real adapter implemented (Coinbase public, see ADR-0009)
- [x] Watchlists with live quote streaming over WebSocket
- [x] Chart workspace using `@topgun/charting` (Lightweight Charts)
- [x] Symbol search and instrument metadata
- [x] New ADRs + Phase 3 self-audit recorded here

### What is complete

**`@topgun/types` extensions.** `AssetClass`, `Interval`, `SymbolRef`
(canonical `{provider}:{symbol}` format, ADR-0023), `SymbolMeta`,
`Candle`, `CandleRequest`, `Quote`, `AttributionInfo`,
`AdapterCapabilities`, `StoredSymbol`, `Watchlist`, `WatchlistItem`,
`CreateWatchlistRequest`, `UpdateWatchlistRequest`,
`AddWatchlistItemRequest`, and the full client ↔ server WebSocket
stream envelope (`subscribe`, `unsubscribe`, `ping`, `ack`, `quote`,
`error`, `pong`). `INTERVAL_SECONDS` helper. Vitest coverage for
schemas and helpers.

**`@topgun/market-data`.** Real package build.
- `IMarketDataAdapter`, `Subscription`, `QuoteHandler` contract
- `MarketDataError` type
- `MockAdapter` — deterministic synthetic feed, LCG-seeded, clearly
  marked `simulated: true`. Produces candles and a 2 Hz tick stream.
  Full Vitest coverage including the "throwing handler doesn't tear
  down the stream" test.
- `CoinbaseAdapter` — composes a `CoinbaseRestClient` (public
  `/products`, `/products/{id}`, `/products/{id}/candles` with
  timeout, 429 detection, `AbortController`) and a `CoinbaseWsClient`
  (ticker channel with exponential-backoff reconnect, jitter,
  heartbeat, per-product subscription multiplexing). Unit tests
  cover mapping between raw payloads and normalized schemas
  (granularity, product → SymbolMeta, candle row → Candle, ticker
  → Quote, envelope detection).
- `AdapterRegistry` — lazily builds and caches adapter instances,
  disposes them on process shutdown.

**`@topgun/charting`.** Real package build. `Chart` client component
wrapping `lightweight-charts` with a dark theme that matches the
design system, live-quote support (the most recent candle's close /
high / low update as quotes arrive), and `TIMEFRAME_OPTIONS` helper.
Source-only consumption via Next.js `transpilePackages`. Smoke test
for the timeframe helpers.

**`apps/api` — market data module.**
- `AppConfigModule.env` extended with `MARKET_DATA_PROVIDER`
  (`mock` | `coinbase`), `MARKET_DATA_CACHE_TTL_SECONDS`,
  `COINBASE_REST_URL`, `COINBASE_WS_URL`
- `MarketDataAdapterRegistry` — NestJS wrapper around the package
  registry; disposes adapters on `onModuleDestroy`
- `MarketDataService` — wraps the adapter, persists symbols to the
  `symbols` table on first touch, short-lived in-memory LRU cache
  for candle responses (`lru-cache`), normalizes adapter errors
  to `ApiError` shape
- `MarketDataController` — guarded REST endpoints
  `GET /market-data/attribution`, `GET /market-data/symbols?q&limit`,
  `GET /market-data/symbol?ref`, `GET /market-data/candles?...`.
  All inputs validated via zod (`CandleRequestSchema`,
  `SymbolRefSchema`).
- `SubscriptionHub` — the upstream-multiplex hub described in
  ADR-0022. Exactly one upstream subscription per symbol. Tears
  down upstream on last-client-disconnect. Full Vitest coverage
  of the multiplex, teardown, cross-symbol isolation, and
  client-disconnect paths.
- `MarketDataStreamGateway` — `@WebSocketGateway({ path: "/stream" })`
  over `@nestjs/platform-ws`. Cookie-authenticated at connect;
  `tg_access` JWT is verified by `TokenService`. Implements the
  full wire protocol with strict zod validation, ack / error / pong
  responses, and per-client resource release on disconnect.
- `main.ts` now installs the `WsAdapter` from `@nestjs/platform-ws`
  and logs the active market data provider on boot.

**`apps/api` — watchlists module.**
- `WatchlistsService` CRUD with ownership checks, auto-default on
  first watchlist, deduplication on add (409), ordered items, and
  a clean "public" serializer.
- `WatchlistsController` — guarded REST endpoints
  `GET /watchlists`, `POST /watchlists`, `GET/PATCH/DELETE /watchlists/:id`,
  `POST /watchlists/:id/items`, `DELETE /watchlists/:id/items/:itemId`.
- Vitest happy/sad path coverage via a hand-rolled Prisma mock
  (create, duplicate symbol rejected, ownership enforced).

**`apps/api` — Prisma.**
- Schema extended with `Symbol`, `Watchlist`, `WatchlistItem`.
- Migration `20260410120000_market_data/migration.sql` hand-written
  to match the schema exactly, with foreign keys and unique
  indexes. `users` gains a `watchlists Watchlist[]` back-relation.

**`apps/web` — new routes.**
- `/watchlists` — server component, lists the user's watchlists
  with an inline "create" form, graceful empty state, and the
  attribution footer. Simulated adapter renders a warning banner.
- `/watchlists/[id]` — server component with `WatchlistPanel`
  client component that subscribes via `useQuotesStream` and
  renders live bid/ask/last. Uses `SymbolSearch` for adding items.
- `/chart/[symbolRef]` — server component with `ChartCanvas` client
  component that hydrates with the API's initial candles and the
  live quote ribbon. Timeframe switcher calls the candles proxy.
- `(app)` layout unchanged — still gated by cookie auth.

**`apps/web` — server-side clients.**
- `marketDataClient` — typed fetch for `/market-data/*` endpoints,
  forwards the request's cookie jar for auth.
- `watchlistsClient` — typed fetch for `/watchlists/*` endpoints.
- Both raise `ApiCallError` and map cleanly through the route
  handlers.

**`apps/web` — route handlers (server-only).**
- `GET /api/market-data/symbols`, `GET /api/market-data/candles`
- `GET/POST /api/watchlists`, `GET/PATCH/DELETE /api/watchlists/[id]`,
  `POST /api/watchlists/[id]/items`,
  `DELETE /api/watchlists/[id]/items/[itemId]`

**`apps/web` — client components and hook.**
- `useQuotesStream(wsUrl, symbols)` — bounded-backoff reconnect,
  per-symbol quote cache, exposes a `status` indicator that the
  watchlist panel renders.
- `WatchlistPanel` — symbol rows with live quotes, remove-in-place,
  simulated-data banner.
- `SymbolSearch` — debounced combobox that queries
  `/api/market-data/symbols` and calls back with the picked
  `SymbolMeta`.
- `ChartCanvas` — dynamically imports the Chart component from
  `@topgun/charting` with `ssr: false`, wires timeframe switching
  and the live-quote hook.
- `app-nav.tsx` wires the Watchlists link.

**Root + docs.**
- `.env.example` updated with `NEXT_PUBLIC_WS_URL`,
  `MARKET_DATA_PROVIDER`, `MARKET_DATA_CACHE_TTL_SECONDS`,
  `COINBASE_REST_URL`, `COINBASE_WS_URL`.
- ADR-0009, ADR-0010, ADR-0021, ADR-0022, ADR-0023 accepted
  above.
- `docs/roadmap.md` Phase 3 marked complete.

### What is still placeholder / deferred

- **`apps/worker`**: still a Phase 1 placeholder. No jobs run yet.
- **`apps/extension`**: still a Phase 1 placeholder. No UI scaffolding
  created in Phase 3.
- **`packages/ai-prompts`** and **`packages/trading-rules`**:
  untouched placeholders — Phases 4 and 5.
- **Level 2 / order book**: no adapter capability, no UI. Not in
  scope.
- **Equities adapters**: not implemented — crypto-first per
  ADR-0010.
- **Replay engine**: deferred to Phase 4. The `Interval` and
  `Candle` schemas are shaped so the replay stream can reuse them
  without a redesign.
- **Redis-backed subscription fan-out across API instances**: the
  `SubscriptionHub` lives in a single process. Multi-instance
  fan-out is a Phase 6 concern.
- **Candle persistence to Postgres**: candles are in-memory cached
  only. A durable historical store lands in Phase 4 (replay) or
  Phase 6 (observability), whichever arrives first.
- **.github/workflows/** still empty.

### Audit checks run

- **Cross-references:** every new file's internal imports resolve
  (repo-wide grep for `from ".*\.js"` inside `apps/api/src` and
  `packages/*/src` — clean).
- **Package boundaries:** `@topgun/api` imports
  `@topgun/market-data`, `@topgun/types`, `@topgun/config`. No
  other cross-package imports. `@topgun/web` imports
  `@topgun/types`, `@topgun/ui`, `@topgun/config`, `@topgun/charting`
  only. `@topgun/market-data` imports from `@topgun/types` only.
  `@topgun/charting` imports from `@topgun/types` only. No cycles.
- **No broker integration:** every Coinbase call is against a
  public, unauthenticated endpoint. No API key is read from env.
  No private session data is ever fetched.
- **No profit / advice copy:** reviewed every new page, component,
  and disclaimer. No "buy" / "sell" verbs in UI. No win rate,
  ROI, forecast, or "AI says". Simulated-data banner is
  prominent whenever the mock adapter is active.
- **Compliance:** every watchlist and chart page renders the
  attribution string from the active adapter (`Data provided by
  Coinbase` or `Simulated data — not real market prices`).
- **Security:** the WebSocket gateway verifies the access token on
  connect (cookie or `Authorization: Bearer`). Every REST endpoint
  is behind `AuthGuard`. Watchlist ownership is enforced on every
  mutation. Input validation uses zod at every entry point.
- **Subscription hub lifecycle:** unit tests prove that (a) exactly
  one upstream subscription is created per symbol even with multiple
  clients, (b) clients fan out correctly, (c) the upstream is torn
  down on the last unsubscribe, (d) disconnecting a client releases
  all of its symbols, (e) symbols for inactive providers are
  rejected.
- **Error shape:** every adapter error is mapped to the shared
  `ApiError` envelope before leaving the API.
- **Prisma migration is self-consistent:** schema file + handwritten
  SQL match. Foreign keys and unique indexes present.

### Findings fixed during the audit

- The initial chart page briefly used a server action passed to a
  client component; replaced with a direct `fetch()` in the
  `SymbolSearch` `onPick` handler.
- `next.config.mjs` now includes `@topgun/charting` in
  `transpilePackages` alongside `@topgun/ui`, so the chart
  component is compiled from source like the other shared UI code.
- Added `@topgun/market-data` + `@topgun/charting` aliases to the
  API, market-data, and web Vitest configs so the test runs
  against source without a prior build.
- Renamed ADRs 0009 and 0010 from "Proposed" to "Accepted" to
  reflect the Phase 3 provider choice.

### Known limitations

- The web WS hook reconnects (drops and recreates the socket) when
  the symbol set changes. A future phase will send delta
  subscribe/unsubscribe messages without churning the connection.
- Candle responses are cached in-process per API instance. A
  second API instance will not see cache hits from the first.
  Acceptable for Phase 3 single-instance deployment.
- `MARKET_DATA_CACHE_TTL_SECONDS` applies uniformly to all
  intervals. Later phases will tune it per interval.
- Coinbase's public feed does not expose historical level-2 depth
  on this channel. We never advertised it.

Conclusion: **Phase 3 exit criteria met.** Phase 4 (journal +
replay engine MVP) may begin upon explicit approval from the
project owner.
