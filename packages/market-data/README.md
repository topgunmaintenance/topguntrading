# @topgun/market-data

> **Phase 1 scaffold.** Real adapters arrive in Phase 3.

The provider-agnostic market data layer. Defines the
`IMarketDataAdapter` contract, the normalized schema (symbols, candles,
quotes, trades), and one adapter per provider.

Strategy lives in `docs/market-data-strategy.md`.

## Phase 3 deliverables

- `IMarketDataAdapter` contract (final)
- `MockAdapter` for tests and dev
- One real provider adapter (provider TBD per ADR-0009)
- Normalized schemas in `@topgun/types`
- Backoff and circuit-breaker helpers

## Owner

Data Engineer — see `agents/data-engineer.md`.
