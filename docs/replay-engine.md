# Replay Engine

The replay engine lets a user load a historical range for a symbol and
play it back as if it were live. It is one of the few features that
fundamentally separates a real practice tool from a charting toy.

## Goals

1. Bar-accurate playback for any supported interval.
2. Sub-second scrub and step.
3. "Lock-forward" mode: only show data up to the cursor, never the future.
4. Replay-aware journaling: entries during replay are tagged with the
   replay cursor.
5. Multi-instrument replay synchronized on a single clock (later phase).

## Concepts

- **Replay session** — a saved configuration: symbol, range, base
  interval, current cursor, speed, scrubbing history.
- **Replay clock** — a virtual clock that advances at a chosen speed.
  All chart panes and the journal subscribe to the same clock.
- **Lock-forward** — the chart, indicators, and any AI feature only
  receive data up to the clock. Future data is invisible. This is
  enforced server-side, not client-side.
- **Snapshot** — a precomputed state of indicators and aggregates at a
  given cursor, used to make scrubbing fast.

## Data flow

```
user input  --->  replay client (apps/web)
                       |
                       v
              replay session WS channel  --->  apps/api
                                                   |
                                                   v
                                         replay session service
                                                   |
                                                   v
                                            historical store
                                                   |
                                                   v
                                            snapshot builder
                                            (apps/worker)
```

Replay frames are pushed over a dedicated WebSocket channel scoped to
the session. The channel guarantees ordering and supports rewind.

## Lock-forward enforcement

Client cannot see future data. Period.

- The API only emits frames at or before the current cursor.
- Indicators that depend on future bars (e.g. naive ATR over a window
  that crosses the cursor) are computed server-side from past data only.
- AI features executed inside a replay session receive a context object
  that hard-clips inputs to the cursor.

## Performance

- Snapshots are precomputed at coarse intervals (e.g. every 1000 bars
  for 1m, every 100 bars for 1h) to avoid replaying from the beginning
  on every scrub.
- The client maintains a small ring buffer for smooth scrubbing in
  either direction.
- Replay sessions are cancelable and reclaim server resources within
  seconds of disconnect.

## Replay-aware journaling

- Journal entries created during a replay are tagged `mode: replay` and
  carry the replay cursor and replay session id.
- Trade logs created during a replay are flagged `simulated: true` and
  cannot contaminate live trade analytics.

## Open decisions

Tracked in [`docs/decisions.md`](decisions.md):

- Storage format for snapshots (Parquet vs. Postgres rows)
- Maximum replay range per tier
- Whether to support multi-symbol synchronized replay in Phase 4 or 5
