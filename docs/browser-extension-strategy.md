# Browser Extension Strategy

The TopGun Trading Chrome extension is a **context bridge**, not a scraper.
Its job is to make the trader's existing browser sessions more useful to the
TopGun workspace, with the user's explicit permission.

## Goals

1. Capture context from pages the user is already viewing (news articles,
   filings, research notes, charts on third-party sites).
2. Provide a quick capture surface for journal entries and screenshots.
3. Detect tickers in the active tab and offer one-click "open in TopGun".
4. Bridge the active workspace state into and out of the browser.

## Non-goals

- The extension is not a way to bypass broker terms of service.
- The extension does not store or transmit broker credentials.
- The extension does not scrape private session data from broker pages as
  the primary architecture for live data.
- The extension is not a content blocker, ad injector, or affiliate
  rewriter.

## Architecture

- Manifest V3
- Service worker (background)
- Content scripts injected only on user-allowed origins
- Popup UI built with React + Tailwind from `@topgun/ui`
- Optional side panel (Chrome 114+) for the workspace bridge
- All network calls go through `apps/api`. The extension never talks to
  third-party providers directly.

## Permissions philosophy

- Request the **least** permissions necessary.
- `host_permissions` is opt-in per origin where possible.
- Every capability has a clear, plain-language explanation in the popup.
- The user can revoke per-origin permission at any time from the extension
  options page.

## Core flows (MVP)

1. **Quick capture.** User hits the keyboard shortcut. Popup shows: current
   URL, page title, detected tickers, and a text area. One click sends a
   journal entry to the API.
2. **Ticker detection.** Content script scans the active tab for $TICKER
   patterns and known tickers from the user's watchlists. A subtle badge
   appears on detected tickers; click opens the TopGun chart workspace.
3. **Workspace bridge.** When the user is on `app.topguntrading.com`, the
   extension can pre-fill quick captures with the active symbol and
   timeframe.

## Security

- Content scripts run in isolated worlds.
- All messages between content script, service worker, and API are
  schema-validated with shared zod schemas from `@topgun/types`.
- The extension stores only short-lived tokens. Refresh is handled by the
  API.
- See [`docs/security.md`](security.md).

## Update strategy

- Versioned releases via the Chrome Web Store.
- A version-pinning header on every API call lets the API serve a polite
  upgrade prompt to outdated extensions.

## Phase plan

- Phase 1: scaffolding only (this phase).
- Phase 5: MVP capture, ticker detection, workspace bridge.
- Phase 6+: alerts mirrored into the extension, side panel polish.

## Open decisions

Tracked in [`docs/decisions.md`](decisions.md):

- Whether to ship a Firefox build alongside Chrome
- Whether to support a hosted "extensionless" capture link as a fallback
