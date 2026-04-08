# @topgun/market-data

Provider-agnostic market data adapter layer.

Consumers import `IMarketDataAdapter`, the `AdapterRegistry`, or one of
the concrete adapter classes. Vendor-specific code lives behind the
contract and can be swapped out without touching the API, web, or
worker layers.

## Contract

```ts
interface IMarketDataAdapter {
  readonly id: string;
  readonly capabilities: AdapterCapabilities;
  readonly attribution: AttributionInfo;

  searchSymbols(query: string, limit?: number): Promise<SymbolMeta[]>;
  getSymbol(symbol: string): Promise<SymbolMeta | null>;
  listSupportedSymbols(limit?: number): Promise<SymbolMeta[]>;

  getCandles(request: CandleRequest): Promise<Candle[]>;
  streamQuotes(symbols: string[], handler: QuoteHandler): Subscription;

  dispose(): Promise<void>;
}
```

## Adapters (Phase 3)

### `CoinbaseAdapter`

Unauthenticated public Coinbase Exchange endpoints only:

- `GET /products` and `GET /products/{id}` for symbol metadata
- `GET /products/{id}/candles` for historical candles
- `wss://advanced-trade-ws.coinbase.com` `ticker` channel for live
  quotes

The adapter:

- never stores API keys
- never uses authenticated Coinbase endpoints
- never touches broker session data
- renders attribution via `attribution.label = "Data provided by Coinbase"`
- reconnects with exponential backoff and jitter up to 30s
- multiplexes subscriptions onto a single upstream WebSocket

### `MockAdapter`

Deterministic synthetic feed used for tests, local dev, and UI
scaffolding. Clearly marked `attribution.simulated = true`. The web
app renders a prominent warning banner whenever the mock is active.

## Usage

```ts
import { AdapterRegistry } from "@topgun/market-data";

const registry = new AdapterRegistry();
const adapter = registry.get("coinbase"); // or "mock"

const symbols = await adapter.searchSymbols("btc", 10);
const candles = await adapter.getCandles({
  symbol: "coinbase:BTC-USD",
  interval: "1h",
  limit: 100,
});

const sub = adapter.streamQuotes(["coinbase:BTC-USD"], (quote) => {
  console.log(quote.symbol, quote.last);
});

// later
await sub.close();
await registry.disposeAll();
```

## What this package is not

- Not a trading API
- Not a broker integration
- Not a scraper for private broker internals
- Not a signal generator

## Owner

Data Engineer — see `agents/data-engineer.md`.
