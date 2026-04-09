/**
 * TopGun Trading — @topgun/market-data
 *
 * Provider-agnostic market data adapter layer. Consumers import the
 * IMarketDataAdapter interface and the AdapterRegistry factory.
 * Vendor-specific code stays behind this boundary.
 */
export type { IMarketDataAdapter, Subscription, QuoteHandler, } from "./contract";
export { MarketDataError } from "./errors";
export { MockAdapter } from "./mock/mock.adapter";
export { CoinbaseAdapter } from "./coinbase/coinbase.adapter";
export { COINBASE_PROVIDER_ID, COINBASE_GRANULARITY, COINBASE_CANDLE_LIMIT, } from "./coinbase/mapping";
export { AdapterRegistry, type AdapterId, type AdapterRegistryOptions } from "./registry";
export declare const PACKAGE_NAME: "@topgun/market-data";
//# sourceMappingURL=index.d.ts.map