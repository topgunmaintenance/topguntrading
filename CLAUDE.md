# CLAUDE.md

Instructions for any Claude session working in this repo. Read this first.

## What this repo is

**TopGun Trading** — a premium dark-themed trading workspace for serious retail traders. Observe, practice, record, review, discipline. **Not** a broker, not an auto-trader, not a signal feed. See `docs/vision.md` and `docs/product.md` for the full brief.

## Repo shape

pnpm workspace monorepo. TypeScript only. Phase-gated roadmap.

```
apps/
  api/          NestJS + Prisma + Postgres. Auth, watchlists, market-data, WS.
  web/          Next.js 14 App Router. RSC pages + server-only BFF route handlers.
  worker/       Phase 1 placeholder. BullMQ jobs land later.
  extension/    Phase 1 placeholder.

packages/
  config/         shared tsconfigs, ESLint, Prettier, loadEnv (CommonJS build)
  types/          single source of truth for all shared types + zod schemas (CommonJS build)
  ui/             React primitives (source-only, consumed via Next transpilePackages)
  charting/       Lightweight Charts wrapper
  market-data/    IMarketDataAdapter contract + provider adapters (CommonJS build)
  trading-rules/  detectors + indicators (pure functions, no IO)
  ai-prompts/     Phase 5 placeholder
```

**Primary working copy**: `/Users/topgunmaintenance/topgun-trading`. A git worktree exists at `.claude/worktrees/exciting-mahavira` but is currently empty — work in the primary tree.

## Non-negotiable rules

Read `docs/working-rules.md` before touching anything. The highlights:

1. **Plan before you code.** Use Claude Code's plan mode for non-trivial tasks. Write the plan to `.claude/plans/`.
2. **Stay in the lane.** Smallest change that solves the problem. No drive-by refactors.
3. **Phase discipline.** Check `docs/roadmap.md`. Don't implement Phase N+1 features inside a Phase N change. If a Phase N task needs a Phase N+1 artifact, scaffold it with a clearly labeled placeholder header.
4. **Label placeholders honestly.** Every stub file gets `// TopGun Trading — Phase N placeholder. Wired up in Phase M.` at the top. No fake completed features.
5. **Don't break the architecture.** `docs/architecture.md` is the source of truth. If you disagree, open an ADR in `docs/decisions.md`. Don't sneak in a parallel implementation.
6. **Do not bypass:**
   - The market-data adapter contract at `packages/market-data/src/contract.ts`
   - The AI prompt library at `packages/ai-prompts` (Phase 5)
   - The design-system voice rules in `docs/design-system.md`
7. **Respect the user:**
   - Never invent numbers in financial UI.
   - Never frame AI output as advice.
   - Never store broker credentials or private broker session data.
   - Always render required compliance disclaimers.
8. **"Buy" and "Sell" are reserved words** for actual order intent (which we do not execute). Use "Long"/"Short" for direction in journals. Use `taker_buy`/`taker_sell` for exchange trade tape. Never `BUY`/`SELL` in UI copy.
9. **Decimals are strings.** Prices, sizes, volumes — all serialize as decimal strings end-to-end to preserve provider precision. Never `parseFloat` at the edges. See `packages/types/src/market-data.ts:84`.
10. **False positives are a feature.** Detectors under-detect rather than over-detect. Confidence scores are honest — do not round 0.61 up to "high."

## Architecture decisions already made

See `docs/decisions.md`. Key Accepted ADRs you must honor:

- **ADR-0001** pnpm workspace monorepo
- **ADR-0002** NestJS for the API
- **ADR-0003** PostgreSQL via Prisma
- **ADR-0005** Provider-agnostic market-data layer — all data flows through `packages/market-data` adapters
- **ADR-0006** Anthropic Claude is the default AI provider (behind `@topgun/ai-prompts`, Phase 5)
- **ADR-0008** Replay lock-forward enforcement is server-side
- **ADR-0009** Coinbase is the initial real market-data provider (crypto, public, unauthenticated)
- **ADR-0010** Phase 3 is crypto-first; equities deferred to Phase 6+ except where ADR-0025 carves out a narrow observational exception
- **ADR-0020** Shared packages are CommonJS so NestJS can `require()` them
- **ADR-0022** One upstream subscription per symbol via `SubscriptionHub` — fan-out goes through the hub
- **ADR-0023** Canonical symbols are `{provider}:{symbol}` (lowercase provider, 2–20 chars, enforced by zod)

Phase 3.5 additions (in flight):
- **ADR-0025** Yahoo Finance observational equities data
- **ADR-0026** Kraken public API as crypto trade-tape source (second crypto provider alongside Coinbase)
- **ADR-0027** Edge observations are observational, not directive — no signal/advice framing

## Where things live

### Adding a new market-data provider

1. Create `packages/market-data/src/{provider}/` with `{provider}.rest.ts`, `{provider}.adapter.ts`, `mapping.ts`. Mirror `packages/market-data/src/coinbase/`.
2. Adapter implements `IMarketDataAdapter` from `packages/market-data/src/contract.ts`.
3. Register in `packages/market-data/src/registry.ts` (`AdapterId` union + `build()` switch).
4. Wire into `apps/api/src/market-data/adapter.registry.ts` with any provider options from env.
5. Add env vars to `apps/api/src/config/env.ts` and `apps/api/.env.example`.
6. Adapter file gets a header comment naming source URL, license, and attribution string.

### Adding a Nest API route

1. Add the handler to the relevant controller (e.g. `apps/api/src/market-data/market-data.controller.ts`).
2. Always `@UseGuards(AuthGuard)` unless explicitly public (health checks only).
3. Validate every query/body with a zod schema — use `ZodValidationPipe` from `apps/api/src/common/zod-validation.pipe.ts` or `SomeSchema.safeParse(...)` inline.
4. Throw `BadRequestException({ code, message })` for client errors, `ServiceUnavailableException` for upstream failures. The global `HttpErrorFilter` normalizes to the shared `ApiError` envelope.
5. Never invent new error shapes. Always route through `MarketDataError` → adapter → service → filter.

### Adding a web BFF route handler

Follow the pattern at `apps/web/src/app/api/market-data/candles/route.ts`:
1. `NextResponse` + `NextRequest`, read `headers().get("cookie") ?? ""` for auth forwarding.
2. Validate query params with zod schemas from `@topgun/types`.
3. Call the typed client in `apps/web/src/lib/market-data-client.ts` (or siblings).
4. Catch `ApiCallError`, return `NextResponse.json(error.body, { status: error.status })`.

### Adding a detector to @topgun/trading-rules

1. `packages/trading-rules/src/detectors/{name}.ts` — pure function, no IO, inject clock.
2. `packages/trading-rules/src/detectors/{name}.test.ts` — ≥5 golden test cases (clear fire, boundary, no signal, cluster/edge case, sparse data).
3. Header block with calibration reasoning citing ADR numbers and `docs/pattern-engine.md`.
4. Conservative defaults. Confidence scores calibrated against the goldens.
5. Output `EdgeSignal` from `@topgun/types`; never emit prose.

### UI card conventions

- Use `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` from `@topgun/ui`.
- Price/volume columns use `font-mono` with tabular figures per `docs/design-system.md §Typography`.
- Δ % coloring uses `text-state-up` / `text-state-down` tokens.
- Every data card mounts a `DataDisclaimer` footer.
- Row copy uses observational language: `taker_buy`/`taker_sell`, `long_bias`/`short_bias`, never BUY/SELL.

## Running locally

```bash
# Bootstrap once
scripts/bootstrap

# Dev servers (in separate terminals or via pnpm dev:all if configured)
pnpm --filter @topgun/api dev          # Nest API on :4000
pnpm --filter @topgun/web dev          # Next.js on :3000

# Test a specific package
pnpm --filter @topgun/trading-rules test
pnpm --filter @topgun/market-data test
pnpm --filter @topgun/api test
```

CommonJS packages (`@topgun/config`, `@topgun/types`, `@topgun/market-data`) need to be built before `dev:api` picks up their changes — `pnpm --filter @topgun/types build`. Source-only packages (`@topgun/ui`, `@topgun/charting`, `@topgun/trading-rules`) are hot because Next.js transpiles them; the API consumes them via tsconfig `paths` during dev and dist at runtime.

## When you finish a slice

- Every new/changed route has zod validation on inputs.
- Every new UI data surface mounts `DataDisclaimer` and follows design-system voice rules.
- `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test` all green.
- Smoke test via the preview tooling: `preview_start`, `preview_screenshot`, `preview_console_logs`, `preview_logs`.
- Update `docs/roadmap.md` with phase status, write a self-audit entry in `docs/decisions.md` if closing a phase, move any proposed ADRs you touched to Accepted.
- Commit only when the user explicitly asks.

## Scope rails

- Do not scrape private broker internals.
- Do not add paid APIs unless the user explicitly approves in this session.
- Do not add "feed" surfaces that a trader doom-scrolls. This is a workspace.
- Do not emit "signals" or "alpha" framing. Observations only.
- Do not add new top-level directories under `apps/` or `packages/` without an ADR.
