/**
 * TopGun Trading — @topgun/market-data
 *
 * Provider-agnostic market data adapter layer. Consumers import the
 * IMarketDataAdapter interface and the AdapterRegistry factory.
 * Vendor-specific code stays behind this boundary.
 */
export type {
  IMarketDataAdapter,
  Subscription,
  QuoteHandler,
} from "./contract";
export { MarketDataError } from "./errors";

export { MockAdapter } from "./mock/mock.adapter";
export { CoinbaseAdapter } from "./coinbase/coinbase.adapter";
export {
  COINBASE_PROVIDER_ID,
  COINBASE_GRANULARITY,
  COINBASE_CANDLE_LIMIT,
} from "./coinbase/mapping";
export { KrakenAdapter, type KrakenAdapterOptions } from "./kraken/kraken.adapter";
export {
  KRAKEN_PROVIDER_ID,
  KRAKEN_INTERVAL_MINUTES,
  KRAKEN_OHLC_LIMIT,
} from "./kraken/mapping";

export { AdapterRegistry, type AdapterId, type AdapterRegistryOptions } from "./registry";

export const PACKAGE_NAME = "@topgun/market-data" as const;
