# @topgun/charting

> **Phase 1 scaffold.** Real charting wraps arrive in Phase 3.

A thin abstraction over Lightweight Charts and (where appropriate)
TradingView widgets. Apps never import a chart library directly. They
import from `@topgun/charting`. This lets us swap or extend chart
backends without rewriting consumers.

## Phase 3 deliverables

- `Chart` component contract
- Lightweight Charts implementation
- Indicator and overlay registration API
- Drawing tool API
- Pattern hit overlay (consumed from `packages/trading-rules`)

## Owner

Frontend Lead + Architect.
