# @topgun/charting

Thin client-only abstraction over [lightweight-charts](https://tradingview.github.io/lightweight-charts/).

Every surface in the product that renders a price chart imports from
this package. Nothing else in the repo imports `lightweight-charts`
directly, so swapping chart backends later is a single-package change.

## Exports

- `Chart` — React component. Candlestick chart with live-quote support.
  Dark theme matches `docs/design-system.md`.
- `TIMEFRAME_OPTIONS` — canonical ordered list of intervals used by
  timeframe pickers.
- `intervalSeconds(interval)` — helper.

## Usage

The component is `"use client"`. `lightweight-charts` touches `window`
at module load, so the web app wraps it in `dynamic(..., { ssr: false })`.

```tsx
"use client";
import dynamic from "next/dynamic";
import type { Candle, Quote } from "@topgun/types";

const Chart = dynamic(
  () => import("@topgun/charting").then((m) => m.Chart),
  { ssr: false },
);

export function MyWorkspace({
  candles,
  liveQuote,
}: {
  candles: Candle[];
  liveQuote: Quote | null;
}) {
  return (
    <Chart
      candles={candles}
      symbol="coinbase:BTC-USD"
      interval="1h"
      liveQuote={liveQuote}
      height={520}
    />
  );
}
```

## Owner

Frontend Lead + Architect.
