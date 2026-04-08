# Roadmap

This roadmap is **phase-gated**. We do not start a new phase until the current
phase is complete and audited. Phase numbers are stable. Phase content can be
refined as we learn.

## Phase 1 — Foundation (current)

**Goal:** ship a credible, defensible foundation. Documentation, agent
operating system, repo governance, and clean monorepo scaffolding.

**Exit criteria:**
- All required `docs/*.md` files exist and are written, not stubs.
- All required `agents/*.md` files exist and are written.
- Repo governance files (`.gitignore`, `.editorconfig`, `.env.example`,
  `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`,
  PR template, issue templates, `docs/working-rules.md`) are in place.
- Monorepo scaffolding for `apps/*`, `packages/*`, `infra/*`, `scripts/*`
  exists with placeholder shell files clearly labeled.
- Phase 1 self-audit is recorded in `docs/decisions.md`.

**Out of scope for Phase 1:** any real backend logic, real market data
integrations, real auth, real charts, real AI calls.

## Phase 2 — Web shell + API skeleton

- pnpm workspace wired up
- `apps/web` runs locally with a real landing page and authenticated
  app shell
- `apps/api` runs locally with health, auth, and user endpoints
- Postgres + Redis up via Docker Compose
- Shared `@topgun/types` and `@topgun/config` consumed by both apps
- CI runs lint, type-check, unit tests
- Basic design system primitives in `@topgun/ui`

## Phase 3 — Market data + chart workspace

- `@topgun/market-data` adapter contract finalized
- One real adapter implemented (provider TBD; see
  [`docs/market-data-strategy.md`](market-data-strategy.md))
- Watchlists with live quote streaming over WebSocket
- Chart workspace using `@topgun/charting` (Lightweight Charts first)
- Symbol search and instrument metadata

## Phase 4 — Journal + replay

- Journal entries with rich text, tags, attachments, chart links
- Trade entries with manual entry and CSV import
- Replay engine MVP: load a historical range, scrub, step bars, lock-forward
- Replay-aware journaling (record decisions during replay)

## Phase 5 — Pattern engine + AI copilot + extension

- Pattern engine with a small, well-tested initial set of formations
- AI copilot for trade review, pattern explanation, and journal Q&A
- Browser extension MVP: capture ticker context, screenshot, send to journal
- Prompt library versioning + evaluation harness

## Phase 6 — Alerts + observability

- Alert types: price, indicator, pattern, rule
- Notification channels: in-app, email, extension, webhook
- Internal observability: metrics, traces, logs, error reporting
- Admin dashboards for support

## Phase 7 — Billing + GA

- Subscription tiers and entitlements
- Billing provider integration
- Public marketing site polish
- Public launch

---

## Always-on tracks

These run alongside every phase:

- **Security** — see [`docs/security.md`](security.md)
- **Compliance** — see [`docs/compliance.md`](compliance.md)
- **Testing** — see [`docs/testing-strategy.md`](testing-strategy.md)
- **Design** — see [`docs/design-system.md`](design-system.md)
- **Decisions log** — see [`docs/decisions.md`](decisions.md)
- **Backlog grooming** — see [`docs/backlog.md`](backlog.md)
