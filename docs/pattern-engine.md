# Pattern Engine

The pattern engine detects, labels, and explains chart patterns. It is
designed to be **small, accurate, and explainable**, not a kitchen-sink
indicator dump.

## Goals

1. Ship a small set of well-tested patterns first.
2. Every detection is explainable: the engine returns the geometry it
   used so the UI can draw the construction lines.
3. Detections are deterministic for a given input range.
4. Detections can run in three modes: live, replay, and historical.
5. Pattern catalog can grow without breaking older detections.

## Initial pattern set (Phase 5)

- Trend break (uptrend / downtrend line break)
- Higher highs / higher lows shift
- Lower highs / lower lows shift
- Range break (consolidation breakout)
- Pullback to moving average
- Inside bar / outside bar
- Engulfing candle
- Pin bar / rejection candle

That is the entire Phase 5 catalog. We resist adding more until each is
proven.

## Detection contract

```ts
interface PatternHit {
  id: string;
  patternId: string;       // catalog id, semver
  symbol: string;
  timeframe: string;
  startBar: number;
  endBar: number;
  confidence: number;      // 0..1, calibration documented per pattern
  geometry: GeometryShape[];
  explanation: ExplanationToken[];
}
```

`geometry` is renderable by `@topgun/charting` so the UI can draw the
exact construction lines that produced the detection. `explanation` is
consumed by the AI pattern explainer to produce plain-language summaries.

## Catalog

Each pattern lives in `packages/trading-rules/patterns/<pattern-id>` with:

- `detector.ts` — pure function, no IO
- `geometry.ts` — what to draw
- `explain.ts` — explanation tokens
- `cases/*.json` — golden test cases (input bars + expected hits)
- `README.md` — definition, parameters, calibration notes, references

## Calibration

- Confidence scores are calibrated against golden cases.
- A confidence above 0.8 should mean the pattern is unambiguous.
- The UI must surface confidence honestly. We do not round 0.61 up to
  "high confidence."

## Run modes

- **Live** — runs as new bars close, server-side, scoped per user
  watchlist.
- **Replay** — runs against the lock-forward stream from the replay
  engine. Future bars are not visible.
- **Historical** — runs over a saved range for study.

## Performance

- Detectors operate on rolling windows; full-history rescans are
  reserved for explicit historical study.
- Each detector declares its required window size and complexity.
- The worker batches detections by symbol+interval to amortize cost.

## False positives are a feature

We prefer to under-detect than over-detect. A pattern shown to the user
implies "this is real enough to discuss." Noisy detections destroy trust.

## Open decisions

Tracked in [`docs/decisions.md`](decisions.md):

- Whether to expose a pattern playground for users to draft their own
- How to handle detection on partial (forming) bars
