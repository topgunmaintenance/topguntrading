# Product

## What TopGun Trading is

TopGun Trading is a premium, dark-themed trading workspace built around five
pillars:

1. **Observe** — live market monitoring, watchlists, and chart workspaces.
2. **Practice** — historical replay and simulator workflows.
3. **Record** — structured journaling tied to charts and trades.
4. **Review** — AI-assisted post-trade analysis and pattern study.
5. **Discipline** — rule engine and pre-trade checklists.

It runs as a web application with a companion Chrome extension. A backend API
handles persistence, market data adapters, AI orchestration, and realtime
streams.

## What TopGun Trading is not

- It is **not** a broker. It does not place orders.
- It is **not** an auto-trader or signal service.
- It does **not** sell certainty, guaranteed returns, or "AI that prints money."
- It does **not** scrape private broker internals as its primary data path.
- It is **not** a social trading feed or copy-trading platform.

## Core modules

| # | Module | Description | Phase target |
|---|--------|-------------|--------------|
| 1 | Marketing site | Landing, pricing, docs | 2 |
| 2 | App shell | Authenticated dashboard, navigation, workspace | 2 |
| 3 | Auth & profiles | Email + OAuth, sessions, user settings | 2 |
| 4 | Market data layer | Provider-agnostic adapters, normalized schema | 3 |
| 5 | Watchlists | Live quote streaming, custom lists | 3 |
| 6 | Chart workspace | Multi-pane charts, indicators, drawing tools | 3 |
| 7 | Journal | Trade and idea entries with attachments | 4 |
| 8 | Replay engine | Time-shifted historical playback | 4 |
| 9 | Pattern engine | Detect and label common formations | 5 |
| 10 | AI copilot | Trade review, journal Q&A, pattern explainers | 5 |
| 11 | Browser extension | Context capture, ticker bridge, quick capture | 5 |
| 12 | Alerts | Price, pattern, and rule-based alerts | 6 |
| 13 | Workspace settings | Preferences, layouts, themes | 2 |
| 14 | Admin & observability | Internal dashboards, metrics, logs | 6 |
| 15 | Billing | Subscriptions and entitlements | 7 |

See [`docs/roadmap.md`](roadmap.md) for the phase plan.

## User personas

### "Evaluation Eli"
Working through a funded-account evaluation. Needs strict rules, hard daily
loss caps, and a clean journal he can show.

### "Returning Rina"
Day trader who took a year off. Needs replay practice and pattern refresh
before going live again.

### "Swing Sam"
Multi-week swing trader. Wants a calm workspace, watchlists, and end-of-day
review with AI commentary.

### "Crypto Casey"
Crypto-native who also dabbles in equities. Needs unified watchlists and
24/7 alerting.

## Differentiators

- **Replay that is actually usable.** Most platforms bury replay. We make it
  a primary workflow.
- **Journal that pulls in chart context.** Entries can be linked to bars,
  candles, ranges, and screenshots automatically.
- **Rule engine.** Personal trading rules become enforceable checklists with
  audit history.
- **Honest AI.** AI features are bounded, traceable, and never frame
  predictions as certainty.
- **Provider-agnostic.** Market data, charts, and AI providers are
  abstracted behind packages.

## Out of scope (for now)

- Order routing
- Tax reporting
- Portfolio accounting beyond what is needed for journaling
- Mobile-first apps (web is responsive; a native app may come later)
