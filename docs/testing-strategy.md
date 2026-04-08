# Testing Strategy

Testing in TopGun Trading is layered. We don't write tests for vanity. We
write the tests that catch the bugs that hurt the most: financial display
mistakes, time bugs, lock-forward leaks, AI prompt regressions, and broken
auth.

## Layers

1. **Unit tests** — pure functions, detectors, formatters, schemas.
2. **Integration tests** — services with a real Postgres and Redis,
   spun up in CI.
3. **Contract tests** — adapter contracts (market data, AI provider,
   billing) verified against fakes.
4. **End-to-end tests** — Playwright over `apps/web` against a
   running `apps/api` and a fake market data adapter.
5. **Visual regression** — critical UI primitives in `packages/ui` and
   chart workspace via Playwright snapshots.
6. **AI evaluation** — golden prompt cases with structured output
   schemas, run on every prompt change.
7. **Load tests** — WebSocket fan-out and replay session capacity in
   pre-release smoke runs.

## Tooling (planned)

- Test runner: Vitest for TS unit and integration; Jest only if a
  package strictly needs it.
- E2E: Playwright
- API HTTP: supertest
- Mocks: msw for browser, undici interceptors for node
- AI eval: in-house harness in `packages/ai-prompts`

## Conventions

- A test file lives next to the file it tests when possible
  (`foo.ts` + `foo.test.ts`).
- Cross-cutting tests live under `__tests__` at the package root.
- No snapshot tests for free-form text. Snapshots are reserved for
  rendered UI and structured data.
- Time is always injected. No `new Date()` in production code paths
  that affect chart, replay, or alerts.

## Lock-forward leak tests (replay)

The replay engine has a dedicated test suite that verifies no future
data leaks to the client through any code path:

- API responses
- WebSocket frames
- Indicator outputs
- AI feature inputs

These tests are run against historical data with known answers.

## Financial display tests

A small suite of tests guards how prices and P&L are formatted:

- Tabular figures
- Decimal precision per asset class
- Negative-number formatting
- Locale separators
- Zero handling

A regression here is a brand-damaging bug.

## CI

- Lint, type-check, unit, integration on every PR.
- E2E on PRs touching `apps/web`, `apps/api`, or shared packages.
- AI eval on PRs touching `packages/ai-prompts`.
- Visual regression on PRs touching `packages/ui` or chart code.
- Required checks before merge: lint, type-check, unit, integration.

## Coverage

We track coverage but do not gate on a single global number. Per-package
coverage targets are declared in each package's README. The pattern
engine, replay engine, market data layer, and trading rules engine
target ≥ 90% for core logic.

## Manual QA

Each phase has a manual QA checklist in `docs/working-rules.md` that the
QA lead runs before declaring the phase done.
