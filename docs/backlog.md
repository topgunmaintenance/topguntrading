# Backlog

This is the working backlog. It is intentionally lightweight; the source of
truth for active work is whatever issue tracker we adopt later. Items here
should be portable to that tracker without rewriting.

Status: `idea` → `ready` → `in-progress` → `done`. Items in `done` are
moved to a CHANGELOG entry on phase close, not deleted.

## Phase 2 — Web shell + API skeleton

- [ ] (ready) pnpm workspace + base `tsconfig`, `eslint`, `prettier` in
      `packages/config`
- [ ] (ready) `apps/web` Next.js scaffold with landing page and
      authenticated app shell
- [ ] (ready) `apps/api` NestJS scaffold with health, auth, user
      endpoints
- [ ] (ready) Postgres + Redis docker-compose with seed
- [ ] (ready) Shared `@topgun/types` zod schemas for `User`, `Session`,
      `Workspace`
- [ ] (ready) `@topgun/ui` initial primitives (Button, Input, Card,
      Toast, Dialog)
- [ ] (ready) CI: lint, type-check, unit tests on every PR
- [ ] (idea) `apps/extension` MV3 scaffold (build only, no real flows)

## Phase 3 — Market data + chart workspace

- [ ] (idea) Adapter contract finalized in `@topgun/market-data`
- [ ] (idea) One real adapter implemented (provider TBD)
- [ ] (idea) Watchlist live quote streaming over WebSocket
- [ ] (idea) Chart workspace using `@topgun/charting` (Lightweight
      Charts first)
- [ ] (idea) Symbol search and instrument metadata
- [ ] (idea) Data attribution UI per provider

## Phase 4 — Journal + replay

- [ ] (idea) Journal entry CRUD with rich text and attachments
- [ ] (idea) Trade entry CRUD with manual entry and CSV import
- [ ] (idea) Journal templates and tags
- [ ] (idea) Replay engine MVP with lock-forward enforcement
- [ ] (idea) Replay-aware journaling

## Phase 5 — Pattern engine + AI copilot + extension

- [ ] (idea) Pattern engine initial catalog (8 patterns)
- [ ] (idea) Trade review AI surface
- [ ] (idea) Journal Q&A with citations
- [ ] (idea) Pattern explainer
- [ ] (idea) Extension MVP (quick capture, ticker detection, workspace
      bridge)
- [ ] (idea) Prompt evaluation harness in `packages/ai-prompts`

## Phase 6 — Alerts + observability

- [ ] (idea) Price, indicator, pattern, rule alerts
- [ ] (idea) Notification channels (in-app, email, extension, webhook)
- [ ] (idea) Metrics, traces, error tracker
- [ ] (idea) Admin and impersonation UI

## Phase 7 — Billing + GA

- [ ] (idea) Subscription tiers and entitlements
- [ ] (idea) Billing provider integration
- [ ] (idea) Marketing site polish
- [ ] (idea) Public launch

## Cross-cutting

- [ ] (idea) Renovate or equivalent for dependency updates
- [ ] (idea) Pre-commit secrets scanner
- [ ] (idea) Visual regression for `packages/ui`
- [ ] (idea) MFA (TOTP)
- [ ] (idea) Region-aware compliance gating
