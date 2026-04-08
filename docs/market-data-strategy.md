# Market Data Strategy

## Goals

1. Provider-agnostic. We never bind the product to a single vendor.
2. Normalized schema. Symbols, candles, quotes, and trades have one shape
   inside the platform regardless of source.
3. Compliant. Every provider's redistribution and display rules are honored.
4. Tiered. Free / delayed data first, paid / realtime later, all behind the
   same interface.

## Layered design

```
+--------------------------------------------+
|            apps/web, extension             |
+----------------------+---------------------+
                       |
                       v
+--------------------------------------------+
|              apps/api gateway              |
|   auth, entitlements, rate-limiting,       |
|   normalization, attribution               |
+----------------------+---------------------+
                       |
                       v
+--------------------------------------------+
|        packages/market-data adapters       |
|   IMarketDataAdapter contract              |
|   one implementation per provider          |
+----------------------+---------------------+
                       |
                       v
       (Polygon, Alpaca, Tiingo, Finnhub,
        Coinbase, Binance, etc — provider TBD)
```

## Adapter contract (sketch)

```ts
interface IMarketDataAdapter {
  readonly id: string;
  readonly capabilities: AdapterCapabilities;

  searchSymbols(query: string): Promise<SymbolMeta[]>;
  getSymbol(symbol: string): Promise<SymbolMeta>;

  getCandles(req: CandleRequest): Promise<Candle[]>;
  streamQuotes(symbols: string[], handler: QuoteHandler): Subscription;
  streamTrades?(symbols: string[], handler: TradeHandler): Subscription;

  getAttribution(): AttributionInfo;
}
```

`AdapterCapabilities` declares which intervals, asset classes, and stream
types are supported. The API gateway uses this to route requests and to
hide unsupported features in the UI.

## Equities path

- Start with delayed equities for free-tier coverage.
- Add a real-time provider behind a paid entitlement.
- Honor each provider's attribution requirements (e.g. "Data provided by …").

## Crypto path

- Crypto exchanges expose public WebSocket feeds with permissive terms.
- Start with one major exchange and expand.
- Crypto and equities share the same normalized schema; the UI does not
  branch on asset class.

## "Buys/sells flow" feature

The product mentions buys/sells flow visibility "where supported by
authorized data sources." Concretely:

- We will only display level-2-style or trade-tape views when an authorized
  provider supplies the data and licensing allows display.
- We will not scrape private broker internals as a primary feed.
- The UI must clearly indicate provider, delay, and any sampling.

## Caching and storage

- Hot quotes: Redis with short TTL.
- Recent candles: Redis sorted sets per symbol+interval.
- Historical candles: PostgreSQL with partitioning by symbol+interval.
- Replay snapshots: built by `apps/worker` and stored alongside historical
  candles.

## Rate limiting and quotas

- Per-user quotas in the API gateway.
- Per-provider quotas inside each adapter.
- Backoff and circuit-breaker patterns are mandatory in adapter code.

## Failure modes

- A provider outage must not crash the app shell. The UI must surface a
  clear "data delayed" or "data unavailable" state.
- Replay must continue to function on cached historical data even when live
  feeds are degraded.

## Open decisions

Tracked in [`docs/decisions.md`](decisions.md):

- Which equities provider for Phase 3?
- Which crypto exchanges to ship first?
- Whether to support futures in Phase 3 or defer to Phase 6+.
