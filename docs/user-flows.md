# User Flows

These are the canonical flows the product is designed around. They drive
information architecture, navigation, and acceptance testing. Each flow is
phase-tagged.

## 1. First-run (Phase 2)

1. Land on marketing site
2. Sign up (email + password, OAuth optional)
3. Verify email
4. First-run tour: workspace overview, disclaimers, "this is not advice"
5. Pick starter watchlist
6. Land in dashboard

## 2. Add to watchlist (Phase 3)

1. Open command palette (`Cmd+K`)
2. Type ticker
3. Select symbol
4. "Add to watchlist" → choose list
5. Symbol streams immediately in the active workspace

## 3. Open chart workspace (Phase 3)

1. Click symbol in watchlist
2. Chart workspace opens with default timeframe
3. Floating toolbar exposes timeframe, indicators, drawing tools
4. State persists per user per symbol

## 4. Create a journal entry (Phase 4)

1. From any chart, hit `J`
2. Journal drawer opens, pre-filled with symbol, timeframe, current bar
3. User writes; can attach screenshot of current chart range
4. Save → entry appears in journal index, linked to chart context

## 5. Log a trade (Phase 4)

1. From journal index or chart, "Log trade"
2. Form: side, entry price, exit price, size, fees, tags
3. Optional: link to a journal entry, link to a rule check
4. Save → trade appears in trade list, P&L computed

## 6. Replay a session (Phase 4)

1. Replay tab → pick symbol and date range
2. Workspace switches to "Replay mode" (visual indicator on the chrome)
3. Scrub, step, lock-forward, set speed
4. Journal entries created during replay are tagged as replay entries

## 7. Run a pre-trade rule check (Phase 5)

1. Before logging an intended trade, user opens "Plan trade"
2. Rule engine evaluates active rules against the plan
3. UI shows pass / warn / block per rule
4. User can override warns with a written reason; blocks cannot be
   overridden silently

## 8. Get AI trade review (Phase 5)

1. From a closed trade, click "Review with AI"
2. Trade context, linked plan, linked rules, and chart range are bundled
3. AI returns a structured review: what worked, what did not, rule
   adherence, suggested journal questions
4. Output is saved as part of the trade record with prompt version
   metadata

## 9. Capture from the browser extension (Phase 5)

1. User on a news article hits the keyboard shortcut
2. Extension popup shows page title, URL, detected tickers, text area
3. User picks tickers, writes a note, hits Save
4. Entry lands in their journal with provenance

## 10. Get an alert (Phase 6)

1. From a chart, "Create alert" → condition builder
2. Alert is stored server-side and evaluated by `apps/worker`
3. When triggered, notification reaches the user via in-app, extension,
   and/or email per their settings

## 11. Daily review (Phase 6)

1. End of day, "Run daily review"
2. AI summarizes the day's journal, trades, rule outcomes, and active
   alerts
3. User can edit and save the summary as a journal entry

## 12. Subscribe (Phase 7)

1. From any gated feature, "Upgrade"
2. Plan picker, billing, confirmation
3. Entitlements update immediately

---

Each flow has acceptance tests that live with the relevant app or package,
described in [`docs/testing-strategy.md`](testing-strategy.md).
